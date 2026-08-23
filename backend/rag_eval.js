/**
 * rag_eval.js — Real RAG accuracy test for NagarikSaathi
 * Run: node backend/rag_eval.js
 *
 * Tests 20 natural-language queries against the live RAG pipeline.
 * Queries include both cases we expect to pass AND intentionally hard/edge cases.
 * Reports: hit rate, avg similarity score, failures clearly labelled.
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';
import mongoose from 'mongoose';
import { GoogleGenerativeAIEmbeddings } from '@langchain/google-genai';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });

const MONGO_URI = process.env.MONGO_URI;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

if (!MONGO_URI) { console.error('MONGO_URI not set'); process.exit(1); }
if (!GEMINI_API_KEY) { console.error('GEMINI_API_KEY not set'); process.exit(1); }

// Schema inline for eval script
const schemeSchema = new mongoose.Schema({
  schemeId: String,
  name: String,
  category: String,
  embedding: [Number],
});
const Scheme = mongoose.model('Scheme', schemeSchema);

function cosineSimilarity(a, b) {
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

// --- TEST SET ---
// Format: { query, expectedSchemeId (null means no clear answer — failure expected), lang }
// Queries chosen to cover: semantic gaps, Hindi, ambiguous, partial, wrong-domain, real citizen phrases
const TEST_CASES = [
  // ---- EXPECTED HITS ----
  { query: "I am a farmer, I need money for seeds", expectedId: "pm-kisan", lang: "en" },
  { query: "Mera pati mar gaya, mujhe sahara chahiye", expectedId: "ign-widow-pension", lang: "hi", note: "Semantic: no 'widow' keyword" },
  { query: "Old age pension for poor senior citizen", expectedId: "ign-old-age-pension", lang: "en" },
  { query: "I want to start a small business with a loan", expectedId: "pm-mudra", lang: "en" },
  { query: "Crop insurance if harvest fails due to rain", expectedId: "pm-fasal-bima", lang: "en" },
  { query: "LPG gas cylinder subsidy for poor family", expectedId: "pm-ujjwala", lang: "en" },
  { query: "Free treatment in hospital for poor people", expectedId: "ayushman-bharat", lang: "en" },
  { query: "Matric scholarship for SC student", expectedId: "post-matric-sc", lang: "en" },
  { query: "Artisan wanting skill training and money", expectedId: "pm-vishwakarma", lang: "en" },
  { query: "Kisan fasal bima yojana kya hoti hai", expectedId: "pm-fasal-bima", lang: "hi" },
  { query: "Widow pension for woman whose husband died", expectedId: "ign-widow-pension", lang: "en" },
  { query: "Machli palan ke liye loan chahiye", expectedId: "pm-matsya-sampada", lang: "hi", note: "Fisheries — semantic" },
  // ---- HARD / AMBIGUOUS CASES ----
  { query: "I am unemployed youth looking for training", expectedId: null, lang: "en", note: "Multiple plausible matches" },
  { query: "Ghar banane ke liye paisa chahiye", expectedId: "pm-awas-gramin", lang: "hi", note: "Housing scheme" },
  // ---- EXPECTED FAILURES / EDGE CASES ----
  { query: "Railway ticket booking help", expectedId: null, lang: "en", note: "Out of domain — should return low score" },
  { query: "मुझे पासपोर्ट बनवाना है", expectedId: null, lang: "hi", note: "Passport — out of domain" },
  { query: "xyz", expectedId: null, lang: "en", note: "Nonsense input — low score expected" },
  { query: "SC ST OBC General farmer women pension skill", expectedId: null, lang: "en", note: "Keyword dump — tests semantic vs keyword" },
  { query: "Pregnant woman nutrition support", expectedId: "pm-matru-vandana", lang: "en", note: "PMMVY — semantic" },
  { query: "Disability pension monthly allowance", expectedId: "ign-disability-pension", lang: "en", note: "Disability scheme" },
];

async function runEval() {
  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB');

  const schemes = await Scheme.find({}, 'schemeId name embedding category');
  const withEmbeddings = schemes.filter(s => s.embedding && s.embedding.length > 0);
  console.log(`Loaded ${schemes.length} schemes, ${withEmbeddings.length} have embeddings\n`);

  const embeddings = new GoogleGenerativeAIEmbeddings({
    apiKey: GEMINI_API_KEY,
    modelName: "gemini-embedding-2",
  });

  let hits = 0, misses = 0, expectedMisses = 0, results = [];

  for (const tc of TEST_CASES) {
    let queryVec;
    try {
      queryVec = await embeddings.embedQuery(tc.query);
    } catch (e) {
      console.error(`Embedding failed for: "${tc.query}" — ${e.message}`);
      results.push({ ...tc, topMatch: null, topScore: null, status: 'EMBEDDING_ERROR' });
      continue;
    }

    const scored = withEmbeddings.map(s => ({
      schemeId: s.schemeId,
      name: s.name,
      score: cosineSimilarity(queryVec, s.embedding)
    })).sort((a, b) => b.score - a.score);

    const top = scored[0];
    const topScorePct = Math.round(top.score * 100);

    let status;
    if (tc.expectedId === null) {
      // Out-of-domain or ambiguous: record top match for inspection, no hit/miss judgment
      status = 'NO_EXPECTATION';
      expectedMisses++;
    } else if (top.schemeId === tc.expectedId) {
      status = 'HIT';
      hits++;
    } else {
      // Check if expected scheme is in top 3 (partial credit)
      const inTop3 = scored.slice(0, 3).some(s => s.schemeId === tc.expectedId);
      status = inTop3 ? 'PARTIAL (top-3)' : 'MISS';
      if (!inTop3) misses++;
      else hits++; // count top-3 as hit
    }

    results.push({
      query: tc.query,
      lang: tc.lang,
      expectedId: tc.expectedId,
      topMatchId: top.schemeId,
      topMatchName: top.name,
      topScore: topScorePct,
      status,
      note: tc.note || ''
    });

    // Small delay to avoid rate limits
    await new Promise(r => setTimeout(r, 800));
  }

  // Print results table
  console.log('='.repeat(100));
  console.log('RAG EVALUATION RESULTS — NagarikSaathi');
  console.log('='.repeat(100));
  console.log(`${'Query'.padEnd(48)} ${'Lang'.padEnd(5)} ${'Top Match (Scheme ID)'.padEnd(28)} ${'Score'.padEnd(7)} Status`);
  console.log('-'.repeat(100));
  for (const r of results) {
    const q = r.query.length > 47 ? r.query.slice(0, 44) + '...' : r.query;
    const score = r.topScore != null ? `${r.topScore}%` : 'ERR';
    console.log(`${q.padEnd(48)} ${r.lang.padEnd(5)} ${(r.topMatchId || 'N/A').padEnd(28)} ${score.padEnd(7)} ${r.status}${r.note ? ' — ' + r.note : ''}`);
  }

  const totalWithExpectation = TEST_CASES.filter(t => t.expectedId !== null).length;
  const hitRate = ((hits / totalWithExpectation) * 100).toFixed(1);
  const avgScore = Math.round(results.filter(r => r.topScore != null).reduce((s, r) => s + r.topScore, 0) / results.filter(r => r.topScore != null).length);

  console.log('='.repeat(100));
  console.log(`\nSUMMARY`);
  console.log(`  Total test cases       : ${TEST_CASES.length}`);
  console.log(`  Cases with expectations: ${totalWithExpectation}`);
  console.log(`  Hits (exact or top-3)  : ${hits}`);
  console.log(`  Misses                 : ${misses}`);
  console.log(`  No-expectation cases   : ${expectedMisses}`);
  console.log(`  Hit Rate               : ${hitRate}% (${hits}/${totalWithExpectation})`);
  console.log(`  Avg cosine score       : ${avgScore}%`);
  console.log(`\nNote: "PARTIAL (top-3)" counted as a hit. Out-of-domain queries listed for inspection only.\n`);

  await mongoose.disconnect();
}

runEval().catch(e => { console.error(e); process.exit(1); });
