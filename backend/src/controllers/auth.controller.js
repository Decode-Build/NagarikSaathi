const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const OtpRequest = require('../models/OtpRequest');
const Citizen = require('../models/Citizen');
const { sendOTP } = require('../services/sms.service');
const { env } = require('../config/env');

const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString(); // 6 digits
};

const requestOtp = async (req, res) => {
  const { phone } = req.body;
  if (!phone) return res.status(400).json({ status: 'error', message: 'Phone is required' });

  const otp = generateOTP();
  const otpHash = await bcrypt.hash(otp, 10);
  
  // 5 minutes expiry
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

  // Invalidate any existing active OTPs for this phone
  await OtpRequest.updateMany(
    { phone, verified: false, expiresAt: { $gt: new Date() } },
    { $set: { expiresAt: new Date() } } // Expire them immediately
  );

  const otpReq = new OtpRequest({
    phone,
    otpHash,
    expiresAt
  });
  await otpReq.save();

  await sendOTP(phone, otp);

  res.json({ status: 'success', message: 'OTP sent successfully' });
};

const verifyOtp = async (req, res) => {
  const { phone, otp } = req.body;
  if (!phone || !otp) return res.status(400).json({ status: 'error', message: 'Phone and OTP required' });

  const otpReq = await OtpRequest.findOne({
    phone,
    verified: false,
    expiresAt: { $gt: new Date() }
  }).sort({ createdAt: -1 });

  if (!otpReq) {
    return res.status(400).json({ status: 'error', message: 'Invalid or expired OTP' });
  }

  otpReq.attempts += 1;

  const isValid = await bcrypt.compare(otp, otpReq.otpHash);
  
  if (!isValid) {
    await otpReq.save();
    return res.status(400).json({ status: 'error', message: 'Invalid OTP' });
  }

  otpReq.verified = true;
  await otpReq.save();

  // Find or create citizen
  let citizen = await Citizen.findOne({ phone });
  if (!citizen) {
    citizen = new Citizen({ phone });
    await citizen.save();
  }

  // Issue JWT
  const token = jwt.sign(
    { id: citizen._id, phone: citizen.phone, role: 'citizen' },
    env.JWT_SECRET,
    { expiresIn: '7d' }
  );

  res.json({
    status: 'success',
    data: { token, citizen }
  });
};

const operatorLogin = async (req, res) => {
  // Simple operator login for demo purposes
  const { username, password } = req.body;
  
  if (username === 'admin' && password === 'admin123') { // In real app, check against DB
    const token = jwt.sign(
      { id: 'operator1', role: 'operator' },
      env.JWT_SECRET,
      { expiresIn: '1d' }
    );
    return res.json({ status: 'success', data: { token } });
  }
  
  return res.status(401).json({ status: 'error', message: 'Invalid operator credentials' });
};

module.exports = { requestOtp, verifyOtp, operatorLogin };
