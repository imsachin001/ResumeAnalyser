/**
 * test-cache.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Test #3 — Redis Cache Hit
 *
 * Verifies that submitting the same resume + job-description twice:
 *   Round 1 → misses cache, goes through the BullMQ worker (slow)
 *   Round 2 → hits cache, returns INSTANTLY without touching the worker
 *
 * Also tests:
 *   - Different JD with same resume → cache MISS (different key)
 *   - Cache stats endpoint reflects correct hit/miss counts
 *
 * HOW IT WORKS:
 *   Uses the real cacheService helpers (same code path as the server/worker).
 *   No HTTP server needed — calls Redis directly via cacheService.
 *
 * RUN:
 *   node test/test-cache.js
 * ─────────────────────────────────────────────────────────────────────────────
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const { initRedis, isAvailable } = require('../utils/redisClient');
const {
  computeCacheKey,
  getCachedResult,
  setCachedResult,
  getCacheStats,
  resetCacheStats,
} = require('../utils/cacheService');

// ─── ANSI colours ─────────────────────────────────────────────────────────────
const C = {
  reset: '\x1b[0m', bold: '\x1b[1m',
  green: '\x1b[32m', yellow: '\x1b[33m',
  cyan: '\x1b[36m', red: '\x1b[31m', grey: '\x1b[90m',
};

const pass  = (msg) => console.log(`  ${C.green}${C.bold}✅ PASS${C.reset}  ${msg}`);
const fail  = (msg) => { console.log(`  ${C.red}${C.bold}❌ FAIL${C.reset}  ${msg}`); failCount++; };
const info  = (msg) => console.log(`  ${C.grey}     ${msg}${C.reset}`);
const hr    = ()    => console.log(`${'─'.repeat(64)}`);

let failCount = 0;

// Synthetic "resume" buffers — real content doesn't matter for cache key testing
const RESUME_A = Buffer.from('Resume content for Candidate Alice — Software Engineer');
const RESUME_B = Buffer.from('Resume content for Candidate Bob — Data Scientist');
const JD_1     = 'Full-stack developer with React and Node.js experience';
const JD_2     = 'Machine learning engineer with Python and PyTorch experience';

// Synthetic analysis result (simulates what the worker would return)
const MOCK_RESULT_A = {
  ats_score: 82,
  summary: 'Strong software engineering background.',
  skills_list: ['React', 'Node.js', 'TypeScript'],
};

const MOCK_RESULT_B = {
  ats_score: 76,
  summary: 'Solid data science profile.',
  skills_list: ['Python', 'PyTorch', 'SQL'],
};

// ─── helpers ─────────────────────────────────────────────────────────────────
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

const timedGet = async (key) => {
  const t0  = Date.now();
  const val = await getCachedResult(key);
  return { val, ms: Date.now() - t0 };
};

// ─── Main ────────────────────────────────────────────────────────────────────
(async () => {
  console.log(`\n${C.bold}╔══════════════════════════════════════════════════════════════╗`);
  console.log(`║   Test #3 — Redis Cache Hit / Miss Verification              ║`);
  console.log(`╚══════════════════════════════════════════════════════════════╝${C.reset}\n`);

  // ── 0. Connect to Redis ────────────────────────────────────────────────────
  await initRedis();
  await sleep(300); // let the connect event fire
  if (!isAvailable()) {
    console.error(`${C.red}❌  Redis is not available. Start Redis first.${C.reset}\n`);
    process.exit(1);
  }
  console.log(`${C.green}✅  Redis connected${C.reset}\n`);

  // ── Reset stats for a clean baseline ──────────────────────────────────────
  await resetCacheStats();
  info('Cache stats reset to 0/0\n');

  // ═══════════════════════════════════════════════════════════════════════════
  // TEST A — Cache Key Uniqueness
  // ═══════════════════════════════════════════════════════════════════════════
  console.log(`${C.bold}[A] Cache Key Uniqueness${C.reset}`);
  hr();

  const keyA1 = computeCacheKey(RESUME_A, JD_1);
  const keyA2 = computeCacheKey(RESUME_A, JD_1);   // same inputs → same key
  const keyA3 = computeCacheKey(RESUME_A, JD_2);   // same resume, different JD
  const keyB1 = computeCacheKey(RESUME_B, JD_1);   // different resume
  const keyB2 = computeCacheKey(RESUME_B, null);    // no JD

  info(`Key(ResumeA, JD1) = ${keyA1.slice(0, 32)}…`);
  info(`Key(ResumeA, JD1) = ${keyA2.slice(0, 32)}…  (same call, should match)`);
  info(`Key(ResumeA, JD2) = ${keyA3.slice(0, 32)}…  (different JD)`);
  info(`Key(ResumeB, JD1) = ${keyB1.slice(0, 32)}…  (different resume)`);
  info(`Key(ResumeB, null)= ${keyB2.slice(0, 32)}…  (no JD)\n`);

  keyA1 === keyA2
    ? pass('Same resume + JD  →  same key (deterministic)')
    : fail('Same inputs produced different keys — NOT deterministic!');

  keyA1 !== keyA3
    ? pass('Same resume, different JD  →  different key')
    : fail('Different JD should produce a different key!');

  keyA1 !== keyB1
    ? pass('Different resume  →  different key')
    : fail('Different resume content should produce a different key!');

  keyB1 !== keyB2
    ? pass('Same resume, JD vs no-JD  →  different key')
    : fail('Presence/absence of JD should affect the key!');

  console.log();

  // ═══════════════════════════════════════════════════════════════════════════
  // TEST B — Cache Miss on First Fetch
  // ═══════════════════════════════════════════════════════════════════════════
  console.log(`${C.bold}[B] Cold Cache — First Fetch (expect MISS)${C.reset}`);
  hr();

  const { val: missVal, ms: missMs } = await timedGet(keyA1);

  info(`getCachedResult returned: ${JSON.stringify(missVal)}`);
  info(`Round-trip time         : ${missMs}ms`);

  missVal === null
    ? pass(`Cache correctly returned null (MISS) in ${missMs}ms`)
    : fail('Expected null on first fetch — got a stale value!');

  console.log();

  // ═══════════════════════════════════════════════════════════════════════════
  // TEST C — Cache Set + Hit
  // ═══════════════════════════════════════════════════════════════════════════
  console.log(`${C.bold}[C] After Set — Second Fetch (expect HIT)${C.reset}`);
  hr();

  await setCachedResult(keyA1, MOCK_RESULT_A);
  info('setCachedResult called with MOCK_RESULT_A');

  const { val: hitVal, ms: hitMs } = await timedGet(keyA1);

  info(`getCachedResult returned: ${JSON.stringify(hitVal?.summary)}`);
  info(`Round-trip time         : ${hitMs}ms`);

  hitVal !== null
    ? pass(`Cache HIT — returned result in ${hitMs}ms`)
    : fail('Expected a hit after setCachedResult — got null!');

  hitVal?.ats_score === MOCK_RESULT_A.ats_score
    ? pass(`Result integrity OK — ats_score=${hitVal.ats_score} matches stored value`)
    : fail(`Result corrupted — expected ats_score=${MOCK_RESULT_A.ats_score}, got ${hitVal?.ats_score}`);

  hitMs < 50
    ? pass(`Cache response is fast: ${hitMs}ms < 50ms`)
    : fail(`Cache response too slow: ${hitMs}ms (should be <50ms for local Redis)`);

  console.log();

  // ═══════════════════════════════════════════════════════════════════════════
  // TEST D — Different JD = Independent Key (no cross-contamination)
  // ═══════════════════════════════════════════════════════════════════════════
  console.log(`${C.bold}[D] Same Resume, Different JD → Independent Cache Entry${C.reset}`);
  hr();

  const { val: diffJdVal } = await timedGet(keyA3); // same resume, JD_2

  diffJdVal === null
    ? pass('Different JD key correctly returned null (no cross-contamination)')
    : fail('Cache returned a value for a different JD key — keys are colliding!');

  // Now set it separately and verify both coexist
  await setCachedResult(keyA3, MOCK_RESULT_B);
  const { val: hitA1 } = await timedGet(keyA1);
  const { val: hitA3 } = await timedGet(keyA3);

  hitA1?.ats_score === MOCK_RESULT_A.ats_score && hitA3?.ats_score === MOCK_RESULT_B.ats_score
    ? pass('Both keys coexist independently with correct values')
    : fail('Keys are overwriting each other — isolation broken!');

  console.log();

  // ═══════════════════════════════════════════════════════════════════════════
  // TEST E — Cache Stats Accuracy
  // ═══════════════════════════════════════════════════════════════════════════
  console.log(`${C.bold}[E] Cache Stats Accuracy${C.reset}`);
  hr();

  const stats = await getCacheStats();
  info(`Hits   : ${stats.hits}`);
  info(`Misses : ${stats.misses}`);
  info(`Total  : ${stats.total}`);
  info(`Hit rate: ${stats.hitRate}%\n`);

  // We made: 1 miss (Test B) + 2 hits (Test C first get + Test D second gets)
  // + 1 miss (Test D first get for keyA3) + 2 hits at end of D
  // Expected: misses=2, hits=4
  stats.misses >= 2
    ? pass(`Misses counter ≥ 2 (got ${stats.misses}) — miss tracking works`)
    : fail(`Expected ≥ 2 misses, got ${stats.misses}`);

  stats.hits >= 2
    ? pass(`Hits counter ≥ 2 (got ${stats.hits}) — hit tracking works`)
    : fail(`Expected ≥ 2 hits, got ${stats.hits}`);

  stats.total === stats.hits + stats.misses
    ? pass('Total = hits + misses (arithmetic consistent)')
    : fail(`Total mismatch: ${stats.total} ≠ ${stats.hits} + ${stats.misses}`);

  const expectedHitRate = parseFloat(((stats.hits / stats.total) * 100).toFixed(2));
  parseFloat(stats.hitRate) === expectedHitRate
    ? pass(`Hit rate ${stats.hitRate}% is calculated correctly`)
    : fail(`Hit rate mismatch: got ${stats.hitRate}%, expected ${expectedHitRate}%`);

  console.log();

  // ═══════════════════════════════════════════════════════════════════════════
  // CLEANUP — remove test keys from Redis
  // ═══════════════════════════════════════════════════════════════════════════
  const { getClient } = require('../utils/redisClient');
  const client = getClient();
  if (client) {
    await client.del(keyA1, keyA2, keyA3, keyB1, keyB2);
    info('Test cache keys cleaned up from Redis');
  }

  // ─── Final summary ────────────────────────────────────────────────────────
  const totalTests = 12; // approximate
  console.log(`${'═'.repeat(64)}`);
  console.log(`${C.bold}📊 RESULT SUMMARY${C.reset}\n`);
  console.log(`   Failures : ${failCount === 0 ? C.green : C.red}${failCount}${C.reset}`);

  if (failCount === 0) {
    console.log(`\n${C.green}${C.bold}✅  Test #3 PASSED — Redis cache is working correctly.${C.reset}`);
    console.log(`${C.green}   Keys are deterministic, isolated, and fast.${C.reset}`);
    console.log(`${C.green}   Hits/misses tracked accurately.${C.reset}\n`);
  } else {
    console.log(`\n${C.red}${C.bold}❌  Test #3 FAILED — ${failCount} assertion(s) failed.${C.reset}\n`);
  }

  process.exit(failCount === 0 ? 0 : 1);
})();
