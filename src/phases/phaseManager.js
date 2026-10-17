import { gameState } from '../state/gameState.js';
import { PreparationPhase } from './preparation.js';
import { RotationPhase } from './rotation.js';
import { WarActionPhase } from './warAction.js';
import { MatchSetupModal } from '../ui/matchSetup.js';
import { ResultScreenModal } from '../ui/resultScreen.js';

export class PhaseManager {
  constructor({ scene, camera, controller, teammateManager, enemyAiManager, hud, feedbackPanel }) {
    this.scene = scene;
    this.camera = camera;
    this.controller = controller;
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

    // Connect player shooting during War Action (Additional Requirement 3)
    if (this.controller) {
      this.controller.onShoot(() => {
        if (gameState.currentPhase === 'WAR_ACTION' && this.warAction) {
          this.warAction.shoot();
        }
      });
    }
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
      },
      this.controller
    );
    this.rotation.start();
  }

  startWarActionPhase() {
    this.warAction = new WarActionPhase(
      this.scene,
      this.camera,
      this.enemyAiManager,
      this.teammateManager,
      () => {
        this.showResultScreen();
      },
      this.controller
    );
    this.warAction.start();
  }

  showResultScreen() {
    if (document.exitPointerLock) {
      document.exitPointerLock();
    }
    const overlay = document.getElementById('ui-layer');
    this.resultScreen = new ResultScreenModal(overlay, () => {
      window.location.reload();
    });
    this.resultScreen.show();
  }

  update(delta, time) {
    if (gameState.currentPhase === 'ROTATION' && this.rotation) {
      this.rotation.update(delta);
    }
    if (gameState.currentPhase === 'WAR_ACTION' && this.warAction) {
      this.warAction.update(delta, time);
    }
  }
}
