import { query } from './server/db';

async function migrate() {
  try {
    console.log('Starting migration: Adding session_code to lecture_sessions...');
    await query(`
      ALTER TABLE lecture_sessions 
      ADD COLUMN IF NOT EXISTS session_code VARCHAR(10) UNIQUE;
    `);
    console.log('Migration successful: session_code column added.');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    process.exit();
  }
}

migrate();
