import rateLimit from 'express-rate-limit';

export const chatLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  message: { success: false, error: 'Too many chat messages. Try again later.' }
});

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { success: false, error: 'Too many requests. Try again later.' }
});
