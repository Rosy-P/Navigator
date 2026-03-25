"use client";

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
    Search,
    MapPin,
    Star,
    Clock,
    Filter,
    Beaker,
    Utensils,
    HeartPulse,
    Trophy,
    Sparkles,
    Palette,
    Briefcase,
    Navigation,
    Phone,
    Building,
    X,
    AlertCircle
} from 'lucide-react';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../components/AuthOverlay';
import { useMediaQuery } from '../hooks/use-media-query';
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
    hours?: string;
    phone?: string;
    website?: string;
    address?: string;
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
                <div className="grid grid-cols-2 gap-2">
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

const FACILITY_ABOUT: Record<string, string> = {
    "Computer Lab": "The Madras Christian College Computer Science lab is a cornerstone of digital excellence, providing students with access to high-end workstations and industry-standard software. It serves as a hub for programming, data science research, and collaborative software projects, fosterring a culture of innovation and technical proficiency within the campus.",
    "Zoology Lab": "A prestigious center for biological study, the Zoology Lab houses a vast collection of specimens and advanced microscopy equipment. Students engage in hands-on research here, exploring the complexities of animal biology and genetics, contributing to the college's long-standing reputation for scientific inquiry.",
    "Botany Lab": "Surrounded by the lush greenery of the MCC campus, the Botany Lab is a premier facility for plant science. It offers specialized equipment for physiological and taxonomic studies, allowing students to conduct experimental research on the diverse flora found both on campus and in the wider region.",
    "Library": "The Miller Memorial Library is a majestic repository of knowledge, boasting an extensive collection of over 100,000 volumes. Its quiet study zones, digital archives, and specialized research rooms provide an unparalleled environment for academic growth and intellectual exploration.",
    "Bishop Heber Chapel": "The Bishop Heber Chapel is a serene and historic sanctuary at the heart of MCC. Its stunning architecture and peaceful atmosphere provide a space for quiet reflection, prayer, and weekly services, serving as a spiritual anchor for the entire college community.",
    "Chapel": "The Bishop Heber Chapel is a serene and historic sanctuary at the heart of MCC.",
    "MCC Campus Clinic": "The MCC Campus Clinic provides essential healthcare services to the student and staff community. Managed by qualified professionals, it offers first aid, primary consultations, and emergency stabilization, ensuring that health remains a priority for every resident on campus.",
    "MCC Cafeteria": "The heart of social life at MCC, the Cafeteria offers a vibrant atmosphere and a wide variety of meals. From traditional South Indian fare to modern snacks, it is a place where students gather, share ideas, and enjoy a well-earned break.",
    "Cafeteria": "The heart of social life at MCC, the Cafeteria offers a vibrant atmosphere and a wide variety of meals.",
    "Healthy Cafeteria": "Focused on wellness and nutrition, the Healthy Cafeteria provides balanced, wholesome meals prepared with organic ingredients. It's the perfect spot for those seeking nutritious fuel for their academic and athletic pursuits.",
    "MCC Indoor Stadium": "The MCC Indoor Stadium is a state-of-the-art sports complex designed for excellence. Equipped with international-grade courts for basketball and badminton, it hosts numerous regional tournaments and provides students with world-class athletic training facilities.",
    "Outdoor Playground": "The MCC ground is a vast open-air venue for track and field, football, and cricket. It serves as the primary arena for inter-collegiate sports meets and provides ample space for students to engage in rigorous physical training and outdoor recreation.",
    "Main Gate": "The iconic Main Gate of MCC is more than just an entrance. It symbolizes the transition from the bustling Tambaram town into the serene, 365-acre scrub jungle campus that has been our home since 1937.",
};

