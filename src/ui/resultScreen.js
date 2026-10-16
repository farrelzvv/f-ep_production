import { gameState } from '../state/gameState.js';

export class ResultScreenModal {
  constructor(overlayContainer, onRestart) {
    this.container = overlayContainer;
    this.onRestart = onRestart;
    this.modalEl = null;
  }

  show() {
    this.modalEl = document.createElement('div');
    this.modalEl.className = 'modal-overlay';
    this.modalEl.id = 'result-screen-modal';

    const rank = gameState.matchStats.rank || 5;
    const isVictory = rank === 1;
    const titleText = isVictory ? '🏆 SQUAD VICTORY!' : 'MATCH FINISHED';
    const titleColor = isVictory ? '#22c55e' : '#f59e0b';

    // Calculate overall English score (average of task, vocab, grammar)
    const eng = gameState.englishScore;
    const overallEng = eng.totalInteractions > 0
      ? Math.round((eng.taskCompletion + eng.vocabulary + eng.grammar) / 3)
      : 0;

    this.modalEl.innerHTML = `
      <div class="modal-card" style="max-width: 620px;">
        <h1 class="modal-title" style="color: ${titleColor};">${titleText}</h1>
        <p class="modal-subtitle">Simulation Complete — Final Match Performance Review</p>

        <!-- Stats Grid: Battle Rank vs English Scores (Strictly Separated) -->
        <div class="result-stats-grid">
          <!-- Combat Placement Card -->
          <div class="result-stat-box" style="border-left: 4px solid #3b82f6;">
            <div class="stat-box-title">Match Placement</div>
            <div class="stat-box-value">#${rank} / 5</div>
            <div style="font-size: 0.8rem; color: #94a3b8; margin-top: 4px;">
              Kills: <strong>${gameState.matchStats.kills}</strong> | Damage: <strong>${gameState.matchStats.damageDealt}</strong>
            </div>
          </div>

          <!-- English Overall Score Card -->
          <div class="result-stat-box" style="border-left: 4px solid #10b981;">
            <div class="stat-box-title">English Performance</div>
            <div class="stat-box-value">${overallEng} / 100</div>
            <div style="font-size: 0.8rem; color: #94a3b8; margin-top: 4px;">
              Total Calls: <strong>${eng.totalInteractions}</strong>
            </div>
          </div>

          <!-- Task Completion Breakdown -->
          <div class="result-stat-box">
            <div class="stat-box-title">Task Completion</div>
            <div class="stat-box-value" style="font-size: 1.15rem; color: #f8fafc;">
              ${eng.taskCompletion}%
            </div>
            <div style="font-size: 0.75rem; color: #64748b; margin-top: 2px;">
              Objective intent match
            </div>
          </div>

          <!-- Vocabulary & Grammar Stubs (Additional Requirement 2) -->
          <div class="result-stat-box">
            <div class="stat-box-title">Language Diagnostics</div>
            <div style="font-size: 0.85rem; color: #e2e8f0; margin-top: 4px;">
              Vocab <span class="stub-label">(stub)</span>: <strong>${eng.vocabulary}%</strong>
            </div>
            <div style="font-size: 0.85rem; color: #e2e8f0; margin-top: 2px;">
              Grammar <span class="stub-label">(stub)</span>: <strong>${eng.grammar}%</strong>
            </div>
          </div>
        </div>

        <!-- Log Summary Preview -->
        <div style="text-align: left; background: rgba(0,0,0,0.3); border-radius: 8px; padding: 12px 16px; margin-bottom: 24px; max-height: 140px; overflow-y: auto; font-size: 0.8rem;">
          <div style="color: #94a3b8; font-weight: 700; text-transform: uppercase; margin-bottom: 6px;">
            Communication Activity Log (${gameState.communicationLogs.length} events):
          </div>
          ${
            gameState.communicationLogs.length === 0
              ? '<div style="color: #64748b;">No verbal/text communications recorded in this match.</div>'
              : gameState.communicationLogs
                  .slice(-4)
                  .map(
                    (log) => `
                    <div style="margin-bottom: 4px; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 2px;">
                      <span style="color: #38bdf8;">[${log.source}]</span> to <strong>${log.targetNpc}</strong>: 
                      <em>"${log.transcript}"</em> → <span style="color: #10b981;">${log.intent}</span>
                    </div>`
                  )
                  .join('')
          }
        </div>

        <!-- Action Buttons: Export Log JSON & Play Again -->
        <div style="display: flex; justify-content: center; gap: 12px;">
          <button id="export-log-btn" class="btn-secondary" style="margin-left: 0;">
            📥 Export Log (JSON)
          </button>
          <button id="restart-match-btn" class="btn-primary">
            🔄 Play Again
          </button>
        </div>
      </div>
    `;

    this.container.appendChild(this.modalEl);

    // Bind Export JSON (Additional Requirement 1)
    const exportBtn = document.getElementById('export-log-btn');
    exportBtn.addEventListener('click', () => {
      this.exportLogAsJson();
    });

    // Bind Restart
    const restartBtn = document.getElementById('restart-match-btn');
    restartBtn.addEventListener('click', () => {
      this.close();
      if (this.onRestart) {
        this.onRestart();
      } else {
        window.location.reload();
      }
    });
  }

  // Export communication logs to JSON file
  exportLogAsJson() {
    const exportData = {
      matchMetadata: {
        protagonist: gameState.player.name,
        placementRank: gameState.matchStats.rank,
        totalSquads: gameState.matchStats.totalSquads,
        kills: gameState.matchStats.kills,
        damageDealt: gameState.matchStats.damageDealt,
        finalSquadReadiness: gameState.squadReadiness,
        exportedAt: new Date().toISOString()
      },
      englishEvaluation: {
        taskCompletion: gameState.englishScore.taskCompletion,
        vocabularyStub: gameState.englishScore.vocabulary, // (stub)
        grammarStub: gameState.englishScore.grammar,       // (stub)
        totalInteractions: gameState.englishScore.totalInteractions
      },
      communicationLogs: gameState.communicationLogs
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(exportData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `fep_match_log_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  }

  close() {
    if (this.modalEl && this.modalEl.parentNode) {
      this.modalEl.parentNode.removeChild(this.modalEl);
    }
  }
}
