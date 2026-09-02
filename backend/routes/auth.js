import express from 'express';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';
import { User } from '../models.js';
import { zeroStorageComplianceMiddleware } from '../middlewares/compliance.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'nagarik_saathi_prod_jwt_secret_token_2026_secure';

// Rate limiting for auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Development-friendly limit
  message: { error: "Too many requests from this IP, please try again after 15 minutes." }
});

router.use(authLimiter);


// Helper
export const getUserFromHeader = (req) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      return jwt.verify(token, JWT_SECRET);
    } catch (e) {
      return null;
    }
  }
};

// Auth middleware for protected routes
export const requireAuth = (req, res, next) => {
  const user = getUserFromHeader(req);
  if (!user) {
    return res.status(401).json({ error: "Unauthorized access" });
  }
  req.user = user;
  next();
};

router.post('/register', zeroStorageComplianceMiddleware, async (req, res) => {
  const { username, password, age, occupation, state, gender, maritalStatus, phone, is_seeded, identity_status, identity_token } = req.body;

  if (!username || !password || !age || !occupation || !state || !gender || !maritalStatus || !phone) {
    return res.status(400).json({ error: "All registration fields including phone number are required." });
  }
  
  if (password.length < 8) {
    return res.status(400).json({ error: "Password must be at least 8 characters long." });
  }

  try {
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ error: "Username already exists." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({
      username,
      password: hashedPassword,
      phone,
      isPhoneVerified: false,
      profile: {
        age: Number(age),
        occupation,
        state,
        gender,
        maritalStatus,
        is_seeded: is_seeded === 'true' || is_seeded === true,
        identity_status: identity_status || 'UNVERIFIED',
        identity_token: identity_token || null
      }
    });

    // Generate Mock OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpHash = await bcrypt.hash(otp, 10);
    
    newUser.otpHash = otpHash;
    newUser.otpExpiry = new Date(Date.now() + 10 * 60000); // 10 minutes expiry
    newUser.otpAttempts = 0;
    newUser.otpCooldown = new Date(Date.now() + 60000); // 1 minute cooldown for resend

    await newUser.save();
    
    // MOCK SMS DELIVERY
    console.log(`\n=== MOCK SMS PROVIDER ===\nTo: ${phone}\nMessage: Your NagarikSaathi OTP is ${otp}. It expires in 10 minutes.\n=========================\n`);

    res.status(201).json({
      message: "User registered. OTP sent for verification.",
      requireOtp: true,
      username: newUser.username
    });
  } catch (error) {
    console.error("Register Error:", error);
    res.status(500).json({ error: "Failed to register user." });
  }
});

router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: "Username and password are required." });
  }

  try {
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(400).json({ error: "Invalid username or password." });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: "Invalid username or password." });
    }

    // Always require OTP on every login for security — no session without OTP verification
    if (user.otpCooldown && user.otpCooldown > new Date()) {
      return res.status(429).json({ error: "Please wait before requesting another OTP." });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpHash = await bcrypt.hash(otp, 10);
    user.otpHash = otpHash;
    user.otpExpiry = new Date(Date.now() + 10 * 60000); // 10 minutes
    user.otpAttempts = 0;
    user.otpCooldown = new Date(Date.now() + 60000); // 1 minute resend cooldown
    await user.save();

    console.log(`\n=== MOCK SMS PROVIDER ===\nTo: ${user.phone}\nMessage: Your NagarikSaathi OTP is ${otp}. It expires in 10 minutes.\n=========================\n`);

    return res.json({
      message: "OTP sent to your registered phone number. Please verify to continue.",
      requireOtp: true,
      username: user.username
    });
  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ error: "Failed to log in." });
  }
});

