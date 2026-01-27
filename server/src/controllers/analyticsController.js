import { query } from '../config/database.js';
import logger from '../config/logger.js';
import { cache } from '../services/redisService.js';

export const getStats = async (req, res, next) => {
  try {
    const { period = 'month' } = req.query;
    const cacheKey = `stats:${req.auth.userId}:${period}`;
    
    // Check cache first
    let stats = await cache.get(cacheKey);
    
    if (stats) {
      return res.json({
        success: true,
        data: { stats, cached: true }
      });
    }
    
    // Calculate date range
    const now = new Date();
    let startDate;
    
    switch (period) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case 'year':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = null;
    }

    // Get total projects
    const projectsResult = await query(
      'SELECT COUNT(*) as count FROM projects WHERE user_id = $1',
      [req.auth.userId]
    );

    // Get completed projects
    const completedResult = await query(
      'SELECT COUNT(*) as count FROM projects WHERE user_id = $1 AND status = $2',
      [req.auth.userId, 'completed']
    );

    // Get total words written
    const wordsResult = await query(
      'SELECT SUM(current_word_count) as total FROM projects WHERE user_id = $1',
      [req.auth.userId]
    );

    // Get writing streak
    const streakResult = await query(
      `SELECT COUNT(DISTINCT date) as streak 
       FROM writing_streaks 
       WHERE user_id = $1 
       AND date >= CURRENT_DATE - INTERVAL '30 days'
       ORDER BY date DESC`,
      [req.auth.userId]
    );

    // Get milestones
    const milestonesResult = await query(
      'SELECT milestone_type, COUNT(*) as count FROM milestones WHERE user_id = $1 GROUP BY milestone_type',
      [req.auth.userId]
    );

    // Get period stats if applicable
    let periodStats = null;
    if (startDate) {
      const periodWords = await query(
        `SELECT SUM(word_count) as total 
         FROM analytics_events 
         WHERE user_id = $1 
         AND event_type = 'content_saved' 
         AND created_at >= $2`,
        [req.auth.userId, startDate]
      );

      const periodDays = await query(
        `SELECT COUNT(DISTINCT DATE(created_at)) as days 
         FROM analytics_events 
         WHERE user_id = $1 
         AND event_type = 'content_saved' 
         AND created_at >= $2`,
        [req.auth.userId, startDate]
      );

      periodStats = {
        wordsWritten: parseInt(periodWords.rows[0]?.total || 0),
        daysActive: parseInt(periodDays.rows[0]?.days || 0),
        averagePerDay: Math.round((periodWords.rows[0]?.total || 0) / (periodDays.rows[0]?.days || 1))
      };
    }

    stats = {
      totalProjects: parseInt(projectsResult.rows[0].count),
      completedProjects: parseInt(completedResult.rows[0].count),
      totalWordsWritten: parseInt(wordsResult.rows[0]?.total || 0),
      currentStreak: parseInt(streakResult.rows[0]?.streak || 0),
      milestones: milestonesResult.rows.reduce((acc, row) => {
        acc[row.milestone_type] = parseInt(row.count);
        return acc;
      }, {}),
      period: periodStats
    };

    // Cache for 1 hour
    await cache.set(cacheKey, stats, 3600);

    res.json({
      success: true,
      data: { stats }
    });
  } catch (error) {
    logger.error('Get stats error', { error: error.message });
    next(error);
  }
};

export const trackEvent = async (req, res, next) => {
  try {
    const { eventType, projectId, metadata } = req.body;

    if (!eventType) {
      return res.status(400).json({
        success: false,
        error: 'MISSING_EVENT_TYPE',
        message: 'Event type is required'
      });
    }

    await query(
      `INSERT INTO analytics_events (user_id, project_id, event_type, metadata)
       VALUES ($1, $2, $3, $4)`,
      [req.auth.userId, projectId || null, eventType, metadata || {}]
    );

    // Update writing streak if content_saved event
    if (eventType === 'content_saved') {
      const today = new Date().toISOString().split('T')[0];
      
      await query(
        `INSERT INTO writing_streaks (user_id, date, word_count)
         VALUES ($1, $2, $3)
         ON CONFLICT (user_id, date) 
         DO UPDATE SET word_count = writing_streaks.word_count + $3`,
        [req.auth.userId, today, metadata?.wordCount || 0]
      );
      
      // Invalidate stats cache
      await cache.del(`stats:${req.auth.userId}:week`);
      await cache.del(`stats:${req.auth.userId}:month`);
      await cache.del(`stats:${req.auth.userId}:year`);
      await cache.del(`streaks:${req.auth.userId}`);
    }

    res.status(201).json({
      success: true,
      message: 'Event tracked successfully'
    });
  } catch (error) {
    logger.error('Track event error', { error: error.message });
    next(error);
  }
};

export const getStreaks = async (req, res, next) => {
  try {
    const cacheKey = `streaks:${req.auth.userId}`;
    
    // Check cache first
    let streaksData = await cache.get(cacheKey);
    
    if (streaksData) {
      return res.json({
        success: true,
        data: { ...streaksData, cached: true }
      });
    }
    
    const streaks = await query(
      `SELECT date, word_count 
       FROM writing_streaks 
       WHERE user_id = $1 
       ORDER BY date DESC 
       LIMIT 30`,
      [req.auth.userId]
    );

    // Calculate current streak
    let currentStreak = 0;
    const today = new Date().toISOString().split('T')[0];
    const streakDates = streaks.rows.map(s => s.date);

    for (let i = 0; i < streakDates.length; i++) {
      const expectedDate = new Date(today);
      expectedDate.setDate(expectedDate.getDate() - i);
      const expectedDateStr = expectedDate.toISOString().split('T')[0];

      if (streakDates.includes(expectedDateStr)) {
        currentStreak++;
      } else {
        break;
      }
    }

    streaksData = {
      currentStreak,
      recentDays: streaks.rows
    };
    
    // Cache for 1 hour
    await cache.set(cacheKey, streaksData, 3600);

    res.json({
      success: true,
      data: streaksData
    });
  } catch (error) {
    logger.error('Get streaks error', { error: error.message });
    next(error);
  }
};
