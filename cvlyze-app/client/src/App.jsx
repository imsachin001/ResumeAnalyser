import React, { useState } from 'react';
import Navbar from './components/Navbar/Navbar';
import Home from './components/Home/Home';
import AnalysisLoading from './components/AnalysisLoading/AnalysisLoading';
import Analysis from './components/Analysis/Analysis';
import SavedAnalyses from './components/SavedAnalyses/SavedAnalyses';
import './App.css';

function App() {
  const [currentPage, setCurrentPage] = useState('home');
  const [resumeFile, setResumeFile] = useState(null);
  const [jobDescription, setJobDescription] = useState('');
  const [analysisResult, setAnalysisResult] = useState(null);
  const [error, setError] = useState(null);

  const navigateToLoading = (file, jd) => {
    setResumeFile(file);
    setJobDescription(jd || '');
    setCurrentPage('loading');
    setError(null);
  };

  const navigateToAnalysis = (data) => {
    setAnalysisResult(data);
    setCurrentPage('analysis');
  };

  const navigateToHome = () => {
    setCurrentPage('home');
    setResumeFile(null);
    setJobDescription('');
    setAnalysisResult(null);
    setError(null);
  };

  const handleNavigate = (page) => {
    if (page === 'home') {
      navigateToHome();
      return;
    }
    setCurrentPage(page);
  };

  const handleError = (errorMessage) => {
    setError(errorMessage);
    alert(`Error: ${errorMessage}`);
    navigateToHome();
  };

  return (
    <div className="App">
      <Navbar onNavigate={handleNavigate} />
      {currentPage === 'home' && <Home onNavigateToAnalysis={navigateToLoading} />}
      {currentPage === 'loading' && (
        <AnalysisLoading 
          resumeFile={resumeFile}
          jobDescription={jobDescription}
          onComplete={navigateToAnalysis}
          onError={handleError}
        />
      )}
      {currentPage === 'analysis' && (
        <Analysis 
          data={analysisResult}
          onBackToHome={navigateToHome}
        />
      )}
      {currentPage === 'saved' && (
        <SavedAnalyses
          onBackToHome={navigateToHome}
          onViewAnalysis={navigateToAnalysis}
        />
      )}
    </div>
  );
}

export default App;
