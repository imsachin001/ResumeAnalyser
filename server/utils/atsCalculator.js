/**
 * Advanced ATS Score Calculator
 * Implements weighted scoring with section completeness and action verb detection
 *
 * FIXES:
 * - Removed flat 30-point floor so scores actually differentiate weak vs strong resumes
 * - Contact score now penalizes missing email/phone more sharply (email is critical)
 * - Keyword score: no-domain fallback reduced from 15→8 so resumes without a clear domain
 *   don't get a free pass; also uses a sqrt curve so early keyword matches matter more
 * - Action verb score now counts distinct verb TYPES and also checks for metric language
 * - Formatting score checks line/bullet density, not just raw length
 * - Experience bonus now grades internships vs professional roles differently
 * - Min score lowered to 20 (not 30) so poor resumes surface as poor
 */

class ATSCalculator {
  constructor() {
    // Action verbs that boost ATS score (expanded)
    this.actionVerbs = [
      'led', 'managed', 'developed', 'created', 'implemented', 'designed',
      'improved', 'optimized', 'increased', 'decreased', 'achieved', 'delivered',
      'built', 'launched', 'established', 'streamlined', 'automated', 'coordinated',
      'executed', 'initiated', 'resolved', 'enhanced', 'drove', 'spearheaded',
      'pioneered', 'transformed', 'collaborated', 'facilitated', 'mentored',
      'deployed', 'integrated', 'migrated', 'refactored', 'architected', 'scaled',
      'reduced', 'accelerated', 'negotiated', 'presented', 'trained', 'analysed',
      'analyzed', 'researched', 'documented', 'monitored', 'maintained', 'supported'
    ];

    // Metric/quantification patterns — resumes with numbers score higher
    this.metricPatterns = [
      /\d+\s*%/,                    // percentages
      /\d+\s*(users?|clients?)/i,   // user counts
      /\$\s*\d+/,                   // dollar amounts
      /reduced\s+by\s+\d+/i,
      /increased\s+by\s+\d+/i,
      /\d+x\s+(faster|improvement|growth)/i,
      /₹\s*\d+/,                    // INR amounts
      /lpa|lakh/i
    ];
  }

  /**
   * Calculate comprehensive ATS score based on multiple factors.
   * Total possible: 100 points. Minimum returned: 20. Maximum: 100.
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

    // 3. Keyword Matching weighted by domain (35 points)
    // Reduced from 40 → 35 to give more weight to the new metrics bonus below
    const keywordScore = this.calculateKeywordScore(parsedData, domainTemplate);
    score += keywordScore;
    breakdown.keywords = keywordScore;

    // 4. Action Verbs + Quantification (15 points)
    // Increased from 10 → 15: verbs alone (10) + metric language (5)
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

    // No artificial floor — minimum 20 so scores spread naturally
    return {
      total: Math.min(Math.max(Math.round(score), 20), 100),
      breakdown
    };
  }

  /**
   * Contact information completeness (15 points max).
   * Email is critical — missing it is heavily penalised.
   */
  calculateContactScore(contact) {
    if (!contact) return 0;
    let score = 0;

    if (contact.name)  score += 2;
    if (contact.email) score += 5;   // Critical — up from 4
    if (contact.phone) score += 3;
    if (contact.linkedin)                    score += 2.5;
    if (contact.github || contact.portfolio) score += 2.5;

    return Math.min(Math.round(score), 15);
  }

