"use client";

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export interface TranslationResult {
  originalText: string;
  translatedText: string;
  sourceLang: 'en' | 'hi';
  targetLang: 'en' | 'hi';
  engine?: string;
}

// Client-side quick dictionary for instant zero-latency translations
const QUICK_PHRASES: Record<string, { hi: string; en: string }> = {
  "i am a farmer": { en: "I am a farmer, I need subsidy", hi: "मैं एक किसान हूँ, मुझे सब्सिडी चाहिए" },
  "farmer": { en: "Farmer schemes", hi: "किसानों के लिए सरकारी योजनाएं" },
  "subsidy": { en: "Subsidy for agriculture and business", hi: "कृषि एवं व्यापार के लिए सब्सिडी/अनुदान" },
  "loan": { en: "Collateral-free business loan", hi: "बिना गारंटी व्यापार लोन/ऋण" },
  "pension": { en: "Old age and widow pension", hi: "वृद्धावस्था एवं विधवा पेंशन" },
  "housing": { en: "Rural housing assistance scheme", hi: "ग्रामीण पक्का आवास सहायता योजना" },
  "health": { en: "Free medical insurance cover up to ₹5 Lakh", hi: "₹5 लाख तक का मुफ्त स्वास्थ्य बीमा कवर" },
  "women": { en: "Financial assistance for women", hi: "महिलाओं के लिए वित्तीय सहायता योजना" },
  "scholarship": { en: "Student scholarship scheme", hi: "छात्रों के लिए छात्रवृत्ति योजना" },
  "ration": { en: "Free ration card scheme", hi: "मुफ्त राशन कार्ड योजना" }
};

const HINGLISH_CLIENT_MAP: Record<string, string> = {
  "kisan": "किसान",
  "kisaan": "किसान",
  "kheti": "खेती",
  "yojana": "योजना",
  "yojna": "योजना",
  "loan": "लोन",
  "karj": "कर्ज",
  "paisa": "पैसा",
  "paise": "पैसे",
  "ghar": "घर",
  "makan": "मकान",
  "awas": "आवास",
  "mahila": "महिला",
  "mahilaye": "महिलाएं",
  "ladki": "लड़की",
  "beti": "बेटी",
  "bima": "बीमा",
  "fasal": "फसल",
  "chahiye": "चाहिए",
  "kaise": "कैसे",
  "kare": "करें",
  "karein": "करें",
  "milega": "मिलेगा",
  "milta": "मिलता",
  "hai": "है",
  "hain": "हैं",
  "mujhe": "मुझे",
  "main": "मैं",
  "hum": "हम",
  "pension": "पेंशन",
  "budhapa": "बुढ़ापा",
  "vidhwa": "विधवा",
  "chhatravritti": "छात्रवृत्ति",
  "padhai": "पढ़ाई",
  "shiksha": "शिक्षा",
  "swasthya": "स्वास्थ्य",
  "ilaj": "इलाज",
  "dawa": "दवा",
  "aspataal": "अस्पताल"
};

export async function convertTextLanguage(
  text: string,
  targetLang?: 'en' | 'hi'
): Promise<TranslationResult> {
  const trimmed = text.trim();
  if (!trimmed) {
    return {
      originalText: '',
      translatedText: '',
      sourceLang: targetLang === 'hi' ? 'en' : 'hi',
      targetLang: targetLang || 'hi'
    };
  }

  const isHindi = Boolean(trimmed.match(/[\u0900-\u097F]/));
  const sourceLang: 'en' | 'hi' = isHindi ? 'hi' : 'en';
  const effectiveTarget: 'en' | 'hi' = targetLang || (sourceLang === 'hi' ? 'en' : 'hi');

  // Try API call to backend translation service (Gemini powered)
  try {
    const res = await fetch(`${API_URL}/translate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: trimmed,
        targetLang: effectiveTarget,
        sourceLang
      })
    });

    if (res.ok) {
      const data = await res.json();
      if (data.translatedText) {
        return {
          originalText: trimmed,
          translatedText: data.translatedText,
          sourceLang,
          targetLang: effectiveTarget,
          engine: data.engine || 'api'
        };
      }
    }
  } catch (err) {
    console.warn("Translation API unreachable, using client offline conversion:", err);
  }

  // Client-side offline fallback conversion
  let localResult = trimmed;

  // 1. Check quick phrases
  for (const key of Object.keys(QUICK_PHRASES)) {
    if (trimmed.toLowerCase().includes(key)) {
      localResult = effectiveTarget === 'hi' ? QUICK_PHRASES[key].hi : QUICK_PHRASES[key].en;
      return {
        originalText: trimmed,
        translatedText: localResult,
        sourceLang,
        targetLang: effectiveTarget,
        engine: 'client-phrase'
      };
    }
  }

  // 2. Hinglish to Devanagari translation
  if (effectiveTarget === 'hi' && !isHindi) {
    const words = trimmed.split(/\s+/);
    const converted = words.map(w => {
      const clean = w.toLowerCase().replace(/[^a-z0-9]/g, '');
      return HINGLISH_CLIENT_MAP[clean] || w;
    });
    if (converted.some((w, i) => w !== words[i])) {
      return {
        originalText: trimmed,
        translatedText: converted.join(' '),
        sourceLang: 'en',
        targetLang: 'hi',
        engine: 'client-hinglish'
      };
    }
  }

  return {
    originalText: trimmed,
    translatedText: localResult,
    sourceLang,
    targetLang: effectiveTarget,
    engine: 'client-fallback'
  };
}
