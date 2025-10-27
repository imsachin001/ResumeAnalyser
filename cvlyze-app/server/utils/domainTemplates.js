/**
 * Domain Templates for Adaptive Resume Analysis
 * Covers 90% of common job domains
 */

const domainTemplates = {
  // 1. Software Development & Tech
  software_development: {
    name: 'Software Development & Engineering',
    keywords: [
      'software', 'developer', 'engineer', 'programming', 'coding', 'web development',
      'frontend', 'backend', 'full stack', 'fullstack', 'javascript', 'python', 'java',
      'react', 'node', 'angular', 'vue', 'api', 'database', 'sql', 'mongodb',
      'git', 'github', 'agile', 'scrum', 'ci/cd', 'devops', 'cloud', 'aws', 'azure'
    ],
    important_skills: [
      'Programming Languages', 'Frameworks', 'Databases', 'Version Control',
      'Problem Solving', 'Data Structures', 'Algorithms', 'System Design',
      'API Development', 'Testing', 'Debugging', 'Code Review'
    ],
    suggested_roles: [
      'Software Developer', 'Full Stack Developer', 'Frontend Developer',
      'Backend Developer', 'Software Engineer', 'Web Developer', 'DevOps Engineer'
    ],
    weight: 1.0
  },

  // 2. Data Science & AI/ML
  data_science: {
    name: 'Data Science & Machine Learning',
    keywords: [
      'data science', 'machine learning', 'deep learning', 'ai', 'artificial intelligence',
      'data analyst', 'data engineer', 'ml engineer', 'python', 'r', 'tensorflow',
      'pytorch', 'sklearn', 'pandas', 'numpy', 'statistics', 'analytics', 'big data',
      'visualization', 'tableau', 'power bi', 'sql', 'spark', 'hadoop', 'nlp', 'computer vision'
    ],
    important_skills: [
      'Python/R', 'Statistical Analysis', 'Machine Learning', 'Data Visualization',
      'SQL', 'Data Cleaning', 'Model Development', 'Feature Engineering',
      'Deep Learning', 'Big Data Tools', 'Communication', 'Business Acumen'
    ],
    suggested_roles: [
      'Data Scientist', 'Machine Learning Engineer', 'Data Analyst',
      'AI Engineer', 'Data Engineer', 'Business Intelligence Analyst'
    ],
    weight: 1.0
  },

  // 3. UI/UX Design
  design: {
    name: 'UI/UX Design & Product Design',
    keywords: [
      'ui', 'ux', 'design', 'designer', 'figma', 'sketch', 'adobe xd', 'photoshop',
      'illustrator', 'prototyping', 'wireframe', 'user interface', 'user experience',
      'visual design', 'interaction design', 'design thinking', 'usability', 'accessibility',
      'typography', 'color theory', 'branding', 'graphic design'
    ],
    important_skills: [
      'Figma/Sketch', 'Prototyping', 'User Research', 'Wireframing', 'Visual Design',
      'Interaction Design', 'Design Systems', 'Responsive Design', 'Accessibility',
      'Collaboration', 'Creativity', 'Attention to Detail'
    ],
    suggested_roles: [
      'UI/UX Designer', 'Product Designer', 'Visual Designer',
      'Interaction Designer', 'UX Researcher', 'Graphic Designer'
    ],
    weight: 1.0
  },

  // 4. Digital Marketing
  marketing: {
    name: 'Digital Marketing & Growth',
    keywords: [
      'marketing', 'digital marketing', 'seo', 'sem', 'social media', 'content marketing',
      'email marketing', 'ppc', 'google ads', 'facebook ads', 'analytics', 'google analytics',
      'campaigns', 'branding', 'copywriting', 'content creation', 'engagement', 'conversion',
      'growth hacking', 'marketing automation', 'crm', 'hubspot', 'mailchimp'
    ],
    important_skills: [
      'SEO/SEM', 'Social Media Marketing', 'Content Strategy', 'Analytics',
      'Campaign Management', 'Copywriting', 'Email Marketing', 'PPC Advertising',
      'Marketing Automation', 'Data Analysis', 'Creativity', 'Communication'
    ],
    suggested_roles: [
      'Digital Marketing Specialist', 'SEO Specialist', 'Social Media Manager',
      'Content Marketing Manager', 'Growth Marketer', 'Marketing Analyst'
    ],
    weight: 0.9
  },

  // 5. Sales & Business Development
  sales: {
    name: 'Sales & Business Development',
    keywords: [
      'sales', 'business development', 'account manager', 'client relationship',
      'revenue', 'targets', 'quota', 'crm', 'salesforce', 'lead generation',
      'prospecting', 'negotiation', 'closing', 'pipeline', 'b2b', 'b2c',
      'customer acquisition', 'retention', 'upselling', 'cross-selling'
    ],
    important_skills: [
      'Sales Strategy', 'Lead Generation', 'Client Relationship Management',
      'Negotiation', 'Communication', 'CRM Tools', 'Presentation Skills',
      'Target Achievement', 'Market Research', 'Networking', 'Persuasion'
    ],
    suggested_roles: [
      'Sales Executive', 'Business Development Manager', 'Account Manager',
      'Sales Manager', 'Key Account Manager', 'Inside Sales Representative'
    ],
    weight: 0.9
  },

  // 6. Customer Support & Service
  customer_service: {
    name: 'Customer Support & Service',
    keywords: [
      'customer service', 'customer support', 'support specialist', 'help desk',
      'technical support', 'client support', 'customer satisfaction', 'ticketing',
      'zendesk', 'freshdesk', 'communication', 'problem solving', 'escalation',
      'troubleshooting', 'chat support', 'phone support', 'email support'
    ],
    important_skills: [
      'Communication', 'Problem Solving', 'Patience', 'Product Knowledge',
      'Ticketing Systems', 'Active Listening', 'Conflict Resolution',
      'Multitasking', 'Empathy', 'Time Management', 'Technical Skills'
    ],
    suggested_roles: [
      'Customer Support Specialist', 'Technical Support Engineer',
      'Customer Success Manager', 'Help Desk Analyst', 'Support Team Lead'
    ],
    weight: 0.85
  },

  // 7. Logistics & Supply Chain
  logistics: {
    name: 'Logistics & Supply Chain Management',
    keywords: [
      'logistics', 'supply chain', 'warehouse', 'inventory', 'distribution',
      'shipping', 'receiving', 'forklift', 'wms', 'warehouse management',
      'stock', 'procurement', 'vendor management', 'transportation',
      'freight', 'dispatch', 'order fulfillment', 'quality control', 'sanitation'
    ],
    important_skills: [
      'Inventory Management', 'WMS/ERP Systems', 'Accuracy', 'Efficiency',
      'Team Coordination', 'Safety Compliance', 'Quality Control',
      'Process Optimization', 'Record Keeping', 'Communication', 'Leadership'
    ],
    suggested_roles: [
      'Warehouse Supervisor', 'Logistics Coordinator', 'Supply Chain Manager',
      'Inventory Manager', 'Warehouse Manager', 'Operations Coordinator'
    ],
    weight: 0.9
  },

  // 8. Human Resources
  human_resources: {
    name: 'Human Resources & Talent Management',
    keywords: [
      'hr', 'human resources', 'recruitment', 'talent acquisition', 'hiring',
      'employee relations', 'onboarding', 'payroll', 'benefits', 'hris',
      'compensation', 'performance management', 'training', 'development',
      'workforce planning', 'compliance', 'labor law', 'employee engagement'
    ],
    important_skills: [
      'Recruitment', 'Employee Relations', 'HRIS Systems', 'Compliance',
      'Interviewing', 'Conflict Resolution', 'Communication', 'Organization',
      'Confidentiality', 'Labor Law Knowledge', 'Training & Development'
    ],
    suggested_roles: [
      'HR Specialist', 'Recruiter', 'HR Manager', 'Talent Acquisition Specialist',
      'HR Business Partner', 'Employee Relations Manager'
    ],
    weight: 0.9
  },

  // 9. Finance & Accounting
  finance: {
    name: 'Finance & Accounting',
    keywords: [
      'finance', 'accounting', 'accountant', 'financial analyst', 'bookkeeping',
      'auditing', 'tax', 'budget', 'forecasting', 'financial reporting',
      'quickbooks', 'excel', 'sap', 'oracle', 'accounts payable', 'accounts receivable',
      'reconciliation', 'gaap', 'financial statements', 'analysis'
    ],
    important_skills: [
      'Financial Analysis', 'Accounting Software', 'Excel', 'Budgeting',
      'Financial Reporting', 'Attention to Detail', 'GAAP Knowledge',
      'Reconciliation', 'Tax Preparation', 'Auditing', 'Analytical Skills'
    ],
    suggested_roles: [
      'Financial Analyst', 'Accountant', 'Senior Accountant',
      'Finance Manager', 'Auditor', 'Tax Specialist'
    ],
    weight: 0.95
  },

  // 10. Healthcare & Medical
  healthcare: {
    name: 'Healthcare & Medical',
    keywords: [
      'healthcare', 'medical', 'nurse', 'physician', 'doctor', 'patient care',
      'clinical', 'hospital', 'health', 'medical assistant', 'pharmacy',
      'ehr', 'emr', 'hipaa', 'diagnosis', 'treatment', 'medication',
      'medical records', 'healthcare administration'
    ],
    important_skills: [
      'Patient Care', 'Clinical Knowledge', 'EMR/EHR Systems', 'HIPAA Compliance',
      'Communication', 'Empathy', 'Medical Terminology', 'Documentation',
      'Attention to Detail', 'Teamwork', 'Critical Thinking'
    ],
    suggested_roles: [
      'Registered Nurse', 'Medical Assistant', 'Healthcare Administrator',
      'Clinical Coordinator', 'Patient Care Specialist'
    ],
    weight: 1.0
  },

  // 11. Education & Teaching
  education: {
    name: 'Education & Teaching',
    keywords: [
      'teacher', 'educator', 'teaching', 'instructor', 'professor', 'tutor',
      'curriculum', 'lesson planning', 'classroom management', 'education',
      'training', 'learning', 'student engagement', 'assessment', 'pedagogy',
      'online teaching', 'e-learning', 'instructional design'
    ],
    important_skills: [
      'Curriculum Development', 'Classroom Management', 'Communication',
      'Student Engagement', 'Assessment', 'Patience', 'Creativity',
      'Technology Integration', 'Lesson Planning', 'Mentoring'
    ],
    suggested_roles: [
      'Teacher', 'Instructor', 'Curriculum Developer', 'Training Specialist',
      'Educational Consultant', 'E-Learning Developer'
    ],
    weight: 0.9
  },

  // 12. Project Management
  project_management: {
    name: 'Project Management',
    keywords: [
      'project manager', 'program manager', 'project management', 'pmp', 'agile',
      'scrum', 'kanban', 'stakeholder management', 'risk management', 'jira',
      'asana', 'trello', 'budget management', 'timeline', 'deliverables',
      'coordination', 'planning', 'execution', 'monitoring'
    ],
    important_skills: [
      'Project Planning', 'Stakeholder Management', 'Agile/Scrum', 'Risk Management',
      'Budget Management', 'Communication', 'Leadership', 'Problem Solving',
      'Time Management', 'Project Tools (Jira/Asana)', 'Reporting'
    ],
    suggested_roles: [
      'Project Manager', 'Program Manager', 'Scrum Master',
      'Product Manager', 'Agile Coach', 'PMO Lead'
    ],
    weight: 0.95
  },

  // 13. Content Writing & Copywriting
  content_writing: {
    name: 'Content Writing & Copywriting',
    keywords: [
      'content writer', 'copywriter', 'writing', 'content creation', 'blogging',
      'technical writing', 'editing', 'proofreading', 'seo writing', 'journalism',
      'storytelling', 'creative writing', 'content strategy', 'cms', 'wordpress'
    ],
    important_skills: [
      'Writing', 'Editing', 'SEO', 'Research', 'Creativity', 'Grammar',
      'Content Strategy', 'CMS Tools', 'Storytelling', 'Attention to Detail',
      'Deadline Management', 'Adaptability'
    ],
    suggested_roles: [
      'Content Writer', 'Copywriter', 'Technical Writer',
      'Content Strategist', 'Editor', 'Blogger'
    ],
    weight: 0.85
  },

  // 14. Quality Assurance & Testing
  qa_testing: {
    name: 'Quality Assurance & Testing',
    keywords: [
      'qa', 'quality assurance', 'testing', 'test engineer', 'sdet', 'automation',
      'manual testing', 'selenium', 'test cases', 'bug tracking', 'jira',
      'regression testing', 'test automation', 'performance testing', 'api testing',
      'load testing', 'quality control'
    ],
    important_skills: [
      'Test Planning', 'Test Automation', 'Manual Testing', 'Bug Tracking',
      'Selenium/Testing Tools', 'Attention to Detail', 'Analytical Skills',
      'API Testing', 'Regression Testing', 'Documentation', 'Communication'
    ],
    suggested_roles: [
      'QA Engineer', 'Test Engineer', 'SDET', 'Automation Engineer',
      'QA Lead', 'Performance Test Engineer'
    ],
    weight: 0.95
  },

  // 15. Cybersecurity
  cybersecurity: {
    name: 'Cybersecurity & Information Security',
    keywords: [
      'cybersecurity', 'security', 'information security', 'penetration testing',
      'ethical hacking', 'network security', 'security analyst', 'firewall',
      'encryption', 'vulnerability', 'compliance', 'iso', 'cissp', 'ceh',
      'incident response', 'threat analysis', 'siem', 'security operations'
    ],
    important_skills: [
      'Network Security', 'Penetration Testing', 'Vulnerability Assessment',
      'Incident Response', 'Security Tools', 'Compliance', 'Risk Analysis',
      'Encryption', 'Firewalls', 'SIEM', 'Threat Intelligence'
    ],
    suggested_roles: [
      'Security Analyst', 'Cybersecurity Engineer', 'Penetration Tester',
      'Security Consultant', 'SOC Analyst', 'Information Security Manager'
    ],
    weight: 1.0
  }
};

