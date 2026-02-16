import React from "react";
import { Zap } from "lucide-react"; // Using Zap as the logo icon for now, can be changed

export default function SplashScreen() {
  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-gradient-to-br from-orange-500 to-orange-600 text-white">
      <div className="relative flex flex-col items-center animate-in fade-in zoom-in duration-700">
        {/* Animated Logo Container */}
        <div className="mb-6 p-6 bg-white/20 backdrop-blur-sm rounded-3xl shadow-2xl ring-4 ring-white/10 animate-pulse">
            <Zap size={64} className="text-white drop-shadow-md" fill="currentColor" />
        </div>

        {/* Text Content */}
        <div className="text-center space-y-3">
          <h1 className="text-4xl md:text-5xl font-black tracking-tight drop-shadow-lg">
            MCC Campus Navigator
          </h1>
          <p className="text-lg md:text-xl font-medium text-orange-100 tracking-wide opacity-90">
            Smart Campus Navigation System
          </p>
        </div>

        {/* Loading Indicator */}
        <div className="mt-12 flex gap-2">
            <span className="w-3 h-3 bg-white rounded-full animate-bounce [animation-delay:-0.3s]"></span>
            <span className="w-3 h-3 bg-white rounded-full animate-bounce [animation-delay:-0.15s]"></span>
            <span className="w-3 h-3 bg-white rounded-full animate-bounce"></span>
        </div>
      </div>
      
      {/* Bottom version/copyright */}
      <div className="absolute bottom-8 text-orange-200 text-sm font-medium opacity-60">
        v1.0.0 • Madras Christian College
      </div>
    </div>
  );
}
