"use client";

import React from "react";
import { Calendar, Clock, MapPin, Edit3, Trash2, CheckCircle2, Timer } from "lucide-react";
import { Event } from "./types";

interface Props {
    event: Event;
    index: number;
    onEdit: (event: Event) => void;
    onDelete: (id: number) => void;
}

const GRADIENTS = [
    "from-yellow-400 to-yellow-300",
    "from-blue-500 to-blue-400",
    "from-teal-500 to-cyan-400",
    "from-purple-500 to-indigo-400"
];

export default function EventCard({ event, index, onEdit, onDelete }: Props) {
    const gradient = GRADIENTS[index % GRADIENTS.length];
    
    // Check if event is in the past
    const eventDate = new Date(event.event_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const isPast = eventDate < today;

    return (
        <div className={`group relative bg-gradient-to-br ${gradient} rounded-[32px] p-6 text-white shadow-xl hover:shadow-2xl hover:scale-[1.02] transition-all duration-500 flex flex-col justify-between min-h-[240px] overflow-hidden`}>
            {/* Background Decorative Element (Inspired by reference) */}
            <div className="absolute top-[-20%] right-[-10%] w-64 h-64 bg-white/10 rounded-full blur-3xl group-hover:bg-white/20 transition-all duration-700" />
            
            <div className="relative z-10">
                <div className="flex justify-between items-start mb-4">
                    <div className="p-2.5 bg-white/20 rounded-xl backdrop-blur-md border border-white/30">
                        <Calendar size={20} className="text-white" />
                    </div>
                    
                    {/* Status Badge */}
                    <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest backdrop-blur-md border ${
                        isPast 
                            ? "bg-red-500 text-white border-red-400" 
                            : "bg-emerald-500 text-white border-emerald-400"
                    }`}>
                        {isPast ? (
                            <>
                                <CheckCircle2 size={10} />
                                <span>Completed</span>
                            </>
                        ) : (
                            <>
                                <Timer size={10} className="animate-pulse" />
                                <span>Upcoming</span>
                            </>
                        )}
                    </div>
                </div>

                <h3 className="text-xl font-black mb-2 leading-tight tracking-tight drop-shadow-sm">
                    {event.title}
                </h3>
                
                <p className="text-white/80 text-xs font-medium leading-relaxed mb-4 line-clamp-2 italic">
                    {event.description || "No description provided for this campus event."}
                </p>

                <div className="space-y-2">
                    <div className="flex items-center gap-2.5 text-white/90">
                        <MapPin size={14} className="shrink-0" />
                        <span className="text-[10px] font-bold uppercase tracking-wider">{event.location}</span>
                    </div>
                    <div className="flex items-center gap-2.5 text-white/90">
                        <Clock size={14} className="shrink-0" />
                        <span className="text-[10px] font-bold uppercase tracking-wider">
                            {new Date(event.event_date).toLocaleDateString(undefined, { dateStyle: 'medium' })} • {event.event_time}
                        </span>
                    </div>
                </div>
            </div>

            {/* Actions */}
            <div className="relative z-10 mt-6 flex justify-end items-center gap-2">
                <button 
                    onClick={() => onEdit(event)}
                    className="p-2.5 rounded-xl bg-white/10 hover:bg-white/25 border border-white/20 transition-all active:scale-90"
                    title="Edit Event"
                >
                    <Edit3 size={16} />
                </button>
                <button 
                    onClick={() => onDelete(event.id)}
                    className="p-2.5 rounded-xl bg-white/10 hover:bg-red-500/30 border border-white/20 hover:border-white/40 transition-all active:scale-90"
                    title="Delete Event"
                >
                    <Trash2 size={16} />
                </button>
            </div>
        </div>
    );
}
