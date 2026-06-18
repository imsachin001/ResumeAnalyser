const { GoogleGenerativeAI } = require('@google/generative-ai');
const domainTemplates = require('./domainTemplates');
const atsCalculator   = require('./atsCalculator');

/**
 * AIAnalyzer
 *
 * FIXES:
 * 1. JD-specific analysis: when a JD is provided, a dedicated prompt
 *    (createJDMatchPrompt) is used instead of the generic domain prompt.
 *    It extracts every requirement from the JD, cross-references them
 *    explicitly against the resume, and builds missing_skills /
 *    recommendations from ONLY what the JD asks for.
 *
 * 2. No-JD path: createDomainAwarePrompt is used unchanged — works as before.
 *
 * 3. ATS score is always calculated by atsCalculator (rule-based, consistent).
 *    Gemini is NOT asked to calculate ATS — it was unreliable.
 *
 * 4. analyzeResume() now routes correctly: JD present → JD prompt,
 *    no JD → domain prompt.
 *
 * 5. createFallbackStructure() now reads arrays from structured/sections
 *    correctly (parser fix means these are real arrays now).
 *
 * 6. Hardcoded MERN default removed from the no-JD path.
 */
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

    // Non-tech domain skill dictionaries (keyed by domainTemplates domain key)
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

    // Universal soft skills (always appended to the dictionary)
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

  /**
   * Prompt used when NO job description is provided.
   * Evaluates the resume against its detected domain.
   */
  createDomainAwarePrompt(parsedData, detectedDomain) {
    const structuredData = this.createFallbackStructure(parsedData);
    const domainInfo     = detectedDomain.template;

    return `You are an expert resume analyzer with deep knowledge across multiple industries.

DETECTED DOMAIN: ${detectedDomain.name}
This resume appears to be for: ${detectedDomain.name}
Matched domain keywords: ${detectedDomain.matchedKeywords.slice(0, 10).join(', ')}

DOMAIN-SPECIFIC IMPORTANT SKILLS:
${domainInfo.important_skills.join(', ')}

SUGGESTED ROLES FOR THIS DOMAIN:
${domainInfo.suggested_roles.join(', ')}

RESUME DATA (Structured JSON):
${JSON.stringify(structuredData, null, 2)}

NO JOB DESCRIPTION PROVIDED — evaluate as a general ${domainInfo.name} candidate.

TASK: Analyze this resume for ${domainInfo.name} roles using domain-specific criteria.

Job Match Score (match against domain standards, 100 points total):
Step 1 – Skills alignment: 50 pts
  Ratio: (domain skills found in resume / total important domain skills) × 50
  Domain important skills: ${domainInfo.important_skills.join(', ')}

Step 2 – Projects/Experience relevance: 30 pts
  Projects clearly match domain: 30 | Partially relevant: 20 | Some relevance: 10 | None: 0

Step 3 – Educational background: 10 pts
  Relevant degree/certification: 10 | Related background: 7 | Self-taught: 5

Step 4 – Professional presence (GitHub/LinkedIn/Portfolio + certs): 10 pts
  All three: 10 | Two: 7 | One: 4 | None: 0

RESPONSE FORMAT — return ONLY valid JSON, no markdown:
{
  "match_score": <0–100>,
  "matched_skills": ["skills from resume matching domain requirements"],
  "missing_skills": ["3–5 HIGH-IMPACT domain skills absent from resume"],
  "recommendations": ["4–6 SPECIFIC, ACTIONABLE improvements for this domain"],
  "strengths": ["3–5 key strengths"],
  "weaknesses": ["2–3 constructive improvement areas phrased positively"],
  "suggested_roles": [
    { "role": "role name", "fit_score": <0-100, how well THIS resume currently fits this specific role>, "reasoning": "one short sentence" }
  ],
  "summary": "2–3 sentence professional summary",
  "experience_level": "entry|mid|senior",
  "key_achievements": ["2–4 notable achievements from the resume"],
  "top_skills": ["top 5 most relevant skills for ${domainInfo.name}"]
}

QUALITY RULES:
- Be domain-specific. Do NOT give generic software advice for non-tech domains.
- Matched skills must actually appear in the resume.
- Missing skills must be high-impact for THIS domain only.
- Recommendations must be actionable and specific to what is already in the resume.
- Each suggested role's fit_score must be internally consistent — a role you also describe as a poor or partial fit must NOT receive a high fit_score.
- PROVIDE ONLY THE JSON. NO ADDITIONAL TEXT OR MARKDOWN.`;
  }

  /**
   * Prompt used when a Job Description IS provided.
   *
   * Explicitly extracts every requirement from the JD and compares each one
   * against the resume. missing_skills and recommendations are JD-driven only.
   */
  createJDMatchPrompt(parsedData, jobDescription, detectedDomain) {
    const structuredData = this.createFallbackStructure(parsedData);
    const domainInfo     = detectedDomain.template;

    return `You are a senior technical recruiter and ATS specialist. Your task is to evaluate how well this resume matches the provided Job Description.

═══════════════════════════════════════
JOB DESCRIPTION (read every word carefully):
═══════════════════════════════════════
${jobDescription.trim()}

═══════════════════════════════════════
RESUME DATA (Structured JSON):
═══════════════════════════════════════
${JSON.stringify(structuredData, null, 2)}

DETECTED DOMAIN: ${detectedDomain.name}

═══════════════════════════════════════
STEP-BY-STEP ANALYSIS INSTRUCTIONS
═══════════════════════════════════════

STEP 1 — Extract JD requirements
Read the Job Description and list:
  a) Required technical skills / tools / languages mentioned
  b) Required experience (years, domains, types of work)
  c) Required education / certifications
  d) Preferred / nice-to-have skills
  e) Soft skills explicitly mentioned

STEP 2 — Cross-reference with resume
For EACH item in Step 1:
  - Mark as MATCHED if the resume clearly demonstrates it (in skills, projects, experience, or education)
  - Mark as MISSING if it is absent or barely mentioned
  - Mark as PARTIAL if it is hinted at but not fully demonstrated

STEP 3 — Score calculation

Job Match Score (total 100):
  Required technical skills match: (matched_required / total_required) × 50
  Projects / experience relevance to JD role:
    Clearly relevant projects/experience: 30 | Partial: 20 | Some: 10 | None: 0
  Education / certifications meet JD requirements:
    Fully met: 10 | Partially met: 6 | Not met: 2
  Soft skills + years of experience match:
    Strong match: 10 | Moderate: 6 | Weak: 2

EXPECTED RANGES:
  Strong candidate  (most JD requirements met):  70–90
  Partial match     (half of JD requirements):   45–69
  Weak match        (few requirements met):      20–44

STEP 4 — Build missing_skills
List ONLY skills/technologies/certifications that:
  1. Are explicitly required or strongly preferred in the JD, AND
  2. Are absent or insufficient in the resume.
Do NOT list skills the JD doesn't mention.

STEP 5 — Build recommendations
Each recommendation must:
  1. Reference a specific JD requirement that is unmet or weak.
  2. Suggest a concrete action (course, project, wording change).
  3. Be achievable in under 3 months.

═══════════════════════════════════════
RESPONSE FORMAT — ONLY valid JSON, no markdown:
═══════════════════════════════════════
{
  "match_score": <0–100, calculated per Step 3>,
  "jd_requirements_extracted": {
    "required_skills": ["every required skill/tool extracted from JD"],
    "preferred_skills": ["nice-to-have skills from JD"],
    "experience_required": "e.g. 2+ years in backend development",
    "education_required": "e.g. B.Tech in CS or equivalent",
    "soft_skills": ["communication", "teamwork", ...]
  },
  "matched_requirements": ["JD requirements clearly met by the resume"],
  "partial_requirements": ["JD requirements partially met"],
  "matched_skills": ["skills from resume that appear in JD requirements"],
  "missing_skills": ["JD-required skills absent from resume — max 6"],
  "recommendations": ["5–7 specific, JD-driven, actionable improvements"],
  "strengths": ["3–5 resume strengths relative to this JD"],
  "weaknesses": ["2–3 resume gaps relative to this JD, phrased constructively"],
  "suggested_roles": [
    { "role": "role name (the literal JD role and/or close alternatives)", "fit_score": <0-100>, "reasoning": "one short sentence" }
  ],
  "summary": "2–3 sentence evaluation of fit for this specific JD",
  "experience_level": "entry|mid|senior",
  "key_achievements": ["2–4 achievements from resume most relevant to JD"],
  "top_skills": ["top 5 resume skills most relevant to this JD"]
}

CRITICAL RULES:
- missing_skills MUST come from the JD only — do not invent generic gaps.
- recommendations MUST reference specific JD requirements — no generic advice.
- match_score MUST be calculated using Step 3 formula — do not guess.
- The fit_score for the literal JD role MUST be consistent with match_score (within ~10 points). If the resume is a weak or significant mismatch for the JD, that role's fit_score must be low too — never describe a role as a mismatch in your reasoning while giving it a high fit_score.
- PROVIDE ONLY THE JSON. NO EXTRA TEXT OR MARKDOWN.`;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // MAIN ENTRY POINT
  // ─────────────────────────────────────────────────────────────────────────

  async analyzeResume(parsedData, jobDescription = '', apiKey = null) {
    const hasJD = jobDescription && jobDescription.trim().length > 2;

    // Step 1: Detect domain
    const detectedDomain = domainTemplates.detectDomain(parsedData.raw_text || '');
    console.log(`\n🎯 Domain Detection:`, {
      domain:   detectedDomain.name,
      score:    detectedDomain.score,
      keywords: detectedDomain.matchedKeywords.slice(0, 5)
    });

    // Step 2: Calculate Resume Quality (always rule-based — consistent,
    // reproducible, and deliberately domain/JD-agnostic; see atsCalculator.js)
    const resumeQuality = atsCalculator.calculateResumeQualityScore(parsedData);
    console.log(`\n📊 Resume Quality Breakdown:`, resumeQuality);

    // Step 3: Experience timeline
    const expArray        = Array.isArray(parsedData.structured?.experience)
                              ? parsedData.structured.experience
                              : (Array.isArray(parsedData.experience) ? parsedData.experience : []);
    const experienceTimeline = atsCalculator.calculateExperienceTimeline(expArray);

    // No API key → enhanced fallback
    if (!apiKey) {
      console.log('No Gemini API key — using enhanced fallback analysis');
      return this.createEnhancedFallbackAnalysis(parsedData, detectedDomain, resumeQuality, experienceTimeline, hasJD, jobDescription);
    }

    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: 'models/gemini-2.5-flash' });

      // Step 4: Choose the right prompt based on whether JD is provided
      const prompt = hasJD
        ? this.createJDMatchPrompt(parsedData, jobDescription, detectedDomain)
        : this.createDomainAwarePrompt(parsedData, detectedDomain);

      console.log(`Calling Gemini AI (${hasJD ? 'JD-match mode' : 'domain-aware mode'})...`);
      const result   = await model.generateContent(prompt);
      const response = await result.response;
      const rawText  = response.text();

      let analysisData;
      try {
        const cleaned = rawText.trim().replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
        analysisData  = JSON.parse(cleaned);
      } catch (parseErr) {
        console.error('JSON parse error:', parseErr.message);
        console.log('Raw Gemini response:', rawText.slice(0, 500));
        analysisData = this.createEnhancedFallbackAnalysis(parsedData, detectedDomain, resumeQuality, experienceTimeline, hasJD, jobDescription);
      }

      // Step 5: ATS improvement cards (Resume Quality areas only — Contact,
      // Sections, Formatting, Action Verbs, Experience Depth)
      let atsImprovements = [];
      try {
        atsImprovements = await this.generateAtsImprovements(
          parsedData, resumeQuality, detectedDomain, jobDescription, apiKey
        );
      } catch (e) {
        console.error('ATS improvements error:', e.message);
        atsImprovements = this.createFallbackAtsImprovements(resumeQuality, detectedDomain);
      }

      // Step 6: Compute match_score ourselves — never trust Gemini's number
      const { match_score, _debug } = this.computeMatchScore(
        parsedData, detectedDomain, jobDescription, hasJD
      );
      console.log('🎯 Match score computed:', match_score, _debug);

      // Step 7: Build experience summary label
      const structured    = parsedData.structured || {};
      const profExpCount  = (structured.experience || []).filter(e => e.type === 'professional').length;
      const projCount     = (structured.projects   || []).length;
      const expSummary    = profExpCount > 0
        ? `${experienceTimeline.totalYears} yrs, ${profExpCount} role(s)`
        : projCount > 0
          ? `${projCount} project(s) (student/fresher)`
          : '0 yrs, 0 roles';

      // Step 8: Combine Resume Quality + Job Match into the final ATS
      // Compatibility score. Weighted 60/40 — a well-built resume for the
      // wrong role should land in the middle, not score as if either
      // factor alone determined hireability.
      const atsCompatibility = Math.round(0.6 * resumeQuality.total + 0.4 * match_score);

      // Step 9: Merge — our computed values override Gemini where needed
      return {
        ...analysisData,
        match_score,                              // Job Match — OUR calculation, not Gemini's
        resume_quality_score:     resumeQuality.total,
        resume_quality_breakdown: resumeQuality.breakdown,
        ats_score:                atsCompatibility, // combined compatibility, not a raw rule-based score anymore
        ats_improvements:         atsImprovements,
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

    // Resume Quality areas only — Contact/Sections/Formatting/Action Verbs/
    // Experience Depth. Raw weights sum to 60 (see atsCalculator.js).
    const maxScores = { contact: 10, sections: 15, formatting: 10, actionVerbs: 10, experienceDepth: 15 };

    const prompt = `You are a resume-quality coach. Generate actionable cards to improve low-scoring RESUME QUALITY areas — structure, formatting, and writing quality. Do NOT suggest adding specific skills, technologies, or keywords; that is handled separately by the Job Match analysis.

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
4. Advice must be about STRUCTURE, FORMATTING, and WRITING QUALITY only — never about which skills/technologies to add.
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
  // FALLBACK ANALYSIS (no API key or Gemini error)
  // ─────────────────────────────────────────────────────────────────────────

  createEnhancedFallbackAnalysis(parsedData, detectedDomain, resumeQuality, experienceTimeline, hasJD, jobDescription) {
    const resumeText     = parsedData.raw_text || '';
    const domainKey      = parsedData.detected_domain_key || detectedDomain?.key || null;
    const matchedSkills  = this.matchSkillsAgainstDictionary(parsedData.skills_list || [], resumeText, domainKey);
    const domainSkills   = detectedDomain.template.important_skills || [];
    const matchedDomain  = domainSkills.filter(s => resumeText.toLowerCase().includes(s.toLowerCase()));

    // Compute match score using structured signals (same as Gemini path)
    const { match_score } = this.computeMatchScore(parsedData, detectedDomain, jobDescription, hasJD);

    // Combine Resume Quality + Job Match into the final ATS Compatibility
    // score — same 60/40 weighting as the Gemini path, so the number means
    // the same thing regardless of which path produced it.
    const atsCompatibility = Math.round(0.6 * resumeQuality.total + 0.4 * match_score);

    let missingSkills = this.identifyMissingDomainSkills(matchedDomain, domainSkills);

    // If JD provided, refine missing skills using domain-appropriate dictionary
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

    return {
      ats_score:                atsCompatibility,
      resume_quality_score:     resumeQuality.total,
      resume_quality_breakdown: resumeQuality.breakdown,
      ats_improvements:         this.createFallbackAtsImprovements(resumeQuality, detectedDomain),
      match_score,
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

  // {role, fit_score, reasoning} objects anchored to the already-computed
  // match_score, instead of a bare role-name list with no score at all —
  // avoids the frontend having to invent its own arbitrary per-role
  // percentage (which previously produced contradictions like a role
  // described as "a significant mismatch" still showing 95% match).
  buildFallbackSuggestedRoles(detectedDomain, matchScore) {
    return detectedDomain.template.suggested_roles.slice(0, 4).map((role, i) => ({
      role,
      fit_score: Math.max(matchScore - i * 8, 10),
      reasoning: `Estimated from overlap with core ${detectedDomain.template.name} skills.`
    }));
  }

  /**
   * Compute match_score (0-100) entirely from structured signals.
   * Never rely on Gemini for this number — it's inconsistent.
   *
   * JD Match sub-component raw weights (sum = 40, scaled ×2.5 → 100):
   *   Skills match    25  — hard skill overlap between resume and JD/domain
   *   Domain match    10  — experience / project relevance to target domain
   *   Keywords         5  — education + professional presence signals
   *
   * Score bands (after scaling):
   *   Strong   (70–95): most requirements met
   *   Moderate (45–69): half of requirements met
   *   Weak     (20–44): few requirements met
   */
  computeMatchScore(parsedData, detectedDomain, jobDescription, hasJD) {
    const resumeText = (parsedData.raw_text || '').toLowerCase();
    const domainKey  = parsedData.detected_domain_key || detectedDomain?.key || null;

    // ── Skills match (25 raw pts) ─────────────────────────────────────────
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
        // JD has no recognisable skills → domain match fallback
        skillsRaw = this._domainSkillsScore(resumeText, detectedDomain, 25);
      }
    } else {
      skillsRaw = this._domainSkillsScore(resumeText, detectedDomain, 25);
    }

    // ── Domain match (10 raw pts) — experience / project relevance ────────
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

    // ── Keywords (5 raw pts) — education + professional presence ──────────
    let keywordsRaw = 0;
    const contact = parsedData.contact || {};
    const eduList  = structured.education || [];

    // Education present (up to 3 pts)
    if (eduList.length > 0 || /\b(education|degree|university|college|institute|school)\b/i.test(resumeText)) {
      const hasMasters   = /master|mba|m\.tech|m\.sc|m\.e\.|m\.des|phd|ph\.d/i.test(resumeText);
      const hasBachelors = /bachelor|b\.tech|b\.e\.|b\.sc|b\.a\.|degree|diploma/i.test(resumeText);
      keywordsRaw += hasMasters ? 3 : hasBachelors ? 2 : 1;
    }
    // Professional presence (up to 2 pts)
    if (contact.linkedin)                    keywordsRaw += 1;
    if (contact.github || contact.portfolio) keywordsRaw += 1;
    keywordsRaw = Math.min(keywordsRaw, 5);

    // ── Scale raw /40 → /100 ─────────────────────────────────────────────
    const rawTotal = skillsRaw + domainRaw + keywordsRaw;
    const total    = Math.round((rawTotal / 40) * 100);

    return {
      match_score: Math.min(Math.max(total, 10), 98),
      _debug: { skillsRaw, domainRaw, keywordsRaw, rawTotal }
    };
  }

  // Helper: ratio of domain important_skills found in resume → max pts
  _domainSkillsScore(resumeTextLower, detectedDomain, maxPts) {
    const domainSkills = detectedDomain?.template?.important_skills || [];
    if (domainSkills.length === 0) return Math.round(maxPts * 0.3);
    const matched = domainSkills.filter(s =>
      resumeTextLower.includes(s.toLowerCase())
    ).length;
    // sqrt curve: first matches count more
    return Math.round(Math.sqrt(matched / domainSkills.length) * maxPts);
  }

  // Metric patterns reused from atsCalculator for expScore
  get metricPatterns() {
    return [
      /\d+\s*%/, /\d+\s*(users?|clients?)/i, /\$\s*\d+/, /₹\s*\d+/,
      /reduced\s+by\s+\d+/i, /increased\s+by\s+\d+/i,
      /\d+x\s+(faster|improvement|growth)/i, /lpa|lakh/i, /\d+\s*seconds?/i
    ];
  }

  async generateRoleDetails(roleName, userSkills, matchedSkills, missingSkills, apiKey) {
    const key = apiKey || process.env.GEMINI_API_KEY;
    if (!key) return { success: false, data: this._fallbackRoleDetails(roleName, missingSkills) };

    try {
      const genAI = new GoogleGenerativeAI(key);
      const model = genAI.getGenerativeModel({ model: 'models/gemini-2.5-flash' });

      const prompt = `You are an expert career advisor. Analyze this job role and return JSON only.

Job Role: ${roleName}
Candidate Skills: ${userSkills.join(', ') || 'None'}
Matched Skills: ${matchedSkills.join(', ') || 'None'}
Missing Skills: ${missingSkills.join(', ') || 'None'}

Return ONLY this JSON structure (no markdown):
{
  "roleDescription": "2–3 sentence description of role and responsibilities",
  "requiredSkills": ["skill1", "skill2"],
  "niceToHaveSkills": ["skill1"],
  "companyExpectations": ["expectation1", "expectation2", "expectation3", "expectation4", "expectation5"],
  "careerAdvice": ["tip1", "tip2", "tip3", "tip4", "tip5"],
  "learningPath": ["step1", "step2", "step3", "step4"],
  "salaryRange": "e.g. ₹6–12 LPA or $60k–$90k",
  "experienceLevel": "Entry/Mid/Senior",
  "industryDemand": "High/Medium/Low"
}`;

      const result  = await model.generateContent(prompt);
      const text    = result.response.text().replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const details = JSON.parse(text);
      return { success: true, data: details };
    } catch (err) {
      console.error('generateRoleDetails error:', err.message);
      return { success: false, data: this._fallbackRoleDetails(roleName, missingSkills) };
    }
  }

  _fallbackRoleDetails(roleName, missingSkills) {
    return {
      roleDescription: `${roleName} is a technical position requiring strong programming and problem-solving skills.`,
      requiredSkills:  missingSkills.length > 0 ? missingSkills : ['Programming', 'Problem Solving', 'Communication'],
      niceToHaveSkills: ['Cloud Computing', 'DevOps', 'Agile'],
      companyExpectations: [
        'Write clean, maintainable code',
        'Collaborate effectively with team members',
        'Meet project deadlines and deliver quality work',
        'Learn and adapt to new technologies',
        'Communicate technical concepts clearly'
      ],
      careerAdvice: [
        'Build a strong portfolio with diverse projects',
        'Contribute to open-source projects on GitHub',
        'Network with professionals on LinkedIn',
        'Stay updated with industry trends',
        'Practice coding on platforms like LeetCode'
      ],
      learningPath: [
        'Master fundamental programming concepts and data structures',
        'Build 3–5 projects showcasing your skills',
        'Learn version control (Git) and collaboration tools',
        'Gain experience with relevant frameworks'
      ],
      salaryRange: 'Varies by location and experience',
      experienceLevel: 'Entry to Mid-level',
      industryDemand: 'High'
    };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // HELPER METHODS
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Build the active skill dictionary for a given domain.
   * Tech domains → techSkillsDictionary
   * Non-tech domains → domain-specific dictionary + soft skills
   * Unknown → everything (broad scan)
   */
  getSkillDictionaryForDomain(domainKey) {
    const techDomains = new Set([
      'software_development', 'data_science', 'cybersecurity', 'qa_testing'
    ]);

    if (!domainKey || !this.domainSkillDictionaries[domainKey]) {
      // Unknown domain: use tech + all non-tech dictionaries combined
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

    // Non-tech domain: domain-specific list + soft skills (no tech noise)
    return [
      ...(this.domainSkillDictionaries[domainKey] || []),
      ...this.softSkillsDictionary
    ];
  }

  /**
   * Match resume skills against the domain-appropriate dictionary.
   * Pass 1: exact / synonym match on the extracted skills list.
   * Pass 2: full-text regex scan for anything missed.
   */
  matchSkillsAgainstDictionary(resumeSkills, fullResumeText = '', domainKey = null) {
    const dictionary = this.getSkillDictionaryForDomain(domainKey);
    const matched    = new Set();

    // Pass 1: extracted skills list vs dictionary (with synonym support for tech)
    resumeSkills.forEach(skill => {
      const skillLower = skill.toLowerCase().trim();
      dictionary.forEach(dictSkill => {
        if (skillLower === dictSkill.toLowerCase()) { matched.add(dictSkill); return; }
        // Synonym check (tech skills only)
        const synonyms = this.skillSynonyms[dictSkill] || [];
        for (const syn of [dictSkill, ...synonyms]) {
          const synL = syn.toLowerCase();
          if (skillLower === synL || skillLower.includes(synL) || synL.includes(skillLower)) {
            matched.add(dictSkill); return;
          }
        }
      });
      // Also check synonym keys
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

    // Pass 2: full-text scan
    if (fullResumeText.trim().length > 0) {
      dictionary.forEach(dictSkill => {
        const synonyms = this.skillSynonyms[dictSkill] || [];
        for (const variation of [dictSkill, ...synonyms]) {
          try {
            const pattern = new RegExp(
              `\\b${variation.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i'
            );
            if (pattern.test(fullResumeText)) { matched.add(dictSkill); break; }
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

    // ── Education ──────────────────────────────────────────────────────────
    let edu = structured.education || sections.education;
    // Parser returned empty → extract the education block from raw text directly
    if (!edu || (Array.isArray(edu) && edu.length === 0)) {
      const eduMatch = text.match(
        /(?:education|academic background)[^\n]*\n([\s\S]{20,600}?)(?=\n(?:skills?|experience|projects?|achievements?|certifications?|summary|$))/i
      );
      edu = eduMatch
        ? eduMatch[1].trim()   // raw text snippet — Gemini can read it
        : /\b(b\.?tech|bachelor|master|degree|university|college|institute|cgpa|gpa)\b/i.test(text)
          ? this._extractTextSection(text, /\beducation\b/i, /\b(skills?|experience|projects?|achievements?)\b/i)
          : 'Not provided';
    }

    // ── Experience ─────────────────────────────────────────────────────────
    let exp = structured.experience || sections.experience;
    if (!exp || (Array.isArray(exp) && exp.length === 0)) {
      const expSnippet = this._extractTextSection(
        text,
        /\b(experience|work history|employment|internship)\b/i,
        /\b(education|skills?|projects?|achievements?|certifications?|summary)\b/i
      );
      exp = expSnippet || 'No professional experience listed';
    }

    // ── Projects ───────────────────────────────────────────────────────────
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

  /**
   * Extract a text block between a start heading and the next section heading.
   * Returns null if start heading not found or block is too short.
   */
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

  /**
   * Section completeness percentage (0–100) shown in the UI.
   * Uses the same two-pass logic as atsCalculator.calculateSectionCompleteness
   * so the two numbers are always consistent with each other.
   */
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
      // contact
      !!(parsedData.contact?.name && parsedData.contact?.email),
      // education
      sectionPresent(['education'], /\b(education|b\.?tech|bachelor|master|degree|university|college|institute)\b/i),
      // skills
      sectionPresent(['skills', 'all_skills'], /\b(skills?|technical skills?|languages?|frameworks?|tools)\b/i),
      // experience OR projects
      sectionPresent(['experience'], /\b(experience|work history|employment|internship)\b/i) ||
      sectionPresent(['projects'],   /\b(projects?|personal projects?|key projects?)\b/i),
      // summary
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