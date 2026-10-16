import { gameState } from '../state/gameState.js';
import { PreparationPhase } from './preparation.js';
import { MatchSetupModal } from '../ui/matchSetup.js';

export class PhaseManager {
  constructor({ scene, camera, teammateManager, enemyAiManager, hud, feedbackPanel }) {
    this.scene = scene;
    this.camera = camera;
    this.teammateManager = teammateManager;
    this.enemyAiManager = enemyAiManager;
    this.hud = hud;
    this.feedbackPanel = feedbackPanel;

    this.preparation = null;
    this.rotation = null;
    this.warAction = null;
    this.resultScreen = null;

    this.init();
  }

  init() {
    // Connect feedback panel interaction callbacks
    this.feedbackPanel.onInteractionComplete = (intentResult, scores, logItem) => {
      const activeTeammate = this.feedbackPanel.activeTargetTeammate;
      if (gameState.currentPhase === 'PREPARATION' && this.preparation) {
        this.preparation.onInteraction(intentResult, activeTeammate);
      } else if (gameState.currentPhase === 'ROTATION' && this.rotation) {
        this.rotation.onInteraction(intentResult, activeTeammate);
      }
    };
  }

  startMatchSequence() {
    gameState.setPhase('SETUP');
    const overlay = document.getElementById('ui-layer');

    const setupModal = new MatchSetupModal(overlay, () => {
      this.startPreparationPhase();
    });

    setupModal.show();
  }

  startPreparationPhase() {
    this.preparation = new PreparationPhase(this.teammateManager, () => {
      this.startRotationPhase();
    });
    this.preparation.start();
  }

  startRotationPhase() {
    if (this.rotation) {
      this.rotation.start();
    } else {
      console.log('Rotation phase ready (M4 implementation)');
      gameState.setPhase('ROTATION');
      gameState.activeObjective = 'Rotate towards the Safe Zone at War Action Point (Center)';
    }
  }

  startWarActionPhase() {
    if (this.warAction) {
      this.warAction.start();
    } else {
      console.log('War Action phase ready (M5 implementation)');
      gameState.setPhase('WAR_ACTION');
      gameState.activeObjective = 'Defeat remaining enemy squads at War Action Point!';
    }
  }

  showResultScreen() {
    if (this.resultScreen) {
      this.resultScreen.show();
    }
  }
}
