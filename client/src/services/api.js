// API service for communicating with backend

const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://resumeanalyser-zsnb.onrender.com/api';

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
   * Poll a job until it completes or fails.
   *
   * @param {string}   jobId
   * @param {function} getToken    - Clerk's getToken() — called fresh on every poll
   *                                 so short-lived tokens never cause 401s mid-poll.
   * @param {function} onProgress  - called with { status, progress } each poll
   * @param {number}   intervalMs  - how often to poll (default 3 s)
   * @param {number}   timeoutMs   - max time to wait (default 3 min)
   */
  static async pollJob(jobId, getToken, onProgress, intervalMs = 3000, timeoutMs = 180000) {
    const deadline = Date.now() + timeoutMs;

    while (Date.now() < deadline) {
      await new Promise(r => setTimeout(r, intervalMs));

      // Fetch a fresh token on every poll — Clerk tokens are short-lived (~60 s)
      // and reusing a stale one causes 401s on the status endpoint.
      let freshToken = null;
      try {
        freshToken = typeof getToken === 'function' ? await getToken() : getToken;
      } catch (tokenErr) {
        console.warn('Could not refresh token, retrying next poll:', tokenErr.message);
        continue; // skip this iteration, try again next tick
      }

      const headers = freshToken ? { Authorization: `Bearer ${freshToken}` } : {};

      let response, data;
      try {
        response = await fetch(`${API_BASE_URL}/jobs/${jobId}`, { headers });
        data = await response.json();
      } catch (fetchErr) {
        console.warn('Poll request failed, retrying:', fetchErr.message);
        continue;
      }

      console.log('Poll result:', data);

      if (onProgress) onProgress({ status: data.status, progress: data.progress ?? 0, stage: data.stage ?? null });

      if (data.status === 'completed') {
        return data.data;          // full analysis result
      }

      if (data.status === 'failed') {
        throw new Error(data.error || 'Analysis job failed on the server');
      }

      // 401 mid-poll — token refresh failed or Clerk session expired
      if (response.status === 401) {
        console.warn('Poll got 401 — token may have expired, retrying with fresh token next tick');
        continue;
      }

      // 'waiting' | 'active' | 'delayed' → keep polling
    }

    throw new Error('Analysis timed out. Please try again.');
  }

  /**
   * Analyze resume — handles both sync (200) and async (202 + polling) responses.
   *
   * @param {File}     resumeFile      - PDF or DOCX file
   * @param {string}   jobDescription  - Optional job description text
   * @param {function} getToken        - Clerk's getToken() function (not a string)
   * @param {function} onProgress      - optional callback({ status, progress })
   * @returns {Promise} Full analysis result data
   */
  static async analyzeResume(resumeFile, jobDescription = '', getToken = null, onProgress = null) {
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

      // Get a fresh token for the initial upload request
      let token = null;
      try {
        token = typeof getToken === 'function' ? await getToken() : getToken;
      } catch (e) {
        console.warn('Could not get auth token for upload:', e.message);
      }
      const headers = token ? { Authorization: `Bearer ${token}` } : undefined;

      const response = await fetch(`${API_BASE_URL}/analyze`, {
        method: 'POST',
        headers,
        body: formData,
      });

      console.log('API: Response status:', response.status);

      const data = await response.json();
      console.log('API: Response data:', data);

      if (!response.ok) {
        // Surface rate-limit errors with a helpful message
        if (response.status === 429) {
          const retryAfter = data.retryAfterSeconds || 60;
          throw new Error(
            data.error || `Too many requests. Please wait ${retryAfter} seconds and try again.`
          );
        }
        throw new Error(data.error || 'Analysis failed');
      }

      if (!data.success) {
        throw new Error(data.error || 'Analysis was not successful');
      }

      // ── Synchronous path (cache hit) ─────────────────────────────────────
      if (data.data) {
        console.log('API: Got synchronous / cached result');
        return { success: true, data: data.data, cached: data.cached ?? false };
      }

      // ── Async path (202 Accepted + jobId) ────────────────────────────────
      // Pass getToken (the function) so the poll loop can refresh the token
      // on every request instead of reusing a single stale token string.
      if (data.jobId) {
        console.log(`API: Job enqueued (id=${data.jobId}), starting poll…`);
        const analysisData = await ApiService.pollJob(data.jobId, getToken, onProgress);
        return { success: true, data: analysisData, cached: false };
      }

      throw new Error('Unexpected response format from server');

    } catch (error) {
      console.error('Resume analysis failed:', error);
      throw error;
    }
  }

  /**
   * Simulate analysis progress (for frontend loading animation)
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
