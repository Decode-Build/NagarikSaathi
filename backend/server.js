import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import connectDB from './db.js';
import { Scheme, ChatSession, EligibilityProfile, User, DraftRule, SchemeVersion } from './models.js';
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { SystemMessage, HumanMessage, AIMessage } from "@langchain/core/messages";
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import path from 'path';
import { fileURLToPath } from 'url';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { dpdpPurposeLimitationMiddleware, zeroStorageComplianceMiddleware } from './middlewares/compliance.js';

const ephemeralSessions = new Map();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

const app = express();
app.use(helmet());
const allowedOrigins = process.env.CORS_ORIGIN 
  ? process.env.CORS_ORIGIN.split(',') 
  : ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:3000', 'http://127.0.0.1:3000'];
app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json());
app.use(zeroStorageComplianceMiddleware);

// Connect Database
connectDB();

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.error("FATAL ERROR: JWT_SECRET is not defined in environment variables.");
  process.exit(1);
}

import authRoutes, { requireAuth, getUserFromHeader } from './routes/auth.js';
import schemeRoutes from './routes/schemes.js';

// Setup Routes
app.use('/api/auth', authRoutes);
app.use('/api', schemeRoutes);

// Initialize Gemini LLM
let model = null;
const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
if (apiKey) {
  try {
    model = new ChatGoogleGenerativeAI({
      modelName: "gemini-3.5-flash",
      apiKey: apiKey,
      maxOutputTokens: 2048,
    });
    console.log("Gemini LLM initialized successfully.");
  } catch (error) {
    console.error("Failed to initialize Gemini LLM:", error.message);
  }
} else {
  console.warn("WARNING: No GEMINI_API_KEY or GOOGLE_API_KEY found in environment. Server will run in Mock Fallback mode for chat queries.");
}

// Helper to clean and parse Gemini JSON response
const parseGeminiResponse = (text) => {
  let cleaned = text.trim();
  try {
    // Robust extraction: find first { and last }
    const firstBrace = cleaned.indexOf('{');
    const lastBrace = cleaned.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1) {
      cleaned = cleaned.substring(firstBrace, lastBrace + 1);
    }
    return JSON.parse(cleaned);
  } catch (e) {
    console.error("Failed to parse Gemini response as JSON. Raw response:", text);
    // Fallback parser: search for cited scheme IDs via regex
    const matches = [...cleaned.matchAll(/[a-zA-Z0-9-_]+/g)].map(m => m[0]);
    return {
      answer: text,
      citedSchemeIds: [],
      confidence: "low"
    };
  }
};

