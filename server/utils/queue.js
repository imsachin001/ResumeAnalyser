
/**
 * queue.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Shared BullMQ connection + queue factory.
 *
 * Both the API server (server.js) and the worker process (workers/resumeWorker.js)
 * import from here so they always talk to the same Redis queue.
 *
 * NOTE: BullMQ requires its own IORedis connection — it cannot share the one
 * used by cacheService. We create a separate "connection" object here.
 * ─────────────────────────────────────────────────────────────────────────────
 */

require('dotenv').config();
const { Queue, QueueEvents } = require('bullmq');

// ─── Redis connection config for BullMQ ──────────────────────────────────────
// BullMQ accepts a plain { host, port } object or an ioredis instance.
// Parsing the REDIS_URL is the most flexible approach.
const parseRedisUrl = (url = 'redis://localhost:6379') => {
  try {
    const parsed = new URL(url);
    return {
      host: parsed.hostname || 'localhost',
      port: parseInt(parsed.port, 10) || 6379,
      password: parsed.password || undefined,
      // Upstash / TLS connections use rediss://
      tls: parsed.protocol === 'rediss:' ? {} : undefined,
    };
  } catch {
    return { host: 'localhost', port: 6379 };
  }
};

const redisConnection = {
  ...parseRedisUrl(process.env.REDIS_URL),
  // Prevent BullMQ's internal IORedis from spamming error events
  enableOfflineQueue: false,
  maxRetriesPerRequest: null, // BullMQ requires null (not a number) here
  retryStrategy(times) {
    if (times > 5) return null; // give up after 5 attempts
    return Math.min(times * 500, 3000);
  },
};

// ─── Queue name ───────────────────────────────────────────────────────────────
const QUEUE_NAME = 'resume-analysis';

// ─── Shared queue instance (API server uses this to add jobs) ─────────────────
const resumeQueue = new Queue(QUEUE_NAME, {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,                // retry up to 3 times on failure
    backoff: {
      type: 'exponential',
      delay: 5000,              // 5 s, 10 s, 20 s …
    },
    removeOnComplete: {
      age: 60 * 60 * 24,        // keep completed jobs for 24 h
      count: 500,               // keep last 500 completed jobs
    },
    removeOnFail: {
      age: 60 * 60 * 72,        // keep failed jobs for 72 h (useful for debugging)
    },
  },
});

// ─── QueueEvents (used to listen for job completion on the API side) ──────────
const resumeQueueEvents = new QueueEvents(QUEUE_NAME, {
  connection: redisConnection,
});

module.exports = {
  resumeQueue,
  resumeQueueEvents,
  QUEUE_NAME,
  redisConnection,
};
