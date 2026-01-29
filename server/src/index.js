import express from 'express';
import { createServer } from 'http';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import swaggerUi from 'swagger-ui-express';
import config from './config/index.js';
import logger from './config/logger.js';
import pool from './config/database.js';
import { swaggerSpec } from './config/swagger.js';
import { createTables } from './models/schema.js';
import userRoutes from './routes/users.js';
import projectRoutes from './routes/projects.js';
import suggestionsRoutes from './routes/suggestions.js';
import analyticsRoutes from './routes/analytics.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';
import { initializeWebSocket } from './websocket.js';
import { initRedis, closeRedis } from './services/redisService.js';
import { clerkWebhookHandler } from './webhooks/clerkWebhook.js';
import { clerkAuth } from './middleware/clerkAuth.js';

// Debug logging
console.log('🚀 Starting Writer\'s Tree server...');
console.log('Environment:', config.env);
console.log('Port:', config.port);
console.log('Database URL exists:', !!process.env.DATABASE_URL);

const app = express();
const server = createServer(app);

// Security middleware
app.use(helmet());
app.use(cors({
    origin: "",
    credentials: false,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']
}));

// Compression
app.use(compression());

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const authLimiter = rateLimit({
  windowMs: config.rateLimit.auth.windowMs,
  max: config.rateLimit.auth.max,
  message: { success: false, error: 'TOO_MANY_REQUESTS', message: 'Too many attempts, please try again later' }
});

const apiLimiter = rateLimit({
  windowMs: config.rateLimit.api.windowMs,
  max: config.rateLimit.api.max,
  message: { success: false, error: 'TOO_MANY_REQUESTS', message: 'Too many requests, please slow down' }
});

// Health check
app.get('/health', async (req, res) => {
  try {
    // Check database connection
    const dbCheck = await pool.query('SELECT 1');
    
    // Check Redis connection
    const { isRedisAvailable } = await import('./services/redisService.js');
    let redisStatus = 'healthy';
    try {
      if (!isRedisAvailable()) {
        redisStatus = 'unavailable';
      }
    } catch (redisError) {
      redisStatus = 'unhealthy';
    }
    
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: config.env,
      services: {
        database: dbCheck.rows ? 'healthy' : 'unhealthy',
        redis: redisStatus,
        api: 'healthy'
      }
    };
    
    res.json(health);
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

// API routes
const API_PREFIX = `/api/${config.apiVersion}`;

// Test endpoint for development (remove in production)
if (config.env === 'development') {
  app.get(`${API_PREFIX}/test-auth`, clerkAuth, (req, res) => {
    res.json({
      success: true,
      message: 'Authentication successful!',
      userId: req.auth.userId,
      user: req.auth
    });
  });
}

// Swagger documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: "Writer's Tree API Documentation"
}));

// Webhook endpoint (Clerk sends user events)
app.post(`${API_PREFIX}/webhooks/clerk`, express.raw({ type: 'application/json' }), clerkWebhookHandler);

app.use(`${API_PREFIX}/users`, userRoutes);
app.use(`${API_PREFIX}/projects`, apiLimiter, projectRoutes);
app.use(`${API_PREFIX}/suggestions`, apiLimiter, suggestionsRoutes);
app.use(`${API_PREFIX}/analytics`, analyticsRoutes);

// Error handling
app.use(notFound);
app.use(errorHandler);

// Initialize database and start server
const startServer = async () => {
  try {
    // Initialize Redis (optional)
    try {
      await initRedis();
      logger.info('Redis initialized');
    } catch (redisError) {
      logger.warn('Redis initialization failed, continuing without caching:', redisError.message);
    }

    // Create database tables
    await createTables();
    logger.info('Database initialized');

    // Initialize WebSocket
    initializeWebSocket(server, config);
    logger.info('WebSocket initialized');

    // Start server
    server.listen(config.port, () => {
      logger.info(`✓ Server running on port ${config.port}`);
      logger.info(`✓ Environment: ${config.env}`);
      logger.info(`✓ API URL: http://localhost:${config.port}${API_PREFIX}`);
      logger.info(`✓ WebSocket URL: ws://localhost:${config.port}`);
    });

    // Graceful shutdown
    process.on('SIGTERM', async () => {
      logger.info('SIGTERM signal received: closing HTTP server');
      await closeRedis();
      server.close(() => {
        logger.info('HTTP server closed');
        process.exit(0);
      });
    });

    process.on('SIGINT', async () => {
      logger.info('SIGINT signal received: closing HTTP server');
      await closeRedis();
      server.close(() => {
        logger.info('HTTP server closed');
        process.exit(0);
      });
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

export default app;
