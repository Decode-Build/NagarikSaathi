// backend/import_schemes.mjs
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import dns from 'dns';
import { Scheme } from './models.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dns.setDefaultResultOrder('ipv4first');
dotenv.config({ path: path.join(__dirname, '.env') });

const DATASET_NAME = 'smartduketech/indian-government-schemes-2025';
const BATCH_SIZE = 100;
const TOTAL_ROWS = 4693;

function parseDocuments(docStr) {
  if (!docStr) return ["Aadhaar Card", "Bank Passbook", "Identity Proof"];
  return docStr
    .split(/\n|\r|\d+\.\s+/)
    .map(d => d.trim().replace(/^[-*•\d.]+\s*/, ''))
    .filter(d => d.length > 2 && d.length < 150)
    .slice(0, 10);
}

function parseStates(stateStr, defaultState) {
  if (!stateStr || stateStr === '[]' || stateStr === '["All"]') {
    return defaultState ? [defaultState] : ['All'];
  }
  try {
    const parsed = JSON.parse(stateStr);
    if (Array.isArray(parsed) && parsed.length > 0) return parsed;
  } catch {
    if (stateStr && stateStr !== 'both' && stateStr !== 'all') {
      return [stateStr];
    }
  }
  return defaultState ? [defaultState] : ['All'];
}

function parseGender(genderStr) {
  if (!genderStr) return 'All';
  const g = genderStr.toLowerCase();
  if (g.includes('female') || g.includes('women')) return 'Female';
  if (g.includes('male') && !g.includes('female')) return 'Male';
  return 'All';
}

function parseCaste(casteStr) {
  if (!casteStr || casteStr === '[]') return ['All'];
  try {
    const parsed = JSON.parse(casteStr);
    if (Array.isArray(parsed) && parsed.length > 0) return parsed;
  } catch {
    return ['All'];
  }
  return ['All'];
}

function parseCategories(catStr) {
  if (!catStr) return ['General Welfare'];
  return catStr.split(',').map(c => c.trim()).filter(Boolean);
}

function transformRowToScheme(row) {
  const schemeId = (row.slug || `scheme-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`).trim();
  const name = (row.name || 'Government Scheme').trim();
  const description = (row.description || name).trim();
  const benefits = (row.benefits || 'Government financial/welfare support as per official notification.').trim();
  const docs = parseDocuments(row.documents_required);
  const states = parseStates(row.eligibility_state, row.state);
  const categories = parseCategories(row.category);
  const targetGroups = row.beneficiary_type ? [row.beneficiary_type.trim()] : ['Eligible Citizens'];
  const ministry = (row.ministry || row.department || 'Government of India').trim();
  
  let incomeMax = 9999999;
  if (row.eligibility_income_max && !isNaN(Number(row.eligibility_income_max))) {
    incomeMax = Number(row.eligibility_income_max);
  }

  return {
    schemeId,
    name,
    nameHindi: name, // Default to clean name if Hindi translation not in dataset
    category: categories,
    targetGroups,
    eligibility: {
      occupation: row.beneficiary_type ? [row.beneficiary_type.trim()] : ['All'],
      gender: parseGender(row.eligibility_gender),
      maritalStatus: ['All'],
      minLandAcres: 0,
      maxLandAcres: 9999,
      states,
      maxAnnualIncome: incomeMax,
      casteCategory: parseCaste(row.eligibility_caste)
    },
    benefits,
    benefitsHindi: benefits,
    documents: docs.length > 0 ? docs : ["Aadhaar Card", "Bank Passbook", "Identity Proof"],
    applicationUrl: row.apply_url || row.official_url || 'https://www.myscheme.gov.in',
    helplineNumber: '1800-111-999 / 14444',
    description,
    descriptionHindi: description,
    ministry,
    lastVerified: row.scraped_at ? new Date(row.scraped_at) : new Date(),
    sourceUrl: row.official_url || 'https://www.myscheme.gov.in',
    flagged: false,
    embedding: []
  };
}

async function bulkImport() {
  console.log('====================================================');
  console.log('🚀 NagarikSaathi: Bulk Ingestion from Hugging Face');
  console.log(`Dataset: ${DATASET_NAME}`);
  console.log('====================================================\n');

  if (!process.env.MONGO_URI) {
    console.error('❌ FATAL ERROR: MONGO_URI is missing in backend/.env');
    process.exit(1);
  }

  console.log('Connecting to MongoDB Atlas...');
  await mongoose.connect(process.env.MONGO_URI);
  console.log(`Connected to: ${mongoose.connection.host}\n`);

  let importedCount = 0;
  let offset = 0;

  // Let's import the first 1000 schemes in batches for speed and performance
  const MAX_SCHEMES_TO_IMPORT = 1000;

  while (offset < MAX_SCHEMES_TO_IMPORT) {
    const limit = Math.min(BATCH_SIZE, MAX_SCHEMES_TO_IMPORT - offset);
    const url = `https://datasets-server.huggingface.co/rows?dataset=${encodeURIComponent(DATASET_NAME)}&config=default&split=train&offset=${offset}&limit=${limit}`;

    try {
      console.log(`Fetching batch [${offset + 1} to ${offset + limit}] from Hugging Face...`);
      const response = await fetch(url);
      if (!response.ok) {
        console.error(`Failed to fetch offset ${offset}: ${response.statusText}`);
        break;
      }

      const data = await response.json();
      const rows = data.rows.map(r => r.row);
      if (!rows || rows.length === 0) break;

      const bulkOps = rows.map(row => {
        const doc = transformRowToScheme(row);
        return {
          updateOne: {
            filter: { schemeId: doc.schemeId },
            update: { $set: doc },
            upsert: true
          }
        };
      });

      const result = await Scheme.bulkWrite(bulkOps, { ordered: false });
      importedCount += (result.upsertedCount + result.modifiedCount);
      console.log(`✅ Batch saved! Upserted: ${result.upsertedCount}, Updated: ${result.modifiedCount} (Total Processed: ${offset + rows.length})`);

      offset += rows.length;
    } catch (err) {
      console.error(`Error processing batch at offset ${offset}:`, err.message);
      break;
    }
  }

  const finalTotal = await Scheme.countDocuments();
  console.log('\n====================================================');
  console.log(`🎉 Ingestion Complete! Total schemes in MongoDB Atlas: ${finalTotal}`);
  console.log('====================================================\n');

  await mongoose.disconnect();
}

bulkImport().catch(err => {
  console.error('Ingestion failed:', err);
  process.exit(1);
});
