"use client";

import { Pause, Play, X, Volume2, VolumeX, Navigation, ArrowUp, CornerUpLeft, CornerUpRight } from "lucide-react";

interface NavigationOverlayProps {
    isPaused: boolean;
    isMuted: boolean;
    onPauseToggle: () => void;
    onMuteToggle: () => void;
    onEndNavigation: () => void;
    onRecenter: () => void;
    instruction?: string;
    distance?: string;
    totalDistance?: string;
    totalTime?: string;
    theme?: 'light' | 'dark';
    destination?: any;
    entrance?: any;
    navigationPhase?: "outdoor" | "indoor" | "completed";
    onStartNewNavigation?: () => void;
}

export default function NavigationOverlay({
    isPaused,
    isMuted,
    onPauseToggle,
    onMuteToggle,
    onEndNavigation,
    onRecenter,
    instruction = "Continue straight",
    distance = "60m",
    totalDistance = "110 m",
    totalTime = "2 min",
    theme = 'dark',
    destination,
    entrance,
    navigationPhase = "outdoor",
    onStartNewNavigation
}: NavigationOverlayProps) {
    // We'll force a darker, glassmorphism theme to match the reference image
    const isLeft = instruction.toLowerCase().includes("left");
    const isRight = instruction.toLowerCase().includes("right");
    
    // Parse distance to number if possible
    const distMatch = distance.match(/(\d+(?:\.\d+)?)/);
    const distValue = distMatch ? parseFloat(distMatch[1]) : 999;
    
    const isArrivedStatus = instruction.toLowerCase().includes("arrived") || distValue <= 20;

    const isClassroomArrival = destination?.type === "room" && isArrivedStatus;

    return (
        <div className="absolute inset-0 pointer-events-none z-[100] flex flex-col justify-between p-4 font-sans">
            {/* Top Direction Panel */}
            <div className="w-full max-w-[360px] mx-auto pointer-events-auto animate-in slide-in-from-top-5 duration-500">
                {isClassroomArrival ? (
                    /* CLASSROOM GUIDANCE MODE UI */
                    <div className="bg-white border text-center border-slate-200 rounded-[28px] shadow-[0_20px_50px_rgba(0,0,0,0.15)] overflow-hidden p-6 relative">
                        {/* Decorative Top Accent */}
                        <div className="absolute top-0 left-0 right-0 h-1.5 bg-orange-500" />
                        
                        <div className="w-12 h-12 bg-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                            <Navigation className="text-orange-600" size={24} fill="currentColor" />
                        </div>
                        
                        <h1 className="text-4xl font-black text-slate-900 tracking-tight leading-none mb-1">
                            {destination.name}
                        </h1>
                        <p className="text-[13px] font-black text-slate-400 uppercase tracking-widest mb-4">
                            {destination.buildingName} • {destination.floor}
                        </p>

                        <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 text-left">
                            <p className="text-[13px] font-bold text-slate-700 leading-relaxed">
                                You have reached <span className="text-orange-600">{destination.buildingName}</span>. Proceed inside to <span className="text-orange-600">{destination.floor}</span>.
                            </p>
                            <p className="text-[11px] font-bold text-slate-500 mt-2">
                                Rooms are within range {destination.rangeStart}–{destination.rangeEnd}.
                            </p>
                        </div>
                    </div>
                ) : (
                    /* STANDARD NAVIGATION UI */
                    <div className="bg-black border border-white/10 rounded-[24px] shadow-[0_15px_40px_rgba(0,0,0,0.5)] overflow-hidden">
                        <div className="flex items-center p-2 gap-3">
                            {/* Icon Container - Scaled Down */}
                            <div className="w-10 h-10 bg-orange-600 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
                                {isLeft ? (
                                    <CornerUpLeft className="text-white" size={24} strokeWidth={3} />
                                ) : isRight ? (
                                    <CornerUpRight className="text-white" size={24} strokeWidth={3} />
                                ) : isArrivedStatus ? (
                                    <Navigation className="text-white" size={20} fill="white" />
                                ) : (
                                    <ArrowUp className="text-white" size={24} strokeWidth={2.5} />
                                )}
                            </div>

                            {/* Instruction Text - Scaled Down */}
                            <div className="flex-1">
                                <h2 className="text-white text-[16px] font-bold tracking-tight leading-tight">
                                    {navigationPhase === "completed" 
                                        ? "You have arrived at your destination" 
                                        : navigationPhase === "indoor"
                                            ? `You have reached ${entrance ? entrance.name : `${destination?.buildingName} Entrance`}`
                                            : (destination?.type === "room" 
                                                ? `Navigating to ${entrance ? entrance.name : `${destination.buildingName} Entrance`}` 
                                                : `${instruction} in ${distance}`)}
                                </h2>
                            </div>

                            {/* Right Side Info - Hidden on arrival */}
                            {navigationPhase === "outdoor" && !isArrivedStatus && (
                                <div className="flex flex-col items-end pr-2 text-emerald-400 border-l border-white/10 pl-3">
                                    <span className="text-[13px] font-black leading-none">{totalTime}</span>
                                    <span className="text-[10px] font-bold opacity-60 mt-0.5">{totalDistance}</span>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Bottom Controls Panel - Ultra Compact Pill */}
            {navigationPhase === "outdoor" && (
                <div className="w-full max-w-[280px] mx-auto pointer-events-auto animate-in slide-in-from-bottom-5 duration-500 mb-2">
                    <div className="bg-[#1e293b]/90 backdrop-blur-md border border-white/5 rounded-full shadow-[0_12px_35px_rgba(0,0,0,0.3)] px-2 py-1">
                    <div className="flex items-center justify-between gap-0.5">
                        <BottomControlBtn
                            onClick={onPauseToggle}
                            icon={isPaused ? <Play size={18} fill="white" /> : <Pause size={18} fill="white" />}
                            label={isPaused ? "GO" : "PAUSE"}
                        />
                        <BottomControlBtn
                            onClick={onMuteToggle}
                            icon={isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
                            label="MUTE"
                            active={isMuted}
                        />
                        <BottomControlBtn
                            onClick={onRecenter}
                            icon={<Navigation size={18} className="rotate-45" />}
                            label="MAP"
                        />

                        {/* End Button - Compact Circle */}
                        <button
                            onClick={onEndNavigation}
                            className="flex flex-col items-center justify-center w-12 h-14 bg-red-500/10 hover:bg-red-500/20 rounded-2xl border border-red-500/20 transition-all group"
                        >
                            <div className="bg-red-500 w-8 h-8 rounded-lg flex items-center justify-center mb-0.5 group-hover:scale-105 transition-transform">
                                <X className="text-white" size={16} strokeWidth={3.5} />
                            </div>
                            <span className="text-red-600 text-[8px] font-black tracking-widest">END</span>
                        </button>
                    </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function BottomControlBtn({ icon, label, onClick, active }: { icon: React.ReactNode; label: string; onClick: () => void; active?: boolean }) {
    return (
        <button
            onClick={onClick}
            className={`flex flex-col items-center justify-center w-14 h-14 rounded-2xl transition-all group ${active ? 'bg-white/10' : 'hover:bg-white/5'}`}
        >
            <div className={`mb-0.5 transition-transform group-hover:scale-105 ${active ? 'text-orange-400' : 'text-slate-300'}`}>
                {icon}
            </div>
            <span className={`text-[7px] font-black tracking-widest ${active ? 'text-orange-400' : 'text-slate-500'}`}>{label}</span>
        </button>
    );
}
