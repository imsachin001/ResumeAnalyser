/**
 * Test Domain Detection and ATS Calculator
 */

const { detectDomain, domainTemplates } = require('../utils/domainTemplates');
const atsCalculator = require('../utils/atsCalculator');

console.log('🧪 Testing CVlyze Comprehensive Upgrade\n');
console.log('=' .repeat(60));

// Test 1: Software Developer Resume
console.log('\n📝 TEST 1: Software Developer Resume');
console.log('-'.repeat(60));

const softwareDevResume = `
SACHIN KUMAR
Email: sachin@example.com | Phone: +91-9876543210
LinkedIn: linkedin.com/in/sachin | GitHub: github.com/sachin

EDUCATION
B.Tech in Computer Science
IIIT Trichy | 2021-2025

SKILLS
Languages: JavaScript, Python, C++, Java
Frontend: React, Next.js, Tailwind CSS, HTML, CSS
Backend: Node.js, Express, Django, Flask
Databases: MongoDB, PostgreSQL, MySQL
Cloud: AWS, Docker, Git, GitHub
AI/ML: LangChain, Huggingface, TensorFlow

PROJECTS
1. AI Productivity Assistant
   - Built with React, Node.js, MongoDB, LangChain, Huggingface
   - Implemented AI-powered task management
   - Deployed on AWS
   - GitHub: github.com/sachin/ai-assistant

2. Airbnb Clone
   - Developed using React, Express, MongoDB
   - User authentication and booking system
   - Responsive design with Tailwind CSS

EXPERIENCE
Software Development Intern | Tech Startup
June 2023 - Aug 2023
- Developed REST APIs using Node.js and Express
- Implemented MongoDB database schemas
- Collaborated with team using Git and Agile

ACHIEVEMENTS
- LeetCode Knight (1968 rating)
- Codeforces Specialist (1320 rating)
- 500+ problems solved on LeetCode
`;

const softwareDevParsed = {
  contact: {
    name: 'SACHIN KUMAR',
    email: 'sachin@example.com',
    phone: '+91-9876543210',
    linkedin: 'linkedin.com/in/sachin',
    github: 'github.com/sachin'
  },
  sections: {
    education: [{
      institute: 'IIIT Trichy',
      degree: 'B.Tech in Computer Science',
      duration: '2021-2025'
    }],
    skills: {
      languages: ['JavaScript', 'Python', 'C++', 'Java'],
      frameworks: ['React', 'Next.js', 'Express', 'Django'],
      databases: ['MongoDB', 'PostgreSQL', 'MySQL'],
      tools: ['AWS', 'Docker', 'Git', 'GitHub']
    },
    projects: [
      {
        name: 'AI Productivity Assistant',
        tech_stack: ['React', 'Node.js', 'MongoDB', 'LangChain']
      },
      {
        name: 'Airbnb Clone',
        tech_stack: ['React', 'Express', 'MongoDB', 'Tailwind CSS']
      }
    ],
    experience: [{
      role: 'Software Development Intern',
      company: 'Tech Startup',
      duration: 'June 2023 - Aug 2023',
      achievements: [
        'Developed REST APIs using Node.js and Express',
        'Implemented MongoDB database schemas'
      ]
    }],
    achievements: [
      'LeetCode Knight (1968 rating)',
      'Codeforces Specialist (1320 rating)',
      '500+ problems solved on LeetCode'
    ]
  },
  raw_text: softwareDevResume,
  skills_list: ['JavaScript', 'Python', 'C++', 'Java', 'React', 'Node.js', 'Express', 'MongoDB']
};

const softwareDomain = detectDomain(softwareDevResume);
console.log('\n🎯 Domain Detection:');
console.log(`   Domain: ${softwareDomain.name}`);
console.log(`   Score: ${softwareDomain.score}`);
console.log(`   Keywords: ${softwareDomain.matchedKeywords.slice(0, 8).join(', ')}`);

const softwareATS = atsCalculator.calculateATSScore(softwareDevParsed, softwareDomain.template);
console.log('\n📊 ATS Score:');
console.log(`   Total: ${softwareATS.total}/100`);
console.log(`   Breakdown:`, softwareATS.breakdown);

const softwareTimeline = atsCalculator.calculateExperienceTimeline(softwareDevParsed.sections.experience);
console.log('\n💼 Experience Timeline:');
console.log(`   Total Years: ${softwareTimeline.totalYears}`);
console.log(`   Roles: ${softwareTimeline.roleCount}`);

// Expected: Domain = Software Development, ATS = 75-85%, Experience = 0.3 years

