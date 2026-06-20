const { GoogleGenerativeAI } = require('@google/generative-ai');
const domainTemplates = require('./domainTemplates');
const atsCalculator   = require('./atsCalculator');

class AIAnalyzer {
  constructor() {
    // Universal tech dictionary (always used for tech resumes)
    this.techSkillsDictionary = [
      'C++', 'C', 'Python', 'JavaScript', 'TypeScript', 'Java', 'Go', 'Rust', 'PHP', 'Ruby', 'Swift', 'Kotlin',
      'React', 'Angular', 'Vue.js', 'Next.js', 'HTML', 'HTML5', 'CSS', 'CSS3', 'Tailwind', 'TailwindCSS',
      'Bootstrap', 'Material-UI', 'Redux', 'jQuery',
      'Node.js', 'Express', 'Express.js', 'Django', 'Flask', 'FastAPI', 'Spring Boot', 'ASP.NET', 'Laravel', 'Rails',
      'MongoDB', 'MySQL', 'PostgreSQL', 'SQL', 'NoSQL', 'Redis', 'Firebase', 'DynamoDB', 'SQLite', 'Oracle',
      'AWS', 'Azure', 'GCP', 'Google Cloud', 'Docker', 'Kubernetes', 'CI/CD', 'Jenkins', 'GitHub Actions', 'Terraform',
      'Machine Learning', 'Deep Learning', 'TensorFlow', 'PyTorch', 'LangChain', 'Huggingface', 'OpenAI',
      'NLP', 'Computer Vision', 'Scikit-learn',
      'Git', 'GitHub', 'GitLab', 'Bitbucket', 'VS Code', 'IntelliJ', 'Postman', 'Jira', 'Linux', 'Unix',
      'REST API', 'GraphQL', 'Microservices', 'DSA', 'Data Structures', 'Algorithms', 'OOP', 'System Design',
      'LeetCode', 'Codeforces', 'HackerRank', 'Agile', 'Scrum', 'Testing', 'Jest', 'Mocha', 'Selenium',
      'Pandas', 'NumPy', 'Recharts', 'D3.js', 'Sass', 'Webpack', 'Heroku', 'Vercel', 'Netlify'
    ];

    // Non-tech domain skill dictionaries
    this.domainSkillDictionaries = {
      marketing: [
        'SEO', 'SEM', 'Google Ads', 'Facebook Ads', 'Content Marketing', 'Email Marketing',
        'Social Media Marketing', 'Copywriting', 'Google Analytics', 'HubSpot', 'Marketing Automation',
        'CRM', 'Brand Management', 'PPC', 'A/B Testing', 'Tableau', 'Power BI', 'Canva', 'WordPress',
        'Mailchimp', 'Klaviyo', 'Salesforce', 'Zoho CRM', 'Market Research', 'Campaign Management'
      ],
      sales: [
        'Lead Generation', 'CRM', 'B2B Sales', 'B2C Sales', 'Negotiation', 'Account Management',
        'Sales Strategy', 'Revenue Targets', 'Upselling', 'Pipeline Management', 'Presentation Skills',
        'Customer Retention', 'Salesforce', 'Cold Calling', 'Deal Closing', 'Go-to-Market'
      ],
      human_resources: [
        'Recruitment', 'Onboarding', 'Payroll', 'HRIS', 'Workday', 'SAP HR', 'BambooHR', 'GreytHR',
        'Employee Relations', 'Performance Management', 'Compliance', 'Labour Law', 'Training & Development',
        'Job Portals', 'Compensation & Benefits', 'Workforce Planning', 'Exit Management',
        'Naukri', 'LinkedIn Recruiter', 'Appraisal', 'KPI', 'Statutory Compliance'
      ],
      finance: [
        'Financial Analysis', 'Accounting', 'Tally', 'SAP FICO', 'QuickBooks', 'MS Excel',
        'Auditing', 'Taxation', 'GST', 'TDS', 'Budgeting', 'Financial Reporting', 'GAAP', 'Ind AS', 'IFRS',
        'Reconciliation', 'Accounts Payable', 'Accounts Receivable', 'CPA', 'CA', 'CFA', 'ACCA', 'CMA',
        'MIS Report', 'Balance Sheet', 'P&L', 'Cost Control', 'Internal Audit'
      ],
      healthcare: [
        'Patient Care', 'EMR', 'EHR', 'HIPAA', 'Clinical Skills', 'Medical Terminology',
        'Nursing', 'Phlebotomy', 'Vital Signs', 'Medication Management', 'First Aid', 'CPR', 'BLS', 'ACLS',
        'Healthcare Administration', 'Telemedicine', 'Epic', 'Cerner', 'Meditech', 'ICD Codes', 'CPT Codes'
      ],
      education: [
        'Curriculum Development', 'Lesson Planning', 'Classroom Management', 'E-Learning', 'LMS',
        'Moodle', 'Student Assessment', 'Instructional Design', 'Special Education', 'CBSE', 'ICSE',
        'Tutoring', 'Online Teaching', 'Content Development', 'Zoom', 'Google Meet', 'Pedagogy'
      ],
      logistics: [
        'Inventory Management', 'WMS', 'ERP', 'SAP', 'Forklift', 'Supply Chain', 'Procurement',
        'Freight', 'Shipping', 'Quality Control', 'OSHA', 'Last Mile Delivery', 'Import', 'Export',
        'Customs Clearance', 'Incoterms', 'Vendor Management', 'Stock Management', 'Dispatch'
      ],
      customer_service: [
        'Zendesk', 'Freshdesk', 'ServiceNow', 'CRM', 'Live Chat', 'Call Centre', 'Complaint Handling',
        'SLA Management', 'CSAT', 'NPS', 'Product Knowledge', 'Upselling', 'Escalation Management',
        'Customer Satisfaction', 'Intercom', 'Salesforce'
      ],
      project_management: [
        'Agile', 'Scrum', 'Kanban', 'PMP', 'PRINCE2', 'Jira', 'Confluence', 'Asana', 'Trello',
        'MS Project', 'Risk Management', 'Stakeholder Management', 'Budget Management', 'Resource Planning',
        'Change Management', 'Status Reporting', 'Sprint Planning', 'Roadmap'
      ],
      content_writing: [
        'SEO Writing', 'Copywriting', 'Technical Writing', 'Editing', 'Proofreading', 'WordPress', 'CMS',
        'Content Strategy', 'Blogging', 'Storytelling', 'Grammarly', 'AP Style', 'Social Media Content',
        'Script Writing', 'Journalism', 'Article Writing', 'Newsletter Writing', 'Keyword Research'
      ],
      design: [
        'Figma', 'Adobe XD', 'Sketch', 'Photoshop', 'Illustrator', 'InDesign', 'After Effects',
        'Prototyping', 'Wireframing', 'UI Design', 'UX Research', 'Design Systems', 'Typography',
        'Branding', 'Canva', 'Motion Design', 'Accessibility', 'WCAG', 'User Research', 'Usability Testing'
      ],
      cybersecurity: [
        'Penetration Testing', 'SIEM', 'Splunk', 'Vulnerability Assessment', 'Incident Response',
        'Firewall', 'IDS', 'IPS', 'ISO 27001', 'SOC 2', 'PCI DSS', 'GDPR', 'CISSP', 'CEH', 'OSCP',
        'Network Security', 'Threat Intelligence', 'Cloud Security', 'SOC', 'MITRE ATT&CK'
      ],
      qa_testing: [
        'Manual Testing', 'Selenium', 'Cypress', 'Postman', 'JMeter', 'Jira', 'TestNG', 'JUnit',
        'Agile', 'Regression Testing', 'ISTQB', 'SQL', 'Appium', 'Performance Testing', 'API Testing',
        'Bug Tracking', 'Test Cases', 'Defect Management'
      ],
      data_science: [
        'Python', 'R', 'SQL', 'Machine Learning', 'Deep Learning', 'Pandas', 'NumPy', 'Scikit-learn',
        'TensorFlow', 'PyTorch', 'Tableau', 'Power BI', 'Matplotlib', 'Seaborn', 'Spark', 'Hadoop',
        'Statistics', 'NLP', 'Feature Engineering', 'MLflow', 'Data Visualization', 'Big Data'
      ]
    };

    // Universal soft skills
    this.softSkillsDictionary = [
      'Communication', 'Leadership', 'Teamwork', 'Problem Solving', 'Time Management',
      'Presentation Skills', 'Negotiation', 'Conflict Resolution', 'Adaptability',
      'Attention to Detail', 'Empathy', 'Customer Service', 'Project Management',
      'Research', 'Microsoft Office', 'Google Workspace', 'Critical Thinking',
      'Decision Making', 'Mentoring', 'Coaching', 'Multitasking'
    ];

    this.skillSynonyms = {
      'React':          ['ReactJS', 'React Js', 'React.js', 'reactjs', 'react-js', 'REACT', 'React JS'],
      'Node.js':        ['Node', 'NodeJs', 'NodeJS', 'node js', 'Nodejs', 'node-js', 'NODE', 'Node JS'],
      'MongoDB':        ['Mongo', 'Mongo Db', 'MongoDb', 'mongo db', 'mongodb', 'MONGODB', 'Mongo DB'],
      'Express':        ['ExpressJS', 'Express.js', 'express js', 'expressjs', 'ExpressJs', 'EXPRESS', 'Express JS'],
      'JavaScript':     ['JS', 'Javascript', 'java script', 'javascript', 'JAVASCRIPT', 'Java Script'],
      'TypeScript':     ['TS', 'Typescript', 'type script', 'TYPESCRIPT'],
      'Python':         ['Py', 'python', 'PYTHON'],
      'C++':            ['CPP', 'Cpp', 'C Plus Plus', 'c++', 'cpp'],
      'PostgreSQL':     ['Postgres', 'postgres', 'postgresql', 'POSTGRESQL', 'Postgre SQL'],
      'MySQL':          ['My SQL', 'MySql', 'mysql', 'MYSQL'],
      'HTML5':          ['HTML', 'html', 'html5', 'Html'],
      'CSS3':           ['CSS', 'css', 'css3', 'Css'],
      'Tailwind':       ['TailwindCSS', 'Tailwind CSS', 'tailwind', 'tailwindcss'],
      'Git':            ['git', 'GIT'],
      'GitHub':         ['Github', 'github', 'git hub', 'GITHUB'],
      'VS Code':        ['VSCode', 'Visual Studio Code', 'vscode'],
      'LangChain':      ['Langchain', 'langchain', 'lang chain'],
      'Huggingface':    ['HuggingFace', 'huggingface', 'hugging face'],
      'NumPy':          ['Numpy', 'numpy'],
      'Pandas':         ['pandas', 'PANDAS'],
      'AWS':            ['Amazon Web Services', 'aws'],
      'GCP':            ['Google Cloud Platform', 'Google Cloud', 'gcp'],
      'Azure':          ['Microsoft Azure', 'azure', 'AZURE'],
      'Docker':         ['docker', 'DOCKER'],
      'Kubernetes':     ['K8s', 'k8s', 'kubernetes', 'KUBERNETES'],
      'REST API':       ['REST', 'RESTful', 'rest api', 'restful api'],
      'GraphQL':        ['graphql', 'graph ql'],
      'Next.js':        ['NextJS', 'Next', 'Nextjs', 'next', 'nextjs', 'Next JS'],
      'Vue.js':         ['Vue', 'VueJS', 'Vuejs', 'vue', 'vuejs'],
      'Angular':        ['AngularJS', 'angular', 'ANGULAR'],
      'Django':         ['django', 'DJANGO'],
      'Flask':          ['flask', 'FLASK'],
      'FastAPI':        ['Fast API', 'fastapi', 'fast api'],
      'Spring Boot':    ['SpringBoot', 'Spring', 'spring boot', 'springboot'],
      'Material-UI':    ['MaterialUI', 'MUI', 'material ui'],
      'TensorFlow':     ['Tensorflow', 'tensorflow', 'tensor flow'],
      'PyTorch':        ['Pytorch', 'pytorch', 'py torch'],
      'Data Structures':['DSA', 'DS', 'Data Structure', 'data structures'],
      'Algorithms':     ['Algorithm', 'algorithms', 'algo'],
      'OOP':            ['Object Oriented Programming', 'Object-Oriented Programming', 'oop']
    };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // PROMPT BUILDERS
  // ─────────────────────────────────────────────────────────────────────────

  createDomainAwarePrompt(parsedData, detectedDomain) {
    const structuredData = this.createFallbackStructure(parsedData);
    const domainInfo     = detectedDomain.template;

    return `You are an expert resume analyzer with deep knowledge across multiple industries.

DETECTED DOMAIN: ${detectedDomain.name}
This resume appears to be for: ${detectedDomain.name}

DOMAIN-SPECIFIC IMPORTANT SKILLS:
${domainInfo.important_skills.join(', ')}

RESUME DATA (Structured JSON):
${JSON.stringify(structuredData, null, 2)}

TASK: Analyze this resume for ${domainInfo.name} roles using domain-specific criteria.

STEP 1 — Skill Extraction
Extract the hard skills explicitly found in the resume.
CRITICAL: ONLY list skills that physically exist in the resume text. Do NOT hallucinate skills that you think the candidate *might* know based on their domain.

STEP 2 — Holistic Match Scoring
Provide a dynamic Job Match Score (0-100) assessing how well this candidate fits a generic ${domainInfo.name} role.
- Use your expert judgment based on semantic depth, transferrable skills, and project quality.
- DO NOT use a rigid calculation. A candidate with great core logic but missing a specific tool can still score 75+. A total mismatch should score under 40.

RESPONSE FORMAT — return ONLY valid JSON, no markdown:
{
  "match_score": <0–100, dynamic integer>,
  "matched_skills": ["ONLY skills explicitly found in the resume"],
  "missing_skills": ["3–5 HIGH-IMPACT domain skills absent from resume"],
  "recommendations": ["4–6 SPECIFIC, ACTIONABLE improvements"],
  "strengths": ["3–5 key strengths"],
  "weaknesses": ["2–3 constructive improvement areas phrased positively"],
  "suggested_roles": [
    { "role": "role name", "fit_score": <0-95>, "reasoning": "one short sentence" }
  ],
  "summary": "2–3 sentence professional summary",
  "experience_level": "entry|mid|senior",
  "key_achievements": ["2–4 notable achievements from the resume"],
  "top_skills": ["top 5 most relevant skills actually found in the resume"]
}

QUALITY RULES:
- match_score MUST be an intuitive, AI-assessed evaluation, not rigid math.
- matched_skills MUST be derived strictly from the candidate's resume.
- fit_score values must never reach 100 — cap every fit_score at 95.
- PROVIDE ONLY THE JSON. NO ADDITIONAL TEXT OR MARKDOWN.`;
  }

  createJDMatchPrompt(parsedData, jobDescription, detectedDomain) {
    const structuredData = this.createFallbackStructure(parsedData);

    return `You are a senior technical recruiter and ATS specialist. Your task is to evaluate how well this resume aligns with the provided Job Description (JD).

═══════════════════════════════════════
JOB DESCRIPTION:
═══════════════════════════════════════
${jobDescription.trim()}

═══════════════════════════════════════
RESUME DATA:
═══════════════════════════════════════
${JSON.stringify(structuredData, null, 2)}

═══════════════════════════════════════
STEP-BY-STEP ANALYSIS INSTRUCTIONS
═══════════════════════════════════════

STEP 1 — Extract JD Requirements
Identify the core technical skills, experience, and nice-to-haves explicitly requested in the JD.

STEP 2 — Semantic Candidate Evaluation
Cross-reference the JD requirements against the candidate's resume.
CRITICAL HALLUCINATION GUARD: When populating 'matched_skills', you MUST ONLY list skills that are EXPLICITLY WRITTEN in the resume data. Do NOT copy a skill from the JD into the matched_skills array if the candidate did not include it.

STEP 3 — Dynamic Match Scoring
Provide a holistic Job Match Score (0-100). Do NOT use a rigid mathematical formula. Use your expert AI judgment:
- 80-95: Strong semantic fit. High alignment in core skills and experience.
- 60-79: Moderate fit. Has fundamental skills/experience, but missing some key requirements or depth.
- 40-59: Weak fit. Lacks core experience or critical required skills, but has some basic transferrable value.
- 0-39: Poor fit. Completely misaligned domain or experience level.

═══════════════════════════════════════
RESPONSE FORMAT — ONLY valid JSON, no markdown:
═══════════════════════════════════════
{
  "match_score": <0–100, dynamic holistic score per Step 3>,
  "jd_requirements_extracted": {
    "required_skills": ["every required skill extracted from JD"],
    "preferred_skills": ["nice-to-have skills from JD"],
    "experience_required": "e.g. 2+ years in backend development",
    "education_required": "e.g. B.Tech in CS or equivalent",
    "soft_skills": ["communication", "teamwork"]
  },
  "matched_requirements": ["JD requirements clearly met by the resume"],
  "partial_requirements": ["JD requirements partially met"],
  "matched_skills": ["ONLY JD-required skills actually present in the resume"],
  "missing_skills": ["JD-required skills absent from resume — max 6"],
  "recommendations": ["5–7 specific, JD-driven, actionable improvements"],
  "strengths": ["3–5 resume strengths relative to this JD"],
  "weaknesses": ["2–3 resume gaps relative to this JD"],
  "suggested_roles": [
    { "role": "role name (the literal JD role and/or close alternatives)", "fit_score": <0-95>, "reasoning": "one short sentence" }
  ],
  "summary": "2–3 sentence evaluation of fit for this specific JD",
  "experience_level": "entry|mid|senior",
  "key_achievements": ["2–4 achievements from resume most relevant to JD"],
  "top_skills": ["top 5 resume skills most relevant to this JD"]
}

CRITICAL RULES:
- matched_skills MUST NEVER contain a skill not found in the resume text.
- match_score MUST be an intuitive AI assessment, varied and dynamic.
- fit_score values must never reach 100 — cap every fit_score at 95.
- PROVIDE ONLY THE JSON. NO EXTRA TEXT OR MARKDOWN.`;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // MAIN ENTRY POINT
  // ─────────────────────────────────────────────────────────────────────────

  async analyzeResume(parsedData, jobDescription = '', apiKey = null) {
    const hasJD = jobDescription && jobDescription.trim().length > 2;

    const detectedDomain = domainTemplates.detectDomain(parsedData.raw_text || '');
    const resumeQuality = atsCalculator.calculateResumeQualityScore(parsedData);

    const expArray = Array.isArray(parsedData.structured?.experience)
      ? parsedData.structured.experience
      : (Array.isArray(parsedData.experience) ? parsedData.experience : []);
    const experienceTimeline = atsCalculator.calculateExperienceTimeline(expArray);

    if (!apiKey) {
      console.log('No Gemini API key — using enhanced fallback analysis');
      return this.createEnhancedFallbackAnalysis(parsedData, detectedDomain, resumeQuality, experienceTimeline, hasJD, jobDescription);
    }

    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: 'models/gemini-2.5-flash' });

      const prompt = hasJD
        ? this.createJDMatchPrompt(parsedData, jobDescription, detectedDomain)
        : this.createDomainAwarePrompt(parsedData, detectedDomain);

      console.log(`Calling Gemini AI (${hasJD ? 'JD-match mode' : 'domain-aware mode'})...`);
      const result   = await model.generateContent(prompt);
      const response = await result.response;
      const rawText  = response.text();

      let analysisData;
      let parseFailed = false;
      try {
        const cleaned = rawText.trim().replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
        analysisData  = JSON.parse(cleaned);
      } catch (parseErr) {
        console.error('JSON parse error:', parseErr.message);
        analysisData = this.createEnhancedFallbackAnalysis(parsedData, detectedDomain, resumeQuality, experienceTimeline, hasJD, jobDescription);
        parseFailed = true;
      }

      let atsImprovements = [];
      try {
        atsImprovements = await this.generateAtsImprovements(parsedData, resumeQuality, detectedDomain, jobDescription, apiKey);
      } catch (e) {
        console.error('ATS improvements error:', e.message);
        atsImprovements = this.createFallbackAtsImprovements(resumeQuality, detectedDomain);
      }

      let match_score;
      if (parseFailed) {
        match_score = analysisData.match_score;
      } else {
        const sanitizedRoles = this.sanitizeSuggestedRoles(analysisData.suggested_roles);
        analysisData.suggested_roles = sanitizedRoles;

        if (hasJD) {
          // When a JD is provided: Gemini's own match_score IS the JD-specific
          // score we want. Do NOT use sanitizedRoles[0].fit_score — that's the
          // candidate's strongest native domain role, which will be high even
          // when the JD is for a completely different domain. For example, a
          // Backend Dev resume vs a UX Design JD: roles[0] = Backend Dev at 90%
          // (candidate's strength), roles[3] = UX Designer at 10% (the actual JD
          // match) — taking roles[0] showed 90% Job Match for a completely wrong JD.
          const geminiScore = Number(analysisData.match_score);
          if (!isNaN(geminiScore) && geminiScore > 0) {
            match_score = Math.min(Math.max(Math.round(geminiScore), 5), 95);
          } else if (sanitizedRoles.length > 0) {
            // Fallback: find the role whose name most closely matches the JD
            // (Gemini should have put it first per prompt instructions, but if not,
            // pick the lowest fit_score role since mismatches get listed last)
            match_score = sanitizedRoles[0].fit_score;
          } else {
            const computed = this.computeMatchScore(parsedData, detectedDomain, jobDescription, hasJD);
            match_score = Math.min(computed.match_score, 95);
          }
        } else {
          // No JD: domain-fit match — first suggested role is appropriate here
          if (sanitizedRoles.length > 0) {
            match_score = sanitizedRoles[0].fit_score;
          } else {
            const computed = this.computeMatchScore(parsedData, detectedDomain, jobDescription, hasJD);
            match_score = Math.min(computed.match_score, 95);
          }
        }
      }

      const structured    = parsedData.structured || {};
      const profExpCount  = (structured.experience || []).filter(e => e.type === 'professional').length;
      const projCount     = (structured.projects   || []).length;
      const expSummary    = profExpCount > 0
        ? `${experienceTimeline.totalYears} yrs, ${profExpCount} role(s)`
        : projCount > 0
          ? `${projCount} project(s) (student/fresher)`
          : '0 yrs, 0 roles';

      const atsCompatibility = Math.round(0.6 * resumeQuality.total + 0.4 * match_score);

      const jd_match_breakdown = this.computeJDBreakdown(
        analysisData, parsedData, detectedDomain, jobDescription, hasJD, match_score
      );

      return {
        ...analysisData,
        match_score,
        resume_quality_score:     resumeQuality.total,
        resume_quality_breakdown: resumeQuality.breakdown,
        ats_score:                atsCompatibility,
        ats_improvements:         atsImprovements,
        jd_match_breakdown,
        detected_domain:          detectedDomain.name,
        domain_match_score:       detectedDomain.score,
        has_jd:                   hasJD,
        experience_summary:       expSummary,
        experience_timeline:      experienceTimeline,
        section_completeness:     this.calculateSectionCompleteness(parsedData)
      };

    } catch (err) {
      console.error('Gemini API error:', err.message);
      return this.createEnhancedFallbackAnalysis(parsedData, detectedDomain, resumeQuality, experienceTimeline, hasJD, jobDescription);
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // ATS IMPROVEMENT CARDS
  // ─────────────────────────────────────────────────────────────────────────

  async generateAtsImprovements(parsedData, resumeQuality, detectedDomain, jobDescription, apiKey) {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'models/gemini-2.5-flash' });

