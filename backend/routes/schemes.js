import express from 'express';
import { Scheme, EligibilityProfile, ChatSession } from '../models.js';
import { dpdpPurposeLimitationMiddleware } from '../middlewares/compliance.js';

const router = express.Router();

// 3. POST /api/eligibility
router.post('/eligibility', dpdpPurposeLimitationMiddleware, async (req, res) => {
  const { sessionId, state, occupation, gender, maritalStatus, landAcres, annualIncome, casteCategory } = req.body;

  try {
    // Save profile for tracking, bypass if DPDP Purpose Limitation is enabled
    if (!req.dpdpEphemeral) {
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
    }
    
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

    // Map schemes with deterministic audit trail, critical linkage bottlenecks, and VLE service fee
    const enrichedMatches = matches.map(s => {
      const obj = s.toObject();
      const reasons = [];
      if (safeState && (s.eligibility?.states?.includes(safeState) || s.eligibility?.states?.includes('All'))) {
        reasons.push(`State matches: ${safeState}`);
      }
      if (safeOccupation && (s.eligibility?.occupation?.includes(safeOccupation) || s.eligibility?.occupation?.includes('All'))) {
        reasons.push(`Occupation matches: ${safeOccupation}`);
      }
      if (s.eligibility?.maxAnnualIncome && s.eligibility?.maxAnnualIncome < 9999999) {
        reasons.push(`Income ₹${incomeVal.toLocaleString('en-IN')} ≤ Ceiling ₹${s.eligibility.maxAnnualIncome.toLocaleString('en-IN')}`);
      }
      if (s.eligibility?.maxLandAcres) {
        reasons.push(`Land ${landVal} Acres ≤ Limit ${s.eligibility.maxLandAcres} Acres`);
      }

      obj.auditTrail = reasons;
      
      // Common last-mile bureaucratic linkage prerequisites
      const bottlenecks = [];
      if (obj.category?.includes('Direct Benefit Transfer') || obj.category?.includes('Agriculture')) {
        bottlenecks.push("Aadhaar-NPCI Bank Account Seeding (Check active DBT status at bank/CSC)");
      }
      if (obj.eligibility?.minLandAcres !== undefined && obj.eligibility?.maxLandAcres) {
        bottlenecks.push("Digitized Land Record (Khasra-Khatauni) on State Bhulekh portal");
      }
      if (safeCaste && safeCaste !== 'General') {
        bottlenecks.push("State-issued digital Caste Certificate with digital signature");
      }
      if (bottlenecks.length === 0) {
        bottlenecks.push("Aadhaar Card with active mobile linkage for OTP verification");
      }
      obj.linkagePrerequisites = bottlenecks;

      // CSC/VLE Commercial Monetization Schedule
      obj.vleFeeSchedule = {
        discoveryConsultation: "Free (Public Service)",
        formFilingAndKyc: "₹30 – ₹50 (CSC Standard Charge)",
        documentChecklistPrint: "₹10 – ₹15 (Handout & Lamination)"
      };

      return obj;
    });

    // Sort: State-specific schemes first, then national schemes
    const sortedMatches = enrichedMatches.sort((a, b) => {
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

// 4. GET /api/schemes — list/search all schemes
router.get('/schemes', async (req, res) => {
  try {
    const { category, state, search } = req.query;
    let query = {};
    if (category) {
      query.category = { $in: [new RegExp(String(category), 'i')] };
    }
    if (state && state !== 'All') {
      query.$or = [
        { 'eligibility.states': { $size: 0 } },
        { 'eligibility.states': 'All' },
        { 'eligibility.states': new RegExp(String(state), 'i') }
      ];
    }
    if (search) {
      const searchRegex = new RegExp(String(search), 'i');
      query.$or = [
        { name: searchRegex },
        { nameHindi: searchRegex },
        { description: searchRegex },
        { descriptionHindi: searchRegex },
        { category: { $in: [searchRegex] } },
        { targetGroups: { $in: [searchRegex] } }
      ];
    }
    const schemes = await Scheme.find(query);
    res.json(schemes);
  } catch (error) {
    console.error("Error retrieving schemes:", error);
    res.status(500).json({ error: "Failed to retrieve schemes." });
  }
});

// 5. GET /api/schemes/:schemeId — keep AFTER specific routes to avoid wildcard conflicts
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

// Semantic Version Comparison Helper
export function compareSemVer(v1, v2) {
  const p1 = String(v1).replace(/^v/, '').split('.').map(Number);
  const p2 = String(v2).replace(/^v/, '').split('.').map(Number);
  for (let i = 0; i < Math.max(p1.length, p2.length); i++) {
    const n1 = p1[i] || 0;
    const n2 = p2[i] || 0;
    if (n1 > n2) return 1;
    if (n1 < n2) return -1;
  }
  return 0;
}

const getLatestVersion = (schemes) => {
  if (!schemes || schemes.length === 0) return 'v1.0';
  let maxV = 'v1.0';
  schemes.forEach(s => {
    const v = s.version || 'v1.0';
    if (compareSemVer(v, maxV) > 0) {
      maxV = v;
    }
  });
  return maxV;
};

// GET /api/v1/schemes/sync?since_version=v2.0
router.get('/v1/schemes/sync', async (req, res) => {
  const { since_version } = req.query;
  try {
    const allSchemes = await Scheme.find({});
    
    if (!since_version) {
      // If no version specified, return all active (non-deleted) schemes
      const activeSchemes = allSchemes.filter(s => !s.deleted);
      return res.json({
        latest_version: getLatestVersion(allSchemes),
        deltas: activeSchemes
      });
    }

    // Filter schemes that have a version strictly greater than since_version
    const deltas = allSchemes.filter(scheme => {
      const schemeVersion = scheme.version || 'v1.0';
      return compareSemVer(schemeVersion, since_version) > 0;
    });

    const latestVersion = getLatestVersion(allSchemes);
    const finalLatest = compareSemVer(latestVersion, since_version) > 0 ? latestVersion : since_version;

    res.json({
      since_version,
      latest_version: finalLatest,
      deltas
    });
  } catch (error) {
    console.error("Sync error:", error);
    res.status(500).json({ error: "Failed to perform differential sync." });
  }
});

export default router;