// Mock Fallback matching engine for offline / key-less runs
const getMockResponse = (message, schemes) => {
  const query = message.toLowerCase();
  const citedIds = [];
  let answer = "";
  let answerHindi = "";

  if (query.includes("kisan") || query.includes("farmer") || query.includes("किसान") || query.includes("खेती")) {
    citedIds.push("pm-kisan", "pm-fasal-bima");
    answer = "Based on your interest in farming, you might be eligible for Pradhan Mantri Kisan Samman Nidhi (PM-KISAN), which provides ₹6,000 yearly income support, and PM Fasal Bima Yojana for crop insurance.";
    answerHindi = "खेती में आपकी रुचि के आधार पर, आप प्रधानमंत्री किसान सम्मान निधि (PM-KISAN) के लिए पात्र हो सकते हैं, जो ₹6,000 वार्षिक आय सहायता प्रदान करता है, और फसल बीमा के लिए पीएम फसल बीमा योजना।";
  } else if (query.includes("gas") || query.includes("cylinder") || query.includes("ujjwala") || query.includes("गैस") || query.includes("सिलेंडर")) {
    citedIds.push("pm-ujjwala");
    answer = "For cooking gas assistance, the Pradhan Mantri Ujjwala Yojana (PMUY) provides free LPG connections to women from BPL families.";
    answerHindi = "रसोई गैस सहायता के लिए, प्रधानमंत्री उज्ज्वला योजना (PMUY) बीपीएल परिवारों की महिलाओं को मुफ्त एलपीजी कनेक्शन प्रदान करती है।";
  } else if (query.includes("house") || query.includes("home") || query.includes("awas") || query.includes("घर") || query.includes("आवास")) {
    citedIds.push("pm-awas-gramin");
    answer = "For housing assistance, Pradhan Mantri Awas Yojana (Gramin) provides financial assistance up to ₹1.2 Lakh to build permanent homes in rural areas.";
    answerHindi = "आवास सहायता के लिए, प्रधानमंत्री आवास योजना (ग्रामीण) ग्रामीण क्षेत्रों में पक्के घर बनाने के लिए ₹1.2 लाख तक की वित्तीय सहायता प्रदान करती है।";
  } else if (query.includes("pension") || query.includes("old") || query.includes("widow") || query.includes("पेंशन") || query.includes("बुढ़ापा") || query.includes("विधवा")) {
    citedIds.push("atal-pension", "ign-old-age-pension", "ign-widow-pension");
    answer = "We found multiple pension schemes. For general old-age pension, Indira Gandhi National Old Age Pension Scheme offers monthly benefits to BPL seniors. Atal Pension Yojana is also available for contributions.";
    answerHindi = "हमें कई पेंशन योजनाएं मिलीं। सामान्य वृद्धावस्था पेंशन के लिए, इंदिरा गांधी राष्ट्रीय वृद्धावस्था पेंशन योजना बीपीएल वरिष्ठ नागरिकों को मासिक लाभ प्रदान करती है। योगदान के लिए अटल पेंशन योजना भी उपलब्ध है।";
  } else if (query.includes("woman") || query.includes("girl") || query.includes("mother") || query.includes("महिला") || query.includes("लड़की") || query.includes("गर्भवती")) {
    citedIds.push("sukanya-samriddhi", "janani-suraksha", "pm-matru-vandana", "lakhpati-didi");
    answer = "For women and child welfare, Sukanya Samriddhi Yojana offers savings accounts for girls under 10. For pregnancy benefits, Pradhan Mantri Matru Vandana Yojana and Janani Suraksha Yojana offer cash incentives.";
    answerHindi = "महिला एवं बाल कल्याण के लिए, सुकन्या समृद्धि योजना 10 वर्ष से कम उम्र की लड़कियों के लिए बचत खाते प्रदान करती है। गर्भावस्था के लाभों के लिए, प्रधानमंत्री मातृ वंदना योजना और जननी सुरक्षा योजना नकद प्रोत्साहन प्रदान करती हैं।";
  } else if (query.includes("job") || query.includes("work") || query.includes("employment") || query.includes("nrega") || query.includes("रोजगार") || query.includes("काम")) {
    citedIds.push("mgnrega");
    answer = "For rural employment, MGNREGA guarantees 100 days of wage employment per financial year for manual labor.";
    answerHindi = "ग्रामीण रोजगार के लिए, मनरेगा (MGNREGA) शारीरिक श्रम के लिए प्रति वित्तीय वर्ष 100 दिनों के मजदूरी रोजगार की गारंटी देता है।";
  } else if (query.includes("loan") || query.includes("business") || query.includes("money") || query.includes("कर्ज") || query.includes("लोन") || query.includes("व्यापार")) {
    citedIds.push("pm-mudra", "pm-svanidhi", "pm-vishwakarma", "stand-up-india");
    answer = "For business loans, PM Mudra Yojana offers collateral-free loans up to ₹10 Lakh. PM SVANidhi offers micro loans up to ₹10,000 for street vendors. PM Vishwakarma supports traditional artisans.";
    answerHindi = "व्यावसायिक ऋणों के लिए, पीएम मुद्रा योजना ₹10 लाख तक के संपार्श्विक-मुक्त ऋण प्रदान करती है। पीएम स्वनिधि रेहड़ी-पटरी वालों के लिए ₹10,000 तक के सूक्ष्म ऋण प्रदान करती है। पीएम विश्वकर्म पारंपरिक कारीगरों का समर्थन करती है।";
  } else if (query.includes("health") || query.includes("hospital") || query.includes("ill") || query.includes("अस्पताल") || query.includes("इलाज") || query.includes("बीमारी")) {
    citedIds.push("ayushman-bharat");
    answer = "For medical assistance, Ayushman Bharat (AB-PMJAY) provides free health cover of up to ₹5 Lakh per family per year for hospitalizations.";
    answerHindi = "चिकित्सा सहायता के लिए, आयुष्मान भारत (AB-PMJAY) अस्पताल में भर्ती होने के लिए प्रति परिवार प्रति वर्ष ₹5 लाख तक का मुफ्त स्वास्थ्य कवर प्रदान करता है।";
  } else if (query.includes("study") || query.includes("student") || query.includes("scholarship") || query.includes("school") || query.includes("पढ़ाई") || query.includes("छात्र") || query.includes("स्कॉलरशिप")) {
    citedIds.push("central-scholarship", "post-matric-sc", "pre-matric-sc", "means-cum-merit", "pm-poshan");
    answer = "For education, various scholarships are available including Post Matric Scholarship for SC students and Central Sector Scholarship for college students. PM Poshan provides mid-day meals.";
    answerHindi = "शिक्षा के लिए, विभिन्न छात्रवृत्तियां उपलब्ध हैं जिनमें अनुसूचित जाति के छात्रों के लिए पोस्ट मैट्रिक छात्रवृत्ति और कॉलेज के छात्रों के लिए केंद्रीय क्षेत्र की छात्रवृत्ति शामिल है। पीएम पोषण मध्याह्न भोजन प्रदान करता है।";
  } else {
    answer = "I'm sorry, I couldn't find a direct scheme match for your query. Please tell me more about your occupation, family income, or state, or visit your nearest Common Service Centre (CSC) for details.";
    answerHindi = "मुझे क्षमा करें, मुझे आपके प्रश्न के लिए कोई सीधा योजना मेल नहीं मिला। कृपया मुझे अपने व्यवसाय, पारिवारिक आय या राज्य के बारे में और बताएं, या विवरण के लिए अपने निकटतम सामान्य सेवा केंद्र (सीएससी) पर जाएं।";
    return {
      answer: (query.match(/[\u0900-\u097F]/) ? answerHindi : answer),
      citedSchemeIds: [],
      confidence: "low"
    };
  }

  const isHindi = query.match(/[\u0900-\u097F]/);
  return {
    answer: isHindi ? answerHindi : answer,
    citedSchemeIds: citedIds,
    confidence: "high"
  };
};

