import { Router } from 'express';
import { query } from '../db';
import { authenticate, AuthRequest } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';

export const sessionsRouter = Router();

function generateSessionCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

sessionsRouter.use(authenticate);

sessionsRouter.post('/', authorize(['lecturer', 'admin']), async (req: AuthRequest, res) => {
  const { course_id, geofence_zone_id, start_time, end_time } = req.body;
  const session_code = generateSessionCode();
  try {
    const { rows } = await query(
      `INSERT INTO lecture_sessions (course_id, geofence_zone_id, start_time, end_time, created_by, session_code) 
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [course_id, geofence_zone_id, start_time, end_time, req.user.user_id, session_code]
    );
    res.status(201).json({ success: true, data: rows[0], message: 'Session created successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

sessionsRouter.get('/', authorize(['lecturer', 'admin']), async (req: AuthRequest, res) => {
  try {
    let q = `SELECT ls.*, c.course_code, c.course_name, gz.zone_name 
       FROM lecture_sessions ls 
       JOIN courses c ON ls.course_id = c.course_id 
       JOIN geofence_zones gz ON ls.geofence_zone_id = gz.zone_id`;
    const params: any[] = [];
    
    if (req.user.role_name === 'lecturer') {
      q += ` WHERE ls.created_by = $1`;
      params.push(req.user.user_id);
    }
    
    q += ` ORDER BY ls.start_time DESC`;
    
    const { rows } = await query(q, params);
    res.json({ success: true, data: rows, message: 'Sessions retrieved' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

sessionsRouter.get('/active', authorize(['student']), async (req: AuthRequest, res) => {
  try {
    console.log(`[ActiveSessions] Fetching sessions for user: ${req.user.user_id}`);
    const { rows } = await query(
      `SELECT ls.*, c.course_code, c.course_name, gz.zone_name, gz.latitude, gz.longitude, gz.radius_meters,
       EXISTS(SELECT 1 FROM attendance_records ar WHERE ar.session_id = ls.session_id AND ar.student_id = $1 AND ar.status IN ('present', 'flagged')) as has_attended
       FROM lecture_sessions ls 
       JOIN courses c ON ls.course_id = c.course_id 
       JOIN geofence_zones gz ON ls.geofence_zone_id = gz.zone_id 
       JOIN enrollments e ON c.course_id = e.course_id 
       WHERE e.student_id = $1 
       AND CURRENT_TIMESTAMP <= ls.end_time`,
      [req.user.user_id]
    );
    console.log(`[ActiveSessions] Found ${rows.length} sessions for user ${req.user.user_id}`);
    res.json({ success: true, data: rows, message: 'Active sessions retrieved' });
  } catch (error: any) {
    console.error(`[ActiveSessions] Error: ${error.message}`);
    res.status(500).json({ success: false, message: error.message });
  }
});

sessionsRouter.get('/past', authorize(['student']), async (req: AuthRequest, res) => {
  try {
    const { rows } = await query(
      `SELECT ls.*, c.course_code, c.course_name, gz.zone_name, ar.status as attendance_status
       FROM lecture_sessions ls 
       JOIN courses c ON ls.course_id = c.course_id 
       JOIN geofence_zones gz ON ls.geofence_zone_id = gz.zone_id
       JOIN enrollments e ON c.course_id = e.course_id 
       LEFT JOIN attendance_records ar ON ls.session_id = ar.session_id AND ar.student_id = $1
       WHERE e.student_id = $1 
       AND ls.end_time < CURRENT_TIMESTAMP
       ORDER BY ls.start_time DESC`,
      [req.user.user_id]
    );
    res.json({ success: true, data: rows, message: 'Past sessions retrieved' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

sessionsRouter.get('/:id/attendance', authorize(['lecturer', 'admin']), async (req: AuthRequest, res) => {
  const { id } = req.params;
  try {
    const { rows } = await query(
      `SELECT u.full_name, u.matric_number, u.email, ar.status, ar.submitted_at, ar.haversine_distance_meters 
       FROM attendance_records ar 
       JOIN users u ON ar.student_id = u.user_id 
       WHERE ar.session_id = $1 
       ORDER BY ar.submitted_at ASC`,
      [id]
    );
    res.json({ success: true, data: rows, message: 'Attendance records retrieved' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

sessionsRouter.patch('/:id', authorize(['lecturer', 'admin']), async (req: AuthRequest, res) => {
  const { id } = req.params;
  const { geofence_zone_id, start_time, end_time } = req.body;
  try {
    // Check if session has started
    const { rows: sessionRows } = await query('SELECT start_time FROM lecture_sessions WHERE session_id = $1', [id]);
    if (sessionRows.length === 0) return res.status(404).json({ success: false, message: 'Session not found' });
    
    if (new Date(sessionRows[0].start_time) <= new Date()) {
      return res.status(400).json({ success: false, message: 'Cannot edit a session that has already started' });
    }

    const { rows } = await query(
      `UPDATE lecture_sessions 
       SET geofence_zone_id = $1, start_time = $2, end_time = $3 
       WHERE session_id = $4 RETURNING *`,
      [geofence_zone_id, start_time, end_time, id]
    );
    res.json({ success: true, data: rows[0], message: 'Session updated successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

sessionsRouter.get('/verify-code', authorize(['student']), async (req: AuthRequest, res) => {
  const { code } = req.query;
  console.log(`[VerifyCode] Attempting to join session with code: "${code}" for user: ${req.user.user_id}`);
  try {
    const { rows: debugRows } = await query(
      `SELECT session_id, session_code, end_time, CURRENT_TIMESTAMP as db_now 
       FROM lecture_sessions 
       WHERE TRIM(UPPER(session_code)) = TRIM(UPPER($1))`,
      [code]
    );

    if (debugRows.length === 0) {
      console.log(`[VerifyCode] Code "${code}" not found in database at all.`);
      return res.status(200).json({ success: false, message: 'Invalid session code' });
    }

    const session = debugRows[0];
    console.log(`[VerifyCode] Found session ${session.session_id}. End time: ${session.end_time}, DB Now: ${session.db_now}`);

    if (new Date(session.db_now) > new Date(session.end_time)) {
      console.log(`[VerifyCode] Session ${session.session_id} has expired.`);
      return res.status(200).json({ success: false, message: 'Session has expired' });
    }

    const { rows } = await query(
      `SELECT ls.*, c.course_code, c.course_name, gz.zone_name, gz.latitude, gz.longitude, gz.radius_meters,
       EXISTS(SELECT 1 FROM attendance_records ar WHERE ar.session_id = ls.session_id AND ar.student_id = $2 AND ar.status IN ('present', 'flagged')) as has_attended
       FROM lecture_sessions ls 
       JOIN courses c ON ls.course_id = c.course_id 
       JOIN geofence_zones gz ON ls.geofence_zone_id = gz.zone_id 
       WHERE ls.session_id = $1`,
      [session.session_id, req.user.user_id]
    );

    if (rows.length === 0) {
      console.log(`[VerifyCode] Session ${session.session_id} found but JOIN failed (course or zone missing?)`);
      return res.status(200).json({ success: false, message: 'Session configuration error' });
    }
    console.log(`[VerifyCode] Successfully found session: ${rows[0].session_id}`);

    // Auto-enroll the student if they aren't already
    await query(
      `INSERT INTO enrollments (student_id, course_id)
       VALUES ($1, $2)
       ON CONFLICT (student_id, course_id) DO NOTHING`,
      [req.user.user_id, rows[0].course_id]
    );

    res.json({ success: true, data: rows[0], message: 'Session joined successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

sessionsRouter.get('/csv/:id', authorize(['lecturer', 'admin']), async (req: AuthRequest, res) => {
  const { id } = req.params;
  try {
    const { rows } = await query(
      `SELECT u.full_name, u.matric_number, u.email, ar.status, ar.submitted_at, ar.haversine_distance_meters 
       FROM attendance_records ar 
       JOIN users u ON ar.student_id = u.user_id 
       WHERE ar.session_id = $1 
       ORDER BY ar.submitted_at ASC`,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'No attendance records found for this session' });
    }

    const csvHeader = 'Full Name,Matric Number,Email,Status,Submitted At,Distance (m)\n';
    const csvRows = rows.map(r => 
      `"${r.full_name}","${r.matric_number}","${r.email}","${r.status}","${r.submitted_at}","${r.haversine_distance_meters}"`
    ).join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=attendance_${id}.csv`);
    res.send(csvHeader + csvRows);
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});
