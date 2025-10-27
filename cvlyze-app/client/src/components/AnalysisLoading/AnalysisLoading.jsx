import React, { useState, useEffect } from 'react';
import './AnalysisLoading.css';
import ApiService from '../../services/api';

const AnalysisLoading = ({ resumeFile, jobDescription, onComplete, onError }) => {
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
    // Start API call immediately
    const analyzeResume = async () => {
      try {
        const result = await ApiService.analyzeResume(resumeFile, jobDescription);
        console.log('API Response:', result);
        setAnalysisData(result.data);
        
        // Redirect immediately after getting data
        setTimeout(() => {
          if (onComplete) {
            onComplete(result.data);
          }
        }, 2000); // Small delay to show completion animation
      } catch (error) {
        console.error('Analysis error:', error);
        if (onError) {
          onError(error.message || 'Analysis failed');
        }
      }
    };

    analyzeResume();

    // Animate checkmarks one by one
    steps.forEach((step, index) => {
      setTimeout(() => {
        setCurrentStep(index + 1);
      }, step.delay);
    });

    // Animate progress bars
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return prev + 2;
      });
    }, 100);

    return () => {
      clearInterval(progressInterval);
    };
  }, [resumeFile, jobDescription]);

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
