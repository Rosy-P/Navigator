"use client";

import React, { useState, useMemo } from "react";
import { ChevronRight, SearchX } from "lucide-react";
import { useAdmin } from "../layout";

export default function UsersPage() {
    const { users, searchTerm } = useAdmin();
    const [activeTab, setActiveTab] = useState<"all" | "admin" | "student">("all");

    // Filtering Logic
    const filteredUsers = useMemo(() => {
        return users.filter(user => {
            const matchesSearch = 
                user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                user.email.toLowerCase().includes(searchTerm.toLowerCase());
            
            const matchesTab = 
                activeTab === "all" || 
                user.role?.toLowerCase() === activeTab;

            return matchesSearch && matchesTab;
        });
    }, [users, searchTerm, activeTab]);

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight">User Information</h1>
                    <p className="text-gray-400 font-medium mt-1">Manage and monitor platform members</p>
                </div>
                
                <div className="bg-white p-1.5 rounded-2xl shadow-sm flex gap-1 border border-gray-100">
                    <TabButton label="All" active={activeTab === "all"} onClick={() => setActiveTab("all")} />
                    <TabButton label="Admins" active={activeTab === "admin"} onClick={() => setActiveTab("admin")} />
                    <TabButton label="Students" active={activeTab === "student"} onClick={() => setActiveTab("student")} />
                </div>
            </div>

            <section className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden mb-12">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-separate border-spacing-y-3 px-6">
                        <thead>
                            <tr className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.15em]">
                                <th className="px-4 py-4">User Details</th>
                                <th className="px-4 py-4">Status</th>
                                <th className="px-4 py-4">Joined</th>
                                <th className="px-4 py-4 text-center">Manage</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredUsers.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="py-20 text-center">
                                        <SearchX className="mx-auto text-gray-300 mb-4" size={48} />
                                        <h3 className="text-lg font-bold">No results found</h3>
                                    </td>
                                </tr>
                            ) : (
                                filteredUsers.map((user: any) => (
                                    <tr key={user.id} className="group cursor-pointer">
                                        <td className="bg-gray-50 group-hover:bg-indigo-50 transition-all rounded-l-2xl px-4 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center font-bold text-indigo-600 border border-gray-100">
                                                    {user.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-gray-900">{user.name}</p>
                                                    <p className="text-[10px] font-medium text-gray-400">{user.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="bg-gray-50 group-hover:bg-indigo-50 px-4 py-4">
                                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase ${
                                                user.role?.toLowerCase() === 'admin' ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-blue-50 text-blue-600 border border-blue-100'
                                            }`}>
                                                {user.role}
                                            </span>
                                        </td>
                                        <td className="bg-gray-50 group-hover:bg-indigo-50 px-4 py-4">
                                            <p className="text-sm font-bold text-gray-700">{new Date(user.created_at).toLocaleDateString()}</p>
                                        </td>
                                        <td className="bg-gray-50 group-hover:bg-indigo-50 rounded-r-2xl px-4 py-4 text-center">
                                            <ChevronRight className="mx-auto text-gray-300 group-hover:text-indigo-600" size={18} />
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </section>
        </div>
    );
}

function TabButton({ label, active, onClick }: { label: string, active: boolean, onClick: () => void }) {
    return (
        <button onClick={onClick} className={`px-6 py-2 rounded-xl text-xs font-bold transition-all ${active ? "bg-[#111827] text-white" : "text-gray-400 hover:text-gray-600"}`}>
            {label}
        </button>
    );
}
