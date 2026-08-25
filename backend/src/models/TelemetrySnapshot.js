const mongoose = require('mongoose');
const { Schema } = mongoose;

const telemetrySnapshotSchema = new Schema({
  computedAt: { type: Date, default: Date.now },
  totalCitizensServed: Number,
  topSchemes: [{ schemeId: String, name: String, count: Number }],
  stateDistribution: [{ state: String, count: Number }]
});

module.exports = mongoose.model('TelemetrySnapshot', telemetrySnapshotSchema);
