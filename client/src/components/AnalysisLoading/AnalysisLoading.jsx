import React, { useState, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import './AnalysisLoading.css';
import ApiService from '../../services/api';

// Map server stage keys → which step index becomes "completed"
// Steps are 0-indexed; completing step N marks steps 0..N as done.
const STAGE_TO_STEP = {
  connecting: 0,   // queued / DB init     → step 0 complete
  parsing:    1,   // parsing resume       → step 1 complete
  analyzing:  2,   // Gemini running       → step 2 complete
  saving:     3,   // saving to MongoDB    → step 3 complete
  caching:    3,   // caching              → step 3 complete
  completed:  4,   // all done             → all steps complete
};

const AnalysisLoading = ({ resumeFile, jobDescription, onComplete, onError }) => {
  const { getToken } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress]       = useState(0);

  const steps = [
    { id: 1, text: 'Queuing your resume'       },
    { id: 2, text: 'Parsing resume'            },
    { id: 3, text: 'Analyzing with AI'         },
    { id: 4, text: 'Saving result'             },
  ];

  const categories = [
    { name: 'CONTENT'       },
    { name: 'SECTION'       },
    { name: 'ATS ESSENTIALS'},
    { name: 'TAILORING'     },
  ];

  useEffect(() => {
    let cancelled = false;

    const analyzeResume = async () => {
      try {
        const handleProgress = ({ progress: serverPct, stage }) => {
          if (cancelled) return;

          // Drive the progress bar from the real server percentage
          if (typeof serverPct === 'number' && serverPct > 0) {
            setProgress(prev => Math.max(prev, serverPct));
          }

          // Advance the step checklist based on the stage key
          if (stage && STAGE_TO_STEP[stage] !== undefined) {
            setCurrentStep(prev => Math.max(prev, STAGE_TO_STEP[stage]));
          }
        };

        const result = await ApiService.analyzeResume(
          resumeFile,
          jobDescription,
          getToken,
          handleProgress,
        );

        if (cancelled) return;

        console.log('API Response:', result);

        setCurrentStep(steps.length);   // all steps done
        setProgress(100);

        setTimeout(() => {
          if (!cancelled && onComplete) onComplete(result.data);
        }, 1200);

      } catch (error) {
        if (cancelled) return;
        console.error('Analysis error:', error);
        if (onError) onError(error.message || 'Analysis failed');
      }
    };

    analyzeResume();

    // Slow-fill the bar during the long 'analyzing' step so it never looks stuck.
    // The real server pct will always win via Math.max above once a poll arrives.
    const progressInterval = setInterval(() => {
      if (cancelled) return clearInterval(progressInterval);
      setProgress(prev => {
        if (prev >= 80) { clearInterval(progressInterval); return prev; }
        return prev + 0.5;
      });
    }, 600);

    return () => {
      cancelled = true;
      clearInterval(progressInterval);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
