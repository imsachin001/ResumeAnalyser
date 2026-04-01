const { GoogleGenerativeAI } = require('@google/generative-ai');
const domainTemplates = require('./domainTemplates');
const atsCalculator = require('./atsCalculator');

class AIAnalyzer {
  constructor() {
    // Predefined skill dictionary for comprehensive matching
    this.techSkillsDictionary = [
      // Programming Languages
      'C++', 'C', 'Python', 'JavaScript', 'TypeScript', 'Java', 'Go', 'Rust', 'PHP', 'Ruby', 'Swift', 'Kotlin',
      // Frontend
      'React', 'Angular', 'Vue.js', 'Next.js', 'HTML', 'HTML5', 'CSS', 'CSS3', 'Tailwind', 'TailwindCSS', 'Bootstrap', 'Material-UI', 'Redux', 'jQuery',
      // Backend
      'Node.js', 'Express', 'Express.js', 'Django', 'Flask', 'FastAPI', 'Spring Boot', 'ASP.NET', 'Laravel', 'Rails',
      // Databases
      'MongoDB', 'MySQL', 'PostgreSQL', 'SQL', 'NoSQL', 'Redis', 'Firebase', 'DynamoDB', 'SQLite', 'Oracle',
      // Cloud & DevOps
      'AWS', 'Azure', 'GCP', 'Google Cloud', 'Docker', 'Kubernetes', 'CI/CD', 'Jenkins', 'GitHub Actions', 'Terraform',
      // AI/ML
      'Machine Learning', 'Deep Learning', 'TensorFlow', 'PyTorch', 'LangChain', 'Huggingface', 'OpenAI', 'NLP', 'Computer Vision', 'Scikit-learn',
      // Tools & Platforms
      'Git', 'GitHub', 'GitLab', 'Bitbucket', 'VS Code', 'IntelliJ', 'Postman', 'Jira', 'Linux', 'Unix',
      // Other Skills
      'REST API', 'GraphQL', 'Microservices', 'DSA', 'Data Structures', 'Algorithms', 'OOP', 'System Design',
      'LeetCode', 'Codeforces', 'HackerRank', 'Agile', 'Scrum', 'Testing', 'Jest', 'Mocha', 'Selenium',
      // Additional
      'Pandas', 'Numpy', 'Recharts', 'D3.js'
    ];

    // Synonym dictionary for context-aware skill matching
    this.skillSynonyms = {
      'React': ['ReactJS', 'React Js', 'React.js', 'react js', 'reactjs', 'react-js', 'REACT', 'React JS', 'Reactjs'],
      'Node.js': ['Node', 'NodeJs', 'NodeJS', 'node js', 'Nodejs', 'node-js', 'NODE', 'Node JS'],
      'MongoDB': ['Mongo', 'Mongo Db', 'MongoDb', 'mongo db', 'mongodb', 'MONGODB', 'Mongo DB'],
      'Express': ['ExpressJS', 'Express.js', 'express js', 'expressjs', 'ExpressJs', 'EXPRESS', 'Express JS'],
      'JavaScript': ['JS', 'Javascript', 'java script', 'javascript', 'JAVASCRIPT', 'Java Script', 'js'],
      'TypeScript': ['TS', 'Typescript', 'type script', 'typescript', 'TYPESCRIPT', 'ts'],
      'Python': ['Py', 'python', 'PYTHON', 'py'],
      'C++': ['CPP', 'Cpp', 'C Plus Plus', 'c++', 'cpp', 'C plus plus', 'C PLUS PLUS'],
      'PostgreSQL': ['Postgres', 'postgres', 'PostgreSql', 'postgresql', 'POSTGRESQL', 'Postgre SQL'],
      'MySQL': ['My SQL', 'MySql', 'mysql', 'MYSQL', 'My Sql'],
      'SQL': ['sql', 'Sql', 'structured query language'],
      'HTML5': ['HTML', 'html', 'html5', 'Html', 'HTML 5'],
      'CSS3': ['CSS', 'css', 'css3', 'Css', 'CSS 3'],
      'Tailwind': ['TailwindCSS', 'Tailwind CSS', 'tailwind', 'tailwindcss', 'Tailwind Css'],
      'Bootstrap': ['BS', 'bootstrap', 'BOOTSTRAP'],
      'Git': ['git', 'GIT'],
      'GitHub': ['Github', 'github', 'git hub', 'Git Hub', 'GITHUB'],
      'VS Code': ['VSCode', 'Visual Studio Code', 'vscode', 'VS CODE'],
      'LeetCode': ['Leetcode', 'leetcode', 'leet code', 'Leet Code', 'LEETCODE'],
      'Codeforces': ['codeforces', 'code forces', 'Code Forces', 'CODEFORCES'],
      'HackerRank': ['Hackerrank', 'hackerrank', 'hacker rank', 'Hacker Rank', 'HACKERRANK'],
      'LangChain': ['Langchain', 'langchain', 'lang chain', 'Lang Chain', 'LANGCHAIN'],
      'Huggingface': ['HuggingFace', 'huggingface', 'hugging face', 'Hugging Face', 'HUGGINGFACE'],
      'NumPy': ['Numpy', 'numpy', 'num py', 'Num Py', 'NUMPY'],
      'Pandas': ['pandas', 'panda', 'PANDAS'],
      'AWS': ['Amazon Web Services', 'aws', 'Amazon Web Service'],
      'GCP': ['Google Cloud Platform', 'Google Cloud', 'gcp', 'GC Platform'],
      'Azure': ['Microsoft Azure', 'azure', 'AZURE'],
      'Docker': ['docker', 'DOCKER'],
      'Kubernetes': ['K8s', 'k8s', 'kubernetes', 'KUBERNETES'],
      'REST API': ['REST', 'RESTful', 'rest api', 'restful api', 'Rest API', 'REST Api', 'Restful API'],
      'GraphQL': ['graphql', 'graph ql', 'Graph QL', 'GRAPHQL'],
      'Redux': ['redux', 'REDUX', 'Redux.js'],
      'Next.js': ['NextJS', 'Next', 'Nextjs', 'next', 'nextjs', 'Next JS'],
      'Vue.js': ['Vue', 'VueJS', 'Vuejs', 'vue', 'vuejs', 'Vue JS'],
      'Angular': ['AngularJS', 'angular', 'ANGULAR', 'Angular JS'],
      'Django': ['django', 'DJANGO'],
      'Flask': ['flask', 'FLASK'],
      'FastAPI': ['Fast API', 'fastapi', 'FASTAPI', 'fast api'],
      'Spring Boot': ['SpringBoot', 'Spring', 'spring boot', 'springboot', 'SPRING BOOT'],
      'Material-UI': ['MaterialUI', 'MUI', 'material ui', 'Material UI', 'MATERIAL-UI'],
      'jQuery': ['JQuery', 'jquery', 'JQUERY', 'J Query'],
      'TensorFlow': ['Tensorflow', 'tensorflow', 'tensor flow', 'Tensor Flow', 'TENSORFLOW'],
      'PyTorch': ['Pytorch', 'pytorch', 'py torch', 'Py Torch', 'PYTORCH'],
      'Recharts': ['recharts', 're-charts', 'Re-charts', 'RECHARTS'],
      'Data Structures': ['DSA', 'DS', 'Data Structure', 'data structures', 'DATA STRUCTURES'],
      'Algorithms': ['Algorithm', 'algorithms', 'algo', 'ALGORITHMS'],
      'OOP': ['Object Oriented Programming', 'Object-Oriented Programming', 'oop', 'Object Oriented']
    };
  }

