# NagarikSaathi

Government welfare scheme assistance portal. Designed for operators and citizens to quickly discover schemes, check eligibility, and generate checklists/handouts.

## Directory Structure

- `frontend/nextjs` - The active Next.js frontend application (as shown in screenshots).
- `frontend/vite` - The legacy Vite + React frontend application (original chat/auth screens).
- `backend` - Express.js backend API server.
- `public` - Shared assets and handout downloads.

## Commands

Run these commands from the root directory:

### Install dependencies
```bash
npm run install-all
```

### Start Development Server
This starts both the backend server and the active Next.js frontend concurrently.
```bash
npm run dev
```

### Start Legacy Vite Frontend (Optional)
This starts both the backend server and the legacy Vite React frontend concurrently.
```bash
npm run dev:old
```
