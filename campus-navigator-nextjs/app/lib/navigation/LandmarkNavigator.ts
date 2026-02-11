import { Landmark } from './GuidanceSynthesizer';

export class LandmarkNavigator {
  private landmarks: Landmark[];
  private spokenLandmarks: Set<string> = new Set();
  
  constructor(landmarks: Landmark[]) {
    this.landmarks = landmarks;
  }
  
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371e3; // meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  // Find nearest landmark within radius
  findNearestLandmark(lat: number, lng: number, radius: number = 25): Landmark | null {
    let nearest: Landmark | null = null;
    let minDiff = radius;

    for (const lm of this.landmarks) {
      const dist = this.calculateDistance(lat, lng, lm.lat, lm.lng);
      if (dist < minDiff) {
        minDiff = dist;
        nearest = lm;
      }
    }
    return nearest;
  }
  
  // Generate contextual prompt
  generateContextualPrompt(
    currentPos: [number, number],
    nextManeuver: string,
    distanceToManeuver: number
  ): string | null {
    const [lng, lat] = currentPos;
    const nearbyLandmark = this.findNearestLandmark(lat, lng);
    
    if (!nearbyLandmark) {
      return null;
    }

    const landmarkId = nearbyLandmark.id || nearbyLandmark.name;
    if (this.spokenLandmarks.has(landmarkId)) {
      return null;
    }
    
    let prompt = "";
    const distText = distanceToManeuver >= 1000 
      ? `${(distanceToManeuver / 1000).toFixed(1)} km` 
      : `${Math.round(distanceToManeuver)} meters`;

    // Strategy for contextual prompts:
    // 1. If we are very close to a landmark (< 10m), say "You passed..."
    // 2. If we are a bit further (10-25m), say "You are near..." or "Turn ... after ..."
    
    const distToLandmark = this.calculateDistance(lat, lng, nearbyLandmark.lat, nearbyLandmark.lng);
    
    if (distToLandmark < 10) {
      prompt = `You passed ${nearbyLandmark.name}, ${nextManeuver} in ${distText}.`;
    } else if (nextManeuver.toLowerCase().includes("turn") && distanceToManeuver < 20) {
      prompt = `${nextManeuver} after ${nearbyLandmark.name}.`;
    } else {
      prompt = `You are near ${nearbyLandmark.name}, ${nextManeuver} in ${distText}.`;
    }
    
    this.spokenLandmarks.add(landmarkId);
    return prompt;
  }
  
  reset() {
    this.spokenLandmarks.clear();
  }
}
