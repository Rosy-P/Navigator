/**
 * app/hooks/useVoiceNavigation.ts
 * Hook to manage human-style voice guidance during navigation.
 */
import { useEffect, useRef, useState } from 'react';
import { GuidanceSynthesizer, Landmark } from '../lib/navigation/GuidanceSynthesizer';
import { SpeechService } from '../lib/speech/SpeechService';

interface VoiceNavOptions {
  currentLocation: [number, number] | null;
  nextManeuver?: string;
  maneuverCoord?: [number, number] | null;
  distanceToManeuver?: number;
  isTourMode?: boolean;
}

export function useVoiceNavigation(landmarks: Landmark[], options: VoiceNavOptions) {
  const { currentLocation, nextManeuver, maneuverCoord, distanceToManeuver, isTourMode } = options;
  const [isMuted, setIsMuted] = useState(false);
  const synthesizerRef = useRef<GuidanceSynthesizer | null>(null);

  // Initialize synthesizer when landmarks are available
  useEffect(() => {
    if (landmarks.length > 0 && !synthesizerRef.current) {
      synthesizerRef.current = new GuidanceSynthesizer(landmarks);
    }
  }, [landmarks]);

  // Process location and maneuver updates
  useEffect(() => {
    if (synthesizerRef.current && currentLocation) {
      const [lng, lat] = currentLocation;
      synthesizerRef.current.synthesize(
        lat, 
        lng, 
        nextManeuver || "Continue straight", 
        maneuverCoord || null, 
        distanceToManeuver || 999,
        isTourMode
      );
    }
  }, [currentLocation, nextManeuver, distanceToManeuver, maneuverCoord, isTourMode]);

  const toggleMute = () => {
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    SpeechService.getInstance().setMuted(newMuted);
  };

  const resetSession = () => {
    synthesizerRef.current?.reset();
    SpeechService.getInstance().stop();
  };

  const repeatLastNarration = () => {
    const last = synthesizerRef.current?.getLastNarration();
    if (last) {
      SpeechService.getInstance().speak(last.text, last.type);
    }
  };

  return {
    isMuted,
    toggleMute,
    resetSession,
    repeatLastNarration,
  };
}
