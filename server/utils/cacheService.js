const crypto = require('crypto');
const { getClient, isAvailable } = require('./redisClient');

// Default TTL: 24 hours (in seconds)
const CACHE_TTL_SECONDS = 60 * 60 * 24;

// Redis counter keys
const STATS_HITS_KEY   = 'cache:hits';
const STATS_MISSES_KEY = 'cache:misses';

/**
 * Compute a deterministic SHA-256 hash from:
 *   - The raw binary of the uploaded PDF/DOCX buffer
 *   - The job description string (so the same resume with a different JD is a cache miss)
 *
 * @param {Buffer} fileBuffer  - Raw file contents
 * @param {string|null} jobDescription
 * @returns {string} hex digest
 */
const computeCacheKey = (fileBuffer, jobDescription = '') => {
  const hash = crypto.createHash('sha256');
  hash.update(fileBuffer);
  hash.update(jobDescription || ''); // include JD so same resume + different JD = different key
  return `resume:${hash.digest('hex')}`;
};

/**
 * Try to get a cached analysis result.
 * Atomically increments cache:hits or cache:misses in Redis.
 *
 * @param {string} cacheKey
 * @returns {Object|null} parsed JSON result, or null on miss / Redis unavailable
 */
const getCachedResult = async (cacheKey) => {
  if (!isAvailable()) return null;

  try {
    const cached = await getClient().get(cacheKey);
    if (cached) {
      console.log(`🎯 Cache HIT  [${cacheKey.slice(0, 20)}...]`);
      // Fire-and-forget counter increment — don't block the response
      getClient().incr(STATS_HITS_KEY).catch(() => {});
      return JSON.parse(cached);
    }
    console.log(`❌ Cache MISS [${cacheKey.slice(0, 20)}...]`);
    getClient().incr(STATS_MISSES_KEY).catch(() => {});
    return null;
  } catch (err) {
    console.warn('⚠️  Redis GET error (skipping cache):', err.message);
    return null;
  }
};

/**
 * Store an analysis result in Redis with TTL.
 *
 * @param {string} cacheKey
 * @param {Object} result   - The analysis result object to cache
 * @param {number} [ttl]    - Override TTL in seconds
 */
const setCachedResult = async (cacheKey, result, ttl = CACHE_TTL_SECONDS) => {
  if (!isAvailable()) return;

  try {
    await getClient().setex(cacheKey, ttl, JSON.stringify(result));
    console.log(`💾 Cache SET  [${cacheKey.slice(0, 20)}...] TTL=${ttl}s`);
  } catch (err) {
    console.warn('⚠️  Redis SET error (result not cached):', err.message);
  }
};

/**
 * Read cache:hits and cache:misses counters from Redis and return a
 * formatted statistics object.
 *
 * @returns {Object} { hits, misses, total, hitRate, redisAvailable }
 */
const getCacheStats = async () => {
  if (!isAvailable()) {
    return {
      hits: 0,
      misses: 0,
      total: 0,
      hitRate: '0.00',
      redisAvailable: false,
      message: 'Redis is not available — stats are not being tracked'
    };
  }

  try {
    // Fetch both counters in one round-trip via pipeline
    const [hitsRaw, missesRaw] = await getClient()
      .pipeline()
      .get(STATS_HITS_KEY)
      .get(STATS_MISSES_KEY)
      .exec()
      // pipeline().exec() returns [[err, val], [err, val]]
      .then(results => results.map(([, val]) => val));

    const hits   = parseInt(hitsRaw   || '0', 10);
    const misses = parseInt(missesRaw || '0', 10);
    const total  = hits + misses;
    const hitRate = total > 0 ? ((hits / total) * 100).toFixed(2) : '0.00';

    return { hits, misses, total, hitRate, redisAvailable: true };
  } catch (err) {
    console.warn('⚠️  Redis STATS error:', err.message);
    return {
      hits: 0,
      misses: 0,
      total: 0,
      hitRate: '0.00',
      redisAvailable: true,
      message: 'Could not read stats from Redis'
    };
  }
};

/**
 * Reset cache:hits and cache:misses counters to zero.
 */
const resetCacheStats = async () => {
  if (!isAvailable()) return;
  try {
    await getClient().pipeline().set(STATS_HITS_KEY, 0).set(STATS_MISSES_KEY, 0).exec();
    console.log('🔄 Cache stats reset to zero');
  } catch (err) {
    console.warn('⚠️  Redis RESET error:', err.message);
  }
};

module.exports = {
  computeCacheKey,
  getCachedResult,
  setCachedResult,
  getCacheStats,
  resetCacheStats,
  CACHE_TTL_SECONDS
};
