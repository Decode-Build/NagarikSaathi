const mongoose = require('mongoose');
const { Schema } = mongoose;

const eligibilityQuerySchema = new Schema({
  queryId: { type: String, required: true, unique: true },
  citizenId: { type: Schema.Types.ObjectId, ref: 'Citizen' }, // null if unauthenticated
  profileSnapshot: Schema.Types.Mixed,
  matchedSchemeIds: [String],
  source: { type: String, enum: ['live', 'fallback'], required: true },
  createdAt: { type: Date, default: Date.now, index: true }
});

module.exports = mongoose.model('EligibilityQuery', eligibilityQuerySchema);
