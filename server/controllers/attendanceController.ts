import { Response } from 'express';
import { query } from '../db';
import { AuthRequest } from '../middleware/authenticate';
import { detectAnomalies } from '../services/geofenceService';

export const submitAttendance = async (req: AuthRequest, res: Response): Promise<void> => {
  const { session_id, latitude, longitude, device_fingerprint } = req.body;
  const student_id = req.user.user_id;
  const submitted_at = new Date();

  try {
    // 1. Check if session exists and get details
    const { rows: sessionRows } = await query(
      `SELECT ls.start_time, ls.end_time, gz.latitude as zone_lat, gz.longitude as zone_lon, gz.radius_meters 
       FROM lecture_sessions ls 
       JOIN geofence_zones gz ON ls.geofence_zone_id = gz.zone_id 
       WHERE ls.session_id = $1`,
      [session_id]
    );

    if (sessionRows.length === 0) {
      res.status(404).json({ success: false, message: 'Session not found' });
      return;
    }

    const session = sessionRows[0];

    // 2. Check if already marked present
    const { rows: existingRows } = await query(
      `SELECT status FROM attendance_records WHERE student_id = $1 AND session_id = $2`,
      [student_id, session_id]
    );

    if (existingRows.length > 0 && existingRows[0].status === 'present') {
      res.status(400).json({ success: false, message: 'Attendance already marked for this session' });
      return;
    }

    // 3. Anomaly Detection & Geofence Validation
    const { status, distanceMeters, anomalies } = await detectAnomalies(
      student_id,
      session_id,
      latitude,
      longitude,
      parseFloat(session.zone_lat),
      parseFloat(session.zone_lon),
      session.radius_meters,
      device_fingerprint,
      submitted_at,
      new Date(session.start_time),
      new Date(session.end_time)
    );

    // 4. Log Device Event
    await query(
      `INSERT INTO device_logs (user_id, device_fingerprint, user_agent, ip_address, event_type, notes) 
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        student_id, 
        device_fingerprint, 
        req.headers['user-agent'], 
        req.ip, 
        status === 'rejected' ? 'geofence_fail' : (anomalies.length > 0 ? 'spoof_alert' : 'attendance_attempt'),
        anomalies.join(', ')
      ]
    );

    // 5. Save Attendance Record
    // Use ON CONFLICT to update if they previously failed
    await query(
      `INSERT INTO attendance_records 
       (student_id, session_id, submitted_latitude, submitted_longitude, haversine_distance_meters, status, submitted_at, ip_address, device_fingerprint) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       ON CONFLICT (student_id, session_id) 
       DO UPDATE SET 
         submitted_latitude = EXCLUDED.submitted_latitude,
         submitted_longitude = EXCLUDED.submitted_longitude,
         haversine_distance_meters = EXCLUDED.haversine_distance_meters,
         status = EXCLUDED.status,
         submitted_at = EXCLUDED.submitted_at,
         ip_address = EXCLUDED.ip_address,
         device_fingerprint = EXCLUDED.device_fingerprint`,
      [student_id, session_id, latitude, longitude, distanceMeters, status, submitted_at, req.ip, device_fingerprint]
    );

    res.json({
      success: true,
      data: { status, distance_meters: distanceMeters, anomalies },
      message: status === 'present' ? 'Attendance marked successfully' : `Attendance ${status}: ${anomalies.join(', ')}`
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