// OTP Request Route
router.post('/request-otp', async (req, res) => {
  const { username } = req.body;
  if (!username) {
    return res.status(400).json({ error: "Username is required." });
  }

  try {
    const user = await User.findOne({ username });
    // Do not reveal if user does not exist to prevent enumeration
    if (!user) {
      return res.json({ message: "If the user exists, an OTP has been sent." });
    }

    if (user.otpCooldown && user.otpCooldown > new Date()) {
      return res.status(429).json({ error: "Please wait before requesting another OTP." });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpHash = await bcrypt.hash(otp, 10);
    
    user.otpHash = otpHash;
    user.otpExpiry = new Date(Date.now() + 10 * 60000);
    user.otpAttempts = 0;
    user.otpCooldown = new Date(Date.now() + 60000); // 1 minute cooldown
    await user.save();

    console.log(`\n=== MOCK SMS PROVIDER ===\nTo: ${user.phone}\nMessage: Your NagarikSaathi OTP is ${otp}. It expires in 10 minutes.\n=========================\n`);
    
    res.json({ message: "If the user exists, an OTP has been sent." });
  } catch (error) {
    console.error("OTP Request Error:", error);
    res.status(500).json({ error: "Failed to process OTP request." });
  }
});

// OTP Verification Route
router.post('/verify-otp', async (req, res) => {
  const { username, otp } = req.body;
  if (!username || !otp) {
    return res.status(400).json({ error: "Username and OTP are required." });
  }

  try {
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(400).json({ error: "Invalid OTP." }); // Vague message
    }

    if (user.otpAttempts >= 5) {
      return res.status(429).json({ error: "Too many failed attempts. Please request a new OTP." });
    }

    if (!user.otpExpiry || user.otpExpiry < new Date()) {
      return res.status(400).json({ error: "OTP has expired. Please request a new one." });
    }

    const isMatch = await bcrypt.compare(otp.toString(), user.otpHash || '');
    if (!isMatch) {
      user.otpAttempts += 1;
      await user.save();
      return res.status(400).json({ error: "Invalid OTP." });
    }

    // OTP matched
    user.isPhoneVerified = true;
    user.otpHash = undefined;
    user.otpExpiry = undefined;
    user.otpAttempts = 0;
    user.otpCooldown = undefined;
    await user.save();

    const token = jwt.sign({ userId: user._id, username: user.username }, JWT_SECRET, { expiresIn: '24h' });

    res.json({
      message: "Phone verified successfully",
      token,
      user: {
        username: user.username,
        profile: user.profile
      }
    });
  } catch (error) {
    console.error("OTP Verification Error:", error);
    res.status(500).json({ error: "Failed to verify OTP." });
  }
});

router.post('/guest', async (req, res) => {
  if (process.env.NODE_ENV === 'production' && process.env.ALLOW_GUEST_LOGIN !== 'true') {
    return res.status(403).json({ error: "Guest login is disabled in production." });
  }

  const defaultProfile = {
    age: 28,
    occupation: 'Farmer',
    state: 'Madhya Pradesh',
    gender: 'Male',
    maritalStatus: 'Married'
  };

  try {
    let userId = 'guest_operator_id_1';
    let username = 'guest_operator';
    let profile = defaultProfile;

    if (mongoose.connection.readyState === 1) {
      try {
        let guestUser = await User.findOne({ username: 'guest_operator' });
        if (!guestUser) {
          const hashedPassword = await bcrypt.hash('guest123', 10);
          guestUser = new User({
            username: 'guest_operator',
            password: hashedPassword,
            profile: defaultProfile
          });
          await guestUser.save();
        }
        userId = guestUser._id;
        username = guestUser.username;
        profile = guestUser.profile;
      } catch (dbErr) {
        console.warn("DB user query failed in guest login:", dbErr.message);
      }
    }

    const token = jwt.sign({ userId, username }, JWT_SECRET, { expiresIn: '24h' });
    res.json({
      message: "Logged in as guest",
      token,
      user: {
        username,
        profile
      }
    });
  } catch (error) {
    console.error("Guest login error:", error);
    res.status(500).json({ error: "Failed to authenticate as guest." });
  }
});

router.get('/me', async (req, res) => {
  const user = getUserFromHeader(req);
  if (!user) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  try {
    const dbUser = await User.findById(user.userId).select('-password');
    if (!dbUser) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json(dbUser);
  } catch (e) {
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
