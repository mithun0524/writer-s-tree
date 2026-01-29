import { Server } from 'socket.io';
import logger from './config/logger.js';
import pool from './config/database.js';
import { cache } from './services/redisService.js';

let io;

export const initializeWebSocket = (server, config) => {
  io = new Server(server, {
    cors: {
      origin: "",
      credentials: false,
      methods: ['GET', 'POST']
    },
    transports: ['websocket', 'polling']
  });

  // Store active connections
  const activeConnections = new Map();

  io.on('connection', (socket) => {
    logger.info('WebSocket connection established', { socketId: socket.id });

    // Authenticate connection - temporarily disabled for testing
    socket.on('authenticate', async (data) => {
      try {
        // Temporarily use mock user for testing
        const userId = 'test-user-123';

        // Skip user verification for testing
        // const { userId } = data;
        //
        // if (!userId) {
        //   socket.emit('error', { message: 'Missing user ID' });
        //   socket.disconnect();
        //   return;
        // }
        //
        // // Verify user exists
        // const userResult = await pool.query(
        //   'SELECT id FROM users WHERE clerk_user_id = $1',
        //   [userId]
        // );
        //
        // if (userResult.rows.length === 0) {
        //   socket.emit('error', { message: 'User not found' });
        //   socket.disconnect();
        //   return;
        // }

        socket.userId = userId;
        socket.join(`user:${userId}`);
        activeConnections.set(socket.id, userId);

        // Track active user in Redis
        await cache.hset(`active:users`, userId, {
          userId,
          socketId: socket.id,
          connectedAt: Date.now()
        });

        socket.emit('authenticated', { success: true });
        logger.info('WebSocket authenticated (mock)', { userId, socketId: socket.id });
      } catch (error) {
        logger.error('WebSocket authentication error', { error: error.message });
        socket.emit('error', { message: 'Authentication failed' });
        socket.disconnect();
      }
    });

    // Handle content sync
    socket.on('sync:content', async (data) => {
      try {
        if (!socket.userId) {
          socket.emit('error', { message: 'Not authenticated' });
          return;
        }

        const { projectId, content, wordCount, cursorPosition, version } = data;

        // Verify project ownership - temporarily disabled for testing
        // const projectResult = await pool.query(
        //   'SELECT id, current_word_count FROM projects WHERE id = $1 AND user_id = (SELECT id FROM users WHERE clerk_user_id = $2)',
        //   [projectId, socket.userId]
        // );
        //
        // if (projectResult.rows.length === 0) {
        //   socket.emit('error', { message: 'Project not found or unauthorized' });
        //   return;
        // }

        // For testing, allow access to any project
        const projectResult = await pool.query(
          'SELECT id, current_word_count FROM projects WHERE id = $1',
          [projectId]
        );

        if (projectResult.rows.length === 0) {
          socket.emit('error', { message: 'Project not found' });
          return;
        }

        // Get current version
        const versionResult = await pool.query(
          'SELECT version FROM project_content WHERE project_id = $1 AND is_current = true',
          [projectId]
        );

        const currentVersion = versionResult.rows[0]?.version || 0;

        // Check for conflicts
        if (version && version < currentVersion) {
          const currentContent = await pool.query(
            'SELECT content, word_count, version FROM project_content WHERE project_id = $1 AND is_current = true',
            [projectId]
          );

          socket.emit('sync:conflict', {
            projectId,
            serverVersion: currentVersion,
            clientVersion: version,
            serverContent: currentContent.rows[0].content,
            serverWordCount: currentContent.rows[0].word_count,
            message: 'Your changes conflict with recent updates'
          });
          return;
        }

        // Update content
        const newVersion = currentVersion + 1;
        const now = new Date();

        await pool.query('BEGIN');

        try {
          // Mark current version as not current
          await pool.query(
            'UPDATE project_content SET is_current = false WHERE project_id = $1 AND is_current = true',
            [projectId]
          );

          // Insert new version
          await pool.query(
            'INSERT INTO project_content (project_id, content, word_count, version, is_current) VALUES ($1, $2, $3, $4, true)',
            [projectId, content, wordCount, newVersion]
          );

          // Update project
          await pool.query(
            'UPDATE projects SET current_word_count = $1, last_edited_at = $2, updated_at = $2 WHERE id = $3',
            [wordCount, now, projectId]
          );

          // Check for milestones
          const project = projectResult.rows[0];
          const goalResult = await pool.query(
            'SELECT word_goal FROM projects WHERE id = $1',
            [projectId]
          );
          const wordGoal = goalResult.rows[0].word_goal;
          const percentage = (wordCount / wordGoal) * 100;

          const milestones = [
            { threshold: 25, name: '25_percent' },
            { threshold: 50, name: '50_percent' },
            { threshold: 75, name: '75_percent' },
            { threshold: 100, name: '100_percent' }
          ];

          for (const milestone of milestones) {
            if (percentage >= milestone.threshold) {
              // Check if milestone already achieved
              const existingMilestone = await pool.query(
                'SELECT id FROM milestones WHERE project_id = $1 AND milestone_type = $2',
                [projectId, milestone.name]
              );

              if (existingMilestone.rows.length === 0) {
                // Create milestone
                await pool.query(
                  'INSERT INTO milestones (user_id, project_id, milestone_type, achieved_at, word_count_at_achievement) VALUES ((SELECT id FROM users WHERE clerk_user_id = $1), $2, $3, $4, $5)',
                  [socket.userId, projectId, milestone.name, now, wordCount]
                );

                // Emit milestone event
                io.to(`user:${socket.userId}`).emit('milestone:reached', {
                  projectId,
                  milestone: milestone.name,
                  wordCount
                });
              }
            }
          }

          await pool.query('COMMIT');

          // Broadcast update to all user's devices
          io.to(`user:${socket.userId}`).emit('sync:update', {
            projectId,
            content,
            wordCount,
            version: newVersion,
            updatedAt: now.toISOString(),
            socketId: socket.id // Don't echo back to sender
          });

          logger.info('Content synced', { projectId, version: newVersion, wordCount });
        } catch (error) {
          await pool.query('ROLLBACK');
          throw error;
        }
      } catch (error) {
        logger.error('Content sync error', { error: error.message });
        socket.emit('error', { message: 'Failed to sync content' });
      }
    });

    // Handle cursor position sync
    socket.on('sync:cursor', (data) => {
      if (!socket.userId) return;

      const { projectId, cursorPosition } = data;
      
      // Broadcast to other devices
      socket.to(`user:${socket.userId}`).emit('cursor:update', {
        projectId,
        cursorPosition,
        socketId: socket.id
      });
    });

    // Handle disconnect
    socket.on('disconnect', async () => {
      activeConnections.delete(socket.id);
      
      // Remove from active users in Redis
      if (socket.userId) {
        await cache.hdel(`active:users`, socket.userId);
      }
      
      logger.info('WebSocket disconnected', { socketId: socket.id, userId: socket.userId });
    });

    // Handle errors
    socket.on('error', (error) => {
      logger.error('WebSocket error', { error: error.message, socketId: socket.id });
    });
  });

  // Return io instance for use in other parts of the app
  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error('WebSocket not initialized');
  }
  return io;
};
