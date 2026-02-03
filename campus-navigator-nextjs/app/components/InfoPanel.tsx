"use client";

import { useState } from "react";
import { X, Navigation, Play, Bookmark, Info, ChevronLeft, MapPin, Target, Send, Zap } from "lucide-react";

interface InfoPanelProps {
    landmark: any;
    startLabel?: string;
    isPlanning: boolean;
    originType?: "gps" | "manual" | null;
    onSetPlanning: (planning: boolean) => void;
    onClose: () => void;
    onGetGPSLocation: () => void;
    onPickOnMap: () => void;
    onStartNavigation: (coord: [number, number]) => void;
    onStartDemo: () => void;
}

export default function InfoPanel({
    landmark,
    startLabel = "Current Location",
    isPlanning,
    originType,
    onSetPlanning,
    onClose,
    onGetGPSLocation,
    onPickOnMap,
    onStartNavigation,
    onStartDemo
}: InfoPanelProps) {
    if (!landmark) return null;

    return (
        <div className="fixed top-0 right-0 h-screen w-[320px] bg-white shadow-2xl z-[60] flex flex-col animate-in slide-in-from-right duration-500 ease-out border-l border-slate-100">
            {/* ... previous code remains same up to planning mode ... */}
            {!isPlanning ? (
                <>
                    {/* Header Image */}
                    <div className="relative h-[180px] w-full overflow-hidden flex-shrink-0 bg-slate-200">
                        <img
                            src={landmark.images?.[0] || "https://images.unsplash.com/photo-1562774053-701939374585?auto=format&fit=crop&w=800&q=80"}
                            alt={landmark.name}
                            className="w-full h-full object-cover"
                        />
                        <button
                            onClick={onClose}
                            className="absolute top-3 right-3 w-8 h-8 bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-black/60 transition-all active:scale-90"
                        >
                            <X size={14} />
                        </button>
                    </div>

                    {/* Content Container */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                        <div className="p-4 pb-8">
                            {/* Title & Category Info */}
                            <div className="mb-4">
                                <h2 className="text-[17px] font-black text-[#111827] leading-tight mb-1">{landmark.name}</h2>
                                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-tighter">
                                    {landmark.category || "Location"} • {landmark.address?.includes("Main") ? "Main Campus" : "MCC Campus"}
                                </p>
                            </div>

                            {/* Action Buttons Row */}
                            <div className="flex justify-around mb-5 border-b border-slate-50 pb-5">
                                <ActionButton
                                    icon={<Navigation size={16} className="fill-current" />}
                                    label="Navigate"
                                    onClick={() => onSetPlanning(true)}
                                />
                                <ActionButton
                                    icon={<Play size={16} className="fill-current" />}
                                    label="Start"
                                />
                                <ActionButton
                                    icon={<Bookmark size={16} />}
                                    label="Save"
                                />
                            </div>

                            {/* About section */}
                            <div className="mb-5">
                                <div className="flex items-center gap-2 mb-3">
                                    <div className="w-3.5 h-3.5 bg-[#fb923c] rounded-[3px] flex items-center justify-center">
                                        <Info size={9} className="text-white fill-white" />
                                    </div>
                                    <h3 className="font-black text-slate-800 text-[11px] uppercase tracking-widest">About</h3>
                                </div>

                                <ul className="space-y-1.5">
                                    <AboutItem label="Departments" />
                                    <AboutItem label="Facilities" />
                                    <AboutItem label="Special notes" />
                                </ul>
                            </div>

                            {/* Photos section */}
                            <div>
                                <h3 className="font-black text-slate-800 text-[11px] uppercase tracking-widest mb-3">Photos</h3>
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="aspect-[4/3] rounded-md overflow-hidden bg-slate-100 border border-slate-50">
                                        <img src={landmark.images?.[0] || "https://images.unsplash.com/photo-1562774053-701939374585?auto=format&fit=crop&w=400&q=80"} className="w-full h-full object-cover" alt="Building" />
                                    </div>
                                    <div className="aspect-[4/3] rounded-md overflow-hidden bg-slate-100 border border-slate-50">
                                        <img src={landmark.images?.[1] || "https://images.unsplash.com/photo-1541339907198-e08756eaa539?auto=format&fit=crop&w=400&q=80"} className="w-full h-full object-cover" alt="Campus" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            ) : (
                <div className="flex flex-col h-full bg-white animate-in slide-in-from-right duration-300">
                    {/* Plan Route Header */}
                    <div className="p-4 border-b border-slate-50 flex items-center gap-2">
                        <button
                            onClick={() => onSetPlanning(false)}
                            className="p-1.5 text-slate-400 hover:text-[#fb923c] transition-colors"
                        >
                            <ChevronLeft size={20} />
                        </button>
                        <h2 className="text-[17px] font-black text-[#111827]">Plan Route</h2>
                    </div>

                    <div className="flex-1 p-4 space-y-4 overflow-y-auto">
                        {/* Starting Point Section */}
                        <div className="space-y-2.5">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">From</span>

                            <button
                                onClick={onGetGPSLocation}
                                className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all group shadow-sm ${originType === "gps"
                                    ? "bg-orange-50 border-[#fb923c] ring-1 ring-[#fb923c]/20"
                                    : "bg-slate-50 border-slate-100 hover:border-[#fb923c]/20 hover:bg-white"
                                    }`}
                            >
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center group-hover:scale-105 transition-transform ${originType === "gps" ? "bg-orange-500 text-white" : "bg-blue-50 text-blue-500"
                                    }`}>
                                    <Target size={16} />
                                </div>
                                <div className="text-left">
                                    <p className={`text-[13px] font-bold leading-tight ${originType === "gps" ? "text-orange-900" : "text-slate-800"}`}>My Location</p>
                                    <p className={`text-[10px] font-bold uppercase ${originType === "gps" ? "text-orange-500" : "text-slate-400"}`}>GPS</p>
                                </div>
                            </button>

                            <button
                                onClick={onPickOnMap}
                                className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all group shadow-sm ${originType === "manual"
                                    ? "bg-orange-50 border-[#fb923c] ring-1 ring-[#fb923c]/20"
                                    : "bg-slate-50 border-slate-100 hover:border-[#fb923c]/20 hover:bg-white"
                                    }`}
                            >
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center group-hover:scale-105 transition-transform ${originType === "manual" ? "bg-orange-500 text-white" : "bg-purple-50 text-purple-500"
                                    }`}>
                                    <MapPin size={16} />
                                </div>
                                <div className="text-left">
                                    <p className={`text-[13px] font-bold leading-tight ${originType === "manual" ? "text-orange-900" : "text-slate-800"}`}>Pick on Map</p>
                                    <p className={`text-[10px] font-bold uppercase ${originType === "manual" ? "text-orange-500" : "text-slate-400"}`}>Manual</p>
                                </div>
                            </button>
                        </div>

                        <div className="flex justify-center py-0 opacity-10">
                            <div className="w-px h-4 bg-slate-400 border-r border-dotted" />
                        </div>

                        {/* Destination Section */}
                        <div className="space-y-2.5">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">To</span>
                            <div className="flex items-center gap-3 p-3 rounded-xl bg-white border border-slate-100 shadow-sm">
                                <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center text-[#fb923c]">
                                    <MapPin size={16} fill="currentColor" />
                                </div>
                                <div className="text-left">
                                    <p className="text-[13px] font-black text-[#111827]">{landmark.name}</p>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase leading-tight">Selected Target</p>
                                </div>
                            </div>
                        </div>

                        {/* Origin Label Display */}
                        {startLabel && (
                            <div className="px-1 mt-4">
                                <p className="text-[10px] font-bold text-slate-400">
                                    Origin: <span className="text-[#fb923c] uppercase">{startLabel}</span>
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Footer Action */}
                    <div className="p-4 bg-white border-t border-slate-50 mt-auto flex flex-col gap-2">
                        <button
                            disabled={!startLabel}
                            onClick={onStartDemo}
                            className={`w-full h-11 rounded-xl font-black text-[14px] flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg border-2 ${!startLabel
                                ? "bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed"
                                : "bg-white text-[#3b82f6] border-[#3b82f6] hover:bg-blue-50"
                                }`}
                        >
                            Demo Simulation
                            <Zap size={15} />
                        </button>
                        <button
                            disabled={!startLabel}
                            onClick={() => onStartNavigation([landmark.lng, landmark.lat])}
                            className={`w-full h-11 rounded-xl font-black text-[14px] flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg ${!startLabel
                                ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                                : "bg-[#111827] text-white hover:bg-[#fb923c]"
                                }`}
                        >
                            Start Navigation
                            <Send size={15} fill="white" className="rotate-[-45deg] -mt-0.5" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

function ActionButton({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick?: () => void }) {
    return (
        <button
            onClick={onClick}
            className="flex flex-col items-center gap-1.5 group active:scale-95 transition-transform"
        >
            <div className="w-9 h-9 rounded-full border border-slate-50 flex items-center justify-center text-[#111827] bg-slate-50 group-hover:bg-[#fb923c] group-hover:text-white group-hover:border-transparent transition-all shadow-sm">
                {icon}
            </div>
            <span className="text-[9px] font-black text-[#111827] uppercase tracking-tighter opacity-70 group-hover:opacity-100 group-hover:text-[#fb923c] transition-all">{label}</span>
        </button>
    );
}

function AboutItem({ label }: { label: string }) {
    return (
        <li className="flex items-center gap-2 border-b border-slate-50 pb-1.5 last:border-0">
            <div className="w-0.5 h-0.5 bg-[#fb923c] rounded-full opacity-40" />
            <span className="text-[11px] font-bold text-slate-500">{label}</span>
        </li>
    );
}
