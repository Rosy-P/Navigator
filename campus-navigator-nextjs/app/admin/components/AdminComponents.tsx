"use client";

import React from "react";
import { 
    LayoutGrid, 
    Users, 
    Shield, 
    Settings, 
    Calendar,
    ChevronRight
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function SidebarItem({ icon, label, href }: { icon: React.ReactNode, label: string, href: string }) {
    const pathname = usePathname();
    const active = pathname === href;

    return (
        <Link 
            href={href}
            className={`
                relative flex items-center gap-4 py-4 px-6 cursor-pointer transition-all duration-300 group
                ${active ? "text-gray-900 bite-active bg-[#f8fafc] rounded-l-[40px] z-10" : "text-gray-400 hover:text-white"}
            `}
        >
            <span className={`${active ? "scale-110" : "group-hover:translate-x-1"} transition-all`}>{icon}</span>
            <span className="text-sm font-bold tracking-tight">{label}</span>
            {active && <div className="absolute right-0 top-0 bottom-0 w-2 bg-[#f8fafc]" />}
        </Link>
    );
}

export function StatItem({ label, value, icon, color }: { label: string, value: number, icon: React.ReactNode, color: string }) {
    return (
        <div className="bg-white p-6 rounded-[32px] shadow-sm border border-gray-100 flex items-center gap-6 group hover:shadow-md transition-all">
            <div className={`w-14 h-14 ${color} rounded-2xl flex items-center justify-center group-hover:scale-110 transition-all`}>{icon}</div>
            <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">{label}</p>
                <p className="text-2xl font-black text-gray-900 tracking-tight">{value}</p>
            </div>
        </div>
    );
}

export function InsightRow({ label, status, dotColor }: { label: string, status: string, dotColor?: string }) {
    return (
        <div className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
            <span className="text-sm font-medium text-gray-500">{label}</span>
            <div className="flex items-center gap-2">
                {dotColor && <span className={`w-1.5 h-1.5 ${dotColor} rounded-full`} />}
                <span className="text-sm font-bold text-gray-700">{status}</span>
            </div>
        </div>
    );
}

export function PlaceholderView({ title, icon }: { title: string, icon: React.ReactNode }) {
    return (
        <div className="h-full flex flex-col items-center justify-center animate-in fade-in duration-500">
            <div className="text-gray-200 mb-4">{icon}</div>
            <h2 className="text-2xl font-black text-gray-900">{title}</h2>
            <p className="text-gray-400 font-medium">This module is currently under maintenance</p>
        </div>
    );
}
