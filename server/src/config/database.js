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

export default pool;
