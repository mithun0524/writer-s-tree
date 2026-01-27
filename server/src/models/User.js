import { query } from '../config/database.js';

// Clerk handles authentication, this only manages user records in our DB

export const createOrUpdateUser = async ({ clerkUserId, email, fullName, profileImageUrl, clerkCreatedAt }) => {
  const result = await query(
    `INSERT INTO users (id, email, full_name, profile_image_url, clerk_created_at)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (id)
     DO UPDATE SET email = $2, full_name = $3, profile_image_url = $4, updated_at = NOW()
     RETURNING *`,
    [clerkUserId, email, fullName, profileImageUrl, clerkCreatedAt]
  );

  return result.rows[0];
};

export const findUserByClerkId = async (clerkUserId) => {
  const result = await query(
    'SELECT * FROM users WHERE id = $1',
    [clerkUserId]
  );
  return result.rows[0];
};

export const findUserById = async (id) => {
  const result = await query(
    'SELECT id, email, full_name, profile_image_url, preferences, created_at, last_login FROM users WHERE id = $1',
    [id]
  );
  return result.rows[0];
};

export const updateUserPreferences = async (userId, preferences) => {
  const result = await query(
    `UPDATE users SET preferences = $1, updated_at = NOW()
     WHERE id = $2
     RETURNING id, email, full_name, profile_image_url, preferences`,
    [preferences, userId]
  );

  return result.rows[0];
};

export const deleteUser = async (userId) => {
  await query('DELETE FROM users WHERE id = $1', [userId]);
  return true;
};

export const updateLastLogin = async (userId) => {
  await query('UPDATE users SET last_login = NOW() WHERE id = $1', [userId]);
  return true;
};
