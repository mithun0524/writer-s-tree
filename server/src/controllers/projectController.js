import * as Project from '../models/Project.js';
import { cache } from '../services/redisService.js';

export const createProject = async (req, res, next) => {
  try {
    const project = await Project.createProject(req.userId, req.body);

    res.status(201).json({
      success: true,
      message: 'Project created successfully',
      data: { project }
    });
  } catch (error) {
    next(error);
  }
};

export const getProjects = async (req, res, next) => {
  try {
    const { status, limit = 50, offset = 0 } = req.query;

    const projects = await Project.getUserProjects(req.userId, {
      status,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      success: true,
      data: {
        projects,
        pagination: {
          limit: parseInt(limit),
          offset: parseInt(offset),
          total: projects.length
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getProject = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const cacheKey = `project:${projectId}`;

    // Check cache first
    let project = await cache.get(cacheKey);

    if (!project) {
      // Fetch from database
      project = await Project.getProjectById(projectId, req.userId);

      if (!project) {
        return res.status(404).json({
        success: false,
        error: 'PROJECT_NOT_FOUND',
        message: 'Project not found'
      });
    }

      // Cache for 5 minutes
      await cache.set(cacheKey, project, 300);
    }

    res.json({
      success: true,
      data: { project }
    });
  } catch (error) {
    next(error);
  }
};

export const updateProject = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const cacheKey = `project:${projectId}`;

    const project = await Project.updateProject(projectId, req.userId, req.body);

    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'PROJECT_NOT_FOUND',
        message: 'Project not found'
      });
    }

    // Invalidate cache
    await cache.del(cacheKey);

    res.json({
      success: true,
      message: 'Project updated successfully',
      data: { project }
    });
  } catch (error) {
    next(error);
  }
};

export const deleteProject = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const { permanent = false } = req.query;
    const cacheKey = `project:${projectId}`;

    await Project.deleteProject(projectId, req.userId, permanent === 'true');

    // Invalidate cache
    await cache.del(cacheKey);

    res.json({
      success: true,
      message: permanent === 'true' ? 'Project deleted permanently' : 'Project archived successfully'
    });
  } catch (error) {
    next(error);
  }
};

export const restoreProject = async (req, res, next) => {
  try {
    const { projectId } = req.params;

    const project = await Project.restoreProject(projectId, req.userId);

    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'PROJECT_NOT_FOUND',
        message: 'Project not found'
      });
    }

    res.json({
      success: true,
      message: 'Project restored successfully',
      data: { project }
    });
  } catch (error) {
    next(error);
  }
};

export const updateContent = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const { content, wordCount, characterCount, cursorPosition, version } = req.body;

    // Check for version conflict if client sends version
    if (version !== undefined) {
      const currentVersion = await Project.getCurrentVersion(projectId, req.userId);
      
      if (currentVersion && version < currentVersion.version) {
        return res.status(409).json({
          success: false,
          error: 'VERSION_CONFLICT',
          message: 'Your changes conflict with recent updates',
          data: {
            serverVersion: currentVersion.version,
            clientVersion: version,
            serverContent: currentVersion.content,
            serverWordCount: currentVersion.word_count,
            serverUpdatedAt: currentVersion.updated_at
          }
        });
      }
    }

    const result = await Project.updateProjectContent(projectId, req.userId, {
      content,
      wordCount,
      characterCount,
      cursorPosition
    });

    res.json({
      success: true,
      message: 'Content saved successfully',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

export const getVersionHistory = async (req, res, next) => {
  try {
    const { projectId } = req.params;

    const versions = await Project.getVersionHistory(projectId, req.userId);

    if (!versions) {
      return res.status(404).json({
        success: false,
        error: 'PROJECT_NOT_FOUND',
        message: 'Project not found'
      });
    }

    res.json({
      success: true,
      data: { versions }
    });
  } catch (error) {
    next(error);
  }
};

export const getVersion = async (req, res, next) => {
  try {
    const { projectId, versionId } = req.params;

    const version = await Project.getVersionById(versionId, projectId, req.userId);

    if (!version) {
      return res.status(404).json({
        success: false,
        error: 'VERSION_NOT_FOUND',
        message: 'Version not found'
      });
    }

    res.json({
      success: true,
      data: { version }
    });
  } catch (error) {
    next(error);
  }
};

export const restoreVersion = async (req, res, next) => {
  try {
    const { projectId, versionId } = req.params;

    const result = await Project.restoreVersion(versionId, projectId, req.userId);

    if (!result) {
      return res.status(404).json({
        success: false,
        error: 'VERSION_NOT_FOUND',
        message: 'Version not found'
      });
    }

    res.json({
      success: true,
      message: 'Version restored successfully',
      data: result
    });
  } catch (error) {
    next(error);
  }
};
