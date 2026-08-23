const express = require('express');
const cors    = require('cors');
const multer  = require('multer');
const path    = require('path');
const fs      = require('fs').promises;
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

const { clerkMiddleware, requireAuth } = require('./middleware/authMiddleware');
const { initRedis }                    = require('./utils/redisClient');
const { checkRateLimit }               = require('./utils/rateLimiter');
const {
  computeCacheKey,
  getCachedResult,
  getCacheStats,
  resetCacheStats,
} = require('./utils/cacheService');
const { resumeQueue } = require('./utils/queue');
const { Job } = require('bullmq');
const metrics  = require('./utils/metrics');

const app = express();

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(clerkMiddleware({ publishableKey: process.env.CLERK_PUBLISHABLE_KEY }));

// ── API latency middleware (records time-to-response for /api/analyze) ────────
app.use((req, res, next) => {
  if (req.method === 'POST' && req.path === '/api/analyze') {
    const start = Date.now();
    res.on('finish', () => metrics.record('api_latency', Date.now() - start));
  }
  next();
});

// ─── Config ───────────────────────────────────────────────────────────────────
const UPLOAD_FOLDER      = 'uploads';
const ALLOWED_EXTENSIONS = ['pdf', 'docx', 'doc'];
const MAX_FILE_SIZE      = 10 * 1024 * 1024; // 10 MB

// Create upload folder if needed
fs.mkdir(UPLOAD_FOLDER, { recursive: true }).catch(() => {});

// ─── Multer ───────────────────────────────────────────────────────────────────
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_FOLDER),
  filename:    (_req, file,  cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}-${file.originalname}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase().slice(1);
    ALLOWED_EXTENSIONS.includes(ext)
      ? cb(null, true)
      : cb(new Error('Invalid file type. Only PDF and DOCX are allowed'));
  },
});

// ─── Helper — delete file with retry ─────────────────────────────────────────
const deleteFileWithRetry = async (filePath, retries = 3) => {
  for (let i = 0; i < retries; i++) {
    try {
      await new Promise(r => setTimeout(r, 100 * i));
      await fs.unlink(filePath);
      return;
    } catch {
      if (i === retries - 1)
        console.warn(`Warning: Could not delete temporary file ${filePath}`);
    }
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// ROUTES
// ═══════════════════════════════════════════════════════════════════════════════

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({ status: 'healthy', message: 'CVlyze API is running' });
});

// ── Config check ──────────────────────────────────────────────────────────────
app.get('/api/config/check', (_req, res) => {
  const hasApiKey = !!(process.env.GEMINI_API_KEY?.trim());
  res.json({
    configured: hasApiKey,
    message: hasApiKey ? 'Gemini API key is configured' : 'Gemini API key is missing',
  });
});

// ── POST /api/analyze ─────────────────────────────────────────────────────────
/**
 * Accepts the resume upload, checks Redis cache, and either:
 *   A) Returns the cached result immediately (200 + cached:true), or
 *   B) Enqueues a BullMQ job and returns 202 Accepted with { jobId }.
 *
 * The caller should then poll GET /api/jobs/:jobId until status === 'completed'.
 */
