import { speechHandler } from '../communication/stt.js';
import { IntentEvaluator } from '../communication/intent.js';
import { EnglishScorer } from '../communication/scoring.js';
import { gameState } from '../state/gameState.js';
import { playerState } from '../player/playerState.js';

export class FeedbackPanel {
  constructor(slotContainer, teammateManager) {
    this.container = slotContainer;
    this.teammateManager = teammateManager;
    this.activeTargetTeammate = null;
    this.onInteractionComplete = null;

    this.init();
    this.bindEvents();
  }

  init() {
    this.container.innerHTML = `
      <div class="comm-container">
        <!-- Floating Feedback Bubble -->
        <div id="feedback-bubble" class="feedback-bubble" style="display: none;">
          <div class="feedback-row">
            <span id="feedback-transcript" style="font-weight: 600;">"..."</span>
            <span id="feedback-intent" class="feedback-intent">Intent: -</span>
          </div>
          <div class="feedback-row">
            <span id="feedback-scores" class="feedback-scores">
              Task: 100 | Vocab (stub): 80 | Grammar (stub): 85
            </span>
          </div>
          <div id="feedback-response" class="feedback-response">
            NPC: "..."
          </div>
        </div>

        <!-- Input Bar with Mic & Text Fallback -->
        <div id="hud-text-input-container" class="comm-input-bar">
          <button id="mic-toggle-btn" class="comm-mic-btn" title="Click to speak (Web Speech API)">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
              <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
            </svg>
          </button>
          <input
            id="comm-text-input"
            type="text"
            class="comm-text-input"
            placeholder="Type tactical command or speak (e.g. 'give me ammo')..."
            autocomplete="off"
          />
          <button id="comm-send-btn" class="comm-send-btn">Send</button>
        </div>
      </div>
    `;

    this.bubble = document.getElementById('feedback-bubble');
    this.transcriptEl = document.getElementById('feedback-transcript');
    this.intentEl = document.getElementById('feedback-intent');
    this.scoresEl = document.getElementById('feedback-scores');
    this.responseEl = document.getElementById('feedback-response');
    this.micBtn = document.getElementById('mic-toggle-btn');
    this.textInput = document.getElementById('comm-text-input');
    this.sendBtn = document.getElementById('comm-send-btn');
  }

  bindEvents() {
    // STT State Listener
    speechHandler.onStateChange((state) => {
      if (state === 'LISTENING') {
        this.micBtn.classList.add('listening');
        this.textInput.placeholder = 'Listening... Speak in English now!';
      } else {
        this.micBtn.classList.remove('listening');
        this.textInput.placeholder = "Type tactical command or speak (e.g. 'give me ammo')...";
      }
    });

    // STT Result Listener
    speechHandler.onResult((transcript, source) => {
      this.handlePlayerInput(transcript, source);
    });

    // Mic Click Handler
    this.micBtn.addEventListener('click', () => {
      speechHandler.startListening();
    });

    // Text Fallback Submit
    const submitText = () => {
      const text = this.textInput.value.trim();
      if (text.length > 0) {
        this.handlePlayerInput(text, 'text');
        this.textInput.value = '';
      }
    };

    this.sendBtn.addEventListener('click', submitText);
    this.textInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        submitText();
      }
    });
  }

  setTargetTeammate(teammate) {
    this.activeTargetTeammate = teammate;
  }

  handlePlayerInput(rawText, source = 'text') {
    // 1. Evaluate Intent
    const targetRole = this.activeTargetTeammate ? this.activeTargetTeammate.role : null;
    const intentResult = IntentEvaluator.evaluate(rawText, targetRole);

    // 2. Score Communication
    const scores = EnglishScorer.scoreInteraction(
      rawText,
      intentResult,
      targetRole,
      ['REQUEST_AMMO', 'ASK_SAFE_ZONE_ROUTE', 'COMBAT_READINESS']
    );

    // 3. Generate NPC Dialogue & Gameplay Consequences
    const npcResponse = this.resolveGameplayConsequences(intentResult, targetRole);

    // 4. Log Communication (Additional Requirement 1: Array log with all details)
    const logItem = gameState.logCommunication({
      targetNpc: this.activeTargetTeammate ? this.activeTargetTeammate.name : 'Squad General',
      transcript: rawText,
      intent: intentResult.intent,
      taskScore: scores.taskScore,
      vocabScore: scores.vocabScore,
      grammarScore: scores.grammarScore,
      source: source
    });

    // 5. Update Feedback UI
    this.displayFeedback(rawText, intentResult, scores, npcResponse);

    if (this.onInteractionComplete) {
      this.onInteractionComplete(intentResult, scores, logItem);
    }
  }

  resolveGameplayConsequences(intentResult, targetRole) {
    const intent = intentResult.intent;

    if (intent === 'REQUEST_AMMO') {
      playerState.addAmmo(20);
      gameState.addReadiness(15);
      return 'Riley (Support): "Here is 20 rounds of ammunition! Keep your rifle ready, Hinaly."';
    }

    if (intent === 'REQUEST_MEDKIT') {
      playerState.heal(25);
      gameState.addReadiness(10);
      return 'Riley (Support): "Applying medkit! You are patched up, stay behind cover."';
    }

    if (intent === 'ASK_SAFE_ZONE_ROUTE') {
      gameState.addReadiness(20);
      return 'Kai (Scout): "The safe zone will close in towards the central pillar at (0, 0). Move with caution!"';
    }

    if (intent === 'ASK_ENEMY_LOCATION') {
      gameState.addReadiness(15);
      return 'Kai (Scout): "Scanners show 4 enemy squads stationed at the surrounding bases. Prepare for convergence!"';
    }

    if (intent === 'COMBAT_READINESS') {
      gameState.addReadiness(20);
      return 'Jax (Assault): "Assault team is ready! We will hold the formation and push to the center."';
    }

    if (intent === 'PROVIDE_COVER') {
      gameState.addReadiness(15);
      return 'Jax (Assault): "Covering fire confirmed! Move forward while I scan the perimeter."';
    }

    if (intent === 'GREETING') {
      return 'Squad: "Standing by! Give us your tactical orders, Hinaly."';
    }

    // Default Unknown
    return 'Teammate: "I did not quite catch that tactical order. Try asking for ammo, safe zone route, or combat readiness!"';
  }

  displayFeedback(rawText, intentResult, scores, npcResponse) {
    this.transcriptEl.textContent = `"${rawText}"`;
    this.intentEl.textContent = `Intent: ${intentResult.intent.replace(/_/g, ' ')}`;
    // Additional Requirement 2: Label vocab & grammar stub as "(stub)"
    this.scoresEl.textContent = `Task: ${scores.taskScore} | Vocab (stub): ${scores.vocabScore} | Grammar (stub): ${scores.grammarScore}`;
    this.responseEl.textContent = npcResponse;
    this.bubble.style.display = 'flex';

    // Auto-hide feedback bubble after 7 seconds
    if (this.hideTimeout) clearTimeout(this.hideTimeout);
    this.hideTimeout = setTimeout(() => {
      this.bubble.style.display = 'none';
    }, 7000);
  }
}
