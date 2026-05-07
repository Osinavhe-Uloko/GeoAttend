import { query } from './server/db';

async function check() {
  try {
    const { rows: roles } = await query('SELECT * FROM roles');
    console.log('Roles:', roles);

    const { rows: users } = await query(
      `SELECT u.user_id, u.full_name, u.email, r.role_name, u.is_active 
       FROM users u 
       JOIN roles r ON u.role_id = r.role_id`
    );
    console.log('Users:', users);
  } catch (err) {
    console.error(err);
  } finally {
    process.exit();
  }
}

check();