    const maxScores = { contact: 10, sections: 15, formatting: 10, actionVerbs: 10, experienceDepth: 15 };

    const prompt = `You are a resume-quality coach. Generate actionable cards to improve low-scoring RESUME QUALITY areas — structure, formatting, and writing quality. Do NOT suggest adding specific skills, technologies, or keywords.

CONTEXT (JSON):
${JSON.stringify({
  scores:         resumeQuality.breakdown,
  maxScores,
  resumeSignals: {
    hasLinkedIn:  !!parsedData.contact?.linkedin,
    hasGitHub:    !!parsedData.contact?.github,
    hasPortfolio: !!parsedData.contact?.portfolio,
    projectCount: Array.isArray(parsedData.projects) ? parsedData.projects.length : 0,
    skillsCount:  (parsedData.skills_list || []).length
  }
}, null, 2)}

RULES:
1. Focus ONLY on areas where score < 70% of maxScore.
2. Return 2–4 cards total.
3. Each card: area, score, maxScore, priority (high/medium/low), whatToAdd (3–5 items), whatToAvoid (2–3 items), quickWins (2–3 items).
4. Advice must be about STRUCTURE, FORMATTING, and WRITING QUALITY only.
5. No markdown inside strings. Plain text only.

RESPONSE — ONLY valid JSON:
{
  "ats_improvements": [
    {
      "area": "Experience Depth",
      "score": 10,
      "maxScore": 25,
      "priority": "high",
      "whatToAdd": ["...", "..."],
      "whatToAvoid": ["...", "..."],
      "quickWins": ["...", "..."]
    }
  ]
}`;