  /**
   * Section completeness check (20 points max).
   * Two-pass: structured data first, then raw text heading scan as fallback.
   * This ensures parsing failures don't tank the score.
   */
  calculateSectionCompleteness(parsedData) {
    let score = 0;
    const text = parsedData.raw_text || '';

    const hasContent = (val) => {
      if (!val) return false;
      if (Array.isArray(val)) return val.length > 0;
      if (typeof val === 'object') return Object.values(val).some(v => v && String(v).trim().length > 0);
      if (typeof val === 'string') return val.trim().length > 10;
      return false;
    };

    const structured = parsedData.structured || {};
    const sections   = parsedData.sections   || {};

    // Helper: check structured data OR scan raw text for a heading
    const sectionPresent = (structuredKeys, headingRegex) => {
      // Pass 1: structured
      for (const key of structuredKeys) {
        const val = structured[key] || sections[key];
        if (hasContent(val)) return true;
      }
      // Pass 2: raw text heading presence
      return headingRegex ? headingRegex.test(text) : false;
    };

    // Education (6 pts)
    if (sectionPresent(
      ['education'],
      /\b(education|academic background|b\.?tech|bachelor|master|degree|university|college|institute)\b/i
    )) score += 6;

    // Skills (6 pts)
    if (sectionPresent(
      ['skills', 'all_skills'],
      /\b(skills?|technical skills?|languages?|frameworks?|tools|core competencies)\b/i
    )) score += 6;

    // Experience OR Projects (5 pts) — students with projects qualify
    const hasExp  = sectionPresent(['experience'], /\b(experience|work history|employment|internship)\b/i);
    const hasProj = sectionPresent(['projects'],   /\b(projects?|personal projects?|key projects?)\b/i);
    if (hasExp || hasProj) score += 5;

    // Projects specifically (2 pts bonus on top if both present)
    if (hasExp && hasProj) score += 2;

    // Summary/Objective (1 pt)
    if (sectionPresent(
      ['summary'],
      /\b(summary|objective|career objective|profile|about me|professional summary)\b/i
    )) score += 1;

    return Math.min(score, 20);
  }

  /**
   * Keyword matching weighted by domain importance (35 points max).
   *
   * Uses a square-root curve so the first few keyword matches give a good
   * boost and diminishing returns kick in — this prevents "keyword stuffed"
   * resumes from dominating while still rewarding broad coverage.
   */
  calculateKeywordScore(parsedData, domainTemplate) {
    // No domain detected → small base so poor resumes still score low
    if (!domainTemplate) return 8;

    const resumeText      = (parsedData.raw_text || '').toLowerCase();
    const importantSkills = domainTemplate.important_skills || [];
    const keywords        = domainTemplate.keywords || [];

    const countMatches = (list) =>
      list.filter(item => {
        const escaped = item.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        return new RegExp(`\\b${escaped}\\b`, 'i').test(resumeText);
      }).length;

    const matchedImportant = countMatches(importantSkills);
    const matchedKeywords  = countMatches(keywords);

    // Square-root curve: rewards first matches more than later ones
    const importantRatio = importantSkills.length > 0
      ? Math.sqrt(matchedImportant / importantSkills.length)
      : 0;
    const keywordRatio = keywords.length > 0
      ? Math.sqrt(matchedKeywords / keywords.length)
      : 0;

    const importantScore = Math.round(importantRatio * 22); // max 22
    const keywordScore   = Math.round(keywordRatio   * 13); // max 13

    return Math.min(importantScore + keywordScore, 35);
  }

  /**
   * Action verbs + quantification (15 points max).
   * - Verb variety: up to 10 pts
   * - Metric/quantification language: up to 5 pts (new)
   */
  calculateActionVerbScore(resumeText) {
    if (!resumeText) return 0;

    // --- Verb variety (10 pts) ---
    const textLower = resumeText.toLowerCase();
    let matchedVerbs = 0;
    this.actionVerbs.forEach(verb => {
      if (new RegExp(`\\b${verb}\\b`, 'gi').test(textLower)) matchedVerbs++;
    });

    let verbScore = 0;
    if (matchedVerbs >= 12) verbScore = 10;
    else if (matchedVerbs >= 8)  verbScore = 8;
    else if (matchedVerbs >= 5)  verbScore = 6;
    else if (matchedVerbs >= 3)  verbScore = 4;
    else if (matchedVerbs >= 1)  verbScore = 2;

    // --- Metric / quantification language (5 pts) ---
    let metricHits = 0;
    this.metricPatterns.forEach(pattern => {
      if (pattern.test(resumeText)) metricHits++;
    });

    let metricScore = 0;
    if (metricHits >= 4)     metricScore = 5;
    else if (metricHits >= 2) metricScore = 3;
    else if (metricHits >= 1) metricScore = 1;

    return Math.min(verbScore + metricScore, 15);
  }

