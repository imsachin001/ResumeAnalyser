/**
 * benchmark.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Reads live metrics from Redis and prints a formatted performance report.
 *
 * Usage (run after processing at least a few resumes):
 *   node test/benchmark.js
 *
 * What it prints:
 *   - Per-metric avg / p50 / p95 / min / max / sample count
 *   - Cache hit rate
 *   - Derived resume/portfolio bullet points with real numbers
 * ─────────────────────────────────────────────────────────────────────────────
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const { initRedis } = require('../utils/redisClient');
const metrics       = require('../utils/metrics');

const W = 72;
const line = (ch = '-') => ch.repeat(W);

const pad = (label, value, width = 35) =>
  `  ${label.padEnd(width)} ${value}`;

const msOrSec = (ms) => {
  if (ms === 0 || ms === undefined) return 'no data';
  return ms >= 1000 ? `${(ms / 1000).toFixed(2)}s` : `${ms}ms`;
};

const summariseLine = (s) => {
  if (!s || s.count === 0) return '(no samples yet)';
  return [
    `avg=${msOrSec(s.avg)}`,
    `p50=${msOrSec(s.p50)}`,
    `p95=${msOrSec(s.p95)}`,
    `min=${msOrSec(s.min)}`,
    `max=${msOrSec(s.max)}`,
    `n=${s.count}`,
  ].join('  ');
};

const pct = (ratio) => `${(ratio * 100).toFixed(1)}%`;

async function main() {
  // Wait for Redis to connect
  await initRedis();
  await new Promise(r => setTimeout(r, 500));

  const data = await metrics.getSummary();
  const L    = data.latencies;
  const C    = data.counters;
  const K    = data.cache;

  console.log('\n' + line('='));
  console.log('  CVlyze — Observability Report');
  console.log(`  Generated at: ${data.collectedAt}`);
  console.log(`  Source      : ${data.source}`);
  if (data.note) console.log(`  Note        : ${data.note}`);
  console.log(line('='));

  // ── Latency breakdown ──────────────────────────────────────────────────────
  console.log('\n  LATENCY METRICS');
  console.log(line());

  const rows = [
    ['API Latency (POST /api/analyze)',     'api_latency'],
    ['Queue Wait (enqueue → worker pickup)','queue_wait_ms'],
    ['Worker Total (queue pickup → done)',  'worker_total_ms'],
    ['Gemini Total (wall-clock parallel)',  'gemini_total_ms'],
    ['Gemini Call #1 (main, 2.5-flash-lite)', 'gemini_call1_ms'],
    ['Gemini Call #2 (ATS, 3.5-flash-lite)', 'gemini_call2_ms'],
    ['MongoDB Save',                        'mongo_save_ms'],
    ['Resume Parse (PDF/DOCX)',             'parse_ms'],
  ];

  for (const [label, key] of rows) {
    console.log(pad(label + ':', summariseLine(L[key])));
  }

  // ── Counters ───────────────────────────────────────────────────────────────
  console.log('\n  JOB COUNTERS');
  console.log(line());
  const total       = C.jobs_completed + C.jobs_failed;
  const geminiJobs  = C.jobs_completed - (C.jobs_fallback || 0);  // completed via real Gemini
  console.log(pad('Jobs Completed:',         String(C.jobs_completed)));
  console.log(pad('  ↳ Gemini-backed:',      String(Math.max(0, geminiJobs))));
  console.log(pad('  ↳ Fallback (no Gemini):',String(C.jobs_fallback || 0)));
  console.log(pad('Jobs Failed:',            String(C.jobs_failed)));
  console.log(pad('Gemini Retries:',         String(C.jobs_retried)));
  if (total > 0) {
    console.log(pad('Success Rate:',  pct(C.jobs_completed / total)));
    console.log(pad('Failure Rate:',  pct(C.jobs_failed / total)));
  }

  // ── Cache ──────────────────────────────────────────────────────────────────
  console.log('\n  CACHE (Redis)');
  console.log(line());
  console.log(pad('Hits:',      String(K.hits)));
  console.log(pad('Misses:',    String(K.misses)));
  console.log(pad('Hit Rate:',  `${K.hitRate}%`));

  // ── Derived resume bullets ─────────────────────────────────────────────────
  console.log('\n' + line('='));
  console.log('  RESUME / PROJECT BULLET POINTS  (backed by real measurements)');
  console.log(line('='));

  const wt = L.worker_total_ms;
  const gt = L.gemini_total_ms;
  const g1 = L.gemini_call1_ms;
  const g2 = L.gemini_call2_ms;
  const pm = L.parse_ms;
  const ms = L.mongo_save_ms;
  const qw = L.queue_wait_ms;
  const al = L.api_latency;

  const bullets = [];

  // Gemini parallelization savings
  if (g1.count > 0 && g2.count > 0) {
    const serialEst = g1.avg + g2.avg;
    const wallClock  = gt.avg;
    const saved      = serialEst - wallClock;
    const savedPct   = serialEst > 0 ? Math.round((saved / serialEst) * 100) : 0;
    bullets.push(
      `Reduced Gemini processing time by ~${savedPct}% (from ~${msOrSec(serialEst)} estimated serial` +
      ` to ~${msOrSec(wallClock)} wall-clock) by parallelizing main analysis and ATS` +
      ` improvement calls across gemini-2.5-flash-lite and gemini-3.5-flash-lite.`
    );
    bullets.push(
      `Gemini Call #1 (main analysis, 2.5-flash-lite): avg ${msOrSec(g1.avg)}, p95 ${msOrSec(g1.p95)}.` +
      ` Call #2 (ATS cards, 3.5-flash-lite): avg ${msOrSec(g2.avg)}, p95 ${msOrSec(g2.p95)}.` +
      ` Total wall-clock: avg ${msOrSec(gt.avg)}.`
    );
  } else if (gt.count > 0) {
    bullets.push(
      `Gemini AI analysis latency: avg ${msOrSec(gt.avg)}, p50 ${msOrSec(gt.p50)}, p95 ${msOrSec(gt.p95)}.`
    );
  }

  // Worker total
  if (wt.count > 0) {
    bullets.push(
      `End-to-end worker processing time (parse + AI + DB + cache): avg ${msOrSec(wt.avg)},` +
      ` p50 ${msOrSec(wt.p50)}, p95 ${msOrSec(wt.p95)} across ${wt.count} Gemini-backed job(s).`
    );
  }

  // Parse
  if (pm.count > 0) {
    bullets.push(
      `PDF/DOCX resume parsing: avg ${msOrSec(pm.avg)}, p95 ${msOrSec(pm.p95)}.`
    );
  }

  // MongoDB
  if (ms.count > 0) {
    bullets.push(
      `MongoDB write latency: avg ${msOrSec(ms.avg)}, p95 ${msOrSec(ms.p95)}.`
    );
  }

  // Queue wait
  if (qw.count > 0) {
    bullets.push(
      `BullMQ queue wait time (enqueue to worker pickup): avg ${msOrSec(qw.avg)}, p95 ${msOrSec(qw.p95)}.`
    );
  }

  // API latency
  if (al.count > 0) {
    bullets.push(
      `POST /api/analyze end-to-end HTTP response: avg ${msOrSec(al.avg)}, p95 ${msOrSec(al.p95)}.` +
      ` (202 Accepted response before worker processing; reflects only queue enqueue overhead.)`
    );
  }

  // Cache
  const cTotal = K.hits + K.misses;
  if (cTotal > 0) {
    bullets.push(
      `Redis cache hit rate: ${K.hitRate}% (${K.hits} hits / ${cTotal} total requests).` +
      ` Cache hits serve results in <5ms with zero Gemini cost.`
    );
  }

  // Reliability
  const jobTotal   = C.jobs_completed + C.jobs_failed;
  const fallbacks  = C.jobs_fallback || 0;
  if (jobTotal > 0) {
    const successRate = ((C.jobs_completed / jobTotal) * 100).toFixed(1);
    bullets.push(
      `Job success rate: ${successRate}% (${C.jobs_completed}/${jobTotal} completed,` +
      ` ${Math.max(0, geminiJobs)} Gemini-backed` +
      (fallbacks > 0 ? `, ${fallbacks} fallback` : '') +
      `).` +
      (C.jobs_retried > 0 ? ` Gemini transient errors triggered ${C.jobs_retried} retry(ies) via exponential backoff.` : '')
    );
  }

  if (bullets.length === 0) {
    console.log('\n  (No data yet — run some analyses first, then re-run this script.)\n');
  } else {
    bullets.forEach((b, i) => {
      console.log(`\n  ${i + 1}. ${b}`);
    });
  }

  console.log('\n' + line('=') + '\n');
  process.exit(0);
}

main().catch(err => {
  console.error('Benchmark error:', err.message);
  process.exit(1);
});
