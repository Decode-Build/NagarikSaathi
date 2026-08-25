const { z } = require('zod');
const dotenv = require('dotenv');

dotenv.config();

const envSchema = z.object({
  PORT: z.string().default('3000'),
  MONGODB_URI: z.string().min(1, 'MONGODB_URI is required'),
  REDIS_URL: z.string().min(1, 'REDIS_URL is required'),
  N8N_WEBHOOK_URL: z.string().url('N8N_WEBHOOK_URL must be a valid URL'),
  JWT_SECRET: z.string().min(1, 'JWT_SECRET is required'),
  OTP_SMS_GATEWAY_KEY: z.string().min(1, 'OTP_SMS_GATEWAY_KEY is required'),
  FRONTEND_ORIGIN: z.string().url('FRONTEND_ORIGIN must be a valid URL'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
});

const _env = envSchema.safeParse(process.env);

if (!_env.success) {
  console.error('❌ Invalid environment variables:', _env.error.format());
  process.exit(1);
}

module.exports = { env: _env.data };
