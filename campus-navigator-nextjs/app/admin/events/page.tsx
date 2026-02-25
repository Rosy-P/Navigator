"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Plus, Calendar, Loader2, Search, SlidersHorizontal, Trash2 } from "lucide-react";
import { PlaceholderView } from "../components/AdminComponents";
import { useAdmin } from "../layout";
import EventCard from "./EventCard";
import EventModal from "./EventModal";
import { Event } from "./types";

export default function EventsPage() {
    const { searchTerm } = useAdmin();
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);

    const fetchEvents = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch("http://localhost:80/campus-navigator-backend/get-events.php", {
                credentials: "include"
            });
            const data = await res.json();
            if (data.status === "success") {
                setEvents(data.events || []);
            }
        } catch (err) {
            console.error("Failed to fetch events:", err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchEvents();
    }, [fetchEvents]);

    const handleAddClick = () => {
        setSelectedEvent(null);
        setIsModalOpen(true);
    };

    const handleEditClick = (event: Event) => {
        setSelectedEvent(event);
        setIsModalOpen(true);
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Are you sure you want to delete this event? This action cannot be undone.")) return;

        try {
            const res = await fetch("http://localhost:80/campus-navigator-backend/delete-event.php", {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id }),
            });
            const data = await res.json();
            if (data.status === "success") {
                fetchEvents();
            } else {
                alert(data.message || "Delete failed");
            }
        } catch (err) {
            console.error(err);
            alert("An error occurred during deletion");
        }
    };

    const handleCleanup = async () => {
        if (!confirm("Are you sure you want to delete all events created more than 30 days ago?")) return;

        try {
            const res = await fetch("http://localhost:80/campus-navigator-backend/cleanup-events.php", {
                method: "POST",
                credentials: "include",
            });
            const data = await res.json();
            if (data.status === "success") {
                alert(`Cleanup successful! Deleted ${data.deleted_count} old events.`);
                fetchEvents();
            } else {
                alert(data.message || "Cleanup failed");
            }
        } catch (err) {
            console.error(err);
            alert("An error occurred during cleanup");
        }
    };

    const filteredEvents = events.filter(e =>
        e.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.location.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500 min-h-full">
            {/* Header Section - Title & Action Row */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-black text-[#111827] tracking-tighter leading-none">Events Management</h1>
                    <p className="text-gray-400 text-[11px] font-bold uppercase tracking-[0.2em] mt-2 italic">Campus Activities & Scheduling</p>
                </div>

                <div className="flex gap-4">
                    <button
                        onClick={handleCleanup}
                        className="flex items-center justify-center gap-3 bg-red-50 hover:bg-red-100 text-red-600 px-6 py-5 rounded-[24px] font-black text-sm uppercase tracking-widest transition-all active:scale-95 group border border-red-100"
                    >
                        <Trash2 size={20} />
                        <span>Cleanup Old</span>
                    </button>
                    <button
                        onClick={handleAddClick}
                        className="flex items-center justify-center gap-3 bg-[#111827] hover:bg-black text-white px-8 py-5 rounded-[24px] font-black text-sm uppercase tracking-widest shadow-xl shadow-slate-200 transition-all active:scale-95 group"
                    >
                        <Plus size={20} className="group-hover:rotate-90 transition-transform duration-300" />
                        <span>Create New Event</span>
                    </button>
                </div>
            </div>

            {/* Content Section */}
            <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden p-8 lg:p-12 min-h-[600px] flex flex-col">

                {loading ? (
                    <div className="flex-1 flex flex-col items-center justify-center space-y-4">
                        <div className="w-16 h-16 rounded-3xl bg-slate-50 flex items-center justify-center animate-spin">
                            <Loader2 size={32} className="text-indigo-600" />
                        </div>
                        <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Loading Events Data...</p>
                    </div>
                ) : filteredEvents.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 w-full">
                        {filteredEvents.map((event, index) => (
                            <EventCard
                                key={event.id}
                                event={event}
                                index={index}
                                onEdit={handleEditClick}
                                onDelete={handleDelete}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-center max-w-md mx-auto py-20">
                        <div className="w-24 h-24 rounded-[32px] bg-slate-50 flex items-center justify-center mb-8 border border-slate-100">
                            <Calendar size={40} className="text-slate-200" />
                        </div>
                        <h3 className="text-xl font-black text-slate-900 mb-3 uppercase tracking-tight">No Events Found</h3>
                        <p className="text-slate-400 text-sm font-medium leading-relaxed mb-8">
                            {searchTerm
                                ? `We couldn't find any events matching "${searchTerm}". Try a different search term.`
                                : "Your events dashboard is currently empty. Start by creating your first campus event."
                            }
                        </p>
                        {!searchTerm && (
                            <button
                                onClick={handleAddClick}
                                className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-bold text-sm shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95 flex items-center gap-2"
                            >
                                <Plus size={18} />
                                Create First Event
                            </button>
                        )}
                    </div>
                )}
            </div>

            <EventModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                selectedEvent={selectedEvent}
                onSuccess={fetchEvents}
            />
        </div>
    );
}
