const { Queue } = require('bullmq');
const crypto = require('crypto');
const { redisConnection } = require('../config/redis');
const HandoutJob = require('../models/HandoutJob');

const pdfQueue = new Queue('pdf-generation', {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 5,
    backoff: { type: 'exponential', delay: 2000 }
  }
});

const requestHandout = async (req, res) => {
  const { queryId, schemeId } = req.body;
  const citizenId = req.user.id;

  if (!queryId || !schemeId) {
    return res.status(400).json({ status: 'error', message: 'queryId and schemeId required' });
  }

  const jobId = crypto.randomUUID();

  // Save to DB
  const jobRecord = new HandoutJob({
    jobId,
    citizenId,
    queryId,
    schemeId,
    status: 'queued'
  });
  await jobRecord.save();

  // Enqueue job
  await pdfQueue.add('generate-pdf', {
    jobId,
    queryId,
    schemeId,
    citizenId
  }, { jobId }); // Use UUID as BullMQ job ID too

  res.json({
    status: 'success',
    data: { jobId, status: 'queued' }
  });
};

const getHandoutStatus = async (req, res) => {
  const { jobId } = req.params;
  
  const job = await HandoutJob.findOne({ jobId });
  if (!job) {
    return res.status(404).json({ status: 'error', message: 'Job not found' });
  }

  // Ensure citizen only fetches their own jobs
  if (job.citizenId.toString() !== req.user.id) {
    return res.status(403).json({ status: 'error', message: 'Forbidden' });
  }

  res.json({
    status: 'success',
    data: {
      jobId: job.jobId,
      status: job.status,
      pdfUrl: job.pdfUrl
    }
  });
};

module.exports = { requestHandout, getHandoutStatus };
