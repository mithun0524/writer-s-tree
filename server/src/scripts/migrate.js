import { createTables, dropTables } from '../models/schema.js';
import pool from '../config/database.js';

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const waitForDatabase = async (maxRetries = 10, delay = 2000) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      console.log(`Checking database connection (attempt ${i + 1}/${maxRetries})...`);
      const client = await pool.connect();
      client.release();
      console.log('✓ Database connection successful');
      return;
    } catch (error) {
      console.log(`Database not ready, retrying in ${delay}ms...`);
      await sleep(delay);
    }
  }
  throw new Error('Database connection failed after maximum retries');
};

const migrate = async () => {
  try {
    console.log('Starting database migration...');

    // Wait for database to be ready
    await waitForDatabase();

    const reset = process.argv.includes('--reset');

    if (reset) {
      console.log('Dropping existing tables...');
      await dropTables();
    }

    console.log('Creating tables...');
    await createTables();

    console.log('✓ Migration completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
};

migrate();
