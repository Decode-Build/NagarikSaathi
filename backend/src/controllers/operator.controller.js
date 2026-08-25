const TelemetrySnapshot = require('../models/TelemetrySnapshot');

const getTelemetry = async (req, res) => {
  try {
    const snapshot = await TelemetrySnapshot.findOne().sort({ computedAt: -1 });
    
    if (!snapshot) {
      return res.json({
        status: 'success',
        data: {
          computedAt: new Date(),
          totalCitizensServed: 0,
          topSchemes: [],
          stateDistribution: []
        }
      });
    }

    res.json({
      status: 'success',
      data: snapshot
    });
  } catch (err) {
    console.error('Error fetching telemetry:', err);
    res.status(500).json({ status: 'error', message: 'Failed to fetch telemetry' });
  }
};

module.exports = { getTelemetry };
