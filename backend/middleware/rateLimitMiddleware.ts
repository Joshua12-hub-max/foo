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

/**
 * Stricter rate limiter for sensitive authentication actions (Login/Register/Verify)
 * Limits to 5 attempts every 15 minutes to mitigate brute force
 */
export const strictAuthLimiter: RateLimitRequestHandler = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Increased for recovery
  message: {
    success: false,
    message: 'Too many authentication attempts. Please try again in 15 minutes.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * Rate limiter for public chat endpoints
 * Prevents message flooding: 30 requests per 5 minutes per IP
 */
export const chatRateLimit: RateLimitRequestHandler = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 30, // 30 requests per window
  message: {
    success: false,
    message: 'Too many messages. Please slow down and try again shortly.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * Rate limiter for public inquiry submissions
 * Prevents inquiry spam: 5 submissions per hour per IP
 */
export const inquiryRateLimit: RateLimitRequestHandler = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // 5 submissions per window
  message: {
    success: false,
    message: 'Too many inquiries submitted. Please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false
});
