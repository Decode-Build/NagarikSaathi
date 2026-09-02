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
  embedding: [{ type: Number }],
  version: { type: String, default: 'v1.0' },
  deleted: { type: Boolean, default: false }
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
  createdAt: { type: Date, default: Date.now },
  version: { type: String, default: 'v1.0' }
});

export const DraftRule = mongoose.model('DraftRule', DraftRuleSchema);

const SchemeVersionSchema = new mongoose.Schema({
  schemeId: { type: String, required: true },
  version: { type: String, required: true },
  schemeData: { type: mongoose.Schema.Types.Mixed, required: true },
  approvedAt: { type: Date, default: Date.now }
});

SchemeVersionSchema.index({ schemeId: 1, version: 1 }, { unique: true });

export const SchemeVersion = mongoose.model('SchemeVersion', SchemeVersionSchema);

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
    languagePreference: { type: String, default: 'en' },
    is_seeded: { type: Boolean, default: false },
    identity_status: { type: String, default: 'UNVERIFIED' },
    identity_token: { type: String, default: null }
  },
  createdAt: { type: Date, default: Date.now }
});

export const User = mongoose.model('User', UserSchema);

const ApplicationSchema = new mongoose.Schema({
  applicationId: { type: String, required: true, unique: true },
  schemeId: { type: String },
  schemeName: { type: String, required: true },
  applicant: {
    fullName: { type: String, required: true },
    phone: { type: String, required: true },
    aadhaarLast4: { type: String },
    gender: { type: String },
    age: { type: Number },
    annualIncome: { type: Number },
    occupation: { type: String },
    address: { type: String },
    district: { type: String },
    state: { type: String },
    casteCategory: { type: String },
    isPhoneVerified: { type: Boolean, default: true }
  },
  verificationToken: { type: String },
  status: { type: String, enum: ['SUBMITTED', 'VERIFIED', 'PROCESSED', 'REJECTED'], default: 'SUBMITTED' },
  remarks: { type: String, default: '' },
  verifiedAt: { type: Date },
  approvedAt: { type: Date },
  rejectedAt: { type: Date },
  downloadUrl: { type: String },
  n8nGenerated: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

export const Application = mongoose.model('Application', ApplicationSchema);
