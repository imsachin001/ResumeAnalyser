/**
 * metrics.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Lightweight Redis-backed metrics collector with in-memory fallback.
 *
 * Tracks all 8 observability metrics:
 *   1. api_latency       - POST /api/analyze end-to-end HTTP response time
 *   2. queue_wait_ms     - time a job sits in BullMQ before worker picks it
 *   3. worker_total_ms   - total time inside processResumeJob()
 *   4. gemini_total_ms   - wall-clock for both parallel Gemini calls
 *   5. gemini_call1_ms   - main analysis call (gemini-2.5-flash)
 *   6. gemini_call2_ms   - ATS improvements call (gemini-3.5-flash-lite)
 *   7. mongo_save_ms     - MongoDB findOneAndUpdate write latency
 *   8. parse_ms          - PDF/DOCX resume parsing time
 *
 * Counters:
 *   - jobs_completed
 *   - jobs_failed
 *   - jobs_retried      (incremented each time _callWithRetry retries)
 *
 * All public functions are fire-and-forget and swallow errors internally -
 * they must NEVER throw or cause callers to fail.
 * ─────────────────────────────────────────────────────────────────────────────
 */

const { getClient, isAvailable } = require('./redisClient');

const SAMPLE_WINDOW = 200; // keep last N latency samples per metric

const LATENCY_METRICS = [
  'api_latency',
  'queue_wait_ms',
  'worker_total_ms',
  'gemini_total_ms',
  'gemini_call1_ms',
  'gemini_call2_ms',
  'mongo_save_ms',
  'parse_ms',
];

const COUNTER_METRICS = [
  'jobs_completed',
  'jobs_failed',
  'jobs_retried',
];

// In-memory fallback (used when Redis is unavailable, e.g. in worker process)
const _mem = {
  latencies: Object.fromEntries(LATENCY_METRICS.map(m => [m, []])),
  counters:  Object.fromEntries(COUNTER_METRICS.map(c => [c, 0])),
};

const latencyKey = (name) => `metrics:${name}`;
const counterKey = (name) => `metrics:${name}`;

const percentile = (sorted, pct) => {
  if (!sorted.length) return 0;
  const idx = Math.ceil((pct / 100) * sorted.length) - 1;
  return sorted[Math.max(0, Math.min(idx, sorted.length - 1))];
};

const summarise = (rawValues) => {
  if (!rawValues || !rawValues.length) {
    return { avg: 0, p50: 0, p95: 0, min: 0, max: 0, count: 0 };
  }
  const nums   = rawValues.map(Number).filter((n) => !isNaN(n));
  if (!nums.length) return { avg: 0, p50: 0, p95: 0, min: 0, max: 0, count: 0 };
  const sorted = [...nums].sort((a, b) => a - b);
  const avg    = Math.round(nums.reduce((s, v) => s + v, 0) / nums.length);
  return {
    avg,
    p50:   percentile(sorted, 50),
    p95:   percentile(sorted, 95),
    min:   sorted[0],
    max:   sorted[sorted.length - 1],
    count: nums.length,
  };
};

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Record a latency sample (milliseconds).
 * Fire-and-forget - never throws.
 */
const record = (metricName, valueMs) => {
  // In-memory fallback (always written)
  if (_mem.latencies[metricName] !== undefined) {
    _mem.latencies[metricName].push(valueMs);
    if (_mem.latencies[metricName].length > SAMPLE_WINDOW) {
      _mem.latencies[metricName].shift();
    }
  }
  // Redis (best-effort)
  if (!isAvailable()) return;
  const client = getClient();
  const key    = latencyKey(metricName);
  client
    .pipeline()
    .lpush(key, valueMs)
    .ltrim(key, 0, SAMPLE_WINDOW - 1)
    .exec()
    .catch(() => {});
};

/**
 * Increment a counter by 1.
 * Fire-and-forget - never throws.
 */
