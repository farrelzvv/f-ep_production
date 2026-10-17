import { gameState } from '../state/gameState.js';
import { playerState } from '../player/playerState.js';

export class Hud {
  constructor(uiContainer) {
    this.container = uiContainer;
    this.init();
    gameState.subscribe(() => this.render());
  }

  init() {
    this.container.innerHTML = `
      <div class="crosshair">
        <div class="crosshair-dot"></div>
      </div>
      <div id="pointer-lock-hint" class="pointer-lock-hint">
        Click to aim & look | [V] Toggle 1st/3rd person | ESC to release cursor
      </div>

      <!-- Top Bar -->
      <div class="hud-top-bar">
        <div class="hud-pill">
          <div id="hud-phase-badge" class="hud-phase-badge">Phase: Preparation</div>
          <div id="hud-objective-text" class="hud-objective-text">${gameState.activeObjective}</div>
        </div>

        <div class="hud-pill hud-readiness-container">
          <div class="hud-readiness-label">
            <span>Squad Readiness</span>
            <span id="hud-readiness-value">${gameState.squadReadiness}%</span>
          </div>
          <div class="hud-bar-bg">
            <div id="hud-readiness-bar" class="hud-bar-fill" style="width: ${gameState.squadReadiness}%"></div>
          </div>
        </div>
      </div>

      <!-- Interaction Prompt -->
      <div id="interaction-prompt" class="interaction-prompt">
        Approach teammate to interact
      </div>

      <!-- Bottom Bar -->
      <div class="hud-bottom-bar">
        <div class="hud-pill hud-player-card">
          <div class="hud-player-name">
            <span>●</span> ${gameState.player.name} (You)
          </div>
          <div class="hud-bar-bg">
            <div id="hud-hp-bar" class="hud-bar-fill hp-fill" style="width: 100%"></div>
          </div>
          <div id="hud-ammo-text" class="hud-ammo-badge">
            Ammo: ${gameState.player.ammo} / ${gameState.player.maxAmmo}
          </div>
        </div>

        <div id="hud-comm-slot"></div>
      </div>
    `;

    this.phaseBadge = document.getElementById('hud-phase-badge');
    this.objectiveText = document.getElementById('hud-objective-text');
    this.readinessValue = document.getElementById('hud-readiness-value');
    this.readinessBar = document.getElementById('hud-readiness-bar');
    this.hpBar = document.getElementById('hud-hp-bar');
    this.ammoText = document.getElementById('hud-ammo-text');
    this.promptEl = document.getElementById('interaction-prompt');
    this.lockHint = document.getElementById('pointer-lock-hint');

    document.addEventListener('pointerlockchange', () => {
      const isLocked = !!document.pointerLockElement;
      if (this.lockHint) {
        this.lockHint.style.opacity = isLocked ? '0' : '1';
      }
    });
  }

  showInteractionPrompt(text) {
    if (this.promptEl) {
      this.promptEl.textContent = text;
      this.promptEl.style.display = 'block';
    }
  }

  hideInteractionPrompt() {
    if (this.promptEl) {
      this.promptEl.style.display = 'none';
    }
  }

  render() {
    if (this.phaseBadge) {
      this.phaseBadge.textContent = `Phase: ${gameState.currentPhase.replace('_', ' ')}`;
    }
    if (this.objectiveText) {
      this.objectiveText.textContent = gameState.activeObjective;
    }
    if (this.readinessValue && this.readinessBar) {
      this.readinessValue.textContent = `${gameState.squadReadiness}%`;
      this.readinessBar.style.width = `${gameState.squadReadiness}%`;
    }
    if (this.hpBar) {
      const hpPct = Math.round((gameState.player.hp / gameState.player.maxHp) * 100);
      this.hpBar.style.width = `${hpPct}%`;
    }
    if (this.ammoText) {
      this.ammoText.textContent = `Ammo: ${gameState.player.ammo} / ${gameState.player.maxAmmo}`;
    }
  }
}
