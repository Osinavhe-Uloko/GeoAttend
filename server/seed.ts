import { query } from './db';
import bcrypt from 'bcryptjs';

export async function seedDatabase() {
  try {
    console.log('Checking for roles...');
    const { rows: roles } = await query('SELECT * FROM roles');
    
    if (roles.length === 0) {
      console.log('Seeding roles...');
      await query("INSERT INTO roles (role_name) VALUES ('admin'), ('lecturer'), ('student')");
      console.log('Roles seeded successfully.');
    } else {
      console.log('Roles already exist.');
    }

    // Seed default admin
    const adminEmail = 'admin@uniben.edu';
    const { rows: existingAdmin } = await query('SELECT * FROM users WHERE email = $1', [adminEmail]);
    
    if (existingAdmin.length === 0) {
      console.log('Seeding default admin...');
      const saltRounds = 12;
      const passwordHash = await bcrypt.hash('Admin@001', saltRounds);
      
      const { rows: adminRole } = await query("SELECT role_id FROM roles WHERE role_name = 'admin'");
      
      await query(
        `INSERT INTO users (full_name, email, password_hash, role_id, is_active) 
         VALUES ($1, $2, $3, $4, TRUE)`,
        ['System Administration', adminEmail, passwordHash, adminRole[0].role_id]
      );
      console.log('Default admin seeded successfully.');
    } else {
      console.log('Admin user already exists.');
    }

    // Schema Migrations
    try {
      await query('ALTER TABLE users ADD COLUMN requires_password_change BOOLEAN DEFAULT FALSE');
      console.log('Added requires_password_change column to users');
    } catch (e: any) {
      if (!e.message.includes('already exists') && !e.message.includes('column "requires_password_change" of relation "users" already exists')) {
        console.warn('Note on requires_password_change:', e.message);
      }
    }

    try {
      await query(`
        CREATE TABLE IF NOT EXISTS password_reset_tokens (
          token UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
          expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        )
      `);
      console.log('password_reset_tokens table verified/created.');
    } catch (e: any) {
      console.warn('Note on password_reset_tokens:', e.message);
    }
  } catch (error: any) {
    console.error('Error seeding database:', error.message);
    if (error.message.includes('relation "roles" does not exist')) {
      console.warn('The "roles" table does not exist. Please run the SQL commands in database/schema.sql in your database editor.');
    }
  }
}
