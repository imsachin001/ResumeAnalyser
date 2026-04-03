// API service for communicating with backend

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

class ApiService {
  /**
   * Check backend health
   */
  static async checkHealth() {
    try {
      const response = await fetch(`${API_BASE_URL}/health`);
      return await response.json();
    } catch (error) {
      console.error('Health check failed:', error);
      throw error;
    }
  }

  /**
   * Check if backend is properly configured
   */
  static async checkConfig() {
    try {
      const response = await fetch(`${API_BASE_URL}/config/check`);
      return await response.json();
    } catch (error) {
      console.error('Config check failed:', error);
      throw error;
    }
  }

  /**
   * Analyze resume
   * @param {File} resumeFile - PDF or DOCX file
   * @param {string} jobDescription - Optional job description text
   * @returns {Promise} Analysis result
   */
  static async analyzeResume(resumeFile, jobDescription = '', authToken = null) {
    try {
      console.log('API: Starting analysis...', {
        fileName: resumeFile.name,
        fileSize: resumeFile.size,
        hasJobDescription: !!jobDescription
      });

      const formData = new FormData();
      formData.append('resume', resumeFile);
      
      if (jobDescription && jobDescription.trim()) {
        formData.append('jobDescription', jobDescription.trim());
      }

      console.log('API: Sending request to:', `${API_BASE_URL}/analyze`);
      
      const headers = authToken ? { Authorization: `Bearer ${authToken}` } : undefined;

      const response = await fetch(`${API_BASE_URL}/analyze`, {
        method: 'POST',
        headers,
        body: formData,
      });

      console.log('API: Response status:', response.status);
      
      const data = await response.json();
      
      console.log('API: Response data:', data);

      if (!response.ok) {
        throw new Error(data.error || 'Analysis failed');
      }

      if (!data.success) {
        throw new Error(data.error || 'Analysis was not successful');
      }

      console.log('API: Analysis successful!', data);
      return data;
    } catch (error) {
      console.error('Resume analysis failed:', error);
      throw error;
    }
  }

  /**
   * Simulate analysis progress (for frontend loading animation)
   * This doesn't actually call backend, just updates progress
   */
  static simulateProgress(onProgress) {
    const steps = [
      { text: 'Parsing your resume', progress: 25, delay: 1000 },
      { text: 'Analyzing your experience', progress: 50, delay: 2500 },
      { text: 'Extracting your skills', progress: 75, delay: 4000 },
      { text: 'Generating recommendations', progress: 100, delay: 5500 }
    ];

    steps.forEach((step) => {
      setTimeout(() => {
        onProgress(step);
      }, step.delay);
    });
  }
}

export default ApiService;
