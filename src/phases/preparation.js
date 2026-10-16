import { gameState } from '../state/gameState.js';

export class PreparationPhase {
  constructor(teammateManager, onCompletePhase) {
    this.teammateManager = teammateManager;
    this.onCompletePhase = onCompletePhase;

    this.objectives = {
      support: {
        role: 'Support',
        name: 'Riley',
        done: false,
        desc: 'Request ammo or medkit from Riley (Support)'
      },
      scout: {
        role: 'Scout',
        name: 'Kai',
        done: false,
        desc: 'Ask Kai (Scout) for safe zone route'
      },
      assault: {
        role: 'Assault',
        name: 'Jax',
        done: false,
        desc: 'Confirm combat readiness with Jax (Assault)'
      }
    };

    this.timer = 60; // 60s preparation timer
    this.timerInterval = null;
    this.isCompleted = false;
  }

  start() {
    this.isCompleted = false;
    gameState.setPhase('PREPARATION');
    this.updateObjectiveText();

    this.timerInterval = setInterval(() => {
      this.timer--;
      if (this.timer <= 0 && !this.isCompleted) {
        this.finishPreparation();
      }
    }, 1000);
  }

  updateObjectiveText() {
    const pending = Object.values(this.objectives).filter((o) => !o.done);
    if (pending.length > 0) {
      gameState.activeObjective = `[Prep ${3 - pending.length}/3] ${pending[0].desc}`;
    } else {
      gameState.activeObjective = 'All objectives complete! Ready to rotate to safe zone.';
    }
    gameState.notify();
  }

  onInteraction(intentResult, targetTeammate) {
    if (!targetTeammate || this.isCompleted) return;

    const role = targetTeammate.role;
    const intent = intentResult.intent;

    if (role === 'Support' && (intent === 'REQUEST_AMMO' || intent === 'REQUEST_MEDKIT')) {
      if (!this.objectives.support.done) {
        this.objectives.support.done = true;
        targetTeammate.hasInteracted = true;
      }
    } else if (role === 'Scout' && (intent === 'ASK_SAFE_ZONE_ROUTE' || intent === 'ASK_ENEMY_LOCATION')) {
      if (!this.objectives.scout.done) {
        this.objectives.scout.done = true;
        targetTeammate.hasInteracted = true;
      }
    } else if (role === 'Assault' && (intent === 'COMBAT_READINESS' || intent === 'PROVIDE_COVER')) {
      if (!this.objectives.assault.done) {
        this.objectives.assault.done = true;
        targetTeammate.hasInteracted = true;
      }
    }

    this.updateObjectiveText();

    // Check if all objectives are done
    const allDone = Object.values(this.objectives).every((o) => o.done);
    if (allDone && !this.isCompleted) {
      // Bonus readiness for completing all prep objectives
      gameState.addReadiness(15);
      setTimeout(() => {
        this.finishPreparation();
      }, 3000);
    }
  }

  finishPreparation() {
    if (this.isCompleted) return;
    this.isCompleted = true;
    if (this.timerInterval) clearInterval(this.timerInterval);

    if (this.onCompletePhase) {
      this.onCompletePhase();
    }
  }

  cleanup() {
    if (this.timerInterval) clearInterval(this.timerInterval);
  }
}
