import express from 'express';
import * as projectController from '../controllers/projectController.js';
import { exportProject, exportTree } from '../controllers/exportController.js';
import { authenticate } from '../middleware/auth.js';
import { validate, createProjectSchema, updateProjectSchema, updateContentSchema } from '../middleware/validate.js';
import Joi from 'joi';

const router = express.Router();

// Export schemas
const exportProjectSchema = Joi.object({
  format: Joi.string().valid('txt', 'docx', 'pdf').default('txt'),
  includeMetadata: Joi.boolean().default(false)
});

const exportTreeSchema = Joi.object({
  format: Joi.string().valid('png', 'svg').default('png'),
  width: Joi.number().integer().min(400).max(4000).default(800),
  height: Joi.number().integer().min(400).max(4000).default(600),
  transparent: Joi.boolean().default(false)
});

// All routes require authentication
router.use(authenticate);

// Project CRUD
router.post('/', validate(createProjectSchema), projectController.createProject);
router.get('/', projectController.getProjects);
router.get('/:projectId', projectController.getProject);
router.patch('/:projectId', validate(updateProjectSchema), projectController.updateProject);
router.delete('/:projectId', projectController.deleteProject);
router.post('/:projectId/restore', projectController.restoreProject);

// Content management
router.put('/:projectId/content', validate(updateContentSchema), projectController.updateContent);

// Version history
router.get('/:projectId/versions', projectController.getVersionHistory);
router.get('/:projectId/versions/:versionId', projectController.getVersion);
router.post('/:projectId/versions/:versionId/restore', projectController.restoreVersion);

// Export endpoints
router.post('/:projectId/export', validate(exportProjectSchema), exportProject);
router.post('/:projectId/export-tree', validate(exportTreeSchema), exportTree);

export default router;
