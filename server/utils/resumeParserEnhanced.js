const pdfParse = require('pdf-parse');
const mammoth  = require('mammoth');
const fs       = require('fs').promises;

class EnhancedResumeParser {
  constructor() {
    this.urlPatterns = {
      email:     /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
      phone:     /(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g,
      linkedin:  /(?:linkedin\.com\/in\/)([\w-]+)/gi,
      github:    /(?:github\.com\/)([\w-]+)/gi,
      portfolio: /(?:https?:\/\/)?(?:www\.)?([a-zA-Z0-9-]+\.(?:netlify\.app|vercel\.app|herokuapp\.com|web\.app|github\.io|com|in))/gi
    };
  }

  // ─── Text utilities ────────────────────────────────────────────────────────

  cleanText(text) {
    if (!text) return '';
    return text
      .replace(/\r/g, '')
      .split('\n')
      .map(line => line.replace(/[ \t]{2,}/g, ' ').trim())
      .filter(line => line.length > 0)
      .join('\n')
      .trim();
  }

  // ─── File extraction ───────────────────────────────────────────────────────

  async extractTextFromPdf(filePath) {
    const data = await pdfParse(await fs.readFile(filePath));
    return this.cleanText(data.text);
  }

  async extractTextFromDocx(filePath) {
    const result = await mammoth.extractRawText({ buffer: await fs.readFile(filePath) });
    return this.cleanText(result.value);
  }

  async extractText(filePath, fileType) {
    if (fileType === 'pdf')                     return this.extractTextFromPdf(filePath);
    if (fileType === 'docx' || fileType === 'doc') return this.extractTextFromDocx(filePath);
    throw new Error(`Unsupported file type: ${fileType}`);
  }

  // ─── Section boundary helper ───────────────────────────────────────────────

  findSectionIndex(lines, patterns) {
    return lines.findIndex(l => patterns.some(p => p.test(l.trim())));
  }

  extractSectionLines(lines, sectionIdx) {
    if (sectionIdx === -1) return [];
    const nextSectionPatterns = [
      /^(education|academic background|academic qualifications?)$/i,
      /^(experience|work experience|professional experience|work history|employment history|employment|career history|positions? held)$/i,
      /^(projects?|personal projects?|academic projects?|key projects?)$/i,
      /^(skills?|technical skills?|core competencies|competencies|proficiencies)$/i,
      /^(certifications?|licenses?|credentials?)$/i,
      /^(achievements?|awards?|honors?|accomplishments?)$/i,
      /^(summary|objective|career objective|professional summary|profile|about|about me)$/i,
      /^(contact|contact information|personal information|personal details)$/i,
      /^(extracurricular|activities|co-curricular|extra-curricular)$/i,
      /^(publications?|research|papers?)$/i,
      /^(languages?|language proficiency)$/i,
      /^(interests?|hobbies)$/i,
      /^(volunteering?|volunteer experience|community service)$/i,
      /^(references?|references available)$/i,
    ];
    const rest = lines.slice(sectionIdx + 1);
    const endOffset = rest.findIndex(l =>
      nextSectionPatterns.some(p => p.test(l.trim()))
    );
    return endOffset === -1 ? rest : rest.slice(0, endOffset);
  }

  // ─── 1. Contact ────────────────────────────────────────────────────────────

  extractContactInfo(text) {
    const lines = text.split('\n');
    const contact = {
      name: null, email: null, phone: null,
      location: null, portfolio: null, linkedin: null, github: null
    };

    const commonHeaders = [
      'skills', 'education', 'experience', 'projects', 'summary',
      'objective', 'contact', 'profile', 'about', 'achievements'
    ];

    for (let i = 0; i < Math.min(8, lines.length); i++) {
      const line = lines[i].trim();
      if (
        line &&
        line.length < 60 &&
        line.split(/\s+/).length <= 5 &&
        !commonHeaders.some(h => line.toLowerCase().includes(h)) &&
        !/@|[:()|]/.test(line) &&
        !/\d{5,}/.test(line)
      ) {
        contact.name = line;
        break;
      }
    }

    const emailMatch = text.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/);
    contact.email    = emailMatch ? emailMatch[0] : null;

    const phoneMatch = text.match(/(?:\+91[-.\s]?|0)?[6-9]\d{9}|(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
    contact.phone    = phoneMatch ? phoneMatch[0].replace(/[-.\s()]/g, '') : null;

    const linkedinUrlMatch = text.match(/linkedin\.com\/in\/([\w-]+)/i);
    if (linkedinUrlMatch) {
      contact.linkedin = `linkedin.com/in/${linkedinUrlMatch[1]}`;
    } else if (/\blinkedin\b/i.test(text.slice(0, 500))) {
      contact.linkedin = 'linkedin.com (linked in header)';
    }

    const githubUrlMatch = text.match(/github\.com\/([\w-]+)/i);
    if (githubUrlMatch) {
      contact.github = `github.com/${githubUrlMatch[1]}`;
    } else if (/\bgithub\b/i.test(text.slice(0, 500))) {
      contact.github = 'github.com (linked in header)';
    }

    const portfolioMatch = text.match(
      /(?:https?:\/\/)?(?:www\.)?([a-zA-Z0-9-]+\.(?:netlify\.app|vercel\.app|herokuapp\.com|web\.app|github\.io))/i
    );
    if (portfolioMatch) {
      contact.portfolio = portfolioMatch[0].startsWith('http')
        ? portfolioMatch[0] : `https://${portfolioMatch[0]}`;
    }

    const locationPattern = /(?:[A-Z][a-z]+(?:\s[A-Z][a-z]+)*,\s*(?:[A-Z]{2,}|[A-Z][a-z]+))|(?:Jaipur|Delhi|Mumbai|Bangalore|Bengaluru|Hyderabad|Chennai|Pune|Kolkata|Ahmedabad|Surat|Lucknow|Noida|Gurugram|Gurgaon|Indore|Nagaur|Trichy|Tiruchirappalli|New York|San Francisco|London|Berlin|Dubai)/g;
    const locationMatch   = text.match(locationPattern);
    contact.location      = locationMatch ? locationMatch[0] : null;

    return contact;
  }

  // ─── 2. Summary ───────────────────────────────────────────────────────────

  extractSummary(text) {
    const summaryKeywords = [
      'summary', 'objective', 'career objective', 'about', 'about me',
      'profile', 'professional summary', 'professional profile'
    ];
    const lines = text.split('\n');
    for (let i = 0; i < lines.length; i++) {
      if (summaryKeywords.some(kw => lines[i].toLowerCase().trim() === kw ||
          lines[i].toLowerCase().includes(kw))) {
        const summaryLines = lines.slice(i + 1, i + 6).filter(l => l.trim().length > 20);
        if (summaryLines.length > 0) return summaryLines.join(' ').trim();
      }
    }
    return null;
  }

  // ─── 3. Education ─────────────────────────────────────────────────────────

  extractEducation(text) {
    const education = [];
    const lines     = text.split('\n');

    const eduIdx = this.findSectionIndex(lines, [
      /^education$/i,
      /^academic\s+background$/i,
      /^educational\s+qualifications?$/i,
      /^academic\s+qualifications?$/i
    ]);
    if (eduIdx === -1) return education;

    const eduLines = this.extractSectionLines(lines, eduIdx);
    let current    = null;

    const datePattern = /(?:(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s+)?\d{4}\s*[-–—]\s*(?:(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s+)?(?:\d{4}|present|ongoing|current)/i;
    const degreePattern = /B\.?Tech|M\.?Tech|B\.?E\.?|M\.?E\.?|Bachelor|Master|Masters|Diploma|B\.?Sc|M\.?Sc|MBA|Ph\.?D|B\.?A\.?|M\.?A\.?|B\.?Com|M\.?Com|LLB|LLM|BBA|BCA|MCA|B\.?Des|M\.?Des|HCI|Human.Computer|Interaction Design|Graphic Design|Fine Arts|Liberal Arts|Psychology|Nursing|Pharmacy|Architecture/i;
    const institutionPattern = /College|University|Institute|School|IIIT|IIT|NIT|Academy|Polytechnic|Pratt|MIT|Stanford|Harvard|Oxford|Campus|Faculty|Department/i;

    eduLines.forEach(rawLine => {
      const line = rawLine.trim();
      if (!line) return;

      const isDate   = datePattern.test(line);
      const isDegree = degreePattern.test(line);
      const isInst   = institutionPattern.test(line) || /^[A-Z][A-Z\s]{4,}$/.test(line);

      if (isInst && isDate) {
        if (current && (current.institute || current.degree)) education.push(current);
        const dateMatch = line.match(datePattern);
        const instituteName = dateMatch ? line.slice(0, dateMatch.index).trim().replace(/[,\s]+$/, '') : line;
        current = { institute: instituteName || line, degree: null, duration: dateMatch ? dateMatch[0] : null, cgpa: null, details: [] };
      } else if (isInst && !isDate && !isDegree) {
        if (current) education.push(current);
        current = { institute: line, degree: null, duration: null, cgpa: null, details: [] };
      } else if (isDegree && !isDate) {
        if (!current) current = { institute: null, degree: line, duration: null, cgpa: null, details: [] };
        else current.degree = line;
      } else if (isDate) {
        if (!current) current = { institute: null, degree: null, duration: null, cgpa: null, details: [] };
        current.duration = line.match(datePattern)[0];
      } else if (current && /cgpa|gpa|percentage|%|grade/i.test(line)) {
        current.cgpa = line;
      } else if (current) {
        if (isDegree && isInst) {
          if (current && (current.degree || current.institute)) education.push(current);
          current = { institute: line, degree: line, duration: null, cgpa: null, details: [] };
        } else {
          current.details.push(line);
        }
      }
    });

    if (current && (current.institute || current.degree)) education.push(current);
    return education;
  }

  // ─── 4. Skills ────────────────────────────────────────────────────────────

  extractSkillsCategorized(text, detectedDomainKey = null) {
    const skills = {
      languages:    [],
      frameworks:   [],
      databases:    [],
      tools:        [],
      ai_ml:        [],
      cloud:        [],
      domain_skills: [],
      soft_skills:   [],
      certifications_found: [],
      other:        []
    };

    const softSkillMap = {
      'Communication':       ['communication', 'verbal communication', 'written communication'],
      'Leadership':          ['leadership', 'team lead', 'leading teams'],
      'Teamwork':            ['teamwork', 'team player', 'collaboration', 'collaborative'],
      'Problem Solving':     ['problem.solving', 'problem solver', 'analytical thinking', 'critical thinking'],
      'Time Management':     ['time management', 'deadline', 'multitasking'],
      'Presentation Skills': ['presentation', 'public speaking', 'pitching'],
      'Negotiation':         ['negotiation', 'negotiating'],
      'Conflict Resolution': ['conflict resolution', 'mediation'],
      'Adaptability':        ['adaptable', 'adaptability', 'flexibility', 'flexible'],
      'Attention to Detail': ['attention to detail', 'detail.oriented'],
      'Empathy':             ['empathy', 'empathetic'],
      'Customer Service':    ['customer service', 'customer satisfaction', 'client handling'],
      'Project Management':  ['project management', 'project planning', 'project coordination'],
      'Research':            ['research', 'market research', 'data research'],
      'Microsoft Office':    ['ms office', 'microsoft office', 'word', 'excel', 'powerpoint', 'outlook'],
      'Google Workspace':    ['google workspace', 'google docs', 'google sheets', 'google slides', 'gsuite'],
    };

    const domainSkillMaps = {
      marketing: {
        'SEO':                   ['seo', 'search engine optimization'],
        'SEM':                   ['sem', 'search engine marketing'],
        'Google Ads':            ['google ads', 'google adwords'],
        'Facebook Ads':          ['facebook ads', 'meta ads', 'instagram ads'],
        'Content Marketing':     ['content marketing', 'content strategy'],
        'Email Marketing':       ['email marketing', 'mailchimp', 'klaviyo', 'sendgrid'],
        'Social Media Marketing':['social media', 'social media marketing', 'smm'],
        'Copywriting':           ['copywriting', 'copy writing'],
        'Google Analytics':      ['google analytics', 'ga4'],
        'HubSpot':               ['hubspot'],
        'Marketing Automation':  ['marketing automation', 'drip campaigns'],
        'CRM':                   ['crm', 'salesforce', 'zoho crm'],
        'Brand Management':      ['branding', 'brand management', 'brand strategy'],
        'PPC':                   ['ppc', 'pay.per.click', 'paid ads'],
        'A/B Testing':           ['a/b testing', 'split testing'],
        'Tableau':               ['tableau'],
        'Power BI':              ['power bi', 'powerbi'],
        'Canva':                 ['canva'],
        'WordPress':             ['wordpress'],
      },
      sales: {
        'Lead Generation':       ['lead generation', 'prospecting', 'cold calling'],
        'CRM':                   ['crm', 'salesforce', 'zoho crm', 'pipedrive'],
        'B2B Sales':             ['b2b', 'b2b sales'],
        'B2C Sales':             ['b2c', 'b2c sales'],
        'Negotiation':           ['negotiation', 'deal closing', 'closing deals'],
        'Account Management':    ['account management', 'key account'],
        'Sales Strategy':        ['sales strategy', 'go-to-market'],
        'Revenue Targets':       ['revenue target', 'quota', 'sales target'],
        'Upselling':             ['upselling', 'cross-selling', 'cross selling'],
        'Pipeline Management':   ['pipeline', 'sales pipeline'],
        'Presentation Skills':   ['presentation', 'pitch', 'demo'],
        'Customer Retention':    ['retention', 'churn reduction'],
      },
      human_resources: {
        'Recruitment':           ['recruitment', 'hiring', 'talent acquisition'],
        'Onboarding':            ['onboarding', 'induction'],
        'Payroll':               ['payroll', 'payroll processing'],
        'HRIS':                  ['hris', 'hrms', 'workday', 'sap hr', 'bamboohr', 'greythr'],
        'Employee Relations':    ['employee relations', 'er management'],
        'Performance Management':['performance management', 'appraisal', 'kpi'],
        'Compliance':            ['compliance', 'labour law', 'labor law', 'statutory compliance'],
        'Training & Development':['training', 'learning and development', 'l&d'],
        'Job Portals':           ['naukri', 'linkedin recruiter', 'indeed', 'monster'],
        'Compensation & Benefits':['compensation', 'benefits', 'c&b', 'ctc'],
        'Workforce Planning':    ['workforce planning', 'headcount planning'],
        'Exit Management':       ['exit interview', 'offboarding', 'attrition'],
      },
      finance: {
        'Financial Analysis':    ['financial analysis', 'financial modelling', 'financial modeling'],
        'Accounting':            ['accounting', 'bookkeeping'],
        'Tally':                 ['tally', 'tally erp'],
        'SAP FICO':              ['sap fico', 'sap fi', 'sap co'],
        'QuickBooks':            ['quickbooks', 'quick books'],
        'MS Excel (Advanced)':   ['vlookup', 'pivot table', 'advanced excel', 'excel macros'],
        'Auditing':              ['auditing', 'internal audit', 'statutory audit'],
        'Taxation':              ['taxation', 'income tax', 'gst', 'tds', 'vat'],
        'Budgeting':             ['budgeting', 'budget planning', 'cost control'],
        'Financial Reporting':   ['financial reporting', 'mis report', 'balance sheet', 'p&l'],
        'GAAP':                  ['gaap', 'ind as', 'ifrs'],
        'Reconciliation':        ['reconciliation', 'bank reconciliation'],
        'Accounts Payable':      ['accounts payable', 'ap'],
        'Accounts Receivable':   ['accounts receivable', 'ar'],
        'CPA':                   ['cpa', 'ca', 'cfa', 'acca', 'cma'],
      },
      healthcare: {
        'Patient Care':          ['patient care', 'bedside manner', 'patient management'],
        'EMR/EHR':               ['emr', 'ehr', 'electronic health record', 'epic', 'cerner', 'meditech'],
        'HIPAA':                 ['hipaa', 'healthcare compliance'],
        'Clinical Skills':       ['clinical', 'clinical assessment', 'clinical care'],
        'Medical Terminology':   ['medical terminology', 'icd', 'cpt codes'],
        'Nursing':               ['nursing', 'rn', 'lpn', 'bsc nursing'],
        'Phlebotomy':            ['phlebotomy', 'venipuncture'],
        'Vital Signs':           ['vital signs', 'bp monitoring', 'pulse oximetry'],
        'Medication Management': ['medication administration', 'pharmacy', 'drug management'],
        'First Aid / CPR':       ['first aid', 'cpr', 'bls', 'acls'],
        'Healthcare Administration':['healthcare administration', 'hospital administration'],
        'Telemedicine':          ['telemedicine', 'telehealth'],
      },
      education: {
        'Curriculum Development':['curriculum', 'curriculum design', 'course development'],
        'Lesson Planning':       ['lesson plan', 'lesson planning'],
        'Classroom Management':  ['classroom management', 'student discipline'],
        'E-Learning':            ['e-learning', 'elearning', 'lms', 'moodle', 'canvas'],
        'Student Assessment':    ['assessment', 'grading', 'evaluation'],
        'Instructional Design':  ['instructional design', 'id', 'learning design'],
        'Special Education':     ['special education', 'sen', 'inclusive education'],
        'CBSE / ICSE':           ['cbse', 'icse', 'state board'],
        'Tutoring':              ['tutoring', 'one-on-one teaching', 'private tuition'],
        'Zoom / Google Meet':    ['zoom', 'google meet', 'online teaching', 'virtual classroom'],
        'Content Development':   ['content development', 'study material', 'teaching material'],
      },
      logistics: {
        'Inventory Management':  ['inventory management', 'stock management', 'inventory control'],
        'WMS':                   ['wms', 'warehouse management system', 'sap wm', 'oracle wms'],
        'ERP':                   ['erp', 'sap', 'oracle erp', 'navision'],
        'Forklift':              ['forklift', 'forklift operator', 'reach truck'],
        'Supply Chain':          ['supply chain', 'scm', 'supply chain management'],
        'Procurement':           ['procurement', 'purchasing', 'vendor management'],
        'Freight / Shipping':    ['freight', 'shipping', 'logistics', 'dispatch'],
        'Quality Control':       ['quality control', 'qc', 'quality assurance', 'inspection'],
        'OSHA / Safety':         ['osha', 'safety compliance', 'workplace safety'],
        'Last Mile Delivery':    ['last mile', 'last-mile delivery', 'delivery management'],
        'Import / Export':       ['import', 'export', 'customs clearance', 'incoterms'],
      },
      customer_service: {
        'Ticketing Systems':     ['zendesk', 'freshdesk', 'servicenow', 'jira service'],
        'CRM':                   ['crm', 'salesforce', 'hubspot'],
        'Live Chat':             ['live chat', 'intercom', 'drift', 'chat support'],
        'Call Centre':           ['call centre', 'call center', 'inbound calls', 'outbound calls'],
        'Complaint Handling':    ['complaint handling', 'escalation management', 'dispute resolution'],
        'SLA Management':        ['sla', 'service level agreement'],
        'CSAT / NPS':            ['csat', 'nps', 'customer satisfaction score'],
        'Product Knowledge':     ['product knowledge', 'product training'],
        'Upselling':             ['upselling', 'cross-selling'],
        'Multilingual':          ['bilingual', 'multilingual', 'hindi', 'english', 'regional language'],
      },
      project_management: {
        'Agile':                 ['agile', 'scrum', 'kanban', 'sprint'],
        'PMP':                   ['pmp', 'prince2', 'capm'],
        'Jira':                  ['jira', 'confluence'],
        'Asana':                 ['asana'],
        'Trello':                ['trello'],
        'MS Project':            ['ms project', 'microsoft project'],
        'Risk Management':       ['risk management', 'risk assessment', 'risk mitigation'],
        'Stakeholder Management':['stakeholder management', 'stakeholder communication'],
        'Budget Management':     ['budget management', 'cost tracking', 'cost management'],
        'Resource Planning':     ['resource planning', 'capacity planning'],
        'Change Management':     ['change management', 'change control'],
        'Reporting':             ['status report', 'progress report', 'dashboard reporting'],
      },
      content_writing: {
        'SEO Writing':           ['seo writing', 'seo content', 'keyword research'],
        'Copywriting':           ['copywriting', 'ad copy', 'sales copy'],
        'Technical Writing':     ['technical writing', 'documentation', 'api docs', 'user manual'],
        'Editing / Proofreading':['editing', 'proofreading', 'copy editing'],
        'WordPress':             ['wordpress', 'cms'],
        'Content Strategy':      ['content strategy', 'editorial calendar', 'content planning'],
        'Blogging':              ['blogging', 'blog writing', 'article writing'],
        'Storytelling':          ['storytelling', 'narrative'],
        'Grammarly':             ['grammarly'],
        'AP / Chicago Style':    ['ap style', 'chicago style', 'style guide'],
        'Social Media Content':  ['social media content', 'caption writing', 'thread writing'],
        'Script Writing':        ['script writing', 'video script', 'podcast script'],
      },
      design: {
        'Figma':                 ['figma'],
        'Adobe XD':              ['adobe xd', 'xd'],
        'Sketch':                ['sketch'],
        'Photoshop':             ['photoshop', 'adobe photoshop'],
        'Illustrator':           ['illustrator', 'adobe illustrator'],
        'InDesign':              ['indesign', 'adobe indesign'],
        'After Effects':         ['after effects', 'adobe after effects'],
        'Prototyping':           ['prototyping', 'wireframing', 'wireframe'],
        'UI Design':             ['ui design', 'user interface design'],
        'UX Research':           ['ux research', 'user research', 'usability testing'],
        'Design Systems':        ['design system', 'design tokens'],
        'Typography':            ['typography', 'typeface'],
        'Branding':              ['branding', 'brand identity', 'visual identity'],
        'Canva':                 ['canva'],
        'Motion Design':         ['motion design', 'animation', 'lottie'],
        'Accessibility':         ['accessibility', 'wcag', 'a11y'],
      },
      cybersecurity: {
        'Penetration Testing':   ['penetration testing', 'pen testing', 'pentest'],
        'SIEM':                  ['siem', 'splunk', 'qradar', 'elastic siem'],
        'Vulnerability Assessment':['vulnerability assessment', 'va', 'nessus', 'qualys'],
        'Incident Response':     ['incident response', 'ir', 'forensics'],
        'Firewalls / IDS':       ['firewall', 'ids', 'ips', 'palo alto', 'cisco asa'],
        'Compliance':            ['iso 27001', 'soc 2', 'pci dss', 'gdpr', 'hipaa'],
        'CISSP / CEH':           ['cissp', 'ceh', 'oscp', 'security+', 'ejpt'],
        'Network Security':      ['network security', 'vpn', 'zero trust'],
        'Threat Intelligence':   ['threat intelligence', 'cti', 'mitre att&ck'],
        'Cloud Security':        ['cloud security', 'aws security', 'azure security'],
        'Scripting':             ['bash scripting', 'python scripting', 'powershell'],
        'SOC':                   ['soc', 'security operations center', 'soc analyst'],
      },
      qa_testing: {
        'Manual Testing':        ['manual testing', 'test cases', 'test execution'],
        'Selenium':              ['selenium', 'selenium webdriver'],
        'Cypress':               ['cypress'],
        'Postman':               ['postman', 'api testing'],
        'JMeter':                ['jmeter', 'load testing', 'performance testing'],
        'Jira':                  ['jira', 'bug tracking', 'defect management'],
        'TestNG / JUnit':        ['testng', 'junit', 'nunit'],
        'Agile / Scrum':         ['agile', 'scrum', 'sprint testing'],
        'Regression Testing':    ['regression testing', 'regression suite'],
        'ISTQB':                 ['istqb', 'ctfl'],
        'SQL (for testing)':     ['sql', 'database testing'],
        'Appium':                ['appium', 'mobile testing'],
      },
      data_science: {
        'Python':                ['python'],
        'R':                     ['r', 'r programming', 'r studio'],
        'SQL':                   ['sql'],
        'Machine Learning':      ['machine learning', 'ml', 'supervised learning', 'unsupervised learning'],
        'Deep Learning':         ['deep learning', 'neural network', 'cnn', 'rnn', 'transformer'],
        'Pandas / NumPy':        ['pandas', 'numpy'],
        'Scikit-learn':          ['scikit.learn', 'sklearn'],
        'TensorFlow / PyTorch':  ['tensorflow', 'pytorch'],
        'Data Visualization':    ['tableau', 'power bi', 'matplotlib', 'seaborn', 'plotly'],
        'Big Data':              ['spark', 'hadoop', 'hive', 'kafka'],
        'Statistics':            ['statistics', 'hypothesis testing', 'regression', 'probability'],
        'NLP':                   ['nlp', 'natural language processing', 'spacy', 'nltk'],
        'Feature Engineering':   ['feature engineering', 'feature selection'],
        'Model Deployment':      ['mlflow', 'model deployment', 'flask api', 'fastapi'],
      },
      software_development: {}
    };

    const techSkillMap = {
      languages: {
        'C++':        ['c\\+\\+', 'cpp'],
        'C':          ['c'],
        'Python':     ['python'],
        'JavaScript': ['javascript', 'js', 'ecmascript'],
        'TypeScript': ['typescript', 'ts'],
        'Java':       ['java'],
        'SQL':        ['sql'],
        'Go':         ['go', 'golang'],
        'Rust':       ['rust'],
        'PHP':        ['php'],
        'Ruby':       ['ruby'],
        'Swift':      ['swift'],
        'Kotlin':     ['kotlin'],
      },
      frameworks: {
        'React':       ['react(?:\\.js)?', 'reactjs'],
        'Node.js':     ['node(?:\\.js)?', 'nodejs'],
        'Express':     ['express(?:\\.js)?', 'expressjs'],
        'Django':      ['django'],
        'Flask':       ['flask'],
        'FastAPI':     ['fastapi'],
        'Next.js':     ['next(?:\\.js)?', 'nextjs'],
        'Vue':         ['vue(?:\\.js)?', 'vuejs'],
        'Angular':     ['angular(?:js)?'],
        'Spring Boot': ['spring\\s*boot', 'springboot'],
        'Laravel':     ['laravel'],
        'Rails':       ['rails', 'ruby on rails'],
      },
      databases: {
        'MongoDB':    ['mongo(?:db)?'],
        'MySQL':      ['mysql'],
        'PostgreSQL': ['postgres(?:ql)?'],
        'Redis':      ['redis'],
        'Firebase':   ['firebase'],
        'SQLite':     ['sqlite'],
        'DynamoDB':   ['dynamodb'],
      },
      tools: {
        'Git':          ['git'],
        'GitHub':       ['github'],
        'Docker':       ['docker'],
        'Kubernetes':   ['kubernetes', 'k8s'],
        'VS Code':      ['vscode', 'vs code', 'visual studio code'],
        'Postman':      ['postman'],
        'Jira':         ['jira'],
        'Jenkins':      ['jenkins'],
        'Linux':        ['linux', 'ubuntu', 'debian'],
        'Webpack':      ['webpack'],
      },
      ai_ml: {
        'LangChain':        ['langchain'],
        'Huggingface':      ['huggingface', 'hugging face'],
        'TensorFlow':       ['tensorflow'],
        'PyTorch':          ['pytorch'],
        'Pandas':           ['pandas'],
        'NumPy':            ['numpy'],
        'Machine Learning': ['machine learning', 'ml'],
        'Deep Learning':    ['deep learning', 'dl'],
        'Scikit-learn':     ['scikit.learn', 'sklearn'],
        'OpenAI':           ['openai'],
      },
      cloud: {
        'AWS':    ['aws', 'amazon web services'],
        'Azure':  ['azure', 'microsoft azure'],
        'GCP':    ['gcp', 'google cloud'],
        'Heroku': ['heroku'],
        'Vercel': ['vercel'],
      },
      other: {
        'DSA':        ['dsa', 'data structures?', 'algorithms?'],
        'REST API':   ['rest(?:ful)?(?:\\s*api)?'],
        'GraphQL':    ['graphql'],
        'HTML':       ['html5?'],
        'CSS':        ['css3?'],
        'Tailwind':   ['tailwind(?:css)?'],
        'Bootstrap':  ['bootstrap'],
        'Redux':      ['redux'],
        'Sass':       ['sass', 'scss'],
        'OOP':        ['oop', 'object.oriented'],
        'Microservices': ['microservices?'],
        'System Design': ['system design'],
      }
    };

    const matchPatterns = (map) => {
      const results = [];
      for (const [skillName, patterns] of Object.entries(map)) {
        for (let pattern of patterns) {
          try {
            // Strip any hardcoded \b bounds if they were left in the dictionary
            pattern = pattern.replace(/\\b/gi, ''); 
            
            let flags = 'i';
            let regexStr = pattern;

            // 1. Strict Case-Sensitive constraints for high-risk single-letter tech
            if (pattern === 'c' || pattern === 'r') {
              flags = ''; // Case sensitive
              regexStr = `\\b${skillName}\\b`; // Strictly map 'c' to 'C' or 'r' to 'R'
            }
            // 2. Symbols (+, #) don't trigger standard \b word boundaries
            else if (pattern.includes('+') || pattern.includes('#')) {
              regexStr = `(?<!\\w)${regexStr}(?![\\w\\+#])`;
            }
            // 3. Standard parsing
            else {
              regexStr = `\\b${regexStr}\\b`;
            }

            if (new RegExp(regexStr, flags).test(text)) {
              results.push(skillName);
              break;
            }
          } catch (e) { /* invalid regex pattern — skip */ }
        }
      }
      return results;
    };

    // ── 1. Always scan tech skills ─────────────────────────────────────────
    for (const [category, skillList] of Object.entries(techSkillMap)) {
      skills[category] = matchPatterns(skillList);
    }

    // ── 2. Soft skills (universal) ────────────────────────────────────────
    skills.soft_skills = matchPatterns(softSkillMap);

    // ── 3. Domain-specific skills ─────────────────────────────────────────
    const techDomains = new Set(['software_development', 'data_science', 'cybersecurity', 'qa_testing']);
    const isTechDomain = detectedDomainKey && techDomains.has(detectedDomainKey);

    if (detectedDomainKey && domainSkillMaps[detectedDomainKey]) {
      skills.domain_skills = matchPatterns(domainSkillMaps[detectedDomainKey]);
    } else if (!isTechDomain) {
      const allDomainSkills = new Set();
      for (const [, domainMap] of Object.entries(domainSkillMaps)) {
        if (Object.keys(domainMap).length === 0) continue;
        matchPatterns(domainMap).forEach(s => allDomainSkills.add(s));
      }
      skills.domain_skills = Array.from(allDomainSkills);
    }

    // ── 4. Flatten all to a single list (deduped) ─────────────────────────
    const allSkillsSet = new Set([
      ...skills.languages,
      ...skills.frameworks,
      ...skills.databases,
      ...skills.tools,
      ...skills.ai_ml,
      ...skills.cloud,
      ...skills.other,
      ...skills.domain_skills,
      ...skills.soft_skills
    ]);
    skills.all = Array.from(allSkillsSet);

    return skills;
  }

  // ─── 5. Projects ──────────────────────────────────────────────────────────

  extractProjects(text) {
    const projects = [];
    const lines    = text.split('\n');

    const projIdx = this.findSectionIndex(lines, [/^projects?$/i, /^personal projects?$/i, /^academic projects?$/i]);
    if (projIdx === -1) return projects;

    const projLines = this.extractSectionLines(lines, projIdx);
    let current       = null;
    let inDescription = false;

    projLines.forEach(rawLine => {
      const line = rawLine.trim();
      if (!line) return;

      const isBullet = /^[•\-\*]/.test(line);

      const hasProjectLink = /github\.com\/|gitlab\.com\/|bitbucket\.org\//i.test(line);
      const isTitle = !isBullet &&
                       /^[A-Z]/.test(line) &&
                       (line.length < 80 || hasProjectLink) &&
                       line.length < 140 &&
                       !/^(react|node|python|mongo|express|built|developed|created|implemented|designed|engineered|architected|integrated|containerised|containerized|reduced)\b/i.test(line);

      if (isTitle) {
        if (current && (current.description.length > 0 || current.tech_stack.length > 0)) {
          projects.push(current);
        }
        current = { name: line, tech_stack: [], description: [], status: null, link: null };
        inDescription = false;
        const linkMatch = line.match(/https?:\/\/[^\s]+|(?:github|gitlab)\.com\/[^\s]+/i);
        if (linkMatch) current.link = linkMatch[0];
        return;
      }

      if (!current) return;

      if (/https?:\/\//.test(line) && !isBullet) {
        current.link = line.match(/https?:\/\/[^\s]+/)[0];
        return;
      }
      if (/^(in progress|completed|ongoing)$/i.test(line)) {
        current.status = line;
        return;
      }

      if (isBullet) {
        inDescription = true;
        current.description.push(line.replace(/^[•\-\*]\s*/, ''));
        return;
      }

      if (inDescription) {
        const isObviousTechList = line.length < 60 &&
                                   /^[A-Za-z0-9.+#\s,|]+$/.test(line) &&
                                   /[|,]/.test(line) &&
                                   !/[.!]$/.test(line);
        if (isObviousTechList) {
          current.tech_stack.push(...line.split(/[|,]/).map(t => t.trim()).filter(t => t.length > 1));
        } else {
          current.description.push(line);
        }
        return;
      }

      const looksLikeTechList = line.length < 100 &&
                                 /[|,]/.test(line) &&
                                 line.split(/[|,]/).length >= 2 &&
                                 !/\b(a|the|and|with|using|for|to|of|in|via|by)\b/i.test(line);

      if (looksLikeTechList) {
        current.tech_stack.push(...line.split(/[|,]/).map(t => t.trim()).filter(t => t.length > 1));
      } else {
        current.description.push(line);
      }
    });

    if (current && (current.description.length > 0 || current.tech_stack.length > 0)) {
      projects.push(current);
    }

    return projects.map(p => ({ ...p, description: p.description.join(' ').trim() }));
  }

  // ─── 6. Experience ────────────────────────────────────────────────────────

  extractExperience(text) {
    const experience = [];
    const lines      = text.split('\n');

    // ── A. Real work / internship experience ──────────────────────────────
    const expIdx = this.findSectionIndex(lines, [
      /^(work\s+)?experience$/i,
      /^professional\s+experience$/i,
      /^work\s+history$/i,
      /^employment(\s+history)?$/i,
      /^e\s*m\s*p\s*l\s*o\s*y\s*m\s*e\s*n\s*t/i,
      /^internships?$/i,
      /^career(\s+history)?$/i,
      /^positions?\s+held$/i,
    ]);

    if (expIdx !== -1) {
      const expLines = this.extractSectionLines(lines, expIdx);
      let current    = null;

      const durationPattern = /(?:(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s+)?\d{4}\s*[-–—]\s*(?:(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s+)?(?:\d{4}|present|ongoing|current)/i;
      const roleKeywords = /intern|developer|engineer|analyst|designer|manager|lead|consultant|associate|coordinator|specialist|executive|director|officer|architect|researcher|scientist|writer|editor|teacher|nurse|doctor|accountant|advisor|strategist|assistant|representative|head of|vp |cto|ceo|cmo|cfo/i;

      expLines.forEach(rawLine => {
        const line = rawLine.trim();
        if (!line) return;

        const hasDate = durationPattern.test(line);
        const hasRole = roleKeywords.test(line);

        if (hasDate && hasRole && line.length < 200) {
          if (current && current.role) experience.push(current);
          const dateMatch = line.match(durationPattern)[0];
          const roleText  = line.replace(durationPattern, '').replace(/^[\s,\-–—]+/, '').trim();
          current = { role: roleText || line, company: null, duration: dateMatch, description: [], type: 'professional' };
        } else if (hasDate && current) {
          current.duration = line.match(durationPattern)[0];
        } else if (hasRole && line.length < 150) {
          if (current && current.role) experience.push(current);
          current = { role: line, company: null, duration: null, description: [], type: 'professional' };
        } else if (current && !current.company && line.length < 100 &&
                   /^[A-Z]/.test(line) && !durationPattern.test(line) &&
                   !/^[•\-\*]/.test(line)) {
          current.company = line;
        } else if (current) {
          current.description.push(line.replace(/^[•\-\*]\s*/, ''));
        }
      });

      if (current && current.role) experience.push(current);
    }

    // ── B. Competitive programming achievements ───────────────────────────
    const leetcodeMatch = text.match(/LeetCode\s*(Knight|Guardian|Master)?\s*\(?(\d+)\)?/i);
    if (leetcodeMatch) {
      experience.push({
        role: `LeetCode ${leetcodeMatch[1] || 'User'}`,
        platform: 'LeetCode',
        rating: leetcodeMatch[2],
        description: `Solved 500+ problems; Rating: ${leetcodeMatch[2]}`,
        type: 'competitive'
      });
    }

    const codechefMatch = text.match(/CodeChef\s*(\d+)\s*(?:★|star|stars?)?.*?\((\d+).*?max.*?\)/i);
    if (codechefMatch) {
      experience.push({
        role: `${codechefMatch[1]}★ Coder`,
        platform: 'CodeChef',
        rating: codechefMatch[2],
        description: `Competitive programmer with ${codechefMatch[1]} star rating`,
        type: 'competitive'
      });
    }

    const codeforcesMatch = text.match(/Codeforces\s*(\d+)/i);
    if (codeforcesMatch) {
      experience.push({
        role: 'Competitive Programmer',
        platform: 'Codeforces',
        rating: codeforcesMatch[1],
        description: `Active on Codeforces with rating ${codeforcesMatch[1]}`,
        type: 'competitive'
      });
    }

    return experience;
  }

  // ─── 7. Certifications ────────────────────────────────────────────────────

  extractCertifications(text) {
    const certs    = [];
    const lines    = text.split('\n');
    const certIdx  = this.findSectionIndex(lines, [/^certifications?$/i, /^courses?$/i, /^licenses?(\s*&\s*certifications?)?$/i]);
    if (certIdx === -1) return certs;

    const certLines = this.extractSectionLines(lines, certIdx);
    certLines.forEach(line => {
      const l = line.trim().replace(/^[•\-\*]\s*/, '');
      if (l.length > 5) certs.push(l);
    });
    return certs;
  }

  // ─── Main parse function ──────────────────────────────────────────────────

  async parseResume(filePath, fileType) {
    const rawText = await this.extractText(filePath, fileType);

    let detectedDomainKey = null;
    try {
      const { detectDomain } = require('./domainTemplates');
      const domainResult = detectDomain(rawText);
      detectedDomainKey  = domainResult?.key || null;
    } catch (_) { /* domainTemplates not available */ }

    const contact        = this.extractContactInfo(rawText);
    const summary        = this.extractSummary(rawText);
    const education      = this.extractEducation(rawText);
    const skills         = this.extractSkillsCategorized(rawText, detectedDomainKey);
    const projects       = this.extractProjects(rawText);
    const experience     = this.extractExperience(rawText);
    const certifications = this.extractCertifications(rawText);

    const allSkills = skills.all || [
      ...skills.languages,
      ...skills.frameworks,
      ...skills.databases,
      ...skills.tools,
      ...skills.ai_ml,
      ...skills.cloud,
      ...skills.domain_skills,
      ...skills.soft_skills,
      ...skills.other
    ];

    const structured = {
      contact,
      summary,
      education,
      skills,
      projects,
      experience,
      certifications,
      all_skills: allSkills,
      detected_domain_key: detectedDomainKey
    };

    return {
      raw_text:  rawText,
      contact,
      summary,
      education,
      skills,
      skills_list: allSkills,
      projects,
      experience,
      certifications,
      name: contact.name,
      detected_domain_key: detectedDomainKey,

      sections: {
        skills:         skills,
        education:      education,
        projects:       projects,
        experience:     experience,
        certifications: certifications,
        summary:        summary
      },

      structured
    };
  }
}

module.exports = new EnhancedResumeParser();