import { createClient } from 'redis';
import logger from '../config/logger.js';
import config from '../config/index.js';

let redisClient;
let redisAvailable = false;

export const initRedis = async () => {
  try {
    // Skip Redis initialization in production if no Redis host is configured
    if (config.env === 'production' && !process.env.REDIS_HOST) {
      logger.warn('Redis not configured in production, skipping initialization');
      redisAvailable = false;
      return null;
    }

    redisClient = createClient({
      host: config.redis.host,
      port: config.redis.port,
      password: config.redis.password,
      retry_strategy: config.redis.retryStrategy,
      connect_timeout: 5000, // 5 second timeout
      lazyConnect: false
    });

    redisClient.on('error', (err) => {
      logger.error('Redis Client Error:', err);
      redisAvailable = false;
    });
    redisClient.on('connect', () => {
      logger.info('Redis connected');
      redisAvailable = true;
    });
    redisClient.on('ready', () => {
      logger.info('Redis ready');
      redisAvailable = true;
    });
    redisClient.on('reconnecting', () => {
      logger.warn('Redis reconnecting');
      redisAvailable = false;
    });
    redisClient.on('end', () => {
      logger.warn('Redis connection ended');
      redisAvailable = false;
    });

    // Add timeout to connect
    const connectPromise = redisClient.connect();
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Redis connection timeout')), 10000);
    });

    await Promise.race([connectPromise, timeoutPromise]);
    redisAvailable = true;
    return redisClient;
  } catch (error) {
    logger.warn('Redis not available, continuing without caching:', error.message);
    redisAvailable = false;
    return null;
  }
};

export const getRedisClient = () => {
  if (!redisClient || !redisAvailable) {
    throw new Error('Redis client not available');
  }
  return redisClient;
};

export const isRedisAvailable = () => redisAvailable;

export const closeRedis = async () => {
  if (redisClient) {
    await redisClient.quit();
  }
};

export const cache = {
  async get(key) {
    if (!redisAvailable) return null;
    try {
      const data = await redisClient.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      logger.error(`Cache get error for key ${key}:`, error);
      return null;
    }
  },

  async set(key, value, expirySeconds = 3600) {
    if (!redisAvailable) return false;
    try {
      await redisClient.setEx(key, expirySeconds, JSON.stringify(value));
      return true;
    } catch (error) {
      logger.error(`Cache set error for key ${key}:`, error);
      return false;
    }
  },

  async del(key) {
    if (!redisAvailable) return false;
    try {
      await redisClient.del(key);
      return true;
    } catch (error) {
      logger.error(`Cache del error for key ${key}:`, error);
      return false;
    }
  },

  async exists(key) {
    if (!redisAvailable) return false;
    try {
      return await redisClient.exists(key);
    } catch (error) {
      logger.error(`Cache exists error for key ${key}:`, error);
      return false;
    }
  },

  async incr(key, expirySeconds = 60) {
    if (!redisAvailable) return 1;
    try {
      const count = await redisClient.incr(key);
      if (count === 1) {
        await redisClient.expire(key, expirySeconds);
      }
      return count;
    } catch (error) {
      logger.error(`Cache incr error for key ${key}:`, error);
      return 1;
    }
  },

  async mget(keys) {
    if (!redisAvailable) return keys.map(() => null);
    try {
      const values = await redisClient.mGet(keys);
      return values.map(v => v ? JSON.parse(v) : null);
    } catch (error) {
      logger.error('Cache mget error:', error);
      return keys.map(() => null);
    }
  },

  async hset(key, field, value) {
    if (!redisAvailable) return false;
    try {
      await redisClient.hSet(key, field, JSON.stringify(value));
      return true;
    } catch (error) {
      logger.error(`Cache hset error for key ${key}:`, error);
      return false;
    }
  },

  async hget(key, field) {
    if (!redisAvailable) return null;
    try {
      const data = await redisClient.hGet(key, field);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      logger.error(`Cache hget error for key ${key}:`, error);
      return null;
    }
  },

  async hgetall(key) {
    try {
      const data = await redisClient.hGetAll(key);
      const parsed = {};
      for (const [field, value] of Object.entries(data)) {
        parsed[field] = JSON.parse(value);
      }
      return parsed;
    } catch (error) {
      logger.error(`Cache hgetall error for key ${key}:`, error);
      return {};
    }
  },

  async hdel(key, field) {
    try {
      await redisClient.hDel(key, field);
      return true;
    } catch (error) {
      logger.error(`Cache hdel error for key ${key}:`, error);
      return false;
    }
  },
};
