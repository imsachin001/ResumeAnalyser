const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const fs = require('fs').promises;

class EnhancedResumeParser {
  constructor() {
    // URL patterns
    this.urlPatterns = {
      email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
      phone: /(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g,
      linkedin: /(?:linkedin\.com\/in\/)([\w-]+)/gi,
      github: /(?:github\.com\/)([\w-]+)/gi,
      portfolio: /(?:https?:\/\/)?(?:www\.)?([a-zA-Z0-9-]+\.(?:netlify\.app|vercel\.app|herokuapp\.com|web\.app|github\.io|com|in))/gi
    };
  }

  /**
   * Clean and normalize extracted text
   */
  cleanText(text) {
    if (!text) return '';
    
    return text
      .replace(/\n\s*\n/g, '\n')
      .replace(/\s{2,}/g, ' ')
      .replace(/\t/g, ' ')
      .replace(/\r/g, '')
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .join('\n')
      .trim();
  }

  /**
   * Extract PDF text
   */
  async extractTextFromPdf(filePath) {
    try {
      const dataBuffer = await fs.readFile(filePath);
      const data = await pdfParse(dataBuffer);
      return this.cleanText(data.text);
    } catch (error) {
      throw new Error(`Error reading PDF: ${error.message}`);
    }
  }

  /**
   * Extract DOCX text
   */
  async extractTextFromDocx(filePath) {
    try {
      const buffer = await fs.readFile(filePath);
      const result = await mammoth.extractRawText({ buffer });
      return this.cleanText(result.value);
    } catch (error) {
      throw new Error(`Error reading DOCX: ${error.message}`);
    }
  }

  /**
   * Extract text based on file type
   */
  async extractText(filePath, fileType) {
    if (fileType === 'pdf') {
      return await this.extractTextFromPdf(filePath);
    } else if (fileType === 'docx' || fileType === 'doc') {
      return await this.extractTextFromDocx(filePath);
    } else {
      throw new Error(`Unsupported file type: ${fileType}`);
    }
  }

  /**
   * 1. Extract Personal/Contact Info
   */
  extractContactInfo(text) {
    const lines = text.split('\n');
    const contact = {
      name: null,
      email: null,
      phone: null,
      location: null,
      portfolio: null,
      linkedin: null,
      github: null
    };

    // Extract name (first non-empty, non-section-header line)
    const commonHeaders = ['skills', 'education', 'experience', 'projects', 'summary', 'objective', 'contact'];
    for (let i = 0; i < Math.min(8, lines.length); i++) {
      const line = lines[i].trim();
      if (line && 
          line.length < 50 && 
          line.split(/\s+/).length <= 4 &&
          !commonHeaders.some(h => line.toLowerCase().includes(h)) &&
          !/[@|:()]/.test(line) &&
          !/\d{3,}/.test(line)) {
        contact.name = line;
        break;
      }
    }

    // Extract email
    const emailMatch = text.match(this.urlPatterns.email);
    contact.email = emailMatch ? emailMatch[0] : null;

    // Extract phone
    const phoneMatch = text.match(this.urlPatterns.phone);
    contact.phone = phoneMatch ? phoneMatch[0].replace(/[-.\s()]/g, '') : null;

    // Extract LinkedIn
    const linkedinMatch = text.match(this.urlPatterns.linkedin);
    contact.linkedin = linkedinMatch ? `linkedin.com/in/${linkedinMatch[0].split('/').pop()}` : null;

    // Extract GitHub
    const githubMatch = text.match(this.urlPatterns.github);
    contact.github = githubMatch ? `github.com/${githubMatch[0].split('/').pop()}` : null;

    // Extract Portfolio
    const portfolioMatch = text.match(this.urlPatterns.portfolio);
    if (portfolioMatch) {
      contact.portfolio = portfolioMatch[0].startsWith('http') ? portfolioMatch[0] : `https://${portfolioMatch[0]}`;
    }

    // Extract location (city, state/country)
    const locationPattern = /(?:Jaipur|Delhi|Mumbai|Bangalore|Hyderabad|Chennai|Pune|Kolkata|Ahmedabad|Rajasthan|Maharashtra|Karnataka|India)/gi;
    const locationMatch = text.match(locationPattern);
    contact.location = locationMatch ? locationMatch.slice(0, 2).join(', ') : null;

    return contact;
  }

  /**
   * 2. Extract Summary/Objective
   */
  extractSummary(text) {
    const summaryKeywords = ['summary', 'objective', 'career objective', 'about', 'about me', 'profile', 'professional summary'];
    const lines = text.split('\n');
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].toLowerCase();
      if (summaryKeywords.some(kw => line.includes(kw))) {
        // Get next 2-4 lines as summary
        const summaryLines = lines.slice(i + 1, i + 5).filter(l => l.trim().length > 20);
        if (summaryLines.length > 0) {
          return summaryLines.join(' ').trim();
        }
      }
    }
    return null;
  }

  /**
   * 3. Extract Education
   */
  extractEducation(text) {
    const education = [];
    const lines = text.split('\n');
    
    // Find EDUCATION section
    const eduIndex = lines.findIndex(line => /\b(education|academic)\b/i.test(line));
    if (eduIndex === -1) return education;

    // Get lines until next section
    const endIndex = lines.slice(eduIndex + 1).findIndex(line => 
      /\b(experience|projects|skills|certifications)\b/i.test(line)
    );
    const eduLines = lines.slice(eduIndex + 1, endIndex === -1 ? lines.length : eduIndex + 1 + endIndex);

    // Parse education entries
    let currentEdu = null;
    eduLines.forEach(line => {
      line = line.trim();
      if (!line) return;

      // Detect institute names (usually in caps or Title Case)
      if (/^[A-Z][A-Z\s]+/.test(line) || /College|University|Institute|School|IIIT|IIT|NIT/.test(line)) {
        if (currentEdu) education.push(currentEdu);
        currentEdu = {
          institute: line,
          degree: null,
          duration: null,
          details: []
        };
      }
      // Detect degree
      else if (currentEdu && /B\.?Tech|M\.?Tech|B\.?E\.?|M\.?E\.?|Bachelor|Master|Diploma|Computer Science|Engineering/.test(line)) {
        currentEdu.degree = line;
      }
      // Detect duration (year ranges)
      else if (currentEdu && /20\d{2}[\s–-]+20\d{2}|20\d{2}/.test(line)) {
        currentEdu.duration = line.match(/20\d{2}[\s–-]+20\d{2}|20\d{2}/)[0];
      }
      // Other details
      else if (currentEdu) {
        currentEdu.details.push(line);
      }
    });

    if (currentEdu) education.push(currentEdu);
    return education;
  }

  /**
   * 4. Extract Skills (Categorized)
   */
  extractSkillsCategorized(text) {
    const skills = {
      languages: [],
      frameworks: [],
      databases: [],
      tools: [],
      ai_ml: [],
      cloud: [],
      other: []
    };

    // Skill definitions with synonyms
    const skillMap = {
      languages: {
        'C++': ['c++', 'cpp'],
        'C': ['\\bc\\b'],
        'Python': ['python'],
        'JavaScript': ['javascript', 'js', 'ecmascript'],
        'TypeScript': ['typescript', 'ts'],
        'Java': ['\\bjava\\b'],
        'SQL': ['sql', 'mysql', 'postgresql']
      },
      frameworks: {
        'React': ['react', 'reactjs', 'react js', 'react.js'],
        'Node.js': ['node', 'nodejs', 'node js', 'node.js'],
        'Express': ['express', 'expressjs', 'express js', 'express.js'],
        'Django': ['django'],
        'Flask': ['flask'],
        'Next.js': ['next', 'nextjs', 'next.js'],
        'Vue': ['vue', 'vuejs', 'vue.js'],
        'Angular': ['angular']
      },
      databases: {
        'MongoDB': ['mongo', 'mongodb', 'mongo db'],
        'MySQL': ['mysql'],
        'PostgreSQL': ['postgres', 'postgresql'],
        'Redis': ['redis'],
        'Firebase': ['firebase']
      },
      tools: {
        'Git': ['\\bgit\\b'],
        'GitHub': ['github'],
        'Docker': ['docker'],
        'VS Code': ['vscode', 'vs code', 'visual studio code'],
        'Postman': ['postman']
      },
      ai_ml: {
        'LangChain': ['langchain'],
        'Huggingface': ['huggingface', 'hugging face'],
        'TensorFlow': ['tensorflow'],
        'PyTorch': ['pytorch'],
        'Pandas': ['pandas'],
        'NumPy': ['numpy'],
        'Machine Learning': ['machine learning', 'ml']
      },
      cloud: {
        'AWS': ['aws', 'amazon web services'],
        'Azure': ['azure', 'microsoft azure'],
        'GCP': ['gcp', 'google cloud']
      },
      other: {
        'DSA': ['dsa', 'data structures', 'algorithms'],
        'REST API': ['rest', 'restful', 'rest api', 'api'],
        'HTML': ['html', 'html5'],
        'CSS': ['css', 'css3'],
        'Tailwind': ['tailwind', 'tailwindcss'],
        'Recharts': ['recharts']
      }
    };

    const textLower = text.toLowerCase();

    // Helper function to escape regex special characters
    const escapeRegex = (str) => {
      return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    };

    // Match skills
    for (const [category, skillList] of Object.entries(skillMap)) {
      for (const [skillName, synonyms] of Object.entries(skillList)) {
        for (const synonym of synonyms) {
          const escapedSynonym = escapeRegex(synonym);
          const pattern = new RegExp(`\\b${escapedSynonym}\\b`, 'i');
          if (pattern.test(textLower)) {
            if (!skills[category].includes(skillName)) {
              skills[category].push(skillName);
            }
            break;
          }
        }
      }
    }

    return skills;
  }

  /**
   * 5. Extract Projects
   */
  extractProjects(text) {
    const projects = [];
    const lines = text.split('\n');
    
    // Find PROJECTS/EXPERIENCE section
    const projectIndex = lines.findIndex(line => /\b(projects?|experience)\b/i.test(line));
    if (projectIndex === -1) return projects;

    // Get lines until next section
    const endIndex = lines.slice(projectIndex + 1).findIndex(line => 
      /\b(education|skills|certifications)\b/i.test(line)
    );
    const projectLines = lines.slice(projectIndex + 1, endIndex === -1 ? lines.length : projectIndex + 1 + endIndex);

    let currentProject = null;
    projectLines.forEach(line => {
      line = line.trim();
      if (!line) return;

      // Detect project title (often has technical terms or capitalized)
      if (/AI|Clone|App|System|Platform|Tool|Website|Dashboard/.test(line) || /^[A-Z]/.test(line)) {
        if (currentProject && currentProject.description) {
          projects.push(currentProject);
        }
        currentProject = {
          name: line,
          tech_stack: [],
          description: [],
          status: null,
          link: null
        };
      }
      // Detect tech stack (contains multiple tech words with |, commas, or in brackets)
      else if (currentProject && (/React|Node|Mongo|Python|Express|Tailwind|JavaScript/.test(line) || /\||,/.test(line))) {
        const techs = line.split(/[|,]/).map(t => t.trim()).filter(t => t.length > 1);
        currentProject.tech_stack.push(...techs);
      }
      // Detect status
      else if (currentProject && /(In Progress|Completed|Ongoing)/i.test(line)) {
        currentProject.status = line;
      }
      // Detect link
      else if (currentProject && /https?:\/\//.test(line)) {
        currentProject.link = line.match(/https?:\/\/[^\s]+/)[0];
      }
      // Description
      else if (currentProject) {
        currentProject.description.push(line);
      }
    });

    if (currentProject && currentProject.description.length > 0) {
      projects.push(currentProject);
    }

    // Format projects
    return projects.map(p => ({
      ...p,
      description: p.description.join(' ').trim()
    }));
  }

  /**
   * 6. Extract Experience/Achievements
   */
  extractExperience(text) {
    const experience = [];
    
    // Look for competitive programming achievements
    const leetcodeMatch = text.match(/LeetCode\s*(Knight|Guardian|Master)?\s*\(?(\d+)\)?/i);
    if (leetcodeMatch) {
      experience.push({
        role: `LeetCode ${leetcodeMatch[1] || 'User'}`,
        platform: 'LeetCode',
        rating: leetcodeMatch[2],
        description: `Solved 500+ problems; Rating: ${leetcodeMatch[2]}`
      });
    }

    const codechefMatch = text.match(/CodeChef\s*(\d+)\s*(?:★|star|stars?)?.*?\((\d+).*?max.*?\)/i);
    if (codechefMatch) {
      experience.push({
        role: `${codechefMatch[1]}★ Coder`,
        platform: 'CodeChef',
        rating: codechefMatch[2],
        description: `Competitive programmer with ${codechefMatch[1]} star rating`
      });
    }

    const codeforcesMatch = text.match(/Codeforces\s*(\d+)/i);
    if (codeforcesMatch) {
      experience.push({
        role: 'Competitive Programmer',
        platform: 'Codeforces',
        rating: codeforcesMatch[1],
        description: `Active on Codeforces with rating ${codeforcesMatch[1]}`
      });
    }

    return experience;
  }

  /**
   * Main parsing function
   */
  async parseResume(filePath, fileType) {
    // Extract raw text
    const rawText = await this.extractText(filePath, fileType);

    // Extract all sections
    const contact = this.extractContactInfo(rawText);
    const summary = this.extractSummary(rawText);
    const education = this.extractEducation(rawText);
    const skills = this.extractSkillsCategorized(rawText);
    const projects = this.extractProjects(rawText);
    const experience = this.extractExperience(rawText);

    // Flatten skills for easy access
    const allSkills = [
      ...skills.languages,
      ...skills.frameworks,
      ...skills.databases,
      ...skills.tools,
      ...skills.ai_ml,
      ...skills.cloud,
      ...skills.other
    ];

    return {
      raw_text: rawText,
      contact,
      summary,
      education,
      skills,
      skills_list: allSkills,
      projects,
      experience,
      // Legacy format for compatibility
      name: contact.name,
      sections: {
        skills: allSkills.join(', '),
        education: education.map(e => `${e.institute} - ${e.degree || ''} (${e.duration || ''})`).join('\n'),
        projects: projects.map(p => `${p.name}: ${p.description}`).join('\n'),
        experience: experience.map(e => `${e.platform}: ${e.description}`).join('\n')
      },
      // Structured data for AI
      structured: {
        contact,
        summary,
        education,
        skills,
        projects,
        experience,
        all_skills: allSkills
      }
    };
  }
}

module.exports = new EnhancedResumeParser();
