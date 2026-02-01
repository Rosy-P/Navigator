"use client";

import { Search, Map as MapIcon, Home, Microscope, UtensilsCrossed, Mic } from "lucide-react";
import Sidebar from "./components/Sidebar";
import MapView from "./components/MapView";
import MapControls from "./components/MapControls";
import { useState } from "react";

export default function HomePage() {
  return (
    <div className="h-screen w-screen relative flex overflow-hidden bg-white">
      {/* Sidebar - Now floats over the map */}
      <Sidebar />

      {/* Main Content Area - Full width (No margin) */}
      <main className="flex-1 relative transition-all duration-300 overflow-hidden">
        {/* The Map */}
        <div className="absolute inset-0 z-0">
          <MapView />
        </div>

        {/* 
            PREMIUM SEARCH BAR 
        */}
        <div className="absolute top-8 left-1/2 -translate-x-1/2 z-30 w-full max-w-lg px-4">
          <div className="flex items-center gap-2 p-1.5 bg-white/40 backdrop-blur-xl border border-white/60 rounded-[24px] shadow-[0_25px_60px_rgba(0,0,0,0.12)] transition-all hover:bg-white/60 group">

            <div className="flex-1 flex items-center gap-3 pl-4 pr-1 bg-white rounded-[20px] h-12 shadow-sm border border-slate-100 group-hover:border-slate-200 transition-all focus-within:border-orange-200 focus-within:ring-2 focus-within:ring-orange-500/5">
              <Search className="text-slate-400 group-focus-within:text-orange-500 transition-colors" size={18} />
              <input
                className="w-full bg-transparent outline-none text-[14.5px] text-slate-900 placeholder:text-slate-400 font-semibold"
                placeholder="Search campus..."
              />
              <button className="px-3 py-2 text-slate-300 hover:text-slate-600 transition-colors">
                <Mic size={18} />
              </button>
            </div>

            <button className="flex items-center justify-center w-12 h-12 bg-[#111827] text-white rounded-[20px] hover:bg-slate-800 transition-all shadow-lg active:scale-95 group/btn">
              <MapIcon size={18} className="group-hover/btn:scale-110 transition-transform" />
            </button>
          </div>
        </div>

        {/* Custom Map Controls */}
        <div className="absolute bottom-8 right-8 z-30 scale-90">
          <MapControls
            onZoomIn={() => { }}
            onZoomOut={() => { }}
          />
        </div>

        {/* Right Side Action Buttons */}
        <div className="absolute top-10 right-8 z-30 flex flex-col gap-3">
          <QuickActionButton icon={<Home size={18} />} label="Hostel" />
          <QuickActionButton icon={<Microscope size={18} />} label="Lab" />
          <QuickActionButton icon={<UtensilsCrossed size={18} />} label="Canteen" />
        </div>
      </main>
    </div>
  );
}

function QuickActionButton({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <button className="flex items-center gap-3 px-4 h-11 bg-white/90 backdrop-blur-md border border-white/50 shadow-[0_10px_35px_rgba(0,0,0,0.05)] rounded-xl font-bold text-slate-800 hover:bg-white transition-all group active:scale-95">
      <div className="w-8 h-8 flex items-center justify-center bg-slate-50 rounded-lg text-orange-500 group-hover:bg-orange-50 transition-colors">
        {icon}
      </div>
      <span className="text-[13px] tracking-tight">{label}</span>
    </button>
  );
}
