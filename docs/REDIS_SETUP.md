# Redis Caching Setup Guide

## Overview

Redis is already configured in `docker-compose.yml`. This guide covers implementation details for caching user preferences, sessions, and rate limiting.

---

## What Redis Does for WritersTree

### 1. **Session Management**
- Store user session tokens
- Fast authentication lookups
- Automatic session expiration

### 2. **Rate Limiting**
- Track API request counts per user
- Prevent abuse and spam
- Sliding window implementation

### 3. **Caching**
- User preferences (theme, settings)
- Project metadata (word count, last modified)
- Analytics data (writing streaks, stats)

### 4. **Real-time Features**
- Active users list
- Cursor positions
- Presence tracking

---

## Setup Instructions

### 1. Install Redis Client

```bash
npm install redis
```

### 2. Create Redis Service (server/src/services/redisService.js)

```javascript
import { createClient } from 'redis';
import logger from '../utils/logger.js';

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
        return retries * 100; // Exponential backoff
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

// Cache helpers
export const cache = {
  // Get cached data
  async get(key) {
    try {
      const data = await redisClient.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      logger.error(`Cache get error for key ${key}:`, error);
      return null;
    }
  },

  // Set cache with expiration (default 1 hour)
  async set(key, value, expirySeconds = 3600) {
    try {
      await redisClient.setEx(key, expirySeconds, JSON.stringify(value));
      return true;
    } catch (error) {
      logger.error(`Cache set error for key ${key}:`, error);
      return false;
    }
  },

  // Delete cache
  async del(key) {
    try {
      await redisClient.del(key);
      return true;
    } catch (error) {
      logger.error(`Cache del error for key ${key}:`, error);
      return false;
    }
  },

  // Check if key exists
  async exists(key) {
    try {
      return await redisClient.exists(key);
    } catch (error) {
      logger.error(`Cache exists error for key ${key}:`, error);
      return false;
    }
  },

  // Increment counter (for rate limiting)
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

  // Get multiple keys
  async mget(keys) {
    try {
      const values = await redisClient.mGet(keys);
      return values.map(v => v ? JSON.parse(v) : null);
    } catch (error) {
      logger.error('Cache mget error:', error);
      return keys.map(() => null);
    }
  },

  // Set hash (for user settings)
  async hset(key, field, value) {
    try {
      await redisClient.hSet(key, field, JSON.stringify(value));
      return true;
    } catch (error) {
      logger.error(`Cache hset error for key ${key}:`, error);
      return false;
    }
  },

  // Get hash
  async hget(key, field) {
    try {
      const data = await redisClient.hGet(key, field);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      logger.error(`Cache hget error for key ${key}:`, error);
      return null;
    }
  },

  // Get all hash fields
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
};
```

### 3. Update index.js to Initialize Redis

```javascript
import { initRedis, closeRedis } from './services/redisService.js';

// Add to startup
const startServer = async () => {
  try {
    // Initialize Redis
    await initRedis();
    logger.info('Redis initialized');

    // ... existing code

    // Graceful shutdown
    process.on('SIGTERM', async () => {
      logger.info('SIGTERM signal received: closing HTTP server');
      await closeRedis();
      server.close(() => {
        logger.info('HTTP server closed');
      });
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};
```

---

## Implementation Examples

### 1. User Preferences Caching

```javascript
// server/src/controllers/userController.js
import { cache } from '../services/redisService.js';

export const getUserPreferences = async (req, res) => {
  const userId = req.userId;
  const cacheKey = `user:${userId}:preferences`;

  try {
    // Check cache first
    let preferences = await cache.get(cacheKey);

    if (!preferences) {
      // Cache miss - fetch from database
      preferences = await pool.query(
        'SELECT preferences FROM users WHERE id = $1',
        [userId]
      );
      preferences = preferences.rows[0]?.preferences || {};

      // Store in cache for 1 hour
      await cache.set(cacheKey, preferences, 3600);
    }

    res.json({ preferences });
  } catch (error) {
    logger.error('Get preferences error:', error);
    res.status(500).json({ error: 'Failed to get preferences' });
  }
};

export const updateUserPreferences = async (req, res) => {
  const userId = req.userId;
  const { preferences } = req.body;
  const cacheKey = `user:${userId}:preferences`;

  try {
    // Update database
    await pool.query(
      'UPDATE users SET preferences = $1 WHERE id = $2',
      [preferences, userId]
    );

    // Update cache
    await cache.set(cacheKey, preferences, 3600);

    res.json({ success: true, preferences });
  } catch (error) {
    logger.error('Update preferences error:', error);
    res.status(500).json({ error: 'Failed to update preferences' });
  }
};
```

