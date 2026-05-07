import { query } from '../db';

export function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000; // Earth radius in meters
  const φ1 = lat1 * (Math.PI / 180);
  const φ2 = lat2 * (Math.PI / 180);
  const Δφ = (lat2 - lat1) * (Math.PI / 180);
  const Δλ = (lon2 - lon1) * (Math.PI / 180);

  const a = Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // distance in meters
}

export function validateGeofence(userLat: number, userLon: number, zoneLat: number, zoneLon: number, radiusMeters: number) {
  const distance = haversineDistance(userLat, userLon, zoneLat, zoneLon);
  return {
    isWithinBoundary: distance <= radiusMeters,
    distanceMeters: parseFloat(distance.toFixed(2))
  };
}

export function isWithinNigeria(lat: number, lon: number): boolean {
  // Nigeria bounding box: lat: 4.0–13.9, lon: 2.7–14.7
  return lat >= 4.0 && lat <= 13.9 && lon >= 2.7 && lon <= 14.7;
}

export async function detectAnomalies(
  studentId: string,
  sessionId: string,
  submittedLat: number,
  submittedLon: number,
  zoneLat: number,
  zoneLon: number,
  radiusMeters: number,
  deviceFingerprint: string,
  submittedAt: Date,
  sessionStart: Date,
  sessionEnd: Date
) {
  const anomalies: string[] = [];
  let status: 'present' | 'rejected' | 'flagged' = 'present';

  // 1. Impossible Distance
  const { isWithinBoundary, distanceMeters } = validateGeofence(submittedLat, submittedLon, zoneLat, zoneLon, radiusMeters);
  if (distanceMeters > radiusMeters + 50) {
    anomalies.push('Impossible Distance');
    status = 'rejected';
  } else if (!isWithinBoundary) {
    anomalies.push('Outside Boundary');
    status = 'rejected';
  }

  // 2. Time Mismatch
  const gracePeriodMs = 3000; // 3 seconds grace period
  if (submittedAt < sessionStart || submittedAt.getTime() > sessionEnd.getTime() + gracePeriodMs) {
    anomalies.push('Time Mismatch');
    status = 'rejected';
  }

  // 3. Device Mismatch (same student, different device in same session)
  const { rows: deviceLogs } = await query(
    `SELECT device_fingerprint FROM attendance_records WHERE student_id = $1 AND session_id = $2`,
    [studentId, sessionId]
  );
  if (deviceLogs.length > 0 && deviceLogs[0].device_fingerprint !== deviceFingerprint) {
    anomalies.push('Device Mismatch');
    status = 'flagged';
  }

  // 4. Boundary Hop (multiple attempts fluctuating inside/outside within 60s)
  const { rows: recentAttempts } = await query(
    `SELECT status, submitted_at FROM attendance_records 
     WHERE student_id = $1 AND session_id = $2 AND submitted_at >= $3`,
    [studentId, sessionId, new Date(submittedAt.getTime() - 60000)]
  );
  
  if (recentAttempts.length > 0) {
    const hasRejected = recentAttempts.some(r => r.status === 'rejected');
    if (hasRejected && status === 'present') {
      anomalies.push('Boundary Hop');
      status = 'flagged';
    }
  }

  // 5. GPS Spoofing (Outside Nigeria)
  if (!isWithinNigeria(submittedLat, submittedLon)) {
    anomalies.push('GPS Spoofing Detected');
    status = 'rejected';
  }

  return { status, distanceMeters, anomalies };
}