  /**
   * Create analysis prompt for Gemini AI
   */
  createAnalysisPrompt(parsedData, jobDescription) {
    // Determine if custom JD is provided
    const hasCustomJD = jobDescription && jobDescription.trim().length > 20;
    
    // Step 5: Smart default target role if no JD provided
    const targetRole = hasCustomJD ? jobDescription.trim() : `Software Developer / MERN Stack Developer / Full Stack Engineer

Target Role Requirements:
- Strong programming fundamentals (Data Structures, Algorithms, Problem Solving)
- Web development: React.js, Node.js, Express.js, MongoDB (MERN Stack)
- Frontend skills: HTML5, CSS3, JavaScript, Tailwind/Bootstrap
- Backend skills: REST APIs, authentication, database design
- Version control: Git, GitHub
- Problem-solving: LeetCode, DSA practice
- Projects: Full-stack applications, clones (Airbnb, Netflix, etc.), productivity apps
- Nice to have: Cloud platforms (AWS/Azure), Docker, CI/CD
- Soft skills: Teamwork, communication, learning agility

This is an entry-to-mid level software development role suitable for recent graduates or early-career developers with strong project portfolios.`;

    // Step 1: Use structured resume data
    const structuredResume = parsedData.structured || this.createFallbackStructure(parsedData);

    // Step 3: Prepare skill dictionary for matching
    const skillDictionaryStr = this.techSkillsDictionary.join(', ');

    // Custom JD analysis instructions
    const jdInstructions = hasCustomJD ? `
CUSTOM JOB DESCRIPTION PROVIDED: The user wants a personalized match score against this specific job posting.

YOUR ANALYSIS APPROACH:
1. Extract ALL required skills, qualifications, and requirements from the job description
2. Compare the resume's skills, projects, and experience DIRECTLY against the JD requirements
3. Calculate Job Match Score based on overlap:
   - Count how many JD requirements are met by the resume
   - Skills mentioned in JD that appear in resume = high match
   - Projects/experience relevant to JD role = high match
4. In "missing_skills", list ONLY skills explicitly mentioned in the JD that are absent from resume
5. In "recommendations", provide advice specifically for this job application

JOB MATCH SCORE FORMULA FOR CUSTOM JD:
- JD required skills found in resume: 50 points (proportional to match %)
- Resume projects/experience relevant to JD: 30 points
- Educational requirements met: 10 points  
- Years of experience/seniority match: 10 points
EXPECTED RANGE: 55-85% for strong candidates, 40-55% for partial matches
` : `
NO CUSTOM JOB DESCRIPTION: Using default MERN Stack Developer role for comparison.
Follow the standard scoring logic for MERN stack positions.
`;

    const prompt = `You are an ATS (Applicant Tracking System) evaluation engine with expertise in technical resume analysis.

YOUR TASK: Read the resume carefully and systematically. DO NOT skip sections or assume content is missing without verification. If technical skills, projects, or achievements appear ANYWHERE in the resume (even in Experience, Projects, or Education sections), COUNT THEM.

${jdInstructions}

STRUCTURED RESUME DATA (Read each section carefully):
${JSON.stringify(structuredResume, null, 2)}

TARGET ROLE / JOB DESCRIPTION:
${targetRole}

PREDEFINED TECHNICAL SKILLS TO CHECK:
${skillDictionaryStr}

IMPORTANT INSTRUCTIONS:
1. Mark ANY of the above skills as "Matched Skills" if found in the resume (case-insensitive matching)
2. Check ALL sections (Skills, Projects, Experience, Education) for technical content
3. Do not penalize for short summaries or non-traditional formatting
4. If a skill appears in projects or experience descriptions, it counts as a matched skill
5. Be generous with skill matching (e.g., "JavaScript" matches "JS", "Node" matches "Node.js")

SCORING LOGIC (Use this exact framework - DO NOT deviate):

ATS Score Calculation (Total: 100 points):
Step 1 - Skills coverage: 40 points
  * Count all matched skills from the skill dictionary
  * 10+ relevant skills: 40 points
  * 5-9 skills: 30 points
  * 3-4 skills: 20 points
  * 1-2 skills: 10 points
  
Step 2 - Project relevance: 25 points
  * Count projects mentioned in Projects/Experience sections
  * 3+ projects with tech stack: 25 points
  * 2 projects: 18 points
  * 1 project: 10 points
  * No projects: 5 points
  
Step 3 - Experience indicators: 15 points
  * Professional experience: 15 points
  * Internships: 10 points
  * Student/Fresher with projects: 8 points
  
Step 4 - Resume structure & readability: 10 points
  * Clear sections (SKILLS, EXPERIENCE, EDUCATION): 10 points
  * Basic structure: 6 points
  
Step 5 - Online presence: 10 points
  * GitHub + LinkedIn + Portfolio: 10 points
  * GitHub OR LinkedIn: 6 points
  * Email + Phone only: 4 points

FORMULA: Add all points from Step 1-5. Minimum 40, Maximum 100.

Job Match Score Calculation (Total: 100 points):
Step 1 - Skills alignment: 50 points
  * Calculate: (matched_skills / required_skills_in_JD) * 50
  * MERN stack (React, Node, Express, MongoDB): Full match = 50 points
  
Step 2 - Projects/Experience relevance: 30 points
  * Projects match JD requirements: 30 points
  * Partially relevant: 20 points
  * Some relevance: 10 points
  
Step 3 - Educational background: 10 points
  * CS/IT degree: 10 points
  * Related degree: 7 points
  * Self-taught: 5 points
  
Step 4 - Online presence & learning: 10 points
  * GitHub + LeetCode/Codeforces profile: 10 points
  * One platform: 5 points

FORMULA: Add all points from Step 1-4. Minimum 45, Maximum 100.

IMPORTANT: These scores should be CALCULATED, not guessed. Follow the formulas strictly.

RESPONSE FORMAT (Provide ONLY valid JSON, no markdown):
{
  "ats_score": <number 0-100>,
  "match_score": <number 0-100>,
  "matched_skills": [<array of skills from resume that match the skill dictionary or job requirements>],
  "missing_skills": [<array of 3-5 HIGH-IMPACT skills from job description that are missing>],
  "recommendations": [<array of 4-6 SPECIFIC, ACTIONABLE recommendations>],
  "strengths": [<array of 3-5 key strengths found in the resume>],
  "weaknesses": [<array of 2-3 constructive improvement areas - phrase positively>],
  "suggested_roles": [<array of 3-4 suitable job roles for this candidate>],
  "summary": "<2-3 sentence professional summary of candidate's profile>",
  "experience_level": "<entry/mid/senior>",
  "key_achievements": [<array of 2-4 notable achievements from resume>]
}

QUALITY GUIDELINES:
- Matched Skills: Be thorough - check every section, include variations (e.g., React.js = React)
- Missing Skills: Only high-impact gaps (e.g., "Docker for containerization", not "Python" if they have JS)
- Recommendations: Be specific ✅ "Add GitHub link to showcase your Airbnb clone project" ❌ "Improve skills"
- Weaknesses: Constructive ✅ "Could add metrics to project descriptions (e.g., '500+ users')" ❌ "No experience"
- Summary: Professional, encouraging tone highlighting potential
- Suggested Roles: Realistic for their level (e.g., "Frontend Developer Intern" for students, not "Senior Architect")

PROVIDE ONLY THE JSON RESPONSE. NO ADDITIONAL TEXT OR MARKDOWN FORMATTING.`;

    return prompt;
  }

