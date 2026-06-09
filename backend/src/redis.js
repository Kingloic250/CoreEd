require('dotenv').config();
const Redis = require('ioredis');

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

const redis = new Redis(REDIS_URL, {
  maxRetriesPerRequest: null,
  retryStrategy(times) {
    if (times > 5) return null;
    return Math.min(times * 200, 2000);
  },
  lazyConnect: true,
  tls: REDIS_URL.startsWith('rediss://') ? { rejectUnauthorized: false } : undefined,
});

redis.on('connect', () => console.log('[Redis] Connected'));
redis.on('error', (err) => console.error('[Redis] Error:', err.message));
redis.on('close', () => console.log('[Redis] Connection closed'));

async function connectRedis() {
  try {
    await redis.connect();
  } catch {
    console.warn('[Redis] Connection failed — running without Redis');
  }
}

module.exports = { redis, connectRedis };
