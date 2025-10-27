# CVlyze Backend

Node.js/Express backend for CVlyze - AI-powered resume analyzer.

## Setup

1. **Install dependencies:**
```bash
npm install
```

2. **Configure environment variables:**
- Create a `.env` file in the server directory
- Add your Gemini API key to `.env`:
```
GEMINI_API_KEY=your_actual_api_key_here
PORT=5000
```

3. **Run the server:**
```bash
npm start
```

Or for development with auto-restart:
```bash
npm run dev
```

Server will run on `http://localhost:5000`

## API Endpoints

### Health Check
```
GET /api/health
```

### Analyze Resume
```
POST /api/analyze
```
**Body (multipart/form-data):**
- `resume`: PDF or DOCX file
- `jobDescription`: (optional) Job description text

**Response:**
```json
{
  "success": true,
  "data": {
    "match_score": 78,
    "ats_score": 82,
    "matched_skills": ["React", "Node.js"],
    "missing_skills": ["AWS", "Docker"],
    "summary": "...",
    "recommendations": ["..."],
    "strengths": ["..."],
    "experience_level": "mid",
    "key_achievements": ["..."],
    "parsed_data": {
      "name": "...",
      "contact": {},
      "skills_list": []
    }
  }
}
```

### Check Configuration
```
GET /api/config/check
```

## Project Structure

```
server/
├── server.js              # Main Express application
├── package.json           # Node.js dependencies
├── .env                   # Environment variables (create this)
├── uploads/               # Temporary file uploads (auto-created)
└── utils/
    ├── resumeParser.js    # Resume parsing logic (PDF/DOCX)
    └── aiAnalyzer.js      # AI analysis with Gemini
```

## Features

- PDF and DOCX resume parsing
- Contact information extraction (email, phone, LinkedIn, GitHub)
- Section-based text extraction (Skills, Experience, Education, Projects)
- AI-powered analysis using Google Gemini
- Job description matching
- ATS compatibility scoring
- Skill gap analysis
- Actionable recommendations

## Technologies Used

- **Express.js** - Web framework
- **Multer** - File upload handling
- **pdf-parse** - PDF text extraction
- **mammoth** - DOCX text extraction
- **@google/generative-ai** - Gemini AI integration

## Development

Make sure you have Node.js installed (v14 or higher recommended).

For development with automatic restart on file changes, install nodemon globally:
```bash
npm install -g nodemon
```

Then run:
```bash
npm run dev
```