  /**
   * Create domain-aware analysis prompt
   */
  createDomainAwarePrompt(parsedData, jobDescription, detectedDomain) {
    const structuredData = this.createFallbackStructure(parsedData);
    const domainInfo = detectedDomain.template;
    
    const targetRole = jobDescription
      ? `the provided Job Description`
      : `${detectedDomain.name} roles`;

    const prompt = `You are an expert resume analyzer with deep knowledge across multiple industries.

DETECTED DOMAIN: ${detectedDomain.name}
This resume appears to be for ${detectedDomain.name} based on keywords: ${detectedDomain.matchedKeywords.slice(0, 10).join(', ')}

DOMAIN-SPECIFIC IMPORTANT SKILLS:
${domainInfo.important_skills.join(', ')}

SUGGESTED ROLES FOR THIS DOMAIN:
${domainInfo.suggested_roles.join(', ')}

RESUME DATA (Structured JSON):
${JSON.stringify(structuredData, null, 2)}

${jobDescription ? `JOB DESCRIPTION:\n${jobDescription}` : `DEFAULT TARGET: Evaluate as ${domainInfo.name} professional`}

TASK: Analyze this resume for ${targetRole}. Use domain-specific criteria.

SCORING METHODOLOGY:

ATS Score (Will be calculated separately - focus on content quality):
- Evaluate completeness of sections
- Check for action verbs and achievements
- Assess keyword alignment with ${domainInfo.name}

Job Match Score (Total: 100 points):
Step 1 - Skills alignment with domain: 50 points
  * Calculate: (matched_domain_skills / total_important_skills) * 50
  * Important skills for ${domainInfo.name}: ${domainInfo.important_skills.slice(0, 5).join(', ')}
  
Step 2 - Experience/Projects relevance: 30 points
  * Projects/experience match domain requirements: 30 points
  * Partially relevant: 20 points
  * Some relevance: 10 points
  
Step 3 - Educational/training background: 10 points
  * Relevant degree/certification: 10 points
  * Related background: 7 points
  * Self-taught/learning: 5 points
  
Step 4 - Professional presence: 10 points
  * Portfolio/GitHub/LinkedIn + certifications: 10 points
  * One platform: 5 points

RESPONSE FORMAT (Provide ONLY valid JSON, no markdown):
{
  "match_score": <number 0-100>,
  "matched_skills": [<skills from resume matching ${domainInfo.name} requirements>],
  "missing_skills": [<3-5 HIGH-IMPACT domain-specific skills missing>],
  "recommendations": [<4-6 SPECIFIC, ACTIONABLE recommendations for ${domainInfo.name}>],
  "strengths": [<3-5 key strengths>],
  "weaknesses": [<2-3 constructive improvements - phrase positively>],
  "suggested_roles": [<3-4 suitable ${domainInfo.name} roles>],
  "summary": "<2-3 sentence professional summary>",
  "experience_level": "<entry/mid/senior>",
  "key_achievements": [<2-4 notable achievements>],
  "top_skills": [<top 5 most relevant skills for ${domainInfo.name}>]
}

QUALITY GUIDELINES:
- Be domain-specific: For logistics → focus on warehouse/inventory skills, not coding
- Matched Skills: Include domain variations (e.g., WMS/SAP/Oracle for logistics)
- Missing Skills: High-impact for this domain (e.g., "Forklift certification" for warehouse, "React" for web dev)
- Recommendations: Domain-appropriate (e.g., "Get OSHA certification" for logistics, "Build portfolio" for design)
- Suggested Roles: Realistic for domain and experience level

PROVIDE ONLY THE JSON RESPONSE. NO ADDITIONAL TEXT OR MARKDOWN FORMATTING.`;

    return prompt;
  }

