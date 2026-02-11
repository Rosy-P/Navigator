/**
 * app/hooks/useVoiceNavigation.ts
 * STRICT ARCHITECTURE:
 * 1. Route Navigation (Audio Only, High Priority) - Handled directly here.
 * 2. Landmark Narration (Audio + Subtitle, Interruptible) - Handled by GuidanceSynthesizer.
 */
import { useEffect, useRef, useState } from 'react';
import { GuidanceSynthesizer, Landmark } from '../lib/navigation/GuidanceSynthesizer';
import { LandmarkNavigator } from '../lib/navigation/LandmarkNavigator';
import { SpeechService } from '@/app/lib/speech/SpeechService';

interface VoiceNavOptions {
  currentLocation: [number, number] | null;
  nextManeuver?: string;
  maneuverCoord?: [number, number] | null;
  distanceToManeuver?: number;
  isTourMode?: boolean;
  isGuidanceActive?: boolean;
  isDemoMode?: boolean;
  isVirtualTourRunning?: boolean; // Master control flag for landmark narration
}

export function useVoiceNavigation(landmarks: Landmark[], options: VoiceNavOptions) {
  const { currentLocation, nextManeuver, maneuverCoord, distanceToManeuver, isTourMode, isGuidanceActive, isDemoMode, isVirtualTourRunning = false } = options;
  const [isMuted, setIsMuted] = useState(false);
  const [subtitle, setSubtitle] = useState<string | null>(null);
  const synthesizerRef = useRef<GuidanceSynthesizer | null>(null);
  const landmarkNavRef = useRef<LandmarkNavigator | null>(null);
  
  // Navigation State
  const lastSpokenManeuverKey = useRef<string>("");

  // Initialize synthesizer (Tour Mode - Landmarks Only)
  useEffect(() => {
    if (landmarks.length > 0 && !synthesizerRef.current) {
      synthesizerRef.current = new GuidanceSynthesizer(landmarks);
    }
  }, [landmarks]);

  // Initialize LandmarkNavigator (Navigation Mode - Contextual Prompts)
  useEffect(() => {
    if (landmarks.length > 0 && !landmarkNavRef.current) {
      landmarkNavRef.current = new LandmarkNavigator(landmarks);
    }
  }, [landmarks]);

  // Global Subtitle Synchronization
  useEffect(() => {
    const speech = SpeechService.getInstance();
    speech.setSubtitleCallback((text) => setSubtitle(text));
    return () => speech.setSubtitleCallback(() => {});
  }, []);

  // MAIN LOOP: 1. Navigation (High Pri) -> 2. Landmarks (Low Pri)
  useEffect(() => {
    if (!currentLocation) return;
    const speech = SpeechService.getInstance();

    // --- SYSTEM 1: ROUTE NAVIGATION (Audio Only, Absolute Priority) ---
    // Should NEVER depend on GuidanceSynthesizer or be delayed.
    // Enabled for both Guidance (Nav Mode) and Tour Mode (if route data is available)
    if ((isGuidanceActive || isTourMode) && nextManeuver && maneuverCoord && distanceToManeuver !== undefined) {
        
        // Unique key for this specific maneuver instance
        const maneuverKey = `${nextManeuver}-${maneuverCoord[0]}-${maneuverCoord[1]}`;
        
        /* 
           Logic:
           1. Approach instruction (25-35m)
           2. Arrival instruction (<10m)
        */
        let textToSpeak = "";
        
        // Arrival
        if (nextManeuver === "You have arrived" && distanceToManeuver < 15) {
             if (lastSpokenManeuverKey.current !== "arrival") {
                 textToSpeak = "You have arrived at your destination.";
                 lastSpokenManeuverKey.current = "arrival";
             }
        } 
        // 1. Try Contextual Landmark Prompt (Navigation Mode only)
        // High priority - can trigger at any distance if a landmark is near
        else if (isGuidanceActive && !isTourMode && landmarkNavRef.current) {
            const contextualPrompt = landmarkNavRef.current.generateContextualPrompt(
                currentLocation,
                nextManeuver,
                distanceToManeuver
            );
            
            if (contextualPrompt) {
                textToSpeak = contextualPrompt;
                // Mark this maneuver phase as spoken if we are close to a turn
                if (distanceToManeuver < 35 && nextManeuver !== "Continue straight") {
                    const isClose = distanceToManeuver < 12;
                    const phase = isClose ? "EXECUTE" : "PREPARE";
                    lastSpokenManeuverKey.current = `${maneuverKey}-${phase}`;
                }
            }
        }
        
        // 2. Fallback to standard turn prompts
        if (!textToSpeak && distanceToManeuver < 35 && nextManeuver !== "Continue straight") {
            const isClose = distanceToManeuver < 12;
            const phase = isClose ? "EXECUTE" : "PREPARE";
            const phaseKey = `${maneuverKey}-${phase}`;
            
            if (lastSpokenManeuverKey.current !== phaseKey) {
                if (phase === "EXECUTE") {
                     textToSpeak = `${nextManeuver} now.`;
                } else if (phase === "PREPARE" && distanceToManeuver > 20) {
                     textToSpeak = `${nextManeuver} in 25 meters.`;
                }
                
                if (textToSpeak) {
                    lastSpokenManeuverKey.current = phaseKey;
                }
            }
        }

        // FIRE NAVIGATION PROMPT (High Priority)
        if (textToSpeak) {
            speech.speak(textToSpeak, 'NAV'); 
            return; // Exit immediately to ensure priority
        }
    }

    // --- SYSTEM 2: LANDMARK NARRATION (Audio + Subtitle, Lower Priority) ---
    // STRICT MASTER CONTROL: Disabled unless Virtual Tour is explicitly running
    // STRICT ISOLATION: Disabled completely if in Navigation Demo Mode
    const isNavDemo = isDemoMode && isGuidanceActive;
    
    if (synthesizerRef.current && isVirtualTourRunning && !isNavDemo) {
        const [lng, lat] = currentLocation;
        
        // Synthesize checks for "Busy NAV" internally and returns null if blocked
        const result = synthesizerRef.current.synthesize(
            lat, 
            lng, 
            !!isTourMode
        );

        if (result) {
            // Note: synthesizer already checked priorities, so if we get a result,
            // it means we are clear to speak (or queue it up).
            speech.speak(result.text, 'TOUR');
        }
    }

  }, [currentLocation, nextManeuver, distanceToManeuver, maneuverCoord, isTourMode, isGuidanceActive, isDemoMode, isVirtualTourRunning]);

  const toggleMute = () => {
    const next = !isMuted;
    setIsMuted(next);
    SpeechService.getInstance().setMuted(next);
  };

  const resetSession = () => {
    synthesizerRef.current?.reset();
    landmarkNavRef.current?.reset();
    SpeechService.getInstance().stop();
    lastSpokenManeuverKey.current = "";
  };

  const repeatLastNarration = () => {
    const speech = SpeechService.getInstance();
    const last = speech.getLastSpokenText();
    const lastType = speech.getCurrentType();
    
    // Only repeat landmarks, confusing to repeat old turn prompts
    if (last && lastType === 'TOUR') {
      speech.speak(last, 'TOUR');
    }
  };

  return {
    isMuted,
    subtitle,
    toggleMute,
    setMuted: (muted: boolean) => {
      setIsMuted(muted);
      SpeechService.getInstance().setMuted(muted);
    },
    resetSession,
    repeatLastNarration,
  };
}