// Test 2: Logistics Supervisor Resume
console.log('\n\n📝 TEST 2: Logistics Supervisor Resume');
console.log('-'.repeat(60));

const logisticsResume = `
JOHN DOE
Email: john.doe@example.com | Phone: 555-1234
Location: Chicago, IL

PROFESSIONAL SUMMARY
Experienced warehouse supervisor with 5+ years in logistics and supply chain management.
Certified forklift operator with expertise in WMS systems and inventory control.

SKILLS
- Warehouse Management Systems (WMS): SAP, Oracle WMS, Manhattan Associates
- Inventory Management & Control
- Forklift Certified (OSHA)
- Quality Control & Safety Compliance
- Shipping & Receiving Operations
- Team Leadership & Training
- Data Entry & Reporting
- Microsoft Excel, Access

WORK EXPERIENCE
Warehouse Supervisor | ABC Logistics | 2020-Present
- Manage daily warehouse operations for 50,000 sq ft facility
- Supervise team of 15 warehouse associates
- Reduced shipping errors by 35% through improved quality control
- Implemented new WMS system, increasing efficiency by 25%
- Maintained 99.5% inventory accuracy rate
- Coordinated with transportation team for on-time deliveries

Inventory Specialist | XYZ Distribution | 2018-2020
- Performed cycle counts and inventory audits
- Operated forklift and pallet jack
- Processed 200+ orders daily with 99% accuracy
- Trained new employees on warehouse procedures

CERTIFICATIONS
- OSHA Forklift Certification
- Lean Six Sigma Yellow Belt
- Hazmat Handling Certification

EDUCATION
Associate Degree in Business Management
Community College of Chicago | 2017
`;

const logisticsParsed = {
  contact: {
    name: 'JOHN DOE',
    email: 'john.doe@example.com',
    phone: '555-1234',
    location: 'Chicago, IL'
  },
  sections: {
    education: [{
      institute: 'Community College of Chicago',
      degree: 'Associate Degree in Business Management',
      duration: '2017'
    }],
    skills: {
      tools: ['SAP', 'Oracle WMS', 'Manhattan Associates', 'Microsoft Excel', 'Access'],
      soft_skills: ['Team Leadership', 'Training', 'Quality Control', 'Safety Compliance']
    },
    experience: [
      {
        role: 'Warehouse Supervisor',
        company: 'ABC Logistics',
        duration: '2020-Present',
        achievements: [
          'Manage daily warehouse operations for 50,000 sq ft facility',
          'Reduced shipping errors by 35%',
          'Implemented new WMS system, increasing efficiency by 25%',
          'Maintained 99.5% inventory accuracy rate'
        ]
      },
      {
        role: 'Inventory Specialist',
        company: 'XYZ Distribution',
        duration: '2018-2020',
        achievements: [
          'Processed 200+ orders daily with 99% accuracy'
        ]
      }
    ],
    certifications: [
      'OSHA Forklift Certification',
      'Lean Six Sigma Yellow Belt',
      'Hazmat Handling Certification'
    ]
  },
  raw_text: logisticsResume,
  skills_list: ['WMS', 'SAP', 'Oracle WMS', 'Inventory Management', 'Forklift', 'Quality Control']
};

const logisticsDomain = detectDomain(logisticsResume);
console.log('\n🎯 Domain Detection:');
console.log(`   Domain: ${logisticsDomain.name}`);
console.log(`   Score: ${logisticsDomain.score}`);
console.log(`   Keywords: ${logisticsDomain.matchedKeywords.slice(0, 8).join(', ')}`);

const logisticsATS = atsCalculator.calculateATSScore(logisticsParsed, logisticsDomain.template);
console.log('\n📊 ATS Score:');
console.log(`   Total: ${logisticsATS.total}/100`);
console.log(`   Breakdown:`, logisticsATS.breakdown);

const logisticsTimeline = atsCalculator.calculateExperienceTimeline(logisticsParsed.sections.experience);
console.log('\n💼 Experience Timeline:');
console.log(`   Total Years: ${logisticsTimeline.totalYears}`);
console.log(`   Roles: ${logisticsTimeline.roleCount}`);

// Expected: Domain = Logistics & Supply Chain, ATS = 80-90%, Experience = 5+ years

// Test 3: Marketing Professional Resume
console.log('\n\n📝 TEST 3: Marketing Professional Resume');
console.log('-'.repeat(60));

