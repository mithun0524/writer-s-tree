import { cache } from '../services/redisService.js';
import logger from '../config/logger.js';

export const rateLimiter = (maxRequests = 100, windowSeconds = 60) => {
  return async (req, res, next) => {
    const userId = req.auth?.userId || req.ip;
    const key = `ratelimit:${userId}:${req.path}`;

    try {
      const count = await cache.incr(key, windowSeconds);

      res.setHeader('X-RateLimit-Limit', maxRequests);
      res.setHeader('X-RateLimit-Remaining', Math.max(0, maxRequests - count));
      res.setHeader('X-RateLimit-Reset', windowSeconds);

      if (count > maxRequests) {
        return res.status(429).json({
          error: 'Too many requests',
          retryAfter: windowSeconds,
        });
      }

      next();
    } catch (error) {
      logger.error('Rate limiter error:', error);
      next();
    }
  };
};
