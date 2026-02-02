"use client";

import { X, Map, Zap, Moon, Sun, Bell, Navigation, Shield, Trash2, RotateCcw } from "lucide-react";
import Image from "next/image";

interface SettingsOverlayProps {
    isOpen: boolean;
    onClose: () => void;
    theme: 'light' | 'dark';
    settings: {
        mapStyle: string;
        simulationSpeed: string;
        appearance: string;
        notifications: boolean;
        locationAccuracy: boolean;
    };
    onUpdateSetting: (key: string, value: any) => void;
    onReset: () => void;
    onClearHistory: () => void;
}

export default function SettingsOverlay({
    isOpen,
    onClose,
    theme,
    settings,
    onUpdateSetting,
    onReset,
    onClearHistory
}: SettingsOverlayProps) {
    if (!isOpen) return null;

    const isDark = theme === 'dark';

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300"
                onClick={onClose}
            />

            {/* Modal */}
            <div className={`relative w-full max-w-xl rounded-[32px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 border flex flex-col max-h-[90vh] transition-colors duration-500 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>

                {/* Header */}
                <div className={`p-6 border-b flex items-center justify-between z-10 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-50'}`}>
                    <div>
                        <h2 className={`text-xl font-black leading-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>Settings</h2>
                        <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">Campus Navigator Preference</p>
                    </div>
                    <button
                        onClick={onClose}
                        className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all active:scale-90 ${isDark ? 'bg-slate-800 text-slate-400 hover:text-white' : 'bg-slate-50 text-slate-400 hover:text-slate-900'}`}
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 p-6 space-y-10 overflow-y-auto custom-scrollbar pt-4">

                    {/* 1. Map View Settings */}
                    <section className="space-y-4">
                        <SectionHeader icon={<Map size={16} className="text-orange-500" />} title="Map View" isDark={isDark} />
                        <div className="grid grid-cols-3 gap-3">
                            <MapStyleOption
                                label="Voyager"
                                active={settings.mapStyle === "voyager"}
                                onClick={() => onUpdateSetting("mapStyle", "voyager")}
                                isDark={isDark}
                                imageSrc="/thumbnails/voyager.png"
                            />
                            <MapStyleOption
                                label="Dark"
                                active={settings.mapStyle === "dark"}
                                onClick={() => onUpdateSetting("mapStyle", "dark")}
                                isDark={isDark}
                                imageSrc="/thumbnails/dark.png"
                            />
                            <MapStyleOption
                                label="Satellite"
                                active={settings.mapStyle === "satellite"}
                                onClick={() => onUpdateSetting("mapStyle", "satellite")}
                                isDark={isDark}
                                imageSrc="/thumbnails/satellite.png"
                            />
                        </div>
                    </section>

                    {/* 2. Appearance */}
                    <section className="space-y-4">
                        <SectionHeader icon={<Sun size={16} className="text-purple-500" />} title="Appearance" isDark={isDark} />
                        <div className={`flex p-1.5 rounded-2xl border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-100'}`}>
                            <TabOption
                                label="Light"
                                icon={<Sun size={14} />}
                                active={settings.appearance === "light"}
                                onClick={() => onUpdateSetting("appearance", "light")}
                                isDark={isDark}
                            />
                            <TabOption
                                label="Dark"
                                icon={<Moon size={14} />}
                                active={settings.appearance === "dark"}
                                onClick={() => onUpdateSetting("appearance", "dark")}
                                isDark={isDark}
                            />
                        </div>
                    </section>

                    {/* 3. Navigation & Simulation (Demo Only) */}
                    <section className="space-y-4">
                        <SectionHeader icon={<Zap size={16} className="text-blue-500" />} title="Simulation Mode" isDark={isDark} />
                        <div className={`flex p-1.5 rounded-2xl border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-100'}`}>
                            <SpeedOption
                                label="Slow"
                                active={settings.simulationSpeed === "slow"}
                                onClick={() => onUpdateSetting("simulationSpeed", "slow")}
                                isDark={isDark}
                            />
                            <SpeedOption
                                label="Normal"
                                active={settings.simulationSpeed === "normal"}
                                onClick={() => onUpdateSetting("simulationSpeed", "normal")}
                                isDark={isDark}
                            />
                            <SpeedOption
                                label="Fast"
                                active={settings.simulationSpeed === "fast"}
                                onClick={() => onUpdateSetting("simulationSpeed", "fast")}
                                isDark={isDark}
                            />
                        </div>
                    </section>

                    {/* 4. Notifications */}
                    <section className="space-y-3">
                        <SectionHeader icon={<Bell size={16} className="text-red-500" />} title="Notifications" isDark={isDark} />
                        <ToggleOption
                            label="Push Notifications"
                            description="Receive alerts for landmark arrivals and campus events."
                            active={settings.notifications}
                            onToggle={() => onUpdateSetting("notifications", !settings.notifications)}
                            isDark={isDark}
                        />
                    </section>

                    {/* 5. Location & Privacy */}
                    <section className="space-y-3">
                        <SectionHeader icon={<Shield size={16} className="text-green-500" />} title="Location & Privacy" isDark={isDark} />
                        <ToggleOption
                            label="High Accuracy GPS"
                            description="Improve positioning accuracy using advanced sensors."
                            active={settings.locationAccuracy}
                            onToggle={() => onUpdateSetting("locationAccuracy", !settings.locationAccuracy)}
                            isDark={isDark}
                        />
                        <button
                            onClick={onClearHistory}
                            className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all group ${isDark ? 'bg-slate-800 border-slate-700 hover:bg-slate-750' : 'bg-slate-50 border-slate-100 hover:bg-slate-100'}`}
                        >
                            <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${isDark ? 'bg-slate-900 text-slate-500 group-hover:text-red-400' : 'bg-white text-slate-400 group-hover:text-red-500'}`}>
                                    <Trash2 size={14} />
                                </div>
                                <span className={`text-[14px] font-bold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Clear Search History</span>
                            </div>
                            <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-md ${isDark ? 'bg-slate-900 text-slate-500' : 'bg-white text-slate-400'}`}>Action</span>
                        </button>
                    </section>

                    {/* 6. System */}
                    <section className={`pt-6 border-t ${isDark ? 'border-slate-800' : 'border-slate-50'} space-y-4`}>
                        <button
                            onClick={onReset}
                            className={`w-full flex items-center gap-3 p-4 rounded-2xl border transition-all font-bold ${isDark ? 'bg-slate-800 border-slate-700 text-slate-400' : 'bg-slate-50 border-slate-100 text-slate-600'}`}
                        >
                            <RotateCcw size={16} />
                            <span className="text-[14px]">Reset All to Defaults</span>
                        </button>

                        <div className={`flex items-start gap-4 p-5 rounded-3xl border ${isDark ? 'bg-orange-500/10 border-orange-500/20' : 'bg-orange-50/50 border-orange-100/50'}`}>
                            <Navigation size={20} className="text-orange-500 mt-1" />
                            <div>
                                <p className={`text-[13px] font-black leading-snug ${isDark ? 'text-orange-200' : 'text-orange-900'}`}>MCC Navigator Premium</p>
                                <p className={`text-[11px] font-bold mt-0.5 leading-relaxed ${isDark ? 'text-orange-200/50' : 'text-orange-700/60'}`}>
                                    Version 2.4.0 • Built with love for Madras Christian College. © 2026 DeepMind Advanced Coding.
                                </p>
                            </div>
                        </div>
                    </section>
                </div>

                {/* Footer fixed */}
                <div className={`p-6 border-t z-10 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-50'}`}>
                    <button
                        onClick={onClose}
                        className={`w-full h-14 rounded-[20px] font-black text-[15px] shadow-xl transition-all active:scale-[0.98] flex items-center justify-center gap-2 ${isDark ? 'bg-orange-500 text-white hover:bg-orange-600' : 'bg-[#111827] text-white hover:bg-slate-800'}`}
                    >
                        Save Settings
                    </button>
                </div>
            </div>
        </div>
    );
}

