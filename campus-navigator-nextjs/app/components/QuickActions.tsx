"use client";

import React from "react";
import { Building2, Microscope, Home } from "lucide-react";

interface QuickActionsProps {
    activeCategory: string | null;
    onCategoryClick: (category: string) => void;
    theme: "light" | "dark";
    isMobile: boolean;
}

const CATEGORIES = [
    { id: "Academic", label: "Academic", icon: Building2 },
    { id: "Lab", label: "Labs", icon: Microscope },
    { id: "Hostel", label: "Hostels", icon: Home },
];

export default function QuickActions({
    activeCategory,
    onCategoryClick,
    theme,
    isMobile,
}: QuickActionsProps) {
    return (
        <div
            className={`
        fixed top-[88px] left-0 right-0 z-30 flex flex-row gap-2 px-4 overflow-x-auto no-scrollbar
        md:absolute md:top-10 md:right-8 md:left-auto md:w-auto md:flex-col md:gap-3 md:animate-in md:slide-in-from-right-10 md:duration-500
      `}
        >
            {CATEGORIES.map((cat) => {
                const isActive = activeCategory === cat.id;
                const Icon = cat.icon;

                return (
                    <button
                        key={cat.id}
                        onClick={() => onCategoryClick(cat.id)}
                        className={`
              flex items-center gap-2 md:gap-3 px-3 md:px-4 h-9 md:h-11 backdrop-blur-md border shadow-[0_10px_35px_rgba(0,0,0,0.05)] font-bold transition-all group active:scale-95 whitespace-nowrap
              ${isMobile ? "rounded-full" : "rounded-xl"}
              ${isActive
                                ? "bg-[#fb923c] border-[#fb923c] text-white scale-105 shadow-orange-500/20"
                                : theme === "dark"
                                    ? "bg-slate-900/90 border-slate-700/50 text-white hover:bg-slate-800"
                                    : "bg-white/90 border-white/50 text-slate-800 hover:bg-white"
                            }
            `}
                    >
                        <div
                            className={`
                w-6 h-6 md:w-8 md:h-8 flex items-center justify-center rounded-lg transition-colors
                ${isActive
                                    ? "bg-white/20 text-white"
                                    : theme === "dark"
                                        ? "bg-slate-800 group-hover:bg-slate-700 text-orange-500"
                                        : "bg-slate-50 group-hover:bg-orange-50 text-orange-500"
                                }
              `}
                        >
                            <Icon size={18} />
                        </div>
                        <span className="text-[12px] md:text-[13px] tracking-tight">{cat.label}</span>
                    </button>
                );
            })}
        </div>
    );
}
