import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { rateLimiter } from '../middleware/rateLimiter.js';
import { getSuggestions } from '../controllers/suggestionsController.js';
import Joi from 'joi';

const router = express.Router();

const suggestionsSchema = Joi.object({
  context: Joi.string().required().max(500),
  limit: Joi.number().integer().min(1).max(5).default(3)
});

router.post('/', authenticate, rateLimiter(30, 60), validate(suggestionsSchema), getSuggestions);

export default router;