function SectionHeader({ icon, title, isDark }: { icon: React.ReactNode; title: string; isDark: boolean }) {
    return (
        <div className="flex items-center gap-2 mb-2">
            {icon}
            <h3 className={`text-[12px] font-black uppercase tracking-[0.15em] ${isDark ? 'text-slate-400' : 'text-slate-800'}`}>{title}</h3>
        </div>
    );
}

function MapStyleOption({ label, active, onClick, isDark, imageSrc }: { label: string; active?: boolean; onClick: () => void; isDark: boolean; imageSrc: string }) {
    return (
        <button
            onClick={onClick}
            className={`
                flex flex-col items-center gap-3 p-3 rounded-2xl transition-all border group
                ${active
                    ? (isDark ? "bg-slate-800 border-orange-500 shadow-lg scale-105 z-10" : "bg-white border-orange-500 shadow-md scale-105 z-10")
                    : (isDark ? "bg-slate-850 border-slate-800 hover:bg-slate-800 hover:border-slate-700" : "bg-slate-50 border-slate-100 hover:bg-white hover:border-slate-200")}
            `}
        >
            <div className={`w-full aspect-[4/3] rounded-xl overflow-hidden relative border transition-all ${active ? "border-orange-500/50" : "border-transparent"}`}>
                <Image
                    src={imageSrc}
                    alt={label}
                    fill
                    className={`object-cover transition-transform duration-500 ${active ? 'scale-110' : 'group-hover:scale-110'}`}
                />
                {!active && <div className="absolute inset-0 bg-black/5" />}
            </div>
            <span className={`text-[10px] font-black uppercase tracking-widest ${active ? "text-orange-500" : "text-slate-500"}`}>
                {label}
            </span>
        </button>
    );
}

