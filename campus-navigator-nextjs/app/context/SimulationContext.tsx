"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';

interface SimulationContextType {
  simulationMode: boolean;
  setSimulationMode: (value: boolean) => void;
}

const SimulationContext = createContext<SimulationContextType | undefined>(undefined);

export function SimulationProvider({ children }: { children: React.ReactNode }) {
  const [simulationMode, setSimulationModeState] = useState<boolean>(false);

  // Load from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('simulationMode');
    if (stored !== null) {
      setSimulationModeState(stored === 'true');
    }
  }, []);

  const setSimulationMode = (value: boolean) => {
    setSimulationModeState(value);
    localStorage.setItem('simulationMode', String(value));
  };

  return (
    <SimulationContext.Provider value={{ simulationMode, setSimulationMode }}>
      {children}
    </SimulationContext.Provider>
  );
}

export function useSimulation() {
  const context = useContext(SimulationContext);
  if (context === undefined) {
    throw new Error('useSimulation must be used within a SimulationProvider');
  }
  return context;
}