/**
 * Detect the primary domain of a resume based on keyword matching
 */
function detectDomain(resumeText) {
  const textLower = resumeText.toLowerCase();
  const domainScores = {};

  // Score each domain based on keyword matches
  for (const [domainKey, template] of Object.entries(domainTemplates)) {
    let score = 0;
    let matchedKeywords = [];

    template.keywords.forEach(keyword => {
      const regex = new RegExp(`\\b${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
      const matches = textLower.match(regex);
      if (matches) {
        score += matches.length * template.weight;
        matchedKeywords.push(keyword);
      }
    });

    if (score > 0) {
      domainScores[domainKey] = {
        score,
        matchedKeywords: [...new Set(matchedKeywords)],
        template
      };
    }
  }

  // Find domain with highest score
  let primaryDomain = null;
  let maxScore = 0;

  for (const [domainKey, data] of Object.entries(domainScores)) {
    if (data.score > maxScore) {
      maxScore = data.score;
      primaryDomain = {
        key: domainKey,
        name: data.template.name,
        score: data.score,
        matchedKeywords: data.matchedKeywords,
        template: data.template
      };
    }
  }

  // Default to software development if no strong match
  if (!primaryDomain || maxScore < 3) {
    primaryDomain = {
      key: 'software_development',
      name: domainTemplates.software_development.name,
      score: 0,
      matchedKeywords: [],
      template: domainTemplates.software_development
    };
  }

  return primaryDomain;
}

module.exports = {
  domainTemplates,
  detectDomain
};