    const result   = await model.generateContent(prompt);
    const response = await result.response;
    const text     = response.text().replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const parsed   = JSON.parse(text);
    return Array.isArray(parsed.ats_improvements) ? parsed.ats_improvements : [];
  }

  createFallbackAtsImprovements(resumeQuality, detectedDomain) {
    const maxScores = { contact: 10, sections: 15, formatting: 10, actionVerbs: 10, experienceDepth: 15 };
    const areaLabels = {
      contact: 'Contact Details', sections: 'Resume Sections',
      actionVerbs: 'Action Verbs & Metrics', formatting: 'Formatting', experienceDepth: 'Experience Depth'
    };

    const sorted = Object.keys(maxScores)
      .map(k => ({ key: k, score: resumeQuality.breakdown[k] || 0, maxScore: maxScores[k], ratio: (resumeQuality.breakdown[k] || 0) / maxScores[k] }))
      .sort((a, b) => a.ratio - b.ratio);

    const lowAreas = sorted.filter(a => a.ratio < 0.7);
    const selected = lowAreas.length >= 2 ? lowAreas.slice(0, 3) : sorted.slice(0, 2);

    return selected.map(area => ({
      area:      areaLabels[area.key] || area.key,
      score:     area.score,
      maxScore:  area.maxScore,
      priority:  area.ratio < 0.4 ? 'high' : area.ratio < 0.7 ? 'medium' : 'low',
      whatToAdd: [
        'Add clear, ATS-friendly section headings (SKILLS, EXPERIENCE, EDUCATION)',
        'Use short, metric-driven bullet points (e.g., "Reduced load time by 40%")',
        'Add a Projects or Experience section with 3+ substantive bullet points each'
      ],
      whatToAvoid: [
        'Avoid graphics, tables, or multi-column layouts that confuse ATS parsers',
        'Avoid vague phrasing like "responsible for" — lead with a strong action verb instead'
      ],
      quickWins: [
        'Add 2–3 measurable achievements with numbers or percentages',
        'Make sure contact info (email, phone, LinkedIn, GitHub) is in plain text near the top'
      ]
    }));
  }

  // ─────────────────────────────────────────────────────────────────────────
  // FALLBACK ANALYSIS
  // ─────────────────────────────────────────────────────────────────────────

  createEnhancedFallbackAnalysis(parsedData, detectedDomain, resumeQuality, experienceTimeline, hasJD, jobDescription) {
    const resumeText     = parsedData.raw_text || '';
    const domainKey      = parsedData.detected_domain_key || detectedDomain?.key || null;
    const matchedSkills  = this.matchSkillsAgainstDictionary(parsedData.skills_list || [], resumeText, domainKey);
    const domainSkills   = detectedDomain.template.important_skills || [];
    const matchedDomain  = domainSkills.filter(s => new RegExp(`\\b${s}\\b`, 'i').test(resumeText));

    let { match_score } = this.computeMatchScore(parsedData, detectedDomain, jobDescription, hasJD);
    match_score = Math.min(match_score, 95);

    const atsCompatibility = Math.round(0.6 * resumeQuality.total + 0.4 * match_score);

    let missingSkills = this.identifyMissingDomainSkills(matchedDomain, domainSkills);

    let jdNote = '';
    if (hasJD) {
      const jdLower    = jobDescription.toLowerCase();
      const dictionary = this.getSkillDictionaryForDomain(domainKey);
      const jdKeywords = dictionary.filter(skill => {
        const esc = skill.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        return new RegExp(`\\b${esc}\\b`, 'i').test(jdLower);
      });
      const jdMissing = jdKeywords.filter(skill => {
        const esc = skill.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        return !new RegExp(`\\b${esc}\\b`, 'i').test(resumeText);
      });
      if (jdMissing.length > 0) missingSkills = jdMissing.slice(0, 6);
      jdNote = ' (connect Gemini API for full JD analysis)';
    }

    const structured   = parsedData.structured || {};
    const profExpCount = (structured.experience || []).filter(e => e.type === 'professional').length;
    const projCount    = (structured.projects || []).length;
    const expSummary   = profExpCount > 0
      ? `${experienceTimeline.totalYears} yrs, ${profExpCount} role(s)`
      : projCount > 0
        ? `${projCount} project(s) (student/fresher)`
        : '0 yrs, 0 roles';

    const jd_match_breakdown = this.computeJDBreakdown(
      null, parsedData, detectedDomain, jobDescription, hasJD, match_score
    );

    return {
      ats_score:                atsCompatibility,
      resume_quality_score:     resumeQuality.total,
      resume_quality_breakdown: resumeQuality.breakdown,
      ats_improvements:         this.createFallbackAtsImprovements(resumeQuality, detectedDomain),
      match_score,
      jd_match_breakdown,
      matched_skills:       [...new Set([...matchedSkills, ...matchedDomain])],
      missing_skills:       missingSkills,
      recommendations:      this.generateDomainRecommendations(parsedData, detectedDomain, hasJD),
      strengths:            this.identifyStrengths(parsedData, matchedSkills),
      weaknesses:            this.identifyWeaknesses(parsedData),
      suggested_roles:      this.buildFallbackSuggestedRoles(detectedDomain, match_score),
      summary:              this.generateSummary(parsedData, detectedDomain, experienceTimeline) + jdNote,
      experience_level:     this.determineExperienceLevel(experienceTimeline),
      key_achievements:     this.extractKeyAchievements(parsedData),
      detected_domain:      detectedDomain.name,
      domain_match_score:   detectedDomain.score,
      has_jd:               hasJD,
      experience_summary:   expSummary,
      experience_timeline:  experienceTimeline,
      section_completeness: this.calculateSectionCompleteness(parsedData),
      top_skills:           matchedSkills.slice(0, 5)
    };
  }

  /**
   * Compute jd_match_breakdown sub-scores correctly.
   *
   * PREVIOUS BUG: Used computeMatchScore()._debug which scores the resume
   * against its OWN domain (e.g. software_development), then multiplied by
   * scaleFactor = match_score/100. This meant:
   * - A backend resume vs UX JD: skillsRaw was HIGH (backend skills found in
   * backend domain dict), multiplied by match_score=10/100=0.1, giving ~4/50
   * which looks low BUT is caused by scaling not by actual JD overlap.
   * - Sub-scores didn't independently reflect JD fit. They all moved together
   * as one number, making the breakdown meaningless.
   *
   * FIX: Compute each sub-score independently against the ACTUAL JD content:
   * - skillsMatch: overlap between JD-required skills and resume skills
   * - experienceRelevance: how relevant the resume's projects/work is to JD
   * - educationMatch: whether resume education meets JD education requirement
   * - professionalPresence: GitHub/LinkedIn/portfolio presence
   *
   * When Gemini's output is available, we prefer its granular fields.
   * When in fallback mode, we use JD keyword overlap directly.
   */
  computeJDBreakdown(geminiOutput, parsedData, detectedDomain, jobDescription, hasJD, match_score) {
    const resumeText = parsedData.raw_text || '';
    const contact    = parsedData.contact  || {};
    const structured = parsedData.structured || {};

    // ── 4. Professional Presence (0-10) ─── same regardless of JD ─────────
    let presenceScore = 0;
    if (contact.linkedin)                    presenceScore += 4;
    if (contact.github || contact.portfolio) presenceScore += 4;
    if (parsedData.summary)                  presenceScore += 2;
    presenceScore = Math.min(presenceScore, 10);

    // ── 3. Education Match (0-10) ──────────────────────────────────────────
    // Check whether education meets JD requirements if stated, otherwise
    // give partial credit for having any degree.
    let eduScore = 0;
    const hasDegree = /\b(b\.?tech|bachelor|master|degree|diploma|university|college|institute)\b/i.test(resumeText);
    if (hasDegree) {
      if (hasJD && jobDescription) {
        const jdWantsMasters = /master|mba|m\.tech|phd/i.test(jobDescription);
        const jdWantsBachelors = /bachelor|b\.tech|degree|graduate/i.test(jobDescription);
        const hasMasters = /master|mba|m\.tech|ph\.d/i.test(resumeText);
        const hasBachelors = /bachelor|b\.tech|b\.e\.|degree/i.test(resumeText);
        if (jdWantsMasters && hasMasters) eduScore = 10;
        else if (jdWantsMasters && hasBachelors) eduScore = 6;
        else if (jdWantsBachelors && hasBachelors) eduScore = 9;
        else if (jdWantsBachelors) eduScore = 7;
        else eduScore = 7; // JD doesn't specify — degree = good
      } else {
        eduScore = /master|mba|m\.tech|ph\.d/i.test(resumeText) ? 10 : 8;
      }
    }

    // ── 1. Skills Match (0-50) and 2. Experience Relevance (0-30) ─────────
    // These MUST be computed against the JD's domain, not the resume's domain.
    let skillsScore = 0;
    let expScore    = 0;

    if (hasJD && jobDescription && jobDescription.trim().length > 20) {
      // Detect which domain the JD is for (may differ from resume's domain)
      const jdDomain = domainTemplates.detectDomain(jobDescription);
      const jdDomainKey = jdDomain?.key || null;

      // Use the JD's domain dictionary (not the resume's)
      const jdDictionary = this.getSkillDictionaryForDomain(jdDomainKey);
      const jdText = jobDescription;

      // Skills mentioned in the JD
      const jdRequiredSkills = jdDictionary.filter(skill => {
        const synonyms = this.skillSynonyms[skill] || [];
        return [skill, ...synonyms].some(v => {
          if (v.length < 2) return false;
          try {
            return new RegExp(`\\b${v.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i').test(jdText);
          } catch (_) { return false; }
        });
      });

      if (geminiOutput && Array.isArray(geminiOutput.matched_skills) && geminiOutput.matched_skills.length >= 0) {
        // Prefer Gemini's explicit skill lists when available — they're more
        // accurate than our dictionary matching since Gemini understands semantics
        const geminiMatched  = (geminiOutput.matched_skills || []).length;
        const geminiMissing  = (geminiOutput.missing_skills  || []).length;
        const geminiRequired = (geminiOutput.jd_requirements_extracted?.required_skills || []).length;
        const totalRequired  = geminiRequired > 0 ? geminiRequired : Math.max(geminiMatched + geminiMissing, 1);
        const ratio = geminiMatched / totalRequired;
        skillsScore = Math.round(Math.sqrt(Math.min(ratio, 1)) * 50);

        // Experience relevance from Gemini's matched_requirements
        const metReqs     = (geminiOutput.matched_requirements || []).length;
        const partialReqs = (geminiOutput.partial_requirements || []).length;
        const totalReqs   = Math.max(metReqs + partialReqs + geminiMissing, 1);
        const expRatio    = (metReqs + partialReqs * 0.5) / totalReqs;
        expScore = Math.round(expRatio * 30);
      } else {
        // Fallback: count skills the JD mentions that also appear in resume
        const matchedInResume = jdRequiredSkills.filter(skill => {
          const synonyms = this.skillSynonyms[skill] || [];
          return [skill, ...synonyms].some(v => {
            if (v.length < 2) return false;
            try {
              return new RegExp(`\\b${v.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i').test(resumeText);
            } catch (_) { return false; }
          });
        });
        const skillRatio = jdRequiredSkills.length > 0
          ? matchedInResume.length / jdRequiredSkills.length : 0;
        skillsScore = Math.round(Math.sqrt(skillRatio) * 50);

        // Experience relevance: check if resume's projects/work text overlaps
        // with the JD's domain keywords (NOT the resume's own domain)
        const jdKeywordCount  = jdDomain.matchedKeywords?.length || 0;
        const projExpText = [
          ...(structured.projects   || []).map(p => (typeof p.description === 'string' ? p.description : (p.description || []).join(' '))),
          ...(structured.experience || []).map(e => (typeof e.description === 'string' ? e.description : (e.description || []).join(' ')))
        ].join(' ');
        const jdWordsInExp = (jdDomain.matchedKeywords || []).filter(kw =>
          new RegExp(`\\b${kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i').test(projExpText)
        ).length;
        const expRatio = jdKeywordCount > 0 ? jdWordsInExp / jdKeywordCount : 0;
        expScore = Math.round(expRatio * 30);
      }
    } else {
      // No JD: use resume's own domain for a domain-fit breakdown
      const domainKey   = detectedDomain?.key || null;
      const dictionary  = this.getSkillDictionaryForDomain(domainKey);
      const topSkills   = dictionary.slice(0, 25);
      const matchedCount = topSkills.filter(skill => {
        const synonyms = this.skillSynonyms[skill] || [];
        return [skill, ...synonyms].some(v => {
          if (v.length < 2) return false;
          try {
            return new RegExp(`\\b${v.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i').test(resumeText);
          } catch (_) { return false; }
        });
      }).length;
      skillsScore = Math.round(Math.sqrt(matchedCount / Math.max(topSkills.length, 1)) * 50);

      const profExpCount = (structured.experience || []).filter(e => e.type === 'professional').length;
      const projCount    = (structured.projects   || []).filter(p =>
        (typeof p.description === 'string' && p.description.length > 30) ||
        (Array.isArray(p.description) && p.description.length > 0)
      ).length;
      const hasMetrics = this.metricPatterns.some(p => p.test(resumeText));
      if (profExpCount >= 3)      expScore = 30;
      else if (profExpCount >= 2) expScore = 25;
      else if (profExpCount >= 1) expScore = 20;
      else if (projCount >= 3)    expScore = hasMetrics ? 18 : 14;
      else if (projCount >= 2)    expScore = hasMetrics ? 14 : 10;
      else if (projCount >= 1)    expScore = 7;
    }

    // Clamp all sub-scores to their max values
    return {
      skillsMatch:          Math.min(Math.max(Math.round(skillsScore),  0), 50),
      experienceRelevance:  Math.min(Math.max(Math.round(expScore),     0), 30),
      educationMatch:       Math.min(Math.max(Math.round(eduScore),     0), 10),
      professionalPresence: Math.min(Math.max(Math.round(presenceScore),0), 10),
    };
  }

  buildFallbackSuggestedRoles(detectedDomain, matchScore) {
    if (!detectedDomain || !detectedDomain.template || !Array.isArray(detectedDomain.template.suggested_roles)) {
      return [];
    }
    return detectedDomain.template.suggested_roles.slice(0, 4).map((role, i) => ({
      role,
      fit_score: Math.min(Math.max(matchScore - i * 8, 10), 95),
      reasoning: `Estimated from overlap with core ${detectedDomain.template.name} skills.`
    }));
  }

  sanitizeSuggestedRoles(roles) {
    if (!Array.isArray(roles)) return [];
    return roles
      .filter(r => r && (r.role || typeof r === 'string'))
      .map(r => {
        const role   = typeof r === 'string' ? r : r.role;
        const rawFit = typeof r === 'object' ? r.fit_score : undefined;
        const fit_score = Math.min(Math.max(Math.round(Number(rawFit) || 50), 10), 95);
        return {
          role,
          fit_score,
          reasoning: (typeof r === 'object' && r.reasoning) || ''
        };
      });
  }

  computeMatchScore(parsedData, detectedDomain, jobDescription, hasJD) {
    const resumeText = (parsedData.raw_text || '').toLowerCase();
    const domainKey  = parsedData.detected_domain_key || detectedDomain?.key || null;

    let skillsRaw = 0;
    if (hasJD) {
      const dictionary  = this.getSkillDictionaryForDomain(domainKey);
      const jdText      = jobDescription.toLowerCase();
      const jdKeywords  = dictionary.filter(skill => {
        const esc = skill.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        return new RegExp(`\\b${esc}\\b`, 'i').test(jdText);
      });

      if (jdKeywords.length > 0) {
        const matched = jdKeywords.filter(skill => {
          const esc = skill.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          return new RegExp(`\\b${esc}\\b`, 'i').test(resumeText);
        });
        skillsRaw = Math.round((matched.length / jdKeywords.length) * 25);
      } else {
        skillsRaw = this._domainSkillsScore(resumeText, detectedDomain, 25);
      }
    } else {
      skillsRaw = this._domainSkillsScore(resumeText, detectedDomain, 25);
    }

    let domainRaw = 0;
    const structured   = parsedData.structured || {};
    const profExpCount = (structured.experience || []).filter(e => e.type === 'professional').length;
    const projCount    = (structured.projects   || []).filter(p =>
      (typeof p.description === 'string' && p.description.length > 30) ||
      (Array.isArray(p.description) && p.description.length > 0)
    ).length;
    const hasMetrics   = this.metricPatterns.some(p => p.test(parsedData.raw_text || ''));

    if (profExpCount >= 3)       domainRaw = 10;
    else if (profExpCount >= 1)  domainRaw = 7 + Math.min(profExpCount * 1, 3);
    else if (projCount >= 3)     domainRaw = hasMetrics ? 7 : 6;
    else if (projCount >= 2)     domainRaw = hasMetrics ? 6 : 5;
    else if (projCount >= 1)     domainRaw = 3;
    else                         domainRaw = 0;

    let keywordsRaw = 0;
    const contact = parsedData.contact || {};
    const eduList  = structured.education || [];

    if (eduList.length > 0 || /\b(education|degree|university|college|institute|school)\b/i.test(resumeText)) {
      const hasMasters   = /master|mba|m\.tech|m\.sc|m\.e\.|m\.des|phd|ph\.d/i.test(resumeText);
      const hasBachelors = /bachelor|b\.tech|b\.e\.|b\.sc|b\.a\.|degree|diploma/i.test(resumeText);
      keywordsRaw += hasMasters ? 3 : hasBachelors ? 2 : 1;
    }
    if (contact.linkedin)                    keywordsRaw += 1;
    if (contact.github || contact.portfolio) keywordsRaw += 1;
    keywordsRaw = Math.min(keywordsRaw, 5);

    const rawTotal = skillsRaw + domainRaw + keywordsRaw;
    const total    = Math.round((rawTotal / 40) * 100);

    return {
      match_score: Math.min(Math.max(total, 10), 98),
      _debug: { skillsRaw, domainRaw, keywordsRaw, rawTotal }
    };
  }

  _domainSkillsScore(resumeTextLower, detectedDomain, maxPts) {
    const domainSkills = detectedDomain?.template?.important_skills || [];
    if (domainSkills.length === 0) return Math.round(maxPts * 0.3);
    const matched = domainSkills.filter(s =>
      resumeTextLower.includes(s.toLowerCase())
    ).length;
    return Math.round(Math.sqrt(matched / domainSkills.length) * maxPts);
  }

  get metricPatterns() {
    return [
      /\d+\s*%/, /\d+\s*(users?|clients?)/i, /\$\s*\d+/, /₹\s*\d+/,
      /reduced\s+by\s+\d+/i, /increased\s+by\s+\d+/i,
      /\d+x\s+(faster|improvement|growth)/i, /lpa|lakh/i, /\d+\s*seconds?/i
    ];
  }

  // ─────────────────────────────────────────────────────────────────────────
  // HELPER METHODS
  // ─────────────────────────────────────────────────────────────────────────

  getSkillDictionaryForDomain(domainKey) {
    const techDomains = new Set([
      'software_development', 'data_science', 'cybersecurity', 'qa_testing'
    ]);

    if (!domainKey || !this.domainSkillDictionaries[domainKey]) {
      const all = new Set([
        ...this.techSkillsDictionary,
        ...this.softSkillsDictionary
      ]);
      Object.values(this.domainSkillDictionaries).forEach(list => list.forEach(s => all.add(s)));
      return Array.from(all);
    }

    if (techDomains.has(domainKey)) {
      return [...this.techSkillsDictionary, ...this.softSkillsDictionary];
    }

    return [
      ...(this.domainSkillDictionaries[domainKey] || []),
      ...this.softSkillsDictionary
    ];
  }

  matchSkillsAgainstDictionary(resumeSkills, fullResumeText = '', domainKey = null) {
    const dictionary = this.getSkillDictionaryForDomain(domainKey);
    const matched    = new Set();

    // Pass 1: explicit skill list
    resumeSkills.forEach(skill => {
      const skillLower = skill.toLowerCase().trim();
      dictionary.forEach(dictSkill => {
        if (skillLower === dictSkill.toLowerCase()) { matched.add(dictSkill); return; }
        const synonyms = this.skillSynonyms[dictSkill] || [];
        for (const syn of [dictSkill, ...synonyms]) {
          const synL = syn.toLowerCase();
          if (skillLower === synL || skillLower.includes(synL) || synL.includes(skillLower)) {
            matched.add(dictSkill); return;
          }
        }
      });
      Object.keys(this.skillSynonyms).forEach(canonical => {
        if (!dictionary.includes(canonical)) return;
        for (const syn of this.skillSynonyms[canonical]) {
          const synL = syn.toLowerCase();
          if (skillLower === synL || skillLower.includes(synL) || synL.includes(skillLower)) {
            matched.add(canonical); return;
          }
        }
      });
    });

    // Pass 2: full-text scan (UPDATED Regex engine for strict boundaries)
    if (fullResumeText.trim().length > 0) {
      dictionary.forEach(dictSkill => {
        const synonyms = this.skillSynonyms[dictSkill] || [];
        for (const variation of [dictSkill, ...synonyms]) {
          try {
            let flags = 'i';
            let regexStr = variation.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

            // Strictly case-sensitive for single letter or highly common short words
            if (variation === 'C' || variation === 'R') {
              flags = ''; // Case Sensitive
              regexStr = `\\b${variation}\\b`;
            } 
            // Avoid using standard word boundaries (\b) at the end of symbols (+ or #)
            else if (variation.includes('+') || variation.includes('#')) {
              regexStr = `(?<!\\w)${regexStr}(?![\\w\\+#])`;
            } 
            else {
              regexStr = `\\b${regexStr}\\b`;
            }

            if (new RegExp(regexStr, flags).test(fullResumeText)) { 
              matched.add(dictSkill); 
              break; 
            }
          } catch (_) { /* skip invalid regex */ }
        }
      });
    }

    return Array.from(matched);
  }

  createFallbackStructure(parsedData) {
    const structured = parsedData.structured || {};
    const sections   = parsedData.sections  || {};
    const skillsObj  = structured.skills || sections.skills || {};
    const text       = parsedData.raw_text || '';

    let edu = structured.education || sections.education;
    if (!edu || (Array.isArray(edu) && edu.length === 0)) {
      const eduMatch = text.match(
        /(?:education|academic background)[^\n]*\n([\s\S]{20,600}?)(?=\n(?:skills?|experience|projects?|achievements?|certifications?|summary|$))/i
      );
      edu = eduMatch
        ? eduMatch[1].trim()
        : /\b(b\.?tech|bachelor|master|degree|university|college|institute|cgpa|gpa)\b/i.test(text)
          ? this._extractTextSection(text, /\beducation\b/i, /\b(skills?|experience|projects?|achievements?)\b/i)
          : 'Not provided';
    }

    let exp = structured.experience || sections.experience;
    if (!exp || (Array.isArray(exp) && exp.length === 0)) {
      const expSnippet = this._extractTextSection(
        text,
        /\b(experience|work history|employment|internship)\b/i,
        /\b(education|skills?|projects?|achievements?|certifications?|summary)\b/i
      );
      exp = expSnippet || 'No professional experience listed';
    }

    let proj = structured.projects || sections.projects;
    if (!proj || (Array.isArray(proj) && proj.length === 0)) {
      const projSnippet = this._extractTextSection(
        text,
        /\bprojects?\b/i,
        /\b(education|skills?|experience|achievements?|certifications?|summary)\b/i
      );
      proj = projSnippet || 'Not provided';
    }

    const certs = structured.certifications || sections.certifications;

    return {
      contact:         parsedData.contact || {},
      summary:         structured.summary || parsedData.summary || null,
      tech_skills:     [
        ...(skillsObj.languages  || []),
        ...(skillsObj.frameworks || []),
        ...(skillsObj.databases  || []),
        ...(skillsObj.tools      || []),
        ...(skillsObj.ai_ml      || []),
        ...(skillsObj.cloud      || []),
        ...(skillsObj.other      || [])
      ],
      domain_skills:   skillsObj.domain_skills || [],
      soft_skills:     skillsObj.soft_skills   || [],
      all_skills:      parsedData.skills_list  || [],
      education:       edu,
      experience:      exp,
      projects:        proj,
      certifications:  certs || 'Not provided',
      detected_domain: parsedData.detected_domain_key || null
    };
  }

  _extractTextSection(text, startPattern, endPattern) {
    const lines  = text.split('\n');
    const startI = lines.findIndex(l => startPattern.test(l.trim()));
    if (startI === -1) return null;

    const rest   = lines.slice(startI + 1);
    const endI   = rest.findIndex(l => endPattern.test(l.trim()));
    const block  = (endI === -1 ? rest : rest.slice(0, endI))
      .filter(l => l.trim().length > 0)
      .join('\n')
      .trim();

    return block.length > 20 ? block : null;
  }

  calculateSectionCompleteness(parsedData) {
    const text      = parsedData.raw_text || '';
    const structured = parsedData.structured || {};
    const sections   = parsedData.sections   || {};

    const hasContent = (val) => {
      if (!val) return false;
      if (Array.isArray(val)) return val.length > 0;
      if (typeof val === 'object') return Object.values(val).some(v => v && String(v).trim().length > 0);
      if (typeof val === 'string') return val.trim().length > 10;
      return false;
    };

    const sectionPresent = (keys, regex) => {
      for (const key of keys) {
        const val = structured[key] || sections[key];
        if (hasContent(val)) return true;
      }
      return regex ? regex.test(text) : false;
    };

    const checks = [
      !!(parsedData.contact?.name && parsedData.contact?.email),
      sectionPresent(['education'], /\b(education|b\.?tech|bachelor|master|degree|university|college|institute)\b/i),
      sectionPresent(['skills', 'all_skills'], /\b(skills?|technical skills?|languages?|frameworks?|tools)\b/i),
      sectionPresent(['experience'], /\b(experience|work history|employment|internship)\b/i) ||
      sectionPresent(['projects'],   /\b(projects?|personal projects?|key projects?)\b/i),
      sectionPresent(['summary'], /\b(summary|objective|profile|about me)\b/i),
    ];

    const presentCount = checks.filter(Boolean).length;
    return Math.round((presentCount / checks.length) * 100);
  }

  identifyMissingDomainSkills(matchedSkills, allDomainSkills) {
    return allDomainSkills.filter(s => !matchedSkills.includes(s)).slice(0, 5);
  }

  determineExperienceLevel(timeline) {
    if (timeline.totalYears >= 5) return 'senior';
    if (timeline.totalYears >= 2) return 'mid';
    return 'entry';
  }

  generateSummary(parsedData, detectedDomain, experienceTimeline) {
    const name   = parsedData.contact?.name || 'Candidate';
    const domain = detectedDomain.name;
    const level  = this.determineExperienceLevel(experienceTimeline);
    const years  = experienceTimeline.totalYears;
    const projCount = Array.isArray(parsedData.projects) ? parsedData.projects.length : 0;

    if (level === 'entry') {
      return `${name} is an aspiring ${domain} professional with strong foundational skills and ${projCount} project(s). Shows good potential for growth in the field.`;
    } else if (level === 'mid') {
      return `${name} is a ${domain} professional with ${years} years of experience. Demonstrates solid expertise and steady career progression.`;
    } else {
      return `${name} is a senior ${domain} professional with ${years}+ years of extensive experience. Proven track record with strong leadership capabilities.`;
    }
  }

  generateDomainRecommendations(parsedData, detectedDomain, hasJD) {
    const recs       = [];
    const domainName = detectedDomain.name;

    if (!parsedData.contact?.linkedin)
      recs.push(`Add a LinkedIn profile to increase visibility for ${domainName} recruiters`);

    if (domainName.includes('Software') || domainName.includes('Tech') || domainName.includes('Data')) {
      if (!parsedData.contact?.github)
        recs.push('Add a GitHub profile URL and pin your best repositories');
      const projCount = Array.isArray(parsedData.projects) ? parsedData.projects.length : 0;
      if (projCount < 2)
        recs.push('Add at least 2–3 projects with tech stack, live link, and GitHub repo');
    } else if (domainName.includes('Logistics') || domainName.includes('Supply Chain')) {
      recs.push('Highlight certifications (OSHA, Forklift, ISO) prominently');
      recs.push('Add specific throughput metrics (items/day, error rate, cycle time)');
    } else if (domainName.includes('Marketing')) {
      recs.push('Include campaign KPIs (CTR, conversion rate, ROAS) for each role');
      recs.push('Link to a portfolio or case studies page');
    } else if (domainName.includes('Finance') || domainName.includes('Accounting')) {
      recs.push('List relevant certifications (CPA, CFA, CA) prominently');
      recs.push('Quantify financial impact (e.g., "Managed ₹50Cr portfolio")');
    } else if (domainName.includes('HR') || domainName.includes('Human Resources')) {
      recs.push('Highlight HRIS tools used and number of employees supported');
      recs.push('Add metrics like time-to-hire, retention rate, or headcount managed');
    }

    if (hasJD) {
      recs.push('Tailor your resume summary to mirror the job title and key phrases from the JD');
      recs.push('Add a Skills section that lists every required technology from the JD you know');
    }

    recs.push('Use strong action verbs (Built, Led, Optimised, Delivered) at the start of each bullet');
    recs.push('Add at least 2–3 measurable achievements with numbers (%, ₹, users, time saved)');

    return recs.slice(0, 6);
  }

  identifyStrengths(parsedData, matchedSkills = []) {
    const s = [];
    if (matchedSkills.length > 0)
      s.push(`Strong technical profile with ${matchedSkills.length} relevant skills identified`);
    if (Array.isArray(parsedData.projects) && parsedData.projects.length > 0)
      s.push(`${parsedData.projects.length} practical project(s) demonstrate hands-on experience`);
    if (Array.isArray(parsedData.experience) && parsedData.experience.filter(e => e.type === 'professional').length > 0)
      s.push('Includes professional/internship work experience');
    if (Array.isArray(parsedData.education) && parsedData.education.length > 0)
      s.push('Clear educational background with relevant qualifications');
    if (parsedData.contact?.github || parsedData.contact?.linkedin)
      s.push('Professional profile links provided (GitHub / LinkedIn)');
    return s.length > 0 ? s : ['Resume has a solid foundation — add more details to strengthen it further'];
  }

  identifyWeaknesses(parsedData) {
    const w = [];
    const projCount = Array.isArray(parsedData.projects) ? parsedData.projects.length : 0;
    if (projCount === 0)
      w.push('Add projects showcasing practical skills — even academic or side projects count');
    if (!parsedData.contact?.linkedin)
      w.push('Add a LinkedIn profile URL for better professional visibility');
    if (!parsedData.summary)
      w.push('Include a concise professional summary (3–4 sentences) tailored to your target role');
    return w.length > 0 ? w : ['Your resume covers most essential sections — focus on quantifying achievements'];
  }

  extractKeyAchievements(parsedData) {
    const achievements = [];
    if (parsedData.structured?.experience) {
      parsedData.structured.experience.forEach(exp => {
        if (exp.description && typeof exp.description === 'string' && exp.description.length > 10)
          achievements.push(exp.description.split('.')[0]);
        if (Array.isArray(exp.description) && exp.description.length > 0)
          achievements.push(exp.description[0]);
      });
    }
    if (parsedData.structured?.projects) {
      parsedData.structured.projects.slice(0, 2).forEach(proj => {
        if (proj.name) achievements.push(`Built ${proj.name}`);
      });
    }
    return achievements.filter(Boolean).slice(0, 4);
  }
}

module.exports = new AIAnalyzer();