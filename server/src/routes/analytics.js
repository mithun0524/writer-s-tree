import express from 'express';
import { clerkAuth } from '../middleware/clerkAuth.js';
import { validate } from '../middleware/validate.js';
import { getStats, trackEvent, getStreaks } from '../controllers/analyticsController.js';
import Joi from 'joi';

const router = express.Router();

const trackEventSchema = Joi.object({
  eventType: Joi.string().required().valid(
    'project_created',
    'project_completed',
    'milestone_reached',
    'bloom_animation_viewed',
    'tree_exported',
    'content_exported',
    'content_saved',
    'settings_changed'
  ),
  projectId: Joi.string().uuid().optional(),
  metadata: Joi.object().optional()
});

router.get('/stats', clerkAuth, getStats);
router.get('/streaks', clerkAuth, getStreaks);
router.post('/event', clerkAuth, validate(trackEventSchema), trackEvent);

export default router;
