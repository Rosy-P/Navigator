"use client";

import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import {
    Search,
    MapPin,
    Star,
    Clock,
    Users,
    ChevronRight,
    Filter,
    Beaker,
    Utensils,
    HeartPulse,
    Trophy,
    Sparkles,
    Palette,
    Briefcase,
    BookOpen,
    Navigation,
    CalendarCheck,
    Compass,
    AlertCircle,
    CheckCircle2,
    XCircle,
    Maximize2,
    Layers,
    Navigation2
} from 'lucide-react';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../components/AuthOverlay';
import { useMediaQuery } from '../hooks/use-media-query';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

// --- Types ---
interface Facility {
    id: string;
    name: string;
    category: string;
    description: string;
    status: 'Open' | 'Closed' | 'Crowded';
    occupancy: number;
    distance: string;
    rating: number;
    image: string;
    latitude: number;
    longitude: number;
}

const CATEGORIES = [
    { id: 'All', label: 'All', icon: <Filter size={18} /> },
    { id: 'Labs', label: 'Labs', icon: <Beaker size={18} /> },
    { id: 'Food', label: 'Food', icon: <Utensils size={18} /> },
    { id: 'Health', label: 'Health', icon: <HeartPulse size={18} /> },
    { id: 'Sports', label: 'Sports', icon: <Trophy size={18} /> },
    { id: 'Spiritual', label: 'Spiritual', icon: <Sparkles size={18} /> },
    { id: 'Creative', label: 'Creative', icon: <Palette size={18} /> },
    { id: 'Services', label: 'Services', icon: <Briefcase size={18} /> },
];

// --- Sub-components ---

const SkeletonCard = () => (
    <div className="bg-white border border-slate-100 rounded-[28px] overflow-hidden shadow-sm animate-pulse">
        <div className="h-48 bg-slate-200" />
        <div className="p-6 space-y-4">
            <div className="flex justify-between items-center">
                <div className="h-6 w-1/2 bg-slate-200 rounded-lg" />
                <div className="h-4 w-12 bg-slate-200 rounded-lg" />
            </div>
            <div className="h-4 w-full bg-slate-100 rounded-lg" />
            <div className="h-4 w-5/6 bg-slate-100 rounded-lg" />
            <div className="space-y-2 pt-4">
                <div className="h-1.5 w-full bg-slate-100 rounded-full" />
                <div className="grid grid-cols-3 gap-2">
                    <div className="h-12 bg-slate-50 rounded-2xl" />
                    <div className="h-12 bg-slate-50 rounded-2xl" />
                    <div className="h-12 bg-slate-50 rounded-2xl" />
                </div>
            </div>
        </div>
    </div>
);

const StatusBadge = ({ status }: { status: Facility['status'] }) => {
    const styles = {
        Open: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
        Closed: 'bg-rose-500/10 text-rose-600 border-rose-500/20',
        Crowded: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
    };

    return (
        <span className={`px-2 py-1 rounded-full text-[10px] font-bold border ${styles[status]}`}>
            {status}
        </span>
    );
};

const OccupancyIndicator = ({ percentage }: { percentage: number }) => {
    const getColor = () => {
        if (percentage > 80) return 'bg-rose-500';
        if (percentage > 50) return 'bg-amber-500';
        return 'bg-emerald-500';
    };

    return (
        <div className="flex items-center gap-2">
            <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                    className={`h-full transition-all duration-1000 ${getColor()}`}
                    style={{ width: `${percentage}%` }}
                />
            </div>
            <span className="text-[10px] font-semibold text-slate-500">{percentage}% occupied</span>
        </div>
    );
};

