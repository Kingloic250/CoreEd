const { redis } = require('../redis');

function createRateLimiter({ windowMs, max, keyPrefix, lockoutAttempts, lockoutDurationMs }) {
  return async (req, res, next) => {
    const identifier = req.ip || req.connection?.remoteAddress || 'unknown';
    const key = `ratelimit:${keyPrefix}:${identifier}`;

    try {
      if (lockoutAttempts) {
        const lockoutKey = `lockout:${keyPrefix}:${identifier}`;
        const locked = await redis.get(lockoutKey);
        if (locked) {
          const ttl = await redis.ttl(lockoutKey);
          res.set('Retry-After', String(ttl));
          return res.status(429).json({ message: `Too many attempts. Try again in ${ttl} seconds.` });
        }
      }

      const count = await redis.incr(key);
      if (count === 1) await redis.pexpire(key, windowMs);

      if (lockoutAttempts && count > lockoutAttempts) {
        await redis.set(`lockout:${keyPrefix}:${identifier}`, '1', 'PX', lockoutDurationMs);
        await redis.del(key);
        const retryAfter = Math.ceil(lockoutDurationMs / 1000);
        res.set('Retry-After', String(retryAfter));
        return res.status(429).json({ message: `Too many attempts. Try again in ${retryAfter} seconds.` });
      }

      if (count > max) {
        const ttl = await redis.pttl(key);
        res.set('Retry-After', String(Math.ceil(ttl / 1000)));
        return res.status(429).json({ message: 'Too many requests. Please slow down.' });
      }

      res.set('X-RateLimit-Limit', String(max));
      res.set('X-RateLimit-Remaining', String(Math.max(0, max - count)));
      next();
    } catch (err) {
      console.error('[RateLimit] Error:', err.message);
      next();
    }
  };
}

module.exports = { createRateLimiter };
