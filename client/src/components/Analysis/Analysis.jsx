import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth, useUser } from '@clerk/clerk-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import './Analysis.css';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://resumeanalyser-zsnb.onrender.com/api';

// Role Card Component with AI-generated details
const RoleCard = ({ role, index, matchPercentage, isExpanded, onToggle, getRoleDetails, getScoreColor, getScoreGradient, loadingRoleDetails, roleDetailsCache }) => {
  const [roleDetails, setRoleDetails] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isExpanded && !roleDetailsCache[role]) {
      setLoading(true);
      getRoleDetails(role, matchPercentage).then(details => {
        setRoleDetails(details);
        setLoading(false);
      });
    } else if (roleDetailsCache[role]) {
      setRoleDetails(roleDetailsCache[role]);
    }
  }, [isExpanded, role, matchPercentage]);

  return (
    <div className="role-card-wrapper">
      <div 
        className={`role-card ${isExpanded ? 'expanded' : ''}`}
        onClick={onToggle}
      >
        <div className="role-name">{role}</div>
        <div className="role-match">
          <div className="role-match-bar">
            <div 
              className="role-match-fill" 
              style={{ 
                width: `${matchPercentage}%`,
                background: getScoreGradient(matchPercentage)
              }}
            />
          </div>
          <span className="role-match-text">{matchPercentage}% match</span>
        </div>
        <div className="role-expand-hint">
          {isExpanded ? '▲ Click to collapse' : '▼ Click for AI-powered details'}
        </div>
      </div>
      
      {/* Expandable Details Section */}
      {isExpanded && (
        <div className="role-details">
          <div className="role-details-content">
            {loading ? (
              <div className="role-loading">
                <div className="loading-spinner"></div>
                <p>🤖 AI is analyzing this role for you...</p>
              </div>
            ) : roleDetails ? (
              <>
                {/* Role Description */}
                <div className="role-description">
                  <h4>📋 Role Overview</h4>
                  <p>{roleDetails.roleDescription}</p>
                  <p><strong>Experience Level:</strong> {roleDetails.experienceLevel}</p>
                  <p><strong>Industry Demand:</strong> <span style={{color: roleDetails.industryDemand === 'High' ? '#22c55e' : roleDetails.industryDemand === 'Medium' ? '#eab308' : '#ef4444'}}>{roleDetails.industryDemand}</span></p>
                  <p><strong>Salary Range:</strong> {roleDetails.salaryRange}</p>
                  <p><strong>Your Match Score:</strong> <strong style={{color: getScoreColor(matchPercentage)}}>{matchPercentage}%</strong></p>
                </div>

                {/* Matched Skills */}
                <div className="role-skills-section">
                  <h4>✅ Your Matched Skills ({roleDetails.matchedRoleSkills?.length || 0}/{roleDetails.requiredSkills?.length || 0})</h4>
                  <div className="role-skill-tags">
                    {roleDetails.matchedRoleSkills && roleDetails.matchedRoleSkills.length > 0 ? (
                      roleDetails.matchedRoleSkills.map((skill, i) => (
                        <span key={i} className="role-skill-tag matched">
                          ✓ {skill}
                        </span>
                      ))
                    ) : (
                      <p className="no-skills">No matched skills yet - great opportunity to learn!</p>
                    )}
                  </div>
                </div>

                {/* Missing Skills */}
                {roleDetails.missingRoleSkills && roleDetails.missingRoleSkills.length > 0 && (
                  <div className="role-skills-section">
                    <h4>📚 Skills to Learn ({roleDetails.missingRoleSkills.length})</h4>
                    <div className="role-skill-tags">
                      {roleDetails.missingRoleSkills.map((skill, i) => (
                        <span key={i} className="role-skill-tag missing">
                          + {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Nice to Have Skills */}
                {roleDetails.niceToHaveSkills && roleDetails.niceToHaveSkills.length > 0 && (
                  <div className="role-skills-section">
                    <h4>⭐ Nice-to-Have Skills</h4>
                    <div className="role-skill-tags">
                      {roleDetails.niceToHaveSkills.map((skill, i) => (
                        <span key={i} className="role-skill-tag nice-to-have">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Company Expectations */}
                {roleDetails.companyExpectations && roleDetails.companyExpectations.length > 0 && (
                  <div className="role-expectations-section">
                    <h4>🏢 What Companies Expect</h4>
                    <ul className="role-expectations-list">
                      {roleDetails.companyExpectations.map((expectation, i) => (
                        <li key={i}>{expectation}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Career Advice */}
                {roleDetails.careerAdvice && roleDetails.careerAdvice.length > 0 && (
                  <div className="role-tips-section">
                    <h4>💡 Personalized Career Advice</h4>
                    <ul className="role-tips-list">
                      {roleDetails.careerAdvice.map((tip, i) => (
                        <li key={i}>{tip}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Learning Path */}
                {roleDetails.learningPath && roleDetails.learningPath.length > 0 && (
                  <div className="role-learning-path">
                    <h4>🎓 Recommended Learning Path</h4>
                    <ol className="learning-path-list">
                      {roleDetails.learningPath.map((step, i) => (
                        <li key={i}>{step}</li>
                      ))}
                    </ol>
                  </div>
                )}
              </>
            ) : (
              <p>Error loading role details. Please try again.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const Analysis = ({ data, onBackToHome }) => {
  const { getToken } = useAuth();
  const { user } = useUser();
  const [selectedSkillCategory, setSelectedSkillCategory] = useState('all');
  const [animatedScores, setAnimatedScores] = useState({ ats: 0, match: 0 });
  const [isExporting, setIsExporting] = useState(false);
  const [shareableLink, setShareableLink] = useState('');
  const [expandedRole, setExpandedRole] = useState(null);
  const [roleDetailsCache, setRoleDetailsCache] = useState({});
  const [loadingRoleDetails, setLoadingRoleDetails] = useState({});
  const [saveMessage, setSaveMessage] = useState('');
  const reportRef = useRef(null);

  const savedStorageKey = `cvlyze_saved_analyses_${user?.id || 'anonymous'}`;

  // Extract data with defaults
  const {
    match_score = 0,
    ats_score = 0,
    ats_breakdown = {},
    ats_improvements = [],
    matched_skills = [],
    missing_skills = [],
    summary = '',
    recommendations = [],
    strengths = [],
    weaknesses = [],
    suggested_roles = [],
    experience_level = '',
    parsed_data = {},
    detected_domain = '',
    experience_summary = '',
    section_completeness = {},
    top_skills = []
  } = data || {};


  // Animate scores on mount
  useEffect(() => {
    const duration = 2000; // 2 seconds
    const steps = 60;
    const stepDuration = duration / steps;
    let currentStep = 0;

    const interval = setInterval(() => {
      currentStep++;
      const progress = currentStep / steps;
      
      setAnimatedScores({
        ats: Math.floor((ats_score || 0) * progress),
        match: Math.floor((match_score || 0) * progress)
      });

      if (currentStep >= steps) {
        clearInterval(interval);
        setAnimatedScores({ ats: ats_score || 0, match: match_score || 0 });
      }
    }, stepDuration);

    return () => clearInterval(interval);
  }, [ats_score, match_score]);

  // Get score color based on value
  const getScoreColor = (score) => {
    if (score >= 75) return '#22c55e'; // green
    if (score >= 50) return '#eab308'; // yellow
    return '#ef4444'; // red
  };

  // Get score gradient
  const getScoreGradient = (score) => {
    if (score >= 75) return 'linear-gradient(135deg, #22c55e, #16a34a)';
    if (score >= 50) return 'linear-gradient(135deg, #eab308, #ca8a04)';
    return 'linear-gradient(135deg, #ef4444, #dc2626)';
  };

  const handleSaveAnalysis = () => {
    if (!data) return;

    const now = new Date();
    const resumeName = parsed_data.resume_title || parsed_data.name || 'Untitled Resume';
    const fingerprint = JSON.stringify({
      name: resumeName,
      atsScore: ats_score,
      matchScore: match_score,
      domain: detected_domain,
      topSkills: top_skills || [],
      missingSkills: missing_skills || []
    });

    if (!user?.id) {
      setSaveMessage('Sign in to save this analysis.');
      return;
    }

    const entry = {
      id: `${now.getTime()}-${Math.round(Math.random() * 10000)}`,
      fingerprint,
      name: resumeName,
      userId: user.id,
      savedAt: now.toISOString(),
      summary: summary || '',
      atsScore: ats_score,
      matchScore: match_score,
      domain: detected_domain,
      topSkills: top_skills || [],
      missingSkills: missing_skills || [],
      recommendations: recommendations || [],
      strengths: strengths || [],
      weaknesses: weaknesses || [],
      analysis: data
    };

    try {
      const existing = localStorage.getItem(savedStorageKey);
      const parsed = existing ? JSON.parse(existing) : [];
      const list = Array.isArray(parsed) ? parsed : [];

      if (list.some(item => item.fingerprint === fingerprint)) {
        setSaveMessage('This analysis is already saved.');
        return;
      }

      const updated = [entry, ...list];
      localStorage.setItem(savedStorageKey, JSON.stringify(updated));
      setSaveMessage('Analysis saved successfully.');
    } catch (error) {
      console.warn('Failed to save analysis:', error);
      setSaveMessage('Failed to save analysis.');
    }
  };

  const getPriorityLabel = (priority) => {
    if (priority === 'high') return 'High Priority';
    if (priority === 'medium') return 'Medium Priority';
    if (priority === 'low') return 'Low Priority';
    return 'Priority';
  };

  // Categorize skills
  const categorizeSkills = (skills) => {
    const categories = {
      frontend: ['React', 'Angular', 'Vue', 'Vue.js', 'Next.js', 'HTML', 'CSS', 'Tailwind', 'Bootstrap', 'Redux', 'TypeScript', 'JavaScript'],
      backend: ['Node.js', 'Express', 'Django', 'Flask', 'FastAPI', 'Spring Boot', 'ASP.NET', 'Laravel', 'Rails', 'PHP', 'Ruby'],
      databases: ['MongoDB', 'MySQL', 'PostgreSQL', 'SQL', 'Redis', 'Firebase', 'DynamoDB', 'Oracle'],
      cloud: ['AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes', 'CI/CD', 'Jenkins', 'Terraform'],
      ai_ml: ['Machine Learning', 'TensorFlow', 'PyTorch', 'LangChain', 'Huggingface', 'NLP', 'Computer Vision'],
      tools: ['Git', 'GitHub', 'Jira', 'Postman', 'VS Code', 'Linux', 'Agile', 'Scrum'],
      other: []
    };

    const categorized = {
      frontend: [],
      backend: [],
      databases: [],
      cloud: [],
      ai_ml: [],
      tools: [],
      other: []
    };

    skills.forEach(skill => {
      let found = false;
      for (const [category, keywords] of Object.entries(categories)) {
        if (keywords.some(keyword => skill.toLowerCase().includes(keyword.toLowerCase()) || keyword.toLowerCase().includes(skill.toLowerCase()))) {
          categorized[category].push(skill);
          found = true;
          break;
        }
      }
      if (!found) {
        categorized.other.push(skill);
      }
    });

    return categorized;
  };

  const categorizedMatchedSkills = categorizeSkills(matched_skills);
  const categorizedMissingSkills = categorizeSkills(missing_skills);

  // Get priority level for recommendations
  const getRecommendationPriority = (rec) => {
    const highPriorityKeywords = ['add', 'include', 'missing', 'critical', 'important', 'must'];
    const mediumPriorityKeywords = ['improve', 'enhance', 'consider', 'update'];
    
    const recLower = rec.toLowerCase();
    if (highPriorityKeywords.some(keyword => recLower.includes(keyword))) {
      return { level: 'high', icon: '🔴', label: 'High Priority' };
    }
    if (mediumPriorityKeywords.some(keyword => recLower.includes(keyword))) {
      return { level: 'medium', icon: '🟡', label: 'Medium Priority' };
    }
    return { level: 'low', icon: '🟢', label: 'Optional' };
  };

  // Get icon for recommendation type
  const getRecommendationIcon = (rec) => {
    const recLower = rec.toLowerCase();
    if (recLower.includes('learn') || recLower.includes('skill') || recLower.includes('course')) return '🧠';
    if (recLower.includes('portfolio') || recLower.includes('project') || recLower.includes('github')) return '💼';
    if (recLower.includes('resume') || recLower.includes('format') || recLower.includes('section')) return '🧾';
    if (recLower.includes('certif')) return '📜';
    if (recLower.includes('experience') || recLower.includes('work')) return '💼';
    return '💡';
  };

  // Highlight skills in summary
  const highlightSkillsInSummary = (text) => {
    if (!text) return '';
    let highlightedText = text;
    
    // Combine all skills
    const allSkills = [...matched_skills, ...top_skills];
    
    // Sort by length (longest first) to avoid partial matches
    const sortedSkills = [...new Set(allSkills)].sort((a, b) => b.length - a.length);
    
    sortedSkills.forEach(skill => {
      const regex = new RegExp(`\\b${skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
      highlightedText = highlightedText.replace(regex, `<span class="highlighted-skill">$&</span>`);
    });
    
    return highlightedText;
  };

  // Fetch AI-generated role details from backend
  const fetchRoleDetails = useCallback(async (role, matchPercentage) => {
    // Check cache first
    if (roleDetailsCache[role]) {
      return roleDetailsCache[role];
    }

    // Set loading state
    setLoadingRoleDetails(prev => ({ ...prev, [role]: true }));

    try {
      // Calculate matched and missing skills for this role
      const userSkills = [...matched_skills, ...top_skills];
      
      const token = await getToken();
      const response = await fetch(`${API_BASE_URL}/role-details`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          roleName: role,
          userSkills: userSkills,
          matchedSkills: matched_skills,
          missingSkills: missing_skills
        })
      });

      const result = await response.json();
      
      if (result.success && result.data) {
        const roleDetails = {
          ...result.data,
          matchPercentage,
          // Calculate matched/missing from AI response
          matchedRoleSkills: result.data.requiredSkills.filter(skill => 
            userSkills.some(us => us.toLowerCase() === skill.toLowerCase())
          ),
          missingRoleSkills: result.data.requiredSkills.filter(skill => 
            !userSkills.some(us => us.toLowerCase() === skill.toLowerCase())
          )
        };

        // Cache the result
        setRoleDetailsCache(prev => ({ ...prev, [role]: roleDetails }));
        setLoadingRoleDetails(prev => ({ ...prev, [role]: false }));
        
        return roleDetails;
      } else {
        throw new Error('Failed to fetch role details');
      }
    } catch (error) {
      console.error('Error fetching role details:', error);
      setLoadingRoleDetails(prev => ({ ...prev, [role]: false }));
      
      // Return fallback data
      return {
        roleDescription: `${role} is a technical position that requires strong skills and dedication. This analysis will help you understand what's needed.`,
        requiredSkills: missing_skills.length > 0 ? missing_skills.slice(0, 5) : ['Technical Skills', 'Problem Solving'],
        niceToHaveSkills: ['Communication', 'Teamwork', 'Leadership'],
        companyExpectations: [
          'Deliver high-quality work consistently',
          'Collaborate effectively with team members',
          'Meet deadlines and project milestones',
          'Continuously learn and improve skills',
          'Communicate clearly and professionally'
        ],
        careerAdvice: [
          'Build practical projects to showcase your skills',
          'Network with professionals in the industry',
          'Stay updated with latest trends and technologies',
          'Practice coding and problem-solving regularly',
          'Create a strong online presence (LinkedIn, GitHub)'
        ],
        learningPath: [
          'Master fundamental concepts in your field',
          'Build a portfolio of diverse projects',
          'Gain hands-on experience through internships or freelancing',
          'Continuously upskill with relevant certifications'
        ],
        salaryRange: 'Varies by location and experience',
        experienceLevel: 'Entry to Mid-level',
        industryDemand: 'Moderate',
        matchPercentage,
        matchedRoleSkills: matched_skills.slice(0, 3),
        missingRoleSkills: missing_skills.slice(0, 5)
      };
    }
  }, [matched_skills, missing_skills, top_skills, roleDetailsCache, getToken]);

  // Get detailed information for a role (removed hardcoded version)
  const getRoleDetails = useCallback(async (role, matchPercentage) => {
    return await fetchRoleDetails(role, matchPercentage);
  }, [fetchRoleDetails]);

  // Export to PDF function
  const handleExportPDF = async () => {
    setIsExporting(true);
    try {
      const element = reportRef.current;
      
      // Capture the element as canvas with high quality
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        windowWidth: element.scrollWidth,
        windowHeight: element.scrollHeight
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      const imgX = (pdfWidth - imgWidth * ratio) / 2;
      const imgY = 0;

      // Add image to PDF
      pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);

      // If content is longer than one page, add more pages
      let heightLeft = imgHeight * ratio - pdfHeight;
      let position = -pdfHeight;

      while (heightLeft > 0) {
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', imgX, position, imgWidth * ratio, imgHeight * ratio);
        heightLeft -= pdfHeight;
        position -= pdfHeight;
      }

      // Download PDF
      const candidateName = parsed_data.name || 'Candidate';
      const fileName = `${candidateName.replace(/\s+/g, '_')}_Resume_Analysis_${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);

      alert('✅ PDF downloaded successfully!');
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('❌ Failed to generate PDF. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  // Generate shareable link
  const handleGenerateLink = () => {
    try {
      // Encode the analysis data
      const encodedData = btoa(JSON.stringify(data));
      
      // Create shareable URL (in production, you'd send this to a backend)
      const shareableUrl = `${window.location.origin}/share/${encodedData}`;
      
      // Copy to clipboard
      navigator.clipboard.writeText(shareableUrl).then(() => {
        setShareableLink(shareableUrl);
        alert('🔗 Shareable link copied to clipboard!\n\nNote: In production, this would be a shortened URL stored on a server.');
      }).catch(err => {
        console.error('Failed to copy link:', err);
        setShareableLink(shareableUrl);
        alert('Link generated! Please copy manually:\n' + shareableUrl);
      });
    } catch (error) {
      console.error('Error generating link:', error);
      alert('❌ Failed to generate shareable link.');
    }
  };

  // Early return if no data - must be after all hooks
  if (!data) {
    return (
      <div className="analysis-page">
        <div className="analysis-container">
          <h1>No Analysis Data</h1>
          <p>Please upload a resume to analyze.</p>
          <button onClick={onBackToHome} className="back-button">
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="analysis-page">
      <div className="analysis-container" ref={reportRef}>
        <div className="analysis-header">
          <h1>📊 Resume Analysis Results</h1>
          {parsed_data.name && <p className="candidate-name">{parsed_data.name}</p>}
          {detected_domain && <p className="domain-badge">🎯 {detected_domain}</p>}
          {experience_summary && <p className="experience-badge">💼 {experience_summary}</p>}
          
          {/* Action Buttons */}
          <div className="action-buttons">
            <button onClick={onBackToHome} className="action-btn back-btn">
              ← Back to Home
            </button>
            <button 
              onClick={handleExportPDF} 
              className="action-btn export-btn"
              disabled={isExporting}
            >
              {isExporting ? '⏳ Generating...' : '📄 Download PDF'}
            </button>
            <button 
              onClick={handleGenerateLink} 
              className="action-btn share-btn"
            >
              🔗 Share via Link
            </button>
          </div>
        </div>

        {/* Interactive Score Visualization with Circular Progress */}
        <div className="scores-section">
          {ats_score !== undefined && (
            <div className="score-card">
              <div className="score-circle-container">
                <svg className="score-circle" viewBox="0 0 200 200">
                  <circle
                    className="score-circle-bg"
                    cx="100"
                    cy="100"
                    r="85"
                    fill="none"
                    stroke="#e5e7eb"
                    strokeWidth="15"
                  />
                  <circle
                    className="score-circle-progress"
                    cx="100"
                    cy="100"
                    r="85"
                    fill="none"
                    stroke={getScoreColor(ats_score)}
                    strokeWidth="15"
                    strokeDasharray={`${(animatedScores.ats / 100) * 534} 534`}
                    strokeLinecap="round"
                    transform="rotate(-90 100 100)"
                  />
                  <text x="100" y="95" textAnchor="middle" className="score-text-large">
                    {animatedScores.ats}%
                  </text>
                  <text x="100" y="115" textAnchor="middle" className="score-text-small">
                    ATS Score
                  </text>
                </svg>
              </div>
              <div className="score-tooltip">
                <p>Based on keyword density, formatting, and structure</p>
                {ats_breakdown && Object.keys(ats_breakdown).length > 0 && (
                  <div className="ats-breakdown">
                    <h4>Breakdown:</h4>
                    <ul>
                      {ats_breakdown.contact && <li>Contact: {ats_breakdown.contact}/15</li>}
                      {ats_breakdown.sections && <li>Sections: {ats_breakdown.sections}/20</li>}
                      {ats_breakdown.keywords && <li>Keywords: {ats_breakdown.keywords}/40</li>}
                      {ats_breakdown.actionVerbs && <li>Action Verbs: {ats_breakdown.actionVerbs}/10</li>}
                      {ats_breakdown.formatting && <li>Formatting: {ats_breakdown.formatting}/10</li>}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}
          {match_score !== undefined && (
            <div className="score-card">
              <div className="score-circle-container">
                <svg className="score-circle" viewBox="0 0 200 200">
                  <circle
                    className="score-circle-bg"
                    cx="100"
                    cy="100"
                    r="85"
                    fill="none"
                    stroke="#e5e7eb"
                    strokeWidth="15"
                  />
                  <circle
                    className="score-circle-progress"
                    cx="100"
                    cy="100"
                    r="85"
                    fill="none"
                    stroke={getScoreColor(match_score)}
                    strokeWidth="15"
                    strokeDasharray={`${(animatedScores.match / 100) * 534} 534`}
                    strokeLinecap="round"
                    transform="rotate(-90 100 100)"
                  />
                  <text x="100" y="95" textAnchor="middle" className="score-text-large">
                    {animatedScores.match}%
                  </text>
                  <text x="100" y="115" textAnchor="middle" className="score-text-small">
                    Job Match
                  </text>
                </svg>
              </div>
              <div className="score-tooltip">
                <p>Based on skill match and experience alignment</p>
                {section_completeness && (
                  <p className="completeness">Section Completeness: {section_completeness}%</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ATS Improvement Cards */}
        {ats_improvements && ats_improvements.length > 0 && (
          <div className="ats-improvements-section">
            <h2>🧭 ATS Improvement Breakdown</h2>
            <p className="ats-improvements-subtitle">
              Focus on the lowest scoring areas first. These tips are tailored by Gemini AI.
            </p>
            <div className="ats-improvements-grid">
              {ats_improvements.map((card, index) => (
                <div
                  key={`${card.area || 'ats-area'}-${index}`}
                  className={`ats-improvement-card ${card.priority || 'medium'}`}
                >
                  <div className="ats-improvement-header">
                    <div>
                      <h3>{card.area}</h3>
                      <span className="ats-score-pill">
                        {card.score}/{card.maxScore}
                      </span>
                    </div>
                    <span className={`priority-pill ${card.priority || 'medium'}`}>
                      {getPriorityLabel(card.priority)}
                    </span>
                  </div>

                  {card.whatToAdd && card.whatToAdd.length > 0 && (
                    <div className="ats-improvement-block">
                      <h4>✅ What to add</h4>
                      <ul>
                        {card.whatToAdd.map((item, i) => (
                          <li key={`add-${index}-${i}`}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {card.whatToAvoid && card.whatToAvoid.length > 0 && (
                    <div className="ats-improvement-block">
                      <h4>⛔ What to avoid</h4>
                      <ul>
                        {card.whatToAvoid.map((item, i) => (
                          <li key={`avoid-${index}-${i}`}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {card.quickWins && card.quickWins.length > 0 && (
                    <div className="ats-improvement-block">
                      <h4>⚡ Quick wins</h4>
                      <ul>
                        {card.quickWins.map((item, i) => (
                          <li key={`quick-${index}-${i}`}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Summary with Highlighted Skills */}
        {summary && (
          <div className="summary-section">
            <h2>📝 Professional Summary</h2>
            <p 
              className="summary-text" 
              dangerouslySetInnerHTML={{ __html: highlightSkillsInSummary(summary) }}
            />
            {experience_level && (
              <span className={`experience-badge ${experience_level}`}>
                {experience_level.charAt(0).toUpperCase() + experience_level.slice(1)} Level
              </span>
            )}
          </div>
        )}

        {/* Enhanced Suggested Roles with Match Percentage */}
        {suggested_roles && suggested_roles.length > 0 && (
          <div className="suggested-roles-section">
            <h2>🎯 Suggested Job Roles</h2>
            <div className="roles-grid">
              {suggested_roles.map((role, index) => {
                const matchPercentage = Math.max(95 - (index * 8), 60);
                return (
                  <RoleCard
                    key={index}
                    role={role}
                    index={index}
                    matchPercentage={matchPercentage}
                    isExpanded={expandedRole === index}
                    onToggle={() => setExpandedRole(expandedRole === index ? null : index)}
                    getRoleDetails={getRoleDetails}
                    getScoreColor={getScoreColor}
                    getScoreGradient={getScoreGradient}
                    loadingRoleDetails={loadingRoleDetails}
                    roleDetailsCache={roleDetailsCache}
                  />
                );
              })}
            </div>
          </div>
        )}

        {/* Enhanced Skills Section with Category Filters */}
        {(matched_skills.length > 0 || missing_skills.length > 0) && (
          <div className="skills-section">
            <h2>🎨 Skills Analysis</h2>
            
            {/* Category Filter Tabs */}
            <div className="skill-category-tabs">
              <button 
                className={`tab ${selectedSkillCategory === 'all' ? 'active' : ''}`}
                onClick={() => setSelectedSkillCategory('all')}
              >
                All Skills
              </button>
              <button 
                className={`tab ${selectedSkillCategory === 'frontend' ? 'active' : ''}`}
                onClick={() => setSelectedSkillCategory('frontend')}
              >
                ⚛️ Frontend
              </button>
              <button 
                className={`tab ${selectedSkillCategory === 'backend' ? 'active' : ''}`}
                onClick={() => setSelectedSkillCategory('backend')}
              >
                🖥️ Backend
              </button>
              <button 
                className={`tab ${selectedSkillCategory === 'databases' ? 'active' : ''}`}
                onClick={() => setSelectedSkillCategory('databases')}
              >
                🗄️ Databases
              </button>
              <button 
                className={`tab ${selectedSkillCategory === 'cloud' ? 'active' : ''}`}
                onClick={() => setSelectedSkillCategory('cloud')}
              >
                ☁️ Cloud/DevOps
              </button>
              <button 
                className={`tab ${selectedSkillCategory === 'ai_ml' ? 'active' : ''}`}
                onClick={() => setSelectedSkillCategory('ai_ml')}
              >
                🤖 AI/ML
              </button>
              <button 
                className={`tab ${selectedSkillCategory === 'tools' ? 'active' : ''}`}
                onClick={() => setSelectedSkillCategory('tools')}
              >
                🛠️ Tools
              </button>
            </div>

            <div className="skills-grid">
              {matched_skills.length > 0 && (
                <div className="skills-box">
                  <h3>✅ Matched Skills</h3>
                  <div className="skills-tags">
                    {selectedSkillCategory === 'all' 
                      ? matched_skills.map((skill, index) => (
                          <span 
                            key={index} 
                            className="skill-tag matched"
                            title="Detected in resume"
                          >
                            {skill}
                          </span>
                        ))
                      : categorizedMatchedSkills[selectedSkillCategory]?.map((skill, index) => (
                          <span 
                            key={index} 
                            className="skill-tag matched"
                            title="Detected in resume under SKILLS section"
                          >
                            {skill}
                          </span>
                        ))
                    }
                    {selectedSkillCategory !== 'all' && 
                     categorizedMatchedSkills[selectedSkillCategory]?.length === 0 && (
                      <p className="no-skills">No {selectedSkillCategory} skills found</p>
                    )}
                  </div>
                </div>
              )}
              {missing_skills.length > 0 && (
                <div className="skills-box">
                  <h3>❌ Missing Skills</h3>
                  <div className="skills-tags">
                    {selectedSkillCategory === 'all'
                      ? missing_skills.map((skill, index) => (
                          <span 
                            key={index} 
                            className="skill-tag missing"
                            title={`Missing from resume, but commonly required in ${detected_domain || 'this domain'} roles`}
                          >
                            {skill}
                          </span>
                        ))
                      : categorizedMissingSkills[selectedSkillCategory]?.map((skill, index) => (
                          <span 
                            key={index} 
                            className="skill-tag missing"
                            title={`Missing from resume, but commonly required in ${detected_domain || 'this domain'} roles`}
                          >
                            {skill}
                          </span>
                        ))
                    }
                    {selectedSkillCategory !== 'all' && 
                     categorizedMissingSkills[selectedSkillCategory]?.length === 0 && (
                      <p className="no-skills">No missing {selectedSkillCategory} skills</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Enhanced Recommendations with Priority Cards */}
        {recommendations.length > 0 && (
          <div className="recommendations-section">
            <h2>💡 Recommendations</h2>
            <div className="recommendations-grid">
              {recommendations.map((rec, index) => {
                const priority = getRecommendationPriority(rec);
                const icon = getRecommendationIcon(rec);
                return (
                  <div key={index} className={`recommendation-card ${priority.level}`}>
                    <div className="recommendation-header">
                      <span className="recommendation-icon">{icon}</span>
                      <span className={`priority-badge ${priority.level}`}>
                        {priority.icon} {priority.label}
                      </span>
                    </div>
                    <p className="recommendation-text">{rec}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Enhanced Strengths and Weaknesses Comparison */}
        {(strengths.length > 0 || weaknesses.length > 0) && (
          <div className="comparison-section">
            <h2>📊 Strengths vs Areas to Improve</h2>
            <div className="comparison-grid">
              {strengths.length > 0 && (
                <div className="comparison-box strengths">
                  <h3>💪 Strengths</h3>
                  <ul>
                    {strengths.map((strength, index) => (
                      <li key={index}>
                        <span className="bullet-icon">✅</span>
                        {strength}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {weaknesses.length > 0 && (
                <div className="comparison-box weaknesses">
                  <h3>⚠️ Areas to Improve</h3>
                  <ul>
                    {weaknesses.map((weakness, index) => (
                      <li key={index}>
                        <span className="bullet-icon">❌</span>
                        {weakness}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="action-buttons">
          <button onClick={onBackToHome} className="back-button">
            Analyze Another Resume
          </button>
          <button onClick={handleSaveAnalysis} className="save-button">
            Save this Analysis
          </button>
        </div>
        {saveMessage && (
          <div className="save-message">
            {saveMessage}
          </div>
        )}
      </div>
    </div>
  );
};

export default Analysis;