### 2. Rate Limiting Middleware

```javascript
// server/src/middleware/rateLimiter.js
import { cache } from '../services/redisService.js';

export const rateLimiter = (maxRequests = 100, windowSeconds = 60) => {
  return async (req, res, next) => {
    const userId = req.userId || req.ip;
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
      // If Redis fails, allow request (fail open)
      logger.error('Rate limiter error:', error);
      next();
    }
  };
};

// Usage in routes
import { rateLimiter } from '../middleware/rateLimiter.js';

router.post('/suggestions', 
  authenticate, 
  rateLimiter(30, 60), // 30 requests per minute
  getSuggestions
);
```

### 3. Project Metadata Caching

```javascript
// server/src/controllers/projectController.js
import { cache } from '../services/redisService.js';

export const getProject = async (req, res) => {
  const { projectId } = req.params;
  const cacheKey = `project:${projectId}`;

  try {
    // Check cache
    let project = await cache.get(cacheKey);

    if (!project) {
      // Fetch from database
      const result = await pool.query(
        'SELECT * FROM projects WHERE id = $1 AND user_id = $2',
        [projectId, req.userId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Project not found' });
      }

      project = result.rows[0];

      // Cache for 5 minutes
      await cache.set(cacheKey, project, 300);
    }

    res.json({ project });
  } catch (error) {
    logger.error('Get project error:', error);
    res.status(500).json({ error: 'Failed to get project' });
  }
};

export const updateProject = async (req, res) => {
  const { projectId } = req.params;
  const { content, title } = req.body;
  const cacheKey = `project:${projectId}`;

  try {
    // Update database
    const result = await pool.query(
      `UPDATE projects 
       SET content = $1, title = $2, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $3 AND user_id = $4 
       RETURNING *`,
      [content, title, projectId, req.userId]
    );

    const project = result.rows[0];

    // Invalidate cache
    await cache.del(cacheKey);

    // Optionally re-cache immediately
    await cache.set(cacheKey, project, 300);

    res.json({ project });
  } catch (error) {
    logger.error('Update project error:', error);
    res.status(500).json({ error: 'Failed to update project' });
  }
};
```

### 4. Writing Streak Caching

```javascript
// server/src/controllers/analyticsController.js
import { cache } from '../services/redisService.js';

export const getStreaks = async (req, res) => {
  const userId = req.userId;
  const cacheKey = `streaks:${userId}`;

  try {
    // Check cache (streaks don't change often)
    let streaks = await cache.get(cacheKey);

    if (!streaks) {
      // Calculate streaks from database
      const events = await pool.query(
        `SELECT DISTINCT DATE(created_at) as date 
         FROM analytics_events 
         WHERE user_id = $1 AND event_type = 'word_written'
         AND created_at >= CURRENT_DATE - INTERVAL '30 days'
         ORDER BY date DESC`,
        [userId]
      );

      streaks = calculateStreaks(events.rows);

      // Cache for 1 hour
      await cache.set(cacheKey, streaks, 3600);
    }

    res.json({ streaks });
  } catch (error) {
    logger.error('Get streaks error:', error);
    res.status(500).json({ error: 'Failed to get streaks' });
  }
};

export const trackEvent = async (req, res) => {
  const userId = req.userId;

  try {
    // Track event in database
    await pool.query(
      'INSERT INTO analytics_events (user_id, event_type, metadata) VALUES ($1, $2, $3)',
      [userId, req.body.event_type, req.body.metadata]
    );

    // Invalidate streak cache (will be recalculated on next request)
    await cache.del(`streaks:${userId}`);

    res.json({ success: true });
  } catch (error) {
    logger.error('Track event error:', error);
    res.status(500).json({ error: 'Failed to track event' });
  }
};
```

### 5. Active Users Tracking (WebSocket)

```javascript
// server/src/websocket.js
import { cache } from './services/redisService.js';

io.on('connection', async (socket) => {
  socket.on('authenticate', async ({ userId, projectId }) => {
    // Track active user
    const activeUsersKey = `active:${projectId}`;
    await cache.hset(activeUsersKey, userId, {
      userId,
      socketId: socket.id,
      connectedAt: Date.now(),
    });

    // Set expiration for cleanup
    await redisClient.expire(activeUsersKey, 86400); // 24 hours

    // Get all active users
    const activeUsers = await cache.hgetall(activeUsersKey);
    io.to(projectId).emit('users:online', { users: Object.values(activeUsers) });
  });

  socket.on('disconnect', async () => {
    const { userId, projectId } = socket.data;
    
    if (userId && projectId) {
      const activeUsersKey = `active:${projectId}`;
      await redisClient.hDel(activeUsersKey, userId);

      const activeUsers = await cache.hgetall(activeUsersKey);
      io.to(projectId).emit('users:online', { users: Object.values(activeUsers) });
    }
  });
});
```

