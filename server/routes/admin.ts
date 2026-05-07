import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { query } from '../db';
import { authenticate, AuthRequest } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';

export const adminRouter = Router();

adminRouter.use(authenticate);
adminRouter.use(authorize(['admin', 'lecturer']));

adminRouter.get('/attendance', async (req: AuthRequest, res) => {
  try {
    const { rows } = await query(
      `SELECT ar.*, u.full_name, u.matric_number, c.course_code, ls.start_time 
       FROM attendance_records ar 
       JOIN users u ON ar.student_id = u.user_id 
       JOIN lecture_sessions ls ON ar.session_id = ls.session_id 
       JOIN courses c ON ls.course_id = c.course_id 
       ORDER BY ar.submitted_at DESC`
    );
    res.json({ success: true, data: rows, message: 'Attendance records retrieved' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

adminRouter.get('/anomalies', async (req: AuthRequest, res) => {
  try {
    const { rows } = await query(
      `SELECT ar.*, u.full_name, u.matric_number, c.course_code, ls.start_time,
       (SELECT dl.event_type FROM device_logs dl WHERE dl.user_id = ar.student_id AND ABS(EXTRACT(EPOCH FROM (dl.event_time - ar.submitted_at))) < 5 ORDER BY dl.event_time DESC LIMIT 1) as event_type,
       (SELECT dl.notes FROM device_logs dl WHERE dl.user_id = ar.student_id AND ABS(EXTRACT(EPOCH FROM (dl.event_time - ar.submitted_at))) < 5 ORDER BY dl.event_time DESC LIMIT 1) as anomaly_reason
       FROM attendance_records ar 
       JOIN users u ON ar.student_id = u.user_id 
       JOIN lecture_sessions ls ON ar.session_id = ls.session_id 
       JOIN courses c ON ls.course_id = c.course_id 
       WHERE ar.status IN ('flagged', 'rejected')
       ORDER BY ar.submitted_at DESC`
    );
    res.json({ success: true, data: rows, message: 'Anomalies retrieved' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

adminRouter.get('/reports/course/:id', async (req: AuthRequest, res) => {
  try {
    const { rows } = await query(
      `SELECT u.full_name, u.matric_number, 
              COUNT(ar.record_id) FILTER (WHERE ar.status = 'present') as present_count,
              COUNT(ls.session_id) as total_sessions,
              (COUNT(ar.record_id) FILTER (WHERE ar.status = 'present') * 100.0 / NULLIF(COUNT(ls.session_id), 0)) as attendance_percentage
       FROM enrollments e
       JOIN users u ON e.student_id = u.user_id
       LEFT JOIN lecture_sessions ls ON e.course_id = ls.course_id
       LEFT JOIN attendance_records ar ON u.user_id = ar.student_id AND ls.session_id = ar.session_id
       WHERE e.course_id = $1
       GROUP BY u.user_id, u.full_name, u.matric_number`,
      [req.params.id]
    );
    res.json({ success: true, data: rows, message: 'Course report retrieved' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

adminRouter.get('/reports/session/:id', async (req: AuthRequest, res) => {
  try {
    const { rows } = await query(
      `SELECT status, COUNT(*) as count 
       FROM attendance_records 
       WHERE session_id = $1 
       GROUP BY status`,
      [req.params.id]
    );
    res.json({ success: true, data: rows, message: 'Session report retrieved' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

adminRouter.get('/users', authorize(['admin']), async (req: AuthRequest, res) => {
  try {
    const { rows } = await query(
      `SELECT u.user_id, u.full_name, u.email, u.matric_number, u.department, r.role_name, u.is_active 
       FROM users u JOIN roles r ON u.role_id = r.role_id`
    );
    res.json({ success: true, data: rows, message: 'Users retrieved' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

adminRouter.get('/courses', async (req: AuthRequest, res) => {
  try {
    let q = `SELECT c.*, u.full_name as lecturer_name 
       FROM courses c 
       JOIN users u ON c.lecturer_id = u.user_id`;
    const params: any[] = [];
    
    if (req.user.role_name === 'lecturer') {
      q += ' WHERE c.lecturer_id = $1';
      params.push(req.user.user_id);
    }
    
    const { rows } = await query(q, params);
    res.json({ success: true, data: rows, message: 'Courses retrieved' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

adminRouter.post('/courses', authorize(['admin']), async (req: AuthRequest, res) => {
  const { course_code, course_name, lecturer_id, department, semester, academic_year } = req.body;
  try {
    const { rows } = await query(
      `INSERT INTO courses (course_code, course_name, lecturer_id, department, semester, academic_year) 
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [course_code, course_name, lecturer_id, department, semester, academic_year]
    );
    res.status(201).json({ success: true, data: rows[0], message: 'Course created successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

adminRouter.post('/users', authorize(['admin']), async (req: AuthRequest, res) => {
  const { full_name, email, password, role_name, department } = req.body;
  try {
    const saltRounds = 12;
    const password_hash = await bcrypt.hash(password, saltRounds);

    const { rows: roleRows } = await query('SELECT role_id FROM roles WHERE role_name = $1', [role_name]);
    if (roleRows.length === 0) return res.status(400).json({ success: false, message: 'Invalid role' });

    const { rows } = await query(
      `INSERT INTO users (full_name, email, password_hash, role_id, department, requires_password_change) 
       VALUES ($1, $2, $3, $4, $5, TRUE) RETURNING user_id, full_name, email`,
      [full_name, email, password_hash, roleRows[0].role_id, department]
    );

    res.status(201).json({ success: true, data: rows[0], message: 'User created successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

adminRouter.get('/lecturers', authorize(['admin']), async (req: AuthRequest, res) => {
  try {
    const { rows } = await query(
      `SELECT u.user_id, u.full_name, u.email, u.department 
       FROM users u 
       JOIN roles r ON u.role_id = r.role_id 
       WHERE r.role_name = 'lecturer' AND u.is_active = TRUE`
    );
    res.json({ success: true, data: rows, message: 'Lecturers retrieved' });
  } catch (error: any) {
    console.error('Error fetching lecturers:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve lecturers' });
  }
});
