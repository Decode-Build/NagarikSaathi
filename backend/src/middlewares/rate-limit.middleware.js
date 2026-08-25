const { redisConnection } = require('../config/redis');

const otpRateLimiter = async (req, res, next) => {
  const { phone } = req.body;
  if (!phone) {
    return res.status(400).json({ status: 'error', message: 'Phone is required' });
  }

  const key = `ratelimit:otp:${phone}`;
  const limit = 5;
  const windowSeconds = 10 * 60; // 10 minutes

  try {
    const current = await redisConnection.incr(key);
    if (current === 1) {
      await redisConnection.expire(key, windowSeconds);
    }
    if (current > limit) {
      return res.status(429).json({ 
        status: 'error', 
        message: 'Too many requests, please try again later.' 
      });
    }
    next();
  } catch (err) {
    console.error('Rate limit error:', err);
    // Fail open or closed? Let's fail closed for security.
    return res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
};

module.exports = { otpRateLimiter };
