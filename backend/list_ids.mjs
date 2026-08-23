import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });
import mongoose from 'mongoose';
await mongoose.connect(process.env.MONGO_URI);
const schemes = await mongoose.connection.db.collection('schemes')
  .find({}, { projection: { schemeId: 1, name: 1, _id: 0 } }).toArray();
schemes.sort((a, b) => a.schemeId.localeCompare(b.schemeId))
  .forEach(s => console.log(s.schemeId.padEnd(42) + s.name));
await mongoose.disconnect();