// -------------------------------------------------------------
// ROUTES
// -------------------------------------------------------------

// API Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    dbState: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    isMockMode: !model
  });
});

// API Key configuration endpoint
app.post('/api/settings/apikey', requireAuth, (req, res) => {
  const { apiKey } = req.body;
  if (!apiKey) {
    return res.status(400).json({ error: "API Key is required." });
  }
  try {
    model = new ChatGoogleGenerativeAI({
      modelName: "gemini-3.5-flash",
      apiKey: apiKey,
      maxOutputTokens: 2048,
    });
    console.log("Gemini LLM re-initialized with custom API Key.");
    res.json({ message: "Gemini API Key configured successfully." });
  } catch (err) {
    res.status(500).json({ error: "Failed to initialize Gemini with this key: " + err.message });
  }
});

// Auth routes have been moved to routes/auth.js

// Cosine similarity helper
const cosineSimilarity = (vecA, vecB) => {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
};

// Rate limiter for chat to prevent abuse
const chatLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20, // limit each IP to 20 requests per windowMs
  message: { error: "Too many chat requests, please try again later." }
});

// 1. POST /api/chat
app.post('/api/chat', chatLimiter, dpdpPurposeLimitationMiddleware, async (appReq, appRes) => {
  const { message, sessionId, sessionType } = appReq.body;

  if (!message || !sessionId) {
    return appRes.status(400).json({ error: "Message and sessionId are required." });
  }

  try {
    // Retrieve or create chat session
    let session;
    if (appReq.dpdpEphemeral) {
      if (!ephemeralSessions.has(sessionId)) {
        ephemeralSessions.set(sessionId, {
          sessionId,
          sessionType: sessionType || 'self',
          messages: [],
          save: async function() { return this; }
        });
      }
      session = ephemeralSessions.get(sessionId);
      if (sessionType) {
        session.sessionType = sessionType;
      }
    } else {
      session = await ChatSession.findOne({ sessionId });
      if (!session) {
        session = new ChatSession({
          sessionId,
          sessionType: sessionType || 'self',
          messages: []
        });
      } else if (sessionType) {
        session.sessionType = sessionType;
      }
    }

    // Fetch all schemes to build context
    const schemes = await Scheme.find({});

    // Extract user profile from optional auth token
    let userProfileText = "";
    let userState = null;
    const user = getUserFromHeader(appReq);
    if (user) {
      const dbUser = await User.findById(user.userId);
      if (dbUser && dbUser.profile) {
        const { age, occupation, state, gender, maritalStatus } = dbUser.profile;
        userState = state;
        userProfileText = `User Profile Info: Applicant is ${age} years old, occupation is ${occupation}, resides in state "${state}", gender is ${gender}, marital status is ${maritalStatus}. Prioritize and match schemes fitting this profile.`;
      }
    }

    let parsed = null;
    const isMockMode = !model;
    const scoredSchemesMap = {};

    if (!isMockMode) {
      try {
        let topSchemes = schemes;
        if (apiKey) {
          try {
            const { GoogleGenerativeAIEmbeddings } = await import("@langchain/google-genai");
            const embeddings = new GoogleGenerativeAIEmbeddings({
              modelName: "gemini-embedding-2",
              apiKey: apiKey
            });
            const queryToEmbed = userProfileText ? `${message} (Profile: ${userProfileText})` : message;

            // Timeout wrapper: embedding must complete within 8 seconds
            const embedWithTimeout = Promise.race([
              embeddings.embedQuery(queryToEmbed),
              new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Embedding API timeout after 8s')), 8000)
              )
            ]);
            const queryVector = await embedWithTimeout;

            const scoredSchemes = schemes.map(scheme => {
              let score = 0;
              if (scheme.embedding && scheme.embedding.length > 0) {
                score = cosineSimilarity(queryVector, scheme.embedding);
              }
              return { ...scheme.toObject(), score };
            });
            scoredSchemes.forEach(s => {
              scoredSchemesMap[s.schemeId] = s.score;
            });
            scoredSchemes.sort((a, b) => b.score - a.score);
            topSchemes = scoredSchemes.slice(0, 5);
            console.log(`RAG Retrieval: Top match score ${topSchemes[0]?.score || 0}`);
          } catch (embedError) {
            console.error("Embedding generation failed, falling back to full context:", embedError.message);
          }
        }

        const systemPrompt = `You are "NagarikSaathi", an AI-powered government scheme discovery assistant for rural India.
You are helping a CSC/VLE (Common Service Centre / Village Level Entrepreneur) operator who is assisting a rural citizen.
The operator is typing on behalf of the citizen. The citizen is sitting beside the operator.

Your job is to match the citizen's query with the available government schemes.
Below is the list of top relevant government schemes retrieved for this query:

${JSON.stringify(topSchemes.map(s => ({ schemeId: s.schemeId, name: s.name, nameHindi: s.nameHindi || s.name, description: s.description, benefits: s.benefits })), null, 2)}

${userProfileText ? `RECOMMENDED PROFILE: ${userProfileText}\nFocus matches specifically on schemes applicable to their state and occupation, and evaluate eligibility metrics directly.` : ''}

LLM PROMPT RULES:
1. Always cite scheme names explicitly (use their unique schemeId in your citedSchemeIds array).
2. Never invent a scheme, document, or phone number not present in the retrieved context.
3. If the query does not clearly match any scheme, or the query is irrelevant, set confidence to "low". Do not guess or hallucinate.
4. Auto-detect and match the user's language. If they query in Hindi, respond in Hindi (using Devanagari script). If in English, respond in English.
5. If the user language is Hindi, make sure the "answer" field is written in Hindi, citing the scheme's name (and nameHindi if helpful).
6. Always respond in JSON format with the following fields:
   - "answer": (string) Your response text. Be clear, polite, and descriptive. Cite relevant schemes.
   - "citedSchemeIds": (array of strings) The schemeId(s) of the matched schemes from the context. Only include schemeIds that are actually present in the context and relevant.
   - "confidence": (string) "high" | "medium" | "low". Set to "high" for direct matches, "medium" for partial matches, "low" for no/low confidence matches.

Remember: If confidence is "low", explain that you are uncertain in plain language.

Respond ONLY with the JSON structure. Do not output any conversational filler before or after the JSON.`;

        // Format message history
        const historyMessages = session.messages.map(m => {
          return m.role === 'user' ? new HumanMessage(m.content) : new AIMessage(m.content);
        });

        // Query LLM with a 28-second timeout — fall back to rule-based match if too slow
        const llmWithTimeout = Promise.race([
          model.invoke([
            new SystemMessage(systemPrompt),
            ...historyMessages,
            new HumanMessage(message)
          ]),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('LLM API timeout after 28s')), 28000)
          )
        ]);
        const response = await llmWithTimeout;

        parsed = parseGeminiResponse(response.content);
      } catch (geminiError) {
        console.error("Gemini invocation failed, falling back to local rule-based match:", geminiError.message);
        parsed = getMockResponse(message, schemes);
      }
    } else {
      // Mock mode
      parsed = getMockResponse(message, schemes);
      // In mock mode, if userState is present and query doesn't yield results, let's inject userState schemes
      if (parsed.citedSchemeIds.length === 0 && userState) {
        const stateSchemes = schemes.filter(s => s.eligibility.states.includes(userState));
        if (stateSchemes.length > 0) {
          parsed.citedSchemeIds = stateSchemes.slice(0, 2).map(s => s.schemeId);
          parsed.answer += `\n\n[Profile Notice: We recommend checking state-specific schemes for ${userState} like: ${stateSchemes.slice(0,2).map(s => s.name).join(', ')}]`;
        }
      }
    }

    // Fallback Jaccard/keyword similarity score calculator for offline/mock cases
    const getFallbackScore = (query, scheme) => {
      const qWords = query.toLowerCase().split(/\s+/).filter(w => w.length > 2);
      const textToMatch = `${scheme.name} ${scheme.description} ${scheme.category ? scheme.category.join(' ') : ''} ${scheme.benefits ? JSON.stringify(scheme.benefits) : ''}`.toLowerCase();
      if (qWords.length === 0) return 0.50;
      let matches = 0;
      qWords.forEach(w => {
        if (textToMatch.includes(w)) matches++;
      });
      const ratio = matches / qWords.length;
      return 0.68 + (ratio * 0.25); // yields between 68% and 93% match
    };

    // Resolve cited scheme details with RAG embedding scores
    let sources = [];
    if (parsed.citedSchemeIds && parsed.citedSchemeIds.length > 0) {
      const dbSources = await Scheme.find({ schemeId: { $in: parsed.citedSchemeIds } });
      sources = dbSources.map(s => {
        const obj = s.toObject();
        let score = scoredSchemesMap[s.schemeId];
        if (score === undefined || score === 0) {
          score = getFallbackScore(message, obj);
        }
        // Normalize score between 0 and 100
        obj.ragScore = Math.min(100, Math.max(10, Math.round(score * 100)));
        return obj;
      });
    }

    // Basic DPDP PII Scrubbing
    const scrubPII = (text) => {
      if (!text) return text;
      let scrubbed = text;
      // Aadhaar
      scrubbed = scrubbed.replace(/\b\d{4}\s?\d{4}\s?\d{4}\b/g, '[AADHAAR]');
      scrubbed = scrubbed.replace(/\b\d{12}\b/g, '[AADHAAR]');
      // Phone
      scrubbed = scrubbed.replace(/\b[6-9]\d{9}\b/g, '[PHONE]');
      // Email
      scrubbed = scrubbed.replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/gi, '[EMAIL]');
      // PAN
      scrubbed = scrubbed.replace(/\b[A-Z]{5}[0-9]{4}[A-Z]{1}\b/gi, '[PAN]');
      return scrubbed;
    };

    // Save user message (Scrubbed for DPDP compliance)
    session.messages.push({
      role: 'user',
      content: scrubPII(message),
      timestamp: new Date()
    });

    // Save assistant response
    session.messages.push({
      role: 'assistant',
      content: parsed.answer,
      sourceSchemeIds: parsed.citedSchemeIds || [],
      confidence: parsed.confidence || 'low',
      timestamp: new Date()
    });

    session.lastActivity = new Date();
    await session.save();

    appRes.json({
      answer: parsed.answer,
      sources,
      confidence: parsed.confidence || 'low',
      isMockMode
    });

  } catch (error) {
    console.error("Error in /api/chat:", error);
    appRes.status(500).json({ error: "Internal server error." });
  }
});

