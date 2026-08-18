/**
 * rateLimiter.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Redis-based per-user rate limiter (sliding window via INCR + EXPIRE).
 *
 * Strategy:
 *   • One Redis key per user: `ratelimit:<userId>`
 *   • On each request: INCR the key, set EXPIRE on first write (60 s window).
 *   • If count > limit → reject with 429.
 *   • TTL is checked so the client knows when to retry (Retry-After header).
 *
 * Usage:
 *   const { checkRateLimit } = require('./utils/rateLimiter');
 *   const { allowed, count, ttl, limit } = await checkRateLimit(userId);
 *   if (!allowed) return res.status(429).json({ ... });
 * ─────────────────────────────────────────────────────────────────────────────
 */

const { getClient, isAvailable } = require('./redisClient');

const DEFAULT_LIMIT      = 10;   // max analyses per window
const DEFAULT_WINDOW_SEC = 60;   // rolling window in seconds

/**
 * Check and increment the rate-limit counter for a given user.
 *
 * @param {string} userId
 * @param {number} limit      - max requests per window (default 10)
 * @param {number} windowSec  - window size in seconds   (default 60)
 * @returns {{ allowed: boolean, count: number, limit: number, ttl: number }}
 */
const checkRateLimit = async (userId, limit = DEFAULT_LIMIT, windowSec = DEFAULT_WINDOW_SEC) => {
  // If Redis is unavailable, fail open (don't block legitimate users)
  if (!isAvailable()) {
    console.warn('⚠️  Rate limiter: Redis unavailable — skipping limit check');
    return { allowed: true, count: 0, limit, ttl: windowSec };
  }

  const client = getClient();
  const key    = `ratelimit:${userId}`;

  try {
    // Atomically increment. Returns the new value after incrementing.
    const count = await client.incr(key);

    // On the very first request in a window, set the TTL.
    // KEEPTTL is not needed here — INCR on an existing key preserves TTL.
    if (count === 1) {
      await client.expire(key, windowSec);
    }

    // Fetch remaining TTL so we can send a useful Retry-After header
    const ttl = await client.ttl(key);

    if (count > limit) {
      console.warn(`🚫 Rate limit exceeded for user ${userId}: ${count}/${limit} in ${windowSec}s window`);
      return { allowed: false, count, limit, ttl: ttl > 0 ? ttl : windowSec };
    }

    return { allowed: true, count, limit, ttl: ttl > 0 ? ttl : windowSec };
  } catch (err) {
    // Redis command error — fail open rather than blocking the user
    console.error('⚠️  Rate limiter error (failing open):', err.message);
    return { allowed: true, count: 0, limit, ttl: windowSec };
  }
};

module.exports = { checkRateLimit };