const increment = (counterName) => {
  // In-memory fallback (always written)
  if (_mem.counters[counterName] !== undefined) {
    _mem.counters[counterName]++;
  }
  // Redis (best-effort)
  if (!isAvailable()) return;
  getClient()
    .incr(counterKey(counterName))
    .catch(() => {});
};

/**
 * Read all metrics from Redis (or in-memory fallback) and return a summary.
 * Safe to await - errors return zero summary, not a throw.
 */
const getSummary = async () => {
  const empty = () => ({ avg: 0, p50: 0, p95: 0, min: 0, max: 0, count: 0 });

  if (isAvailable()) {
    try {
      const client   = getClient();
      const pipeline = client.pipeline();

      LATENCY_METRICS.forEach((m) => pipeline.lrange(latencyKey(m), 0, -1));
      COUNTER_METRICS.forEach((c) => pipeline.get(counterKey(c)));
      pipeline.get('cache:hits');
      pipeline.get('cache:misses');

      const results = await pipeline.exec();

      const latencies = {};
      LATENCY_METRICS.forEach((m, i) => {
        const [, raw] = results[i] || [];
        latencies[m]  = summarise(Array.isArray(raw) ? raw : []);
      });

      const counters = {};
      COUNTER_METRICS.forEach((c, i) => {
        const [, raw] = results[LATENCY_METRICS.length + i] || [];
        counters[c]   = parseInt(raw || '0', 10);
      });

      const cacheHitsIdx   = LATENCY_METRICS.length + COUNTER_METRICS.length;
      const cacheMissesIdx = cacheHitsIdx + 1;
      const cacheHits      = parseInt((results[cacheHitsIdx]   || [])[1] || '0', 10);
      const cacheMisses    = parseInt((results[cacheMissesIdx] || [])[1] || '0', 10);
      const cacheTotal     = cacheHits + cacheMisses;
      const hitRate        = cacheTotal > 0 ? ((cacheHits / cacheTotal) * 100).toFixed(2) : '0.00';

      return {
        latencies,
        counters,
        cache: { hits: cacheHits, misses: cacheMisses, hitRate },
        collectedAt: new Date().toISOString(),
        source: 'redis',
      };
    } catch (err) {
      console.warn('metrics.getSummary Redis error, falling back to memory:', err.message);
    }
  }

  // In-memory fallback
  const latencies = {};
  LATENCY_METRICS.forEach((m) => {
    latencies[m] = summarise(_mem.latencies[m] || []);
  });

  return {
    latencies,
    counters: { ..._mem.counters },
    cache: { hits: 0, misses: 0, hitRate: '0.00' },
    collectedAt: new Date().toISOString(),
    source: 'memory',
    note: 'Redis unavailable - showing in-process samples only',
  };
};

/**
 * Reset all metrics to zero (both Redis and in-memory).
 */
const resetAll = async () => {
  LATENCY_METRICS.forEach(m => { _mem.latencies[m] = []; });
  COUNTER_METRICS.forEach(c => { _mem.counters[c]  = 0;  });

  if (!isAvailable()) return;
  try {
    const client   = getClient();
    const pipeline = client.pipeline();
    LATENCY_METRICS.forEach(m => pipeline.del(latencyKey(m)));
    COUNTER_METRICS.forEach(c => pipeline.del(counterKey(c)));
    await pipeline.exec();
    console.log('Metrics reset to zero');
  } catch (err) {
    console.warn('metrics.resetAll error:', err.message);
  }
};

/**
 * Format a latency summary as a human-readable string.
 */
const formatSummary = (s, unit = 'ms') => {
  if (!s || s.count === 0) return 'no data';
  return `avg=${s.avg}${unit}  p50=${s.p50}${unit}  p95=${s.p95}${unit}  min=${s.min}${unit}  max=${s.max}${unit}  n=${s.count}`;
};

module.exports = { record, increment, getSummary, resetAll, formatSummary };
