"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Plus, Map, Loader2, Search, Filter, AlertCircle } from "lucide-react";
import { useAdmin } from "../layout";
import { Facility } from "./types";
import { FacilityAdminRow } from "./FacilityAdminRow";
import { FacilityAdminModal } from "./FacilityModal";

export default function AdminFacilitiesPage() {
    const { searchTerm } = useAdmin();
    const [facilities, setFacilities] = useState<Facility[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedFacility, setSelectedFacility] = useState<Facility | null>(null);
    const [categoryFilter, setCategoryFilter] = useState("All");

    const fetchFacilities = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch("http://localhost:8080/campus-navigator-backend/getfacilities.php");
            const data = await res.json();
            
            // Handle both array and object responses
            const rawData = Array.isArray(data) ? data : (data.data || []);
            
            const formatted = rawData.map((f: any) => ({
                ...f,
                id: String(f.id),
                latitude: parseFloat(f.latitude),
                longitude: parseFloat(f.longitude),
                rating: parseFloat(f.rating) || 0,
                total_ratings: parseInt(f.total_ratings) || 0
            }));
            
            setFacilities(formatted);
            setError(null);
        } catch (err) {
            console.error("Failed to fetch facilities:", err);
            setError("Unable to retrieve campus resource data.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchFacilities();
    }, [fetchFacilities]);

    const handleAddClick = () => {
        setSelectedFacility(null);
        setIsModalOpen(true);
    };

    const handleEditClick = (f: Facility) => {
        setSelectedFacility(f);
        setIsModalOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this facility? This action cannot be undone.")) return;

        try {
            const res = await fetch("http://localhost:8080/campus-navigator-backend/deleteFacility.php", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id }),
            });
            const data = await res.json();
            if (data.status === "success") {
                fetchFacilities();
            } else {
                alert(data.message || "Delete failed");
            }
        } catch (err) {
            console.error(err);
            alert("An error occurred during deletion");
        }
    };

    const handleSave = async (data: any) => {
        const endpoint = selectedFacility ? 'updateFacility.php' : 'addFacility.php';
        try {
            const res = await fetch(`http://localhost:8080/campus-navigator-backend/${endpoint}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });
            const result = await res.json();
            if (result.status === "success") {
                setIsModalOpen(false);
                fetchFacilities();
            } else {
                alert(result.message || "Operation failed");
            }
        } catch (err) {
            console.error(err);
            alert("An error occurred while saving.");
        }
    };

    const filteredFacilities = facilities.filter(f => {
        const matchesSearch = f.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                             f.description.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = categoryFilter === "All" || f.category === categoryFilter;
        return matchesSearch && matchesCategory;
    });

    const CATEGORIES = ["All", "Labs", "Food", "Health", "Sports", "Spiritual", "Creative", "Services"];

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500 min-h-full">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-black text-[#111827] tracking-tighter leading-none uppercase">Facilities Management</h1>
                    <p className="text-gray-400 text-[11px] font-bold uppercase tracking-[0.2em] mt-2 italic">Campus Resources & Infrastructure</p>
                </div>

                <button
                    onClick={handleAddClick}
                    className="flex items-center justify-center gap-3 bg-[#111827] hover:bg-black text-white px-8 py-5 rounded-[24px] font-black text-sm uppercase tracking-widest shadow-xl shadow-slate-200 transition-all active:scale-95 group self-start md:self-auto"
                >
                    <Plus size={20} className="group-hover:rotate-90 transition-transform duration-300" />
                    <span>Add New Facility</span>
                </button>
            </div>

            {/* Content Section */}
            <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden flex flex-col min-h-[600px]">
                {/* Internal Toolbar */}
                <div className="px-8 py-6 border-b border-slate-50 flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50/30">
                    <div className="flex items-center gap-2">
                        <Filter size={14} className="text-slate-400" />
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">Filter by category:</span>
                    </div>
                    <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 no-scrollbar">
                        {CATEGORIES.map(cat => (
                            <button
                                key={cat}
                                onClick={() => setCategoryFilter(cat)}
                                className={`px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${categoryFilter === cat ? 'bg-[#111827] text-white shadow-md' : 'bg-white text-slate-400 hover:bg-slate-100 hover:text-slate-600 border border-slate-100'}`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>

                {loading ? (
                    <div className="flex-1 flex flex-col items-center justify-center space-y-4">
                        <div className="w-16 h-16 rounded-3xl bg-slate-50 flex items-center justify-center animate-spin">
                            <Loader2 size={32} className="text-[#111827]" />
                        </div>
                        <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Fetching Campus Data...</p>
                    </div>
                ) : error ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-12">
                        <AlertCircle size={48} className="text-rose-500 mb-4" />
                        <h3 className="text-xl font-black text-slate-900 mb-2 uppercase">Sync Error</h3>
                        <p className="text-slate-400 text-sm font-medium mb-6">{error}</p>
                        <button onClick={fetchFacilities} className="px-6 py-3 bg-rose-50 text-rose-600 rounded-2xl font-bold hover:bg-rose-100 transition-all">Retry Sync</button>
                    </div>
                ) : filteredFacilities.length > 0 ? (
                    <div className="flex-1 overflow-y-auto">
                        <div className="divide-y divide-slate-50">
                            {filteredFacilities.map((f) => (
                                <FacilityAdminRow
                                    key={f.id}
                                    facility={f}
                                    onEdit={handleEditClick}
                                    onDelete={handleDelete}
                                />
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-center max-w-md mx-auto py-20">
                        <div className="w-24 h-24 rounded-[32px] bg-slate-50 flex items-center justify-center mb-8 border border-slate-100">
                            <Map size={40} className="text-slate-200" />
                        </div>
                        <h3 className="text-xl font-black text-slate-900 mb-3 uppercase tracking-tight">No Facilities Listed</h3>
                        <p className="text-slate-400 text-sm font-medium leading-relaxed mb-8">
                            {searchTerm || categoryFilter !== 'All'
                                ? "No campus resources match your current selection."
                                : "The campus directory is currently empty. Start by cataloging your first facility."
                            }
                        </p>
                    </div>
                )}
            </div>

            <FacilityAdminModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                facility={selectedFacility}
                onSave={handleSave}
            />
        </div>
    );
}
