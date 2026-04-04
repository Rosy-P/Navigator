"use client";

import { X, Navigation, Play, Bookmark, Info, ChevronLeft, MapPin, Target, Send, Zap, Check, AlertCircle, Loader2 } from "lucide-react";
import Image from "next/image";
import { useState, useEffect } from "react";
import { Landmark } from "../lib/navigation/GuidanceSynthesizer";
import { Building, Entrance } from "./MapView";
import { Room } from "../page";

// Using Landmark from GuidanceSynthesizer.ts

interface InfoPanelProps {
    landmark: Landmark | Building | Room | any;
    destination?: Landmark | Building | Room | any; 
    entrance?: Entrance | any;
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
    simulationMode?: boolean;
    theme?: "light" | "dark";
    navigationPhase?: "outdoor" | "indoor" | "completed";
    savedLocations?: any[];
    onSavedStatusChange?: () => void;
}

export default function InfoPanel({
    landmark: destination, // Renaming for internal clarity
    entrance,
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
    onStartDemo,
    simulationMode = false,
    theme = "light",
    navigationPhase = "outdoor",
    savedLocations = [],
    onSavedStatusChange
}: InfoPanelProps) {
    const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error" | "exists">("idle");
    const [errorMessage, setErrorMessage] = useState("");
    const [touchStartY, setTouchStartY] = useState<number | null>(null);

    const handleTouchStart = (e: React.TouchEvent) => {
        setTouchStartY(e.touches[0].clientY);
    };

    const handleTouchEnd = (e: React.TouchEvent) => {
        if (!touchStartY || !onSetSheetState) return;
        
        const touchEndY = e.changedTouches[0].clientY;
        const deltaY = touchEndY - touchStartY;
        const threshold = 50; // Minimum drag distance to trigger state change

        if (Math.abs(deltaY) > threshold) {
            if (deltaY > 0) {
                // Swiped Down - Minimize
                if (sheetState === "FULL") onSetSheetState("HALF");
                else if (sheetState === "HALF") onSetSheetState("PEEK");
            } else {
                // Swiped Up - Expand
                if (sheetState === "PEEK") onSetSheetState("HALF");
                else if (sheetState === "HALF") onSetSheetState("FULL");
            }
        }
        setTouchStartY(null);
    };

    // Sync saveStatus with savedLocations list
    useEffect(() => {
        if (!destination) return;
        
        const isAlreadySaved = savedLocations.some(loc => 
            loc.name === destination.name && 
            Math.abs(parseFloat(loc.latitude) - destination.lat) < 0.0001 && 
            Math.abs(parseFloat(loc.longitude) - destination.lng) < 0.0001
        );

        if (isAlreadySaved) {
            setSaveStatus("exists");
        } else {
            setSaveStatus("idle");
        }
    }, [destination, savedLocations]);

    if (!destination) return null;

    const handleSave = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (saveStatus === "saving" || saveStatus === "saved" || saveStatus === "exists") return;

        setSaveStatus("saving");
        setErrorMessage("");

        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/save_location.php`, {
                method: "POST",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    name: destination.name,
                    image: displayImage,
                    block: destination.buildingName || destination.block || "",
                    floor: destination.floor || "",
                    latitude: destination.lat,
                    longitude: destination.lng
                }),
            });

            const result = await response.json();

            if (result.status === "success") {
                setSaveStatus("saved");
                if (onSavedStatusChange) onSavedStatusChange();
            } else if (result.message === "Location already saved") {
                setSaveStatus("exists");
                if (onSavedStatusChange) onSavedStatusChange();
            } else {
                setSaveStatus("error");
                setErrorMessage(result.message || "Failed to save location");
            }
        } catch (error) {
            console.error("Save error:", error);
            setSaveStatus("error");
            setErrorMessage("Network error. Please check if backend is running.");
        }
    };

    // Map internal state names to CSS height classes for mobile
    const hClasses = {
        PEEK: "max-md:h-[20vh]",
        HALF: "max-md:h-[50vh]",
        FULL: "max-md:h-[94vh]"
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

    const displayImage = getImageUrl(destination.images) || destination.image || "/images/main building.webp";

    const secondaryImage = getImageUrl(Array.isArray(destination.images) ? destination.images[1] : undefined) || "/images/maingate.webp";

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
            <div 
                className="relative w-full flex justify-center pt-3 pb-2 md:hidden flex-shrink-0 cursor-pointer border-b border-slate-50/50"
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
            >
                <div className="w-12 h-1.5 bg-slate-200 rounded-full" />
                
                {/* Secondary Close Button for Mobile (Top Right of Sheet) */}
                {!isPlanning && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onClose();
                        }}
                        className="absolute right-4 top-1/2 -translate-y-1/2 w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 md:hidden active:scale-90 transition-transform"
                    >
                        <X size={16} />
                    </button>
                )}
            </div>

            {navigationPhase === "indoor" && destination.type === "room" ? (
                <div className="p-6 bg-white flex flex-col items-center text-center h-full">
                    {/* Decorative Top Accent for Indoor */}
                    <div className="absolute top-0 left-0 right-0 h-1.5 bg-orange-500" />
                    
                    <div className="w-14 h-14 bg-orange-100 rounded-3xl flex items-center justify-center mx-auto mb-4 mt-2">
                        <Navigation className="text-orange-600" size={28} fill="currentColor" />
                    </div>
                    
                    <h1 className="text-[40px] font-black text-slate-900 tracking-tight leading-none mb-1">
                        {destination.name}
                    </h1>
                    <p className="text-[14px] font-black text-slate-400 uppercase tracking-widest mb-6">
                        {destination.buildingName} • {destination.floor}
                    </p>

                    <div className="bg-slate-50 border border-slate-100 rounded-[20px] p-5 w-full text-left">
                        <p className="text-[14px] font-bold text-slate-700 leading-relaxed mb-1">
                            Proceed inside to <span className="text-orange-600">{destination.floor || "the designated floor"}</span>.
                        </p>
                        <p className="text-[12px] font-bold text-slate-500">
                            Rooms are located within <span className="text-orange-600">{destination.rangeStart}–{destination.rangeEnd}</span>.
                        </p>
                    </div>

                    <button
                        onClick={onClose}
                        className="mt-8 w-full h-14 bg-[#111827] text-white font-black text-[15px] rounded-2xl shadow-xl hover:bg-[#1f2937] transition-all active:scale-95 border border-white/10"
                    >
                        End Navigation
                    </button>
                </div>
            ) : !isPlanning ? (
                <>
                    {/* Content Container */}
                    <div 
                        className="flex-1 overflow-y-auto custom-scrollbar" 
                        onClick={(e) => e.stopPropagation()}
                        onScroll={(e) => {
                            if (window.innerWidth < 768 && onSetSheetState && sheetState === "HALF") {
                                const target = e.currentTarget;
                                if (target.scrollTop > 10) {
                                    onSetSheetState("FULL");
                                }
                            }
                        }}
                    >
                        {/* Header Image - Now inside scrollable area for mobile */}
                        <div className="relative h-[200px] md:h-[180px] 2xl:h-[220px] w-full overflow-hidden flex-shrink-0 bg-slate-200">
                            <Image
                                src={displayImage}
                                alt={destination.name}
                                fill
                                className="object-cover"
                                unoptimized={displayImage.includes("unsplash.com")}
                                priority
                            />

                            {/* Desktop/Default Close Button (Inside Image) */}
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onClose();
                                }}
                                className="absolute top-3 right-3 w-8 h-8 2xl:w-9 2xl:h-9 bg-black/40 backdrop-blur-md rounded-full items-center justify-center text-white hover:bg-black/60 transition-all active:scale-90 hidden md:flex"
                            >
                                <X size={14} className="2xl:w-4 2xl:h-4" />
                            </button>
                        </div>
                        <div className="p-4 2xl:p-6 pb-8">
                            {/* Title & Category Info */}
                             <div className="mb-4 2xl:mb-5">
                                {destination.type === "room" ? (
                                    <>
                                        <h2 className="text-3xl 2xl:text-4xl font-black text-[#111827] leading-tight mb-1 font-sans dark:text-white">
                                            {destination.name}
                                        </h2>
                                        <p className="text-[14px] 2xl:text-base font-bold text-slate-700 leading-tight mb-0.5 dark:text-slate-300">
                                            {destination.buildingName || "Building"}
                                        </p>
                                        <p className="text-[11px] 2xl:text-xs font-bold text-slate-400 uppercase tracking-tighter">
                                            {destination.floor}
                                        </p>
                                    </>
                                ) : destination.type === "building" ? (
                                    <>
                                        <h2 className="text-[17px] 2xl:text-xl font-black text-[#111827] leading-tight mb-1 font-sans">{destination.name}</h2>
                                        <p className="text-[11px] 2xl:text-xs font-bold text-slate-400 uppercase tracking-tighter">
                                            Major Campus Block • Built for Excellence
                                        </p>
                                    </>
                                ) : (
                                    <>
                                        <h2 className="text-[17px] 2xl:text-xl font-black text-[#111827] leading-tight mb-1 font-sans">{destination.name}</h2>
                                        <p className="text-[11px] 2xl:text-xs font-bold text-slate-400 uppercase tracking-tighter">
                                            {destination.category || "Landmark"} • {destination.address?.includes("Main") ? "Main Campus" : "MCC Campus"}
                                        </p>
                                    </>
                                )}
                            </div>

                             {/* Action Buttons Row - Modern Rectangular Style */}
                             <div className="grid grid-cols-2 gap-3 mb-5 2xl:mb-7 border-b border-slate-50 pb-5 2xl:pb-7">
                                <ActionButton
                                    icon={<Navigation size={18} className="fill-current" />}
                                    label="Navigate"
                                    onClick={() => onSetPlanning(true)}
                                    variant="neutral"
                                />
                                <ActionButton
                                    icon={
                                        saveStatus === "saving" ? <Loader2 size={18} className="animate-spin" /> :
                                        saveStatus === "saved" ? <Check size={18} strokeWidth={3} /> :
                                        saveStatus === "exists" ? <Bookmark size={18} fill="currentColor" /> :
                                        saveStatus === "error" ? <AlertCircle size={18} /> :
                                        <Bookmark size={18} strokeWidth={2.5} />
                                    }
                                    label={
                                        saveStatus === "saving" ? "Saving..." :
                                        saveStatus === "saved" ? "Saved" :
                                        saveStatus === "exists" ? "Saved" :
                                        saveStatus === "error" ? "Retry" :
                                        "Save"
                                    }
                                    onClick={handleSave}
                                    disabled={saveStatus === "saving" || saveStatus === "saved" || saveStatus === "exists"}
                                    variant={
                                        saveStatus === "saved" ? "success" :
                                        saveStatus === "exists" ? "info" :
                                        saveStatus === "error" ? "danger" :
                                        "primary"
                                    }
                                />
                            </div>

                            {saveStatus === "error" && (
                                <p className="text-[10px] text-red-500 font-bold mb-4 text-center animate-pulse">
                                    {errorMessage}
                                </p>
                            )}

                            {/* Navigation Target (Entrance) Info - Hide if we already arrived and aren't in indoor mode because we replaced it entirely above */}
                            {entrance && navigationPhase === "outdoor" && (
                                <div className={`mb-5 p-3 rounded-2xl border ${theme === 'dark' ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                                    <div className="flex items-center gap-2 mb-1">
                                        <Target size={14} className="text-orange-500" />
                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Navigation Target</span>
                                    </div>
                                    <p className={`text-xs font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                                        {entrance.name}
                                    </p>
                                    {destination.type === "room" && (
                                        <p className={`mt-2 text-[11px] 2xl:text-xs leading-relaxed ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>
                                            After reaching the entrance, proceed inside to {destination.floor}. Rooms are within range {destination.rangeStart}–{destination.rangeEnd}.
                                        </p>
                                    )}
                                </div>
                            )}

                            {/* About section */}
                            {!destination.isSecondary && (
                                <div className="mb-5 2xl:mb-7">
                                    <div className="flex items-center gap-2 mb-3 2xl:mb-4">
                                        <div className="w-3.5 h-3.5 2xl:w-4 2xl:h-4 bg-[#fb923c] rounded-[3px] flex items-center justify-center">
                                            <Info size={9} className="text-white fill-white" />
                                        </div>
                                        <h3 className="font-black text-slate-800 text-[11px] 2xl:text-xs uppercase tracking-widest">About</h3>
                                    </div>

                                    <p className="text-[12px] 2xl:text-sm text-slate-600 leading-relaxed mb-4">
                                        {destination.description || "Premium campus facility offering state-of-the-art resources and accessibility for all students."}
                                    </p>

                                    <ul className="space-y-1.5 2xl:space-y-2">
                                        {destination.hours && <AboutItem label={`Hours: ${destination.hours}`} />}
                                        {destination.phone && <AboutItem label={`Phone: ${destination.phone}`} />}
                                        {destination.website && (
                                            <li className="flex items-center gap-2 border-b border-slate-50 pb-1.5 last:border-0">
                                                <div className="w-0.5 h-0.5 bg-[#fb923c] rounded-full opacity-40" />
                                                <a
                                                    href={destination.website}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-[11px] font-bold text-orange-600 hover:underline truncate"
                                                >
                                                    Website
                                                </a>
                                            </li>
                                        )}
                                        {destination.address && <AboutItem label={destination.address} />}
                                    </ul>
                                </div>
                            )}


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
                    <div 
                        className="p-4 2xl:p-5 border-b border-slate-50 flex items-center gap-2 cursor-pointer"
                        onTouchStart={handleTouchStart}
                        onTouchEnd={handleTouchEnd}
                    >
                        <button
                            onClick={() => onSetPlanning(false)}
                            className="p-1.5 text-slate-400 hover:text-[#fb923c] transition-colors"
                        >
                            <ChevronLeft size={20} />
                        </button>
                        <h2 className="text-[17px] 2xl:text-xl font-black text-[#111827]">Plan Route</h2>
                    </div>

                    <div 
                        className="flex-1 p-4 2xl:p-6 space-y-4 2xl:space-y-5 overflow-y-auto custom-scrollbar"
                        onScroll={(e) => {
                            if (window.innerWidth < 768 && onSetSheetState && sheetState === "HALF") {
                                const target = e.currentTarget;
                                if (target.scrollTop > 10) {
                                    onSetSheetState("FULL");
                                }
                            }
                        }}
                    >
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
                                <div className={`w-8 h-8 2xl:w-10 2xl:h-10 rounded-lg flex items-center justify-center group-hover:scale-105 transition-transform ${originType === "gps" ? "bg-orange-500 text-white" : "bg-orange-50 text-orange-500"
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
                                    <p className="text-[13px] 2xl:text-base font-black text-[#111827]">{destination.name}</p>
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
                        {simulationMode && (
                            <button
                                onClick={() => {
                                    console.log("🔘 Demo Button Clicked in InfoPanel");
                                    onStartDemo();
                                }}
                                className={`w-full h-12 2xl:h-14 rounded-xl 2xl:rounded-2xl font-black text-[14px] 2xl:text-base flex items-center justify-center gap-2 transition-all active:scale-95 shadow-md border-2 bg-white text-[#fb923c] border-[#fb923c] hover:bg-orange-50`}
                            >
                                Demo Simulation
                                <Zap size={15} />
                            </button>
                        )}
                        <button
                            disabled={!startLabel}
                            onClick={() => onStartNavigation([destination.lng, destination.lat])}
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

