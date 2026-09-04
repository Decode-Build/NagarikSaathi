# 🏛️ NagarikSaathi (नागरिक साथी)
> **AI-Powered Government Scheme Discovery & Application Fulfillment Platform for CSC Operators and Rural Citizens in India.**

[![Node.js](https://img.shields.io/badge/Node.js-18%2B-green.svg)](https://nodejs.org/)
[![React 19](https://img.shields.io/badge/React-19.x-blue.svg)](https://react.dev/)
[![Gemini 3.5 Flash](https://img.shields.io/badge/AI-Gemini%203.5%20Flash-orange.svg)](https://ai.google.dev/)
[![DPDP Compliant](https://img.shields.io/badge/Compliance-DPDP%20Zero--Storage-purple.svg)](https://www.meity.gov.in/)

---

## 🌟 Key Features

1. **Smart Application Fulfillment Engine**: End-to-end guided assistance moving beyond simple scheme listing (like myScheme) into document checking, application form generation, and DBT status verification.
2. **Dual-Engine Multimodal Voice Interface**: Web Speech API with automatic fallback to Gemini Multimodal Audio for robust Devanagari Hindi / Hinglish recognition.
3. **Advanced AI Document OCR & Indian Name Reconciliation**: Multi-factor Jaro-Winkler + Token Sort fuzzy reconciliation for Indian names (e.g. *Smt. Anita Devi* vs *Anita Devi*), Verhoeff Aadhaar checksum checks, and DPDP masking.
4. **Unified Live AI Scheme Discovery & RAG**: Pre-seeded database vector matching boosted by live Tavily web search across official `.gov.in` and `myscheme.gov.in` gazettes.
5. **Distributed Persistent OTP & WhatsApp Fulfillment**: MongoDB TTL-indexed OTP sessions with WhatsApp alerts via n8n automation bot.
6. **CSC / VLE Operator First**: Tailored commercial fee schedules (₹30-50), printable handouts, and real-time application tracking.

---

## 📁 Repository Architecture

```
NagarikSaathi/
├── backend/                       # Express.js Backend Server
│   ├── server.js                  # Main server & RAG chat endpoint
│   ├── models.js                  # Mongoose models (Scheme, User, OtpSession, Application, DraftRule)
│   ├── middlewares/
│   │   └── compliance.js          # DPDP Zero-Storage & Purpose Limitation enforcement
│   ├── routes/
│   │   ├── ai.js                  # Live Web Scheme Discovery, Gazette Rule Extraction & Intent Parsing
│   │   ├── documents.js           # Vision OCR & Indian Name Reconciliation Engine
│   │   ├── integrations.js        # Persistent OTP, n8n WhatsApp alerts & Application tracking
│   │   ├── schemes.js             # Scheme search, eligibility filter, VLE analytics
│   │   ├── audio.js               # Gemini Multimodal Audio transcription & TTS
│   │   └── auth.js                # Operator JWT authentication
│   ├── rag_eval.js                # 20-Query RAG benchmark & accuracy harness
│   └── seed.js                    # 1,000+ Welfare schemes seed dataset
│
├── frontend/
│   ├── vite/                      # Primary High-Performance React 19 SPA (Production UI)
│   │   └── src/
│   │       ├── pages/             # Landing & How-It-Works walkthrough
│   │       ├── schemes/           # Eligibility Screener & Scheme Detail view
│   │       ├── chatbot/           # Bilingual AI Saathi Conversational Assistant
│   │       ├── documents/         # Document verification & WhatsApp share modal
│   │       ├── dashboard/         # VLE impact dashboard & Application registry
│   │       ├── tracking/          # Real-time multi-stage application tracker
│   │       └── i18n/              # Hindi/English Language Context
│   └── nextjs/                    # Next.js App Router companion interface
│
├── ai/                            # Python Batch Ingestion CLI Suite (Pydantic + Gemini + Tavily)
│   ├── extract_rule.py            # CLI tool to extract structured rules from PDF gazettes
│   ├── main.py                    # Standalone intent-to-match pipeline
│   └── models.py                  # Pydantic DraftRule & Scheme schemas
│
└── package.json                   # Root Monorepo Scripts
```

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- Node.js 18+ installed
- MongoDB running locally on `mongodb://127.0.0.1:27017/nagariksaathi` (or MongoDB Atlas URI)
- Google Gemini API Key ([Google AI Studio](https://aistudio.google.com/))
- (Optional) Tavily API Key ([tavily.com](https://tavily.com/))

### 2. Environment Setup
Copy the configuration template and add your credentials:
```bash
cp backend/.env.example backend/.env
```

### 3. Install All Dependencies
```bash
npm run install-all
```

### 4. Seed Database (Optional)
```bash
npm run seed
```

### 5. Start Development Server
Builds the Vite frontend and starts the Express backend concurrently on port 5000:
```bash
npm run dev
```

Open **http://localhost:5000** in your browser.

---

## 🧪 Evaluation & Benchmarks

Run the built-in RAG accuracy evaluation harness (20 natural language test cases):
```bash
npm run eval
```

---

## 🛡️ Security & DPDP Compliance
- **Zero-Storage Enforcement**: Request payloads are recursively inspected by `zeroStorageComplianceMiddleware` to block unmasked 12-digit Aadhaar sequences, PAN numbers, and biometric arrays.
- **Ephemeral Sessions**: Citizen queries run under `x-dpdp-purpose-limitation` with automated 24-hour TTL expiration.
- **Masked Identity Tokens**: Full IDs are scrubbed to `XXXX-XXXX-1234` before any persistence.
