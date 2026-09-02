import express from 'express';
import multer from 'multer';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Scheme } from '../models.js';
import { schemesData } from '../seed.js';
import mongoose from 'mongoose';

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB audio limit
});

const getGenAI = () => {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenerativeAI(apiKey);
};

const generateWithModelFallback = async (genAI, contents) => {
  const models = ['gemini-3.6-flash', 'gemini-3.5-flash'];
  let lastError = null;
  for (const modelName of models) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await Promise.race([
        model.generateContent(contents),
        new Promise((_, reject) => setTimeout(() => reject(new Error(`Timeout on ${modelName}`)), 14000))
      ]);
      return result;
    } catch (err) {
      console.warn(`Model ${modelName} failed in audio route:`, err.message);
      lastError = err;
    }
  }
  throw lastError || new Error('All Gemini models failed');
};

const parseAudioGeminiResponse = (text) => {
  try {
    let cleaned = String(text || '').trim();
    if (cleaned.startsWith('```json')) {
      cleaned = cleaned.replace(/^```json\s*/i, '').replace(/\s*```$/, '').trim();
    } else if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/^```\s*/, '').replace(/\s*```$/, '').trim();
    }
    const firstBrace = cleaned.indexOf('{');
    const lastBrace = cleaned.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1) {
      cleaned = cleaned.substring(firstBrace, lastBrace + 1);
    }
    return JSON.parse(cleaned);
  } catch (parseErr) {
    return {
      answer: String(text || '').trim(),
      citedSchemeIds: [],
      confidence: 'medium'
    };
  }
};

