const mongoose = require('mongoose');
const { Schema } = mongoose;

const handoutJobSchema = new Schema({
  jobId: { type: String, required: true, unique: true },
  citizenId: { type: Schema.Types.ObjectId, ref: 'Citizen', required: true },
  queryId: { type: String, required: true },
  schemeId: { type: String, required: true },
  status: { type: String, enum: ['queued', 'processing', 'completed', 'failed'], default: 'queued' },
  pdfUrl: String,
  attempts: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: Date
});

module.exports = mongoose.model('HandoutJob', handoutJobSchema);
