import rateLimit, { RateLimitRequestHandler, Options } from 'express-rate-limit';

/**
 * Rate limiter configuration for authentication endpoints
 * Limits requests to prevent brute force attacks
 */
const authLimiterOptions: Partial<Options> = {
  windowMs: 1 * 60 * 1000, // 1 minute (for development)
  max: 100, // 100 requests per window (for development)
  message: {
    success: false,
    message: 'Too many attempts. Please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false
};

export const authLimiter: RateLimitRequestHandler = rateLimit(authLimiterOptions);
