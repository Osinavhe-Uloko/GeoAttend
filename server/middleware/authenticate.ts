import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { query } from '../db';

export interface AuthRequest extends Request {
  user?: any;
}

export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const token = req.cookies.jwt;
    if (!token) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    const decoded: any = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
    const { rows } = await query(
      'SELECT u.user_id, u.full_name, u.email, u.role_id, u.department, u.requires_password_change, u.matric_number, r.role_name FROM users u JOIN roles r ON u.role_id = r.role_id WHERE u.user_id = $1 AND u.is_active = TRUE',
      [decoded.userId]
    );

    if (rows.length === 0) {
      res.status(401).json({ success: false, message: 'Invalid or expired token' });
      return;
    }

    req.user = rows[0];
    next();
  } catch (error) {
    res.status(401).json({ success: false, message: 'Authentication failed' });
    return;
  }
};
