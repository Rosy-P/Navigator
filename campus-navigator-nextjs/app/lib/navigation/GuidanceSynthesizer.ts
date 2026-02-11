/**
 * app/lib/navigation/GuidanceSynthesizer.ts
 * LANDMARK NARRATOR ONLY
 * Handles campus descriptions with strict mode-based verbosity.
 * - Navigation Mode: Brief (1 sentence)
 * - Tour Mode: Rich (Full description)
 * 
 * Includes EXIT DETECTION: Stops narration if user walks away.
 */
import { SpeechService } from '../speech/SpeechService';

export interface Landmark {
  id?: string;
  lat: number;
  lng: number;
  voice?: {
    navigation?: string; // Used for "Brief" narration
    tour?: string;       // Used for "Rich" narration
  };
  [key: string]: any;
}

export class GuidanceSynthesizer {
  private visitedLandmarks = new Set<string>();
  private activeLandmarkId: string | null = null; // Tracks currently narrating landmark

  constructor(private landmarks: Landmark[]) {}

  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371e3;
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  private findLandmarkNear(lat: number, lng: number, threshold: number = 25): Landmark | null {
    let nearest: Landmark | null = null;
    let minDiff = threshold;
    for (const lm of this.landmarks) {
      const dist = this.calculateDistance(lat, lng, lm.lat, lm.lng);
      if (dist < minDiff) {
        minDiff = dist;
        nearest = lm;
      }
    }
    return nearest;
  }

  private findLandmarkById(id: string): Landmark | undefined {
      return this.landmarks.find(l => (l.id || l.name) === id);
  }

  /**
   * Synthesizes LANDMARK descriptions only.
   * Returns null if no landmark is relevant or already visited.
   */
  synthesize(
    userLat: number, 
    userLng: number, 
    isTourMode: boolean = false
  ): { text: string, type: 'TOUR' } | null {
    
    // 1. EXIT CHECK (If we are currently narrating something)
    if (this.activeLandmarkId) {
        const activeLandmark = this.findLandmarkById(this.activeLandmarkId);
        if (activeLandmark) {
            const dist = this.calculateDistance(userLat, userLng, activeLandmark.lat, activeLandmark.lng);
            // Hysteresis: Exit radius is Enter radius + 7m (~22m or 27m)
            const exitThreshold = isTourMode ? 28 : 22; 
            
            if (dist > exitThreshold) {
                // User walked away -> Stop Narration
                SpeechService.getInstance().stop(); 
                this.activeLandmarkId = null; 
            }
        }
    }

    // 2. ENTRY CHECK (Look for new landmarks)
    // Detection range: 15m for Nav Mode (Focus on path), 20m for Tour Mode (Exploration)
    const enterRange = isTourMode ? 20 : 15;
    const landmark = this.findLandmarkNear(userLat, userLng, enterRange);

    if (landmark && landmark.voice) {
      const id = landmark.id || landmark.name;
      
      // If we haven't visited this landmark yet
      if (!this.visitedLandmarks.has(id)) {
        
        // STRICT PRIORITY CHECK:
        // If Navigation is speaking, we return null immediately.
        if (SpeechService.getInstance().isSpeaking('NAV')) {
          return null;
        }

        // CONTENT SELECTION:
        let text = "";
        if (isTourMode && landmark.voice.tour) {
            text = landmark.voice.tour;
        } else {
            // Brief mode
            text = landmark.voice.navigation 
                || landmark.voice.tour?.split(/[.!?]/)[0] + "." 
                || `This is ${landmark.name}.`;
        }

        if (text) {
            this.visitedLandmarks.add(id);
            this.activeLandmarkId = id; // Set active on start
            return { text, type: 'TOUR' };
        }
      }
    } 

    return null;
  }

  reset() {
    this.visitedLandmarks.clear();
    this.activeLandmarkId = null;
    SpeechService.getInstance().stop();
  }
}