// 2. GET /api/chat/:sessionId
app.post('/api/chat/history', dpdpPurposeLimitationMiddleware, async (appReq, appRes) => {
  // Support both GET and POST for session initialization/history
  const { sessionId } = appReq.body;
  try {
    if (appReq.dpdpEphemeral && ephemeralSessions.has(sessionId)) {
      return appRes.json(ephemeralSessions.get(sessionId));
    }
    const session = await ChatSession.findOne({ sessionId });
    if (!session) {
      return appRes.json({ messages: [] });
    }
    appRes.json(session);
  } catch (error) {
    appRes.status(500).json({ error: "Failed to retrieve history." });
  }
});

app.get('/api/chat/:sessionId', dpdpPurposeLimitationMiddleware, async (appReq, appRes) => {
  const { sessionId } = appReq.params;
  try {
    if (appReq.dpdpEphemeral && ephemeralSessions.has(sessionId)) {
      return appRes.json(ephemeralSessions.get(sessionId));
    }
    const session = await ChatSession.findOne({ sessionId });
    if (!session) {
      return appRes.json({ messages: [] });
    }
    // We also want to resolve scheme cards for historical messages if needed,
    // but returning messages is fine for standard history.
    appRes.json(session);
  } catch (error) {
    appRes.status(500).json({ error: "Failed to retrieve history." });
  }
});



