const { env } = require('../config/env');

const sendOTP = async (phone, otp) => {
  // Stubbed SMS gateway implementation
  // In reality, you'd use a service like Twilio, Msg91, etc.
  console.log(`📱 [SMS Stub] Sending OTP ${otp} to phone ${phone}`);
  console.log(`   Gateway Key: ${env.OTP_SMS_GATEWAY_KEY ? 'Present' : 'Missing'}`);
  
  return Promise.resolve(true);
};

module.exports = { sendOTP };
