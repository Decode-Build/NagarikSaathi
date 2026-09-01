# Nagrik-Saathi — Complete Project Documentation

## Overview

**NagarikSaathi** (नागरिक साथी) is a full-stack, bilingual (Hindi/English), AI-powered Government Scheme Discovery and Application Fulfillment Platform. It is designed primarily for CSC (Common Service Centre) operators who assist rural citizens in discovering, verifying eligibility for, and applying to India's central and state government welfare schemes.

Unlike myScheme (which only lists schemes) or UMANG (which provides access links), NagarikSaathi acts as a **Smart Application Fulfillment Engine** — an end-to-end guided journey from "I have a problem" to "Your benefit is disbursed."

---

## Competitive Differentiation

| Feature | myScheme | UMANG | NagarikSaathi |
|---|---|---|---|
| Lists available schemes | ✅ | ❌ | ✅ |
| Eligibility checking | ✅ | ❌ | ✅ (AI-powered) |
| Provides service access links | ❌ | ✅ | ✅ |
| AI Conversational assistant | ❌ | ❌ | ✅ (Gemini RAG) |
| Hindi/English voice interface | ❌ | ❌ | ✅ |
| Document upload & AI OCR | ❌ | ❌ | ✅ |
| Cross-checks documents vs profile | ❌ | ❌ | ✅ |
| Generates dynamic application checklist | ❌ | ❌ | ✅ |
| Application submission workflow | ❌ | ❌ | ✅ (via n8n) |
| Real-time application tracking | ❌ | ❌ | ✅ (MongoDB) |
| Grievance handling | ❌ | ❌ | ❌ (CPGRAMS scope) |

---

## Project Structure

```
c:\Project\Nagrik-sathi\
├── backend/                  # Node.js + Express API server
│   ├── server.js             # Main server (1154 lines)
│   ├── db.js                 # MongoDB connection
│   ├── models.js             # All Mongoose data models
│   ├── seed.js               # 1000+ scheme seeding data (fallback)
│   ├── routes/
│   │   ├── auth.js           # JWT authentication & OTP
│   │   ├── schemes.js        # Scheme search, eligibility, details
│   │   ├── integrations.js   # n8n webhooks, OTP, application submission, tracking
│   │   └── documents.js      # AI OCR document verification (Gemini Vision)
│   ├── middlewares/
│   │   └── compliance.js     # DPDP Privacy & Zero-Storage enforcement
│   └── .env                  # Environment variables (SECRET - not committed)
│
├── frontend/vite/            # React + Vite SPA
│   └── src/
│       ├── App.jsx           # Root router and global state
│       ├── layouts/
│       │   ├── Layout.jsx    # App shell (header + sidebar + outlet)
│       │   └── Sidebar.jsx   # Navigation sidebar (all 8 routes)
│       ├── pages/
│       │   ├── LandingScreen.jsx      # Home: voice search + scheme discovery
│       │   └── HowItWorks.jsx         # End-to-end demo walkthrough
│       ├── schemes/
│       │   ├── EligibilityScreener.jsx  # Profile filter form
│       │   ├── ResultsScreen.jsx        # Paginated scheme results (20/page)
│       │   └── DetailScreen.jsx         # Scheme detail, QR, WhatsApp share
│       ├── dashboard/
│       │   ├── DashboardScreen.jsx      # Admin/operator stats dashboard
│       │   └── ApplicationsScreen.jsx  # Live registry of citizen applications
│       ├── chatbot/
│       │   └── ChatScreen.jsx           # AI Saathi conversation interface
│       ├── documents/
│       │   └── DocumentsScreen.jsx      # Document checklist + AI OCR verifier
│       ├── tracking/
│       │   └── TrackingScreen.jsx       # Real-time application status tracker
│       └── i18n/
│           └── LanguageContext.jsx      # Bilingual string dictionary (Hindi/English)
│
├── package.json              # Root monorepo scripts
└── admin_page.tsx            # Standalone Admin Panel (React TSX)
```

