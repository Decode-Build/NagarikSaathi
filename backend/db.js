import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import dns from 'dns';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dns.setDefaultResultOrder('ipv4first');
dotenv.config({ path: path.join(__dirname, '.env') });

const connectDB = async () => {
  try {
    const uri = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/nagariksaathi';
    if (uri) {
      const conn = await mongoose.connect(uri, { serverSelectionTimeoutMS: 2000 });
      console.log(`MongoDB Connected: ${conn.connection.host}`);
      return;
    }
    console.log('No MONGO_URI provided, running in offline/mock mode.');
  } catch (error) {
    console.warn(`MongoDB Connection Note: ${error.message} - Backend running with local in-memory fallback.`);
  }
};

export default connectDB;
