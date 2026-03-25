"use client";

import React, { useState, useEffect } from 'react';
import {
    ShieldHalf,
    Truck,
    Siren,
    Flame,
    Building,
    Phone,
    Navigation,
    Info,
    ChevronRight,
    AlertTriangle,
    MapPin,
    ArrowRight
} from 'lucide-react';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../components/AuthOverlay';
import { useMediaQuery } from '../hooks/use-media-query';
import { useRouter } from 'next/navigation';

// --- Data ---

const EMERGENCY_CONTACTS = [
    {
        name: "Campus Security",
        number: "+91 44 2239 0001",
        icon: <ShieldHalf className="text-orange-600" size={24} />,
        description: "24/7 Campus Protection"
    },
    {
        name: "Ambulance",
        number: "108",
        icon: <Truck className="text-rose-600" size={24} />,
        description: "Medical Emergency Services"
    },
    {
        name: "Police",
        number: "100",
        icon: <Siren className="text-blue-600" size={24} />,
        description: "Law Enforcement Support"
    },
    {
        name: "Fire",
        number: "101",
        icon: <Flame className="text-orange-600" size={24} />,
        description: "Fire Brigade Services"
    },
    {
        name: "College Office",
        number: "+91 44 2239 0675",
        icon: <Building className="text-slate-600" size={24} />,
        description: "General Administrative Support"
    }
];

const NAVIGATION_POINTS = [
    { name: "Security Office", landmark: "Security Office" },
    { name: "Medical Room", landmark: "MCC Campus Clinic" },
    { name: "Main Gate", landmark: "Main Gate" },
    { name: "Nearest Exit", landmark: "Main Gate" } // Defaulting to Main Gate for now as nearest exit logic isn't dynamic here
];

const SAFETY_GUIDELINES = [
    {
        title: "Fire Emergency",
        icon: <Flame className="text-orange-600" size={20} />,
        instructions: [
            "Use nearest exit immediately",
            "Strictly avoid using elevators",
            "Move to open ground area"
        ]
    },
    {
        title: "Medical Emergency",
        icon: <AlertTriangle className="text-rose-600" size={20} />,
        instructions: [
            "Call ambulance immediately (108)",
            "Inform campus security",
            "Keep the patient calm and comfortable"
        ]
    }
];

// --- Sub-components ---

