"use client";

import { X, MapPin, Navigation, Clock, Loader2, Trash2 } from "lucide-react";
import Image from "next/image";
import { useState, useEffect } from "react";
import { useAuth } from "./AuthOverlay";

interface SavedLocation {
    id: number;
    name: string;
    image?: string;
    block: string;
    floor: string;
    latitude: number;
    longitude: number;
    created_at: string;
}

interface SavedPlacesPanelProps {
    isOpen: boolean;
    onClose: () => void;
    onNavigate: (lng: number, lat: number) => void;
    onRefresh?: () => void;
    theme?: "light" | "dark";
}

export default function SavedPlacesPanel({ isOpen, onClose, onNavigate, onRefresh, theme = "light" }: SavedPlacesPanelProps) {
    const { user, requireAuth } = useAuth();
    const [locations, setLocations] = useState<SavedLocation[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const isDark = theme === "dark";

    useEffect(() => {
        if (!isOpen) return;

        if (!user) {
            requireAuth(() => onClose());
            return;
        }

        const fetchLocations = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const res = await fetch(`/backend/get_saved_locations.php`, {
                    credentials: "include"
                });
                const data = await res.json();
                if (data.status === "success") {
                    setLocations(data.data);
                } else {
                    setError(data.message || "Failed to load saved places.");
                }
            } catch (err) {
                setError("Network error fetching saved places.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchLocations();
    }, [isOpen, user]);

    const handleRemove = async (id: number) => {
        if (!user) return;
        
        try {
            const res = await fetch(`/backend/remove_saved_location.php`, {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id })
            });
            const data = await res.json();
            
            if (data.status === "success") {
                setLocations(prev => prev.filter(loc => loc.id !== id));
                if (onRefresh) onRefresh();
            } else {
                console.error(data.message || "Failed to remove location");
            }
        } catch (err) {
            console.error("Network error removing location");
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[70] flex justify-end">
            {/* Backdrop */}
            <div 
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300"
                onClick={onClose}
            />

            {/* Side Panel */}
            <div className={`
                relative w-full max-w-[400px] h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-500
                ${isDark ? "bg-slate-900 border-l border-slate-800" : "bg-white border-l border-slate-100"}
            `}>
                {/* Header */}
                <div className={`p-6 border-b ${isDark ? "border-slate-800" : "border-slate-100"} flex items-center justify-between`}>
                    <h2 className={`text-xl font-black ${isDark ? "text-white" : "text-slate-900"}`}>Saved Places</h2>
                    <button
                        onClick={onClose}
                        className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${isDark ? "bg-slate-800 text-slate-400 hover:text-white" : "bg-slate-50 text-slate-400 hover:text-slate-900"}`}
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center h-40">
                            <Loader2 size={32} className={`animate-spin mb-4 ${isDark ? "text-slate-600" : "text-slate-300"}`} />
                            <p className={`text-sm font-bold ${isDark ? "text-slate-500" : "text-slate-400"}`}>Loading places...</p>
                        </div>
                    ) : error ? (
                        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-sm font-bold text-center">
                            {error}
                        </div>
                    ) : locations.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-60 text-center">
                            <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${isDark ? "bg-slate-800 text-slate-600" : "bg-slate-50 text-slate-300"}`}>
                                <MapPin size={32} />
                            </div>
                            <h3 className={`font-black text-lg mb-2 ${isDark ? "text-white" : "text-slate-900"}`}>No Saved Places</h3>
                            <p className={`text-sm font-medium px-4 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                                Tap the bookmark icon on any location to save it for quick access later.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {locations.map((loc) => (
                                <div 
                                    key={loc.id} 
                                    className={`p-5 rounded-[22px] border transition-all duration-300 ${isDark ? "bg-slate-800/40 border-slate-700 hover:border-orange-500/50" : "bg-white border-slate-100 hover:border-orange-500/30 hover:shadow-xl shadow-sm"}`}
                                >
                                    <div className="flex items-center gap-4 mb-5">
                                        <div className={`w-14 h-14 flex-shrink-0 rounded-[14px] overflow-hidden relative shadow-sm ${isDark ? 'bg-slate-700' : 'bg-slate-50'}`}>
                                            {loc.image ? (
                                                <Image src={loc.image} alt={loc.name} fill className="object-cover transition-transform duration-500 hover:scale-110" unoptimized={loc.image.includes("unsplash.com")} />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-slate-300">
                                                    <MapPin size={22} strokeWidth={2.5} />
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className={`font-black text-[17px] truncate leading-tight mb-1 ${isDark ? "text-white" : "text-[#111827]"}`}>
                                                {loc.name}
                                            </h3>
                                            <p className={`text-[11px] font-bold uppercase tracking-widest ${isDark ? "text-slate-500" : "text-slate-400"}`}>
                                                {loc.block ? `${loc.block}` : "General Landmark"} {loc.floor && loc.floor !== "" ? `• ${loc.floor}` : ""}
                                            </p>
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-center justify-between pt-4 border-t border-slate-50/50">
                                        <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400/80">
                                            <Clock size={12} strokeWidth={2.5} />
                                            <span className="tabular-nums">
                                                {loc.created_at ? new Date(loc.created_at).toLocaleDateString() : "Recently"}
                                            </span>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleRemove(loc.id)}
                                                className={`flex items-center justify-center w-10 h-10 ${isDark ? "bg-slate-800 text-slate-400 hover:bg-red-500/10 hover:text-red-400" : "bg-slate-50 text-slate-400 hover:bg-red-50 hover:text-red-500"} rounded-xl transition-all active:scale-90`}
                                                title="Remove"
                                            >
                                                <Trash2 size={16} strokeWidth={2.5} />
                                            </button>
                                            <button
                                                onClick={() => {
                                                    onNavigate(loc.longitude, loc.latitude);
                                                    onClose();
                                                }}
                                                className="flex items-center gap-2 px-5 h-10 bg-orange-500 text-white font-black text-[13px] uppercase tracking-wider rounded-xl hover:bg-orange-600 hover:shadow-lg hover:shadow-orange-500/20 transition-all active:scale-95"
                                            >
                                                <Navigation size={14} fill="currentColor" />
                                                Go
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