export default function FacilitiesPage() {
    const { user, showAuthOverlay, logout } = useAuth();
    const isMobile = useMediaQuery("(max-width: 768px)");

    // State
    const [facilities, setFacilities] = useState<Facility[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');
    const [openNow, setOpenNow] = useState(false);
    const [hoveredFacility, setHoveredFacility] = useState<string | null>(null);
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true); // Default to collapsed for more space
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    // Map Refs
    const mapContainer = useRef<HTMLDivElement>(null);
    const map = useRef<maplibregl.Map | null>(null);
    const markers = useRef<{ [key: string]: maplibregl.Marker }>({});
    const cardRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

    // Debounce Search
    const [debouncedSearch, setDebouncedSearch] = useState('');
    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(searchQuery), 300);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    // Fetch Data
    const fetchFacilities = useCallback(async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            if (selectedCategory !== 'All') params.append('category', selectedCategory);
            if (openNow) params.append('open', 'true');
            if (debouncedSearch) params.append('search', debouncedSearch);

            console.log("📡 Fetching facilities with params:", params.toString());
            const response = await fetch(`http://localhost:8080/campus-navigator-backend/getfacilities.php?${params.toString()}`);
            if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
            
            const data = await response.json();
<<<<<<< HEAD
            console.log("📦 Facilities API Response:", data);
            
            // Fix: API returns { status: "success", data: [...] }
            if (Array.isArray(data)) {
                setFacilities(data);
                setError(null);
            } else if (data && Array.isArray(data.data)) {
                // Handle wrapped response format
                setFacilities(data.data);
                setError(null);
            } else {
                console.warn("⚠️ API returned unexpected format:", data);
                setFacilities([]);
                if (data && data.error) setError(data.error);
                else if (data && data.message) setError(data.message);
                else setError(null);
            }
=======

            // Image mapping for newly added local images
            const localImageMap: Record<string, string> = {
                "Computer Lab": "/images/facilities/compurt lab.jfif",
                "Zoology Lab": "/images/facilities/zoology lab.jfif",
                "Botany Lab": "/images/facilities/botany lab.jfif",
                "Library": "/images/facilities/library"
            };

            const formattedData = data.map((f: any) => {
                // Determine status - map lowercase to Capitalized
                let status: Facility['status'] = 'Open';
                const s = f.status?.toLowerCase();
                if (s === 'closed') status = 'Closed';
                if (s === 'crowded') status = 'Crowded';

                return {
                    id: f.id,
                    name: f.name,
                    category: f.category,
                    description: f.description,
                    status: status,
                    occupancy: parseInt(f.occupancy_percentage) || 0,
                    distance: f.distance || 'Proximate', // Fallback if not in API
                    rating: parseFloat(f.rating) || 4.5, // Fallback if not in API
                    image: localImageMap[f.name] || f.image_url,
                    latitude: parseFloat(f.latitude),
                    longitude: parseFloat(f.longitude)
                };
            });

            setFacilities(formattedData);
            setError(null);
>>>>>>> 521c4fc4c078ba1a3ffbc64b095d8f780af71612
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [selectedCategory, openNow, debouncedSearch]);

    useEffect(() => {
        fetchFacilities();
    }, [fetchFacilities]);

    // Initialize Map
    useEffect(() => {
        if (!mapContainer.current || map.current) return;

        map.current = new maplibregl.Map({
            container: mapContainer.current,
            style: 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json',
            center: [80.1240, 12.9240],
            zoom: 15,
            attributionControl: false
        });

        map.current.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'bottom-right');

        return () => {
            map.current?.remove();
            map.current = null;
        };
    }, []);

    // Sync Markers
    useEffect(() => {
        if (!map.current) return;

        // Clear old markers
        Object.values(markers.current).forEach(m => m.remove());
        markers.current = {};

        facilities.forEach(f => {
            const el = document.createElement('div');
            el.className = `custom-marker transition-all duration-300 ${hoveredFacility === f.id ? 'scale-125 z-50' : 'scale-100 z-10'}`;
            el.innerHTML = `
                <div class="flex flex-col items-center">
                    <div class="flex items-center gap-2 p-1.5 pr-3 rounded-full bg-white border border-slate-200 shadow-xl transition-all ${hoveredFacility === f.id ? 'border-orange-500 shadow-orange-200' : ''}">
                        <div class="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] ${hoveredFacility === f.id ? 'bg-orange-600' : 'bg-slate-400'}">
                            <span class="facility-icon">📍</span>
                        </div>
                        <span class="text-[10px] font-bold text-slate-700 whitespace-nowrap">${f.name}</span>
                    </div>
                    <div class="w-0.5 h-3 ${hoveredFacility === f.id ? 'bg-orange-500' : 'bg-slate-300'}"></div>
                </div>
            `;

            el.onclick = () => {
                cardRefs.current[f.id]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                setHoveredFacility(f.id);
            };

            const marker = new maplibregl.Marker({ element: el })
                .setLngLat([f.longitude, f.latitude])
                .addTo(map.current!);

            markers.current[f.id] = marker;
        });

        // Fit bounds if multiple markers
        if (facilities.length > 0) {
            const bounds = new maplibregl.LngLatBounds();
            facilities.forEach(f => bounds.extend([f.longitude, f.latitude]));
            map.current.fitBounds(bounds, { padding: 50, maxZoom: 17, duration: 2000 });
        }
    }, [facilities, hoveredFacility]);

    const handleFlyTo = (f: Facility) => {
        map.current?.flyTo({
            center: [f.longitude, f.latitude],
            zoom: 18,
            duration: 1500,
            essential: true
        });
        setHoveredFacility(f.id);
    };

    return (
        <div className="h-screen w-screen relative flex overflow-hidden bg-slate-50/50">
            <Sidebar
                isCollapsed={isSidebarCollapsed}
                isMobileOpen={isMobileMenuOpen}
                onCloseMobile={() => setIsMobileMenuOpen(false)}
                onOpenSettings={() => { }}
                forceActiveLabel="Facilities"
                user={user}
                onOpenAuth={showAuthOverlay}
                onLogout={logout}
                theme="light"
            />

            <main className={`flex-1 relative transition-all duration-500 overflow-y-auto overflow-x-hidden h-full ${!isSidebarCollapsed ? "md:ml-[320px] 2xl:ml-[340px]" : "md:ml-[64px]"}`}>

                {/* Mobile Header */}
                <div className="md:hidden sticky top-0 z-[50] w-full p-4 flex items-center justify-between bg-white/80 backdrop-blur-xl border-b border-slate-100">
                    <button onClick={() => setIsMobileMenuOpen(true)} className="w-10 h-10 bg-white rounded-xl shadow-lg flex items-center justify-center text-slate-900 border border-slate-100">
                        <div className="flex flex-col gap-1">
                            <span className="w-4 h-0.5 bg-current rounded-full" />
                            <span className="w-4 h-0.5 bg-current rounded-full" />
                            <span className="w-2 h-0.5 bg-current rounded-full" />
                        </div>
                    </button>
                    <div className="flex items-center gap-2">
                        <span className="font-bold text-[14px] tracking-tight uppercase">MCC Facilities</span>
                        <span className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-pulse" />
                    </div>
                    <div className="w-10" />
                </div>

                {/* Hero Section */}
                <section className="relative overflow-hidden pt-8 pb-6 px-8">
                    <div className="relative max-w-6xl">
                        <h1 className="text-4xl md:text-5xl font-extrabold text-slate-950 tracking-tight mb-2 animate-in fade-in slide-in-from-bottom-4">
                            Explore <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-amber-600">Campus Facilities</span>
                        </h1>
                        <p className="text-base text-slate-500 max-w-2xl leading-relaxed">
                            Smart navigation, real-time status, and seamless campus access.
                        </p>
                    </div>
                </section>

                {/* Filters Row */}
                <div className="px-8 mb-8">
                    <div className="sticky top-4 z-40 bg-white/80 backdrop-blur-xl border border-slate-100 p-4 rounded-[24px] shadow-sm flex flex-col md:flex-row gap-4">
                        <div className="relative flex-1 group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-orange-500 transition-colors" size={20} />
                            <input
                                type="text"
                                placeholder="Search facilities..."
                                className="w-full bg-slate-100/50 border-none rounded-2xl py-3 pl-12 pr-4 text-slate-950 placeholder:text-slate-400 focus:ring-2 focus:ring-orange-500/20 focus:bg-white transition-all"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>

                        <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
                            {CATEGORIES.map((cat) => (
                                <button
                                    key={cat.id}
                                    onClick={() => setSelectedCategory(cat.id)}
                                    className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-[13px] font-bold transition-all whitespace-nowrap ${selectedCategory === cat.id ? 'bg-slate-900 text-white shadow-lg' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                                >
                                    {cat.icon} {cat.label}
                                </button>
                            ))}
                        </div>

                        <div className="flex items-center gap-3 px-4 py-2 bg-slate-50 rounded-2xl border border-slate-100">
                            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Open Now</span>
                            <button
                                onClick={() => setOpenNow(!openNow)}
                                className={`w-10 h-5 rounded-full p-1 transition-colors duration-300 ${openNow ? 'bg-orange-600' : 'bg-slate-300'}`}
                            >
                                <div className={`w-3 h-3 bg-white rounded-full transition-transform duration-300 ${openNow ? 'translate-x-5' : 'translate-x-0'}`} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Content Grid */}
                {/* CHANGED: Restored xl:flex-row since sidebar is collapsed, giving enough space for laptop split view */}
                <div className="flex flex-col xl:flex-row max-w-[1920px] mx-auto px-4 md:px-8 gap-8 pb-12">

                    {/* Left Side: Cards */}
                    <div className="flex-1 space-y-6 min-w-0">
                        {loading ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-2 2xl:grid-cols-3 gap-6">
                                {[1, 2, 3, 4, 5, 6, 7, 8].map(i => <SkeletonCard key={i} />)}
                            </div>
                        ) : error ? (
                            <div className="flex flex-col items-center justify-center p-12 bg-rose-50 rounded-[32px] border border-rose-100 text-center">
                                <AlertCircle className="text-rose-500 mb-4" size={48} />
                                <h3 className="text-xl font-bold text-rose-900 mb-2">Failed to load facilities</h3>
                                <p className="text-rose-600 mb-6">{error}</p>
                                <button onClick={fetchFacilities} className="px-6 py-2 bg-rose-600 text-white rounded-xl font-bold">Try Again</button>
                            </div>
                        ) : facilities.length === 0 ? (
                            <div className="flex flex-col items-center justify-center p-12 bg-slate-50 rounded-[32px] border border-slate-100 text-center">
                                <Search className="text-slate-300 mb-4" size={48} />
                                <h3 className="text-xl font-bold text-slate-900">No facilities found</h3>
                                <p className="text-slate-500">Try adjusting your filters or search query.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-2 2xl:grid-cols-3 gap-6">
                                {Array.isArray(facilities) && facilities.map((facility) => (
                                    <div
                                        key={facility.id}
                                        ref={el => { cardRefs.current[facility.id] = el; }}
                                        onMouseEnter={() => setHoveredFacility(facility.id)}
                                        onMouseLeave={() => setHoveredFacility(null)}
<<<<<<< HEAD
                                        className={`group relative bg-white border rounded-[28px] overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 flex flex-col ${hoveredFacility === facility.id ? 'border-blue-500 shadow-blue-50' : 'border-slate-100'}`}
=======
                                        className={`group relative bg-white border rounded-[28px] overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${hoveredFacility === facility.id ? 'border-orange-500 shadow-orange-50' : 'border-slate-100'}`}
>>>>>>> 521c4fc4c078ba1a3ffbc64b095d8f780af71612
                                    >
                                        <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-100">
                                            <img src={facility.image} alt={facility.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                                            <div className="absolute top-4 right-4 flex gap-2">
                                                <StatusBadge status={facility.status} />
                                            </div>
                                            <div className="absolute bottom-4 left-4 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/20 backdrop-blur-md text-white text-[11px] font-bold border border-white/10">
                                                <MapPin size={12} /> {facility.distance}
                                            </div>
                                        </div>

<<<<<<< HEAD
                                        <div className="p-5 flex flex-col flex-1">
                                            <div className="flex items-start justify-between mb-2 gap-2">
                                                <h3 className="text-lg font-bold text-slate-900 group-hover:text-blue-600 transition-colors uppercase leading-tight line-clamp-2">{facility.name}</h3>
                                                <div className="flex-shrink-0 flex items-center gap-1 text-amber-500 font-bold text-xs bg-amber-50 px-2 py-1 rounded-lg">
                                                    <Star size={12} fill="currentColor" /> {facility.rating}
=======
                                        <div className="p-6">
                                            <div className="flex items-center justify-between mb-2">
                                                <h3 className="text-xl font-bold text-slate-950 group-hover:text-orange-600 transition-colors uppercase">{facility.name}</h3>
                                                <div className="flex items-center gap-1 text-amber-500 font-bold text-sm">
                                                    <Star size={14} fill="currentColor" /> {facility.rating}
>>>>>>> 521c4fc4c078ba1a3ffbc64b095d8f780af71612
                                                </div>
                                            </div>
                                            <p className="text-slate-500 text-xs leading-relaxed mb-4 line-clamp-2 flex-1">{facility.description}</p>

<<<<<<< HEAD
                                            <div className="space-y-4 mt-auto">
                                                {/* REMOVED: OccupancyIndicator */}
                                                
                                                <div className="grid grid-cols-2 gap-2"> {/* Changed to 2 columns since Book is gone */}
                                                    <button className="flex flex-col items-center justify-center gap-1 p-2 rounded-xl bg-slate-50 text-slate-600 hover:bg-blue-50 hover:text-blue-600 transition-all active:scale-95">
                                                        <Clock size={16} /> <span className="text-[9px] font-bold uppercase">Details</span>
                                                    </button>
                                                    <button
                                                        onClick={() => handleFlyTo(facility)}
                                                        className="flex flex-col items-center justify-center gap-1 p-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 shadow-md transition-all active:scale-95"
=======
                                            <div className="space-y-4">
                                                <OccupancyIndicator percentage={facility.occupancy} />
                                                <div className="grid grid-cols-3 gap-2">
                                                    <button className="flex flex-col items-center justify-center gap-1 p-2 rounded-2xl bg-slate-50 text-slate-600 hover:bg-orange-50 hover:text-orange-600 transition-all active:scale-95">
                                                        <Clock size={18} /> <span className="text-[9px] font-bold uppercase">Details</span>
                                                    </button>
                                                    <button
                                                        onClick={() => handleFlyTo(facility)}
                                                        className="flex flex-col items-center justify-center gap-1 p-2 rounded-2xl bg-orange-600 text-white hover:bg-orange-700 shadow-md transition-all active:scale-95"
>>>>>>> 521c4fc4c078ba1a3ffbc64b095d8f780af71612
                                                    >
                                                        <Navigation size={16} /> <span className="text-[9px] font-bold uppercase">Navigate</span>
                                                    </button>
                                                    {/* REMOVED: Book Button */}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Right Side: Map - Sticky on XL screens, static on smaller */}
                    <div className="w-full xl:w-[450px] 2xl:w-[500px] flex-shrink-0">
                        <div className="sticky top-4 h-[400px] xl:h-[calc(100vh-2rem)] bg-white border border-slate-100 rounded-[32px] overflow-hidden shadow-2xl shadow-slate-200/50">
                            <div ref={mapContainer} className="w-full h-full" />

                            {/* Map Floating Header */}
                            <div className="absolute top-6 left-6 right-6 flex items-center justify-between p-4 bg-white/80 backdrop-blur-xl border border-slate-100 rounded-2xl z-10 shadow-sm">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-orange-600 rounded-xl flex items-center justify-center text-white shadow-lg">
                                        <Compass size={20} className="animate-pulse" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-slate-950 text-sm">Interactive Map</h4>
                                        <p className="text-[10px] text-slate-500 flex items-center gap-1">
                                            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                                            Live facility locations
                                        </p>
                                    </div>
                                </div>
                                <div className="flex gap-1.5">
                                    <button className="p-2 bg-white rounded-lg border border-slate-100 text-slate-600 hover:bg-slate-50 transition-colors"><Maximize2 size={16} /></button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <style jsx global>{`
                    .custom-marker { cursor: pointer; }
                    .scrollbar-hide::-webkit-scrollbar { display: none; }
                    .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
                    main { scrollbar-width: thin; scrollbar-color: #cbd5e1 transparent; }
                    main::-webkit-scrollbar { width: 6px; }
                    main::-webkit-scrollbar-track { background: transparent; }
                    main::-webkit-scrollbar-thumb { background-color: #cbd5e1; border-radius: 20px; }
                `}</style>
            </main>
        </div>
    );
}