  /**
   * Formatting and structure quality (10 points max).
   * Checks text length, section count (from raw text headings), and bullet density.
   */
  calculateFormattingScore(parsedData) {
    let score = 0;
    const text  = parsedData.raw_text || '';
    const lines = text.split('\n').filter(l => l.trim().length > 0);

    // 1. Appropriate length (resume should be 300–7000 chars of actual content)
    if (text.length >= 400 && text.length <= 7000) score += 2;
    else if (text.length >= 200) score += 1;

    // 2. Section heading count — scan raw text directly for any known heading
    //    rather than relying on parsed structured data which may have missed some
    const headingPatterns = [
      /^(education|academic background)$/i,
      /^(experience|work experience|employment|work history|employment history)$/i,
      /^(projects?|personal projects?|key projects?)$/i,
      /^(skills?|technical skills?|core competencies)$/i,
      /^(summary|objective|profile|about|about me)$/i,
      /^(achievements?|awards?|honors?)$/i,
      /^(certifications?|courses?|licenses?)$/i,
      /^(contact|contact information)$/i,
    ];
    const foundHeadings = new Set();
    lines.forEach(l => {
      const trimmed = l.trim();
      headingPatterns.forEach((p, i) => {
        if (p.test(trimmed)) foundHeadings.add(i);
      });
    });
    const sectionCount = foundHeadings.size;
    if      (sectionCount >= 5) score += 4;
    else if (sectionCount >= 4) score += 3;
    else if (sectionCount >= 3) score += 2;
    else if (sectionCount >= 2) score += 1;

    // 3. Bullet point density — check both • and - and * characters
    const bulletLines = lines.filter(l => /^[•\-\*\u2022\u25CF\u25AA▸►→]/.test(l.trim())).length;
    if      (bulletLines >= 8) score += 4;
    else if (bulletLines >= 5) score += 3;
    else if (bulletLines >= 2) score += 2;
    else if (bulletLines >= 1) score += 1;

    return Math.min(score, 10);
  }

  /**
   * Experience quality bonus (5 points max).
   * For students: projects count as experience if they are substantive.
   * For professionals: professional roles score higher.
   */
  calculateExperienceBonus(parsedData) {
    const structured = parsedData.structured || {};
    const text       = (parsedData.raw_text || '').toLowerCase();

    // Count professional roles
    const professionalExp = structured.experience || parsedData.experience || [];
    const profCount = Array.isArray(professionalExp)
      ? professionalExp.filter(e => e.type === 'professional').length
      : 0;

    // Count substantive projects (has description, not just a title)
    const projects = structured.projects || parsedData.projects || [];
    const projCount = Array.isArray(projects)
      ? projects.filter(p => (p.description || '').length > 30 || (Array.isArray(p.description) && p.description.length > 0)).length
      : 0;

    const hasInternship    = /intern(ship)?|trainee|apprentice/.test(text);
    const hasProfessional  = /full.?time|employed|position at|role at|worked at|working at/.test(text);
    const hasAchievements  = /icpc|hackathon|leetcode|codeforces|codechef|top \d+%|ranking|rank \d+/.test(text);

    // Professional experience — max 5
    if (profCount >= 2 || hasProfessional) return 5;
    if (profCount >= 1 || hasInternship)   return 4;

    // Student / fresher — reward strong projects + achievements
    if (projCount >= 3 && hasAchievements) return 4;
    if (projCount >= 2 || hasAchievements) return 3;
    if (projCount >= 1)                    return 2;

    return 0;
  }

  /**
   * Calculate experience timeline and years
   */
  calculateExperienceTimeline(experience) {
    if (!experience || !Array.isArray(experience) || experience.length === 0) {
      return { totalYears: 0, roleCount: 0, hasGaps: false, averageTenure: 0, roles: [] };
    }

    let totalMonths = 0;
    const roles = [];

    experience.forEach(exp => {
      if (exp.duration) {
        const years = this.extractYearsFromDuration(exp.duration);
        totalMonths += years * 12;
        roles.push({ role: exp.role || exp.title, duration: exp.duration, years });
      }
    });

    return {
      totalYears: Math.round((totalMonths / 12) * 10) / 10,
      roleCount: experience.length,
      hasGaps: false,
      averageTenure: roles.length > 0 ? Math.round((totalMonths / roles.length) * 10) / 120 : 0,
      roles
    };
  }

  /**
   * Extract years from duration string
   */
  extractYearsFromDuration(duration) {
    const yearMatch  = duration.match(/(\d+)\s*(?:year|yr)/i);
    const monthMatch = duration.match(/(\d+)\s*(?:month|mo)/i);
    let years  = yearMatch  ? parseInt(yearMatch[1])  : 0;
    const months = monthMatch ? parseInt(monthMatch[1]) : 0;
    years += months / 12;
    return years;
  }
}

module.exports = new ATSCalculator();