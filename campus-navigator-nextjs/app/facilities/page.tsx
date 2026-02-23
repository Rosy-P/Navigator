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
import InfoPanel from '../components/InfoPanel';
import MapControls from '../components/MapControls';
import { useRouter } from 'next/navigation';

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
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isMapExpanded, setIsMapExpanded] = useState(false);
    const [selectedFacility, setSelectedFacility] = useState<Facility | null>(null);
    const [isPlanning, setIsPlanning] = useState(false);
    const [sheetState, setSheetState] = useState<"PEEK" | "HALF" | "FULL">("HALF");
    const [startLocation, setStartLocation] = useState<[number, number] | undefined>();
    const [startLabel, setStartLabel] = useState<string>("");
    const [isSelectingStart, setIsSelectingStart] = useState(false);
    const [pendingPickerLocation, setPendingPickerLocation] = useState<[number, number] | undefined>();
    const [originType, setOriginType] = useState<"gps" | "manual" | null>(null);
    const router = useRouter();

    // Marker Refs (Zero re-render system)
    const activeFacilityIdRef = useRef<string | null>(null);
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
            console.log("📦 Facilities API Response:", data);

            let rawData: any[] = [];
            // Fix: API returns { status: "success", data: [...] }
            if (Array.isArray(data)) {
                rawData = data;
            } else if (data && Array.isArray(data.data)) {
                // Handle wrapped response format
                rawData = data.data;
            } else {
                console.warn("⚠️ API returned unexpected format:", data);
                if (data && data.error) setError(data.error);
                else if (data && data.message) setError(data.message);
            }

            // Image mapping for newly added local images
            const localImageMap: Record<string, string> = {
                "Computer Lab": "/images/facilities/compurt lab.png",
                "Zoology Lab": "/images/facilities/zoology lab.png",
                "Botany Lab": "/images/facilities/botany lab.png",
                "Library": "/images/facilities/library.png",
                "Cafeteria": "/images/facilities/cafeteria.png",
                "Healthy Cafeteria": "/images/facilities/cafeteria.png",
                "Bishop Heber Chapel": "/images/facilities/chapel.png",
                "Chapel": "/images/facilities/chapel.png",
                "MCC Campus Clinic": "/images/facilities/clinic.png",
                "Medical Clinic": "/images/facilities/clinic.png"
            };

            const formattedData = rawData.map((f: any) => {
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

            if (formattedData.length > 0) {
                setFacilities(formattedData);
                setError(null);
            } else if (!error && rawData.length === 0) {
                setFacilities([]);
            }
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

        // Handle Map Clicks for Picking Location
        map.current.on('click', (e) => {
            // Need to check if in selection mode (accessed via ref or just check state if within closure)
            // But Map is initialized once. Better use a listener that checks a ref or state.
            // map.current.isSelectingStart is not a thing, but we can use the state because this is a useEffect.
            // Wait, useEffect captures initial state. I need to handle this carefully.
        });

        // Layout Resize - Handle map resize when container changes
        const resizeObserver = new ResizeObserver(() => {
            map.current?.resize();
        });
        if (mapContainer.current) {
            resizeObserver.observe(mapContainer.current);
        }

        return () => {
            resizeObserver.disconnect();
            map.current?.remove();
            map.current = null;
        };
    }, []);

    // Highlight Marker Helper (Direct DOM manipulation for premium feel)
    const highlightMarker = useCallback((id: string | null) => {
        // Clear previous highlight
        if (activeFacilityIdRef.current && markers.current[activeFacilityIdRef.current]) {
            const prevEl = markers.current[activeFacilityIdRef.current].getElement();
            prevEl.classList.remove('active-marker');
            const iconWrap = prevEl.querySelector('.marker-icon-wrapper');
            if (iconWrap) iconWrap.classList.replace('bg-orange-600', 'bg-slate-400');
            const line = prevEl.querySelector('.marker-line');
            if (line) line.classList.replace('bg-orange-500', 'bg-slate-300');
            const pod = prevEl.querySelector('.marker-pod');
            if (pod) pod.classList.remove('border-orange-500', 'shadow-orange-200');
        }

        activeFacilityIdRef.current = id;

        // Apply new highlight
        if (id && markers.current[id]) {
            const el = markers.current[id].getElement();
            el.classList.add('active-marker');
            const iconWrap = el.querySelector('.marker-icon-wrapper');
            if (iconWrap) iconWrap.classList.replace('bg-slate-400', 'bg-orange-600');
            const line = el.querySelector('.marker-line');
            if (line) line.classList.replace('bg-slate-300', 'bg-orange-500');
            const pod = el.querySelector('.marker-pod');
            if (pod) pod.classList.add('border-orange-500', 'shadow-orange-200');

            // Sync hovered state if needed (though highlight is primary)
            setHoveredFacility(id);
        }
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
                <div class="flex flex-col items-center marker-container">
                    <div class="marker-pod flex items-center gap-2 p-1.5 pr-3 rounded-full bg-white border border-slate-200 shadow-xl transition-all ${hoveredFacility === f.id ? 'border-orange-500 shadow-orange-200' : ''}">
                        <div class="marker-icon-wrapper w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] ${hoveredFacility === f.id ? 'bg-orange-600' : 'bg-slate-400'}">
                            <span class="facility-icon">📍</span>
                        </div>
                        <span class="text-[10px] font-bold text-slate-700 whitespace-nowrap">${f.name}</span>
                    </div>
                    <div class="marker-line w-0.5 h-3 ${hoveredFacility === f.id ? 'bg-orange-500' : 'bg-slate-300'}"></div>
                    <div class="marker-pulse-ring"></div>
                </div>
            `;

            el.onclick = () => {
                cardRefs.current[f.id]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                highlightMarker(f.id);
                setSelectedFacility(f);
                setSheetState("HALF");
            };

            const marker = new maplibregl.Marker({ element: el })
                .setLngLat([f.longitude, f.latitude])
                .addTo(map.current!);

            markers.current[f.id] = marker;
        });

        // Ensure current active marker is visually synced if markers were recreated
        if (activeFacilityIdRef.current) {
            highlightMarker(activeFacilityIdRef.current);
        }

        // Fit bounds if multiple markers
        if (facilities.length > 0) {
            const bounds = new maplibregl.LngLatBounds();
            facilities.forEach(f => bounds.extend([f.longitude, f.latitude]));
            map.current.fitBounds(bounds, { padding: 50, maxZoom: 17, duration: 2000 });
        }
    }, [facilities, hoveredFacility]);

    const handleFlyTo = (f: Facility) => {
        if (!map.current) return;

        map.current.flyTo({
            center: [f.longitude, f.latitude],
            zoom: 18,
            duration: 1500,
            essential: true
        });

        // Highlight after animation
        map.current.once('moveend', () => {
            highlightMarker(f.id);
        });
    };

    const handleStartNavigation = (f: Facility) => {
        const params = new URLSearchParams();
        params.append('dest', f.name);
        params.append('source', 'facilities');
        if (startLocation) {
            params.append('source_lng', startLocation[0].toString());
            params.append('source_lat', startLocation[1].toString());
            params.append('start_label', startLabel);
        }
        router.push(`/?${params.toString()}`);
    };

    const handleStartDemo = (f: Facility) => {
        const params = new URLSearchParams();
        params.append('dest', f.name);
        params.append('source', 'facilities');
        params.append('demo', 'true');
        router.push(`/?${params.toString()}`);
    };

    const handleGetGPSLocation = () => {
        requireAuth(() => {
            const mainGate: [number, number] = [80.120584, 12.923163];
            setStartLocation(mainGate);
            setStartLabel("Main Gate (My Location)");
            setOriginType("gps");
        });
    };

    const handlePickOnMapRequested = () => {
        requireAuth(() => {
            setIsSelectingStart(true);
            setPendingPickerLocation(undefined);
            setOriginType(null); // Reset until picked
        });
    };

    const handleConfirmLocation = () => {
        if (pendingPickerLocation) {
            setStartLocation(pendingPickerLocation);
            setStartLabel("Point on Map");
            setOriginType("manual");
            setIsSelectingStart(false);
            setPendingPickerLocation(undefined);
        }
    };

    const handleCancelPicking = () => {
        setIsSelectingStart(false);
        setPendingPickerLocation(undefined);
    };

    // Need to handle map click separately or via a ref to access latest state
    const isSelectingStartRef = useRef(false);
    useEffect(() => { isSelectingStartRef.current = isSelectingStart; }, [isSelectingStart]);

    useEffect(() => {
        if (!map.current) return;

        const handleMapClick = (e: maplibregl.MapMouseEvent) => {
            if (isSelectingStartRef.current) {
                const coord: [number, number] = [e.lngLat.lng, e.lngLat.lat];
                setPendingPickerLocation(coord);
            }
        };

        map.current.on('click', handleMapClick);
        return () => {
            map.current?.off('click', handleMapClick);
        };
    }, []);

    // Helper for Auth requirement (mirroring page.tsx)
    const requireAuth = (callback?: () => void) => {
        if (!user) {
            showAuthOverlay();
            return;
        }
        if (callback) callback();
    };

    // Marker for Pending Picker
    const pickerMarker = useRef<maplibregl.Marker | null>(null);
    useEffect(() => {
        if (!map.current) return;
        if (pickerMarker.current) pickerMarker.current.remove();

        if (pendingPickerLocation) {
            const el = document.createElement('div');
            el.className = 'w-8 h-8 rounded-full bg-orange-500/20 border-2 border-orange-500 flex items-center justify-center animate-pulse';
            el.innerHTML = '<div class="w-2 h-2 bg-orange-600 rounded-full"></div>';

            pickerMarker.current = new maplibregl.Marker({ element: el })
                .setLngLat(pendingPickerLocation)
                .addTo(map.current);
        }
    }, [pendingPickerLocation]);

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
                <div className={`flex flex-col xl:flex-row max-w-[1920px] mx-auto px-4 md:px-8 gap-8 pb-12 transition-all duration-500 ease-in-out ${isMapExpanded ? 'map-is-expanded' : ''}`}>

                    {/* Left Side: Cards */}
                    <div className={`flex-1 space-y-6 min-w-0 left-panel-container transition-all duration-500 ${isMapExpanded ? 'w-0 opacity-0 pointer-events-none' : 'w-full opacity-100'}`}>
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
                                        className={`group relative bg-white border rounded-[28px] overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 flex flex-col ${hoveredFacility === facility.id ? 'border-orange-500 shadow-orange-50' : 'border-slate-100'}`}
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

                                        <div className="p-5 flex flex-col flex-1">
                                            <div className="flex items-start justify-between mb-2 gap-2">
                                                <h3 className="text-lg font-bold text-slate-900 group-hover:text-orange-600 transition-colors uppercase leading-tight line-clamp-2">{facility.name}</h3>
                                                <div className="flex-shrink-0 flex items-center gap-1 text-amber-500 font-bold text-xs bg-amber-50 px-2 py-1 rounded-lg">
                                                    <Star size={12} fill="currentColor" /> {facility.rating}
                                                </div>
                                            </div>
                                            <p className="text-slate-500 text-xs leading-relaxed mb-4 line-clamp-2 flex-1">{facility.description}</p>

                                            <div className="space-y-4 mt-auto">
                                                {/* REMOVED: OccupancyIndicator */}

                                                <div className="grid grid-cols-2 gap-2"> {/* Changed to 2 columns since Book is gone */}
                                                    <button className="flex flex-col items-center justify-center gap-1 p-2 rounded-xl bg-slate-50 text-slate-600 hover:bg-orange-50 hover:text-orange-600 transition-all active:scale-95">
                                                        <Clock size={16} /> <span className="text-[9px] font-bold uppercase">Details</span>
                                                    </button>
                                                    <button
                                                        onClick={() => handleFlyTo(facility)}
                                                        className="flex flex-col items-center justify-center gap-1 p-2 rounded-xl bg-orange-600 text-white hover:bg-orange-700 shadow-md transition-all active:scale-95"
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

                    {/* Right Side: Map */}
                    <div className={`flex-shrink-0 transition-all duration-500 ease-in-out map-panel-container ${isMapExpanded ? 'w-full' : 'w-full xl:w-[450px] 2xl:w-[500px]'}`}>
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
                                    <button
                                        onClick={() => setIsMapExpanded(prev => !prev)}
                                        className={`p-2 bg-white rounded-lg border border-slate-100 text-slate-600 hover:bg-slate-50 transition-all duration-300 ${isMapExpanded ? 'rotate-180 bg-orange-50 border-orange-200 text-orange-600' : ''}`}
                                        title={isMapExpanded ? "Minimize Map" : "Maximize Map"}
                                    >
                                        <Maximize2 size={16} className={`transition-transform duration-500 ${isMapExpanded ? 'scale-75' : 'scale-100'}`} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                {selectedFacility && (
                    <InfoPanel
                        landmark={{
                            name: selectedFacility.name,
                            category: selectedFacility.category,
                            description: selectedFacility.description,
                            images: selectedFacility.image,
                            lng: selectedFacility.longitude,
                            lat: selectedFacility.latitude,
                        }}
                        startLabel={startLabel}
                        isPlanning={isPlanning}
                        originType={originType}
                        sheetState={sheetState}
                        onSetSheetState={setSheetState}
                        onSetPlanning={setIsPlanning}
                        onClose={() => {
                            setSelectedFacility(null);
                            setIsPlanning(false);
                            setStartLocation(undefined);
                            setStartLabel("");
                            setOriginType(null);
                        }}
                        onGetGPSLocation={handleGetGPSLocation}
                        onPickOnMap={handlePickOnMapRequested}
                        onStartNavigation={() => handleStartNavigation(selectedFacility)}
                        onStartDemo={() => handleStartDemo(selectedFacility)}
                        simulationMode={true}
                    />
                )}

                {/* Confirmation Footer for Map Picking */}
                {isSelectingStart && (
                    <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-[100] animate-in slide-in-from-bottom-5 duration-500">
                        <div className="backdrop-blur-2xl border bg-white/80 border-white/60 rounded-3xl shadow-[0_25px_50px_-12px_rgba(0,0,0,0.15)] p-4 flex flex-col gap-3 min-w-[280px]">
                            <div className="text-center px-4">
                                <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1">Choosing Origin</p>
                                <p className="text-[14px] font-bold text-slate-900">
                                    {pendingPickerLocation ? "Location Selected" : "Tap on map to pick origin"}
                                </p>
                            </div>

                            <div className="flex gap-2">
                                <button
                                    onClick={handleCancelPicking}
                                    className="flex-1 h-11 rounded-xl font-black text-[14px] bg-slate-100 text-slate-600 hover:bg-slate-200 transition-all active:scale-95"
                                >
                                    Cancel
                                </button>
                                <button
                                    disabled={!pendingPickerLocation}
                                    onClick={handleConfirmLocation}
                                    className={`flex-1 h-11 rounded-xl font-black text-[14px] flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg ${pendingPickerLocation
                                            ? "bg-[#111827] text-white hover:bg-orange-600"
                                            : "bg-slate-50 text-slate-300 cursor-not-allowed"
                                        }`}
                                >
                                    Confirm
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Custom Map Controls */}
                {!isSelectingStart && (
                    <div className={`
                        absolute z-30 scale-90 transition-all duration-500
                        ${selectedFacility
                            ? (isMobile ? "bottom-[52vh] right-4" : "bottom-8 right-[340px] 2xl:right-[380px]")
                            : "bottom-8 right-8"}
                    `}>
                        <MapControls
                            onZoomIn={() => map.current?.zoomIn()}
                            onZoomOut={() => map.current?.zoomOut()}
                        />
                    </div>
                )}

                <style jsx global>{`
                    .custom-marker { cursor: pointer; }
                    
                    /* Premium Marker Active State */
                    .active-marker {
                        z-index: 100 !important;
                        animation: marker-bounce 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                    }

                    .active-marker .marker-pulse-ring {
                        position: absolute;
                        top: 50%;
                        left: 50%;
                        transform: translate(-50%, -55%);
                        width: 40px;
                        height: 40px;
                        background: rgba(234, 88, 12, 0.2);
                        border-radius: 50%;
                        z-index: -1;
                        animation: marker-pulse 2s infinite;
                    }

                    @keyframes marker-bounce {
                        0%, 100% { transform: translateY(0) scale(1.25); }
                        50% { transform: translateY(-10px) scale(1.3); }
                    }

                    @keyframes marker-pulse {
                        0% { transform: translate(-50%, -55%) scale(0.5); opacity: 0.8; }
                        100% { transform: translate(-50%, -55%) scale(2.5); opacity: 0; }
                    }

                    /* Layout Engine */
                    @media (min-width: 1200px) {
                        .left-panel-container {
                            max-width: 100%;
                            overflow: visible;
                        }
                        .map-is-expanded .left-panel-container {
                            width: 0 !important;
                            padding: 0 !important;
                            margin: 0 !important;
                            flex: 0 0 0% !important;
                        }
                    }

                    @media (max-width: 1199px) {
                        .left-panel-container {
                            position: relative;
                            z-index: 10;
                            background: inherit;
                        }
                        .map-is-expanded .left-panel-container {
                            position: absolute;
                            left: -100%;
                            transition: left 0.5s ease;
                        }
                        .map-panel-container {
                            width: 100% !important;
                        }
                    }

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
