"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import {
    MapPin,
    Building2,
    Calendar,
    Compass,
    Settings,
    AlertCircle,
    GraduationCap,
    LayoutGrid,
} from "lucide-react";

interface SidebarProps {
    isCollapsed?: boolean;
    onOpenSettings?: () => void;
    forceActiveLabel?: string;
}

export default function Sidebar({ isCollapsed = false, onOpenSettings, forceActiveLabel }: SidebarProps) {
    const pathname = usePathname();

    const menuItems = [
        { icon: <LayoutGrid size={18} />, label: "Dashboard", href: "/dashboard" },
        { icon: <MapPin size={18} />, label: "Locations", href: "/" },
        { icon: <Building2 size={18} />, label: "Facilities", href: "/facilities" },
        { icon: <Calendar size={18} />, label: "Events", href: "/events" },
        { icon: <Compass size={18} />, label: "Tour Mode", href: "/tour" },
        { icon: <Settings size={18} />, label: "Settings", onClick: onOpenSettings },
        { icon: <AlertCircle size={18} />, label: "Emergency", href: "/emergency" },
    ];

    return (
        <aside className={`fixed top-0 left-0 h-screen flex z-50 overflow-hidden shadow-2xl transition-all duration-500 ease-in-out ${isCollapsed ? "w-[64px]" : "w-[244px]"}`}>
            <div className="flex">
                {/* 1. DARK ICON COLUMN */}
                <div className="w-[64px] h-full bg-[#111827] flex flex-col items-center flex-shrink-0 z-20">
                    <div className="h-[120px] flex flex-col items-center justify-center gap-4">
                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-lg border border-white/10">
                            <GraduationCap className="text-[#111827]" size={22} />
                        </div>
                    </div>

                    <div className="flex-1 w-full flex flex-col gap-2 items-end mt-4">
                        {menuItems.map((item) => {
                            const isActive = forceActiveLabel
                                ? forceActiveLabel === item.label
                                : (item.href ? pathname === item.href : false);

                            const content = (
                                <div className={`
                                    z-30 transition-all duration-300
                                    ${isActive ? "text-slate-900 translate-x-1" : "group-hover:scale-110"}
                                `}>
                                    {item.icon}
                                </div>
                            );

                            const className = `
                                w-full h-[48px] flex items-center justify-center transition-all duration-300 relative cursor-pointer
                                ${isActive ? "bite-active bg-white ml-2 rounded-l-2xl shadow-[-4px_0_15px_rgba(0,0,0,0.1)]" : "text-white/30 hover:text-white group"}
                            `;

                            if (item.href) {
                                return (
                                    <Link key={item.label} href={item.href} className={className}>
                                        {content}
                                    </Link>
                                );
                            } else {
                                return (
                                    <div key={item.label} onClick={item.onClick} className={className}>
                                        {content}
                                    </div>
                                );
                            }
                        })}
                    </div>

                    <div
                        id="bottom-settings-btn"
                        onClick={onOpenSettings}
                        className={`h-16 w-full flex items-center justify-center transition-colors group cursor-pointer ${forceActiveLabel === "Settings" ? "bg-white text-slate-900" : "text-white/10 hover:text-white/30"}`}
                    >
                        <Settings size={18} className={forceActiveLabel === "Settings" ? "" : "group-hover:scale-110 transition-transform"} />
                    </div>
                </div>

                {/* 2. LIGHT CONTENT COLUMN */}
                <div className={`w-[180px] h-full bg-white flex flex-col border-r border-slate-200 shadow-xl transition-all duration-500 ease-in-out ${isCollapsed ? "-translate-x-full opacity-0" : "translate-x-0 opacity-100"}`}>
                    {/* Header Part with Polish Dot */}
                    <div className="h-[120px] flex flex-col justify-center px-6 relative">
                        <div className="flex items-center gap-2">
                            <span className="font-bold text-[16px] tracking-tight text-slate-900 leading-none text-nowrap uppercase">MCC Campus</span>
                            <span className="w-1.5 h-1.5 bg-orange-500 rounded-full mt-0.5 animate-pulse" />
                        </div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2 border-l-2 border-orange-500/30 pl-2">Navigator</span>
                    </div>

                    <div className="flex-1 flex flex-col gap-2 py-0 px-4 mt-4">
                        {menuItems.map((item) => {
                            const isActive = forceActiveLabel
                                ? forceActiveLabel === item.label
                                : (item.href ? pathname === item.href : false);

                            const className = `
                                h-[48px] flex items-center px-6 rounded-xl transition-all duration-300 font-bold text-[13px] cursor-pointer
                                ${isActive ? "text-slate-900 bg-slate-50 border border-slate-100/50 shadow-sm" : "text-slate-400/80 hover:text-slate-600 hover:bg-slate-50/50"}
                            `;

                            if (item.href) {
                                return (
                                    <Link key={item.label} href={item.href} className={className}>
                                        {item.label}
                                    </Link>
                                );
                            } else {
                                return (
                                    <div key={item.label} onClick={item.onClick} className={className}>
                                        {item.label}
                                    </div>
                                );
                            }
                        })}
                    </div>

                    <div className="h-16" />
                </div>
            </div>
        </aside>
    );
}
