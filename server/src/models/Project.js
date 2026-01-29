import crypto from 'crypto';
import { query } from '../config/database.js';

// Helper function to ensure user exists (for testing)
const ensureUserExists = async (userId) => {
  try {
    const existingUser = await query('SELECT id FROM users WHERE id = $1', [userId]);
    if (existingUser.rows.length === 0) {
      // Create test user
      await query(
        `INSERT INTO users (id, email, full_name, clerk_created_at)
         VALUES ($1, $2, $3, $4)`,
        [userId, 'test@example.com', 'Test User', new Date()]
      );
      console.log(`Created test user: ${userId}`);
    }
  } catch (error) {
    console.error('Error ensuring user exists:', error);
    // Continue anyway - the query might still work
  }
};

export const createProject = async (userId, { title = 'Untitled Project', wordGoal = 50000, treeStyle = 'oak', treeSeason = 'summer' }) => {
  // Ensure user exists (create if not for testing)
  await ensureUserExists(userId);

  const treeSeed = crypto.createHash('sha256')
    .update(`${userId}-${Date.now()}-${Math.random()}`)
    .digest('hex');

  const result = await query(
    `INSERT INTO projects (user_id, title, word_goal, tree_seed, tree_style, tree_season)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [userId, title, wordGoal, treeSeed, treeStyle, treeSeason]
  );

  const project = result.rows[0];

  // Create initial empty content
  await query(
    `INSERT INTO project_content (project_id, content, word_count, character_count)
     VALUES ($1, $2, $3, $4)`,
    [project.id, '', 0, 0]
  );

  return project;
};

export const getUserProjects = async (userId, { status = null, limit = 50, offset = 0 }) => {
  // Ensure user exists (create if not for testing)
  await ensureUserExists(userId);

  let queryText = `
    SELECT p.*, pc.content, pc.word_count, pc.character_count, pc.cursor_position
    FROM projects p
    LEFT JOIN project_content pc ON p.id = pc.project_id AND pc.is_current = TRUE
    WHERE p.user_id = $1
  `;
  
  const params = [userId];
  let paramIndex = 2;

  if (status) {
    queryText += ` AND p.status = $${paramIndex}`;
    params.push(status);
    paramIndex++;
  }

  queryText += ` ORDER BY p.last_edited_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
  params.push(limit, offset);

  const result = await query(queryText, params);
  return result.rows;
};

export const getProjectById = async (projectId, userId) => {
  const result = await query(
    `SELECT p.*, pc.content, pc.word_count, pc.character_count, pc.cursor_position, pc.version
     FROM projects p
     LEFT JOIN project_content pc ON p.id = pc.project_id AND pc.is_current = TRUE
     WHERE p.id = $1 AND p.user_id = $2`,
    [projectId, userId]
  );

  return result.rows[0];
};

export const updateProject = async (projectId, userId, updates) => {
  const allowedFields = ['title', 'word_goal', 'status', 'tree_style', 'tree_season'];
  const fields = Object.keys(updates).filter(key => allowedFields.includes(key));
  
  if (fields.length === 0) return null;

  const setClause = fields.map((field, idx) => `${field} = $${idx + 3}`).join(', ');
  const values = [projectId, userId, ...fields.map(field => updates[field])];

  const result = await query(
    `UPDATE projects SET ${setClause}, updated_at = NOW() 
     WHERE id = $1 AND user_id = $2 
     RETURNING *`,
    values
  );

  return result.rows[0];
};

export const deleteProject = async (projectId, userId, permanent = false) => {
  if (permanent) {
    await query('DELETE FROM projects WHERE id = $1 AND user_id = $2', [projectId, userId]);
  } else {
    await query(
      'UPDATE projects SET status = $1, updated_at = NOW() WHERE id = $2 AND user_id = $3',
      ['archived', projectId, userId]
    );
  }
  return true;
};

export const restoreProject = async (projectId, userId) => {
  const result = await query(
    `UPDATE projects SET status = 'active', updated_at = NOW() 
     WHERE id = $1 AND user_id = $2 
     RETURNING *`,
    [projectId, userId]
  );

  return result.rows[0];
};

export const updateProjectContent = async (projectId, userId, { content, wordCount, characterCount, cursorPosition }) => {
  // Get current version
  const currentResult = await query(
    'SELECT version FROM project_content WHERE project_id = $1 AND is_current = TRUE',
    [projectId]
  );

  const currentVersion = currentResult.rows[0]?.version || 0;
  const newVersion = currentVersion + 1;

  // Mark current as not current
  await query(
    'UPDATE project_content SET is_current = FALSE WHERE project_id = $1',
    [projectId]
  );

  // Insert new version
  await query(
    `INSERT INTO project_content (project_id, content, word_count, character_count, cursor_position, version, is_current)
     VALUES ($1, $2, $3, $4, $5, $6, TRUE)`,
    [projectId, content, wordCount, characterCount, cursorPosition || 0, newVersion]
  );

  // Update project stats
  await query(
    `UPDATE projects SET current_word_count = $1, last_edited_at = NOW(), updated_at = NOW() 
     WHERE id = $2`,
    [wordCount, projectId]
  );

  // Check for milestones
  const project = await query('SELECT word_goal, current_word_count FROM projects WHERE id = $1', [projectId]);
  if (project.rows[0]) {
    const percentage = (wordCount / project.rows[0].word_goal) * 100;
    const milestones = [25, 50, 75, 100];
    
    for (const milestone of milestones) {
      if (percentage >= milestone) {
        const exists = await query(
          'SELECT id FROM milestones WHERE project_id = $1 AND milestone_type = $2',
          [projectId, `${milestone}%`]
        );
        
        if (exists.rows.length === 0) {
          await query(
            'INSERT INTO milestones (user_id, project_id, milestone_type, word_count) VALUES ($1, $2, $3, $4)',
            [userId, projectId, `${milestone}%`, wordCount]
          );
        }
      }
    }
  }

  // Create version history snapshot every 1000 words or milestone
  if (wordCount % 1000 === 0 || [25, 50, 75, 100].some(m => Math.abs(percentage - m) < 0.1)) {
    await createVersionSnapshot(projectId, content, wordCount, newVersion);
  }

  return {
    version: newVersion,
    wordCount,
    milestoneReached: null // TODO: return milestone data if reached
  };
};

const createVersionSnapshot = async (projectId, content, wordCount, version) => {
  await query(
    `INSERT INTO version_history (project_id, content, word_count, version)
     VALUES ($1, $2, $3, $4)`,
    [projectId, content, wordCount, version]
  );

  // Keep only last 10 versions
  await query(
    `DELETE FROM version_history 
     WHERE project_id = $1 
     AND id NOT IN (
       SELECT id FROM version_history 
       WHERE project_id = $1 
       ORDER BY created_at DESC 
       LIMIT 10
     )`,
    [projectId]
  );
};

export const getVersionHistory = async (projectId, userId) => {
  // Verify ownership
  const projectCheck = await query('SELECT id FROM projects WHERE id = $1 AND user_id = $2', [projectId, userId]);
  if (projectCheck.rows.length === 0) return null;

  const result = await query(
    `SELECT id, word_count, version, created_at 
     FROM version_history 
     WHERE project_id = $1 
     ORDER BY created_at DESC 
     LIMIT 10`,
    [projectId]
  );

  return result.rows;
};

export const getVersionById = async (versionId, projectId, userId) => {
  const result = await query(
    `SELECT vh.* 
     FROM version_history vh
     JOIN projects p ON vh.project_id = p.id
     WHERE vh.id = $1 AND vh.project_id = $2 AND p.user_id = $3`,
    [versionId, projectId, userId]
  );

  return result.rows[0];
};

export const restoreVersion = async (versionId, projectId, userId) => {
  const version = await getVersionById(versionId, projectId, userId);
  if (!version) return null;

  return await updateProjectContent(projectId, userId, {
    content: version.content,
    wordCount: version.word_count,
    characterCount: version.content.length,
    cursorPosition: 0
  });
};

export const getCurrentVersion = async (projectId, userId) => {
  const result = await query(
    `SELECT pc.version, pc.content, pc.word_count, pc.updated_at
     FROM project_content pc
     JOIN projects p ON pc.project_id = p.id
     WHERE pc.project_id = $1 AND pc.is_current = TRUE AND p.user_id = $2`,
    [projectId, userId]
  );

  return result.rows[0];
};
