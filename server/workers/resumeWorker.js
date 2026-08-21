/**
 * resumeWorker.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Standalone BullMQ worker process.
 *
 * Start separately from the API server:
 *   node workers/resumeWorker.js
 *   # or via npm script:
 *   npm run worker
 *
 * Architecture:
 *
 *   API Server  →  Redis Queue (BullMQ)  →  THIS WORKER
 *                                               │
 *                                               ├─ Parse PDF / DOCX
 *                                               ├─ Gemini AI analysis
 *                                               ├─ Store result in MongoDB
 *                                               └─ Cache result in Redis
 *
 * The worker is a *separate Node process* so the API server never blocks
 * waiting for Gemini (which can take ~50 s).  You can run 1 API server
 * and N workers independently:
 *
 *   node workers/resumeWorker.js   # process 1
 *   node workers/resumeWorker.js   # process 2
 *   node workers/resumeWorker.js   # process 3
 * ─────────────────────────────────────────────────────────────────────────────
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const path     = require('path');
const fs       = require('fs').promises;
const { Worker } = require('bullmq');
const mongoose   = require('mongoose');
const Redis      = require('ioredis');

const resumeParser = require('../utils/resumeParserEnhanced');
const aiAnalyzer   = require('../utils/aiAnalyzer');
const { setCachedResult } = require('../utils/cacheService');
const { QUEUE_NAME, redisConnection } = require('../utils/queue');
const metrics      = require('../utils/metrics');

// ─── Pre-flight Redis check ───────────────────────────────────────────────────
const checkRedisConnection = async () => {
  const testClient = new Redis({ ...redisConnection, lazyConnect: true, maxRetriesPerRequest: 1 });
  try {
    await testClient.connect();
    await testClient.ping();
    console.log('✅  Redis connection verified');
  } catch (err) {
    console.error('❌  Cannot connect to Redis at', process.env.REDIS_URL || 'redis://localhost:6379');
    console.error('   Start Redis before running the worker (e.g. docker run -d -p 6379:6379 redis:alpine)');
    process.exit(1);
  } finally {
    testClient.disconnect();
  }
};

// ─── MongoDB setup ────────────────────────────────────────────────────────────
const connectMongo = async () => {
  if (mongoose.connection.readyState !== 0) return; // already connected / connecting
  await mongoose.connect(process.env.MONGO_URI, {
    serverSelectionTimeoutMS: 10_000,
  });
  console.log('🍃 Worker connected to MongoDB');
};

// ─── Mongoose schema for analysis results ────────────────────────────────────
const analysisSchema = new mongoose.Schema(
  {
    jobId:          { type: String, required: true, index: true, unique: true },
    userId:         { type: String, index: true },
    cacheKey:       { type: String, index: true },
    status:         { type: String, enum: ['pending', 'processing', 'completed', 'failed'], default: 'pending' },
    result:         { type: mongoose.Schema.Types.Mixed },
    error:          { type: String },
    resumeTitle:    { type: String },
    jobDescription: { type: String },
    processingMs:   { type: Number },   // how long Gemini took
  },
  { timestamps: true }
);

// Avoid model re-registration on hot-reload
const AnalysisResult =
  mongoose.models.AnalysisResult || mongoose.model('AnalysisResult', analysisSchema);

// ─── Helper — cleanup uploaded file ──────────────────────────────────────────
const deleteFile = async (filePath) => {
  try {
    await fs.unlink(filePath);
  } catch {
    // best effort
  }
};

// ─── Resume content validator (same as in server.js) ─────────────────────────
const validateResumeContent = (parsedData) => {
  const rawText     = parsedData?.raw_text || '';
  const contact     = parsedData?.contact  || {};
  const skillsCount = parsedData?.skills_list?.length || 0;

  const trimmedLength = rawText.replace(/\s/g, '').length;
  const hasEnoughText = trimmedLength >= 200;

  const signals = [
    !!(contact.email || contact.phone || contact.linkedin || contact.github || contact.portfolio),
    skillsCount >= 1,
    (parsedData?.projects   || []).length > 0,
    (parsedData?.education  || []).length > 0,
    !!parsedData?.summary,
  ];

  const signalCount = signals.filter(Boolean).length;
  return { isValid: hasEnoughText && signalCount >= 2 };
};


﻿// ─── Core job processor ───────────────────────────────────────────────────────
const processResumeJob = async (job) => {
  const { filePath, fileType, jobDescription, userId, cacheKey, resumeTitle } = job.data;

  console.log(`\n🔧 [Worker] Processing job ${job.id} for user ${userId}`);
  console.log(`   File : ${filePath}`);
  console.log(`   Type : ${fileType}`);

  const workerStart = Date.now();

  // ── Metric: queue_wait_ms (enqueue → worker pickup time) ────────────────────
  // job.timestamp is the ms-epoch when the job was added to the queue.
  if (job.timestamp) {
    const queueWaitMs = workerStart - job.timestamp;
    metrics.record('queue_wait_ms', queueWaitMs);
    console.log(`   📊  Queue wait : ${queueWaitMs} ms`);
  }

  // ── 1. Mark as processing in MongoDB ────────────────────────────────────────
  const mongoInitStart = Date.now();
  await job.updateProgress({ pct: 5, stage: 'connecting' });
  await connectMongo();
  await AnalysisResult.findOneAndUpdate(
    { jobId: job.id },
    { status: 'processing' },
    { upsert: true, new: true }
  );
  console.log(`   ⏱️  Mongo init/mark-processing: ${Date.now() - mongoInitStart} ms`);

  // ── 2. Parse PDF / DOCX ─────────────────────────────────────────────────────
  await job.updateProgress({ pct: 15, stage: 'parsing' });
  console.log(`\n   ⚙️  Parsing resume…`);
  const parseStart = Date.now();
  const parsedData = await resumeParser.parseResume(filePath, fileType);
  const parseMs    = Date.now() - parseStart;
  metrics.record('parse_ms', parseMs);
  console.log(`   ✅  Parsing took: ${parseMs} ms`);

  const validation = validateResumeContent(parsedData);
  if (!validation.isValid) {
    await deleteFile(filePath);
    throw new Error('Uploaded file does not look like a resume. Please upload a resume with contact details and skills/experience sections.');
  }

  // ── 3. Gemini AI analysis ────────────────────────────────────────────────────
  await job.updateProgress({ pct: 30, stage: 'analyzing' });
  console.log(`\n   🤖  Running Gemini analysis…`);
  const geminiStart = Date.now();

  let analysisResult;
  const geminiApiKey = process.env.GEMINI_API_KEY;
  let usedGemini = false;

  if (geminiApiKey && geminiApiKey.trim()) {
    analysisResult = await aiAnalyzer.analyzeResume(parsedData, jobDescription, geminiApiKey);
    usedGemini = true;
  } else {
    // Graceful fallback when no API key is configured
    const atsScore = aiAnalyzer.calculateAtsScore(parsedData);
    analysisResult = {
      ats_score:       atsScore,
      match_score:     null,
      summary:         'Basic analysis completed. Add a Gemini API key for full AI analysis.',
      recommendations: [
        'Add Gemini API key for comprehensive analysis',
        'Ensure all contact information is present',
        'Include quantifiable achievements',
      ],
      parsed_data: {
        name:        parsedData.name,
        contact:     parsedData.contact,
        skills_list: parsedData.skills_list || [],
      },
    };
    metrics.increment('jobs_fallback');
  }
  const geminiTotalMs = Date.now() - geminiStart;
  // Only record Gemini timing for real Gemini-backed analyses
  if (usedGemini) {
    metrics.record('gemini_total_ms', geminiTotalMs);
  }
  console.log(`   ✅  Gemini (total) took: ${geminiTotalMs} ms`);

  // Ensure resume name / title is always present
  const fallbackTitle = resumeTitle || 'Untitled Resume';
  const extractedName = parsedData.contact?.name || parsedData.name || fallbackTitle;
  analysisResult.parsed_data                 = analysisResult.parsed_data || {};
  if (!analysisResult.parsed_data.name)       analysisResult.parsed_data.name        = extractedName;
  analysisResult.parsed_data.resume_title     = fallbackTitle;

  // ── 4. Store result in MongoDB ───────────────────────────────────────────────
  await job.updateProgress({ pct: 85, stage: 'saving' });
  console.log(`\n   💾  Saving to MongoDB…`);
  const mongoSaveStart = Date.now();
  const processingMs   = Date.now() - workerStart;

  await AnalysisResult.findOneAndUpdate(
    { jobId: job.id },
    {
      status:       'completed',
      result:       analysisResult,
      userId,
      cacheKey,
      resumeTitle:  fallbackTitle,
      jobDescription,
      processingMs,
    },
    { upsert: true, new: true }
  );
  const mongoSaveMs = Date.now() - mongoSaveStart;
  metrics.record('mongo_save_ms', mongoSaveMs);
  console.log(`   ✅  MongoDB save took: ${mongoSaveMs} ms`);

  // ── 5. Write to Redis cache ──────────────────────────────────────────────────
  await job.updateProgress({ pct: 95, stage: 'caching' });
  console.log(`\n   🔴  Caching result in Redis…`);
  const redisStart = Date.now();
  await setCachedResult(cacheKey, analysisResult);
  console.log(`   ✅  Redis cache took: ${Date.now() - redisStart} ms`);

  // ── 6. Cleanup & final metrics ───────────────────────────────────────────────
  await deleteFile(filePath);
  await job.updateProgress({ pct: 100, stage: 'completed' });

  const workerTotalMs = Date.now() - workerStart;
  metrics.record('worker_total_ms', workerTotalMs);
  metrics.increment('jobs_completed');

  console.log(`\n   ─────────────────────────────────────`);
  console.log(`   ⏱️  TOTAL job time: ${workerTotalMs} ms`);
  console.log(`   ─────────────────────────────────────\n`);

  // Return the result so BullMQ stores it as job.returnvalue
  return analysisResult;
};

// ─── Create the Worker ────────────────────────────────────────────────────────
const worker = new Worker(QUEUE_NAME, processResumeJob, {
  connection:  redisConnection,
  concurrency: parseInt(process.env.WORKER_CONCURRENCY || '2', 10), // process 2 jobs in parallel per process
  limiter: {
    max:      5,   // max 5 jobs
    duration: 10_000, // per 10 seconds (rate-limit Gemini calls)
  },
});

// ─── Worker event handlers ────────────────────────────────────────────────────
worker.on('active', (job) => {
  console.log(`▶️  [Worker] Job ${job.id} is now active`);
});

worker.on('completed', (job) => {
  console.log(`✅  [Worker] Job ${job.id} completed successfully`);
});

worker.on('failed', async (job, err) => {
  console.error(`❌  [Worker] Job ${job?.id} failed: ${err.message}`);
  metrics.increment('jobs_failed');

  // Mark as failed in MongoDB so the API can report the error
  try {
    await connectMongo();
    await AnalysisResult.findOneAndUpdate(
      { jobId: job?.id },
      { status: 'failed', error: err.message },
      { upsert: true }
    );

    // Also cleanup the file if it still exists
    if (job?.data?.filePath) {
      await deleteFile(job.data.filePath);
    }
  } catch (dbErr) {
    console.error('⚠️  Could not update failed status in MongoDB:', dbErr.message);
  }
});

worker.on('error', (err) => {
  const detail = err?.stack || err?.message || String(err);
  console.error('⚠️  [Worker] Unexpected error:', detail);
});

worker.on('stalled', (jobId) => {
  console.warn(`⚠️  [Worker] Job ${jobId} stalled — will be retried`);
});

// ─── Graceful shutdown ────────────────────────────────────────────────────────
const gracefulShutdown = async (signal) => {
  console.log(`\n🛑  Received ${signal}. Closing worker gracefully…`);
  await worker.close();
  await mongoose.disconnect();
  console.log('👋  Worker shut down cleanly.');
  process.exit(0);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT',  () => gracefulShutdown('SIGINT'));

console.log(`\n🚀 Resume Worker started`);
console.log(`   Queue      : ${QUEUE_NAME}`);
console.log(`   Concurrency: ${process.env.WORKER_CONCURRENCY || 2}`);
console.log(`   Redis      : ${process.env.REDIS_URL || 'redis://localhost:6379'}`);
console.log(`   MongoDB    : ${process.env.MONGO_URI ? '✅ configured' : '❌ missing MONGO_URI'}`);
console.log(`   Gemini     : ${process.env.GEMINI_API_KEY ? '✅ configured' : '⚠️  missing (fallback mode)'}\n`);

// Verify Redis is reachable before accepting jobs
checkRedisConnection();

