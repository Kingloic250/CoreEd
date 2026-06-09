const { redis } = require('../redis');

function cache(ttlSeconds) {
  return async (req, res, next) => {
    if (Object.keys(req.query).length > 0) return next();

    const key = `cache:${req.originalUrl}`;

    try {
      const cached = await redis.get(key);
      if (cached) {
        const parsed = JSON.parse(cached);
        return res.json(parsed);
      }
    } catch {
      return next();
    }

    const originalJson = res.json.bind(res);
    res.json = async (body) => {
      try {
        await redis.set(key, JSON.stringify(body), 'EX', ttlSeconds);
      } catch {
        // cache write failure is non-critical
      }
      originalJson(body);
    };

    next();
  };
}

async function clearCache(pattern) {
  try {
    let cursor = '0';
    let keys = [];
    do {
      const result = await redis.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
      cursor = result[0];
      keys = result[1];
      if (keys.length > 0) await redis.del(...keys);
    } while (cursor !== '0');
  } catch (err) {
    console.error('[Cache] Clear error:', err.message);
  }
}

module.exports = { cache, clearCache };