---

## Technology Stack

### Backend
| Library | Version | Purpose |
|---|---|---|
| `express` | ^4.19.2 | HTTP API server framework |
| `mongoose` | ^8.5.1 | MongoDB ODM for schema management |
| `@langchain/google-genai` | ^0.0.18 | Gemini LLM for RAG chatbot & Vision OCR |
| `multer` | ^2.3.0 | Multipart file upload handling |
| `jsonwebtoken` | ^9.0.3 | JWT-based operator authentication |
| `bcryptjs` | ^3.0.3 | Password hashing |
| `helmet` | ^8.3.0 | HTTP security headers |
| `express-rate-limit` | ^8.6.2 | Rate limiting on chat endpoint |
| `dotenv` | ^16.4.5 | Environment variable loading |
| `cors` | ^2.8.5 | Cross-origin request management |

### Frontend
| Library | Version | Purpose |
|---|---|---|
| `react` + `react-dom` | ^19.x | UI framework |
| `vite` | ^8.2.0 | Build tool and dev server |
| `react-router-dom` | ^7.x | Client-side SPA routing |
| `axios` | ^1.x | HTTP client for API calls |
| `lucide-react` | ^0.x | Icon library |
| `react-markdown` | ^9.x | Markdown rendering for AI responses |

---

## Environment Configuration

All secrets are stored in `backend/.env` (never committed to git).

```env
PORT=5000
MONGO_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/nagariksaathi
GEMINI_API_KEY=<your-google-gemini-api-key>
JWT_SECRET=<strong-random-secret>
# Optional n8n workflow webhooks:
N8N_WHATSAPP_SHARE_WEBHOOK=<url>
N8N_OTP_SEND_WEBHOOK=<url>
N8N_OTP_VERIFY_WEBHOOK=<url>
N8N_FORM_AUTOFILL_WEBHOOK=<url>
```

---

## How to Start

```bash
# From project root:
npm run dev
```

This single command:
1. Builds the Vite React frontend (`frontend/vite/dist`)
2. Starts the Node.js backend on port 5000
3. Serves the built frontend statically via Express

**If you see `EADDRINUSE: address already in use :::5000`:**
```powershell
taskkill /F /IM node.exe   # Kills all zombie node processes (Windows)
npm run dev                  # Then restart cleanly
```

After startup, open: **http://localhost:5000**

---

## Backend API Reference

### Base URL: `http://localhost:5000/api`

---

### Health & Configuration

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/health` | None | Returns DB connection status and mock mode flag |
| `POST` | `/settings/apikey` | JWT | Re-initialize Gemini with a new API key |

---

### Authentication (`/api/auth`)

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/auth/register` | None | Register a new operator/citizen account |
| `POST` | `/auth/login` | None | Login and receive JWT token |
| `GET` | `/auth/profile` | JWT | Get the logged-in user's profile |

---

### Schemes (`/api/schemes`)

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/schemes` | None | List all schemes with pagination (20/page). Supports `?page=`, `?search=`, `?category=`, `?state=` query params. Returns `{ total, page, limit, totalPages, schemes[] }` |
| `GET` | `/schemes/:id` | None | Get full details for a specific scheme by `schemeId` |
| `POST` | `/eligibility` | None | Run eligibility filter against user profile. Body: `{ state, occupation, gender, maritalStatus, landAcres, annualIncome, casteCategory }`. Returns matching scheme list. |

---

### AI Chatbot (`/api/chat`)

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/chat` | None | Send a message to the AI Saathi (Gemini RAG). Body: `{ message, sessionId, sessionType, language }`. Returns `{ answer, sources[], confidence, isMockMode }`. Rate-limited to 20 req/min. |

**How the AI works (RAG Pipeline):**
1. The user's query is embedded using Gemini `text-embedding-004`.
2. Cosine similarity is computed against all stored scheme embeddings.
3. The top-5 most similar schemes are retrieved as context.
4. Gemini `gemini-3.5-flash` generates a bilingual (Hindi/English) answer.
5. The cited scheme IDs are returned as `sources` for display in the sidebar.