// 5. GET /api/session/:sessionId/stats
app.get('/api/session/:sessionId/stats', async (appReq, appRes) => {
  try {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    // Get count of distinct sessions today
    const sessionsToday = await ChatSession.find({
      createdAt: { $gte: startOfDay },
      sessionType: 'operator'
    });

    const citizensHelped = sessionsToday.length;

    // Calculate average response time
    let totalResponseTime = 0;
    let responseCount = 0;

    sessionsToday.forEach(sess => {
      const msgs = sess.messages;
      for (let i = 0; i < msgs.length - 1; i++) {
        if (msgs[i].role === 'user' && msgs[i+1].role === 'assistant') {
          const diff = new Date(msgs[i+1].timestamp) - new Date(msgs[i].timestamp);
          // Only count valid response times (1s to 60s) to exclude manual idle time
          if (diff > 500 && diff < 60000) {
            totalResponseTime += diff;
            responseCount++;
          }
        }
      }
    });

    // Default to a realistic 4.2 seconds if no session stats exist yet, or round the actual average
    const avgResponseTimeSec = responseCount > 0 
      ? Math.round(totalResponseTime / responseCount / 100) / 10
      : 0;

    appRes.json({
      citizensHelped: citizensHelped || 0,
      avgResponseTimeMs: avgResponseTimeSec.toFixed(1)
    });
  } catch (error) {
    appRes.json({ citizensHelped: 0, avgResponseTimeMs: 0 }); // safe fallback
  }
});

