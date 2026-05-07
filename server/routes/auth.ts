import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '../db';
import { authenticate, AuthRequest } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';
import { sendPasswordResetEmail } from '../services/emailService';

export const authRouter = Router();

authRouter.post('/register', async (req, res) => {
  const { full_name, email, password, matric_number, department } = req.body;
  const role_name = 'student'; // Force student role for public registration
  try {
    const saltRounds = 12;
    const password_hash = await bcrypt.hash(password, saltRounds);

    const { rows: roleRows } = await query('SELECT role_id FROM roles WHERE role_name = $1', [role_name]);
    if (roleRows.length === 0) return res.status(400).json({ success: false, message: 'Invalid role' });

    const { rows } = await query(
      `INSERT INTO users (full_name, email, password_hash, role_id, matric_number, department) 
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING user_id, full_name, email`,
      [full_name, email, password_hash, roleRows[0].role_id, matric_number, department]
    );

    res.status(201).json({ success: true, data: rows[0], message: 'User registered successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

authRouter.post('/login', async (req, res) => {
  const { email, password, device_fingerprint, user_agent } = req.body;
  try {
    const { rows } = await query(
      `SELECT u.user_id, u.password_hash, u.is_active, r.role_name, u.requires_password_change 
       FROM users u JOIN roles r ON u.role_id = r.role_id WHERE u.email = $1`,
      [email]
    );

    if (rows.length === 0 || !rows[0].is_active) {
      return res.status(401).json({ success: false, message: 'Invalid credentials or inactive account' });
    }

    const match = await bcrypt.compare(password, rows[0].password_hash);
    if (!match) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const user = rows[0];

    const token = jwt.sign({ userId: user.user_id, role: user.role_name }, process.env.JWT_SECRET || 'fallback_secret', { expiresIn: '8h' });

    res.cookie('jwt', token, {
      httpOnly: true,
      secure: true, // Required for SameSite=None
      sameSite: 'none', // Required for cross-origin iframe
      maxAge: 8 * 60 * 60 * 1000 // 8 hours
    });

    await query('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE user_id = $1', [user.user_id]);
    
    // Log device
    if (device_fingerprint) {
      await query(
        `INSERT INTO device_logs (user_id, device_fingerprint, user_agent, ip_address, event_type) 
         VALUES ($1, $2, $3, $4, 'login')`,
        [user.user_id, device_fingerprint, user_agent, req.ip]
      );
    }

    res.json({ success: true, data: { role: user.role_name, requires_password_change: user.requires_password_change }, message: 'Logged in successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

authRouter.post('/logout', (req, res) => {
  res.clearCookie('jwt');
  res.json({ success: true, data: {}, message: 'Logged out successfully' });
});

authRouter.get('/me', authenticate, (req: AuthRequest, res) => {
  res.json({ success: true, data: req.user, message: 'Current user retrieved' });
});

// Change Password (requires authentication)
authRouter.post('/change-password', authenticate, async (req: AuthRequest, res) => {
  const { oldPassword, newPassword } = req.body;
  const userId = req.user.user_id;

  try {
    const { rows } = await query('SELECT password_hash FROM users WHERE user_id = $1', [userId]);
    if (rows.length === 0) return res.status(404).json({ success: false, message: 'User not found' });

    const match = await bcrypt.compare(oldPassword, rows[0].password_hash);
    if (!match) return res.status(400).json({ success: false, message: 'Incorrect old password' });

    const password_hash = await bcrypt.hash(newPassword, 12);
    await query('UPDATE users SET password_hash = $1, requires_password_change = FALSE WHERE user_id = $2', [password_hash, userId]);

    res.json({ success: true, message: 'Password changed successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Forgot Password
authRouter.post('/forgot-password', async (req, res) => {
  const { email, origin } = req.body;
  try {
    const { rows } = await query('SELECT user_id FROM users WHERE email = $1 AND is_active = TRUE', [email]);
    if (rows.length === 0) {
      // Return success even if not found to prevent email enumeration
      return res.json({ success: true, message: 'If the email exists, a password reset link has been sent.' });
    }

    const userId = rows[0].user_id;
    // Set expiration to 1 hour
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1);

    const { rows: tokenRows } = await query(
      'INSERT INTO password_reset_tokens (user_id, expires_at) VALUES ($1, $2) RETURNING token',
      [userId, expiresAt]
    );

    const token = tokenRows[0].token;
    
    // Send email using SendGrid
    let originUrl = origin || '';
    if (!originUrl || originUrl.includes('aistudio.google.com')) {
      const host = req.headers['x-forwarded-host'] || req.headers.host;
      const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'https';
      originUrl = `${protocol}://${host}`;
    }
      
    const resetLink = `${originUrl}/reset-password/${token}`;
    
    await sendPasswordResetEmail(email, resetLink);
    
    res.json({ 
      success: true, 
      message: 'If the email exists, a password reset link has been sent.'
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Reset Password
authRouter.post('/reset-password', async (req, res) => {
  const { token, newPassword } = req.body;
  try {
    const { rows: tokenRows } = await query(
      'SELECT user_id, expires_at FROM password_reset_tokens WHERE token = $1',
      [token]
    );

    if (tokenRows.length === 0) {
      return res.status(400).json({ success: false, message: 'Invalid or expired reset token' });
    }

    if (new Date() > new Date(tokenRows[0].expires_at)) {
      return res.status(400).json({ success: false, message: 'Reset token has expired' });
    }

    const password_hash = await bcrypt.hash(newPassword, 12);
    await query('UPDATE users SET password_hash = $1, requires_password_change = FALSE WHERE user_id = $2', [password_hash, tokenRows[0].user_id]);
    
    // Delete the used token
    await query('DELETE FROM password_reset_tokens WHERE token = $1', [token]);

    res.json({ success: true, message: 'Password reset successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});