---

### Document Verification (`/api/documents`)

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/documents/verify` | None | Upload a document image for AI OCR verification. `multipart/form-data` with fields: `document` (file), `documentType` (string), `expectedName` (string). Returns `{ extractedData, verificationResults }` |

**Verification Result Structure:**
```json
{
  "success": true,
  "extractedData": {
    "extractedName": "Ramesh Kumar",
    "dob": "15/04/1985",
    "idNumber": "XXXX-XXXX-1234",
    "isAuthenticLooking": true
  },
  "verificationResults": {
    "matches": ["Name matches expected profile: Ramesh Kumar"],
    "mismatches": [],
    "missing": []
  }
}
```

---

### Integrations (`/api/integrations`)

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/integrations/whatsapp-share` | None | Send a scheme summary to a citizen's WhatsApp via n8n |
| `POST` | `/integrations/send-otp` | None | Send a 6-digit OTP to a WhatsApp number (via n8n or in-memory) |
| `POST` | `/integrations/verify-otp` | None | Verify the entered OTP and return a `verificationToken` |
| `POST` | `/integrations/submit-application` | None | Submit an application form (requires verified OTP). Saves to MongoDB and optionally triggers n8n PDF generation |
| `GET` | `/integrations/applications` | None | Fetch all applications (for Admin Panel) |
| `GET` | `/integrations/applications/track/:applicationId` | None | **Live tracking** – returns real timeline from MongoDB `Application` collection based on status (SUBMITTED → VERIFIED → PROCESSED → REJECTED) |

---