const EmergencyContactCard = ({ contact, theme }: { contact: typeof EMERGENCY_CONTACTS[0], theme: 'light' | 'dark' }) => {
    const isDark = theme === 'dark';

    return (
        <div className={`
      group p-5 rounded-[28px] border transition-all duration-300 hover:shadow-xl hover:-translate-y-1
      ${isDark
                ? 'bg-slate-900/50 border-white/5 hover:border-orange-500/50'
                : 'bg-white border-slate-100 hover:border-orange-500/30 shadow-sm'}
    `}>
            <div className="flex items-start justify-between mb-4">
                <div className={`
          w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110
          ${isDark ? 'bg-white/5' : 'bg-slate-50'}
        `}>
                    {contact.icon}
                </div>
                <button
                    className={`
            flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all active:scale-95
            ${isDark
                            ? 'bg-orange-500/10 text-orange-500 border border-orange-500/20 hover:bg-orange-500 hover:text-white'
                            : 'bg-orange-50 text-orange-600 border border-orange-100 hover:bg-orange-600 hover:text-white shadow-sm'}
          `}
                >
                    <Phone size={14} /> Call
                </button>
            </div>

            <div>
                <h3 className={`text-lg font-bold mb-1 transition-colors group-hover:text-orange-500 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    {contact.name}
                </h3>
                <p className={`text-xl font-black mb-1 ${isDark ? 'text-slate-300' : 'text-slate-800'}`}>
                    {contact.number}
                </p>
                <p className={`text-xs font-medium ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                    {contact.description}
                </p>
            </div>
        </div>
    );
};

const NavigationButton = ({ point, theme, onClick }: { point: typeof NAVIGATION_POINTS[0], theme: 'light' | 'dark', onClick: () => void }) => {
    const isDark = theme === 'dark';

    return (
        <button
            onClick={onClick}
            className={`
        flex items-center justify-between p-5 rounded-2xl border font-bold text-sm transition-all active:scale-[0.98] group
        ${isDark
                    ? 'bg-slate-800/50 border-white/5 text-white hover:bg-orange-500 hover:border-orange-500'
                    : 'bg-white border-slate-100 text-slate-800 hover:bg-slate-900 hover:text-white hover:border-slate-900 shadow-sm'}
      `}
        >
            <div className="flex items-center gap-3">
                <Navigation size={18} className="text-orange-500 group-hover:text-white transition-colors" />
                {point.name}
            </div>
            <ChevronRight size={18} className="opacity-30 group-hover:translate-x-1 group-hover:opacity-100 transition-all text-orange-500" />
        </button>
    );
};

// --- Main Page ---

export default function EmergencyPage() {
    const { user, showAuthOverlay, requireAuth, logout, isLoading } = useAuth();
    const isMobile = useMediaQuery("(max-width: 768px)");
    const router = useRouter();
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    if (isLoading) {
        return (
            <div className="h-screen w-screen flex items-center justify-center bg-slate-50">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-rose-500/20 border-t-rose-500 rounded-full animate-spin" />
                    <p className="text-slate-400 font-medium animate-pulse">Initializing emergency protocols...</p>
                </div>
            </div>
        );
    }

    // Theme management - Default to light, can be synced with home page settings later
    const theme = 'light' as 'light' | 'dark';
    const isDark = theme === 'dark';

    const handleNavigate = (landmark: string) => {
        const params = new URLSearchParams();
        params.append('dest', landmark);
        params.append('source', 'emergency');
        router.push(`/?${params.toString()}`);
    };

    return (
        <div className={`h-screen w-screen relative flex overflow-hidden transition-colors duration-500 ${isDark ? 'bg-[#0f172a]' : 'bg-slate-50/50'}`}>
            <Sidebar
                isCollapsed={isSidebarCollapsed}
                isMobileOpen={isMobileMenuOpen}
                onCloseMobile={() => setIsMobileMenuOpen(false)}
                onOpenSettings={() => requireAuth(() => router.push('/?open=settings'))}
                onOpenSavedPlaces={() => requireAuth(() => router.push('/?open=saved'))}
                onOpenEvents={() => requireAuth(() => router.push('/?open=events'))}
                onOpenEmergency={() => router.push('/emergency')}
                onOpenFacilities={() => router.push('/facilities')}
                onSelectLocations={() => router.push('/')}
                forceActiveLabel="Emergency"
                user={user}
                onOpenAuth={showAuthOverlay}
                onLogout={logout}
                theme={theme}
            />

            <main className={`
        flex-1 relative transition-all duration-500 overflow-y-auto overflow-x-hidden h-full 
        ${!isSidebarCollapsed ? "md:ml-[320px] 2xl:ml-[340px]" : "md:ml-[64px]"}
      `}>
                {/* Mobile Header */}
                <div className={`md:hidden sticky top-0 z-[50] w-full p-4 flex items-center justify-between border-b backdrop-blur-xl ${isDark ? 'bg-slate-900/80 border-white/5' : 'bg-white/80 border-slate-100'}`}>
                    <button onClick={() => setIsMobileMenuOpen(true)} className={`w-10 h-10 rounded-xl shadow-lg flex items-center justify-center border transition-all active:scale-95 ${isDark ? 'bg-slate-800 border-white/10 text-white' : 'bg-white border-slate-100 text-slate-900'}`}>
                        <div className="flex flex-col gap-1">
                            <span className="w-4 h-0.5 bg-current rounded-full" />
                            <span className="w-4 h-0.5 bg-current rounded-full" />
                            <span className="w-2 h-0.5 bg-current rounded-full" />
                        </div>
                    </button>
                    <div className="flex items-center gap-2">
                        <span className={`font-bold text-[14px] tracking-tight uppercase ${isDark ? 'text-white' : 'text-slate-900'}`}>Emergency Assistance</span>
                        <span className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-pulse" />
                    </div>
                    <div className="w-10" />
                </div>

                {/* Hero Section */}
                <section className="relative overflow-hidden pt-8 md:pt-12 pb-6 px-6 md:px-12">
                    <div className="relative max-w-6xl">
                        <h1 className={`text-4xl md:text-5xl font-extrabold tracking-tight mb-2 animate-in fade-in slide-in-from-bottom-4 ${isDark ? 'text-white' : 'text-slate-950'}`}>
                            Emergency <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-600 to-orange-600">Assistance</span>
                        </h1>
                        <p className={`text-base md:text-lg max-w-2xl leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                            Quick access to safety resources and emergency services inside MCC campus.
                        </p>
                    </div>
                </section>

                <div className="max-w-[1600px] mx-auto px-6 md:px-12 pb-20 space-y-12">

                    {/* Section 1: Emergency Contacts */}
                    <section>
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-8 h-8 rounded-lg bg-rose-500/10 flex items-center justify-center">
                                <ShieldHalf className="text-rose-600" size={18} />
                            </div>
                            <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Emergency Contacts</h2>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5 gap-6">
                            {EMERGENCY_CONTACTS.map((contact, idx) => (
                                <EmergencyContactCard key={idx} contact={contact} theme={theme} />
                            ))}
                        </div>
                    </section>

                    {/* Section 2: Quick Navigation & Safety Guidelines */}
                    <div className="grid grid-cols-1 xl:grid-cols-12 gap-12">

                        {/* Quick Navigation */}
                        <section className="xl:col-span-5 2xl:col-span-4">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center">
                                    <Navigation className="text-orange-600" size={18} />
                                </div>
                                <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Quick Navigation</h2>
                            </div>

                            <div className="flex flex-col gap-3">
                                {NAVIGATION_POINTS.map((point, idx) => (
                                    <NavigationButton
                                        key={idx}
                                        point={point}
                                        theme={theme}
                                        onClick={() => handleNavigate(point.landmark)}
                                    />
                                ))}
                            </div>
                        </section>

                        {/* Safety Guidelines */}
                        <section className="xl:col-span-7 2xl:col-span-8">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                                    <Info className="text-blue-600" size={18} />
                                </div>
                                <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Safety Guidelines</h2>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {SAFETY_GUIDELINES.map((guide, idx) => (
                                    <div key={idx} className={`p-6 rounded-[28px] border ${isDark ? 'bg-slate-900/50 border-white/5' : 'bg-white border-slate-100 shadow-sm'}`}>
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isDark ? 'bg-white/5' : 'bg-slate-50'}`}>
                                                {guide.icon}
                                            </div>
                                            <h3 className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{guide.title}</h3>
                                        </div>

                                        <ul className="space-y-4">
                                            {guide.instructions.map((step, sIdx) => (
                                                <li key={sIdx} className="flex gap-3 items-start">
                                                    <div className={`mt-1 flex-shrink-0 w-1.5 h-1.5 rounded-full ${isDark ? 'bg-orange-500' : 'bg-orange-600'}`} />
                                                    <span className={`text-sm leading-tight font-medium ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{step}</span>
                                                </li>
                                            ))}
                                        </ul>

                                        <div className={`mt-6 pt-6 border-t ${isDark ? 'border-white/5' : 'border-slate-50'}`}>
                                            <button className={`flex items-center gap-2 text-xs font-bold uppercase tracking-widest transition-colors ${isDark ? 'text-orange-500 hover:text-orange-400' : 'text-orange-600 hover:text-orange-700'}`}>
                                                Read Detailed Protocol <ArrowRight size={14} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>

                    </div>
                </div>

                {/* Footer Polish */}
                <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-rose-500 via-orange-500 to-amber-500 opacity-50" />
            </main>
        </div>
    );
}