function TabOption({ label, icon, active, onClick, isDark }: { label: string; icon?: React.ReactNode; active: boolean; onClick: () => void; isDark: boolean }) {
    return (
        <button
            onClick={onClick}
            className={`
                flex-1 h-10 flex items-center justify-center gap-2 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all
                ${active
                    ? (isDark ? "bg-slate-900 border border-slate-700 text-orange-500 shadow-sm" : "bg-white text-purple-600 shadow-sm border border-slate-100")
                    : (isDark ? "text-slate-500 hover:text-slate-300" : "text-slate-400 hover:text-slate-600")}
            `}
        >
            {icon}
            {label}
        </button>
    );
}

function SpeedOption({ label, active, onClick, isDark }: { label: string; active: boolean; onClick: () => void; isDark: boolean }) {
    return (
        <button
            onClick={onClick}
            className={`
                flex-1 h-10 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all
                ${active
                    ? (isDark ? "bg-slate-900 border border-slate-700 text-blue-400 shadow-sm" : "bg-white text-blue-600 shadow-sm border border-slate-100")
                    : (isDark ? "text-slate-500 hover:text-slate-300" : "text-slate-400 hover:text-slate-600")}
            `}
        >
            {label}
        </button>
    );
}

function ToggleOption({ label, description, active, onToggle, isDark }: { label: string; description: string; active: boolean; onToggle: () => void; isDark: boolean }) {
    return (
        <div className={`flex items-center justify-between p-4 rounded-[24px] border group transition-colors ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-100'}`}>
            <div className="flex-1 pr-4">
                <span className={`text-[14px] font-bold block mb-0.5 ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{label}</span>
                <p className="text-[11px] font-medium text-slate-500 leading-tight">{description}</p>
            </div>
            <div
                onClick={onToggle}
                className={`w-12 h-7 rounded-full relative cursor-pointer transition-colors duration-300 ${active ? "bg-orange-500" : (isDark ? "bg-slate-700" : "bg-slate-200")}`}
            >
                <div className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow-md transition-all duration-300 ${active ? "left-6" : "left-1"}`} />
            </div>
        </div>
    );
}
