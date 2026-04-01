import React, { useState } from 'react';
import './Home.css';
import resumePreviewImg from '../../assets/images/image11.webp';
import atsScoreImg from '../../assets/images/ats-score.webp';

const Home = ({ onNavigateToAnalysis }) => {
  const [dragActive, setDragActive] = useState(false);
  const [jobDescription, setJobDescription] = useState('');

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (file) => {
    // Check if it's a PDF or DOCX file
    const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    
    if (allowedTypes.includes(file.type)) {
      console.log('Resume uploaded:', file);
      // Navigate to analysis page with file and job description
      if (onNavigateToAnalysis) {
        onNavigateToAnalysis(file, jobDescription);
      }
    } else {
      alert('Please upload a PDF or DOCX file');
    }
  };

  return (
    <div className="home-container">
      <div className="home-content">
        <div className="home-left">
          <div className="section-tag">RESUME CHECKER</div>
          <h1 className="home-title">
            Is your resume good enough?
          </h1>
          <p className="home-description">
            A free and fast AI resume checker doing 16 crucial checks to ensure your resume
            is ready to perform and get you interview callbacks.
          </p>
          
          <div 
            className={`upload-box ${dragActive ? 'drag-active' : ''}`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <div className="upload-content">
              <p className="upload-text">
                Drop your resume here or choose a file.
              </p>
              <p className="upload-subtext">
                PDF & DOCX only. Max 10MB file size.
              </p>
              <label htmlFor="file-upload" className="upload-button">
                Upload Your Resume
              </label>
              <input
                id="file-upload"
                type="file"
                accept=".pdf,.docx"
                onChange={handleFileInput}
                style={{ display: 'none' }}
              />
              
              <div className="job-description-section">
                <label htmlFor="job-description" className="jd-label">
                  Job Description (Optional)
                </label>
                <textarea
                  id="job-description"
                  className="jd-textarea"
                  placeholder="Paste the job description here for better matching..."
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  rows="4"
                />
              </div>
              
              <div className="privacy-note">
                <span className="lock-icon">🔒</span>
                <span>Privacy guaranteed</span>
              </div>
            </div>
          </div>
        </div>

        <div className="home-right">
          <div className="preview-container">
            <img 
              src={resumePreviewImg} 
              alt="Resume Preview" 
              className="resume-preview"
            />
          </div>
        </div>
      </div>


      {/* ATS Score Section */}
      <div className="ats-section">
        <div className="ats-content">
          <div className="ats-left">
            <div className="ats-image-sticky">
              <img 
                src={atsScoreImg} 
                alt="Resume Grader ATS Score" 
                className="ats-score-image"
              />
            </div>
          </div>

          <div className="ats-right">
            <div className="ats-info-block">
              <h2 className="ats-main-title">
                Enhancv's Resume Checker forms its ATS score with a two-tier system
              </h2>
              <p className="ats-description">
                When you're applying for a job, there's a high chance your resume will be screened 
                through an applicant tracking system way before it finds its way on a recruiter's 
                screen. ATS helps hiring managers find the right candidates by searching for 
                keywords and adding the resume to a database.
              </p>
              <p className="ats-description">
                That's why the success of your resume is highly dependent on how optimized your 
                resume is for the job you're applying for, the resume template you're using, and what 
                skills and keywords you have included.
              </p>
            </div>

            <div className="ats-feature">
              <div className="feature-number">1</div>
              <div className="feature-content">
                <h3 className="feature-title">The proportion of content we can interpret</h3>
                <p className="feature-description">
                  Similar to an ATS, we analyze and attempt to comprehend your resume. The 
                  greater our understanding of your resume, the more effectively it aligns with a 
                  company's ATS.
                </p>
              </div>
            </div>

            <div className="ats-feature">
              <div className="feature-number">2</div>
              <div className="feature-content">
                <h3 className="feature-title">What our checker identifies</h3>
                <p className="feature-description">
                  Although an ATS doesn't look for spelling mistakes and poorly crafted content, 
                  recruitment managers certainly do. The second part of our score is based on the 
                  quantifiable achievements you have in your resume and the quality of the written 
                  content.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Checklist Section */}
      <div className="checklist-section">
        <div className="checklist-header">
          <h2 className="checklist-main-title">Our AI-powered resume checker goes beyond typos and punctuation</h2>
          <p className="checklist-subtitle">We've built-in ChatGPT to help you create a resume that's tailored to the position you're applying for.</p>
        </div>
        
        <div className="checklist-inner">
          <div className="checklist-left">
            <h3 className="checklist-title">Resume optimization checklist</h3>
            <p className="checklist-desc">We check for 16 crucial things across 5 different categories on your resume including content, file type, and keywords in the most important sections of your resume. Here's a full list of the checks you'll receive:</p>
          </div>

          <div className="checklist-right">
            <div className="cards-grid">
              <div className="card">
                <div className="card-icon">📄</div>
                <h3 className="card-title">Format</h3>
                <ul className="card-list">
                  <li>File format and size</li>
                  <li>Resume length</li>
                  <li>Long bullet points with suggestions on how to shorten</li>
                </ul>
              </div>

              <div className="card">
                <div className="card-icon">📋</div>
                <h3 className="card-title">Resume sections</h3>
                <ul className="card-list">
                  <li>Contact information</li>
                  <li>Essential sections</li>
                  <li>Personality showcase with tips on how to improve</li>
                </ul>
              </div>

              <div className="card">
                <div className="card-icon">✍️</div>
                <h3 className="card-title">Content</h3>
                <ul className="card-list">
                  <li>ATS parse rate</li>
                  <li>Repetition of words and phrases</li>
                  <li>Spelling and grammar</li>
                  <li>Quantifying impact in experience section with examples</li>
                </ul>
              </div>

              <div className="card">
                <div className="card-icon">💡</div>
                <h3 className="card-title">Skills suggestion</h3>
                <ul className="card-list">
                  <li>Hard skills</li>
                  <li>Soft skills</li>
                </ul>
              </div>

              <div className="card">
                <div className="card-icon">A</div>
                <h3 className="card-title">Style</h3>
                <ul className="card-list">
                  <li>Resume design</li>
                  <li>Email address</li>
                  <li>Usage of active voice</li>
                  <li>Usage of buzzwords and cliches</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="faq-section">
        <h2 className="faq-main-title">Frequently asked questions</h2>
        <div className="faq-container">
          
          <details className="faq-item">
            <summary className="faq-question">
              <span>What is a resume checker?</span>
              <span className="faq-icon">+</span>
            </summary>
            <div className="faq-answer">
              <p>A resume checker is a tool or software used to evaluate and improve resumes. It checks for proper formatting, relevant keywords (important for Applicant Tracking Systems), grammar and spelling errors, and content relevance.</p>
              <p>Enhancv's resume checker also assesses consistency in details, suggests customization for different industries, and provides feedback for improvement. We help ensure your resume meets current professional standards and trends and increase your chances of getting noticed by employers and recruiters.</p>
            </div>
          </details>

          <details className="faq-item">
            <summary className="faq-question">
              <span>How do I check my resume score?</span>
              <span className="faq-icon">+</span>
            </summary>
            <div className="faq-answer">
              <p>Upload your resume to Enhancv's Resume Checker. Once we run the check you will be redirected to another page where you can see your report with a score on the left side of the screen.</p>
              <p>Keep in mind that there's no such thing as an ATS score – no tool online that provides a score gives an actual score.</p>
              <p>Enhancv's resume report scoring system is based on two major things:</p>
              <ul>
                <li><strong>The percentage of parsed content</strong> – Like an ATS we parse your resume and we try to understand it. The more we understand from your resume, the better it performs with an ATS used by a company.</li>
                <li><strong>The issues our checker finds</strong> – While applicant tracking systems don't check for typos and badly written content, our checker and recruiting managers do. The second aspect of our scoring depends on the measurable accomplishments in your resume and the caliber of the writing.</li>
              </ul>
            </div>
          </details>

          <details className="faq-item">
            <summary className="faq-question">
              <span>How do I improve my resume score?</span>
              <span className="faq-icon">+</span>
            </summary>
            <div className="faq-answer">
              <p>A higher resume score can be achieved by improving key sections on your resume. Here's what you can do:</p>
              <ul>
                <li>Rewrite your experience section to include quantifiable achievements. Don't just state your job duties. Write your accomplishments in the position you've held.</li>
                <li>Include skills that are relevant to the position you're applying for and are included in the job posting.</li>
                <li>Add an accomplishments section to highlight the truly relevant feats of your career.</li>
                <li>Use a PDF resume and a professionally designed resume template.</li>
                <li>Fix spelling and grammar mistakes. Ensure you're using active voice throughout your resume.</li>
              </ul>
            </div>
          </details>

          <details className="faq-item">
            <summary className="faq-question">
              <span>How do I know my resume is ATS compliant?</span>
              <span className="faq-icon">+</span>
            </summary>
            <div className="faq-answer">
              <p>To ensure your resume is ATS-compliant, integrate relevant keywords from the job description in a natural manner, use simple formatting with a clear layout, and stick to conventional headings like "Work Experience" and "Education".</p>
              <p>Unlike most advice on the internet, using a PDF from a dedicated resume builder like Enhancv is better than using a Word or doc file, as it ensures your formatting stays intact. Double-column resumes are just as good as single-column resumes and fonts don't seem to matter that much as long as they're easy to read.</p>
              <p>Spell out acronyms alongside their full phrases, include a distinct skills section, maintain a consistent work history with clear job titles and employment periods, and meticulously proofread for errors.</p>
            </div>
          </details>

          <details className="faq-item">
            <summary className="faq-question">
              <span>What is a good ATS score?</span>
              <span className="faq-icon">+</span>
            </summary>
            <div className="faq-answer">
              <p>Enhancv's Resume Checker score is made by two factors combining 16 checks. If your resume scores higher than 80 you can count that it's mostly good.</p>
              <p>Keep in mind, however, that a score is one of many things you should be looking for. Key sections like contact information and experience should be immaculate. Make sure to review your resume in detail before applying for a job.</p>
            </div>
          </details>

          <details className="faq-item">
            <summary className="faq-question">
              <span>Can an ATS read PDFs?</span>
              <span className="faq-icon">+</span>
            </summary>
            <div className="faq-answer">
              <p>Yes. We've conducted tests with the most popular applicant tracking systems and it seems that it's a myth an ATS can't read a PDF. In fact, PDFs have scored higher as they're static files that once saved, can't be edited.</p>
            </div>
          </details>

          <details className="faq-item">
            <summary className="faq-question">
              <span>How do I review my resume for errors?</span>
              <span className="faq-icon">+</span>
            </summary>
            <div className="faq-answer">
              <p>It's easier to get lost in the details of the separate sections, ignoring how they all come together in the final resume form. A complete resume review will help you focus on the full picture.</p>
              <p>You'll start to notice you're either missing out on your skills section positioning or that it doesn't align with your achievements. That's why you need to take enough time for proofreading and quality checks.</p>
            </div>
          </details>

          <details className="faq-item">
            <summary className="faq-question">
              <span>What should I focus on when checking my resume?</span>
              <span className="faq-icon">+</span>
            </summary>
            <div className="faq-answer">
              <p>We've read 1000s of resumes from our users and got the opinions of recruiters on which are the top mistakes people make when building their CV.</p>
              <p>Here's a list of the most commonly occurring mistakes on resumes:</p>
              <ul>
                <li>Avoid cliches and buzzwords</li>
                <li>Don't lie on your resume</li>
                <li>Edit typos and grammatical errors</li>
                <li>List achievements, not responsibilities</li>
                <li>Include related experience only</li>
                <li>Create multiple tailored resumes</li>
                <li>Embed your personality</li>
                <li>Keep a clean and organized formatting throughout</li>
                <li>Include both your paid and unpaid experience (the latter is especially important for entry-level positions)</li>
              </ul>
            </div>
          </details>

          <details className="faq-item">
            <summary className="faq-question">
              <span>Can I create a resume checklist?</span>
              <span className="faq-icon">+</span>
            </summary>
            <div className="faq-answer">
              <p>Set up a checklist with every bit of information you want your resume to convey at the end. These may include:</p>
              <ul>
                <li>Job achievements of high importance</li>
                <li>Culture fit through personality and relevant hobbies</li>
                <li>Extracurricular activities, relevant websites or projects</li>
              </ul>
              <p>Once you have the rough content of your resume, compare it with the checklist so you don't forget anything important.</p>
              <p>Another point of reference should be the job description. All competencies, experience, and skills needed to do the job well are outlined there, so make sure what accomplishments you highlight match the job offer.</p>
              <p>To sum up, your resume must answer the following questions:</p>
              <ul>
                <li>Who are you?</li>
                <li>What's your experience?</li>
                <li>What's your motivation for joining this company?</li>
                <li>How will you contribute to the company?</li>
              </ul>
            </div>
          </details>

          <details className="faq-item">
            <summary className="faq-question">
              <span>Should I read my resume after writing it?</span>
              <span className="faq-icon">+</span>
            </summary>
            <div className="faq-answer">
              <p>First off, make sure you don't complete your application with only 30 minutes to spare before the deadline. For this tactic to work, you should start well in advance.</p>
              <p>Take time to sleep on your resume, and return to it a couple of days later, or better yet, when you have already forgotten what you wrote.</p>
              <p>It will feel like you're an external reviewer and will spot mistakes that otherwise you'll have omitted.</p>
            </div>
          </details>

          <details className="faq-item">
            <summary className="faq-question">
              <span>Does your resume checker serve other purposes?</span>
              <span className="faq-icon">+</span>
            </summary>
            <div className="faq-answer">
              <p>Yes, Enhancv's resume checker is also great for making a targeted resume for a specific job posting. It's also a resume grammar checker and an overall resume critique that can help you find and fix your mistakes.</p>
            </div>
          </details>
        </div>
      </div>
    </div>
  );
};

export default Home;
