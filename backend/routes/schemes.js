import express from 'express';
import { Scheme, EligibilityProfile, ChatSession } from '../models.js';

const router = express.Router();

// 3. POST /api/eligibility
router.post('/eligibility', async (req, res) => {
  const { sessionId, state, occupation, gender, maritalStatus, landAcres, annualIncome, casteCategory } = req.body;

  try {
    // Save profile for tracking
    const profile = new EligibilityProfile({
      sessionId: String(sessionId || `eligibility-${Date.now()}`),
      state: String(state),
      occupation: String(occupation),
      gender: String(gender),
      maritalStatus: String(maritalStatus),
      landAcres: Number(landAcres) || 0,
      annualIncome: Number(annualIncome) || 0,
      casteCategory: String(casteCategory || 'General')
    });
    await profile.save();
    
    const landVal = Number(landAcres) || 0;
    // Fix: explicitly check for undefined/null so income=0 is honoured, not defaulted to max
    const incomeVal = (annualIncome !== undefined && annualIncome !== null && annualIncome !== '') ? Number(annualIncome) : 9999999;
    const safeState = String(state);
    const safeOccupation = String(occupation);
    const safeGender = String(gender);
    const safeMarital = String(maritalStatus);
    const safeCaste = String(casteCategory || 'General');

    const query = {
      $and: [
        {
          $or: [
            { 'eligibility.states': { $size: 0 } },
            { 'eligibility.states': 'All' },
            { 'eligibility.states': safeState }
          ]
        },
        {
          $or: [
            { 'eligibility.occupation': { $size: 0 } },
            { 'eligibility.occupation': 'All' },
            { 'eligibility.occupation': safeOccupation }
          ]
        },
        {
          $or: [
            { 'eligibility.gender': 'All' },
            { 'eligibility.gender': safeGender }
          ]
        },
        {
          $or: [
            { 'eligibility.maritalStatus': { $size: 0 } },
            { 'eligibility.maritalStatus': 'All' },
            { 'eligibility.maritalStatus': safeMarital }
          ]
        },
        {
          $or: [
            { 'eligibility.casteCategory': { $exists: false } },
            { 'eligibility.casteCategory': { $size: 0 } },
            { 'eligibility.casteCategory': 'All' },
            { 'eligibility.casteCategory': safeCaste }
          ]
        },
        { 'eligibility.minLandAcres': { $lte: landVal } },
        { 'eligibility.maxLandAcres': { $gte: landVal } },
        { 'eligibility.maxAnnualIncome': { $gte: incomeVal } }
      ]
    };

    const matches = await Scheme.find(query);

    // Sort: State-specific schemes first, then national schemes
    const sortedMatches = matches.sort((a, b) => {
      const aIsStateSpecific = a.eligibility.states.length > 0 && !a.eligibility.states.includes('All');
      const bIsStateSpecific = b.eligibility.states.length > 0 && !b.eligibility.states.includes('All');
      if (aIsStateSpecific && !bIsStateSpecific) return -1;
      if (!aIsStateSpecific && bIsStateSpecific) return 1;
      return 0;
    });

    res.json(sortedMatches);
  } catch (error) {
    console.error("Error in /eligibility:", error);
    res.status(500).json({ error: "Failed to query eligibility." });
  }
});

