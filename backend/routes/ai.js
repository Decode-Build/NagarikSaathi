import express from 'express';
import multer from 'multer';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { DraftRule } from '../models.js';
import mongoose from 'mongoose';

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit for policy documents
});

const getGenAI = () => {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenerativeAI(apiKey);
};

/**
 * Helper to call Tavily Web Search API
 */
const searchTavily = async (query, state = null) => {
  const tavilyApiKey = process.env.TAVILY_API_KEY;
  if (!tavilyApiKey) return null;

  let searchQuery = query;
  if (state && !searchQuery.toLowerCase().includes(state.toLowerCase())) {
    searchQuery += ` ${state} government scheme`;
  } else {
    searchQuery += ' India government welfare scheme';
  }

  try {
    const res = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: tavilyApiKey,
        query: searchQuery,
        search_depth: 'advanced',
        max_results: 6,
        include_answer: true,
        include_domains: ['india.gov.in', 'myscheme.gov.in', 'pib.gov.in', 'pmindia.gov.in', 'gov.in']
      })
    });

    if (!res.ok) {
      console.warn('Tavily search returned status:', res.status);
      return null;
    }

    return await res.json();
  } catch (err) {
    console.warn('Tavily search request failed:', err.message);
    return null;
  }
};

/**
 * 1. POST /api/ai/live-search
 * Real-time Tavily live web discovery + Gemini Scheme reasoning
 */
router.post('/live-search', async (req, res) => {
  try {
    const { query, state, occupation, category, language = 'en' } = req.body;

    if (!query || !query.trim()) {
      return res.status(400).json({ error: 'Search query is required.' });
    }

    const genAI = getGenAI();
    if (!genAI) {
      return res.status(503).json({ error: 'Gemini API is not configured on the server.' });
    }

    // 1. Fetch live web results via Tavily
    const tavilyResults = await searchTavily(query, state);
    const searchContext = tavilyResults?.results
      ? tavilyResults.results.map(r => `Title: ${r.title}\nURL: ${r.url}\nSnippet: ${r.content}`).join('\n---\n')
      : 'No live web search API key configured; rely on verified government knowledge base.';

    // 2. Synthesize with Gemini
    const model = genAI.getGenerativeModel({ model: 'gemini-3.5-flash' });
    const prompt = `
You are NagarikSaathi's expert Indian Government Scheme Matcher and Policy Analyst.
Analyze the user's need against verified government welfare schemes.

User Query: "${query}"
User Profile Filters (if provided):
- State: ${state || 'Any / All India'}
- Occupation: ${occupation || 'Unspecified'}
- Category: ${category || 'General'}
- Preferred Output Language: ${language === 'hi' ? 'Hindi' : 'English'}

Live Web Search Context:
---
${searchContext}
---

Return strictly a valid JSON object matching this schema (no markdown formatting or extra commentary):
{
  "summary": "Brief 1-2 sentence overview of available schemes in ${language === 'hi' ? 'Hindi' : 'English'}",
  "matches": [
    {
      "schemeName": "Official Scheme Name",
      "schemeNameHindi": "योजना का आधिकारिक नाम",
      "matchScore": number (0 to 100 fit score),
      "reasoning": "Why this scheme matches the citizen's situation",
      "benefits": "Key financial or material assistance details",
      "eligibilityCriteria": ["Criterion 1", "Criterion 2"],
      "eligibilityGaps": ["Any missing requirements like land ceiling or caste certificate"],
      "requiredDocuments": ["Aadhaar Card", "Bank Account", "Income Certificate"],
      "portalUrl": "Official application URL or https://www.india.gov.in",
      "helpline": "Helpline number or 1800-111-999",
      "ministry": "Responsible Ministry / Department",
      "isStateSpecific": boolean
    }
  ]
}
`;

    const result = await model.generateContent(prompt);
    let text = result.response.text().trim();

    if (text.startsWith('```json')) {
      text = text.replace(/^```json\s*/i, '').replace(/\s*```$/, '').trim();
    } else if (text.startsWith('```')) {
      text = text.replace(/^```\s*/, '').replace(/\s*```$/, '').trim();
    }

    const firstBrace = text.indexOf('{');
    const lastBrace = text.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1) {
      text = text.substring(firstBrace, lastBrace + 1);
    }

    const parsedData = JSON.parse(text);

    return res.json({
      success: true,
      query,
      liveWebPowered: Boolean(tavilyResults),
      data: parsedData
    });

  } catch (err) {
    console.error('Error in /api/ai/live-search:', err);
    res.status(500).json({ error: 'Failed to complete live scheme search: ' + err.message });
  }
});

/**
 * 2. POST /api/ai/extract-rule
 * Extracts structured DraftRule from policy text or uploaded gazette PDF
 */
