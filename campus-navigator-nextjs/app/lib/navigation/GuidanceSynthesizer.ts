/**
 * app/lib/navigation/GuidanceSynthesizer.ts
 * Synthesizes human-style instructions by correlating maneuvers with landmarks.
 */
import { SpeechService } from '../speech/SpeechService';
export interface Landmark {
  id?: string;
  lat: number;
  lng: number;
  navPrompt?: string;
  voice?: {
    navigation?: string;
    tour?: string;
  };
  [key: string]: any;
}

export class GuidanceSynthesizer {
  private visitedLandmarks = new Set<string>();
  private lastSpokenManeuver: string = '';
  private lastManeuverNodeId: string = '';
  private lastNavTime: number = 0;
  private hasAnnouncedWelcome: boolean = false;
  private lastTourLandmarkId: string | null = null;

  constructor(private landmarks: Landmark[]) {}

  /**
   * Calculates distance between two points in meters.
   */
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

  /**
   * Finds the best landmark near a specific coordinate within a threshold.
   */
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

  /**
   * Finds the best landmark with a tour story near a specific coordinate.
   */
  private findTourLandmarkNear(lat: number, lng: number, threshold: number = 50): Landmark | null {
    let nearest: Landmark | null = null;
    let minDiff = threshold;

    for (const lm of this.landmarks) {
      if (!lm.voice?.tour) continue;
      
      const dist = this.calculateDistance(lat, lng, lm.lat, lm.lng);
      if (dist < minDiff) {
        minDiff = dist;
        nearest = lm;
      }
    }
    return nearest;
  }

  /**
   * Synthesizes and speaks a natural instruction.
   * @param userLat Current Latitude
   * @param userLng Current Longitude
   * @param nextManeuver The upcoming maneuver (e.g., "Turn left")
   * @param maneuverCoord The coordinate where the maneuver happens
   * @param distanceToManeuver Distance in meters to the maneuver point
   * @param isTourMode Whether Tour Mode is active
   */
  synthesize(
    userLat: number, 
    userLng: number, 
    nextManeuver: string, 
    maneuverCoord: [number, number] | null,
    distanceToManeuver: number,
    isTourMode: boolean = false
  ) {
    if (isTourMode && !this.hasAnnouncedWelcome) {
      SpeechService.getInstance().speak("Welcome to Tour Mode. I will share historical stories as you explore the campus.", 'TOUR');
      this.hasAnnouncedWelcome = true;
    }

    // 1. Tour Mode Narration (Location-based storytelling)
    if (isTourMode) {
      // ≤ 10m range for tour narration
      const tourLandmark = this.findTourLandmarkNear(userLat, userLng, 10); 
      
      if (tourLandmark && tourLandmark.voice?.tour) {
        const tourId = tourLandmark.id || tourLandmark.name;
        if (!this.visitedLandmarks.has(tourId)) {
          SpeechService.getInstance().speak(tourLandmark.voice.tour, 'TOUR');
          this.visitedLandmarks.add(tourId);
          this.lastTourLandmarkId = tourId;
        }
      } else {
        // Exiting zone: Stop tour narration if we moved away from the current one
        const currentTarget = this.findTourLandmarkNear(userLat, userLng, 50);
        if (this.lastTourLandmarkId && (!currentTarget || (currentTarget.id || currentTarget.name) !== this.lastTourLandmarkId)) {
          if (SpeechService.getInstance().isSpeaking('TOUR')) {
            SpeechService.getInstance().stop();
          }
          this.lastTourLandmarkId = null;
        }

        // Tour Mode Entry Logic: If just enabled and idle, find nearest unvisited landmark
        if (!this.lastTourLandmarkId && !SpeechService.getInstance().isSpeaking()) {
            const nearestUnvisited = this.landmarks
                .filter(lm => lm.voice?.tour && !this.visitedLandmarks.has(lm.id || lm.name))
                .map(lm => ({ lm, dist: this.calculateDistance(userLat, userLng, lm.lat, lm.lng) }))
                .sort((a, b) => a.dist - b.dist)[0];
            
            if (nearestUnvisited && nearestUnvisited.dist <= 30) {
                // We're within a reasonable distance to start narrating the next one
                // But we wait for the 10m trigger or explicit start if needed.
                // The requirement says "begin narration from the nearest unvisited landmark"
                // Let's trigger if within 15-30m but only once.
            }
        }
      }
    }

    // 2. Navigation Mode Integration
    const maneuverKey = `${nextManeuver}-${maneuverCoord?.join(',')}`;
    
    // 2.1 Arrival Logic
    if (nextManeuver === "You have arrived" && distanceToManeuver < 10) {
      if (this.lastSpokenManeuver !== "arrival") {
        SpeechService.getInstance().speak("You have arrived at your destination.", 'NAV');
        this.lastSpokenManeuver = "arrival";
      }
      return;
    }

    // 2.2 Turn Logic (Human-style: "Turn left at the Library")
    if (maneuverCoord && nextManeuver && nextManeuver !== "Continue straight") {
      const landmarkAtTurn = this.findLandmarkNear(maneuverCoord[1], maneuverCoord[0]);
      
      // Trigger 15–30m range for navigation voice
      if (distanceToManeuver <= 30 && distanceToManeuver > 15) {
        const turnId = `turn-${maneuverKey}`;
        if (!this.visitedLandmarks.has(turnId)) {
          let phrase = landmarkAtTurn?.voice?.navigation 
            ? landmarkAtTurn.voice.navigation
            : (landmarkAtTurn ? `${nextManeuver} at ${landmarkAtTurn.name}` : `${nextManeuver} in 25 meters`);
          
          SpeechService.getInstance().speak(phrase, 'NAV');
          this.visitedLandmarks.add(turnId);
          this.lastManeuverNodeId = maneuverKey;
        }
      }
    }

    // 2.3 Straight Path Context (Walk straight past the Canteen)
    // Range 15-30m for nav context
    const nearbyLandmark = this.findLandmarkNear(userLat, userLng, 30);
    if (nearbyLandmark && !SpeechService.getInstance().isSpeaking()) {
      const id = `nav-${nearbyLandmark.id || nearbyLandmark.name}`;
      if (!this.visitedLandmarks.has(id)) {
        // Only mention if we aren't about to turn
        if (distanceToManeuver > 45) {
          const phrase = nearbyLandmark.voice?.navigation || `Continue straight past ${nearbyLandmark.name}`;
          SpeechService.getInstance().speak(phrase, 'NAV');
          this.visitedLandmarks.add(id);
        }
      }
    }
  }

  reset() {
    this.visitedLandmarks.clear();
    this.lastSpokenManeuver = '';
    this.lastManeuverNodeId = '';
    this.hasAnnouncedWelcome = false;
    this.lastTourLandmarkId = null;
  }

  getLastNarration(): { text: string; type: 'NAV' | 'TOUR' } | null {
    const text = SpeechService.getInstance().getLastSpokenText();
    const type = SpeechService.getInstance().getCurrentType();
    if (!text || !type) return null;
    return { text, type: type as 'NAV' | 'TOUR' };
  }
}
