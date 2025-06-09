// middleware/rateLimiter.js
const rateLimit = require('express-rate-limit');

const sendCodeLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 4,
  message: {
    success: false,
    message: 'Too many verification code requests. Try again later.',
  },
  keyGenerator: (req) => req.body.email || req.ip,
});

module.exports = { sendCodeLimiter };
