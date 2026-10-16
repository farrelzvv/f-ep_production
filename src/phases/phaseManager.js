import { gameState } from '../state/gameState.js';
import { PreparationPhase } from './preparation.js';
import { RotationPhase } from './rotation.js';
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
    this.rotation = new RotationPhase(
      this.scene,
      this.camera,
      this.teammateManager,
      () => {
        this.startWarActionPhase();
      }
    );
    this.rotation.start();
  }

  startWarActionPhase() {
    if (this.warAction) {
      this.warAction.start();
    } else {
      gameState.setPhase('WAR_ACTION');
      gameState.activeObjective = 'War Action: Defend center against converging squads!';
      gameState.notify();
    }
  }

  update(delta) {
    if (gameState.currentPhase === 'ROTATION' && this.rotation) {
      this.rotation.update(delta);
    }
    if (gameState.currentPhase === 'WAR_ACTION' && this.warAction) {
      this.warAction.update(delta);
    }
  }
}
