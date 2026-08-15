import React, { useState, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import './AnalysisLoading.css';
import ApiService from '../../services/api';

const AnalysisLoading = ({ resumeFile, jobDescription, onComplete, onError }) => {
  const { getToken } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [analysisData, setAnalysisData] = useState(null);

  const steps = [
    { id: 1, text: 'Parsing your resume', delay: 1000 },
    { id: 2, text: 'Analyzing your experience', delay: 2500 },
    { id: 3, text: 'Extracting your skills', delay: 4000 },
    { id: 4, text: 'Generating recommendations', delay: 5500 }
  ];

  const categories = [
    { name: 'CONTENT', progress: 0 },
    { name: 'SECTION', progress: 0 },
    { name: 'ATS ESSENTIALS', progress: 0 },
    { name: 'TAILORING', progress: 0 }
  ];

  useEffect(() => {
    // Guard: prevent duplicate calls if the effect somehow re-runs
    let cancelled = false;

    const analyzeResume = async () => {
      try {
        // Pass getToken (the function, not a pre-fetched string) so that
        // api.js can call it fresh on every poll — Clerk tokens expire in ~60 s.
        const handleProgress = ({ progress: serverProgress }) => {
          if (cancelled) return;
          if (typeof serverProgress === 'number' && serverProgress > 0) {
            setProgress(Math.max(serverProgress, 10)); // at least 10 so bar moves
          }
        };

        const result = await ApiService.analyzeResume(
          resumeFile,
          jobDescription,
          getToken,      // ← function reference, not an awaited string
          handleProgress,
        );

        if (cancelled) return; // component unmounted — discard result

        console.log('API Response:', result);

        const analysisPayload = result.data;
        setAnalysisData(analysisPayload);
        setProgress(100);

        // Small delay to show completion animation before navigating
        setTimeout(() => {
          if (!cancelled && onComplete) {
            onComplete(analysisPayload);
          }
        }, 1200);
      } catch (error) {
        if (cancelled) return;
        console.error('Analysis error:', error);
        if (onError) {
          onError(error.message || 'Analysis failed');
        }
      }
    };

    analyzeResume();

    // Animate checkmarks one by one (purely cosmetic — independent of API)
    const stepTimers = steps.map((step, index) =>
      setTimeout(() => {
        if (!cancelled) setCurrentStep(index + 1);
      }, step.delay)
    );

    // Animate progress bar slowly up to 85% max — the real result pushes it to 100
    const progressInterval = setInterval(() => {
      if (cancelled) return clearInterval(progressInterval);
      setProgress(prev => {
        if (prev >= 85) {          // cap at 85% — real completion sets it to 100
          clearInterval(progressInterval);
          return prev;
        }
        return prev + 1;
      });
    }, 400);

    return () => {
      cancelled = true;
      stepTimers.forEach(clearTimeout);
      clearInterval(progressInterval);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // ← intentionally empty: run once per mount (one file upload = one mount)

  return (
    <div className="analysis-loading-page">
      <div className="analysis-loading-container">
        <div className="analysis-loading-left">
          <div className="score-card">
            <h2 className="score-title">Your Score</h2>
            <div className="score-gauge">
              <svg className="gauge-svg" viewBox="0 0 200 120">
                <path
                  className="gauge-background"
                  d="M 20 100 A 80 80 0 0 1 180 100"
                  fill="none"
                  stroke="#e5e7eb"
                  strokeWidth="12"
                  strokeLinecap="round"
                />
                <path
                  className="gauge-progress"
                  d="M 20 100 A 80 80 0 0 1 180 100"
                  fill="none"
                  stroke="#7c3aed"
                  strokeWidth="12"
                  strokeLinecap="round"
                  strokeDasharray="251.2"
                  strokeDashoffset={251.2 - (251.2 * progress) / 100}
                  style={{ transition: 'stroke-dashoffset 0.3s ease' }}
                />
              </svg>
              <div className="score-indicator">
                <div className="score-dot"></div>
              </div>
            </div>
            <div className="score-placeholder">
              <div className="loading-bar"></div>
              <div className="loading-bar short"></div>
            </div>
          </div>

          <div className="categories-list">
            {categories.map((category, index) => (
              <div key={index} className="category-item">
                <span className="category-name">{category.name}</span>
                <div className="category-progress">
                  <div 
                    className="category-bar" 
                    style={{ 
                      width: `${Math.min(progress * 0.8, 80)}%`,
                      opacity: progress > (index * 20) ? 1 : 0.3
                    }}
                  ></div>
                </div>
              </div>
            ))}
          </div>

          <button className="unlock-button" disabled>
            Unlock Full Report
          </button>
        </div>

        <div className="analysis-loading-right">
          <div className="steps-container">
            {steps.map((step, index) => (
              <div 
                key={step.id} 
                className={`step-item ${currentStep > index ? 'completed' : currentStep === index + 1 ? 'active' : ''}`}
              >
                <div className="step-icon">
                  {currentStep > index ? (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                      <path 
                        d="M5 13l4 4L19 7" 
                        stroke="white" 
                        strokeWidth="2" 
                        strokeLinecap="round" 
                        strokeLinejoin="round"
                      />
                    </svg>
                  ) : (
                    <div className="step-loading">
                      <div className="spinner"></div>
                    </div>
                  )}
                </div>
                <span className="step-text">{step.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalysisLoading;
