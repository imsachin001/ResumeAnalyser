const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const fs = require('fs').promises;

class ResumeParser {
  constructor() {
    this.sectionKeywords = {
      contact: ['contact', 'contact information', 'contact details'],
      skills: ['skills', 'technical skills', 'technologies', 'expertise', 'proficiencies', 'core competencies', 'technical expertise'],
      experience: ['experience', 'work experience', 'employment', 'professional experience', 'work history', 'professional background'],
      education: ['education', 'academic', 'qualifications', 'degree', 'educational background', 'academic background'],
      projects: ['projects', 'personal projects', 'side projects', 'portfolio', 'key projects', 'project work'],
      certifications: ['certifications', 'certificates', 'licenses', 'credentials'],
      achievements: ['achievements', 'awards', 'honors', 'accomplishments', 'recognition']
    };
  }

  /**
   * Clean and normalize extracted text - Enhanced preprocessing
   */
  cleanText(text) {
    if (!text) return '';
    
    return text
      // Remove excessive newlines (2+ consecutive → single)
      .replace(/\n\s*\n/g, '\n')
      // Remove excessive spaces (2+ → single)
      .replace(/\s{2,}/g, ' ')
      // Normalize punctuation spacing
      .replace(/:/g, ': ')
      .replace(/\./g, '. ')
      // Remove tabs
      .replace(/\t/g, ' ')
      // Remove carriage returns
      .replace(/\r/g, '')
      // Trim each line
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0) // Remove empty lines
      .join('\n')
      // Remove leading/trailing whitespace
      .trim();
  }

  /**
   * Extract text from PDF file
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
   * Extract text from DOCX file
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
   * Extract email address from text - Improved pattern
   */
  extractEmail(text) {
    // More comprehensive email pattern
    const emailPattern = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    const matches = text.match(emailPattern);
    
    if (matches && matches.length > 0) {
      // Return the first valid email found
      for (const email of matches) {
        // Filter out common false positives
        if (!email.includes('example.com') && !email.includes('test.com')) {
          return email;
        }
      }
    }
    return null;
  }

  /**
   * Extract phone number from text
   */
  extractPhone(text) {
    const phonePatterns = [
      /\+\d{1,3}[\s-]?\d{10}/,  // +91 9123456789
      /\d{10}/,  // 9123456789
      /\(\d{3}\)[\s-]?\d{3}[\s-]?\d{4}/  // (123) 456-7890
    ];

    for (const pattern of phonePatterns) {
      const matches = text.match(pattern);
      if (matches) return matches[0];
    }
    return null;
  }

  /**
   * Extract LinkedIn URL from text
   */
  extractLinkedin(text) {
    const linkedinPattern = /linkedin\.com\/in\/[\w-]+/i;
    const matches = text.match(linkedinPattern);
    return matches ? matches[0] : null;
  }

  /**
   * Extract GitHub URL from text
   */
  extractGithub(text) {
    const githubPattern = /github\.com\/[\w-]+/i;
    const matches = text.match(githubPattern);
    return matches ? matches[0] : null;
  }

  /**
   * Extract name (first few lines usually contain name)
   * Improved to skip section headers
   */
  extractName(text) {
    const lines = text.trim().split('\n');
    const sectionHeaders = ['skills', 'education', 'experience', 'projects', 'certifications', 'contact', 'summary', 'objective'];
    
    for (let i = 0; i < Math.min(10, lines.length); i++) {
      const line = lines[i].trim();
      
      // Skip empty lines
      if (!line) continue;
      
      // Skip section headers (all caps or matching keywords)
      const lineLower = line.toLowerCase();
      if (sectionHeaders.some(header => lineLower === header || lineLower.includes(header))) {
        continue;
      }
      
      // Valid name criteria: 2-4 words, reasonable length, no special chars
      const words = line.split(/\s+/);
      if (words.length >= 2 && words.length <= 4 && line.length >= 5 && line.length < 50) {
        // Skip lines with email, phone, URLs, or numbers
        if (!/[@http:www\d{10}\.com]/.test(line)) {
          return line;
        }
      }
    }
    return null;
  }

  /**
   * Find and extract content of a specific section
   */
  findSection(text, sectionType) {
    const keywords = this.sectionKeywords[sectionType] || [];
    const textLower = text.toLowerCase();

    // Find section start
    let sectionStart = -1;
    let matchedKeyword = null;

    for (const keyword of keywords) {
      const pattern = new RegExp(`\\b${keyword}\\b`, 'i');
      const match = textLower.match(pattern);
      if (match) {
        sectionStart = match.index;
        matchedKeyword = keyword;
        break;
      }
    }

    if (sectionStart === -1) return null;

    // Find section end (next major section or end of text)
    const allKeywords = [];
    for (const kw of Object.values(this.sectionKeywords)) {
      allKeywords.push(...kw);
    }

    let sectionEnd = text.length;
    for (const keyword of allKeywords) {
      if (keyword === matchedKeyword) continue;
      const pattern = new RegExp(`\\b${keyword}\\b`, 'i');
      const match = textLower.substring(sectionStart + matchedKeyword.length).match(pattern);
      if (match) {
        const potentialEnd = sectionStart + matchedKeyword.length + match.index;
        if (potentialEnd < sectionEnd) {
          sectionEnd = potentialEnd;
        }
      }
    }

    return text.substring(sectionStart, sectionEnd).trim();
  }

  /**
   * Extract skills from text - Enhanced to handle multiple formats
   */
  extractSkills(text) {
    const skillsSection = this.findSection(text, 'skills');
    if (!skillsSection) {
      // Fallback: try to extract skills from entire text
      return this.extractSkillsFromFullText(text);
    }

    const skills = [];
    const lines = skillsSection.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      // Skip the header line if it's just "SKILLS" or similar
      if (/^(skills|technical skills|core competencies)$/i.test(line)) continue;

      // Handle different formats:
      // 1. Bullet points: "• Skill name" or "- Skill name"
      // 2. Comma-separated: "Skill1, Skill2, Skill3"
      // 3. Pipe-separated: "Skill1 | Skill2 | Skill3"
      // 4. Period-separated: "Skill1. Skill2. Skill3."
      // 5. Full sentences: "MERN stack developer."
      
      // Remove bullet point markers first
      let cleanedLine = line.replace(/^[•●○◦▪▫✓✔➤➢➣→-]\s*/, '');
      
      // Try splitting by common delimiters
      const delimiters = /[,|;.]\s*/;
      const parts = cleanedLine.split(delimiters);
      
      for (const part of parts) {
        const trimmedPart = part.trim();
        
        // Accept skills between 2-50 characters (filter out noise and full sentences)
        if (trimmedPart && trimmedPart.length >= 2 && trimmedPart.length <= 50) {
          // Remove common prefixes
          const cleanedSkill = trimmedPart
            .replace(/^(and|or|the|a|an)\s+/i, '')
            .replace(/[:\s]+$/, '')
            .trim();
          
          if (cleanedSkill.length >= 2) {
            skills.push(cleanedSkill);
          }
        }
      }
    }

    // Remove duplicates (case-insensitive)
    const uniqueSkills = [];
    const seenSkills = new Set();
    for (const skill of skills) {
      const lowerSkill = skill.toLowerCase();
      if (!seenSkills.has(lowerSkill)) {
        seenSkills.add(lowerSkill);
        uniqueSkills.push(skill);
      }
    }

    return uniqueSkills;
  }

  /**
   * Fallback: Extract skills from full text using common tech keywords
   */
  extractSkillsFromFullText(text) {
    const commonSkills = [
      'React', 'Node.js', 'Express', 'MongoDB', 'JavaScript', 'Python', 'HTML', 'CSS',
      'SQL', 'Git', 'GitHub', 'TypeScript', 'C++', 'Java', 'LangChain', 'Huggingface',
      'Tailwind', 'Bootstrap', 'Redux', 'Next.js', 'Vue', 'Angular', 'Django', 'Flask',
      'PostgreSQL', 'MySQL', 'Redis', 'Docker', 'AWS', 'Azure', 'Pandas', 'NumPy'
    ];
    
    const foundSkills = [];
    const textLower = text.toLowerCase();
    
    for (const skill of commonSkills) {
      const skillLower = skill.toLowerCase();
      if (textLower.includes(skillLower)) {
        foundSkills.push(skill);
      }
    }
    
    return foundSkills;
  }

  /**
   * Create structured JSON representation of resume sections
   * This ensures AI reads all sections systematically
   */
  createStructuredResume(parsedData) {
    return {
      contact: {
        name: parsedData.name || 'Not provided',
        email: parsedData.contact.email || 'Not provided',
        phone: parsedData.contact.phone || 'Not provided',
        linkedin: parsedData.contact.linkedin || 'Not provided',
        github: parsedData.contact.github || 'Not provided'
      },
      summary: this.extractSummary(parsedData.raw_text) || 'Not provided',
      skills: parsedData.sections.skills || 'Not provided',
      education: parsedData.sections.education || 'Not provided',
      experience: parsedData.sections.experience || 'Not provided',
      projects: parsedData.sections.projects || 'Not provided',
      certifications: parsedData.sections.certifications || 'Not provided',
      skills_list: parsedData.skills_list || [],
      achievements: parsedData.sections.achievements || 'Not provided'
    };
  }

  /**
   * Extract summary/objective section if present
   */
  extractSummary(text) {
    const summaryKeywords = ['summary', 'objective', 'profile', 'about', 'about me'];
    const textLower = text.toLowerCase();

    for (const keyword of summaryKeywords) {
      const pattern = new RegExp(`\\b${keyword}\\b`, 'i');
      const match = textLower.match(pattern);
      if (match) {
        const startIndex = match.index;
        // Extract next 200 characters or until next section
        const endIndex = Math.min(startIndex + 300, text.length);
        const summaryText = text.substring(startIndex, endIndex);
        
        // Clean and return first 2-3 lines
        const lines = summaryText.split('\n').slice(0, 4).join(' ').trim();
        return lines.length > 20 ? lines : null;
      }
    }
    return null;
  }

  /**
   * Main parsing function - extracts structured data from resume
   */
  async parseResume(filePath, fileType) {
    // Extract raw text
    const rawText = await this.extractText(filePath, fileType);

    // Extract structured information
    const parsedData = {
      raw_text: rawText,
      name: this.extractName(rawText),
      contact: {
        email: this.extractEmail(rawText),
        phone: this.extractPhone(rawText),
        linkedin: this.extractLinkedin(rawText),
        github: this.extractGithub(rawText)
      },
      sections: {
        skills: this.findSection(rawText, 'skills'),
        experience: this.findSection(rawText, 'experience'),
        education: this.findSection(rawText, 'education'),
        projects: this.findSection(rawText, 'projects'),
        certifications: this.findSection(rawText, 'certifications'),
        achievements: this.findSection(rawText, 'achievements')
      },
      skills_list: this.extractSkills(rawText)
    };

    // Create structured JSON for AI
    parsedData.structured = this.createStructuredResume(parsedData);

    return parsedData;
  }
}

module.exports = new ResumeParser();