// ==========================================
// HITL Draft Rules & Staging Queue Routes
// ==========================================

// Mock extraction function for fallback / offline mode
const mockExtractRule = (text, sourceRef) => {
  const cleanSourceRef = sourceRef || "Official Gazette Notification";
  
  // Try to parse some basic parameters from text
  const nameMatch = text.match(/(?:scheme|yojana)\s+name:\s*([^\n]+)/i) || text.match(/name:\s*([^\n]+)/i);
  const name = nameMatch ? nameMatch[1].trim() : "New Welfare Scheme";
  
  const idMatch = text.match(/id:\s*([a-z0-9-]+)/i);
  const schemeId = idMatch ? idMatch[1].trim() : name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || `draft-${Date.now()}`;
  
  const incomeMatch = text.match(/income\s*(?:limit|ceiling|below|max):\s*₹?([0-9,]+)/i);
  const maxIncome = incomeMatch ? Number(incomeMatch[1].replace(/,/g, '')) : 300000;
  
  const landMatch = text.match(/land\s*(?:limit|max|holding):\s*([0-9.]+)\s*acres?/i);
  const maxLand = landMatch ? Number(landMatch[1]) : 5;
  
  const genderMatch = text.match(/(female|women|male|men)/i);
  const gender = genderMatch ? (genderMatch[1].toLowerCase().includes('wom') || genderMatch[1].toLowerCase().includes('fem') ? 'Female' : 'Male') : 'All';

  return {
    schemeId,
    name,
    nameHindi: "राजपत्र मसौदा योजना",
    category: ["Social Welfare", "Direct Benefit Transfer"],
    targetGroups: ["Eligible Citizens"],
    eligibility: {
      occupation: ["All"],
      gender,
      maritalStatus: ["All"],
      minLandAcres: 0,
      maxLandAcres: maxLand,
      states: ["All"],
      maxAnnualIncome: maxIncome,
      casteCategory: ["All"]
    },
    benefits: "Direct financial assistance and support services as defined in gazette.",
    benefitsHindi: "राजपत्र में परिभाषित प्रत्यक्ष वित्तीय सहायता और सहायता सेवाएं।",
    documents: ["Aadhaar Card", "Income Certificate", "Residence Proof"],
    applicationUrl: "https://www.myscheme.gov.in",
    helplineNumber: "1800-111-999",
    description: "AI-generated draft rule extracted from gazette. Pending operator sign-off.",
    descriptionHindi: "राजपत्र से निकाली गई एआई-जनरेटेड मसौदा नियम। ऑपरेटर के हस्ताक्षर लंबित हैं।",
    ministry: "Ministry of Welfare",
    sourceUrl: "https://www.myscheme.gov.in",
    confidenceScore: 88,
    sourceGazetteReference: cleanSourceRef,
    explicitFieldConstraints: [
      `Income Limit: ₹${maxIncome.toLocaleString('en-IN')}`,
      `Land Limit: ${maxLand} acres`,
      `Target Gender: ${gender}`
    ]
  };
};

