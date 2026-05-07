import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';
import { attendanceRateLimiter } from '../middleware/rateLimiter';
import { submitAttendance } from '../controllers/attendanceController';

export const attendanceRouter = Router();

attendanceRouter.use(authenticate);

attendanceRouter.post('/submit', authorize(['student']), attendanceRateLimiter, submitAttendance);
