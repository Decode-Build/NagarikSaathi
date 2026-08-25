const mongoose = require('mongoose');
const { Schema } = mongoose;

const localizedString = { type: Map, of: String }; // e.g. { en: 'Old Age Pension', hi: 'वृद्धावस्था पेंशन' }

const schemeSchema = new Schema({
  schemeId: { type: String, required: true, unique: true },
  name: { type: Map, of: String, required: true },
  description: { type: Map, of: String },
  eligibilityRules: {
    minAge: Number,
    maxAge: Number,
    maxIncome: Number,
    states: [String],       // empty/absent = all states
    categories: [String]    // empty/absent = all categories
  },
  benefits: { type: Map, of: String },
  applyUrl: String
});

const Scheme = mongoose.model('Scheme', schemeSchema);

function resolveLocalized(map, lang) {
  if (!map) return '';
  if (map instanceof Map) {
    return map.get(lang) || map.get('en') || Array.from(map.values())[0] || '';
  }
  // In case it's a plain object (e.g. before full hydration)
  return map[lang] || map['en'] || Object.values(map)[0] || '';
}

module.exports = { Scheme, resolveLocalized };