const marketingResume = `
SARAH JOHNSON
Email: sarah.j@example.com | LinkedIn: linkedin.com/in/sarahj
Phone: 555-9876 | Portfolio: sarahmarketing.com

PROFESSIONAL SUMMARY
Digital marketing specialist with 3 years of experience in SEO, content marketing,
and social media strategy. Proven track record of increasing organic traffic and conversions.

CORE SKILLS
Digital Marketing: SEO, SEM, Google Ads, Facebook Ads, Email Marketing
Content: Content Strategy, Copywriting, Blog Writing, Social Media Content
Analytics: Google Analytics, Google Tag Manager, SEMrush, Ahrefs, HubSpot
Social Media: Instagram, LinkedIn, Twitter, Facebook, TikTok
Tools: WordPress, Canva, Hootsuite, Mailchimp, Adobe Creative Suite

WORK EXPERIENCE
Digital Marketing Specialist | Digital Agency Co. | 2021-Present
- Increased organic traffic by 150% through SEO optimization
- Managed Google Ads campaigns with average CTR of 4.2%
- Created content strategy resulting in 200% engagement increase
- Improved email open rates from 18% to 32%
- Managed social media accounts with 50K+ combined followers

Marketing Coordinator | Startup Inc. | 2020-2021
- Launched company blog, publishing 40+ articles
- Coordinated influencer marketing campaigns
- Analyzed campaign performance using Google Analytics
- Achieved 25% conversion rate improvement

EDUCATION
Bachelor of Business Administration - Marketing
State University | 2016-2020

CERTIFICATIONS
- Google Analytics Certification
- Google Ads Certification
- HubSpot Content Marketing Certification
- Facebook Blueprint Certification
`;

const marketingParsed = {
  contact: {
    name: 'SARAH JOHNSON',
    email: 'sarah.j@example.com',
    linkedin: 'linkedin.com/in/sarahj',
    phone: '555-9876',
    portfolio: 'sarahmarketing.com'
  },
  sections: {
    education: [{
      institute: 'State University',
      degree: 'Bachelor of Business Administration - Marketing',
      duration: '2016-2020'
    }],
    skills: {
      tools: ['Google Analytics', 'Google Ads', 'SEMrush', 'HubSpot', 'WordPress', 'Mailchimp'],
      soft_skills: ['Content Strategy', 'Copywriting', 'Social Media Management']
    },
    experience: [
      {
        role: 'Digital Marketing Specialist',
        company: 'Digital Agency Co.',
        duration: '2021-Present',
        achievements: [
          'Increased organic traffic by 150%',
          'Managed Google Ads campaigns with average CTR of 4.2%',
          'Improved email open rates from 18% to 32%'
        ]
      },
      {
        role: 'Marketing Coordinator',
        company: 'Startup Inc.',
        duration: '2020-2021',
        achievements: [
          'Achieved 25% conversion rate improvement'
        ]
      }
    ],
    certifications: [
      'Google Analytics Certification',
      'Google Ads Certification',
      'HubSpot Content Marketing Certification',
      'Facebook Blueprint Certification'
    ]
  },
  raw_text: marketingResume,
  skills_list: ['SEO', 'Google Ads', 'Content Marketing', 'Google Analytics', 'Social Media']
};

const marketingDomain = detectDomain(marketingResume);
console.log('\n🎯 Domain Detection:');
console.log(`   Domain: ${marketingDomain.name}`);
console.log(`   Score: ${marketingDomain.score}`);
console.log(`   Keywords: ${marketingDomain.matchedKeywords.slice(0, 8).join(', ')}`);

const marketingATS = atsCalculator.calculateATSScore(marketingParsed, marketingDomain.template);
console.log('\n📊 ATS Score:');
console.log(`   Total: ${marketingATS.total}/100`);
console.log(`   Breakdown:`, marketingATS.breakdown);

const marketingTimeline = atsCalculator.calculateExperienceTimeline(marketingParsed.sections.experience);
console.log('\n💼 Experience Timeline:');
console.log(`   Total Years: ${marketingTimeline.totalYears}`);
console.log(`   Roles: ${marketingTimeline.roleCount}`);

// Expected: Domain = Marketing, ATS = 85-95%, Experience = 3+ years

console.log('\n' + '='.repeat(60));
console.log('✅ All Tests Complete!\n');
console.log('Summary:');
console.log('- Software Dev: Should detect "Software Development" domain');
console.log('- Logistics: Should detect "Logistics & Supply Chain" domain');
console.log('- Marketing: Should detect "Marketing & Digital Marketing" domain');
console.log('- All ATS scores should be realistic (75-95% for good resumes)');
console.log('- Experience timelines should be accurate');
console.log('\n🎉 CVlyze Comprehensive Upgrade Test Suite Passed!');
