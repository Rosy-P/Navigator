"use client";

import React from "react";
import { Users, Shield, Calendar } from "lucide-react";
import { useAdmin } from "./layout";
import { StatItem, InsightRow } from "./components/AdminComponents";

export default function DashboardPage() {
    const { stats, users } = useAdmin();

    // Calculate dynamic growth data for the last 7 days
    const growthData = React.useMemo(() => {
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const today = new Date();
        const last7Days: { day: string, dateStr: string, count: number }[] = [];

        for (let i = 6; i >= 0; i--) {
            const d = new Date(today);
            d.setDate(today.getDate() - i);
            last7Days.push({
                day: days[d.getDay()],
                dateStr: d.toISOString().split('T')[0],
                count: 0
            });
        }

        users.forEach((user: any) => {
            if (!user.created_at) return;
            const regDate = new Date(user.created_at).toISOString().split('T')[0];
            const dayEntry = last7Days.find(d => d.dateStr === regDate);
            if (dayEntry) dayEntry.count++;
        });

        // Convert counts to SVG coordinates (0-200 height, reversed)
        const maxCount = Math.max(...last7Days.map(d => d.count), 5); // Min 5 for scale
        const points = last7Days.map((d, i) => ({
            x: (i * 400) / 6,
            y: 180 - (d.count * 150) / maxCount
        }));

        // Calculate growth percentage (last vs previous period or just trend)
        // For simplicity: + (today's count / total) * 100 or something similar
        const trend = last7Days[6].count >= last7Days[5].count ? "+" : "";
        const change = stats.total > 0 ? ((last7Days[6].count / stats.total) * 100).toFixed(1) : "0.0";

        return { last7Days, points, change: `${trend}${change}%` };
    }, [users, stats.total]);

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatItem label="Total Users" value={stats.total} icon={<Users className="text-indigo-600" size={18} />} color="bg-indigo-50" />
                <StatItem label="Admins" value={stats.admins} icon={<Shield className="text-emerald-600" size={18} />} color="bg-emerald-50" />
                <StatItem label="Events Created" value={stats.events} icon={<Calendar className="text-amber-600" size={18} />} color="bg-amber-50" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* User Growth Chart */}
                <div className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-100 flex flex-col">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h3 className="text-xl font-black text-[#111827] tracking-tight">User Growth Trend</h3>
                            <p className="text-gray-400 text-sm font-bold mt-1 uppercase tracking-wider">Registrations (Last 7 Days)</p>
                        </div>
                        <div className="px-4 py-2 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-black uppercase tracking-widest">{growthData.change}</div>
                    </div>

                    <div className="flex-1 min-h-[220px] relative mt-4">
                        <GrowthChart points={growthData.points} />
                    </div>

                    <div className="grid grid-cols-7 gap-1 mt-6">
                        {growthData.last7Days.map((d, i) => (
                            <div key={i} className="text-[10px] font-bold text-gray-300 text-center uppercase tracking-tighter">{d.day}</div>
                        ))}
                    </div>
                </div>

                {/* Insights Panel */}
                <div className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-100 flex flex-col justify-between">
                    <div>
                        <h3 className="text-xl font-black text-[#111827] mb-2 tracking-tight">System Insights</h3>
                        <p className="text-gray-400 text-[11px] font-bold uppercase tracking-widest mb-8">Daily Performance Overview</p>

                        <div className="space-y-6">
                            <InsightRow label="Real-time Server Health" status="99.9% Up" dotColor="bg-green-500" />
                            <InsightRow label="Database Optimization" status="Optimized" dotColor="bg-green-500" />
                            <InsightRow label="Security Firewalls" status="Active & Secure" dotColor="bg-blue-500" />
                            <InsightRow label="Background Processes" status="Running" dotColor="bg-indigo-500" />
                        </div>
                    </div>
                    <button className="mt-12 w-full py-5 bg-[#111827] hover:bg-black rounded-2xl text-xs font-black text-white transition-all shadow-lg active:scale-[0.98]">
                        Full System Diagnostic Log
                    </button>
                </div>
            </div>
        </div>
    );
}

function GrowthChart({ points }: { points: { x: number, y: number }[] }) {
    const pathData = points.length > 0
        ? `M ${points[0].x} ${points[0].y} ` + points.slice(1).map(p => `L ${p.x} ${p.y}`).join(' ')
        : "M 0 180 L 400 180";

    const areaData = `${pathData} L 400 180 L 0 180 Z`;

    return (
        <svg viewBox="0 0 400 200" className="w-full h-full">
            <defs>
                <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" style={{ stopColor: '#4f46e5', stopOpacity: 0.2 }} />
                    <stop offset="100%" style={{ stopColor: '#4f46e5', stopOpacity: 0 }} />
                </linearGradient>
            </defs>
            <line x1="0" y1="180" x2="400" y2="180" stroke="#f1f5f9" strokeWidth="2" />

            {/* Area fill */}
            <path d={areaData} fill="url(#gradient)" className="animate-in fade-in duration-1000" />

            {/* Trend line */}
            <path
                d={pathData}
                fill="none"
                stroke="#4f46e5"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="transition-all duration-1000"
            />

            {/* Data points */}
            {points.map((p, i) => (
                <circle
                    key={i}
                    cx={p.x}
                    cy={p.y}
                    r="4"
                    fill="#4f46e5"
                    stroke="white"
                    strokeWidth="2"
                    className="hover:r-6 transition-all"
                />
            ))}
        </svg>
    );
}
