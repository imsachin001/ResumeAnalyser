/**
 * Advanced ATS Score Calculator
 * Implements weighted scoring with section completeness and action verb detection
 */

class ATSCalculator {
  constructor() {
    // Action verbs that boost ATS score
    this.actionVerbs = [
      'led', 'managed', 'developed', 'created', 'implemented', 'designed',
      'improved', 'optimized', 'increased', 'decreased', 'achieved', 'delivered',
      'built', 'launched', 'established', 'streamlined', 'automated', 'coordinated',
      'executed', 'initiated', 'resolved', 'enhanced', 'drove', 'spearheaded',
      'pioneered', 'transformed', 'collaborated', 'facilitated', 'mentored'
    ];
  }

  /**
   * Calculate comprehensive ATS score based on multiple factors
   */
  calculateATSScore(parsedData, domainTemplate) {
    let score = 0;
    const breakdown = {};

    // 1. Contact Information Completeness (15 points)
    const contactScore = this.calculateContactScore(parsedData.contact);
    score += contactScore;
    breakdown.contact = contactScore;

    // 2. Section Completeness (20 points)
    const sectionScore = this.calculateSectionCompleteness(parsedData);
    score += sectionScore;
    breakdown.sections = sectionScore;

    // 3. Keyword Matching (weighted by domain) (40 points)
    const keywordScore = this.calculateKeywordScore(parsedData, domainTemplate);
    score += keywordScore;
    breakdown.keywords = keywordScore;

    // 4. Action Verbs Usage (10 points)
    const actionVerbScore = this.calculateActionVerbScore(parsedData.raw_text);
    score += actionVerbScore;
    breakdown.actionVerbs = actionVerbScore;

    // 5. Formatting & Structure (10 points)
    const formattingScore = this.calculateFormattingScore(parsedData);
    score += formattingScore;
    breakdown.formatting = formattingScore;

    // 6. Experience Quality (5 points bonus)
    const experienceBonus = this.calculateExperienceBonus(parsedData);
    score += experienceBonus;
    breakdown.experienceBonus = experienceBonus;

    return {
      total: Math.min(Math.max(Math.round(score), 30), 100), // 30-100 range
      breakdown
    };
  }

  /**
   * Contact information completeness (15 points max)
   */
  calculateContactScore(contact) {
    let score = 0;
    
    if (contact.name) score += 3;
    if (contact.email) score += 4; // Critical
    if (contact.phone) score += 3;
    if (contact.linkedin) score += 2.5;
    if (contact.github || contact.portfolio) score += 2.5;

    return score;
  }

  /**
   * Section completeness check (20 points max)
   */
  calculateSectionCompleteness(parsedData) {
    let score = 0;
    const sections = parsedData.sections || {};

    // Required sections
    if (sections.education && sections.education.length > 0) score += 6;
    if (sections.skills && Object.keys(sections.skills).length > 0) score += 6;
    
    // Important sections
    if (sections.experience && sections.experience.length > 0) score += 5;
    if (sections.projects && sections.projects.length > 0) score += 3;
    
    return score;
  }

  /**
   * Keyword matching weighted by domain importance (40 points max)
   */
  calculateKeywordScore(parsedData, domainTemplate) {
    if (!domainTemplate) return 15; // Base score if no domain detected

    const resumeText = parsedData.raw_text.toLowerCase();
    const importantSkills = domainTemplate.important_skills || [];
    const keywords = domainTemplate.keywords || [];

    let matchedImportantSkills = 0;
    let matchedKeywords = 0;

    // Check important skills (weighted higher)
    importantSkills.forEach(skill => {
      const regex = new RegExp(`\\b${skill.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
      if (regex.test(resumeText)) {
        matchedImportantSkills++;
      }
    });

    // Check domain keywords
    keywords.forEach(keyword => {
      const regex = new RegExp(`\\b${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
      if (regex.test(resumeText)) {
        matchedKeywords++;
      }
    });

    // Scoring formula
    const importantSkillScore = Math.min((matchedImportantSkills / importantSkills.length) * 25, 25);
    const keywordScore = Math.min((matchedKeywords / keywords.length) * 15, 15);

    return Math.round(importantSkillScore + keywordScore);
  }

  /**
   * Action verbs boost score (10 points max)
   */
  calculateActionVerbScore(resumeText) {
    const textLower = resumeText.toLowerCase();
    let matchedVerbs = 0;

    this.actionVerbs.forEach(verb => {
      const regex = new RegExp(`\\b${verb}\\b`, 'gi');
      if (regex.test(textLower)) {
        matchedVerbs++;
      }
    });

    // Score based on variety of action verbs (not just count)
    if (matchedVerbs >= 10) return 10;
    if (matchedVerbs >= 7) return 8;
    if (matchedVerbs >= 5) return 6;
    if (matchedVerbs >= 3) return 4;
    if (matchedVerbs >= 1) return 2;
    return 0;
  }

  /**
   * Formatting and structure quality (10 points max)
   */
  calculateFormattingScore(parsedData) {
    let score = 0;

    // Check for clean structure
    const textLength = parsedData.raw_text?.length || 0;
    if (textLength >= 500 && textLength <= 5000) score += 3; // Appropriate length
    
    // Check for sections with proper headings
    const sections = parsedData.sections || {};
    const sectionCount = Object.keys(sections).filter(key => sections[key]).length;
    if (sectionCount >= 4) score += 4; // Well-organized
    else if (sectionCount >= 3) score += 2;

    // Check for bullet points or structured lists
    const hasBullets = /[•\-\*]/.test(parsedData.raw_text);
    if (hasBullets) score += 3;

    return Math.min(score, 10);
  }

  /**
   * Experience quality bonus (5 points max)
   */
  calculateExperienceBonus(parsedData) {
    const experience = parsedData.sections?.experience || [];
    
    if (experience.length >= 3) return 5; // Multiple roles
    if (experience.length >= 2) return 3;
    if (experience.length >= 1) return 2;
    return 0;
  }

  /**
   * Calculate experience timeline and years
   */
  calculateExperienceTimeline(experience) {
    // Ensure experience is an array
    if (!experience || !Array.isArray(experience) || experience.length === 0) {
      return {
        totalYears: 0,
        roleCount: 0,
        hasGaps: false,
        averageTenure: 0,
        roles: []
      };
    }

    let totalMonths = 0;
    const roles = [];

    experience.forEach(exp => {
      if (exp.duration) {
        const years = this.extractYearsFromDuration(exp.duration);
        totalMonths += years * 12;
        roles.push({
          role: exp.role || exp.title,
          duration: exp.duration,
          years
        });
      }
    });

    return {
      totalYears: Math.round((totalMonths / 12) * 10) / 10,
      roleCount: experience.length,
      hasGaps: false, // Complex to detect, placeholder
      averageTenure: roles.length > 0 ? Math.round((totalMonths / roles.length) * 10) / 120 : 0,
      roles
    };
  }

  /**
   * Extract years from duration string
   */
  extractYearsFromDuration(duration) {
    const yearMatch = duration.match(/(\d+)\s*(?:year|yr)/i);
    const monthMatch = duration.match(/(\d+)\s*(?:month|mo)/i);
    
    let years = yearMatch ? parseInt(yearMatch[1]) : 0;
    const months = monthMatch ? parseInt(monthMatch[1]) : 0;
    
    years += months / 12;
    
    return years;
  }
}

module.exports = new ATSCalculator();
