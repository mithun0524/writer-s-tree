import { createClient } from 'redis';
import logger from '../config/logger.js';

let redisClient;

export const initRedis = async () => {
  redisClient = createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    socket: {
      reconnectStrategy: (retries) => {
        if (retries > 10) {
          logger.error('Redis connection failed after 10 retries');
          return new Error('Redis connection failed');
        }
        return retries * 100;
      },
    },
  });

  redisClient.on('error', (err) => logger.error('Redis Client Error', err));
  redisClient.on('connect', () => logger.info('Redis connected'));
  redisClient.on('ready', () => logger.info('Redis ready'));
  redisClient.on('reconnecting', () => logger.warn('Redis reconnecting'));

  await redisClient.connect();
  return redisClient;
};

export const getRedisClient = () => {
  if (!redisClient) {
    throw new Error('Redis client not initialized. Call initRedis() first.');
  }
  return redisClient;
};

export const closeRedis = async () => {
  if (redisClient) {
    await redisClient.quit();
  }
};

export const cache = {
  async get(key) {
    try {
      const data = await redisClient.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      logger.error(`Cache get error for key ${key}:`, error);
      return null;
    }
  },

  async set(key, value, expirySeconds = 3600) {
    try {
      await redisClient.setEx(key, expirySeconds, JSON.stringify(value));
      return true;
    } catch (error) {
      logger.error(`Cache set error for key ${key}:`, error);
      return false;
    }
  },

  async del(key) {
    try {
      await redisClient.del(key);
      return true;
    } catch (error) {
      logger.error(`Cache del error for key ${key}:`, error);
      return false;
    }
  },

  async exists(key) {
    try {
      return await redisClient.exists(key);
    } catch (error) {
      logger.error(`Cache exists error for key ${key}:`, error);
      return false;
    }
  },

  async incr(key, expirySeconds = 60) {
    try {
      const count = await redisClient.incr(key);
      if (count === 1) {
        await redisClient.expire(key, expirySeconds);
      }
      return count;
    } catch (error) {
      logger.error(`Cache incr error for key ${key}:`, error);
      return 0;
    }
  },

  async mget(keys) {
    try {
      const values = await redisClient.mGet(keys);
      return values.map(v => v ? JSON.parse(v) : null);
    } catch (error) {
      logger.error('Cache mget error:', error);
      return keys.map(() => null);
    }
  },

  async hset(key, field, value) {
    try {
      await redisClient.hSet(key, field, JSON.stringify(value));
      return true;
    } catch (error) {
      logger.error(`Cache hset error for key ${key}:`, error);
      return false;
    }
  },

  async hget(key, field) {
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
