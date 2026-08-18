/**
 * test-concurrency.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Test #2 — Concurrency Verification
 *
 * Verifies that the BullMQ worker processes at most CONCURRENCY (default 2)
 * jobs in parallel, while remaining jobs wait in the queue.
 *
 * HOW IT WORKS:
 *   1. Creates an ISOLATED 'concurrency-test' queue (never touches prod data).
 *   2. Starts an inline test worker (concurrency=2) that just sleeps 8s per job.
 *   3. Enqueues 5 jobs all at once.
 *   4. Polls job states every second and prints a live colour-coded state table.
 *   5. Asserts: max concurrent ACTIVE jobs never exceeds CONCURRENCY.
 *   6. Asserts: all jobs eventually reach 'completed'.
 *   7. Cleans up the test queue from Redis on exit.
 *
 * RUN:
 *   # Make sure Redis is running and the prod worker is started, then:
 *   node test/test-concurrency.js
 * ─────────────────────────────────────────────────────────────────────────────
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const { Queue, Worker, Job } = require('bullmq');
const { redisConnection }   = require('../utils/queue');

// ─── Config ───────────────────────────────────────────────────────────────────
const TOTAL_JOBS  = 5;
const CONCURRENCY = 2;       // must match WORKER_CONCURRENCY env / worker config
const SLOW_JOB_MS = 8_000;  // each synthetic job sleeps this long
const POLL_MS     = 1_000;  // polling interval
const TIMEOUT_MS  = 120_000;
const TEST_QUEUE  = 'concurrency-test'; // isolated — never touches prod data

// ─── ANSI colours ─────────────────────────────────────────────────────────────
const C = {
  reset: '\x1b[0m', bold: '\x1b[1m',
  green: '\x1b[32m', yellow: '\x1b[33m',
  cyan: '\x1b[36m', red: '\x1b[31m', grey: '\x1b[90m',
};

const badge = (state) => {
  const map = {
    active:    `${C.green}${C.bold}[ACTIVE ]${C.reset}`,
    waiting:   `${C.yellow}${C.bold}[WAITING]${C.reset}`,
    completed: `${C.cyan}${C.bold}[DONE   ]${C.reset}`,
    failed:    `${C.red}${C.bold}[FAILED ]${C.reset}`,
  };
  return map[state] || `${C.grey}[${String(state).toUpperCase().padEnd(7)}]${C.reset}`;
};

const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const ts    = ()   => new Date().toISOString().slice(11, 19);

// ─── Main ────────────────────────────────────────────────────────────────────
(async () => {
  console.log(`\n${C.bold}╔═══════════════════════════════════════════════╗`);
  console.log(`║   Test #2 — Concurrency Verification          ║`);
  console.log(`╚═══════════════════════════════════════════════╝${C.reset}\n`);
  console.log(`   Jobs to enqueue : ${TOTAL_JOBS}`);
  console.log(`   Concurrency cap : ${CONCURRENCY}`);
  console.log(`   Job duration    : ${SLOW_JOB_MS / 1000}s each (synthetic sleep)\n`);

  // 1. Create isolated test queue
  const testQueue = new Queue(TEST_QUEUE, { connection: redisConnection });
  await testQueue.drain();
  console.log(`${C.grey}⚙  Test queue drained — starting fresh${C.reset}\n`);

  // 2. Inline worker — just sleeps, no Gemini, no DB, no file IO
  const testWorker = new Worker(
    TEST_QUEUE,
    async (job) => {
      await sleep(SLOW_JOB_MS);
      return { done: true };
    },
    { connection: redisConnection, concurrency: CONCURRENCY }
  );
  testWorker.on('error', (err) =>
    console.error(`${C.red}[Worker Error] ${err.message}${C.reset}`)
  );

  // 3. Enqueue all 5 jobs at the same moment
  console.log(`${C.bold}📬 Enqueueing ${TOTAL_JOBS} jobs simultaneously…${C.reset}`);
  const jobIds = [];
  for (let i = 1; i <= TOTAL_JOBS; i++) {
    const job = await testQueue.add(`slow-job`, { index: i });
    jobIds.push(job.id);
    console.log(`   Job #${i}  id=${job.id}`);
  }

  // 4. Print table header
  console.log(`\n${C.bold}🔍 Live state monitor  (every ${POLL_MS / 1000}s)${C.reset}`);
  const hdr = jobIds.map((_, i) => `  Job#${i + 1}  `).join('|');
  console.log(`\n  TIME    | ${hdr}| ACTIVE | OK?`);
  console.log(`${'─'.repeat(9 + (TOTAL_JOBS * 11) + 18)}`);

  // 5. Poll loop
  const startMs   = Date.now();
  const snapshots = [];
  let   violated  = false;

  while (Date.now() - startMs < TIMEOUT_MS) {
    await sleep(POLL_MS);

    const states = await Promise.all(
      jobIds.map(async (id) => {
        const j = await Job.fromId(testQueue, id);
        return j ? await j.getState() : 'unknown';
      })
    );

    const activeCount  = states.filter(s => s === 'active').length;
    const allDone      = states.every(s => s === 'completed' || s === 'failed');
    const isViolation  = activeCount > CONCURRENCY;
    if (isViolation) violated = true;

    snapshots.push({ states, activeCount });

    const cells   = states.map(s => badge(s)).join(' ');
    const okFlag  = isViolation
      ? `${C.red}${C.bold}❌ LIMIT BREACHED (${activeCount} > ${CONCURRENCY})${C.reset}`
      : `${C.green}✅${C.reset}`;

    console.log(`  ${ts()} | ${cells} |   ${activeCount}    | ${okFlag}`);

    if (allDone) {
      console.log(`\n${C.cyan}  All jobs finished.${C.reset}`);
      break;
    }
  }

  // 6. Final summary
  const elapsed = ((Date.now() - startMs) / 1000).toFixed(1);
  const finalStates = await Promise.all(
    jobIds.map(async (id) => {
      const j = await Job.fromId(testQueue, id);
      return j ? await j.getState() : 'timeout';
    })
  );
  const allCompleted  = finalStates.every(s => s === 'completed');
  const maxConcurrent = Math.max(...snapshots.map(s => s.activeCount));
  const passed        = allCompleted && !violated;

  console.log(`\n${'═'.repeat(60)}`);
  console.log(`${C.bold}📊 RESULT SUMMARY  (${elapsed}s elapsed)${C.reset}\n`);

  finalStates.forEach((s, i) =>
    console.log(`   Job #${i + 1}  →  ${badge(s)}`)
  );

  console.log(`\n   Peak concurrent ACTIVE jobs : ${C.bold}${maxConcurrent}${C.reset}  (cap = ${CONCURRENCY})`);
  console.log(`   Concurrency violated        : ${violated ? `${C.red}YES${C.reset}` : `${C.green}NO${C.reset}`}`);
  console.log(`   All jobs completed          : ${allCompleted ? `${C.green}YES${C.reset}` : `${C.red}NO${C.reset}`}`);

  console.log(`\n${'═'.repeat(60)}`);
  if (passed) {
    console.log(`\n${C.green}${C.bold}✅  Test #2 PASSED — queue concurrency is working correctly.${C.reset}\n`);
  } else {
    console.log(`\n${C.red}${C.bold}❌  Test #2 FAILED — see details above.${C.reset}\n`);
  }

  // 7. Cleanup
  await testWorker.close();
  await testQueue.obliterate({ force: true });

  process.exit(passed ? 0 : 1);
})();
