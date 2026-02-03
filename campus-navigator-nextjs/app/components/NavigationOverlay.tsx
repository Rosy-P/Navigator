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
    theme = 'dark'
}: NavigationOverlayProps) {
    // We'll force a darker, glassmorphism theme to match the reference image
    const isLeft = instruction.toLowerCase().includes("left");
    const isRight = instruction.toLowerCase().includes("right");
    const isArrived = instruction.toLowerCase().includes("arrived");

    return (
        <div className="absolute inset-0 pointer-events-none z-[100] flex flex-col justify-between p-4 font-sans">
            {/* Top Direction Panel - Ultra Compact */}
            <div className="w-full max-w-[340px] mx-auto pointer-events-auto animate-in slide-in-from-top-5 duration-500">
                <div className="bg-[#1e293b]/90 backdrop-blur-md border border-white/5 rounded-[20px] shadow-[0_12px_30px_rgba(0,0,0,0.25)] overflow-hidden">
                    <div className="flex items-center p-2 gap-3">
                        {/* Icon Container - Scaled Down */}
                        <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
                            {isLeft ? (
                                <CornerUpLeft className="text-white" size={24} strokeWidth={3} />
                            ) : isRight ? (
                                <CornerUpRight className="text-white" size={24} strokeWidth={3} />
                            ) : isArrived ? (
                                <Navigation className="text-white" size={20} fill="white" />
                            ) : (
                                <ArrowUp className="text-white" size={24} strokeWidth={2.5} />
                            )}
                        </div>

                        {/* Instruction Text - Scaled Down */}
                        <div className="flex-1">
                            <h2 className="text-white text-[16px] font-bold tracking-tight leading-tight">
                                {isArrived ? "Arrived" : `${instruction} in ${distance}`}
                            </h2>
                        </div>

                        {/* Right Side Info - Hidden on arrival */}
                        {!isArrived && (
                            <div className="flex flex-col items-end pr-2 text-emerald-400 border-l border-white/10 pl-3">
                                <span className="text-[13px] font-black leading-none">{totalTime}</span>
                                <span className="text-[10px] font-bold opacity-60 mt-0.5">{totalDistance}</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Bottom Controls Panel - Ultra Compact Pill */}
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
        </div>
    );
}

function BottomControlBtn({ icon, label, onClick, active }: { icon: React.ReactNode; label: string; onClick: () => void; active?: boolean }) {
    return (
        <button
            onClick={onClick}
            className={`flex flex-col items-center justify-center w-14 h-14 rounded-2xl transition-all group ${active ? 'bg-white/10' : 'hover:bg-white/5'}`}
        >
            <div className={`mb-0.5 transition-transform group-hover:scale-105 ${active ? 'text-blue-400' : 'text-slate-300'}`}>
                {icon}
            </div>
            <span className={`text-[7px] font-black tracking-widest ${active ? 'text-blue-400' : 'text-slate-500'}`}>{label}</span>
        </button>
    );
}
