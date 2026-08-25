const crypto = require('crypto');
const EligibilityQuery = require('../models/EligibilityQuery');
const { callLiveAIMatcher } = require('../services/ai-matcher.service');
const { ruleMatch } = require('../services/rule-engine.service');
const logger = require('../utils/logger');

const checkEligibility = async (req, res) => {
  const citizenProfile = req.validatedBody;
  
  // Timeout wrapper
  const timeout = (ms) => new Promise((_, reject) => setTimeout(() => reject(new Error('AI Matcher Timeout')), ms));
  
  let source = 'live';
  let matchedSchemeIds = [];

  try {
    matchedSchemeIds = await Promise.race([
      callLiveAIMatcher(citizenProfile),
      timeout(3500)
    ]);
  } catch (err) {
    logger.warn('Falling back to rule engine due to error/timeout', { error: err.message });
    source = 'fallback';
    matchedSchemeIds = await ruleMatch(citizenProfile);
  }

  // Create EligibilityQuery log
  const queryId = crypto.randomUUID();
  
  const queryLog = new EligibilityQuery({
    queryId,
    citizenId: req.user ? req.user.id : null, // If authenticated later, attach user ID
    profileSnapshot: citizenProfile,
    matchedSchemeIds,
    source
  });
  
  await queryLog.save();

  res.json({
    status: 'success',
    data: {
      queryId,
      source,
      schemes: matchedSchemeIds
    }
  });
};

module.exports = { checkEligibility };
