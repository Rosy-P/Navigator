/**
 * app/lib/speech/SpeechService.ts
 * Singleton wrapper around the Web Speech API.
 * Ensures SSR safety and manages speech queue.
 */
export class SpeechService {
  private static instance: SpeechService;
  private synth: SpeechSynthesis | null = null;
  private isMuted: boolean = false;
  private currentSpeechType: 'NAV' | 'TOUR' | null = null;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private lastText: string = "";
  private speaking: boolean = false;
  private subtitleCallback: ((text: string | null) => void) | null = null;
  private subtitleTimeout: NodeJS.Timeout | null = null;

  private constructor() {
    if (typeof window !== 'undefined') {
      this.synth = window.speechSynthesis;
    }
  }

  static getInstance(): SpeechService {
    if (!this.instance) {
      this.instance = new SpeechService();
    }
    return this.instance;
  }

  setMuted(muted: boolean) {
    this.isMuted = muted;
    if (muted) {
      this.stop();
      this.updateSubtitle(null);
    }
  }

  setSubtitleCallback(callback: (text: string | null) => void) {
    this.subtitleCallback = callback;
  }

  private updateSubtitle(text: string | null) {
    if (this.subtitleTimeout) {
      clearTimeout(this.subtitleTimeout);
      this.subtitleTimeout = null;
    }

    if (this.subtitleCallback) {
      this.subtitleCallback(text);
    }
  }

  speak(text: string, type: 'NAV' | 'TOUR' = 'NAV') {
    if (!this.synth || this.isMuted) return;

    // Prevent stuttering: don't restart same text if already speaking
    if (this.speaking && this.lastText === text) {
      return;
    }

    // Navigation voice can interrupt tour narration at any time.
    // Tour narration never interrupts navigation.
    if (this.speaking && this.currentSpeechType === 'NAV' && type === 'TOUR') {
      return; 
    }

    // Clean up previous utterance to avoid race conditions from its events
    if (this.currentUtterance) {
      this.currentUtterance.onstart = null;
      this.currentUtterance.onend = null;
      this.currentUtterance.onerror = null;
    }
    
    // Always call speechSynthesis.cancel() before speaking
    this.synth.cancel();
    
    // If we interrupt a tour with nav, subtitle switches immediately
    if (type === 'NAV') {
      this.updateSubtitle(text);
    }

    const utterance = new SpeechSynthesisUtterance(text);
    this.currentUtterance = utterance; // Keep reference to prevent GC
    this.lastText = text;
    this.currentSpeechType = type;
    
    utterance.onstart = () => {
      this.speaking = true;
      this.updateSubtitle(text);
    };
    
    utterance.onend = () => {
      if (this.currentUtterance === utterance) {
        this.speaking = false;
        this.currentSpeechType = null;
        this.lastText = "";
        
        // Fades out after narration ends (after short delay)
        this.subtitleTimeout = setTimeout(() => {
          this.updateSubtitle(null);
        }, 2000);
      }
    };

    utterance.onerror = (e) => {
      if (this.currentUtterance === utterance) {
        console.error("Speech error:", e);
        this.speaking = false;
        this.currentSpeechType = null;
        this.lastText = "";
      }
    };

    this.synth.speak(utterance);
    this.speaking = true; // Set immediately to prevent same-frame race conditions
  }

  getLastSpokenText(): string {
    return this.lastText;
  }

  getCurrentType(): 'NAV' | 'TOUR' | null {
    return this.currentSpeechType;
  }

  isSpeaking(type?: 'NAV' | 'TOUR'): boolean {
    const isActuallySpeaking = this.speaking || (this.synth?.speaking ?? false);
    if (!type) return isActuallySpeaking;
    return isActuallySpeaking && this.currentSpeechType === type;
  }

  stop() {
    if (this.synth) {
      this.synth.cancel();
      this.speaking = false;
      this.currentSpeechType = null;
      this.updateSubtitle(null);
    }
  }
}
