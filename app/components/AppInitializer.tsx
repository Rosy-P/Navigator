"use client";

import React, { useState, useEffect } from "react";
import SplashScreen from "./SplashScreen";

export default function AppInitializer({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isLoading, setIsLoading] = useState(true);
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    // Artificial minimum load time for splash screen
    const timer = setTimeout(() => {
      setIsLoading(false);
      
      // Allow fade out animation to complete before unmounting
      setTimeout(() => {
        setShowSplash(false);
      }, 500); // Matches transition duration
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      {showSplash && (
        <div 
          className={`fixed inset-0 z-[9999] transition-opacity duration-500 ease-in-out pointer-events-none ${
            isLoading ? "opacity-100" : "opacity-0"
          }`}
        >
          <SplashScreen />
        </div>
      )}
      {children}
    </>
  );
}
