// Rule-based Intent Recognition based on Phrase Banks
// According to SPEC_ADDENDUM.md: rule-based dari phrase bank, bukan model AI.

export const INTENT_PHRASE_BANK = {
  // Support NPC (Riley)
  REQUEST_AMMO: {
    role: 'Support',
    phrases: [
      'give me ammo',
      'need ammo',
      'need ammunition',
      'i need bullets',
      'can i have ammo',
      'spare ammo',
      'give me bullets',
      'ammo please',
      'pass some ammo',
      'give ammo',
      'give some bullets'
    ],
    keywords: ['ammo', 'ammunition', 'bullet', 'bullets', 'mag', 'magazine', 'reload']
  },
  REQUEST_MEDKIT: {
    role: 'Support',
    phrases: [
      'give me medkit',
      'need healing',
      'heal me',
      'need medkit',
      'need medical kit',
      'first aid',
      'low hp',
      'i need health',
      'help me'
    ],
    keywords: ['medkit', 'heal', 'healing', 'medic', 'first aid', 'health', 'bandage']
  },

  // Scout NPC (Kai)
  ASK_SAFE_ZONE_ROUTE: {
    role: 'Scout',
    phrases: [
      'which way to go',
      'where is the safe zone',
      'route to safe zone',
      'where do we go',
      'guide us',
      'show route',
      'how to get to zone',
      'safe path',
      'what is our direction',
      'where should we rotate',
      'next destination'
    ],
    keywords: ['zone', 'route', 'direction', 'path', 'rotate', 'destination', 'safe', 'way']
  },
  ASK_ENEMY_LOCATION: {
    role: 'Scout',
    phrases: [
      'where are the enemies',
      'where is the enemy',
      'spot any enemy',
      'any enemies around',
      'enemy location',
      'scout the area',
      'is it clear',
      'check enemies',
      'any hostiles'
    ],
    keywords: ['enemy', 'enemies', 'hostile', 'hostiles', 'spotted', 'scout', 'clear', 'danger']
  },

  // Assault NPC (Jax)
  COMBAT_READINESS: {
    role: 'Assault',
    phrases: [
      'ready for battle',
      'are you ready',
      'prepare for combat',
      'attack formation',
      'status check',
      'weapons ready',
      'let us fight',
      'ready up',
      'are we prepared'
    ],
    keywords: ['ready', 'combat', 'battle', 'formation', 'fight', 'weapons', 'prepared', 'attack']
  },
  PROVIDE_COVER: {
    role: 'Assault',
    phrases: [
      'cover me',
      'watch my back',
      'hold this position',
      'suppressive fire',
      'focus fire',
      'protect me'
    ],
    keywords: ['cover', 'watch', 'protect', 'fire', 'back', 'hold']
  },

  // General / Greeting
  GREETING: {
    role: 'Any',
    phrases: ['hello', 'hi', 'hey squad', 'hey team', 'squad check'],
    keywords: ['hello', 'hi', 'hey']
  }
};

export class IntentEvaluator {
  static evaluate(rawText, targetRole = null) {
    if (!rawText || typeof rawText !== 'string') {
      return {
        intent: 'UNKNOWN',
        matchedPhrase: null,
        confidence: 0,
        role: null,
        feedback: 'No input detected.'
      };
    }

    const cleaned = rawText
      .toLowerCase()
      .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g, '')
      .trim();

    let bestMatch = {
      intent: 'UNKNOWN',
      matchedPhrase: null,
      confidence: 0,
      role: null
    };

    // 1. Check exact phrase match first
    for (const [intentKey, data] of Object.entries(INTENT_PHRASE_BANK)) {
      // Prioritize target role if specified
      const roleMatchBonus = targetRole && (data.role === targetRole || data.role === 'Any') ? 0.2 : 0;

      for (const phrase of data.phrases) {
        if (cleaned === phrase) {
          return {
            intent: intentKey,
            matchedPhrase: phrase,
            confidence: 1.0,
            role: data.role
          };
        }
        if (cleaned.includes(phrase) || phrase.includes(cleaned)) {
          const conf = 0.85 + roleMatchBonus;
          if (conf > bestMatch.confidence) {
            bestMatch = {
              intent: intentKey,
              matchedPhrase: phrase,
              confidence: Math.min(1.0, conf),
              role: data.role
            };
          }
        }
      }

      // 2. Keyword heuristic matching
      const inputWords = cleaned.split(/\s+/);
      const matchedKeywords = data.keywords.filter((k) => inputWords.includes(k));
      if (matchedKeywords.length > 0) {
        const keywordConf = 0.5 + (matchedKeywords.length * 0.15) + roleMatchBonus;
        if (keywordConf > bestMatch.confidence) {
          bestMatch = {
            intent: intentKey,
            matchedPhrase: matchedKeywords.join(', '),
            confidence: Math.min(0.9, keywordConf),
            role: data.role
          };
        }
      }
    }

    return bestMatch;
  }
}
