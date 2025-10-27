const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
require('dotenv').config();

const resumeParser = require('./utils/resumeParserEnhanced');
const aiAnalyzer = require('./utils/aiAnalyzer');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configuration
const UPLOAD_FOLDER = 'uploads';
const ALLOWED_EXTENSIONS = ['pdf', 'docx', 'doc'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

// Create upload folder if it doesn't exist
const createUploadFolder = async () => {
  try {
    await fs.mkdir(UPLOAD_FOLDER, { recursive: true });
  } catch (error) {
    console.error('Error creating upload folder:', error);
  }
};

createUploadFolder();

// Multer configuration for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_FOLDER);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase().slice(1);
    if (ALLOWED_EXTENSIONS.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF and DOCX are allowed'));
    }
  }
});

// Helper function to delete file with retry
const deleteFileWithRetry = async (filePath, retries = 3) => {
  for (let i = 0; i < retries; i++) {
    try {
      await new Promise(resolve => setTimeout(resolve, 100 * i)); // Wait before retry
      await fs.unlink(filePath);
      return;
    } catch (error) {
      if (i === retries - 1) {
        console.warn(`Warning: Could not delete temporary file ${filePath}`);
      }
    }
  }
};

// Routes

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    message: 'CVlyze API is running'
  });
});

// Main analysis endpoint
app.post('/api/analyze', upload.single('resume'), async (req, res) => {
  let filePath = null;

  try {
    // Check if file is present
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No resume file provided'
      });
    }

    filePath = req.file.path;
    const fileType = path.extname(req.file.originalname).toLowerCase().slice(1);
    const jobDescription = req.body.jobDescription || null;

    console.log(`Parsing resume: ${req.file.originalname}`);

    // Step 1: Parse resume
    const parsedData = await resumeParser.parseResume(filePath, fileType);
    
    // DEBUG: Log parsed data
    console.log('\n=== PARSED RESUME DATA ===');
    console.log('Name:', parsedData.name);
    console.log('Email:', parsedData.contact?.email);
    console.log('Skills List Length:', parsedData.skills_list?.length);
    console.log('Skills List:', parsedData.skills_list);
    console.log('Has Skills Section:', !!parsedData.sections?.skills);
    console.log('Has Projects Section:', !!parsedData.sections?.projects);
    console.log('Has Experience Section:', !!parsedData.sections?.experience);
    if (parsedData.structured) {
      console.log('Structured Skills List:', parsedData.structured.skills_list);
    }
    console.log('=========================\n');

    // Step 2: Analyze with AI (if API key is available)
    let analysisResult;
    const geminiApiKey = process.env.GEMINI_API_KEY;

    if (geminiApiKey && geminiApiKey.trim()) {
      console.log('Analyzing with Gemini AI...');
      analysisResult = await aiAnalyzer.analyzeResume(parsedData, jobDescription, geminiApiKey);
    } else {
      console.log('No Gemini API key found, using rule-based analysis...');
      // Fallback to rule-based analysis
      const atsScore = aiAnalyzer.calculateAtsScore(parsedData);
      analysisResult = {
        ats_score: atsScore,
        match_score: null,
        summary: 'Basic analysis completed. Add Gemini API key for detailed AI analysis.',
        recommendations: [
          'Add Gemini API key for comprehensive analysis',
          'Ensure all contact information is present',
          'Add more skills to your resume',
          'Include quantifiable achievements'
        ],
        parsed_data: {
          name: parsedData.name,
          contact: parsedData.contact,
          skills_list: parsedData.skills_list || []
        }
      };
    }

    // Clean up uploaded file
    await deleteFileWithRetry(filePath);

    // Return analysis result
    res.json({
      success: true,
      data: analysisResult
    });

  } catch (error) {
    console.error('Analysis error:', error);

    // Clean up file if error occurs
    if (filePath) {
      await deleteFileWithRetry(filePath);
    }

    res.status(500).json({
      success: false,
      error: error.message || 'Analysis failed'
    });
  }
});

// Check configuration endpoint
app.get('/api/config/check', (req, res) => {
  const geminiApiKey = process.env.GEMINI_API_KEY;
  const hasApiKey = !!(geminiApiKey && geminiApiKey.trim());

  res.json({
    configured: hasApiKey,
    message: hasApiKey ? 'Gemini API key is configured' : 'Gemini API key is missing'
  });
});

// Get detailed role information endpoint
app.post('/api/role-details', async (req, res) => {
  try {
    const { roleName, userSkills, matchedSkills, missingSkills } = req.body;

    if (!roleName) {
      return res.status(400).json({
        success: false,
        error: 'Role name is required'
      });
    }

    console.log(`📊 Generating role details for: ${roleName}`);

    const roleDetails = await aiAnalyzer.generateRoleDetails(
      roleName,
      userSkills || [],
      matchedSkills || [],
      missingSkills || []
    );

    res.json(roleDetails);

  } catch (error) {
    console.error('Error fetching role details:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate role details'
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    success: false,
    error: err.message || 'Internal server error'
  });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 CVlyze API server running on http://localhost:${PORT}`);
  console.log(`📁 Upload folder: ${UPLOAD_FOLDER}`);
  console.log(`🔑 Gemini API configured: ${!!(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim())}`);
});

module.exports = app;
