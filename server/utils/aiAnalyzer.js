const { GoogleGenerativeAI } = require('@google/generative-ai');
const domainTemplates = require('./domainTemplates');
const atsCalculator   = require('./atsCalculator');
const metrics         = require('./metrics');

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
      // No key configured — serve the built-in analyzer instead of failing.
      console.warn('GEMINI_API_KEY not configured — using built-in analyzer.');
      return this.createEnhancedFallbackAnalysis(
        parsedData, detectedDomain, resumeQuality, experienceTimeline, hasJD, jobDescription
      );
    }

    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: 'models/gemini-2.5-flash-lite' });

      const prompt = hasJD
        ? this.createJDMatchPrompt(parsedData, jobDescription, detectedDomain)
        : this.createDomainAwarePrompt(parsedData, detectedDomain);

      // ── Fire both Gemini calls in parallel ──────────────────────────────────
      // Call #1 (main analysis) and Call #2 (ATS improvements) are independent —
      // no reason to wait for #1 to finish before starting #2.
      // Wall-clock time = max(call1, call2) instead of call1 + call2.
      console.log(`      🚀 [Gemini] Firing both calls in parallel (${hasJD ? 'JD-match' : 'domain-aware'} mode)...`);
      const parallelStart = Date.now();

      const [rawText, atsImprovements] = await Promise.all([

        // ── Call #1: main resume analysis (gemini-2.5-flash-lite) ─────────────
        (async () => {
          const t = Date.now();
          console.log(`      🤖 [Gemini #1] Main analysis starting...`);
          const result   = await this._callWithRetry(() => model.generateContent(prompt));
          const response = await result.response;
          const call1Ms  = Date.now() - t;
          metrics.record('gemini_call1_ms', call1Ms);
          console.log(`      ✅ [Gemini #1] Main analysis took: ${call1Ms} ms`);
          return response.text();
        })(),

        // ── Call #2: ATS improvement cards (gemini-3.5-flash-lite) ────────────
        // Uses a lighter, faster model — this task is simpler (structured cards)
        // so quality is identical at a fraction of the latency.
        (async () => {
          const t = Date.now();
          console.log(`      🤖 [Gemini #2] ATS improvements starting (flash-lite)...`);
          try {
            const improvements = await this.generateAtsImprovements(
              parsedData, resumeQuality, detectedDomain, jobDescription, apiKey
            );
            const call2Ms = Date.now() - t;
            metrics.record('gemini_call2_ms', call2Ms);
            console.log(`      ✅ [Gemini #2] ATS improvements took: ${call2Ms} ms`);
            return improvements;
          } catch (e) {
            // Non-critical — fall back to built-in cards so the section never renders empty.
            console.error('ATS improvements generation failed (non-fatal):', e.message);
            return this.createFallbackAtsImprovements(resumeQuality, detectedDomain, parsedData);
          }
        })(),

      ]);

      console.log(`      ⏱️  [Parallel] Both calls done in: ${Date.now() - parallelStart} ms (wall-clock)`);

      let analysisData;
      try {
        const jsonParseStart = Date.now();
        const cleaned = rawText.trim().replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
        analysisData  = JSON.parse(cleaned);
        console.log(`      ✅ [Parse]    JSON parse took: ${Date.now() - jsonParseStart} ms`);
      } catch (parseErr) {
        console.error('JSON parse error from Gemini:', parseErr.message);
        throw new Error('Gemini returned an unexpected response. Please try again.');
      }

      let match_score;
      {
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

      const structured = parsedData.structured || {};
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
      console.error('Gemini API error — switching to built-in analyzer:', err.message);
      // Seamless fallback: build a full analysis with the SAME response shape and
      // quality signals so the user's experience is uninterrupted and consistent.
      return this.createEnhancedFallbackAnalysis(
        parsedData, detectedDomain, resumeQuality, experienceTimeline, hasJD, jobDescription
      );
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // ATS IMPROVEMENT CARDS
  // ─────────────────────────────────────────────────────────────────────────

  async generateAtsImprovements(parsedData, resumeQuality, detectedDomain, jobDescription, apiKey) {
    const genAI = new GoogleGenerativeAI(apiKey);
    // gemini-3.5-flash-lite: fast and cheap for this simpler structured task.
    // Since this call now runs in parallel with the main analysis, keeping it fast
    // ensures it never becomes the bottleneck.
    const model = genAI.getGenerativeModel({ model: 'models/gemini-3.5-flash-lite' });

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

  createFallbackAtsImprovements(resumeQuality, detectedDomain, parsedData = null) {
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

    return selected.map(area => {
      const advice = this._atsAdviceForArea(area.key, parsedData, detectedDomain, resumeQuality);
      return {
        area:        areaLabels[area.key] || area.key,
        score:       area.score,
        maxScore:    area.maxScore,
        priority:    area.ratio < 0.4 ? 'high' : area.ratio < 0.7 ? 'medium' : 'low',
        whatToAdd:   advice.whatToAdd,
        whatToAvoid: advice.whatToAvoid,
        quickWins:   advice.quickWins
      };
    });
  }

  // Produce DISTINCT, area-specific ATS advice. Each area (contact, sections,
  // formatting, action verbs, experience depth) gets its own guidance, and the
  // content adapts to the resume's actual signals (missing links, project count,
  // presence of metrics, domain) so two different resumes never get identical cards.
  _atsAdviceForArea(areaKey, parsedData, detectedDomain, resumeQuality) {
    const pd        = parsedData || {};
    const contact   = pd.contact || {};
    const text      = pd.raw_text || '';
    const domainName = (detectedDomain && detectedDomain.name) || '';
    const isTech    = /software|engineering|data|tech|cyber|qa|developer/i.test(domainName)
                      || ['software_development', 'data_science', 'cybersecurity', 'qa_testing']
                           .includes((detectedDomain && detectedDomain.key) || '');
    const projCount = this._projectCount(pd);
    const profExp   = Array.isArray(pd.structured?.experience)
      ? pd.structured.experience.filter(e => e.type === 'professional').length : 0;
    const hasMetrics = this.metricPatterns.some(p => p.test(text));
    const trim = (arr, min) => {
      const out = arr.filter(Boolean);
      return out.length >= min ? out : out;
    };

    switch (areaKey) {
      case 'contact': {
        const whatToAdd = [];
        if (!contact.email)                         whatToAdd.push('Add a professional email address in plain text near the top');
        if (!contact.phone)                         whatToAdd.push('Add a phone number so recruiters can reach you directly');
        if (!contact.linkedin)                      whatToAdd.push('Add your LinkedIn profile URL to boost recruiter visibility');
        if (isTech && !contact.github)              whatToAdd.push('Add your GitHub URL and pin 2–3 of your best repositories');
        if (isTech && !contact.portfolio)           whatToAdd.push('Link a portfolio or personal site if you have one');
        if (whatToAdd.length === 0)                 whatToAdd.push('Keep all contact details on one plain-text line at the very top');
        if (whatToAdd.length < 3)                   whatToAdd.push('Include your city/location to clarify time-zone and relocation fit');
        return {
          whatToAdd: whatToAdd.slice(0, 5),
          whatToAvoid: [
            'Avoid placing contact details inside the header/footer — many ATS parsers skip those regions',
            'Avoid icons or images for email/phone; use selectable plain text instead'
          ],
          quickWins: [
            'Use a firstname.lastname@ style email rather than a nickname',
            'Make every link a full clickable URL (https://…), not just display text'
          ]
        };
      }
      case 'sections': {
        const whatToAdd = [];
        if (!pd.summary && !(pd.structured && pd.structured.summary))
          whatToAdd.push('Add a 2–3 line professional summary tailored to your target role');
        if (projCount < 2)
          whatToAdd.push('Add a dedicated Projects section with 2–3 entries (problem, tech, result)');
        whatToAdd.push('Ensure conventional sections are present: Summary, Skills, Experience, Projects, Education');
        if (isTech)
          whatToAdd.push('Add a Technical Skills section grouped by category (Languages, Frameworks, Tools)');
        else
          whatToAdd.push('Add a Certifications section if you hold any role-relevant credentials');
        return {
          whatToAdd: whatToAdd.slice(0, 5),
          whatToAvoid: [
            'Avoid creative section names ("My Journey") — ATS looks for standard headings',
            'Avoid burying key sections below less relevant ones'
          ],
          quickWins: [
            'Use clear, bold or ALL-CAPS headings for each section',
            'Order sections by relevance to the role you are applying for'
          ]
        };
      }
      case 'formatting': {
        return {
          whatToAdd: [
            'Use a clean single-column layout with a standard font (Arial, Calibri, Times)',
            'Use consistent date formats (e.g., Jan 2023 – Present) throughout',
            'Submit a text-based PDF (selectable text), not a scanned image or screenshot'
          ],
          whatToAvoid: [
            'Avoid tables, text boxes, multi-column layouts, and graphics — they break ATS parsing',
            'Avoid images of text and decorative fonts that parsers cannot read'
          ],
          quickWins: [
            'Paste your resume into plain text to preview exactly what the ATS will see',
            'Keep font sizes, spacing, and bullet styles consistent across the document'
          ]
        };
      }
      case 'actionVerbs': {
        const whatToAdd = [
          'Start every bullet with a strong action verb (Built, Led, Optimised, Automated, Delivered)',
          'Quantify impact with concrete numbers (%, ₹/$, users, time saved, throughput)'
        ];
        if (!hasMetrics)
          whatToAdd.push('Add at least 3 measurable results across your experience and projects');
        else
          whatToAdd.push('Extend metrics to more bullets — aim for a number in most achievement lines');
        return {
          whatToAdd: whatToAdd.slice(0, 5),
          whatToAvoid: [
            'Avoid passive phrasing like "responsible for" or "worked on"',
            'Avoid unquantified claims such as "improved performance" with no figure'
          ],
          quickWins: [
            'Rewrite your top 3 bullets as: action verb + what you did + measurable result',
            'Replace duty descriptions with achievements (what changed because of you)'
          ]
        };
      }
      case 'experienceDepth':
      default: {
        const whatToAdd = [];
        if (profExp === 0 && projCount > 0)
          whatToAdd.push('Expand each project into 2–3 bullets covering problem, approach, tech stack, and result');
        else if (profExp > 0)
          whatToAdd.push('Add 3–4 outcome-focused bullets per role rather than one-line summaries');
        else
          whatToAdd.push('Add internships, freelance, or substantial academic projects to show hands-on work');
        whatToAdd.push('Include scope signals — team size, scale, number of users, or data volume');
        if (isTech)
          whatToAdd.push('State the tech stack used in each role or project explicitly');
        return {
          whatToAdd: whatToAdd.slice(0, 5),
          whatToAvoid: [
            'Avoid single-line entries that list a title with no supporting detail',
            'Avoid listing responsibilities without the outcome or impact'
          ],
          quickWins: [
            'Add metrics to your most recent role or project first — that is what gets read',
            'Trim older or irrelevant entries to make room for depth on recent work'
          ]
        };
      }
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // FALLBACK ANALYSIS
  // ─────────────────────────────────────────────────────────────────────────

  // ───────────────────────────────────────────────────────────────────────
  // RESILIENCE HELPERS (retry + transient-error detection)
  // ───────────────────────────────────────────────────────────────────────

  _sleep(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }

  _isTransientGeminiError(err) {
    const msg    = (err && (err.message || String(err)) || '').toLowerCase();
    const status = Number(err && (err.status || err.statusCode || err.code));
    if ([429, 500, 502, 503, 504].includes(status)) return true;
    return /quota|rate[\s-]?limit|overload|temporarily|timeout|timed out|unavailable|try again|deadline|503|429/.test(msg);
  }

  // Run an async Gemini call with one retry on transient (rate-limit / overload)
  // errors. Hard failures (or quota fully exhausted) fall through to the caller,
  // which serves the built-in analyzer.
  // delayMs defaults to 15 000 ms — Gemini 429 responses ask for ~13 s wait.
  async _callWithRetry(fn, retries = 1, delayMs = 15_000) {
    let lastErr;
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        return await fn();
      } catch (err) {
        lastErr = err;
        if (attempt < retries && this._isTransientGeminiError(err)) {
          // Try to honour the retryDelay hint embedded in the 429 body (e.g. "13s").
          const retryMatch = (err.message || '').match(/retry(?:Delay|After)["\s:]+(\d+)s/i);
          const actualDelay = retryMatch ? (Number(retryMatch[1]) + 2) * 1000 : delayMs;
          console.warn(`Gemini transient error (attempt ${attempt + 1}/${retries + 1}) — retrying in ${actualDelay}ms: ${err.message}`);
          metrics.increment('jobs_retried'); // ← track every Gemini retry
          await this._sleep(actualDelay);
          continue;
        }
        throw err;
      }
    }
    throw lastErr;
  }

  // ───────────────────────────────────────────────────────────────────────
  // JD PARSING HELPERS (used by the built-in analyzer)
  // ───────────────────────────────────────────────────────────────────────

  // Robust presence check for a skill (with synonyms) inside arbitrary text.
  skillPresentInText(skill, text) {
    if (!skill || !text) return false;
    const variations = [skill, ...(this.skillSynonyms[skill] || [])];
    for (const v of variations) {
      if (!v || v.length < 1) continue;
      try {
        let flags = 'i';
        let pattern;
        if (v === 'C' || v === 'R') {            // single-letter langs: case-sensitive
          flags = '';
          pattern = `\\b${v}\\b`;
        } else {
          const esc = v.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          if (v.includes('+') || v.includes('#')) pattern = `(?<!\\w)${esc}(?![\\w+#])`;
          else                                    pattern = `\\b${esc}\\b`;
        }
        if (new RegExp(pattern, flags).test(text)) return true;
      } catch (_) { /* skip invalid regex */ }
    }
    return false;
  }

  // Collapse near-duplicate skill variants (e.g. HTML/HTML5, CSS/CSS3) to their
  // canonical form so the displayed list reads cleanly, like an AI would write it.
  _dedupeSkillVariants(skills) {
    const dropped = new Set();
    for (const canonical of skills) {
      const syns = (this.skillSynonyms[canonical] || []).map(x => x.toLowerCase());
      for (const other of skills) {
        if (other === canonical) continue;
        if (syns.includes(other.toLowerCase())) dropped.add(other);
      }
    }
    return skills.filter(s => !dropped.has(s));
  }

  // Extract the skills a JD asks for, split into required vs preferred.
  extractJdSkills(jobDescription, jdKey) {
    const dictionary = this.getSkillDictionaryForDomain(jdKey);
    const present    = dictionary.filter(s => this.skillPresentInText(s, jobDescription));

    // Split on a "preferred / nice-to-have / bonus" marker if one exists.
    const lower    = jobDescription.toLowerCase();
    const prefIdx  = lower.search(/nice[\s-]*to[\s-]*have|preferred|good to have|bonus|a plus|plus[:,]/);

    let required  = present;
    let preferred = [];
    if (prefIdx !== -1) {
      const prefSection = jobDescription.slice(prefIdx);
      preferred = present.filter(s => this.skillPresentInText(s, prefSection));
      required  = present.filter(s => !preferred.includes(s));
    }
    if (required.length === 0) required = present;   // never end up with an empty required list

    return { required: [...new Set(required)], preferred: [...new Set(preferred)] };
  }

  extractJdExperience(jobDescription) {
    const m = jobDescription.match(/\d+\s*\+?\s*(?:to|-|–)?\s*\d*\s*(?:years?|yrs?)[^.\n]*/i);
    if (m) {
      let phrase = m[0].replace(/\s+/g, ' ').trim();
      if (phrase.length > 70) phrase = phrase.slice(0, 70).replace(/\s+\S*$/, '').trim();
      return phrase;
    }
    if (/entry[\s-]?level|fresher|graduate|no experience/i.test(jobDescription)) return 'Entry-level / fresher friendly';
    return 'Not explicitly specified';
  }

  extractJdEducation(jobDescription) {
    if (/master|m\.?tech|mba|ph\.?\s?d/i.test(jobDescription)) return "Master's degree or equivalent preferred";
    if (/bachelor|b\.?tech|b\.?e\b|degree|graduate|undergraduate/i.test(jobDescription)) return "Bachelor's degree in a relevant field";
    return 'Not explicitly specified';
  }

  extractJdRoleTitle(jobDescription) {
    const patterns = [
      /(?:job title|position|role)\s*[:\-]\s*([A-Z][A-Za-z0-9/&+ ]{2,40})/i,
      /(?:hiring|seeking|looking for|recruiting)\s+(?:an?\s+)?([A-Z][A-Za-z0-9/&+ ]{2,40}?)(?:\s+(?:to|who|with|that|for|in|at)\b|[.,\n])/,
      /^\s*([A-Z][A-Za-z0-9/&+ ]{2,40}?)(?:\s*[-–|]\s|\n)/
    ];
    for (const p of patterns) {
      const m = jobDescription.match(p);
      if (m && m[1]) {
        const t = m[1].trim().replace(/\s+/g, ' ');
        if (t.length >= 3 && t.length <= 45) return t;
      }
    }
    return null;
  }

  // In the built-in analyzer, suggest exactly TWO roles so the list is meaningful
  // and resume-specific (the old behaviour listed the same four domain roles for
  // every resume/JD):
  //   1. The TARGET role from the JD, scored by the JD match.
  //   2. The candidate's OWN strongest role (from the resume's detected domain),
  //      scored by how well the resume fits its native domain.
  buildJdSuggestedRoles(jobDescription, jdDomain, detectedDomain, matchScore, parsedData) {
    const jdTitle = this.extractJdRoleTitle(jobDescription || '')
      || (jdDomain && jdDomain.template && jdDomain.template.suggested_roles && jdDomain.template.suggested_roles[0])
      || (jdDomain && jdDomain.name)
      || 'Target Role';

    const roles = [{
      role:      jdTitle,
      fit_score: Math.min(Math.max(Math.round(matchScore), 5), 95),
      reasoning: 'Match against the responsibilities and skills described in the job description.'
    }];

    // The candidate's strongest native role from the RESUME's own domain.
    const nativeRoles = (detectedDomain && detectedDomain.template && detectedDomain.template.suggested_roles) || [];
    const nativeRole  = nativeRoles.find(r => r && r.toLowerCase() !== jdTitle.toLowerCase());

    if (nativeRole) {
      // Score the native role by how many of its domain's CONCRETE core skills the
      // resume actually contains. This varies per resume and reflects genuine
      // domain strength (unlike scoring against the template's abstract categories).
      const resumeText = (parsedData && parsedData.raw_text) || '';
      const reprNative = this._representativeSkillsForDomain(
        detectedDomain && detectedDomain.key, detectedDomain && detectedDomain.template
      );
      const presentCount = reprNative.filter(s => this.skillPresentInText(s, resumeText)).length;
      const ratio = reprNative.length ? presentCount / reprNative.length : 0.5;
      let nativeFit = 40 + ratio * 55;          // 40 (base) … 95 (all core skills present)
      nativeFit = Math.min(Math.max(Math.round(nativeFit), 10), 95);

      roles.push({
        role:      nativeRole,
        fit_score: nativeFit,
        reasoning: "Your resume's strongest native role, based on your existing skills and experience."
      });
    }

    return roles;
  }

  // Concrete, domain-appropriate skills used to backfill a JD that doesn't spell
  // out skill names. Tech domains use a curated list (their template's
  // important_skills are abstract categories); other domains derive from the
  // template's important_skills (splitting combined entries like "SEO/SEM").
  _representativeSkillsForDomain(domainKey, jdTemplate) {
    const techCurated = {
      software_development: ['JavaScript', 'React', 'Node.js', 'TypeScript', 'Python', 'SQL', 'REST API', 'Git', 'Docker', 'AWS'],
      data_science:        ['Python', 'Pandas', 'NumPy', 'SQL', 'Machine Learning', 'Scikit-learn', 'TensorFlow', 'Data Visualization', 'Statistics', 'Deep Learning'],
      cybersecurity:       ['Network Security', 'Linux', 'Python', 'SIEM', 'Penetration Testing', 'Firewalls', 'Incident Response', 'Encryption', 'Vulnerability Assessment'],
      qa_testing:          ['Selenium', 'Test Automation', 'Manual Testing', 'JIRA', 'API Testing', 'Cypress', 'Regression Testing', 'Postman', 'SQL']
    };
    if (techCurated[domainKey]) return techCurated[domainKey];

    const fromTemplate = ((jdTemplate && jdTemplate.important_skills) || [])
      .flatMap(s => String(s).split('/'))
      .map(s => s.trim())
      .filter(s => s.length > 1 && !this.softSkillsDictionary.includes(s));
    if (fromTemplate.length >= 4) return [...new Set(fromTemplate)].slice(0, 12);

    return this.getSkillDictionaryForDomain(domainKey)
      .filter(s => s.length > 1 && s !== 'C' && s !== 'R' && !this.softSkillsDictionary.includes(s))
      .slice(0, 10);
  }

  createEnhancedFallbackAnalysis(parsedData, detectedDomain, resumeQuality, experienceTimeline, hasJD, jobDescription) {
    const resumeText = parsedData.raw_text || '';
    const domainKey  = parsedData.detected_domain_key || detectedDomain?.key || null;

    // Skills the resume actually contains (deduped against the dictionary).
    const resumeMatched = this.matchSkillsAgainstDictionary(parsedData.skills_list || [], resumeText, domainKey);

    let matched_skills = [];
    let missing_skills = [];
    let jd_requirements_extracted = null;
    let matched_requirements = [];
    let partial_requirements = [];
    let jdDomain = null;

    if (hasJD && jobDescription && jobDescription.trim().length > 2) {
      // ── JD MODE ── only surface skills that the JD actually asks for. This
      // prevents the "too many matched skills" problem: we never dump the whole
      // resume dictionary, only the intersection of (JD requirements) ∩ (resume).
      jdDomain = domainTemplates.detectDomain(jobDescription);
      const jdKey = jdDomain?.key || null;
      let { required, preferred } = this.extractJdSkills(jobDescription, jdKey);

      // Some JDs are written in prose and never spell out concrete skill names.
      // extractJdSkills then returns little/nothing, which would leave the Skills
      // Analysis section empty. Backfill with the JD domain's core skills so the
      // matched/missing lists are always meaningful (mirrors what Gemini infers).
      if (required.length < 3) {
        const repr = this._representativeSkillsForDomain(jdKey, jdDomain && jdDomain.template);
        required = [...new Set([...required, ...repr])].slice(0, 12);
      }

      const reqMatched  = required.filter(s => this.skillPresentInText(s, resumeText));
      const prefMatched = preferred.filter(s => this.skillPresentInText(s, resumeText));
      matched_skills = this._dedupeSkillVariants([...new Set([...reqMatched, ...prefMatched])]).slice(0, 12);
      missing_skills = required.filter(s => !this.skillPresentInText(s, resumeText)).slice(0, 6);

      jd_requirements_extracted = {
        required_skills:     required,
        preferred_skills:    preferred,
        experience_required: this.extractJdExperience(jobDescription),
        education_required:  this.extractJdEducation(jobDescription),
        soft_skills:         this.softSkillsDictionary
                               .filter(s => this.skillPresentInText(s, jobDescription))
                               .slice(0, 5)
      };
      matched_requirements = reqMatched.map(s => `${s} — required by the role and present in the resume`);
      partial_requirements = prefMatched.map(s => `${s} — listed as a nice-to-have and present in the resume`);
    } else {
      // ── DOMAIN-FIT MODE (no JD) ── show the resume's strongest domain-relevant
      // skills, capped to a realistic count, plus high-impact domain gaps.
      // Use the STRICT matcher (skillPresentInText) rather than the loose
      // substring matcher so we never surface false positives like "C"/"R"/"Go"
      // (which "css"/"react"/"mongodb" would otherwise trigger via substrings).
      const domainSkills = detectedDomain?.template?.important_skills || [];
      const dictionary   = this.getSkillDictionaryForDomain(domainKey);
      const presentSet    = new Set(dictionary.filter(s => this.skillPresentInText(s, resumeText)));
      // Also honour explicitly-listed skills that resolve to a dictionary entry.
      (resumeMatched || []).forEach(s => { if (this.skillPresentInText(s, resumeText)) presentSet.add(s); });
      const present = Array.from(presentSet);
      // Prioritise domain-important skills first for relevance.
      const prioritised = [
        ...domainSkills.filter(s => present.includes(s)),
        ...present.filter(s => !domainSkills.includes(s))
      ];
      matched_skills = this._dedupeSkillVariants([...new Set(prioritised)]).slice(0, 12);
      // Missing skills must be CONCRETE and CONTEXTUALLY RELEVANT (e.g. "Docker",
      // "TypeScript", "System Design") — never the template's abstract category
      // labels ("Frameworks", "Databases"), and never just the first alphabetical
      // languages in the dictionary ("C++", "Rust"). For tech domains we draw from
      // a curated high-impact pool first so the gaps read like a real AI's advice.
      const matchedLower = new Set(matched_skills.map(s => s.toLowerCase()));
      const isAbsent = s =>
        s && s.length > 1 && s !== 'C' && s !== 'R' &&
        !matchedLower.has(s.toLowerCase()) &&
        !this.softSkillsDictionary.includes(s) &&
        !this.skillPresentInText(s, resumeText);

      const techDomainKeys = ['software_development', 'data_science', 'cybersecurity', 'qa_testing'];
      const highImpactTech = [
        'TypeScript', 'Docker', 'AWS', 'Kubernetes', 'CI/CD', 'System Design',
        'REST API', 'GraphQL', 'Testing', 'Microservices', 'PostgreSQL', 'Redis',
        'Next.js', 'GitHub Actions', 'Machine Learning', 'Pandas', 'NumPy',
        'TensorFlow', 'SQL', 'Linux'
      ];

      let gapPool = [];
      if (techDomainKeys.includes(domainKey)) {
        gapPool = highImpactTech.filter(isAbsent);
      }
      // Top up (or fully populate, for non-tech domains) from the domain dictionary.
      if (gapPool.length < 5) {
        const extra = dictionary.filter(s => isAbsent(s) && !gapPool.includes(s));
        gapPool = [...gapPool, ...extra];
      }
      missing_skills = this._dedupeSkillVariants(gapPool).slice(0, 5);
    }

    // Build the breakdown from the SAME skill lists shown to the user, so the
    // headline number and the displayed skills can never contradict each other.
    const breakdownInput = hasJD
      ? { matched_skills, missing_skills, jd_requirements_extracted, matched_requirements, partial_requirements }
      : null;

    const jd_match_breakdown = this.computeJDBreakdown(
      breakdownInput, parsedData, detectedDomain, jobDescription, hasJD, 0
    );

    // Headline match score == the sum of the four breakdown sub-scores, so the
    // number shown in the card header always agrees with the bars beneath it
    // (the breakdown card renders in both JD and domain-fit modes).
    let match_score = jd_match_breakdown.skillsMatch
                    + jd_match_breakdown.experienceRelevance
                    + jd_match_breakdown.educationMatch
                    + jd_match_breakdown.professionalPresence;
    match_score = Math.min(Math.max(Math.round(match_score), 5), 95);

    const atsCompatibility = Math.round(0.6 * resumeQuality.total + 0.4 * match_score);

    const structured   = parsedData.structured || {};
    const profExpCount = (structured.experience || []).filter(e => e.type === 'professional').length;
    const projCount    = (structured.projects || []).length;
    const expSummary   = profExpCount > 0
      ? `${experienceTimeline.totalYears} yrs, ${profExpCount} role(s)`
      : projCount > 0
        ? `${projCount} project(s) (student/fresher)`
        : '0 yrs, 0 roles';

    const suggested_roles = hasJD
      ? this.buildJdSuggestedRoles(jobDescription, jdDomain, detectedDomain, match_score, parsedData)
      : this.buildFallbackSuggestedRoles(detectedDomain, match_score);

    const result = {
      match_score,
      ats_score:                atsCompatibility,
      resume_quality_score:     resumeQuality.total,
      resume_quality_breakdown: resumeQuality.breakdown,
      ats_improvements:         this.createFallbackAtsImprovements(resumeQuality, detectedDomain, parsedData),
      jd_match_breakdown,
      matched_skills,
      missing_skills,
      recommendations:      this.generateDomainRecommendations(parsedData, detectedDomain, hasJD, missing_skills),
      strengths:            this.identifyStrengths(parsedData, matched_skills, hasJD),
      weaknesses:           this.identifyWeaknesses(parsedData, missing_skills, hasJD),
      suggested_roles,
      summary:              this.generateSummary(parsedData, detectedDomain, experienceTimeline, hasJD, match_score, jdDomain),
      experience_level:     this.determineExperienceLevel(experienceTimeline),
      key_achievements:     this.extractKeyAchievements(parsedData),
      detected_domain:      detectedDomain.name,
      domain_match_score:   detectedDomain.score,
      has_jd:               hasJD,
      experience_summary:   expSummary,
      experience_timeline:  experienceTimeline,
      section_completeness: this.calculateSectionCompleteness(parsedData),
      top_skills:           matched_skills.slice(0, 5)
    };

    if (hasJD) {
      // Include the JD-specific fields so the response shape exactly matches the
      // Gemini JD-match output (the frontend and downstream code see no difference).
      result.jd_requirements_extracted = jd_requirements_extracted;
      result.matched_requirements      = matched_requirements;
      result.partial_requirements      = partial_requirements;
    }

    return result;
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
    const hasDegree = /\b(b\.?tech|m\.?tech|b\.?e|bachelor|master|degree|diploma|university|college|institute)\b/i.test(resumeText);
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

  // Count projects from either the top-level or structured representation so the
  // built-in analyzer never under-reports (e.g. saying "0 projects" when the
  // parser placed them under structured.projects).
  _projectCount(parsedData) {
    const top = Array.isArray(parsedData.projects) ? parsedData.projects.length : 0;
    const structured = Array.isArray(parsedData.structured?.projects) ? parsedData.structured.projects.length : 0;
    return Math.max(top, structured);
  }

  generateSummary(parsedData, detectedDomain, experienceTimeline, hasJD = false, matchScore = null, jdDomain = null) {
    const name   = parsedData.contact?.name || 'Candidate';
    const domain = detectedDomain.name;
    const level  = this.determineExperienceLevel(experienceTimeline);
    const years  = experienceTimeline.totalYears;
    const projCount = this._projectCount(parsedData);

    // JD-specific summary: reads as a recruiter-style fit assessment.
    if (hasJD && matchScore != null) {
      const targetName = (jdDomain && jdDomain.name) || domain;
      const fit = matchScore >= 75 ? 'a strong fit'
                : matchScore >= 55 ? 'a solid fit'
                : matchScore >= 40 ? 'a partial fit'
                : 'an emerging fit';
      const tail = matchScore >= 60
        ? 'Core requirements are largely met; a few targeted additions would further strengthen the application.'
        : 'Closing a handful of key skill gaps would materially improve alignment with this role.';
      return `${name} is ${fit} for this ${targetName} role, bringing ${level}-level ${domain.toLowerCase()} experience${years > 0 ? ` (${years}+ years)` : ''} and ${projCount} project(s). ${tail}`;
    }

    if (level === 'entry') {
      return `${name} is an aspiring ${domain} professional with strong foundational skills and ${projCount} project(s). Shows good potential for growth in the field.`;
    } else if (level === 'mid') {
      return `${name} is a ${domain} professional with ${years} years of experience. Demonstrates solid expertise and steady career progression.`;
    } else {
      return `${name} is a senior ${domain} professional with ${years}+ years of extensive experience. Proven track record with strong leadership capabilities.`;
    }
  }

  generateDomainRecommendations(parsedData, detectedDomain, hasJD, missingSkills = []) {
    const recs       = [];
    const domainName = detectedDomain.name;

    // Lead with the most impactful, role-specific advice when a JD is present.
    if (hasJD && Array.isArray(missingSkills) && missingSkills.length > 0) {
      const top = missingSkills.slice(0, 4).join(', ');
      recs.push(`Surface the role's key requirements — ${top} — in your skills section and back them with concrete project or work bullets where you have genuine exposure`);
    }

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

    return [...new Set(recs)].slice(0, 6);
  }

  identifyStrengths(parsedData, matchedSkills = [], hasJD = false) {
    const s = [];
    if (hasJD && matchedSkills.length > 0)
      s.push(`Resume already covers ${matchedSkills.length} of the role's key skills, including ${matchedSkills.slice(0, 3).join(', ')}`);
    else if (matchedSkills.length > 0)
      s.push(`Strong technical profile with ${matchedSkills.length} relevant skills, including ${matchedSkills.slice(0, 3).join(', ')}`);
    const projCount = this._projectCount(parsedData);
    if (projCount > 0)
      s.push(`${projCount} practical project(s) demonstrate hands-on experience`);
    if (Array.isArray(parsedData.experience) && parsedData.experience.filter(e => e.type === 'professional').length > 0)
      s.push('Includes professional/internship work experience');
    if (Array.isArray(parsedData.education) && parsedData.education.length > 0)
      s.push('Clear educational background with relevant qualifications');
    if (parsedData.contact?.github || parsedData.contact?.linkedin)
      s.push('Professional profile links provided (GitHub / LinkedIn)');
    return s.length > 0 ? s : ['Resume has a solid foundation — add more details to strengthen it further'];
  }

  identifyWeaknesses(parsedData, missingSkills = [], hasJD = false) {
    const w = [];
    if (hasJD && Array.isArray(missingSkills) && missingSkills.length > 0)
      w.push(`The role emphasises ${missingSkills.slice(0, 3).join(', ')}, which are not clearly evidenced in the resume`);
    const projCount = this._projectCount(parsedData);
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