/**
 * app/lib/speech/SpeechService.ts
 * A singleton service for managing speech synthesis and subtitles.
 * Enforces Priority: Navigation prompts interrupt Tour narration, but not vice-versa.
 */

export type SpeechType = 'NAV' | 'TOUR';

export class SpeechService {
  private static instance: SpeechService;
  private synth: SpeechSynthesis | null = null;
  private isMuted: boolean = false;
  private subtitleCallback: ((text: string | null) => void) | null = null;
  private lastText: string = "";
  private speaking: boolean = false;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private currentType: SpeechType | null = null;
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

  speak(text: string, type: SpeechType): boolean {
    if (!this.synth || this.isMuted || !text) return false;

    // 1. Priority Guard
    const currentlySpeaking = this.synth.speaking;
    const currentTyping = this.currentType;

    if (type === 'TOUR' && currentlySpeaking && currentTyping === 'NAV') {
      // Never interrupt Navigation with a Tour story
      return false;
    }

    // 2. Cancellation
    if (type === 'NAV' || (type === 'TOUR' && currentTyping === 'TOUR')) {
      if (currentlySpeaking) {
        this.synth.cancel();
      }
    }

    // 3. Prevent stuttering
    if (this.speaking && this.lastText === text) {
      return true; // Already speaking it
    }

    // Clean up listeners
    if (this.currentUtterance) {
      this.currentUtterance.onstart = null;
      this.currentUtterance.onend = null;
      this.currentUtterance.onerror = null;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    this.currentUtterance = utterance;
    this.lastText = text;
    this.currentType = type;

    // Parameters
    if (type === 'NAV') {
      utterance.rate = 1.1; 
      utterance.pitch = 1.0;
    } else {
      utterance.rate = 0.95; 
      utterance.pitch = 0.9;
    }

    utterance.onstart = () => {
      this.speaking = true;
      // STRICT RULE: Subtitles ONLY for TOUR
      if (type === 'TOUR') {
        this.updateSubtitle(text);
      } else {
        this.updateSubtitle(null);
      }
    };

    utterance.onend = () => {
      if (this.currentUtterance === utterance) {
        this.speaking = false;
        this.currentType = null;
        this.updateSubtitle(null); // Clear strictly on end
      }
    };

    utterance.onerror = (e: SpeechSynthesisErrorEvent) => {
      if (e.error === 'interrupted' || e.error === 'canceled') return;
      
      if (this.currentUtterance === utterance) {
        console.warn("SpeechService Error:", e.error);
        this.speaking = false;
        this.currentType = null;
        this.updateSubtitle(null);
      }
    };

    // Settle delay
    setTimeout(() => {
      if (this.currentUtterance === utterance && this.synth) {
        this.synth.speak(utterance);
      }
    }, 120);

    return true;
  }

  stop() {
    if (this.synth) {
      this.synth.cancel();
    }
    this.speaking = false;
    this.currentType = null;
    this.updateSubtitle(null); // STRICT: Clear immediately
  }

  isSpeaking(type?: SpeechType): boolean {
    if (!this.synth) return false;
    if (!type) return this.synth.speaking;
    return this.synth.speaking && this.currentType === type;
  }

  getCurrentType(): SpeechType | null {
    return this.currentType;
  }

  getLastSpokenText(): string {
    return this.lastText;
  }
}