### Admin / Rules API

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/rules` | JWT | Get all draft scheme rules pending review |
| `POST` | `/rules/approve/:id` | JWT | Approve a draft rule and promote it to the live scheme database |
| `POST` | `/rules/reject/:id` | JWT | Reject a draft rule |

---

## Data Models

### Scheme
```js
{
  schemeId: String,           // Unique identifier e.g. "pm-kisan"
  name: String,               // English name
  nameHindi: String,          // Hindi name
  category: [String],         // e.g. "Agriculture", "Direct Benefit Transfer"
  targetGroups: [String],
  eligibility: {
    occupation: [String],
    gender: String,           // "Male" | "Female" | "All"
    maritalStatus: [String],
    minLandAcres: Number,
    maxLandAcres: Number,
    states: [String],
    maxAnnualIncome: Number,
    casteCategory: [String]
  },
  benefits: String,
  benefitsHindi: String,
  documents: [String],
  applicationUrl: String,
  helplineNumber: String,
  description: String,
  descriptionHindi: String,
  ministry: String,
  lastVerified: Date,
  embedding: [Number],        // Vector embedding for RAG similarity search
  flagged: Boolean,
  deleted: Boolean
}
```

### Application
```js
{
  applicationId: String,      // e.g. "NS-APP-3K9X4"
  schemeId: String,
  schemeName: String,
  applicant: {
    fullName: String,
    phone: String,
    aadhaarLast4: String,     // Only last 4 digits stored (DPDP compliance)
    gender: String,
    age: Number,
    annualIncome: Number,
    occupation: String,
    address: String,
    district: String,
    state: String,
    casteCategory: String
  },
  status: String,             // "SUBMITTED" | "VERIFIED" | "PROCESSED" | "REJECTED"
  createdAt: Date
}
```

### ChatSession
```js
{
  sessionId: String,          // Unique session UUID
  sessionType: String,        // "operator" | "self"
  messages: [{
    role: String,             // "user" | "assistant"
    content: String,
    sourceSchemeIds: [String],
    confidence: String,       // "high" | "medium" | "low"
    timestamp: Date
  }],
  createdAt: Date             // TTL: auto-deleted after 24 hours
}
```

---

## Privacy & Compliance Architecture

NagarikSaathi implements two custom compliance middlewares:

### 1. Zero Storage Compliance (`zeroStorageComplianceMiddleware`)
- Scans all incoming `req.body`, `req.query`, and `req.params` for:
  - Full 12-digit Aadhaar numbers
  - PAN card numbers (format: `AAAAA9999A`)
  - Biometric field names (fingerprint, iris, retina, etc.)
- **Blocks the request with `HTTP 400`** if any prohibited data is detected
- Forces the system to use only tokenized references (`identity_token`) and boolean flags (`is_seeded`)

### 2. DPDP Purpose Limitation (`dpdpPurposeLimitationMiddleware`)
- Enforces the Digital Personal Data Protection Act, 2023
- Chat sessions are **ephemeral by default** (stored in memory, not persisted to database)
- Operators can opt-in to persistence by sending `X-DPDP-Purpose-Limitation: false` header

---

## Frontend Routes

| Path | Component | Description |
|---|---|---|
| `/` | `LandingScreen` | Home page with voice-enabled scheme search |
| `/chat` | `ChatScreen` | AI Saathi Gemini-powered conversation |
| `/admin` | `DashboardScreen` | Operator stats, citizen count, match speed |
| `/schemes` | `ResultsScreen` | Paginated list (20/page) with search and filters |
| `/screener` | `EligibilityScreener` | Manual profile-based eligibility filter |
| `/detail` | `DetailScreen` | Full scheme details, QR code, WhatsApp share |
| `/documents` | `DocumentsScreen` | Master checklist + AI OCR document verifier |
| `/applications` | `ApplicationsScreen` | Live registry of submitted applications |
| `/tracking` | `TrackingScreen` | Real-time application status tracker |
| `/how-it-works` | `HowItWorks` | End-to-end visual demo walkthrough |

---

## The 10-Step Fulfillment Workflow

```
① Understands request    → AI Saathi (Gemini RAG) via /api/chat
② Checks eligibility     → /api/eligibility with profile filter
③ Shows required docs    → DocumentsScreen master checklist
④ User uploads documents → DocumentsScreen file upload zone (multer)
⑤ OCR extracts info      → Gemini 1.5 Flash Vision via /api/documents/verify
⑥ Cross-checks docs      → Backend compares extracted name vs. expected name
⑦ Flags mismatches       → verificationResults.mismatches returned in JSON
⑧ Generates checklist    → verificationResults dynamic list rendered in UI
⑨ Sends to auth channel  → DetailScreen with official applicationUrl + QR Code
⑩ Tracks application     → /api/integrations/applications/track/:id → real MongoDB
```

---

## Bilingual Architecture (i18n)

All UI text is managed centrally in `LanguageContext.jsx`. The context provides:
- `t` — A dictionary object with all translated strings
- `lang` — Current language (`'en'` or `'hi'`)
- `setLang()` — Toggle function

**Toggle is in the sidebar** (Globe icon / "Hindi / English" button).

The AI Saathi backend respects the `language` field in the `/api/chat` request body:
- If `language === 'hi'`, or the message contains Devanagari characters (`/[\u0900-\u097F]/`), the Gemini response is returned in Hindi.

---

## Known Limitations

1. **Vite Chunk Warning**: The `528 kB` JS bundle warning is expected for a React app of this size. It does not affect functionality. Can be resolved by code-splitting with `React.lazy()`.
2. **OCR Accuracy**: Gemini Vision performs best on high-quality, well-lit photos of documents. Blurry or low-resolution images may result in null fields.
3. **Tracking Step 10**: The tracking timeline currently derives timestamps programmatically from `createdAt + N days`. Actual dates will reflect when a CSC operator manually updates the status in the Admin Panel.
4. **No Real OTP SMS**: The OTP is delivered via WhatsApp (n8n webhook). If `N8N_OTP_SEND_WEBHOOK` is not configured, the OTP is logged to the server console for development purposes only.
