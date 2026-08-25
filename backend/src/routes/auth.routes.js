const express = require('express');
const router = express.Router();
const { requestOtp, verifyOtp, operatorLogin } = require('../controllers/auth.controller');
const { otpRateLimiter } = require('../middlewares/rate-limit.middleware');

router.post('/otp/request', otpRateLimiter, requestOtp);
router.post('/otp/verify', verifyOtp);
router.post('/operator/login', operatorLogin);

module.exports = router;