app.post('/api/analyze', requireAuth, upload.single('resume'), async (req, res) => {
  let filePath = null;

  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No resume file provided' });
    }

    filePath = req.file.path;
    const fileType       = path.extname(req.file.originalname).toLowerCase().slice(1);
    const jobDescription = req.body.jobDescription || null;
    const userId         = req.auth?.userId || 'anonymous';
    const resumeTitle    = path.parse(req.file.originalname).name || 'Untitled Resume';

    // ── Rate limiting (10 analyses / 60 s per user) ──────────────────────────
    // Cache hits are free — we only count requests that reach Gemini.
    // We check the limit here (before the cache) so the counter only increments
    // when we know the file was actually uploaded and we're about to process it.
    const rateCheck = await checkRateLimit(userId, 10, 60);
    if (!rateCheck.allowed) {
      await deleteFileWithRetry(filePath);
      res.set('Retry-After', String(rateCheck.ttl));
      return res.status(429).json({
        success: false,
        error:   `Rate limit exceeded. You can run up to ${rateCheck.limit} analyses per minute. Try again in ${rateCheck.ttl}s.`,
        retryAfterSeconds: rateCheck.ttl,
      });
    }

    // ── Redis cache check ────────────────────────────────────────────────────
    const fileBuffer = await fs.readFile(filePath);
    const cacheKey   = computeCacheKey(fileBuffer, jobDescription);

    const cachedResult = await getCachedResult(cacheKey);
    if (cachedResult) {
      // Serve from cache — skip queue entirely
      await deleteFileWithRetry(filePath);
      return res.json({ success: true, data: cachedResult, cached: true });
    }

    // ── Enqueue BullMQ job ────────────────────────────────────────────────────
    // We store the *file path* in the job data (not the raw buffer).
    // The worker reads the file from disk; after the worker runs it deletes it.
    // In production you would upload the file to S3/Cloudinary first and store
    // the URL here instead of a local path.
    const job = await resumeQueue.add(
      'analyze-resume',               // job name (for UI / filtering)
      {
        filePath,                     // local path — worker will read + delete
        fileType,
        jobDescription,
        userId,
        cacheKey,
        resumeTitle,
      },
      {
        jobId: uuidv4(),              // deterministic so we can look it up
      }
    );

    console.log(`📬 Job ${job.id} enqueued for user ${userId} — file: ${req.file.originalname}`);

    // ── 202 Accepted ─────────────────────────────────────────────────────────
    return res.status(202).json({
      success: true,
      message: 'Resume analysis started. Poll the status endpoint for results.',
      jobId:   job.id,
      pollUrl: `/api/jobs/${job.id}`,
    });

  } catch (error) {
    console.error('Error enqueuing analysis job:', error);
    if (filePath) await deleteFileWithRetry(filePath);
    return res.status(500).json({ success: false, error: error.message || 'Failed to start analysis' });
  }
});

// ── GET /api/jobs/:jobId ──────────────────────────────────────────────────────
/**
 * Poll this endpoint after POST /api/analyze returns 202.
 *
 * Response shape:
 *   { success, jobId, status, progress, data?, error?, processingMs? }
 *
 * status can be:
 *   'waiting'    — queued, not yet picked up
 *   'active'     — worker is currently processing
 *   'completed'  — finished; `data` contains the full analysis result
 *   'failed'     — processing failed; `error` contains the reason
 *   'delayed'    — waiting for a retry backoff
 *   'unknown'    — job not found
 */
