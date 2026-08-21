/**
 * reset-metrics.js
 * -----------------------------------------------------------------------------
 * One-shot script that wipes ALL metrics from Redis (and in-process memory).
 * Run this to clear any historical data that may include fallback-polluted
 * samples recorded before the jobs_fallback counter was introduced.
 *
 * Usage:
 *   node test/reset-metrics.js
 * -----------------------------------------------------------------------------
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const { initRedis } = require('../utils/redisClient');
const metrics       = require('../utils/metrics');

async function main() {
  console.log('\n?  Connecting to Redis...');
  await initRedis();
  await new Promise(r => setTimeout(r, 500));

  console.log('???   Resetting all metrics (latencies + counters)...');
  await metrics.resetAll();

  console.log('?  Done — all metrics cleared. Fresh data will now only reflect Gemini-backed analyses.\n');
  process.exit(0);
}

main().catch(err => {
  console.error('Reset error:', err.message);
  process.exit(1);
});
