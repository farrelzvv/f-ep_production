// Scoring System for English Communication
// According to SPEC_ADDENDUM.md: Skor vocabulary dan grammar adalah fungsi stub
// dengan komentar TODO (akan diganti nanti). Task completion adalah aspek utama.

export class EnglishScorer {
  /**
   * Evaluates task completion based on matched intent and context
   */
  static evaluateTaskCompletion(intentResult, targetNpcRole, expectedIntents = []) {
    if (!intentResult || intentResult.intent === 'UNKNOWN') {
      return 20; // Minimal attempt score
    }

    // Direct match with expected objective
    if (expectedIntents.length > 0 && expectedIntents.includes(intentResult.intent)) {
      return 100;
    }

    // Role-aligned communication
    if (targetNpcRole && (intentResult.role === targetNpcRole || intentResult.role === 'Any')) {
      return 80;
    }

    // Recognized tactical communication but not current target role
    return 60;
  }

  /**
   * MOCK: Evaluates vocabulary using keyword richness heuristics
   * TODO: Replace with NLP / CEFR vocabulary assessment model in production
   */
  static evaluateVocabulary(rawText) {
    if (!rawText || rawText.trim().length === 0) return 0;

    const words = rawText.toLowerCase().trim().split(/\s+/);
    const tacticalGlossary = [
      'ammo', 'ammunition', 'bullets', 'magazine', 'medkit', 'healing',
      'scout', 'route', 'destination', 'direction', 'safe', 'zone',
      'hostile', 'enemy', 'readiness', 'formation', 'tactical', 'cover', 'flank'
    ];

    let bonus = 0;
    for (const w of words) {
      if (tacticalGlossary.includes(w)) {
        bonus += 15;
      }
    }

    // Base score between 55 and 95
    const baseScore = 55 + Math.min(30, words.length * 6);
    return Math.min(100, baseScore + bonus);
  }

  /**
   * MOCK: Evaluates grammar structure heuristics
   * TODO: Replace with LanguageTool or AST-based grammar checker in production
   */
  static evaluateGrammar(rawText) {
    if (!rawText || rawText.trim().length === 0) return 0;

    const words = rawText.trim().split(/\s+/);
    let score = 70; // baseline

    // Basic structure checks (heuristic stub)
    if (words.length >= 3) score += 15;
    if (words.length >= 5) score += 5;
    if (/[.?!]$/.test(rawText.trim())) score += 5; // proper punctuation
    if (/^[A-Z]/.test(rawText.trim())) score += 5;  // capitalization

    return Math.min(100, score);
  }

  /**
   * Comprehensive evaluation packet
   */
  static scoreInteraction(rawText, intentResult, targetNpcRole, expectedIntents = []) {
    const taskScore = this.evaluateTaskCompletion(intentResult, targetNpcRole, expectedIntents);
    const vocabScore = this.evaluateVocabulary(rawText); // MOCK: stub
    const grammarScore = this.evaluateGrammar(rawText);   // MOCK: stub

    return {
      taskScore,
      vocabScore,   // (stub)
      grammarScore  // (stub)
    };
  }
}
