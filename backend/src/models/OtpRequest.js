const mongoose = require('mongoose');
const { Schema } = mongoose;

const otpRequestSchema = new Schema({
  phone: { type: String, required: true, index: true },
  otpHash: { type: String, required: true },
  expiresAt: { type: Date, required: true },
  attempts: { type: Number, default: 0 },
  verified: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

// TTL index — auto-deletes expired OTPs
otpRequestSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('OtpRequest', otpRequestSchema);
