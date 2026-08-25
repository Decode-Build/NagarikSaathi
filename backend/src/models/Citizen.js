const mongoose = require('mongoose');
const { Schema } = mongoose;

const citizenSchema = new Schema({
  phone: { type: String, required: true, unique: true, index: true },
  name: String,
  age: Number,
  income: Number,
  state: { type: String, index: true },
  category: String, // e.g. 'general', 'SC', 'ST', 'OBC'
  occupation: String,
  preferredLanguage: { type: String, enum: ['en', 'hi', 'mr', 'ta', 'te', 'bn'], default: 'en' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Citizen', citizenSchema);