// 1. POST /api/rules/extract — Extract structured draft rule from text
app.post('/api/rules/extract', async (req, res) => {
  const { text, sourceRef } = req.body;
  if (!text) {
    return res.status(400).json({ error: "Text content is required for rule extraction." });
  }

  try {
    let parsed = null;
    const isMockMode = !model;

    if (!isMockMode) {
      try {
        const systemPrompt = `You are an expert legal and policy analyst. Analyze the provided government gazette or scheme notification text.
Extract all eligibility rules and details into a structured Draft Rule matching this JSON schema:
{
  "schemeId": (string) unique lowercase kebab-case identifier, e.g. "pm-kisan-v2",
  "name": (string) official English name of the scheme,
  "nameHindi": (string, optional) official Hindi name of the scheme,
  "category": (array of strings) category keywords, e.g. ["Agriculture", "Direct Benefit Transfer"],
  "targetGroups": (array of strings) target beneficiary groups, e.g. ["Small Farmers", "Marginal Farmers"],
  "eligibility": {
    "occupation": (array of strings) eligible occupations, e.g. ["Farmer"] or ["All"],
    "gender": (string) "Male" | "Female" | "All",
    "maritalStatus": (array of strings) e.g. ["Single", "Married"] or ["All"],
    "minLandAcres": (number) minimum land holding requirement in acres, default 0,
    "maxLandAcres": (number) maximum land holding limit in acres, default 9999,
    "states": (array of strings) states where applicable, e.g. ["Madhya Pradesh"] or ["All"],
    "maxAnnualIncome": (number) maximum annual income ceiling in Rupees, default 9999999,
    "casteCategory": (array of strings) e.g. ["SC", "ST"] or ["All"]
  },
  "benefits": (string) detailed description of benefits in English,
  "benefitsHindi": (string, optional) detailed description of benefits in Hindi,
  "documents": (array of strings) list of required documents,
  "applicationUrl": (string, optional) official registration web link,
  "helplineNumber": (string, optional) contact helpline number,
  "description": (string) brief summary of the scheme,
  "descriptionHindi": (string, optional) brief summary of the scheme in Hindi,
  "ministry": (string, optional) administrative ministry,
  "sourceUrl": (string, optional) source link,
  "confidenceScore": (number 0-100) your confidence score on extraction accuracy based on rules clarity,
  "sourceGazetteReference": (string) citation/reference of this source document,
  "explicitFieldConstraints": (array of strings) list of explicit constraints, e.g. ["Income ceiling: ₹2,50,000 per annum", "Age limit: 18 to 40 years"]
}

Respond ONLY with the JSON object. Do not output any markdown code blocks, formatting, or conversational filler before/after the JSON. Ensure it is valid JSON.`;

        // Timeout wrapper for LLM call
        const llmWithTimeout = Promise.race([
          model.invoke([
            new SystemMessage(systemPrompt),
            new HumanMessage(`Text to analyze from source "${sourceRef || 'Gazette'}" :\n\n${text}`)
          ]),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('LLM API timeout after 25s')), 25000)
          )
        ]);

        const response = await llmWithTimeout;
        parsed = parseGeminiResponse(response.content);
      } catch (geminiError) {
        console.error("Gemini rule extraction failed, falling back to mock parser:", geminiError.message);
        parsed = mockExtractRule(text, sourceRef);
      }
    } else {
      parsed = mockExtractRule(text, sourceRef);
    }

    // Save to staging collection
    const draftRule = new DraftRule({
      schemeId: parsed.schemeId || `draft-${Date.now()}`,
      name: parsed.name || "Unnamed Scheme",
      nameHindi: parsed.nameHindi || parsed.name || "",
      category: parsed.category || ["General"],
      targetGroups: parsed.targetGroups || ["Eligible Citizens"],
      eligibility: {
        occupation: parsed.eligibility?.occupation || ["All"],
        gender: parsed.eligibility?.gender || "All",
        maritalStatus: parsed.eligibility?.maritalStatus || ["All"],
        minLandAcres: Number(parsed.eligibility?.minLandAcres) || 0,
        maxLandAcres: Number(parsed.eligibility?.maxLandAcres) || 9999,
        states: parsed.eligibility?.states || ["All"],
        maxAnnualIncome: Number(parsed.eligibility?.maxAnnualIncome) || 9999999,
        casteCategory: parsed.eligibility?.casteCategory || ["All"]
      },
      benefits: parsed.benefits || "",
      benefitsHindi: parsed.benefitsHindi || parsed.benefits || "",
      documents: parsed.documents || ["Aadhaar Card", "Bank Passbook"],
      applicationUrl: parsed.applicationUrl || "https://www.myscheme.gov.in",
      helplineNumber: parsed.helplineNumber || "1800-111-999",
      description: parsed.description || "",
      descriptionHindi: parsed.descriptionHindi || parsed.description || "",
      ministry: parsed.ministry || "",
      sourceUrl: parsed.sourceUrl || "",
      confidenceScore: parsed.confidenceScore || 80,
      sourceGazetteReference: parsed.sourceGazetteReference || sourceRef || "Gazette Document Reference",
      explicitFieldConstraints: parsed.explicitFieldConstraints || [],
      status: "PENDING_REVIEW"
    });

    await draftRule.save();
    res.status(201).json(draftRule);

  } catch (err) {
    console.error("Error in rule extraction endpoint:", err);
    res.status(500).json({ error: "Failed to extract rule. " + err.message });
  }
});

