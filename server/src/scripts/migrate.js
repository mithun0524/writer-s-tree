import { createTables, dropTables } from '../models/schema.js';
import pool from '../config/database.js';

const migrate = async () => {
  try {
    console.log('Starting database migration...');
    
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
