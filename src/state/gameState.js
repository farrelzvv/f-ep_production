// Global Game State Store
// MOCK: In-memory state without backend/database according to SPEC_ADDENDUM.md

class GameState {
  constructor() {
    this.reset();
  }

  reset() {
    this.currentPhase = 'PREPARATION'; // 'SETUP' | 'PREPARATION' | 'ROTATION' | 'WAR_ACTION' | 'RESULT'
    this.squadReadiness = 20; // Starts with base readiness (0 - 100)
    
    // Player details (Protagonist: Hinaly)
    this.player = {
      name: 'Hinaly',
      hp: 100,
      maxHp: 100,
      ammo: 30,
      maxAmmo: 90,
      isAlive: true
    };

    // Communication history and logs for export
    this.communicationLogs = [];

    // Separate English scores and Match Rank (SPEC_ADDENDUM requirement)
    this.englishScore = {
      taskCompletion: 0,
      vocabulary: 0,   // Stub score
      grammar: 0,      // Stub score
      totalInteractions: 0
    };

    this.matchStats = {
      rank: 5,
      totalSquads: 5,
      kills: 0,
      damageDealt: 0,
      startTime: Date.now(),
      endTime: null
    };

    this.activeObjective = 'Speak with your squad members to prepare for rotation';
    this.listeners = new Set();
  }

  // Subscribe to state updates
  subscribe(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  notify() {
    for (const listener of this.listeners) {
      listener(this);
    }
  }

  setPhase(phase) {
    this.currentPhase = phase;
    this.notify();
  }

  addReadiness(amount) {
    this.squadReadiness = Math.min(100, Math.max(0, this.squadReadiness + amount));
    this.notify();
  }

  logCommunication(entry) {
    // entry: { targetNpc, transcript, intent, taskScore, vocabScore, grammarScore, source }
    const logItem = {
      id: this.communicationLogs.length + 1,
      timestamp: new Date().toISOString(),
      ...entry
    };
    this.communicationLogs.push(logItem);

    // Update aggregate English Score
    this.englishScore.totalInteractions++;
    const total = this.englishScore.totalInteractions;
    this.englishScore.taskCompletion = Math.round(
      ((this.englishScore.taskCompletion * (total - 1)) + (entry.taskScore || 0)) / total
    );
    this.englishScore.vocabulary = Math.round(
      ((this.englishScore.vocabulary * (total - 1)) + (entry.vocabScore || 0)) / total
    );
    this.englishScore.grammar = Math.round(
      ((this.englishScore.grammar * (total - 1)) + (entry.grammarScore || 0)) / total
    );

    this.notify();
    return logItem;
  }
}

export const gameState = new GameState();
