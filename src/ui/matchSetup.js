// Mock Match Setup Screen
// According to GDD & SPEC_ADDENDUM.md: single-player simulation displaying
// "Searching for Match..." and "5/5 Squads Ready" without real multiplayer.

export class MatchSetupModal {
  constructor(overlayContainer, onStartMatch) {
    this.container = overlayContainer;
    this.onStartMatch = onStartMatch;
    this.modalEl = null;
    this.squadCount = 1;
    this.timerInterval = null;
  }

  show() {
    this.modalEl = document.createElement('div');
    this.modalEl.className = 'modal-overlay';
    this.modalEl.id = 'match-setup-modal';

    this.modalEl.innerHTML = `
      <div class="modal-card">
        <h1 class="modal-title">FREE ENGLISH PRACTICE</h1>
        <p class="modal-subtitle">Tactical Communication & Squad Survival Simulation</p>

        <div style="margin: 20px 0; padding: 16px; background: rgba(15,23,42,0.6); border-radius: 12px; border: 1px solid rgba(255,255,255,0.08);">
          <div id="match-status-label" style="font-size: 1.1rem; font-weight: 700; color: #38bdf8; margin-bottom: 8px;">
            Searching for Match...
          </div>
          <div id="match-squads-ready" style="font-size: 0.9rem; color: #94a3b8; margin-bottom: 12px;">
            Squads Ready: <strong style="color: #f8fafc;" id="squad-counter-text">1 / 5</strong>
          </div>
          <div class="hud-bar-bg" style="height: 6px;">
            <div id="setup-progress-bar" class="hud-bar-fill" style="width: 20%;"></div>
          </div>
        </div>

        <div style="text-align: left; background: rgba(0,0,0,0.25); padding: 14px 18px; border-radius: 8px; margin-bottom: 24px; font-size: 0.85rem;">
          <div style="color: #94a3b8; font-weight: 700; text-transform: uppercase; margin-bottom: 6px;">Your Squad:</div>
          <div>👤 <strong>Hinaly</strong> (Protagonist / You)</div>
          <div>🟢 <strong>Riley</strong> — Support (Supplies & Ammo)</div>
          <div>🔵 <strong>Kai</strong> — Scout (Zone Recon & Navigation)</div>
          <div>🟠 <strong>Jax</strong> — Assault (Combat Coordination)</div>
        </div>

        <button id="deploy-match-btn" class="btn-primary" disabled style="opacity: 0.5; width: 100%;">
          Connecting to Arena...
        </button>
      </div>
    `;

    this.container.appendChild(this.modalEl);

    const statusLabel = document.getElementById('match-status-label');
    const squadCounter = document.getElementById('squad-counter-text');
    const progressBar = document.getElementById('setup-progress-bar');
    const deployBtn = document.getElementById('deploy-match-btn');

    // Simulate matchmaking countdown: 1/5 -> 3/5 -> 5/5
    this.timerInterval = setInterval(() => {
      this.squadCount++;
      if (this.squadCount <= 5) {
        squadCounter.textContent = `${this.squadCount} / 5`;
        progressBar.style.width = `${(this.squadCount / 5) * 100}%`;
      }

      if (this.squadCount >= 5) {
        clearInterval(this.timerInterval);
        statusLabel.textContent = 'All 5 Squads Ready!';
        statusLabel.style.color = '#10b981';
        deployBtn.textContent = 'Deploy to Arena (Base 1)';
        deployBtn.disabled = false;
        deployBtn.style.opacity = '1';
        deployBtn.style.cursor = 'pointer';

        deployBtn.addEventListener('click', () => {
          this.close();
          if (this.onStartMatch) this.onStartMatch();
        });
      }
    }, 700);
  }

  close() {
    if (this.timerInterval) clearInterval(this.timerInterval);
    if (this.modalEl && this.modalEl.parentNode) {
      this.modalEl.parentNode.removeChild(this.modalEl);
    }
  }
}
