import pg from 'pg';
import config from './index.js';

const { Pool } = pg;

const pool = new Pool(config.database);

pool.on('connect', () => {
  console.log('✓ Database connected');
});

pool.on('error', (err) => {
  console.error('Unexpected database error:', err);
});

export const query = (text, params) => pool.query(text, params);

export const getClient = () => pool.connect();

// Test database connection
export const testDatabaseConnection = async () => {
  try {
    const res = await pool.query('SELECT NOW()');
    console.log('Database connection test successful:', res.rows[0]);
  } catch (err) {
    console.error('Database connection test failed:', err);
  }
};

export default pool;
