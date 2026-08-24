const { Queue, Worker } = require('bullmq');
const { redisConnection } = require('../config/redis');
const EligibilityQuery = require('../models/EligibilityQuery');
const TelemetrySnapshot = require('../models/TelemetrySnapshot');

const telemetryQueue = new Queue('telemetry-aggregation', { connection: redisConnection });

const startTelemetryWorker = async () => {
  // Add repeatable job (every 15 minutes)
  await telemetryQueue.add('aggregate-telemetry', {}, {
    repeat: {
      pattern: '*/15 * * * *'
    }
  });

  const worker = new Worker('telemetry-aggregation', async job => {
    console.log('📊 Running telemetry aggregation...');

    // 1. Total distinct citizens served (distinct citizenIds where not null)
    const distinctCitizens = await EligibilityQuery.distinct('citizenId', { citizenId: { $ne: null } });
    const totalCitizensServed = distinctCitizens.length;

    // 2. Top 5 Schemes (by total queries)
    const topSchemesAgg = await EligibilityQuery.aggregate([
      { $unwind: "$matchedSchemeIds" },
      { $group: { _id: "$matchedSchemeIds", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);
    
    // We might want to join with Scheme collection to get names, but for now we just use the IDs
    // Assuming a simple map for demo, or a secondary lookup
    const mongoose = require('mongoose');
    const Scheme = mongoose.model('Scheme');
    
    const topSchemes = await Promise.all(topSchemesAgg.map(async ts => {
      const scheme = await Scheme.findOne({ schemeId: ts._id });
      return {
        schemeId: ts._id,
        name: scheme ? scheme.name : 'Unknown',
        count: ts.count
      };
    }));

    // 3. State Distribution
    const stateDistributionAgg = await EligibilityQuery.aggregate([
      { $group: { _id: "$profileSnapshot.state", count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    const stateDistribution = stateDistributionAgg.map(sd => ({
      state: sd._id || 'Unknown',
      count: sd.count
    }));

    // 4. Save Snapshot
    const snapshot = new TelemetrySnapshot({
      totalCitizensServed,
      topSchemes,
      stateDistribution
    });

    await snapshot.save();
    console.log('✅ Telemetry aggregation complete');

  }, { connection: redisConnection });

  console.log('👷 Telemetry Worker started');
  return worker;
};

module.exports = { startTelemetryWorker };
