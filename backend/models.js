import mongoose from 'mongoose';

const SchemeSchema = new mongoose.Schema({
  schemeId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  nameHindi: { type: String, required: true },
  category: [{ type: String }],
  targetGroups: [{ type: String }],
  eligibility: {
    occupation: [{ type: String }],
    gender: { type: String, enum: ['Male', 'Female', 'All'], default: 'All' },
    maritalStatus: [{ type: String }], // e.g. Single, Married, Widowed, All
    minLandAcres: { type: Number, default: 0 },
    maxLandAcres: { type: Number, default: 9999 },
    states: [{ type: String }],
    maxAnnualIncome: { type: Number, default: 9999999 },
    casteCategory: [{ type: String }]
  },
  benefits: { type: String, required: true },
  benefitsHindi: { type: String, required: true },
  documents: [{ type: String }],
  applicationUrl: { type: String },
  helplineNumber: { type: String },
  description: { type: String, required: true },
  descriptionHindi: { type: String, required: true },
  ministry: { type: String },
  lastVerified: { type: Date, default: Date.now },
  sourceUrl: { type: String },
  flagged: { type: Boolean, default: false },
  embedding: [{ type: Number }]
});

const ChatSessionSchema = new mongoose.Schema({
  sessionId: { type: String, required: true, unique: true },
  sessionType: { type: String, enum: ['operator', 'self'], required: true },
  messages: [{
    role: { type: String, enum: ['user', 'assistant'], required: true },
    content: { type: String, required: true },
    sourceSchemeIds: [{ type: String }],
    confidence: { type: String, enum: ['high', 'medium', 'low'] },
    timestamp: { type: Date, default: Date.now }
  }],
  createdAt: { type: Date, default: Date.now, expires: 86400 }, // TTL 24h
  lastActivity: { type: Date, default: Date.now }
});

const EligibilityProfileSchema = new mongoose.Schema({
  sessionId: { type: String, required: true },
  state: { type: String, required: true },
  occupation: { type: String, required: true },
  gender: { type: String, required: true },
  maritalStatus: { type: String, required: true },
  landAcres: { type: Number, required: true },
  annualIncome: { type: Number, required: true },
  casteCategory: { type: String, default: 'General' },
  languagePreference: { type: String, default: 'en' },
  createdAt: { type: Date, default: Date.now }
});

export const Scheme = mongoose.model('Scheme', SchemeSchema);
export const ChatSession = mongoose.model('ChatSession', ChatSessionSchema);
export const EligibilityProfile = mongoose.model('EligibilityProfile', EligibilityProfileSchema);

const DraftRuleSchema = new mongoose.Schema({
  schemeId: { type: String, required: true },
  name: { type: String, required: true },
  nameHindi: { type: String },
  category: [{ type: String }],
  targetGroups: [{ type: String }],
  eligibility: {
    occupation: [{ type: String }],
    gender: { type: String, enum: ['Male', 'Female', 'All'], default: 'All' },
    maritalStatus: [{ type: String }],
    minLandAcres: { type: Number, default: 0 },
    maxLandAcres: { type: Number, default: 9999 },
    states: [{ type: String }],
    maxAnnualIncome: { type: Number, default: 9999999 },
    casteCategory: [{ type: String }]
  },
  benefits: { type: String },
  benefitsHindi: { type: String },
  documents: [{ type: String }],
  applicationUrl: { type: String },
  helplineNumber: { type: String },
  description: { type: String },
  descriptionHindi: { type: String },
  ministry: { type: String },
  sourceUrl: { type: String },
  confidenceScore: { type: Number, default: 0 },
  sourceGazetteReference: { type: String },
  explicitFieldConstraints: [{ type: String }],
  status: { type: String, enum: ['PENDING_REVIEW', 'APPROVED', 'REJECTED'], default: 'PENDING_REVIEW' },
  createdAt: { type: Date, default: Date.now }
});

export const DraftRule = mongoose.model('DraftRule', DraftRuleSchema);

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phone: { type: String },
  isPhoneVerified: { type: Boolean, default: false },
  otpHash: { type: String },
  otpExpiry: { type: Date },
  otpAttempts: { type: Number, default: 0 },
  otpCooldown: { type: Date },
  profile: {
    age: { type: Number, required: true },
    occupation: { type: String, required: true },
    state: { type: String, required: true },
    gender: { type: String, required: true },
    maritalStatus: { type: String, required: true },
    annualIncome: { type: Number, default: 0 },
    casteCategory: { type: String, default: 'General' },
    languagePreference: { type: String, default: 'en' }
  },
  createdAt: { type: Date, default: Date.now }
});

export const User = mongoose.model('User', UserSchema);


