import { query } from './server/db';
import fs from 'fs';
import path from 'path';
import { seedDatabase } from './server/seed';

async function setup() {
  try {
    console.log('--- Starting Database Setup ---');

    // 1. Read schema.sql
    const schemaPath = path.join(process.cwd(), 'database', 'schema.sql');
    if (!fs.existsSync(schemaPath)) {
      throw new Error(`Schema file not found at ${schemaPath}`);
    }
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');

    // 2. Execute schema.sql
    console.log('Applying schema from database/schema.sql...');
    // We split by semicolon to execute one by one, though pg can handle multiple statements
    // But schema.sql might have some complex stuff, so we'll try executing it in blocks or as a whole.
    // For simplicity and since it's a few tables, we'll run it as one large query.
    await query(schemaSql);
    console.log('Schema applied successfully.');

    // 3. Seed Database (Roles, Admin, etc.)
    console.log('Seeding initial data...');
    await seedDatabase();
    console.log('Seeding successful.');

    console.log('--- Database Setup Complete ---');
  } catch (error) {
    console.error('--- Database Setup Failed ---');
    console.error(error);
  } finally {
    process.exit();
  }
}

setup();
