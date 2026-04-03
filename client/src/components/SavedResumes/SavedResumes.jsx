import React, { useState, useEffect } from 'react';
import './SavedResumes.css';

const SavedResumes = ({ onAnalyzeAnother, onViewResume }) => {
  const [savedResumes, setSavedResumes] = useState([]);

  // Load saved resumes from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('savedResumes');
    if (saved) {
      try {
        setSavedResumes(JSON.parse(saved));
      } catch (error) {
        console.error('Error loading saved resumes:', error);
      }
    }
  }, []);

  // Delete a saved resume
  const deleteSavedResume = (id) => {
    const updatedResumes = savedResumes.filter(r => r.id !== id);
    localStorage.setItem('savedResumes', JSON.stringify(updatedResumes));
    setSavedResumes(updatedResumes);
  };

  // View a saved resume analysis
  const handleViewResume = (resume) => {
    onViewResume(resume.fullData);
  };

  return (
    <div className="saved-resumes-page">
      <div className="saved-resumes-container">
        <div className="page-header">
          <h1>📂 Saved Resume Analyses</h1>
          <p className="page-subtitle">View your previously analyzed resumes</p>
        </div>

        {savedResumes.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📄</div>
            <h2>No Saved Resumes Yet</h2>
            <p>Start by analyzing your first resume to see it here</p>
            <button onClick={onAnalyzeAnother} className="analyze-first-btn">
              <span className="btn-icon">📄</span>
              Analyze Your First Resume
              <span className="btn-arrow">→</span>
            </button>
          </div>
        ) : (
          <>
            <div className="saved-resumes-grid">
              {savedResumes.map((resume) => (
                <div key={resume.id} className="saved-resume-card">
                  <div className="saved-resume-screenshot">
                    <img src={resume.screenshot} alt={resume.name} />
                    <div className="saved-resume-overlay">
                      <button 
                        onClick={() => handleViewResume(resume)} 
                        className="view-resume-btn"
                      >
                        👁️ View Details
                      </button>
                      <button 
                        onClick={() => deleteSavedResume(resume.id)} 
                        className="delete-resume-btn"
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  </div>
                  <div className="saved-resume-info">
                    <h3 className="saved-resume-name">{resume.name}</h3>
                    <div className="saved-resume-meta">
                      <span className="saved-resume-date">
                        📅 {new Date(resume.date).toLocaleDateString()}
                      </span>
                      {resume.domain && (
                        <span className="saved-resume-domain">🎯 {resume.domain}</span>
                      )}
                    </div>
                    <div className="saved-resume-scores">
                      <div className="saved-score-badge ats">
                        <span className="score-label">ATS</span>
                        <span className="score-value">{resume.atsScore}%</span>
                      </div>
                      <div className="saved-score-badge match">
                        <span className="score-label">Match</span>
                        <span className="score-value">{resume.matchScore}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Analyze Another Section */}
            <div className="bottom-action-section">
              <div className="analyze-another-container">
                <div className="analyze-another-content">
                  <h3>Ready to analyze another resume?</h3>
                  <p>Upload a new resume to get instant AI-powered insights</p>
                  <button onClick={onAnalyzeAnother} className="analyze-another-btn">
                    <span className="btn-icon">📄</span>
                    Analyze Another Resume
                    <span className="btn-arrow">→</span>
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default SavedResumes;
