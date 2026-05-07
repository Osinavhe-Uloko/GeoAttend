import { Router } from 'express';
import { query } from '../db';
import { authenticate, AuthRequest } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';

export const zonesRouter = Router();

zonesRouter.use(authenticate);
zonesRouter.use(authorize(['lecturer', 'admin']));

zonesRouter.post('/', async (req: AuthRequest, res) => {
  const { zone_name, latitude, longitude, radius_meters, course_id } = req.body;
  try {
    const { rows } = await query(
      `INSERT INTO geofence_zones (zone_name, latitude, longitude, radius_meters, course_id, created_by) 
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [zone_name, latitude, longitude, radius_meters || 100, course_id, req.user.user_id]
    );
    res.status(201).json({ success: true, data: rows[0], message: 'Zone created successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

zonesRouter.get('/', async (req: AuthRequest, res) => {
  try {
    let q = 'SELECT * FROM geofence_zones WHERE is_active = TRUE';
    const params: any[] = [];
    
    if (req.user.role_name === 'lecturer') {
      q += ' AND created_by = $1';
      params.push(req.user.user_id);
    }
    
    const { rows } = await query(q, params);
    res.json({ success: true, data: rows, message: 'Zones retrieved' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

zonesRouter.get('/:id', async (req: AuthRequest, res) => {
  try {
    const { rows } = await query('SELECT * FROM geofence_zones WHERE zone_id = $1 AND is_active = TRUE', [req.params.id]);
    if (rows.length === 0) {
      res.status(404).json({ success: false, message: 'Zone not found' });
      return;
    }
    res.json({ success: true, data: rows[0], message: 'Zone retrieved' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

zonesRouter.put('/:id', async (req: AuthRequest, res) => {
  const { zone_name, latitude, longitude, radius_meters, course_id } = req.body;
  try {
    const { rows } = await query(
      `UPDATE geofence_zones SET zone_name = $1, latitude = $2, longitude = $3, radius_meters = $4, course_id = $5 
       WHERE zone_id = $6 RETURNING *`,
      [zone_name, latitude, longitude, radius_meters, course_id, req.params.id]
    );
    if (rows.length === 0) {
      res.status(404).json({ success: false, message: 'Zone not found' });
      return;
    }
    res.json({ success: true, data: rows[0], message: 'Zone updated successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

zonesRouter.delete('/:id', async (req: AuthRequest, res) => {
  try {
    const { rows } = await query('UPDATE geofence_zones SET is_active = FALSE WHERE zone_id = $1 RETURNING zone_id', [req.params.id]);
    if (rows.length === 0) {
      res.status(404).json({ success: false, message: 'Zone not found' });
      return;
    }
    res.json({ success: true, data: {}, message: 'Zone deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});
