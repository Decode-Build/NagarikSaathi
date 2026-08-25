const { Worker } = require('bullmq');
const axios = require('axios'); // or native fetch
const { redisConnection } = require('../config/redis');
const { generatePdf } = require('../services/pdf.service');
const HandoutJob = require('../models/HandoutJob');
const EligibilityQuery = require('../models/EligibilityQuery');
const { Scheme, resolveLocalized } = require('../models/Scheme');
const Citizen = require('../models/Citizen');
const { env } = require('../config/env');
const logger = require('../utils/logger');

const startPdfWorker = () => {
  const worker = new Worker('pdf-generation', async job => {
    const { jobId, queryId, schemeId, citizenId } = job.data;
    
    // Update attempt count
    await HandoutJob.findOneAndUpdate({ jobId }, { status: 'processing', $inc: { attempts: 1 } });

    // Fetch necessary data
    const query = await EligibilityQuery.findOne({ queryId });
    const scheme = await Scheme.findOne({ schemeId });
    const citizen = await Citizen.findById(citizenId);

    if (!query || !scheme || !citizen) {
      throw new Error('Data required for PDF generation missing');
    }

    const lang = citizen.preferredLanguage || 'en';

    const staticStrings = {
      en: {
        titleText: 'Government Scheme Handout',
        subtitleText: 'Eligibility Match Report',
        descriptionLabel: 'Description',
        benefitsLabel: 'Benefits',
        portalLabel: 'Official Portal',
        profileSnapshotText: 'Citizen Profile Snapshot',
        phoneLabel: 'Phone',
        stateLabel: 'State',
        ageLabel: 'Age',
        generatedOnText: 'Generated on',
        queryIdText: 'Query ID'
      },
      hi: {
        titleText: 'सरकारी योजना हैंडआउट',
        subtitleText: 'पात्रता मिलान रिपोर्ट',
        descriptionLabel: 'विवरण',
        benefitsLabel: 'लाभ',
        portalLabel: 'आधिकारिक पोर्टल',
        profileSnapshotText: 'नागरिक प्रोफाइल स्नैपशॉट',
        phoneLabel: 'फ़ोन',
        stateLabel: 'राज्य',
        ageLabel: 'आयु',
        generatedOnText: 'निर्मित दिनांक',
        queryIdText: 'क्वेरी आईडी'
      }
    };

    const t = staticStrings[lang] || staticStrings['en'];

    const templateData = {
      lang,
      schemeName: resolveLocalized(scheme.name, lang),
      schemeDescription: resolveLocalized(scheme.description, lang),
      schemeBenefits: resolveLocalized(scheme.benefits, lang),
      applyUrl: scheme.applyUrl,
      phone: citizen.phone,
      state: citizen.state,
      age: citizen.age,
      date: new Date().toLocaleDateString(),
      queryId,
      ...t
    };

    // Generate PDF
    const pdfUrl = await generatePdf(templateData, jobId);

    // Save success status
    await HandoutJob.findOneAndUpdate({ jobId }, { status: 'completed', pdfUrl, updatedAt: new Date() });

    // Fire webhook (fire-and-forget)
    try {
      await axios.post(env.N8N_WEBHOOK_URL, {
        citizenId,
        phone: citizen.phone,
        pdfUrl: `${env.FRONTEND_ORIGIN}${pdfUrl}` // Or your backend origin depending on architecture
      });
    } catch (err) {
      console.error('Webhook dispatch failed:', err.message);
      // We don't fail the job if just the webhook fails, or do we? 
      // The PRD doesn't explicitly state. Let's assume PDF generation is the core task.
    }

    return pdfUrl;

  }, { connection: redisConnection });

  worker.on('failed', async (job, err) => {
    logger.error(`Job ${job.id} failed: ${err.message}`);
    // If it's exhausted all retries, mark as failed in DB
    if (job.attemptsMade >= job.opts.attempts) {
      await HandoutJob.findOneAndUpdate({ jobId: job.data.jobId }, { status: 'failed', updatedAt: new Date() });
      logger.error(`🚨 ALERT: Job ${job.id} has exhausted all retries.`);
    }
  });
  
  console.log('👷 PDF Worker started');
  return worker;
};

module.exports = { startPdfWorker };
