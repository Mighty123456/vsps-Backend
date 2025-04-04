const { RateLimiterMemory } = require('rate-limiter-flexible');

// Rate limiter for password reset
const passwordResetRateLimiter = new RateLimiterMemory({
  points: 5, 
  duration: 60 * 60, 
});

// Rate limiter for contact messages
const contactRateLimiter = new RateLimiterMemory({
  points: 10, // 10 requests
  duration: 60 * 60, // Per hour
});

// Middleware for password reset rate limiting
const passwordResetMiddleware = (req, res, next) => {
  passwordResetRateLimiter
    .consume(req.ip)
    .then(() => next())
    .catch(() => {
      res.status(429).json({ message: 'Too many password reset requests. Try again later.' });
    });
};

// Middleware for contact message rate limiting
const contactRateLimiterMiddleware = (req, res, next) => {
  contactRateLimiter
    .consume(req.ip)
    .then(() => next())
    .catch(() => {
      res.status(429).json({ message: 'Too many contact requests. Try again later.' });
    });
};

module.exports = { 
  contactRateLimiter: contactRateLimiterMiddleware,  
  passwordResetRateLimiter: passwordResetMiddleware 
};
