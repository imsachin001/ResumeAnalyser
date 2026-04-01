import React, { useEffect, useState } from 'react';
import './SavedAnalyses.css';

const SavedAnalyses = ({ onBackToHome, onViewAnalysis }) => {
  const [savedAnalyses, setSavedAnalyses] = useState([]);
  const [expandedSavedId, setExpandedSavedId] = useState(null);

  const savedStorageKey = 'cvlyze_saved_analyses';

  useEffect(() => {
    try {
      const raw = localStorage.getItem(savedStorageKey);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        setSavedAnalyses(parsed);
      }
    } catch (error) {
      console.warn('Failed to load saved analyses:', error);
    }
  }, []);

  const formatSavedDate = (value) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'Unknown date';
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="saved-page">
      <div className="saved-container">
        <div className="saved-header">
          <div>
            <h1>💾 Saved Analyses</h1>
            <p>Quickly revisit previously analyzed resumes.</p>
          </div>
          <button className="saved-back-btn" onClick={onBackToHome}>
            ← Back to Home
          </button>
        </div>

        {savedAnalyses.length === 0 ? (
          <div className="saved-empty">
            <p>No analyzed resumes are saved yet.</p>
            <p>Save one from the Analysis page to see it here.</p>
          </div>
        ) : (
          <div className="saved-analyses-grid">
            {savedAnalyses.map((entry) => (
              <div key={entry.id} className="saved-card">
                <div className="saved-card-header">
                  <div>
                    <h3>{entry.name}</h3>
                    <span className="saved-date">Saved {formatSavedDate(entry.savedAt)}</span>
                  </div>
                  <div className="saved-scores">
                    <span>ATS {entry.atsScore}%</span>
                    <span>Match {entry.matchScore}%</span>
                  </div>
                </div>

                {entry.domain && (
                  <div className="saved-domain">🎯 {entry.domain}</div>
                )}

                {entry.topSkills && entry.topSkills.length > 0 && (
                  <div className="saved-skill-row">
                    {entry.topSkills.slice(0, 5).map((skill, i) => (
                      <span key={`${entry.id}-skill-${i}`} className="saved-skill-pill">
                        {skill}
                      </span>
                    ))}
                  </div>
                )}

                <div className="saved-actions">
                  <button
                    className="saved-view-btn"
                    onClick={() => onViewAnalysis(entry.analysis)}
                  >
                    View full analysis
                  </button>
                  <button
                    className="saved-toggle-btn"
                    onClick={() => setExpandedSavedId(expandedSavedId === entry.id ? null : entry.id)}
                  >
                    {expandedSavedId === entry.id ? 'Hide details' : 'Quick details'}
                  </button>
                </div>

                {expandedSavedId === entry.id && (
                  <div className="saved-details">
                    {entry.missingSkills && entry.missingSkills.length > 0 && (
                      <div className="saved-detail-block">
                        <h4>Missing Skills</h4>
                        <div className="saved-pill-row">
                          {entry.missingSkills.slice(0, 6).map((skill, i) => (
                            <span key={`${entry.id}-miss-${i}`} className="saved-pill missing">
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {entry.recommendations && entry.recommendations.length > 0 && (
                      <div className="saved-detail-block">
                        <h4>Top Recommendations</h4>
                        <ul>
                          {entry.recommendations.slice(0, 4).map((rec, i) => (
                            <li key={`${entry.id}-rec-${i}`}>{rec}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SavedAnalyses;
