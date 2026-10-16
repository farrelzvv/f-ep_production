// Web Speech API wrapper with fallback support
// According to SPEC_ADDENDUM.md: Web Speech API in browser, with text input fallback.

export class SpeechHandler {
  constructor() {
    this.recognition = null;
    this.isListening = false;
    this.isSupported = false;
    this.onResultCallback = null;
    this.onStateChangeCallback = null;

    this.init();
  }

  init() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (SpeechRecognition) {
      this.isSupported = true;
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = false;
      this.recognition.interimResults = false;
      this.recognition.lang = 'en-US';

      this.recognition.onstart = () => {
        this.isListening = true;
        this.emitState('LISTENING');
      };

      this.recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        this.emitState('PROCESSING');
        if (this.onResultCallback) {
          this.onResultCallback(transcript, 'voice');
        }
      };

      this.recognition.onerror = (event) => {
        console.warn('SpeechRecognition error:', event.error);
        this.isListening = false;
        this.emitState('IDLE');
      };

      this.recognition.onend = () => {
        this.isListening = false;
        this.emitState('IDLE');
      };
    } else {
      console.warn('Web Speech API is not supported in this browser. Fallback text input active.');
    }
  }

  emitState(state) {
    if (this.onStateChangeCallback) {
      this.onStateChangeCallback(state);
    }
  }

  onStateChange(cb) {
    this.onStateChangeCallback = cb;
  }

  onResult(cb) {
    this.onResultCallback = cb;
  }

  startListening() {
    if (!this.isSupported || !this.recognition) {
      alert('Speech-to-text is not supported in this browser. Please use the text input box.');
      return;
    }
    if (this.isListening) {
      this.recognition.stop();
      return;
    }
    try {
      this.recognition.start();
    } catch (err) {
      console.error('Failed to start speech recognition:', err);
    }
  }

  stopListening() {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
    }
  }
}

export const speechHandler = new SpeechHandler();
