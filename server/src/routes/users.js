import express from 'express';
import * as userController from '../controllers/userController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Public route for syncing Clerk user to our DB
router.post('/sync', userController.syncUser);

// Protected routes
router.get('/me', authenticate, userController.getMe);
router.patch('/preferences', authenticate, userController.updatePreferences);
router.delete('/me', authenticate, userController.deleteMe);

export default router;
