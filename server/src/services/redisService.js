import { createClient } from 'redis';
import logger from '../config/logger.js';
import config from '../config/index.js';

let redisClient;
let redisAvailable = false;

export const initRedis = async () => {
  // Skip Redis initialization completely for now
  logger.warn('Redis initialization skipped');
  redisAvailable = false;
  return null;
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