const FacilityDetailsPopup = ({ facility, onClose }: { facility: Facility; onClose: () => void }) => {
    return (
        <div className="absolute inset-2 z-[100] animate-in slide-in-from-bottom-2 duration-300">
            <div className="h-full bg-white p-5 flex flex-col relative rounded-[24px] shadow-2xl border border-slate-100 overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-500 to-amber-500"></div>

                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onClose();
                    }}
                    className="absolute top-3 right-3 p-2 rounded-full bg-slate-100 text-slate-500 hover:text-slate-900 transition-all z-10 shadow-sm"
                >
                    <X size={18} />
                </button>

                <div className="flex-1 overflow-y-auto pr-1 pt-10 scrollbar-thin scrollbar-thumb-slate-200">
                    <div className="mb-4">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Facility Details</p>
                        <h3 className="text-xl font-bold text-slate-900 leading-tight pr-8">{facility.name}</h3>
                    </div>

                    <div className="grid grid-cols-1 gap-2 mb-6">
                        {facility.hours && (
                            <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-100/50">
                                <div className="w-8 h-8 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600 shadow-sm">
                                    <Clock size={16} />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">Hours</p>
                                    <p className="text-[12px] font-bold text-slate-700">{facility.hours}</p>
                                </div>
                            </div>
                        )}

                        {facility.phone && (facility.phone !== 'N/A' && facility.phone !== '') && (
                            <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-100/50">
                                <div className="w-8 h-8 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600 shadow-sm">
                                    <Phone size={16} />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">Contact</p>
                                    <p className="text-[12px] font-bold text-slate-700">{facility.phone}</p>
                                </div>
                            </div>
                        )}

                        {facility.address && (
                            <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-100/50">
                                <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600 shadow-sm">
                                    <Building size={16} />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">Location</p>
                                    <p className="text-[12px] font-bold text-slate-700 leading-snug">{facility.address}</p>
                                </div>
                            </div>
                        )}
                    </div>

                    {(FACILITY_ABOUT[facility.name] || facility.description) && (
                        <div className="mb-4">
                            <p className="text-[10px] font-black text-orange-600 uppercase tracking-widest mb-2 flex items-center gap-2">
                                <span className="w-4 h-0.5 bg-orange-600/30 rounded-full"></span>
                                About this place
                            </p>
                            <p className="text-[13px] text-slate-600 leading-relaxed font-medium bg-slate-50/50 p-4 rounded-2xl border border-dashed border-slate-200">
                                {FACILITY_ABOUT[facility.name] || facility.description}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default function FacilitiesPage() {
    const { user, showAuthOverlay, logout, isLoading } = useAuth();
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
    const [activePopupId, setActivePopupId] = useState<string | null>(null);
    const router = useRouter();

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

            const response = await fetch(`http://localhost:80/campus-navigator-backend/getfacilities.php?${params.toString()}`);
            if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);

            const data = await response.json();

            let rawData: any[] = [];
            if (Array.isArray(data)) {
                rawData = data;
            } else if (data && Array.isArray(data.data)) {
                rawData = data.data;
            } else {
                if (data && data.error) setError(data.error);
                else if (data && data.message) setError(data.message);
            }

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
                    occupancy: parseInt(f.occupancy) || 0,
                    distance: f.distance || 'Proximate',
                    rating: parseFloat(f.rating) || 4.5,
                    image: localImageMap[f.name] || f.image,
                    latitude: parseFloat(f.latitude),
                    longitude: parseFloat(f.longitude),
                    hours: f.hours,
                    phone: f.phone,
                    website: f.website,
                    address: f.address
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

    const handleStartNavigation = (f: Facility) => {
        const destination = {
            type: "facility",
            id: f.id,
            name: f.name,
            lat: f.latitude,
            lng: f.longitude,
            buildingId: undefined 
        };
        sessionStorage.setItem('pendingNavDestination', JSON.stringify(destination));
        router.push('/');
    };

    if (isLoading) {
        return (
            <div className="h-screen w-screen flex items-center justify-center bg-slate-50">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-orange-500/20 border-t-orange-500 rounded-full animate-spin" />
                    <p className="text-slate-400 font-medium animate-pulse">Initializing campus resources...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="h-screen w-screen relative flex bg-slate-50/50">
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

                <div className="max-w-[1920px] mx-auto px-4 md:px-8 pb-12 w-full">
                    {loading ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
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
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
                            {Array.isArray(facilities) && facilities.map((facility) => (
                                <div
                                    key={facility.id}
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
                                            <div className="grid grid-cols-2 gap-2">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setActivePopupId(activePopupId === facility.id ? null : facility.id);
                                                    }}
                                                    className={`flex flex-col items-center justify-center gap-1 p-2 rounded-xl border transition-all active:scale-95 ${activePopupId === facility.id ? 'bg-orange-600 text-white border-orange-600 shadow-md' : 'bg-slate-50 text-slate-600 border-slate-100 hover:bg-orange-50 hover:text-orange-600'}`}
                                                >
                                                    <Clock size={16} /> <span className="text-[9px] font-bold uppercase">Details</span>
                                                </button>
                                                <button
                                                    onClick={() => handleStartNavigation(facility)}
                                                    className="flex flex-col items-center justify-center gap-1 p-2 rounded-xl bg-orange-600 text-white hover:bg-orange-700 shadow-md transition-all active:scale-95"
                                                >
                                                    <Navigation size={16} /> <span className="text-[9px] font-bold uppercase">Navigate</span>
                                                </button>
                                            </div>
                                        </div>

                                        {/* Details Pop-up */}
                                        {activePopupId === facility.id && (
                                            <FacilityDetailsPopup
                                                facility={facility}
                                                onClose={() => setActivePopupId(null)}
                                            />
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <style jsx global>{`
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
