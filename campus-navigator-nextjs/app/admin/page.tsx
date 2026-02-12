"use client";

import React from "react";
import { Users, Shield, Calendar } from "lucide-react";
import { useAdmin } from "./layout";
import { StatItem, InsightRow } from "./components/AdminComponents";

export default function DashboardPage() {
    const { stats } = useAdmin();

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
                            <p className="text-gray-400 text-sm font-bold mt-1 uppercase tracking-wider">Registrations Over Time</p>
                        </div>
                        <div className="px-4 py-2 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-black uppercase tracking-widest">+12.5%</div>
                    </div>
                    
                    <div className="flex-1 min-h-[220px] relative mt-4">
                        <GrowthChart />
                    </div>

                    <div className="grid grid-cols-7 gap-1 mt-6">
                        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
                            <div key={day} className="text-[10px] font-bold text-gray-300 text-center uppercase tracking-tighter">{day}</div>
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

function GrowthChart() {
    return (
        <svg viewBox="0 0 400 200" className="w-full h-full">
            <defs>
                <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" style={{ stopColor: '#4f46e5', stopOpacity: 0.2 }} />
                    <stop offset="100%" style={{ stopColor: '#4f46e5', stopOpacity: 0 }} />
                </linearGradient>
            </defs>
            <line x1="0" y1="180" x2="400" y2="180" stroke="#f1f5f9" strokeWidth="2" />
            <path d="M0 160 Q 50 150, 100 130 T 200 100 T 300 40 T 400 20 L 400 180 L 0 180 Z" fill="url(#gradient)" />
            <path d="M0 160 Q 50 150, 100 130 T 200 100 T 300 40 T 400 20" fill="none" stroke="#4f46e5" strokeWidth="4" strokeLinecap="round" style={{ strokeDasharray: 1000, strokeDashoffset: 1000, animation: 'draw 2s ease-out forwards' }} />
            <circle cx="400" cy="20" r="6" fill="#4f46e5" stroke="white" strokeWidth="3" />
            <circle cx="200" cy="100" r="4" fill="#4f46e5" stroke="white" strokeWidth="2" />
            <circle cx="100" cy="130" r="4" fill="#4f46e5" stroke="white" strokeWidth="2" />
            <style>{`@keyframes draw { to { stroke-dashoffset: 0; } }`}</style>
        </svg>
    );
}