function ActionButton({ 
    icon, 
    label, 
    onClick, 
    disabled, 
    variant = "neutral" 
}: { 
    icon: React.ReactNode; 
    label: string; 
    onClick?: (e: React.MouseEvent) => void; 
    disabled?: boolean;
    variant?: "neutral" | "primary" | "success" | "info" | "danger"
}) {
    const variants = {
        neutral: "bg-slate-50 text-[#111827] border-slate-200 hover:bg-slate-100",
        primary: "bg-orange-500 text-white border-transparent hover:bg-orange-600 shadow-lg shadow-orange-500/20",
        success: "bg-green-500 text-white border-transparent cursor-default",
        info: "bg-blue-500 text-white border-transparent cursor-default",
        danger: "bg-red-500 text-white border-transparent hover:bg-red-600"
    };

    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={`
                flex items-center justify-center gap-2 h-12 2xl:h-14 px-4 rounded-xl border font-bold transition-all duration-300 active:scale-95
                ${variants[variant]}
                ${disabled && (variant === 'success' || variant === 'info') ? 'opacity-100' : disabled ? 'opacity-50 cursor-not-allowed' : ''}
            `}
        >
            <div className="flex-shrink-0">
                {icon}
            </div>
            <span className="text-[13px] 2xl:text-sm font-black uppercase tracking-tight">
                {label}
            </span>
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
