import { useState, useEffect, useRef } from 'react';

interface GeolocationState {
  coords: [number, number] | null;
  error: string | null;
  loading: boolean;
}

export function useGeolocation(enabled: boolean = false) {
  const [state, setState] = useState<GeolocationState>({
    coords: null,
    error: null,
    loading: false,
  });

  const watchId = useRef<number | null>(null);
  const lastCoords = useRef<[number, number] | null>(null);

  useEffect(() => {
    if (!enabled) {
      if (watchId.current !== null) {
        navigator.geolocation.clearWatch(watchId.current);
        watchId.current = null;
      }
      return;
    }

    setState(prev => ({ ...prev, loading: true }));

    if (!navigator.geolocation) {
      setState({
        coords: null,
        error: "Geolocation is not supported by your browser",
        loading: false,
      });
      return;
    }

    watchId.current = navigator.geolocation.watchPosition(
      (position) => {
        const { longitude, latitude, accuracy } = position.coords;
        const newCoords: [number, number] = [longitude, latitude];

        // Basic smoothing: Only update if moved more than ~2-3 meters 
        // Or if it's the first fix
        if (!lastCoords.current) {
          lastCoords.current = newCoords;
          setState({ coords: newCoords, error: null, loading: false });
          return;
        }

        const distMoved = calculateDistance(lastCoords.current, newCoords);
        
        // 2 meter threshold to reduce jitter
        if (distMoved > 2) {
          lastCoords.current = newCoords;
          setState({ coords: newCoords, error: null, loading: false });
        }
      },
      (error) => {
        setState({
          coords: null,
          error: error.message,
          loading: false,
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );

    return () => {
      if (watchId.current !== null) {
        navigator.geolocation.clearWatch(watchId.current);
      }
    };
  }, [enabled]);

  return state;
}

// Helper for distance check (Haversine)
function calculateDistance(coord1: [number, number], coord2: [number, number]): number {
  const R = 6371e3; // metres
  const φ1 = (coord1[1] * Math.PI) / 180;
  const φ2 = (coord2[1] * Math.PI) / 180;
  const Δφ = ((coord2[1] - coord1[1]) * Math.PI) / 180;
  const Δλ = ((coord2[0] - coord1[0]) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // in metres
}
