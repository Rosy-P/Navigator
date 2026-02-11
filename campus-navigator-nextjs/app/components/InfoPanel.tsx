"use client";

import { X, Navigation, Play, Bookmark, Info, ChevronLeft, MapPin, Target, Send, Zap } from "lucide-react";
import Image from "next/image";

interface Landmark {
    name: string;
    category?: string;
    address?: string;
    images?: string | string[];
    lng: number;
    lat: number;
    description?: string;
}

interface InfoPanelProps {
    landmark: Landmark;
    startLabel?: string;
    isPlanning: boolean;
    isNavigationActive?: boolean;
    originType?: "gps" | "manual" | null;

    sheetState?: "PEEK" | "HALF" | "FULL";
    onSetSheetState?: (state: "PEEK" | "HALF" | "FULL") => void;
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
    isNavigationActive,
    originType,

    sheetState = "HALF",
    onSetSheetState,
    onSetPlanning,
    onClose,
    onGetGPSLocation,
    onPickOnMap,
    onStartNavigation,
    onStartDemo
}: InfoPanelProps) {
    if (!landmark) return null;

    // Map internal state names to CSS height classes for mobile
    const hClasses = {
        PEEK: "max-md:h-[20vh]",
        HALF: "max-md:h-[50vh]",
        FULL: "max-md:h-[80vh]"
    };

    // Helper to get image URL safely, handling potential GeoJSON stringification
    const getImageUrl = (images: Landmark['images']): string | undefined => {

        if (!images) return undefined;
        if (Array.isArray(images)) return images[0];
        if (typeof images === 'string') {
            if (images.startsWith('[')) {
                try {
                    const parsed = JSON.parse(images);
                    return Array.isArray(parsed) ? parsed[0] : undefined;
                } catch (e) {
                    return undefined;
                }
            }
            return images; // Direct URL string
        }
        return undefined;
    };

    const displayImage = getImageUrl(landmark.images) || "https://images.unsplash.com/photo-1562774053-701939374585?auto=format&fit=crop&w=800&q=80";

    const secondaryImage = getImageUrl(Array.isArray(landmark.images) ? landmark.images[1] : undefined) || "https://images.unsplash.com/photo-1541339907198-e08756eaa539?auto=format&fit=crop&w=800&q=80";

    return (
        <div
            className={`
                fixed z-[60] bg-white shadow-2xl flex flex-col transition-all duration-500 ease-in-out border-slate-100
                ${/* Desktop: Fixed right sidebar - Full Height */ ""}
                md:top-0 md:right-0 md:max-w-none md:h-screen md:w-[320px] 2xl:w-[360px] md:border-l md:translate-x-0 md:inset-auto md:rounded-none
                ${/* Mobile: Bottom Sheet */ ""}
                max-md:inset-x-0 max-md:bottom-0 max-md:top-auto max-md:w-full max-md:rounded-t-2xl max-md:shadow-[0_-10px_40px_rgba(0,0,0,0.1)]
                ${hClasses[sheetState]}
                animate-in slide-in-from-bottom md:slide-in-from-right
            `}
            // On mobile, tapping the header area can toggle between half and full
            onClick={() => {
                if (window.innerWidth < 768 && onSetSheetState) {
                    // Golden Rule: In navigation, only move to FULL if manually tapped, otherwise stick to HALF
                    onSetSheetState(sheetState === "FULL" ? "HALF" : "FULL");
                }
            }}
        >
            {/* Drag Handle - Mobile Only */}
            <div className="w-full flex justify-center pt-3 pb-1 md:hidden flex-shrink-0 cursor-pointer">
                <div className="w-12 h-1.5 bg-slate-200 rounded-full" />
            </div>

            {!isPlanning ? (
                <>
                    {/* Header Image */}
                    <div className="relative h-[160px] md:h-[180px] 2xl:h-[220px] w-full overflow-hidden flex-shrink-0 bg-slate-200">
                        <Image
                            src={displayImage}
                            alt={landmark.name}
                            fill
                            className="object-cover"
                            unoptimized={displayImage.includes("unsplash.com")}
                        />

                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onClose();
                            }}
                            className="absolute top-3 right-3 w-8 h-8 2xl:w-9 2xl:h-9 bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-black/60 transition-all active:scale-90"
                        >
                            <X size={14} className="2xl:w-4 2xl:h-4" />
                        </button>
                    </div>

                    {/* Content Container */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar" onClick={(e) => e.stopPropagation()}>
                        <div className="p-4 2xl:p-6 pb-8">
                            {/* Title & Category Info */}
                            <div className="mb-4 2xl:mb-5">
                                <h2 className="text-[17px] 2xl:text-xl font-black text-[#111827] leading-tight mb-1 font-sans">{landmark.name}</h2>
                                <p className="text-[11px] 2xl:text-xs font-bold text-slate-400 uppercase tracking-tighter">
                                    {landmark.category || "Location"} • {landmark.address?.includes("Main") ? "Main Campus" : "MCC Campus"}
                                </p>
                            </div>

                            {/* Action Buttons Row */}
                            <div className="flex justify-around mb-5 2xl:mb-7 border-b border-slate-50 pb-5 2xl:pb-7">
                                <ActionButton
                                    icon={<Navigation size={16} className="fill-current 2xl:w-4 2xl:h-4" />}
                                    label="Navigate"
                                    onClick={() => onSetPlanning(true)}
                                />
                                <ActionButton
                                    icon={<Play size={16} className="fill-current 2xl:w-4 2xl:h-4" />}
                                    label="Start"
                                    onClick={() => onStartNavigation([landmark.lng, landmark.lat])}
                                />
                                <ActionButton
                                    icon={<Bookmark size={16} className="2xl:w-4 2xl:h-4" />}
                                    label="Save"
                                />
                            </div>

                            {/* About section */}
                            <div className="mb-5 2xl:mb-7">
                                <div className="flex items-center gap-2 mb-3 2xl:mb-4">
                                    <div className="w-3.5 h-3.5 2xl:w-4 2xl:h-4 bg-[#fb923c] rounded-[3px] flex items-center justify-center">
                                        <Info size={9} className="text-white fill-white" />
                                    </div>
                                    <h3 className="font-black text-slate-800 text-[11px] 2xl:text-xs uppercase tracking-widest">About</h3>
                                </div>

                                <p className="text-[12px] 2xl:text-sm text-slate-600 leading-relaxed mb-4">
                                    {landmark.description || "Premium campus facility offering state-of-the-art resources and accessibility for all students."}
                                </p>

                                <ul className="space-y-1.5 2xl:space-y-2">
                                    <AboutItem label="Departments" />
                                    <AboutItem label="Facilities" />
                                    <AboutItem label="Special notes" />
                                </ul>
                            </div>

                            {/* Photos section */}
                            <div>
                                <h3 className="font-black text-slate-800 text-[11px] 2xl:text-xs uppercase tracking-widest mb-3 2xl:mb-4">Photos</h3>
                                <div className="grid grid-cols-2 gap-2 2xl:gap-3">
                                    <div className="aspect-[4/3] relative rounded-md overflow-hidden bg-slate-100 border border-slate-50">
                                        <Image
                                            src={displayImage}
                                            alt="Building"
                                            fill
                                            className="object-cover"
                                            unoptimized={displayImage.includes("unsplash.com")}
                                        />
                                    </div>
                                    <div className="aspect-[4/3] relative rounded-md overflow-hidden bg-slate-100 border border-slate-50">
                                        <Image
                                            src={secondaryImage}
                                            alt="Campus"
                                            fill
                                            className="object-cover"
                                            unoptimized={secondaryImage.includes("unsplash.com")}
                                        />
                                    </div>
                                </div>
                            </div>

                        </div>
                    </div>
                </>
            ) : (
                <div className="flex flex-col h-full bg-white animate-in slide-in-from-right duration-300" onClick={(e) => e.stopPropagation()}>
                    {/* Plan Route Header */}
                    <div className="p-4 2xl:p-5 border-b border-slate-50 flex items-center gap-2">
                        <button
                            onClick={() => onSetPlanning(false)}
                            className="p-1.5 text-slate-400 hover:text-[#fb923c] transition-colors"
                        >
                            <ChevronLeft size={20} />
                        </button>
                        <h2 className="text-[17px] 2xl:text-xl font-black text-[#111827]">Plan Route</h2>
                    </div>

                    <div className="flex-1 p-4 2xl:p-6 space-y-4 2xl:space-y-5 overflow-y-auto custom-scrollbar">
                        {/* Starting Point Section */}
                        <div className="space-y-2.5 2xl:space-y-3">
                            <span className="text-[9px] 2xl:text-xs font-black text-slate-400 uppercase tracking-widest transition-all">From</span>

                            <button
                                onClick={onGetGPSLocation}
                                className={`w-full flex items-center gap-3 p-3 2xl:p-4 rounded-xl border transition-all group shadow-sm ${originType === "gps"
                                    ? "bg-orange-50 border-[#fb923c] ring-1 ring-[#fb923c]/20"
                                    : "bg-slate-50 border-slate-100 hover:border-[#fb923c]/20 hover:bg-white"
                                    }`}
                            >
                                <div className={`w-8 h-8 2xl:w-10 2xl:h-10 rounded-lg flex items-center justify-center group-hover:scale-105 transition-transform ${originType === "gps" ? "bg-orange-500 text-white" : "bg-blue-50 text-blue-500"
                                    }`}>
                                    <Target size={16} />
                                </div>
                                <div className="text-left">
                                    <p className={`text-[13px] 2xl:text-base font-bold leading-tight ${originType === "gps" ? "text-orange-900" : "text-slate-800"}`}>My Location</p>
                                    <p className={`text-[10px] 2xl:text-[11px] font-bold uppercase ${originType === "gps" ? "text-orange-500" : "text-slate-400"}`}>GPS</p>
                                </div>
                            </button>

                            <button
                                onClick={onPickOnMap}
                                className={`w-full flex items-center gap-3 p-3 2xl:p-4 rounded-xl border transition-all group shadow-sm ${originType === "manual"
                                    ? "bg-orange-50 border-[#fb923c] ring-1 ring-[#fb923c]/20"
                                    : "bg-slate-50 border-slate-100 hover:border-[#fb923c]/20 hover:bg-white"
                                    }`}
                            >
                                <div className={`w-8 h-8 2xl:w-10 2xl:h-10 rounded-lg flex items-center justify-center group-hover:scale-105 transition-transform ${originType === "manual" ? "bg-orange-500 text-white" : "bg-purple-50 text-purple-500"
                                    }`}>
                                    <MapPin size={16} />
                                </div>
                                <div className="text-left">
                                    <p className={`text-[13px] 2xl:text-base font-bold leading-tight ${originType === "manual" ? "text-orange-900" : "text-slate-800"}`}>Pick on Map</p>
                                    <p className={`text-[10px] 2xl:text-[11px] font-bold uppercase ${originType === "manual" ? "text-orange-500" : "text-slate-400"}`}>Manual</p>
                                </div>
                            </button>
                        </div>

                        <div className="flex justify-center py-0 opacity-10">
                            <div className="w-px h-4 2xl:h-5 bg-slate-400 border-r border-dotted" />
                        </div>

                        {/* Destination Section */}
                        <div className="space-y-2.5 2xl:space-y-3">
                            <span className="text-[9px] 2xl:text-xs font-black text-slate-400 uppercase tracking-widest transition-all">To</span>
                            <div className="flex items-center gap-3 p-3 2xl:p-4 rounded-xl bg-white border border-slate-100 shadow-sm">
                                <div className="w-8 h-8 2xl:w-10 2xl:h-10 rounded-lg bg-orange-50 flex items-center justify-center text-[#fb923c]">
                                    <MapPin size={16} fill="currentColor" />
                                </div>
                                <div className="text-left">
                                    <p className="text-[13px] 2xl:text-base font-black text-[#111827]">{landmark.name}</p>
                                    <p className="text-[10px] 2xl:text-[11px] font-bold text-slate-400 uppercase leading-tight">Selected Target</p>
                                </div>
                            </div>
                        </div>

                        {/* Origin Label Display */}
                        {startLabel && (
                            <div className="px-1 mt-4">
                                <p className="text-[10px] 2xl:text-[12px] font-bold text-slate-400">
                                    Origin: <span className="text-[#fb923c] uppercase">{startLabel}</span>
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Footer Action - Optimized for mobile to prevent collapsing */}
                    <div className="p-4 2xl:p-6 bg-white border-t border-slate-100 mt-auto flex flex-col gap-3 flex-shrink-0">
                        <button
                            onClick={() => {
                                console.log("🔘 Demo Button Clicked in InfoPanel");
                                onStartDemo();
                            }}
                            className={`w-full h-12 2xl:h-14 rounded-xl 2xl:rounded-2xl font-black text-[14px] 2xl:text-base flex items-center justify-center gap-2 transition-all active:scale-95 shadow-md border-2 bg-white text-[#3b82f6] border-[#3b82f6] hover:bg-blue-50`}
                        >
                            Demo Simulation
                            <Zap size={15} />
                        </button>
                        <button
                            disabled={!startLabel}
                            onClick={() => onStartNavigation([landmark.lng, landmark.lat])}
                            className={`w-full h-12 2xl:h-14 rounded-xl 2xl:rounded-2xl font-black text-[14px] 2xl:text-base flex items-center justify-center gap-2 transition-all active:scale-95 shadow-md ${!startLabel
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
            <div className="w-9 h-9 2xl:w-10 2xl:h-10 rounded-full border border-slate-50 flex items-center justify-center text-[#111827] bg-slate-50 group-hover:bg-[#fb923c] group-hover:text-white group-hover:border-transparent transition-all shadow-sm">
                {icon}
            </div>
            <span className="text-[9px] 2xl:text-[10px] font-black text-[#111827] uppercase tracking-tighter opacity-70 group-hover:opacity-100 group-hover:text-[#fb923c] transition-all">{label}</span>
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