  /**
   * Create enhanced fallback analysis with domain awareness
   */
  createEnhancedFallbackAnalysis(parsedData, detectedDomain, atsResult, experienceTimeline) {
    const resumeText = parsedData.raw_text || '';
    const matchedSkills = this.matchSkillsAgainstDictionary(parsedData.skills_list || [], resumeText);
    
    // Domain-specific skill matching
    const domainSkills = detectedDomain.template.important_skills || [];
    const matchedDomainSkills = domainSkills.filter(skill => 
      resumeText.toLowerCase().includes(skill.toLowerCase())
    );
    
    const matchScore = Math.min(
      Math.round((matchedDomainSkills.length / domainSkills.length) * 50) + 45, // Base 45%
      95
    );
    
    return {
      ats_score: atsResult.total,
      ats_breakdown: atsResult.breakdown,
      ats_improvements: this.createFallbackAtsImprovements(atsResult, detectedDomain),
      match_score: matchScore,
      matched_skills: [...new Set([...matchedSkills, ...matchedDomainSkills])],
      missing_skills: this.identifyMissingDomainSkills(matchedDomainSkills, domainSkills),
      recommendations: this.generateDomainRecommendations(parsedData, detectedDomain),
      strengths: this.identifyStrengths(parsedData, matchedSkills),
      weaknesses: this.identifyWeaknesses(parsedData),
      suggested_roles: detectedDomain.template.suggested_roles.slice(0, 4),
      summary: this.generateSummary(parsedData, detectedDomain, experienceTimeline),
      experience_level: this.determineExperienceLevel(experienceTimeline),
      key_achievements: this.extractKeyAchievements(parsedData),
      detected_domain: detectedDomain.name,
      domain_match_score: detectedDomain.score,
      experience_summary: `${experienceTimeline.totalYears} yrs total, ${experienceTimeline.roleCount} ${experienceTimeline.roleCount === 1 ? 'role' : 'roles'}`,
      experience_timeline: experienceTimeline,
      section_completeness: this.calculateSectionCompleteness(parsedData),
      top_skills: matchedSkills.slice(0, 5)
    };
  }

  /**
   * Calculate section completeness percentage
   */
  calculateSectionCompleteness(parsedData) {
    const sections = parsedData.sections || {};
    const expectedSections = ['contact', 'education', 'skills', 'experience', 'projects'];
    const presentSections = expectedSections.filter(section => {
      if (section === 'contact') return parsedData.contact?.name && parsedData.contact?.email;
      return sections[section] && (Array.isArray(sections[section]) ? sections[section].length > 0 : true);
    });
    
    return Math.round((presentSections.length / expectedSections.length) * 100);
  }

  /**
   * Generate domain-specific recommendations
   */
  generateDomainRecommendations(parsedData, detectedDomain) {
    const recommendations = [];
    const domainName = detectedDomain.name;
    
    // Contact info recommendations
    if (!parsedData.contact?.linkedin) {
      recommendations.push(`Add LinkedIn profile to increase visibility in ${domainName}`);
    }
    
    // Domain-specific recommendations
    if (domainName.includes('Software') || domainName.includes('Tech')) {
      if (!parsedData.contact?.github) {
        recommendations.push('Add GitHub profile to showcase your code projects');
      }
      if (!parsedData.sections?.projects || parsedData.sections.projects.length < 2) {
        recommendations.push('Add at least 2-3 projects with live links and GitHub repositories');
      }
    } else if (domainName.includes('Logistics')) {
      recommendations.push('Highlight any certifications (OSHA, Forklift, etc.)');
      recommendations.push('Add specific metrics (items processed/day, accuracy rate)');
    } else if (domainName.includes('Marketing')) {
      recommendations.push('Include campaign results with specific metrics (CTR, conversion rate)');
      recommendations.push('Add portfolio links or case studies');
    }
    
    // General recommendations
    if (!parsedData.sections?.certifications || parsedData.sections.certifications.length === 0) {
      recommendations.push(`Add relevant ${domainName} certifications to stand out`);
    }
    
    return recommendations.slice(0, 6);
  }

  /**
   * Identify missing domain-specific skills
   */
  identifyMissingDomainSkills(matchedSkills, allDomainSkills) {
    return allDomainSkills
      .filter(skill => !matchedSkills.includes(skill))
      .slice(0, 5);
  }

  /**
   * Determine experience level from timeline
   */
  determineExperienceLevel(experienceTimeline) {
    if (experienceTimeline.totalYears >= 5) return 'senior';
    if (experienceTimeline.totalYears >= 2) return 'mid';
    return 'entry';
  }

