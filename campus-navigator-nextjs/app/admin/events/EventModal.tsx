"use client";

import React, { useState, useEffect } from "react";
import { X, Save, Calendar, Clock, MapPin, Type, AlignLeft, Loader2 } from "lucide-react";
import { Event } from "./types";

interface Props {
    isOpen: boolean;
    onClose: () => void;
    selectedEvent: Event | null;
    onSuccess: () => void;
}

export default function EventModal({ isOpen, onClose, selectedEvent, onSuccess }: Props) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        title: "",
        description: "",
        location: "",
        event_date: "",
        event_time: ""
    });

    useEffect(() => {
        if (selectedEvent) {
            setFormData({
                title: selectedEvent.title,
                description: selectedEvent.description || "",
                location: selectedEvent.location,
                event_date: selectedEvent.event_date,
                event_time: selectedEvent.event_time
            });
        } else {
            setFormData({
                title: "",
                description: "",
                location: "",
                event_date: "",
                event_time: ""
            });
        }
    }, [selectedEvent, isOpen]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        const endpoint = selectedEvent ? "update-event.php" : "create-event.php";
        const body = selectedEvent 
            ? { ...formData, id: selectedEvent.id }
            : formData;

        try {
            const res = await fetch(`http://localhost:8080/campus-navigator-backend/${endpoint}`, {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });

            const data = await res.json();
            if (data.status === "success") {
                onSuccess();
                onClose();
            } else {
                alert(data.message || "Operation failed");
            }
        } catch (err) {
            console.error(err);
            alert("An error occurred. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div 
                className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300"
                onClick={onClose}
            />

            {/* Modal Box */}
            <div className="relative w-full max-w-lg bg-white rounded-[32px] shadow-2xl overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-8 duration-500">
                <div className="p-8">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                                {selectedEvent ? "Update Event" : "Create Event"}
                            </h2>
                            <p className="text-slate-400 text-sm font-medium">Enter the details for your campus event</p>
                        </div>
                        <button 
                            onClick={onClose}
                            className="p-2 hover:bg-slate-50 rounded-full transition-colors text-slate-400 hover:text-slate-900"
                        >
                            <X size={24} />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-4">
                            {/* Title */}
                            <div>
                                <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 px-1">
                                    <Type size={12} className="text-indigo-500" /> Event Title
                                </label>
                                <input 
                                    required
                                    type="text"
                                    value={formData.title}
                                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                                    placeholder="Enter event name..."
                                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-sm font-bold text-slate-900 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                                />
                            </div>

                            {/* Location */}
                            <div>
                                <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 px-1">
                                    <MapPin size={12} className="text-emerald-500" /> Venue Location
                                </label>
                                <input 
                                    required
                                    type="text"
                                    value={formData.location}
                                    onChange={(e) => setFormData({...formData, location: e.target.value})}
                                    placeholder="e.g. Main Auditorium"
                                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-sm font-bold text-slate-900 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                                />
                            </div>

                            {/* Date & Time Grid */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 px-1">
                                        <Calendar size={12} className="text-amber-500" /> Date
                                    </label>
                                    <input 
                                        required
                                        type="date"
                                        value={formData.event_date}
                                        onChange={(e) => setFormData({...formData, event_date: e.target.value})}
                                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 px-1">
                                        <Clock size={12} className="text-blue-500" /> Time
                                    </label>
                                    <input 
                                        required
                                        type="time"
                                        value={formData.event_time}
                                        onChange={(e) => setFormData({...formData, event_time: e.target.value})}
                                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                                    />
                                </div>
                            </div>

                            {/* Description */}
                            <div>
                                <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 px-1">
                                    <AlignLeft size={12} className="text-purple-500" /> Description
                                </label>
                                <textarea 
                                    value={formData.description}
                                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                                    placeholder="Optional details about the event..."
                                    rows={3}
                                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-sm font-bold text-slate-900 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all resize-none"
                                />
                            </div>
                        </div>

                        {/* Submit Button */}
                        <div className="pt-4">
                            <button 
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full bg-[#111827] hover:bg-black text-white px-8 py-5 rounded-3xl font-black text-sm uppercase tracking-widest shadow-xl shadow-slate-200 hover:shadow-2xl transition-all active:scale-[0.98] flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                                {selectedEvent ? "Save Changes" : "Create Event"}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