app.get('/api/jobs/:jobId', requireAuth, async (req, res) => {
  try {
    const { jobId } = req.params;

    // BullMQ's Job.fromId() takes the Queue instance as the first argument
    const job = await Job.fromId(resumeQueue, jobId);

    if (!job) {
      return res.status(404).json({
        success: false,
        jobId,
        status: 'unknown',
        message: 'Job not found. It may have expired or never existed.',
      });
    }

    const state    = await job.getState();   // 'waiting' | 'active' | 'completed' | 'failed' | 'delayed'
    const raw      = job.progress;

    // progress can be a number (legacy) or our { pct, stage } object
    const progress = (typeof raw === 'object' && raw !== null) ? raw.pct  : (raw ?? 0);
    const stage    = (typeof raw === 'object' && raw !== null) ? raw.stage : null;

    const response = {
      success:  true,
      jobId,
      status:   state,
      progress,
      stage,    // e.g. 'connecting' | 'parsing' | 'analyzing' | 'saving' | 'caching' | 'completed'
    };

    if (state === 'completed') {
      response.data    = job.returnvalue;
      response.cached  = false;
    }

    if (state === 'failed') {
      response.error = job.failedReason;
    }

    return res.json(response);

  } catch (err) {
    console.error('Error fetching job status:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// ── POST /api/role-details ────────────────────────────────────────────────────
const aiAnalyzer = require('./utils/aiAnalyzer');

app.post('/api/role-details', requireAuth, async (req, res) => {
  try {
    const { roleName, userSkills, matchedSkills, missingSkills } = req.body;

    if (!roleName) {
      return res.status(400).json({ success: false, error: 'Role name is required' });
    }

    console.log(`📊 Generating role details for: ${roleName}`);
    const roleDetails = await aiAnalyzer.generateRoleDetails(
      roleName,
      userSkills    || [],
      matchedSkills || [],
      missingSkills || []
    );
    res.json(roleDetails);

  } catch (error) {
    console.error('Error fetching role details:', error);
    res.status(500).json({ success: false, error: error.message || 'Failed to generate role details' });
  }
});

// ── Cache stats ───────────────────────────────────────────────────────────────
app.get('/api/cache/stats', async (_req, res) => {
  try {
    const stats = await getCacheStats();
    res.json({ success: true, stats });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.delete('/api/cache/stats', async (_req, res) => {
  try {
    await resetCacheStats();
    res.json({ success: true, message: 'Cache statistics reset to zero' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── Queue stats (bonus — handy for monitoring) ────────────────────────────────
/**
 * GET /api/queue/stats
 * Returns a snapshot of the BullMQ queue depth.
 */
app.get('/api/queue/stats', async (_req, res) => {
  try {
    const [waiting, active, completed, failed, delayed] = await Promise.all([
      resumeQueue.getWaitingCount(),
      resumeQueue.getActiveCount(),
      resumeQueue.getCompletedCount(),
      resumeQueue.getFailedCount(),
      resumeQueue.getDelayedCount(),
    ]);
    res.json({ success: true, queue: { waiting, active, completed, failed, delayed } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── GET /api/metrics ──────────────────────────────────────────────────────────
/**
 * Returns all observability metrics:
 *   - api_latency, queue_wait_ms, worker_total_ms
 *   - gemini_total_ms, gemini_call1_ms, gemini_call2_ms
 *   - mongo_save_ms, parse_ms
 *   - jobs_completed, jobs_failed, jobs_retried
 *   - cache hit rate
 *
 * Each latency metric includes avg, p50, p95, min, max, count.
 */
app.get('/api/metrics', async (_req, res) => {
  try {
    const summary = await metrics.getSummary();
    const { formatSummary } = require('./utils/metrics');

    // Build human-readable strings alongside the raw numbers
    const human = {};
    for (const [key, val] of Object.entries(summary.latencies)) {
      human[key] = formatSummary(val);
    }

    res.json({
      success: true,
      metrics: summary,
      human,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/metrics — reset all counters and latency samples to zero
app.delete('/api/metrics', async (_req, res) => {
  try {
    await metrics.resetAll();
    res.json({ success: true, message: 'All metrics reset to zero' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── Error handling middleware ────────────────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error('Server error:', err);
  res.status(500).json({ success: false, error: err.message || 'Internal server error' });
});

// ─── Start server ─────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

initRedis().then(() => {
  app.listen(PORT, () => {
    console.log(`\n🚀 CVlyze API server running on http://localhost:${PORT}`);
    console.log(`📁 Upload folder  : ${UPLOAD_FOLDER}`);
    console.log(`🔑 Gemini API     : ${!!(process.env.GEMINI_API_KEY?.trim()) ? '✅ configured' : '❌ missing'}`);
    console.log(`🗄️  Redis URL      : ${process.env.REDIS_URL || 'redis://localhost:6379'}`);
    console.log(`📬 BullMQ Queue   : resume-analysis`);

    // ─── In-process worker (for single-dyno / free-tier deployments) ───────────
    // Set RUN_WORKER=true in your deployment env vars (e.g. Render) to run the
    // BullMQ worker inside this same process instead of as a separate service.
    // Locally, leave RUN_WORKER unset and run `npm run worker` in a second terminal.
    if (process.env.RUN_WORKER === 'true') {
      require('./workers/resumeWorker');
      console.log(`🔧 In-process worker started (RUN_WORKER=true)\n`);
    } else {
      console.log(`\n💡 Start a worker with:  npm run worker\n`);
    }
  });
});

module.exports = app;