  /**
   * Generate professional summary
   */
  generateSummary(parsedData, detectedDomain, experienceTimeline) {
    const name = parsedData.contact?.name || 'Candidate';
    const domain = detectedDomain.name;
    const years = experienceTimeline.totalYears;
    const level = this.determineExperienceLevel(experienceTimeline);
    
    if (level === 'entry') {
      return `${name} is an aspiring ${domain} professional with strong foundational skills and ${parsedData.sections?.projects?.length || 0} projects. Shows potential for growth in the field.`;
    } else if (level === 'mid') {
      return `${name} is a ${domain} professional with ${years} years of experience across ${experienceTimeline.roleCount} roles. Demonstrates solid expertise and steady career progression.`;
    } else {
      return `${name} is a senior ${domain} professional with ${years}+ years of extensive experience. Proven track record across ${experienceTimeline.roleCount} positions with strong leadership capabilities.`;
    }
  }

  /**
   * Extract key achievements from parsed data
   */
  extractKeyAchievements(parsedData) {
    const achievements = [];
    
    // From achievements section
    if (parsedData.sections?.achievements) {
      achievements.push(...parsedData.sections.achievements.slice(0, 2));
    }
    
    // From experience achievements
    if (parsedData.sections?.experience) {
      parsedData.sections.experience.forEach(exp => {
        if (exp.achievements && exp.achievements.length > 0) {
          achievements.push(...exp.achievements.slice(0, 1));
        }
      });
    }
    
    return achievements.slice(0, 4);
  }

  /**
   * Create fallback structure if structured data not available
   */
  createFallbackStructure(parsedData) {
    return {
      contact: parsedData.contact || {},
      skills: parsedData.sections?.skills || 'Not provided',
      education: parsedData.sections?.education || 'Not provided',
      experience: parsedData.sections?.experience || 'Not provided',
      projects: parsedData.sections?.projects || 'Not provided',
      skills_list: parsedData.skills_list || []
    };
  }

  /**
   * Calculate rule-based ATS score (fallback if AI fails)
   * More generous scoring for student/entry-level resumes
   */
  calculateAtsScore(parsedData) {
    let score = 40; // Base score for any parseable resume

    // Contact information (15 points)
    if (parsedData.contact.email) score += 8;
    if (parsedData.contact.phone) score += 4;
    if (parsedData.contact.linkedin || parsedData.contact.github) score += 3;

    // Key sections present (20 points)
    if (parsedData.sections.experience) score += 8;
    if (parsedData.sections.education) score += 7;
    if (parsedData.sections.skills) score += 5;

    // Projects/Certifications (10 points)
    if (parsedData.sections.projects) score += 5;
    if (parsedData.sections.certifications) score += 5;

    // Skills listed (10 points)
    const skillsCount = parsedData.skills_list?.length || 0;
    if (skillsCount >= 8) score += 10;
    else if (skillsCount >= 5) score += 8;
    else if (skillsCount >= 3) score += 5;
    else if (skillsCount >= 1) score += 3;

    // Name present (5 points)
    if (parsedData.name) score += 5;

    return Math.min(Math.max(score, 30), 100); // Ensure score is between 30-100
  }

  /**
   * Create fallback analysis when API key is not available
   * Uses rule-based logic with skill dictionary matching
   */
  createFallbackAnalysis(parsedData) {
    const atsScore = this.calculateAtsScore(parsedData);
    const hasProjects = parsedData.sections.projects ? true : false;
    const hasExperience = parsedData.sections.experience ? true : false;
    const skillCount = parsedData.skills_list?.length || 0;

    // Match skills against dictionary - now with full text scanning
    const matchedSkills = this.matchSkillsAgainstDictionary(
      parsedData.skills_list || [], 
      parsedData.raw_text || ''
    );
    
    console.log('\n=== SKILL MATCHING DEBUG ===');
    console.log('Extracted skills list:', parsedData.skills_list);
    console.log('Matched skills count:', matchedSkills.length);
    console.log('Matched skills:', matchedSkills);
    console.log('===========================\n');

    // Calculate match score using Step 4 scoring logic
    let matchScore = 45; // Minimum for relevant candidates
    
    // Skills alignment (50 points max)
    if (matchedSkills.length >= 10) matchScore += 50;
    else if (matchedSkills.length >= 5) matchScore += 35;
    else if (matchedSkills.length >= 3) matchScore += 20;
    else if (matchedSkills.length >= 1) matchScore += 10;
    
    // Projects/experience (30 points max)
    if (hasProjects && hasExperience) matchScore += 30;
    else if (hasProjects) matchScore += 20;
    else if (hasExperience) matchScore += 15;
    
    // Online presence (10 points max)
    if ((parsedData.contact.linkedin || parsedData.contact.github)) matchScore += 10;
    
    matchScore = Math.min(matchScore, 85); // Cap at 85 for fallback

    // Identify missing high-impact skills
    const missingSkills = this.identifyMissingSkills(matchedSkills);

    return {
      match_score: matchScore,
      ats_score: atsScore,
      matched_skills: matchedSkills,
      missing_skills: missingSkills,
      recommendations: [
        'Add quantifiable achievements to your projects (e.g., "Built app with 500+ users", "Improved performance by 40%")',
        matchedSkills.length < 5 ? 'Expand your skills section to include frameworks and tools you\'ve used' : 'Organize skills by category (Languages, Frameworks, Tools, Databases)',
        !(parsedData.contact.linkedin || parsedData.contact.github) ? 'Add GitHub link to showcase your code and LinkedIn for professional networking' : 'Ensure your GitHub profile showcases your best projects with proper README files',
        !hasProjects ? 'Add a PROJECTS section with 2-3 full-stack applications you\'ve built' : 'Add tech stack details to each project (e.g., "Built with React, Node.js, MongoDB")',
        'Use action verbs in descriptions (Built, Developed, Implemented, Designed, Optimized)',
        'Ensure all section headings are in UPPERCASE for ATS compatibility (SKILLS, EDUCATION, PROJECTS)'
      ],
      strengths: [
        parsedData.sections.experience ? 'Demonstrates professional work experience' : 'Strong educational foundation in technology',
        parsedData.sections.education ? 'Clear educational background' : 'Well-structured resume format',
        matchedSkills.length > 0 ? `${matchedSkills.length} relevant technical skills identified` : 'Complete contact information provided',
        hasProjects ? 'Shows practical project experience and hands-on learning' : 'Professional resume presentation'
      ].slice(0, 4),
      weaknesses: [
        !hasProjects ? 'Could benefit from adding project section to showcase practical skills' : 'Consider adding quantifiable metrics to project descriptions (user count, performance improvements)',
        !(parsedData.contact.linkedin || parsedData.contact.github) ? 'Missing professional profile links (LinkedIn/GitHub) for better visibility' : 'Could expand technical skills section with more frameworks/tools',
        matchedSkills.length < 8 ? 'Consider learning and adding more in-demand technologies (React, Node.js, Docker)' : 'Could add certifications or online course completions to stand out'
      ].slice(0, 3),
      suggested_roles: [
        hasExperience ? 'Software Developer' : 'Software Development Intern',
        matchedSkills.includes('React') || matchedSkills.includes('JavaScript') ? 'Frontend Developer' : 'Web Developer',
        matchedSkills.includes('Node.js') || matchedSkills.includes('Express') ? 'Backend Developer' : 'Full Stack Developer',
        'MERN Stack Developer'
      ].slice(0, 4),
      summary: `${parsedData.name ? parsedData.name + ' is a' : 'A'} ${hasExperience ? 'professional developer' : 'motivated aspiring developer'} with ${parsedData.sections.education ? 'strong educational background' : 'technical foundation'}${matchedSkills.length > 0 ? ` and expertise in ${matchedSkills.slice(0, 3).join(', ')}` : ''}. ${hasProjects ? 'Demonstrates practical experience through multiple projects.' : 'Shows strong potential for growth in software development roles.'}`,
      experience_level: hasExperience ? 'mid' : 'entry',
      key_achievements: hasProjects ? ['Successfully built and deployed technical projects'] : ['Strong academic foundation in computer science/technology']
    };
  }

