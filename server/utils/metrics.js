/**
 * metrics.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Lightweight Redis-backed metrics collector.
 *
 * All public functions are fire-and-forget and swallow errors internally —
 * they must NEVER throw or cause callers to fail.
 *
 * Storage strategy:
 *   Latencies → LPUSH + LTRIM   (rolling window of last SAMPLE_WINDOW samples)
 *   Counters  → INCR
 *
 * Usage:
 *   const metrics = require('./metrics');
 *   metrics.record('gemini_call1_ms', 23400);   // fire-and-forget
 *   metrics.increment('jobs_completed');          // fire-and-forget
 *   const summary = await metrics.getSummary();  // async, safe to await
 * ─────────────────────────────────────────────────────────────────────────────
 */

const { getClient, isAvailable } = require('./redisClient');

const SAMPLE_WINDOW = 200; // keep last N latency samples per metric

// All latency metric names we track
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

// All counter names we track
const COUNTER_METRICS = [
  'jobs_completed',
  'jobs_failed',
  'jobs_retried',
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const latencyKey  = (name) => `metrics:${name}`;
const counterKey  = (name) => `metrics:${name}`;

/**
 * Compute percentile from a sorted numeric array.
 * @param {number[]} sorted - ascending sorted array
 * @param {number}   pct    - 0–100
 */
const percentile = (sorted, pct) => {
  if (!sorted.length) return 0;
  const idx = Math.ceil((pct / 100) * sorted.length) - 1;
  return sorted[Math.max(0, Math.min(idx, sorted.length - 1))];
};

/**
 * Summarise a raw array of string values read from Redis LRANGE.
 */
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
 * Fire-and-forget — never throws.
 *
 * @param {string} metricName - one of LATENCY_METRICS
 * @param {number} valueMs
 */
const record = (metricName, valueMs) => {
  if (!isAvailable()) return;
  const client = getClient();
  const key    = latencyKey(metricName);
  client
    .pipeline()
    .lpush(key, valueMs)
    .ltrim(key, 0, SAMPLE_WINDOW - 1)
    .exec()
    .catch(() => {}); // swallow silently
};

/**
 * Increment a counter by 1.
 * Fire-and-forget — never throws.
 *
 * @param {string} counterName - one of COUNTER_METRICS
 */
const increment = (counterName) => {
  if (!isAvailable()) return;
  getClient()
    .incr(counterKey(counterName))
    .catch(() => {}); // swallow silently
};

/**
 * Read all metrics from Redis and return a formatted summary.
 * Safe to await — errors return an empty/zero summary, not a throw.
 *
 * @returns {Promise<Object>}
 */
const getSummary = async () => {
  const empty = () => ({ avg: 0, p50: 0, p95: 0, min: 0, max: 0, count: 0 });

  if (!isAvailable()) {
    return {
      latencies:   Object.fromEntries(LATENCY_METRICS.map((m) => [m, empty()])),
      counters:    Object.fromEntries(COUNTER_METRICS.map((c) => [c, 0])),
      cache:       { hits: 0, misses: 0, hitRate: '0.00' },
      collectedAt: new Date().toISOString(),
      note:        'Redis unavailable — no metrics recorded',
    };
  }

  try {
    const client   = getClient();
    const pipeline = client.pipeline();

    // Fetch all latency windows
    LATENCY_METRICS.forEach((m) => pipeline.lrange(latencyKey(m), 0, -1));

    // Fetch all counters
    COUNTER_METRICS.forEach((c) => pipeline.get(counterKey(c)));

    // Fetch cache counters (written by cacheService.js)
    pipeline.get('cache:hits');
    pipeline.get('cache:misses');

    const results = await pipeline.exec(); // [[err, val], ...]

    // Unpack latency results (first LATENCY_METRICS.length entries)
    const latencies = {};
    LATENCY_METRICS.forEach((m, i) => {
      const [, raw] = results[i] || [];
      latencies[m]  = summarise(Array.isArray(raw) ? raw : []);
    });

    // Unpack counter results
    const counters = {};
    COUNTER_METRICS.forEach((c, i) => {
      const [, raw] = results[LATENCY_METRICS.length + i] || [];
      counters[c]   = parseInt(raw || '0', 10);
    });

    // Unpack cache counters
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
    };
  } catch (err) {
    return {
      latencies:   Object.fromEntries(LATENCY_METRICS.map((m) => [m, empty()])),
      counters:    Object.fromEntries(COUNTER_METRICS.map((c) => [c, 0])),
      cache:       { hits: 0, misses: 0, hitRate: '0.00' },
      collectedAt: new Date().toISOString(),
      error:       err.message,
    };
  }
};

module.exports = { record, increment, getSummary };
