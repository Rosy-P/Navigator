"use client";

import React from "react";
import { X, Calendar, Clock, MapPin, Tag, Plus } from "lucide-react";

interface AddEventModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function AddEventModal({ isOpen, onClose }: AddEventModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div 
                className="absolute inset-0 bg-[#111827]/40 backdrop-blur-sm animate-in fade-in duration-300"
                onClick={onClose}
            />

            {/* Modal Content */}
            <div className="relative bg-white w-full max-w-xl rounded-[40px] shadow-2xl border border-gray-100 overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
                <div className="p-8">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h2 className="text-2xl font-black text-[#111827] tracking-tight">Create New Event</h2>
                            <p className="text-gray-400 text-sm font-medium mt-1">Fill in the details for your campus event</p>
                        </div>
                        <button 
                            onClick={onClose}
                            className="p-3 hover:bg-gray-50 rounded-2xl transition-all text-gray-400 hover:text-red-500"
                        >
                            <X size={24} />
                        </button>
                    </div>

                    <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
                        <div className="space-y-2">
                            <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest ml-1">Event Title</label>
                            <input 
                                type="text" 
                                placeholder="e.g., Annual Cultural Fest"
                                className="w-full bg-gray-50 border-none px-6 py-4 rounded-2xl focus:ring-4 focus:ring-indigo-50 transition-all font-medium"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest ml-1">Date</label>
                                <div className="relative">
                                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                                    <input 
                                        type="date" 
                                        className="w-full bg-gray-50 border-none pl-12 pr-4 py-4 rounded-2xl focus:ring-4 focus:ring-indigo-50 transition-all font-medium text-sm"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest ml-1">Time</label>
                                <div className="relative">
                                    <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                                    <input 
                                        type="time" 
                                        className="w-full bg-gray-50 border-none pl-12 pr-4 py-4 rounded-2xl focus:ring-4 focus:ring-indigo-50 transition-all font-medium text-sm"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest ml-1">Location</label>
                            <div className="relative">
                                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                                <input 
                                    type="text" 
                                    placeholder="e.g., Main Auditorium"
                                    className="w-full bg-gray-50 border-none pl-12 pr-4 py-4 rounded-2xl focus:ring-4 focus:ring-indigo-50 transition-all font-medium"
                                />
                            </div>
                        </div>

                        <div className="pt-4">
                            <button className="w-full bg-[#111827] hover:bg-black text-white py-5 rounded-2xl font-black text-sm tracking-widest uppercase shadow-xl transition-all active:scale-[0.98]">
                                Publish Event
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