router.post('/extract-rule', upload.single('document'), async (req, res) => {
  try {
    const { text, sourceReference = 'Government Gazette Notification', autoSave = true } = req.body;
    let contentToAnalyze = text || '';

    const genAI = getGenAI();
    if (!genAI) {
      return res.status(503).json({ error: 'Gemini API is not configured on the server.' });
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-3.5-flash' });

    let contentsPayload;
    if (req.file) {
      const base64Data = req.file.buffer.toString('base64');
      const mimeType = req.file.mimetype || 'application/pdf';
      contentsPayload = [
        {
          inlineData: {
            data: base64Data,
            mimeType: mimeType
          }
        },
        `You are a senior government policy analyst. Analyze this uploaded official government gazette, scheme circular, or policy document. Extract all rules and details into the specified JSON format. Reference: ${sourceReference}`
      ];
    } else if (contentToAnalyze) {
      contentsPayload = `
You are a senior government policy analyst. Analyze the following government scheme circular/gazette text and extract all operational rules.

Source Reference: ${sourceReference}

Text to Analyze:
---
${contentToAnalyze}
---
`;
    } else {
      return res.status(400).json({ error: 'Please provide either text or upload a document file to analyze.' });
    }

    const extractionPrompt = `
Extract the scheme into strictly valid JSON matching this schema without markdown fences:
{
  "schemeId": "kebab-case-identifier",
  "name": "Official Scheme Name in English",
  "nameHindi": "आधिकारिक योजना नाम",
  "category": ["Agriculture", "Direct Benefit Transfer"],
  "targetGroups": ["Farmers", "BPL Families"],
  "eligibility": {
    "occupation": ["Farmer", "All"],
    "gender": "Male" | "Female" | "All",
    "maritalStatus": ["Single", "Married", "All"],
    "minLandAcres": number (default 0),
    "maxLandAcres": number (default 9999),
    "states": ["Madhya Pradesh", "All"],
    "maxAnnualIncome": number (ceiling in INR, default 9999999),
    "casteCategory": ["General", "OBC", "SC", "ST", "All"]
  },
  "benefits": "Detailed benefit payout/assistance description in English",
  "benefitsHindi": "विस्तृत लाभ विवरण",
  "documents": ["Aadhaar Card", "Bank Passbook", "Land Record"],
  "applicationUrl": "Official application portal URL",
  "helplineNumber": "Toll-free helpline",
  "description": "Comprehensive scheme overview in English",
  "descriptionHindi": "योजना का संक्षिप्त विवरण",
  "ministry": "Administrative Ministry / Department",
  "sourceUrl": "Source link or portal",
  "confidenceScore": number (0 to 100),
  "sourceGazetteReference": "${sourceReference}",
  "explicitFieldConstraints": ["Age 18-50 years", "Annual family income under 2.5 Lakh"]
}
`;

    const finalContents = Array.isArray(contentsPayload) 
      ? [...contentsPayload, extractionPrompt]
      : contentsPayload + '\n' + extractionPrompt;

    const result = await model.generateContent(finalContents);
    let rawText = result.response.text().trim();

    if (rawText.startsWith('```json')) {
      rawText = rawText.replace(/^```json\s*/i, '').replace(/\s*```$/, '').trim();
    } else if (rawText.startsWith('```')) {
      rawText = rawText.replace(/^```\s*/, '').replace(/\s*```$/, '').trim();
    }

    const firstBrace = rawText.indexOf('{');
    const lastBrace = rawText.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1) {
      rawText = rawText.substring(firstBrace, lastBrace + 1);
    }

    const draftRuleData = JSON.parse(rawText);

    // If autoSave is requested and MongoDB is connected, save as DraftRule
    let savedDraft = null;
    if (autoSave && mongoose.connection.readyState === 1) {
      try {
        savedDraft = await DraftRule.create({
          ...draftRuleData,
          status: 'PENDING_REVIEW',
          createdAt: new Date()
        });
      } catch (saveErr) {
        console.warn('Could not persist DraftRule to MongoDB:', saveErr.message);
      }
    }

    return res.json({
      success: true,
      draftRule: draftRuleData,
      savedId: savedDraft?._id || null,
      message: 'Government Scheme Draft Rule extracted successfully.'
    });

  } catch (err) {
    console.error('Error in /api/ai/extract-rule:', err);
    res.status(500).json({ error: 'Failed to extract draft rule: ' + err.message });
  }
});

/**
 * 3. POST /api/ai/intent-parse
 * Parses raw natural language into structured citizen intent
 */
router.post('/intent-parse', async (req, res) => {
  try {
    const { query } = req.body;
    if (!query) {
      return res.status(400).json({ error: 'Query text is required.' });
    }

    const genAI = getGenAI();
    if (!genAI) {
      return res.status(503).json({ error: 'Gemini API not configured.' });
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-3.5-flash' });
    const prompt = `
Extract the citizen's needs from this query into strictly valid JSON without markdown fences:
Query: "${query}"

JSON Schema:
{
  "category": "e.g. agricultural loan, housing assistance, scholarship",
  "occupation": "e.g. Farmer, Student, Artisan, or null",
  "state": "Indian state if mentioned or null",
  "incomeBracket": "e.g. below 1 lakh, BPL, or null",
  "specialCriteria": ["Woman", "SC/ST", "Landless", "Disabled"],
  "reformulatedQuery": "Clean search engine query for Indian government welfare portal"
}
`;

    const result = await model.generateContent(prompt);
    let text = result.response.text().trim();
    if (text.startsWith('```json')) text = text.replace(/^```json\s*/i, '').replace(/\s*```$/, '').trim();
    else if (text.startsWith('```')) text = text.replace(/^```\s*/, '').replace(/\s*```$/, '').trim();

    const firstBrace = text.indexOf('{');
    const lastBrace = text.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1) text = text.substring(firstBrace, lastBrace + 1);

    const intent = JSON.parse(text);
    return res.json({ success: true, intent });

  } catch (err) {
    console.error('Error in /api/ai/intent-parse:', err);
    res.status(500).json({ error: 'Failed to parse intent: ' + err.message });
  }
});

export default router;
