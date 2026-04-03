# ResumeAnalyser (CVlyze)

AI-powered resume analysis platform with:
- React frontend (client)
- Node.js + Express backend (server)
- Clerk authentication
- Gemini-powered analysis with rule-based fallback
- MongoDB as Database

This project lets users upload resumes (PDF/DOCX), evaluate ATS and job match quality, generate recommendations, and save analysis snapshots locally in the browser.

## Table of Contents

1. Overview
2. Key Features
3. Project Structure
4. Tech Stack
5. Prerequisites
6. Environment Variables
7. Installation
8. Running the App (Development)
9. API Endpoints
10. How Analysis Works
11. Authentication Flow
12. Scripts
13. Testing
14. Troubleshooting
15. Notes for Production
16. License

## Overview

CVlyze analyzes resumes against ATS-style criteria and optional job descriptions.

Main workflow:
1. User signs in with Clerk.
2. User uploads a PDF or DOCX resume (up to 10MB) and optional job description.
3. Server parses resume text and structured content.
4. If a Gemini API key is available, AI-generated analysis is returned.
5. If Gemini is missing, a rule-based fallback analysis is returned.
6. Frontend shows ATS/Match scores, recommendations, strengths/weaknesses, and optional tailoring options.

## Key Features

- Resume upload with drag-and-drop support
- Clerk auth protection for analysis pages and APIs
- Parsing support for:
  - PDF via pdf-parse
  - DOCX via mammoth
- ATS score and job match score generation
- Skill extraction and matching
- Recommendations, strengths, weaknesses, and suggested roles
- Saved analyses in localStorage with preview image
- PDF export of analysis report
- Backend health/config endpoints

## Project Structure

```
resumeAA/
  README.md
  summary.txt
  install-clerk.ps1
  install-clerk.sh
  client/
    package.json
    src/
    public/
  server/
    package.json
    server.js
    middleware/
    utils/
    test/
    uploads/
```

Important paths:
- Frontend entry: client/src/index.js
- Frontend app shell: client/src/App.jsx
- Backend entry: server/server.js
- Auth middleware: server/middleware/authMiddleware.js
- Resume parser: server/utils/resumeParserEnhanced.js
- AI analyzer: server/utils/aiAnalyzer.js

## Tech Stack

Frontend:
- React 19
- Clerk React SDK
- html2canvas
- jsPDF
- CRA tooling (react-scripts)

Backend:
- Node.js + Express
- Clerk Express SDK
- Multer (file upload)
- pdf-parse + mammoth (resume extraction)
- @google/generative-ai (Gemini)
- dotenv + cors

## Prerequisites

Install before running:
- Node.js 18+ (recommended)
- npm 9+
- Clerk account (for auth keys)
- Google Gemini API key (optional but recommended)

## Environment Variables

### 1) Client env file

Create: client/.env

```
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
```

### 2) Server env file

Create: server/.env

You can copy server/.env.example and fill values.

```
PORT=5000
GEMINI_API_KEY=your_gemini_api_key
CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key
```

Notes:
- GEMINI_API_KEY is optional. If omitted, the backend returns fallback rule-based analysis.
- Clerk keys are required for authenticated routes.

## Installation

From repository root:

```bash
cd client
npm install

cd ../server
npm install
```

Optional helper scripts for Clerk packages (already included in package.json in this repo version, but safe to run):

Linux/macOS:
```bash
bash install-clerk.sh
```

Windows PowerShell:
```powershell
./install-clerk.ps1
```

## Running the App (Development)

Use two terminals.

Terminal 1 (server):
```bash
cd server
npm run dev
```

Terminal 2 (client):
```bash
cd client
npm start
```

Defaults:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000/api

## API Endpoints

Base URL: http://localhost:5000/api

### GET /health
Health check.

Response:
```json
{
  "status": "healthy",
  "message": "CVlyze API is running"
}
```

### GET /config/check
Checks whether Gemini key exists on server.

Response:
```json
{
  "configured": true,
  "message": "Gemini API key is configured"
}
```

### POST /analyze (Protected)
Analyzes uploaded resume.

Auth:
- Requires Bearer token from Clerk.

Request:
- Content-Type: multipart/form-data
- Field resume: file (.pdf, .docx, .doc)
- Field jobDescription: optional string

Success response:
```json
{
  "success": true,
  "data": {
    "ats_score": 78,
    "match_score": 72,
    "matched_skills": [],
    "missing_skills": [],
    "recommendations": [],
    "summary": "..."
  }
}
```

### POST /tailor-resume (Protected)
Tailors analyzed resume data against a job description.

Auth:
- Requires Bearer token from Clerk.

Request:
```json
{
  "resumeData": {},
  "jobDescription": "..."
}
```

## How Analysis Works

Server-side pipeline:
1. File upload validation (extension + size up to 10MB)
2. Text extraction:
   - PDF via pdf-parse
   - DOCX/DOC via mammoth
3. Structured parsing:
   - Contact info
   - Education
   - Skills
   - Projects
   - Experience
4. Scoring and recommendations:
   - Gemini analysis when GEMINI_API_KEY is set
   - Rule-based fallback otherwise
5. Temporary file cleanup from uploads folder

## Authentication Flow

- Frontend uses ClerkProvider with REACT_APP_CLERK_PUBLISHABLE_KEY.
- ProtectedRoute wraps sensitive UI routes.
- Frontend includes Authorization: Bearer <token> for protected APIs.
- Backend uses clerkMiddleware and custom requireAuth guard.

## Scripts

Client (client/package.json):
- npm start: run React dev server
- npm run build: production build
- npm test: test runner
- npm run eject: eject CRA config

Server (server/package.json):
- npm start: run server.js
- npm run dev: run with nodemon

## Testing

Server test utilities are available under:
- server/test/test-comprehensive-upgrade.js
- server/test/test-parser.js
- server/test/test-skill-matching.js

Run examples:

```bash
cd server
node test/test-parser.js
node test/test-skill-matching.js
node test/test-comprehensive-upgrade.js
```

## Troubleshooting

1. 401 Unauthorized on analyze/tailor routes
- Ensure Clerk keys are set in both client and server env files.
- Ensure token is being sent as Bearer token.

2. CORS or failed API calls from frontend
- Confirm backend is running on port 5000.
- Confirm REACT_APP_API_URL points to http://localhost:5000/api.

3. Resume upload rejected
- Allowed types are PDF, DOCX, DOC.
- Max file size is 10MB.

4. AI analysis is generic/basic
- GEMINI_API_KEY is missing or invalid.
- Verify with GET /api/config/check.

5. Clerk sign-in components not rendering correctly
- Recheck REACT_APP_CLERK_PUBLISHABLE_KEY.
- Restart client after .env updates.

## Notes for Production

Before deployment:
- Move from localStorage persistence to database storage.
- Replace alert-based errors with structured UI notifications.
- Remove verbose backend debug logging for parsed resume internals.
- Add rate limiting and stricter upload/security middleware.
- Use HTTPS and secure environment secret management.
- Add integration and e2e tests for auth + upload + analysis paths.

## License

MIT (server package declares MIT).
If you need a root-level LICENSE file, add one to the repository root.