// 1. POST /api/audio/transcribe
// Transcribes uploaded Hindi / English / Hinglish audio to text using Gemini Multimodal Audio
router.post('/transcribe', upload.single('audio'), async (req, res) => {
  try {
    let audioBuffer = null;
    let mimeType = 'audio/webm';

    if (req.file) {
      audioBuffer = req.file.buffer;
      mimeType = req.file.mimetype || 'audio/webm';
    } else if (req.body.audioBase64) {
      audioBuffer = Buffer.from(req.body.audioBase64, 'base64');
      mimeType = req.body.mimeType || 'audio/webm';
    }

    if (!audioBuffer || audioBuffer.length === 0) {
      return res.status(400).json({ error: 'No audio data provided.' });
    }

    const genAI = getGenAI();
    if (!genAI) {
      return res.status(503).json({ 
        error: 'Gemini API key is not configured on the server.',
        isMockMode: true 
      });
    }

    // Normalize mimeType for Gemini API
    let normalizedMime = mimeType;
    if (mimeType.includes('webm')) normalizedMime = 'audio/webm';
    else if (mimeType.includes('wav') || mimeType.includes('wave')) normalizedMime = 'audio/wav';
    else if (mimeType.includes('ogg')) normalizedMime = 'audio/ogg';
    else if (mimeType.includes('mp4') || mimeType.includes('m4a')) normalizedMime = 'audio/mp4';
    else if (mimeType.includes('mp3') || mimeType.includes('mpeg')) normalizedMime = 'audio/mp3';
    else normalizedMime = 'audio/webm';

    const preferredLang = req.body.language || req.body.preferredLang || 'hi';
    const langPrompt = preferredLang === 'hi'
      ? 'The user is speaking in Hindi (or Hinglish/English). Transcribe the spoken audio verbatim in pure Hindi Devanagari script (or standard English if spoken in pure English). Return ONLY the transcribed text without quotes, markdown, or extra explanations.'
      : 'Transcribe the spoken audio verbatim. If spoken in Hindi, transcribe in Devanagari script; if spoken in English, transcribe in English. Return ONLY the transcribed text without quotes or explanations.';

    const result = await generateWithModelFallback(genAI, [
      {
        inlineData: {
          mimeType: normalizedMime,
          data: audioBuffer.toString('base64')
        }
      },
      {
        text: langPrompt
      }
    ]);

    let transcription = result.response.text().trim();
    // Remove accidental wrapping quotes
    transcription = transcription.replace(/^["'“”‘’]+|["'“”‘’]+$/g, '').trim();

    const isHindi = Boolean(transcription.match(/[\u0900-\u097F]/));

    return res.json({
      success: true,
      transcription,
      detectedLanguage: isHindi ? 'hi' : 'en'
    });

  } catch (err) {
    console.warn('Audio transcription notice:', err.message);
    const isQuota = err.message?.includes('429') || err.message?.includes('Quota') || err.message?.includes('quota');
    return res.json({
      success: false,
      isQuota,
      transcription: '',
      error: isQuota 
        ? 'AI Voice daily quota reached. Please type your question in the chat box.'
        : 'Audio transcription temporarily unavailable. Please type your question.'
    });
  }
});

// 2. POST /api/audio/chat
// Accepts audio directly, transcribes, and executes AI Saathi chat in one roundtrip
router.post('/chat', upload.single('audio'), async (req, res) => {
  try {
    let audioBuffer = null;
    let mimeType = 'audio/webm';

    if (req.file) {
      audioBuffer = req.file.buffer;
      mimeType = req.file.mimetype || 'audio/webm';
    } else if (req.body.audioBase64) {
      audioBuffer = Buffer.from(req.body.audioBase64, 'base64');
      mimeType = req.body.mimeType || 'audio/webm';
    }

    if (!audioBuffer || audioBuffer.length === 0) {
      return res.status(400).json({ error: 'No audio data provided.' });
    }

    const genAI = getGenAI();
    if (!genAI) {
      return res.json({
        success: true,
        transcription: 'Voice Input',
        answer: 'नमस्ते! मैं नागरिकसाथी हूँ। आप ग्रामीण व कृषि कल्याण योजनाओं की जानकारी के लिए चैट बॉक्स में पूछ सकते हैं।',
        sources: schemesData.slice(0, 3),
        confidence: 'medium',
        isMockMode: true
      });
    }

    let normalizedMime = mimeType;
    if (mimeType.includes('webm')) normalizedMime = 'audio/webm';
    else if (mimeType.includes('wav')) normalizedMime = 'audio/wav';
    else if (mimeType.includes('ogg')) normalizedMime = 'audio/ogg';
    else if (mimeType.includes('mp4') || mimeType.includes('m4a')) normalizedMime = 'audio/mp4';
    else if (mimeType.includes('mp3') || mimeType.includes('mpeg')) normalizedMime = 'audio/mp3';
    else normalizedMime = 'audio/webm';

    // Step 1: Transcribe audio
    const sttResult = await generateWithModelFallback(genAI, [
      {
        inlineData: {
          mimeType: normalizedMime,
          data: audioBuffer.toString('base64')
        }
      },
      {
        text: 'Transcribe this audio verbatim in Devanagari Hindi if spoken in Hindi or Hinglish, or in English if spoken in English. Return ONLY the transcribed text.'
      }
    ]);

    const transcription = sttResult.response.text().trim().replace(/^["'“”‘’]+|["'“”‘’]+$/g, '');

    // Step 2: Retrieve schemes
    let schemes = schemesData;
    if (mongoose.connection.readyState === 1) {
      try {
        const dbSchemes = await Scheme.find({});
        if (dbSchemes && dbSchemes.length > 0) schemes = dbSchemes;
      } catch (e) {
        console.warn('DB query failed in audio chat, using seed data:', e.message);
      }
    }

    const isHindi = Boolean(transcription.match(/[\u0900-\u097F]/)) || req.body.language === 'hi';

    const systemPrompt = (isHindi ? 'MANDATORY: RESPOND IN HINDI (DEVANAGARI) ONLY.\n\n' : '') +
      'You are NagarikSaathi, a government scheme assistant for rural India.\n' +
      'Help citizens discover government schemes accurately.\n\n' +
      (isHindi
        ? 'CRITICAL RULE: Write the answer field ENTIRELY in pure Hindi Devanagari script. Use nameHindi for scheme names.'
        : 'CRITICAL RULE: Write the answer in clear, simple English.') + '\n\n' +
      'Available schemes:\n' +
      JSON.stringify(schemes.slice(0, 8).map(s => ({
        schemeId: s.schemeId,
        name: s.name,
        nameHindi: s.nameHindi || s.name,
        description: s.description,
        descriptionHindi: s.descriptionHindi || '',
        benefits: s.benefits,
        benefitsHindi: s.benefitsHindi || []
      })), null, 2) + '\n\n' +
      'RULES:\n' +
      '1. Cite scheme names using schemeId in citedSchemeIds array.\n' +
      '2. Respond ONLY with JSON: { "answer": string, "citedSchemeIds": string[], "confidence": "high"|"medium"|"low" }\n' +
      (isHindi ? '\nFINAL REMINDER: answer MUST be 100% Hindi Devanagari.\n' : '') +
      '\nRespond ONLY with the JSON object.';

    const chatResult = await generateWithModelFallback(genAI, [
      { text: systemPrompt },
      { text: `User Audio Question: ${transcription}` }
    ]);

    const parsed = parseAudioGeminiResponse(chatResult.response.text());

    const sources = (parsed.citedSchemeIds || [])
      .map(id => schemes.find(s => s.schemeId === id))
      .filter(Boolean);

    return res.json({
      transcription,
      answer: parsed.answer,
      sources,
      confidence: parsed.confidence || 'high',
      isMockMode: false
    });

  } catch (err) {
    console.warn('Audio chat notice:', err.message);
    return res.json({
      transcription: 'Voice Input',
      answer: 'आवाज सेवा वर्तमान में व्यस्त है। कृपया अपना प्रश्न चैट बॉक्स में लिखकर पूछें (Voice recognition is busy. Please type your query in the chat box).',
      sources: schemesData.slice(0, 3),
      confidence: 'medium',
      isMockMode: true
    });
  }
});

// 3. GET /api/audio/tts
// Proxies high-quality clear speech audio for Hindi and English as an infallible TTS fallback
router.get('/tts', async (req, res) => {
  try {
    const text = String(req.query.text || '').trim();
    if (!text) {
      return res.status(400).json({ error: 'Text query parameter is required.' });
    }

    const isHindi = /[\u0900-\u097F]/.test(text) || req.query.lang === 'hi';
    const lang = isHindi ? 'hi' : 'en';

    // Clean text for speech
    const cleanText = text
      .replace(/[*_#`~>]/g, '')
      .replace(/\[(.*?)\]\(.*?\)/g, '$1')
      .slice(0, 200);

    const ttsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(cleanText)}&tl=${lang}&client=tw-ob`;

    const ttsRes = await fetch(ttsUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
      }
    });

    if (!ttsRes.ok) {
      return res.status(502).json({ error: 'TTS service failed.' });
    }

    const buffer = await ttsRes.arrayBuffer();
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    return res.send(Buffer.from(buffer));
  } catch (err) {
    console.error('Error in /api/audio/tts:', err.message);
    return res.status(500).json({ error: 'TTS generation failed: ' + err.message });
  }
});

export default router;