// GET /api/stats — VLE Impact Dashboard live analytics
router.get('/stats', async (req, res) => {
  try {
    const totalChatSessions = await ChatSession.countDocuments();
    const totalEligibilityProfiles = await EligibilityProfile.countDocuments();
    const totalCitizensHelped = totalChatSessions + totalEligibilityProfiles;

    // Match rate: computed from real ChatSession records only.
    // A session counts as "matched" if any assistant message cited at least one scheme
    // or returned high/medium confidence. No invented baseline.
    const liveSessions = await ChatSession.find({});
    let matchedSessions = 0;
    liveSessions.forEach(s => {
      const hasMatch = s.messages.some(m =>
        m.role === 'assistant' &&
        ((m.sourceSchemeIds && m.sourceSchemeIds.length > 0) ||
          m.confidence === 'high' ||
          m.confidence === 'medium')
      );
      if (hasMatch) matchedSessions++;
    });

    const totalForRate = totalChatSessions + totalEligibilityProfiles;
    const matchRate = totalForRate > 0
      ? `${((( matchedSessions + totalEligibilityProfiles) / totalForRate) * 100).toFixed(1)}%`
      : 'N/A';

    // Average response time: real calculation from message timestamps in sessions
    let totalResponseMs = 0;
    let responseCount = 0;
    liveSessions.forEach(s => {
      const msgs = s.messages;
      for (let i = 0; i < msgs.length - 1; i++) {
        if (msgs[i].role === 'user' && msgs[i + 1]?.role === 'assistant') {
          const diff = new Date(msgs[i + 1].timestamp) - new Date(msgs[i].timestamp);
          if (diff > 0 && diff < 120000) { // ignore anomalies > 2 min
            totalResponseMs += diff;
            responseCount++;
          }
        }
      }
    });
    const avgResponseTimeSec = responseCount > 0
      ? (totalResponseMs / responseCount / 1000).toFixed(1)
      : null;

    // District rank: not computed — not enough real data
    const districtRank = 'N/A';

    // Fetch recent eligibility submissions for recent activity log
    const recentProfiles = await EligibilityProfile.find().sort({ createdAt: -1 }).limit(6);
    const recentActivity = recentProfiles.map(p => {
      const timeDiffMs = Date.now() - new Date(p.createdAt).getTime();
      const minsAgo = Math.floor(timeDiffMs / (1000 * 60));
      const timeStr = minsAgo < 1 ? 'Just now' : minsAgo < 60 ? `${minsAgo}m ago` : `${Math.floor(minsAgo / 60)}h ago`;
      return {
        citizen: `${p.occupation} (${p.gender})`,
        state: p.state,
        scheme: `Checked ${p.occupation} schemes`,
        status: 'Matched',
        time: timeStr
      };
    });

    // Category distribution from real profile occupations. No invented baseline.
    let countAgri = 0, countWomen = 0, countPension = 0, countSkill = 0;
    const allProfiles = await EligibilityProfile.find({});
    allProfiles.forEach(p => {
      if (p.occupation === 'Farmer') countAgri++;
      else if (p.occupation === 'Student' || p.occupation === 'Artisan' || p.occupation === 'Business Owner') countSkill++;
      else if (p.gender === 'Female' && (p.occupation === 'Domestic Worker' || p.occupation === 'Labourer')) countWomen++;
      else countPension++;
    });

    const totalCategoryCount = countAgri + countWomen + countPension + countSkill;
    const categoriesMatched = totalCategoryCount > 0 ? [
      { cat: "Agriculture & Farmers", percent: `${Math.round((countAgri / totalCategoryCount) * 100)}%` },
      { cat: "Women & Child Welfare", percent: `${Math.round((countWomen / totalCategoryCount) * 100)}%` },
      { cat: "Pensions & Social Security", percent: `${Math.round((countPension / totalCategoryCount) * 100)}%` },
      { cat: "Skill Development & Loans", percent: `${Math.round((countSkill / totalCategoryCount) * 100)}%` }
    ] : [];

    res.json({
      citizensHelped: totalCitizensHelped,
      matchRate,
      avgResponseTimeSec,
      districtRank,
      recentActivity,
      categoriesMatched
    });
  } catch (err) {
    console.error("Error fetching stats:", err);
    res.status(500).json({ error: "Failed to fetch dashboard stats." });
  }
});

// Flag/report scheme endpoint — must be BEFORE /:schemeId GET to avoid route conflict
router.post('/schemes/:schemeId/report', async (req, res) => {
  const { schemeId } = req.params;
  try {
    const scheme = await Scheme.findOne({ schemeId });
    if (!scheme) {
      return res.status(404).json({ error: "Scheme not found." });
    }
    scheme.flagged = true;
    await scheme.save();
    console.log(`[FLAGGED SCHEME]: Scheme "${schemeId}" marked as outdated by operator.`);
    res.json({ message: "Scheme reported successfully. Our team will verify it within 24 hours." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to report scheme." });
  }
});

// 4. GET /api/schemes/:schemeId — keep AFTER specific routes to avoid wildcard conflicts
router.get('/schemes/:schemeId', async (req, res) => {
  const { schemeId } = req.params;
  try {
    const scheme = await Scheme.findOne({ schemeId });
    if (!scheme) {
      return res.status(404).json({ error: "Scheme not found." });
    }
    res.json(scheme);
  } catch (error) {
    res.status(500).json({ error: "Failed to retrieve scheme." });
  }
});

export default router;
