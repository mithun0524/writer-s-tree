import express from 'express';
import * as userController from '../controllers/userController.js';
import { clerkAuth } from '../middleware/clerkAuth.js';

const router = express.Router();

// Protected routes (require authentication)
router.get('/me', clerkAuth, userController.getMe);
router.patch('/preferences', clerkAuth, userController.updatePreferences);
router.delete('/me', clerkAuth, userController.deleteMe);

export default router;
