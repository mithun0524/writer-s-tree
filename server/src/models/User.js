import { query } from '../config/database.js';

// Clerk handles authentication, this only manages user records in our DB

export const createOrUpdateUser = async ({ clerkUserId, email, fullName }) => {
  const result = await query(
    `INSERT INTO users (id, clerk_user_id, email, full_name)
     VALUES ($1, $1, $2, $3)
     ON CONFLICT (clerk_user_id) 
     DO UPDATE SET email = $2, full_name = $3, updated_at = NOW()
     RETURNING *`,
    [clerkUserId, email, fullName]
  );
  
  return result.rows[0];
};

export const findUserByClerkId = async (clerkUserId) => {
  const result = await query(
    'SELECT * FROM users WHERE clerk_user_id = $1',
    [clerkUserId]
  );
  return result.rows[0];
};

export const findUserById = async (id) => {
  const result = await query(
    'SELECT id, clerk_user_id, email, full_name, preferences, created_at FROM users WHERE id = $1',
    [id]
  );
  return result.rows[0];
};

export const updateUserPreferences = async (userId, preferences) => {
  const result = await query(
    `UPDATE users SET preferences = $1, updated_at = NOW() 
     WHERE id = $2 
     RETURNING id, clerk_user_id, email, full_name, preferences`,
    [preferences, userId]
  );

  return result.rows[0];
};

export const deleteUser = async (userId) => {
  await query('DELETE FROM users WHERE id = $1', [userId]);
  return true;
};
