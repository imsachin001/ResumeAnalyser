# CVlyze - AI Resume Analyzer

AI-powered resume analysis tool that helps job seekers optimize their resumes for ATS (Applicant Tracking Systems) and job descriptions.

## 🚀 Features

- **Resume Parsing**: Extract text from PDF and DOCX files
- **Contact Extraction**: Automatically extract email, phone, LinkedIn, GitHub
- **Section Detection**: Identify Skills, Experience, Education, Projects, etc.
- **AI Analysis**: Powered by Google Gemini for intelligent insights
- **Job Matching**: Compare resume against job descriptions
- **ATS Scoring**: Check resume compatibility with ATS systems
- **Skill Gap Analysis**: Identify missing skills from job requirements
- **Actionable Recommendations**: Get specific suggestions to improve your resume

## 📁 Project Structure

```
cvlyze-app/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── Home/              # Landing page with upload
│   │   │   ├── AnalysisLoading/   # Processing animation
│   │   │   ├── Analysis/          # Results display
│   │   │   └── Navbar/            # Navigation
│   │   ├── services/
│   │   │   └── api.js             # Backend API calls
│   │   └── App.jsx                # Main app component
│   └── package.json
│
└── server/                # Python Flask backend
    ├── app.py                     # Main Flask app
    ├── requirements.txt           # Python dependencies
    ├── .env                       # Environment variables
    └── utils/
        ├── resume_parser.py       # Resume text extraction
        └── ai_analyzer.py         # Gemini AI analysis
```

## 🛠️ Setup Instructions

### Prerequisites

- **Node.js** (v14 or higher)
- **Python** (v3.8 or higher)
- **Google Gemini API Key** (Get it from: https://makersuite.google.com/app/apikey)

### Backend Setup

1. **Navigate to server folder:**
```bash
cd server
```

2. **Create virtual environment:**
```bash
python -m venv venv
```

3. **Activate virtual environment:**

Windows:
```bash
venv\Scripts\activate
```

Linux/Mac:
```bash
source venv/bin/activate
```

4. **Install dependencies:**
```bash
pip install -r requirements.txt
```

5. **Configure environment:**
- Open `.env` file
- Add your Gemini API key:
```
GEMINI_API_KEY=your_actual_gemini_api_key_here
CLERK_SECRET_KEY=your_clerk_secret_key_here
CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key_here
PORT=5000
FLASK_ENV=development
```

6. **Run the backend:**
```bash
python app.py
```

Backend will run on `http://localhost:5000`

### Frontend Setup

1. **Navigate to client folder:**
```bash
cd client
```

2. **Install dependencies:**
```bash
npm install
```

3. **Run the frontend:**
```bash
npm start
```

Frontend will run on `http://localhost:3000`

## 🔑 Getting Gemini API Key

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the key and paste it in `server/.env` file

## 📖 How It Works

### 1. Upload Phase
- User uploads resume (PDF/DOCX)
- Optional: Add job description for matching

### 2. Parsing Phase
```python
# Backend extracts:
- Raw text from document
- Contact information (email, phone, LinkedIn)
- Sections (Skills, Experience, Education)
- Skills list
```

### 3. Analysis Phase
```python
# AI analyzes:
- Resume-JD alignment (if JD provided)
- ATS compatibility score
- Matched vs Missing skills
- Experience gaps
- Strengths and weaknesses
- Actionable recommendations
```

### 4. Results Display
- Match Score & ATS Score (visual gauges)
- Matched Skills (green tags)
- Missing Skills (red tags)
- Detailed recommendations
- Strengths and improvement areas

## 🎯 API Endpoints

### Health Check
```
GET /api/health
```

### Analyze Resume
```
POST /api/analyze

Body (multipart/form-data):
- resume: File (PDF/DOCX)
- jobDescription: String (optional)

Response:
{
  "success": true,
  "data": {
    "match_score": 78,
    "ats_score": 82,
    "matched_skills": [...],
    "missing_skills": [...],
    "summary": "...",
    "recommendations": [...],
    "strengths": [...],
    "weaknesses": [...]
  }
}
```

### Check Configuration
```
GET /api/config/check
```

## 🔧 Configuration

### Backend (.env)
```
GEMINI_API_KEY=your_api_key
PORT=5000
FLASK_ENV=development
```

### Frontend (.env)
```
REACT_APP_API_URL=http://localhost:5000/api
```

## 📝 Analysis Output Example

```json
{
  "match_score": 78,
  "ats_score": 82,
  "matched_skills": [
    "React.js",
    "Node.js",
    "JavaScript",
    "MongoDB"
  ],
  "missing_skills": [
    "AWS",
    "Docker",
    "GraphQL"
  ],
  "summary": "Strong full-stack foundation with good frontend and backend skills. Consider adding cloud deployment experience.",
  "recommendations": [
    "Add quantifiable achievements in experience section",
    "Include AWS or cloud deployment projects",
    "Highlight API development experience more prominently",
    "Add certifications if available"
  ],
  "strengths": [
    "Modern tech stack alignment",
    "Clear project descriptions",
    "Well-structured resume format"
  ],
  "weaknesses": [
    "Limited cloud infrastructure experience",
    "Missing DevOps tools",
    "Could add more measurable impacts"
  ]
}
```

## 🐛 Troubleshooting

### Backend Issues

**ModuleNotFoundError:**
```bash
pip install -r requirements.txt
```

**API Key Error:**
- Check `.env` file has correct `GEMINI_API_KEY`
- Ensure no spaces around the key
- Verify key is valid on Google AI Studio

**File Upload Error:**
- Check `uploads/` folder exists (auto-created)
- Verify file size < 10MB
- Ensure file is PDF or DOCX format

### Frontend Issues

**CORS Error:**
- Backend must be running on port 5000
- Check `REACT_APP_API_URL` in `client/.env`

**Module Not Found:**
```bash
npm install
```

## 📚 Tech Stack

### Frontend
- React 18
- CSS3
- Axios (API calls)

### Backend
- Python 3.8+
- Flask (Web framework)
- PyPDF2 (PDF parsing)
- python-docx (DOCX parsing)
- Google Generative AI (Gemini)

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

## 📄 License

This project is open source and available under the MIT License.

## 👥 Authors

- Your Name - Initial work

## 🙏 Acknowledgments

- Google Gemini AI for intelligent analysis
- React community for amazing tools
- Flask for simple backend framework