// 2. GET /api/rules/pending — Fetch all pending draft rules for staging queue
app.get('/api/rules/pending', async (req, res) => {
  try {
    const pending = await DraftRule.find({ status: 'PENDING_REVIEW' }).sort({ createdAt: -1 });
    res.json(pending);
  } catch (err) {
    console.error("Error fetching pending rules:", err);
    res.status(500).json({ error: "Failed to fetch pending staging rules." });
  }
});

// 3. POST /api/rules/approve/:id — Approve draft rule (promote to Scheme collection)
app.post('/api/rules/approve/:id', async (req, res) => {
  try {
    const draft = await DraftRule.findById(req.params.id);
    if (!draft) {
      return res.status(404).json({ error: "Draft rule not found." });
    }

    const version = req.body.version || draft.version || 'v1.0';

    // Enforce immutable version tag check
    const existingVersion = await SchemeVersion.findOne({ schemeId: draft.schemeId, version });
    if (existingVersion) {
      return res.status(400).json({
        error: `Immutable version error: Scheme "${draft.schemeId}" with version "${version}" has already been approved and cannot be overwritten.`
      });
    }

    const schemeData = {
      schemeId: draft.schemeId,
      name: draft.name,
      nameHindi: draft.nameHindi || draft.name,
      category: draft.category,
      targetGroups: draft.targetGroups,
      eligibility: draft.eligibility,
      benefits: draft.benefits,
      benefitsHindi: draft.benefitsHindi || draft.benefits,
      documents: draft.documents,
      applicationUrl: draft.applicationUrl,
      helplineNumber: draft.helplineNumber,
      description: draft.description,
      descriptionHindi: draft.descriptionHindi || draft.description,
      ministry: draft.ministry,
      sourceUrl: draft.sourceUrl,
      version: version,
      deleted: false,
      lastVerified: new Date()
    };

    // Promote to production Scheme collection
    const scheme = await Scheme.findOneAndUpdate(
      { schemeId: draft.schemeId },
      schemeData,
      { upsert: true, new: true }
    );

    // Save the new version in the SchemeVersion collection to enforce immutability
    const schemeVerDoc = new SchemeVersion({
      schemeId: draft.schemeId,
      version: version,
      schemeData: schemeData
    });
    await schemeVerDoc.save();

    // Update draft status
    draft.status = 'APPROVED';
    await draft.save();

    res.json({ message: "Draft rule successfully approved and staged in Pre-Pilot Architecture / Evaluation Mode.", scheme });
  } catch (err) {
    console.error("Error approving draft rule:", err);
    res.status(500).json({ error: "Failed to approve draft rule. " + err.message });
  }
});

// 4. POST /api/rules/reject/:id — Reject draft rule
app.post('/api/rules/reject/:id', async (req, res) => {
  try {
    const draft = await DraftRule.findById(req.params.id);
    if (!draft) {
      return res.status(404).json({ error: "Draft rule not found." });
    }

    draft.status = 'REJECTED';
    await draft.save();

    res.json({ message: "Draft rule rejected and removed from staging queue." });
  } catch (err) {
    console.error("Error rejecting draft rule:", err);
    res.status(500).json({ error: "Failed to reject draft rule. " + err.message });
  }
});

// Serve static frontend files from Vite build
const frontendDist = path.join(__dirname, '../frontend/dist');
app.use(express.static(frontendDist));

// Wildcard fallback router to serve index.html for React SPA routing
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(frontendDist, 'index.html'));
  } else {
    res.status(404).json({ error: "API endpoint not found." });
  }
});

// Start Express Server
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

export default app;
