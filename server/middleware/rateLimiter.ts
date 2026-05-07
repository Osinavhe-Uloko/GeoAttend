import rateLimit from 'express-rate-limit';

export const attendanceRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour window
  max: 5, // Limit each IP to 5 attendance attempts per window
  message: { success: false, message: 'Too many attendance attempts from this IP, please try again after an hour' },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.ip || req.headers['x-forwarded-for']?.toString() || req.socket.remoteAddress || 'unknown',
});

export const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.ip || req.headers['x-forwarded-for']?.toString() || req.socket.remoteAddress || 'unknown',
});
