import rateLimit from 'express-rate-limit';

export const chatRateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 30, // Limit each IP to 30 chat requests per minute
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too Many Requests',
    message: 'You have exceeded the rate limit of 30 queries per minute. Please try again shortly.',
  },
});

export const uploadRateLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 20, // 20 uploads per 5 minutes
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too Many Requests',
    message: 'Upload rate limit reached. Please wait a few moments before uploading more files.',
  },
});
