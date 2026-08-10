const Redis = require('ioredis');

let redisClient = null;
let isRedisAvailable = false;

const createRedisClient = () => {
  const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

  const client = new Redis(redisUrl, {
    // Retry strategy: give up after 3 failed attempts so the app doesn't hang
    maxRetriesPerRequest: 3,
    retryStrategy(times) {
      if (times > 3) {
        console.warn('⚠️  Redis: max retries reached, disabling cache.');
        return null; // stop retrying
      }
      return Math.min(times * 200, 1000); // exponential back-off up to 1 s
    },
    enableOfflineQueue: false, // don't queue commands while offline
    lazyConnect: true,         // connect explicitly so we can catch errors
  });

  client.on('connect', () => {
    isRedisAvailable = true;
    console.log('✅  Redis connected — caching enabled');
  });

  client.on('error', (err) => {
    if (isRedisAvailable) {
      console.warn('⚠️  Redis error, falling back to no-cache mode:', err.message);
    }
    isRedisAvailable = false;
  });

  client.on('close', () => {
    isRedisAvailable = false;
  });

  return client;
};

/**
 * Initialise the Redis connection.
 * Call once at server start-up; safe to call even when Redis is unavailable.
 */
const initRedis = async () => {
  try {
    redisClient = createRedisClient();
    await redisClient.connect();
  } catch (err) {
    console.warn('⚠️  Redis not available, running without cache:', err.message);
    isRedisAvailable = false;
  }
};

const getClient = () => redisClient;
const isAvailable = () => isRedisAvailable;

module.exports = { initRedis, getClient, isAvailable };
