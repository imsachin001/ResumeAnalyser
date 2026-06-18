/**
 * Resume Quality Calculator (formerly "ATS Calculator")
 *
 * SCOPE — this file is intentionally domain/JD-agnostic. It answers one
 * question only: "is this resume well-built?" — contact completeness,
 * section completeness, formatting, action verbs/quantified impact, and
 * experience depth. It never looks at a job description or a domain's
 * skill list.
 *
 * Domain/JD skill matching ("Job Match") lives entirely in aiAnalyzer.js's
 * computeMatchScore(). Keeping the two separate means a UX designer who
 * applies to a Business Analyst role gets a HIGH resume_quality_score
 * (their resume is well-built) and a LOW match_score (wrong skills for
 * this role) instead of one muddy number that conflates both.
 *
 * resume_quality_score (0-100) breakdown — raw weights sum to 60,
 * then scaled ×(100/60) so the final score is always out of 100:
 *
 *   Contact            10  (raw)  → ~17 pts of 100
 *   Sections           15  (raw)  → ~25 pts of 100
 *   Formatting         10  (raw)  → ~17 pts of 100
 *   Action Verbs +
 *   Quantified Impact  10  (raw)  → ~17 pts of 100
 *   Experience Depth   15  (raw)  → ~25 pts of 100
 *   ─────────────────────────────────────────────
 *   Total raw          60  → scaled to 100
 *
 * aiAnalyzer.js then combines this with match_score (0-100) into the
 * final ats_score:
 *   ats_score = round(0.6 × resume_quality_score + 0.4 × match_score)
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

    // Recognised month names, used by extractYearsFromDuration's
    // date-range parser below.
    this.monthNames = ['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'];
  }

  /**
   * Calculate Resume Quality score — domain/JD-agnostic structural
   * quality only. Total possible: 100 points. Minimum returned: 20.
   *
   * NOTE: no longer takes a domainTemplate parameter — domain/keyword
   * matching is "Job Match" territory now (see aiAnalyzer.computeMatchScore),
   * not Resume Quality.
   */
  calculateResumeQualityScore(parsedData) {
    let rawScore = 0;
    const breakdown = {};

    // 1. Contact Information Completeness (10 raw pts)
    const contactScore = this.calculateContactScore(parsedData.contact);
    rawScore += contactScore;
    breakdown.contact = contactScore;

    // 2. Section Completeness (15 raw pts)
    const sectionScore = this.calculateSectionCompleteness(parsedData);
    rawScore += sectionScore;
    breakdown.sections = sectionScore;

    // 3. Formatting & Structure (10 raw pts)
    const formattingScore = this.calculateFormattingScore(parsedData);
    rawScore += formattingScore;
    breakdown.formatting = formattingScore;

    // 4. Action Verbs + Quantified Impact (10 raw pts)
    const actionVerbScore = this.calculateActionVerbScore(parsedData.raw_text);
    rawScore += actionVerbScore;
    breakdown.actionVerbs = actionVerbScore;

    // 5. Experience / Project Depth (15 raw pts)
    const experienceDepth = this.calculateExperienceDepth(parsedData);
    rawScore += experienceDepth;
    breakdown.experienceDepth = experienceDepth;

    // Scale raw /60 → /100 (min 20 enforced after scaling)
    const scaled = Math.round((rawScore / 60) * 100);

    return {
      total: Math.min(Math.max(scaled, 20), 100),
      breakdown,
      // Expose raw max values so the UI can show "X / maxScore"
      maxScores: { contact: 10, sections: 15, formatting: 10, actionVerbs: 10, experienceDepth: 15 }
    };
  }

  /**
   * Contact information completeness (10 points max).
   * Email is critical — missing it is heavily penalised.
   */
  calculateContactScore(contact) {
    if (!contact) return 0;
    let score = 0;

    if (contact.name)  score += 1;
    if (contact.email) score += 4;   // Critical
    if (contact.phone) score += 2;
    if (contact.linkedin)                    score += 1.5;
    if (contact.github || contact.portfolio) score += 1.5;

    return Math.min(Math.round(score), 10);
  }

  /**
   * Section completeness check (15 points max).
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

    // Education (4 pts)
    if (sectionPresent(
      ['education'],
      /\b(education|academic background|b\.?tech|bachelor|master|degree|university|college|institute)\b/i
    )) score += 4;

    // Skills (4 pts)
    if (sectionPresent(
      ['skills', 'all_skills'],
      /\b(skills?|technical skills?|languages?|frameworks?|tools|core competencies)\b/i
    )) score += 4;

    // Experience OR Projects (3 pts) — students with projects qualify
    const hasExp  = sectionPresent(['experience'], /\b(experience|work history|employment|internship)\b/i);
    const hasProj = sectionPresent(['projects'],   /\b(projects?|personal projects?|key projects?)\b/i);
    if (hasExp || hasProj) score += 3;

    // Projects specifically (2 pts bonus if both present)
    if (hasExp && hasProj) score += 2;

    // Summary/Objective (2 pts)
    if (sectionPresent(
      ['summary'],
      /\b(summary|objective|career objective|profile|about me|professional summary)\b/i
    )) score += 2;

    return Math.min(score, 15);
  }

  // NOTE: domain/JD keyword matching used to live here as
  // calculateKeywordScore(), contributing up to 35 of the old ATS total.
  // It has been removed — that's exactly the kind of domain-specific
  // signal that belongs in Job Match (aiAnalyzer.computeMatchScore),
  // not in a domain-agnostic Resume Quality score. Without this removal,
  // Resume Quality and Job Match were both rewarding the same domain
  // keyword overlap, making the two scores redundant instead of
  // complementary.

  /**
   * Action verbs + quantification (10 points max).
   * - Verb variety: up to 7 pts
   * - Metric/quantification language: up to 3 pts
   */
  calculateActionVerbScore(resumeText) {
    if (!resumeText) return 0;

    // --- Verb variety (7 pts) ---
    const textLower = resumeText.toLowerCase();
    let matchedVerbs = 0;
    this.actionVerbs.forEach(verb => {
      if (new RegExp(`\\b${verb}\\b`, 'gi').test(textLower)) matchedVerbs++;
    });

    let verbScore = 0;
    if (matchedVerbs >= 12) verbScore = 7;
    else if (matchedVerbs >= 8)  verbScore = 5;
    else if (matchedVerbs >= 5)  verbScore = 4;
    else if (matchedVerbs >= 3)  verbScore = 2;
    else if (matchedVerbs >= 1)  verbScore = 1;

    // --- Metric / quantification language (3 pts) ---
    let metricHits = 0;
    this.metricPatterns.forEach(pattern => {
      if (pattern.test(resumeText)) metricHits++;
    });

    let metricScore = 0;
    if (metricHits >= 4)     metricScore = 3;
    else if (metricHits >= 2) metricScore = 2;
    else if (metricHits >= 1) metricScore = 1;

    return Math.min(verbScore + metricScore, 10);
  }

  /**
   * Formatting and structure quality (10 points max).
   */
  calculateFormattingScore(parsedData) {
    let score = 0;
    const text  = parsedData.raw_text || '';
    const lines = text.split('\n').filter(l => l.trim().length > 0);

    // 1. Appropriate length (resume should be 300–7000 chars of actual content)
    if (text.length >= 400 && text.length <= 7000) score += 2;
    else if (text.length >= 200) score += 1;

    // 2. Section heading count — scan raw text directly for any known heading
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
   * Experience / project depth (15 points max).
   */
  calculateExperienceDepth(parsedData) {
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

    // Professional experience — max 15
    if (profCount >= 2 || hasProfessional) return 15;
    if (profCount >= 1 || hasInternship)   return 12;

    // Student / fresher — reward strong projects + achievements
    if (projCount >= 3 && hasAchievements) return 12;
    if (projCount >= 2 || hasAchievements) return 9;
    if (projCount >= 1)                    return 6;

    return 0;
  }

  /**
   * Calculate experience timeline and years
   */
  calculateExperienceTimeline(experience) {
    if (!experience || !Array.isArray(experience) || experience.length === 0) {
      return { totalYears: 0, roleCount: 0, hasGaps: false, averageTenure: 0, roles: [] };
    }

    // Only real jobs/internships count toward a timeline — competitive
    // programming entries (type: 'competitive') don't have a duration and
    // aren't a "role", so counting them in roleCount inflated it.
    const professionalRoles = experience.filter(e => e.type !== 'competitive');

    let totalMonths = 0;
    const roles = [];

    professionalRoles.forEach(exp => {
      if (exp.duration) {
        const years = this.extractYearsFromDuration(exp.duration);
        totalMonths += years * 12;
        roles.push({ role: exp.role || exp.title, duration: exp.duration, years });
      }
    });

    return {
      totalYears: Math.round((totalMonths / 12) * 10) / 10,
      roleCount: professionalRoles.length,
      hasGaps: false,
      averageTenure: roles.length > 0 ? Math.round((totalMonths / roles.length / 12) * 10) / 10 : 0,
      roles
    };
  }

  /**
   * Extract years from a duration string.
   *
   * Handles two formats:
   *  1. Explicit phrasing — "2 years 3 months", "18 months"
   *  2. Date ranges — "Jan 2023 – Aug 2023", "2021 - Present", "06/2022 - 08/2023"
   *     (this is what resumeParserEnhanced.js's extractExperience() actually
   *     produces, so without (2) this always returned 0 for real resumes —
   *     the literal-phrasing check almost never matches a real date range)
   */
  extractYearsFromDuration(duration) {
    if (!duration || typeof duration !== 'string') return 0;

    // 1. Explicit "X years Y months" phrasing
    const yearMatch  = duration.match(/(\d+(?:\.\d+)?)\s*(?:years?|yrs?)\b/i);
    const monthMatch = duration.match(/(\d+)\s*(?:months?|mos?)\b/i);
    if (yearMatch || monthMatch) {
      const years  = yearMatch  ? parseFloat(yearMatch[1]) : 0;
      const months = monthMatch ? parseInt(monthMatch[1], 10) : 0;
      return years + months / 12;
    }

    // 2. Date range: "Mon YYYY – Mon YYYY", "YYYY - Present", "MM/YYYY - MM/YYYY"
    const monthNamePattern = '(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*';
    const rangeRegex = new RegExp(
      `(?:(${monthNamePattern})[a-z]*\\.?\\s+|(\\d{1,2})\\s*[\\/\\-]\\s*)?(\\d{4})` +
      `\\s*(?:[-–—]|to)\\s*` +
      `(?:(${monthNamePattern})[a-z]*\\.?\\s+|(\\d{1,2})\\s*[\\/\\-]\\s*)?(\\d{4}|present|current|ongoing|now)`,
      'i'
    );
    const m = duration.match(rangeRegex);
    if (!m) return 0;

    const [, startMonthName, startMonthNum, startYearStr, endMonthName, endMonthNum, endYearStr] = m;

    const resolveMonth = (name, num) => {
      if (name) return this.monthNames.indexOf(name.toLowerCase().slice(0, 3));
      if (num)  return Math.min(Math.max(parseInt(num, 10) - 1, 0), 11);
      return 0; // default to January when only a year is given
    };

    const startYear  = parseInt(startYearStr, 10);
    const startMonth = resolveMonth(startMonthName, startMonthNum);

    const endIsPresent = /present|current|ongoing|now/i.test(endYearStr);
    const now = new Date();
    const endYear  = endIsPresent ? now.getFullYear() : parseInt(endYearStr, 10);
    const endMonth = endIsPresent ? now.getMonth() : resolveMonth(endMonthName, endMonthNum);

    const totalMonths = (endYear - startYear) * 12 + (endMonth - startMonth);
    return Math.max(totalMonths, 0) / 12;
  }
}

module.exports = new ATSCalculator();