---

## Cache Invalidation Strategies

### 1. Time-Based Expiration (TTL)
```javascript
// Short-lived data (5 minutes)
await cache.set('project:123', project, 300);

// Medium-lived data (1 hour)
await cache.set('user:456:preferences', preferences, 3600);

// Long-lived data (24 hours)
await cache.set('analytics:stats', stats, 86400);
```

### 2. Manual Invalidation
```javascript
// When data changes
await cache.del('project:123');

// Multiple keys
await redisClient.del(['project:123', 'user:456:projects']);
```

### 3. Cache-Aside Pattern
```javascript
// Always try cache first, fallback to database
const getData = async (key, fetchFunction, ttl = 3600) => {
  let data = await cache.get(key);
  
  if (!data) {
    data = await fetchFunction();
    await cache.set(key, data, ttl);
  }
  
  return data;
};
```

### 4. Write-Through Pattern
```javascript
// Update both cache and database
const updateData = async (key, data, updateFunction) => {
  await updateFunction(data); // Update DB
  await cache.set(key, data); // Update cache
};
```

---

## Environment Variables

Add to `.env`:

```env
# Redis Configuration
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=          # Optional, for production
REDIS_TLS=false          # Set to true for production
REDIS_MAX_RETRIES=10
```

---

## Testing Redis

```javascript
// server/src/tests/redis.test.js
import { initRedis, cache, closeRedis } from '../services/redisService.js';

describe('Redis Cache', () => {
  beforeAll(async () => {
    await initRedis();
  });

  afterAll(async () => {
    await closeRedis();
  });

  test('should set and get cache', async () => {
    await cache.set('test:key', { value: 'hello' }, 60);
    const result = await cache.get('test:key');
    expect(result).toEqual({ value: 'hello' });
  });

  test('should increment counter', async () => {
    const count1 = await cache.incr('test:counter', 60);
    const count2 = await cache.incr('test:counter', 60);
    expect(count2).toBe(count1 + 1);
  });

  test('should delete cache', async () => {
    await cache.set('test:delete', 'value', 60);
    await cache.del('test:delete');
    const result = await cache.get('test:delete');
    expect(result).toBeNull();
  });
});
```

---

## Production Considerations

### 1. **Redis Cluster** (for high availability)
```javascript
import { Cluster } from 'redis';

const cluster = new Cluster([
  { host: 'redis-1', port: 6379 },
  { host: 'redis-2', port: 6379 },
  { host: 'redis-3', port: 6379 },
]);
```

### 2. **Monitoring**
- Track cache hit/miss rates
- Monitor memory usage
- Set up alerts for connection failures

### 3. **Security**
- Enable Redis AUTH password
- Use TLS for encryption
- Restrict network access (VPC)

### 4. **Backup**
- Redis persistence (AOF + RDB)
- Daily snapshots to S3
- Test restore procedures

---

## When to Use Redis

✅ **Use Redis for:**
- Session management
- Rate limiting
- Frequently accessed data (user preferences)
- Real-time features (active users, presence)
- Analytics aggregation

❌ **Don't use Redis for:**
- Primary data storage (use PostgreSQL)
- Large files (>1MB per key)
- Data that must never be lost (use DB)
- Complex queries (use DB with indexes)

---

## Performance Tips

1. **Use pipelines for bulk operations**:
```javascript
const pipeline = redisClient.multi();
pipeline.set('key1', 'value1');
pipeline.set('key2', 'value2');
await pipeline.exec();
```

2. **Use hashes for related data**:
```javascript
// Better than multiple keys
await cache.hset('user:123', 'name', 'John');
await cache.hset('user:123', 'email', 'john@example.com');
```

3. **Set appropriate TTLs**:
```javascript
// Don't cache forever - set reasonable expiration
await cache.set(key, value, 3600); // 1 hour
```

4. **Monitor memory usage**:
```javascript
const info = await redisClient.info('memory');
console.log(info); // Check used_memory
```

---

## Next Steps

1. ✅ Redis is already configured in `docker-compose.yml`
2. Install Redis client: `npm install redis`
3. Create `redisService.js` with code above
4. Update `index.js` to initialize Redis
5. Implement caching in controllers
6. Add rate limiting middleware
7. Test with `npm test`
8. Monitor cache hit rates in production

**Start Docker services:**
```bash
cd server
docker-compose up -d
```

**Verify Redis is running:**
```bash
docker-compose ps
docker exec -it writerstree-redis redis-cli ping
# Should return: PONG
```