  /**
   * Match resume skills against predefined dictionary with synonym support
   * More context-aware matching to reduce false negatives
   */
  matchSkillsAgainstDictionary(resumeSkills, fullResumeText = '') {
    const matched = new Set();
    
    // First pass: Check extracted skills list
    resumeSkills.forEach(skill => {
      const skillLower = skill.toLowerCase().trim();
      
      // Check against main dictionary
      this.techSkillsDictionary.forEach(dictSkill => {
        const dictLower = dictSkill.toLowerCase();
        
        // Exact match
        if (skillLower === dictLower) {
          matched.add(dictSkill);
          return;
        }
        
        // Check synonyms
        const synonyms = this.skillSynonyms[dictSkill] || [];
        const allVariations = [dictSkill, ...synonyms];
        
        for (const variation of allVariations) {
          const varLower = variation.toLowerCase();
          
          if (skillLower === varLower || 
              skillLower.includes(varLower) || 
              varLower.includes(skillLower)) {
            matched.add(dictSkill); // Always add canonical name
            return;
          }
        }
      });
      
      // Also check if resume skill matches any synonym key
      Object.keys(this.skillSynonyms).forEach(canonicalSkill => {
        const synonyms = this.skillSynonyms[canonicalSkill];
        
        for (const synonym of synonyms) {
          const synLower = synonym.toLowerCase();
          if (skillLower === synLower || 
              skillLower.includes(synLower) || 
              synLower.includes(skillLower)) {
            matched.add(canonicalSkill);
            return;
          }
        }
      });
    });
    
    // Second pass: Scan full resume text if provided
    if (fullResumeText && fullResumeText.trim().length > 0) {
      const resumeTextLower = fullResumeText.toLowerCase();
      
      // Check each skill in dictionary
      this.techSkillsDictionary.forEach(dictSkill => {
        // Get all variations including canonical name and synonyms
        const synonyms = this.skillSynonyms[dictSkill] || [];
        const allVariations = [dictSkill, ...synonyms];
        
        // Check if any variation appears in resume text
        for (const variation of allVariations) {
          // Use word boundary regex to avoid partial matches
          const pattern = new RegExp(`\\b${variation.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
          
          if (pattern.test(fullResumeText)) {
            matched.add(dictSkill);
            break; // Found this skill, move to next
          }
        }
      });
    }
    
    return Array.from(matched);
  }

  /**
   * Check if two skills are similar (e.g., "JS" vs "JavaScript")
   */
  areSkillsSimilar(skill1, skill2) {
    const variations = {
      'js': 'javascript',
      'ts': 'typescript',
      'node': 'node.js',
      'react': 'react.js',
      'vue': 'vue.js',
      'mongo': 'mongodb',
      'postgres': 'postgresql',
      'tf': 'tensorflow',
      'k8s': 'kubernetes'
    };
    
    return variations[skill1] === skill2 || variations[skill2] === skill1;
  }

  /**
   * Identify top missing high-impact skills for MERN stack role
   */
  identifyMissingSkills(matchedSkills) {
    const highImpactSkills = [
      'React', 'Node.js', 'Express', 'MongoDB',
      'JavaScript', 'TypeScript', 'Git', 'REST API',
      'Docker', 'AWS', 'PostgreSQL', 'Redux'
    ];
    
    const missing = highImpactSkills.filter(skill => 
      !matchedSkills.some(matched => 
        matched.toLowerCase().includes(skill.toLowerCase()) ||
        skill.toLowerCase().includes(matched.toLowerCase())
      )
    );
    
    return missing.slice(0, 5); // Return top 5 missing skills
  }

  /**
   * Analyze resume using Gemini AI with domain detection and advanced ATS scoring
   */
  async analyzeResume(parsedData, jobDescription = '', apiKey = null) {
    // Step 1: Detect domain from resume
    const detectedDomain = domainTemplates.detectDomain(parsedData.raw_text || '');
    console.log(`\n🎯 Domain Detection:`, {
      domain: detectedDomain.name,
      score: detectedDomain.score,
      keywords: detectedDomain.matchedKeywords.slice(0, 5)
    });

    // Step 2: Calculate advanced ATS score
    const atsResult = atsCalculator.calculateATSScore(parsedData, detectedDomain.template);
    console.log(`\n📊 ATS Score Breakdown:`, atsResult);

    // Step 3: Calculate experience timeline
    const experience = parsedData.sections?.experience;
    const experienceArray = Array.isArray(experience) ? experience : [];
    const experienceTimeline = atsCalculator.calculateExperienceTimeline(experienceArray);
    console.log(`\n💼 Experience Timeline:`, experienceTimeline);

    // If no API key, return enhanced fallback analysis
    if (!apiKey) {
      console.log('No Gemini API key provided, using enhanced fallback analysis');
      return this.createEnhancedFallbackAnalysis(parsedData, detectedDomain, atsResult, experienceTimeline);
    }

    try {
      // Initialize Gemini AI
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: 'models/gemini-2.5-flash' });

      // Create domain-aware prompt
      const prompt = this.createDomainAwarePrompt(parsedData, jobDescription, detectedDomain);

      // Generate content
      console.log('Calling Gemini AI for domain-aware analysis...');
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const analysisText = response.text();

      // Parse JSON response
      let analysisData;
      try {
        // Remove markdown code blocks if present
        let cleanedText = analysisText.trim();
        if (cleanedText.startsWith('```json')) {
          cleanedText = cleanedText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
        } else if (cleanedText.startsWith('```')) {
          cleanedText = cleanedText.replace(/```\n?/g, '');
        }
        
        analysisData = JSON.parse(cleanedText);
      } catch (parseError) {
        console.error('Error parsing Gemini response as JSON:', parseError);
        console.log('Raw response:', analysisText);
        
        // Fallback to enhanced rule-based analysis
        analysisData = this.createEnhancedFallbackAnalysis(parsedData, detectedDomain, atsResult, experienceTimeline);
      }

      // Gemini-driven ATS improvement cards
      let atsImprovements = [];
      try {
        atsImprovements = await this.generateAtsImprovements(
          parsedData,
          atsResult,
          detectedDomain,
          jobDescription,
          apiKey
        );
      } catch (atsImprovementError) {
        console.error('Error generating ATS improvements:', atsImprovementError);
        atsImprovements = this.createFallbackAtsImprovements(atsResult, detectedDomain);
      }

      // Merge with calculated scores and metadata
      const finalAnalysis = {
        ...analysisData,
        ats_score: atsResult.total,
        ats_breakdown: atsResult.breakdown,
        ats_improvements: atsImprovements,
        detected_domain: detectedDomain.name,
        domain_match_score: detectedDomain.score,
        experience_summary: `${experienceTimeline.totalYears} yrs total, ${experienceTimeline.roleCount} ${experienceTimeline.roleCount === 1 ? 'role' : 'roles'}`,
        experience_timeline: experienceTimeline,
        section_completeness: this.calculateSectionCompleteness(parsedData)
      };

      return finalAnalysis;

    } catch (error) {
      console.error('Error calling Gemini AI:', error);
      
      // Return enhanced fallback analysis on error
      return this.createEnhancedFallbackAnalysis(parsedData, detectedDomain, atsResult, experienceTimeline);
    }
  }

  /**
   * Generate detailed role information using AI
   * @param {string} roleName - The job role to analyze
   * @param {Array} userSkills - Skills the user currently has
   * @param {Array} matchedSkills - Skills that match the role
   * @param {Array} missingSkills - Skills missing from user's profile
   * @returns {Object} - Detailed role information
   */
  async generateRoleDetails(roleName, userSkills, matchedSkills, missingSkills) {
    try {
      const apiKey = process.env.GEMINI_API_KEY || 'AIzaSyBjCKHRjWKf8caNWP2jT_wAacgkq3cfTwM';
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

      const prompt = `You are an expert career advisor and technical recruiter. Analyze this job role and provide detailed insights.

**Job Role:** ${roleName}

**Candidate's Current Skills:** ${userSkills.join(', ') || 'None specified'}

**Skills Matched for this Role:** ${matchedSkills.join(', ') || 'None'}

**Skills Missing for this Role:** ${missingSkills.join(', ') || 'None'}

Please provide a comprehensive analysis in the following JSON format:

{
  "roleDescription": "A brief 2-3 sentence description of what this role entails and typical responsibilities",
  "requiredSkills": ["skill1", "skill2", "skill3", ...],
  "niceToHaveSkills": ["skill1", "skill2", ...],
  "companyExpectations": [
    "Expectation 1 - what companies typically expect from employees in this role",
    "Expectation 2",
    "Expectation 3",
    "Expectation 4",
    "Expectation 5"
  ],
  "careerAdvice": [
    "Specific actionable tip 1 to improve for this role",
    "Specific actionable tip 2",
    "Specific actionable tip 3",
    "Specific actionable tip 4",
    "Specific actionable tip 5"
  ],
  "learningPath": [
    "Step 1 - First thing to learn/do",
    "Step 2 - Next step in progression",
    "Step 3 - Advanced skill to acquire",
    "Step 4 - Final mastery step"
  ],
  "salaryRange": "Typical salary range for this role (e.g., '$60k-$90k' or '₹6-12 LPA')",
  "experienceLevel": "Entry/Mid/Senior level typically required",
  "industryDemand": "High/Medium/Low - current market demand for this role"
}

IMPORTANT: 
1. Return ONLY valid JSON, no markdown formatting or explanations
2. Be specific to the role name provided
3. Consider the candidate's current skills when giving advice
4. Make recommendations practical and actionable
5. Focus on skills the candidate is missing`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      let text = response.text();

      // Clean up the response - remove markdown code blocks if present
      text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

      // Parse the JSON response
      const roleDetails = JSON.parse(text);

      return {
        success: true,
        data: roleDetails
      };

    } catch (error) {
      console.error('Error generating role details:', error);
      
      // Return fallback generic role details
      return {
        success: false,
        data: {
          roleDescription: `${roleName} is a technical position requiring strong programming and problem-solving skills. This role typically involves developing software solutions and collaborating with cross-functional teams.`,
          requiredSkills: missingSkills.length > 0 ? missingSkills : ['Programming', 'Problem Solving', 'Communication', 'Teamwork'],
          niceToHaveSkills: ['Cloud Computing', 'DevOps', 'Agile Methodologies'],
          companyExpectations: [
            'Write clean, maintainable, and efficient code',
            'Collaborate effectively with team members',
            'Meet project deadlines and deliver quality work',
            'Continuously learn and adapt to new technologies',
            'Communicate technical concepts clearly'
          ],
          careerAdvice: [
            'Build a strong portfolio with diverse projects',
            'Contribute to open-source projects',
            'Network with professionals in the field',
            'Stay updated with industry trends and best practices',
            'Practice coding regularly on platforms like LeetCode'
          ],
          learningPath: [
            'Master fundamental programming concepts and data structures',
            'Build 3-5 projects showcasing your skills',
            'Learn version control (Git) and collaboration tools',
            'Gain experience with relevant frameworks and technologies'
          ],
          salaryRange: 'Varies by location and experience',
          experienceLevel: 'Entry to Mid-level',
          industryDemand: 'High'
        }
      };
    }
  }

  /**
   * Generate ATS improvement cards using Gemini
   */
  async generateAtsImprovements(parsedData, atsResult, detectedDomain, jobDescription, apiKey) {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'models/gemini-2.5-flash' });

    const maxScores = {
      contact: 15,
      sections: 20,
      keywords: 40,
      actionVerbs: 10,
      formatting: 10,
      experienceBonus: 5
    };

    const domainSkills = detectedDomain?.template?.important_skills || [];
    const domainKeywords = detectedDomain?.template?.keywords || [];

    const prompt = `You are an ATS improvement coach. Generate actionable cards to improve low-scoring ATS areas.

INPUT CONTEXT (JSON):
${JSON.stringify({
  domain: detectedDomain?.name || 'Unknown',
  jobDescription: jobDescription || '',
  scores: atsResult.breakdown,
  maxScores,
  resumeSignals: {
    hasLinkedIn: !!parsedData.contact?.linkedin,
    hasGitHub: !!parsedData.contact?.github,
    hasPortfolio: !!parsedData.contact?.portfolio,
    hasProjects: Array.isArray(parsedData.sections?.projects) && parsedData.sections.projects.length > 0,
    hasExperience: Array.isArray(parsedData.sections?.experience) && parsedData.sections.experience.length > 0,
    skillsList: parsedData.skills_list || []
  },
  domainSkills: domainSkills.slice(0, 18),
  domainKeywords: domainKeywords.slice(0, 18)
}, null, 2)}

RULES:
1. Focus ONLY on low-scoring areas (score < 70% of max).
2. Return 2-4 cards total. If only one area is low, include the next weakest area.
3. Each card must include: area, score, maxScore, priority (high/medium/low), whatToAdd (3-5), whatToAvoid (2-4), quickWins (2-4).
4. Make advice specific to the detected domain and likely ATS parsing behavior.
5. Use concise, resume-ready phrasing. No markdown.

RESPONSE JSON FORMAT ONLY:
{
  "ats_improvements": [
    {
      "area": "Keywords",
      "score": 12,
      "maxScore": 40,
      "priority": "high",
      "whatToAdd": ["Add skill keywords like React, Node.js, MongoDB", "Include role-specific tools from job description"],
      "whatToAvoid": ["Keyword stuffing in a single line", "Unclear abbreviations without full terms"],
      "quickWins": ["Mirror 3-5 exact JD phrases", "Add a Skills subsection with 2-3 categories"]
    }
  ]
}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text();

    text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const parsed = JSON.parse(text);

    return Array.isArray(parsed.ats_improvements)
      ? parsed.ats_improvements
      : [];
  }

  /**
   * Create fallback ATS improvement cards without Gemini
   */
  createFallbackAtsImprovements(atsResult, detectedDomain) {
    const maxScores = {
      contact: 15,
      sections: 20,
      keywords: 40,
      actionVerbs: 10,
      formatting: 10,
      experienceBonus: 5
    };

    const areaLabels = {
      contact: 'Contact Details',
      sections: 'Resume Sections',
      keywords: 'Keywords',
      actionVerbs: 'Action Verbs',
      formatting: 'Formatting',
      experienceBonus: 'Experience Depth'
    };

    const scores = atsResult.breakdown || {};
    const sortedAreas = Object.keys(maxScores)
      .map(key => {
        const maxScore = maxScores[key];
        const score = scores[key] || 0;
        return { key, score, maxScore, ratio: maxScore ? score / maxScore : 0 };
      })
      .sort((a, b) => a.ratio - b.ratio);

    const lowAreas = sortedAreas.filter(area => area.ratio < 0.7);
    const selected = lowAreas.length >= 2
      ? lowAreas.slice(0, 3)
      : sortedAreas.slice(0, 2);

    return selected.map(area => ({
      area: areaLabels[area.key] || area.key,
      score: area.score,
      maxScore: area.maxScore,
      priority: area.ratio < 0.4 ? 'high' : area.ratio < 0.7 ? 'medium' : 'low',
      whatToAdd: [
        'Add clear, ATS-friendly section headings',
        `Include ${detectedDomain?.name || 'role'}-specific keywords in Skills and Experience`,
        'Use short, metric-driven bullet points'
      ],
      whatToAvoid: [
        'Avoid graphics, tables, or multi-column layouts',
        'Do not hide keywords in headers or footers'
      ],
      quickWins: [
        'Add 3-5 measurable achievements',
        'Mirror 3-5 exact phrases from the job description'
      ]
    }));
  }
}

module.exports = new AIAnalyzer();
