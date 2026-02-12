"use client";

import React, { useState } from "react";
import { Calendar, Plus, Clock, MapPin, Tag } from "lucide-react";
import { PlaceholderView } from "../components/AdminComponents";
import AddEventModal from "./AddEventModal";

export default function EventsPage() {
    const [isModalOpen, setIsModalOpen] = useState(false);

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500 min-h-full flex flex-col">
            <div className="flex items-center justify-between">
                <div className="lg:hidden">
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight">Events Management</h1>
                    <p className="text-gray-400 font-medium mt-1">Schedule campus activities</p>
                </div>
                <button 
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-2 bg-[#111827] hover:bg-black text-white px-6 py-4 rounded-2xl font-bold transition-all shadow-lg active:scale-95"
                >
                    <Plus size={20} />
                    <span>Create New Event</span>
                </button>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center bg-white rounded-[40px] border border-gray-100 shadow-sm overflow-hidden p-12">
                <PlaceholderView 
                    title="Event Scheduling is Coming Soon" 
                    icon={<Calendar size={64} className="text-gray-100" />} 
                />
                
                <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl opacity-50">
                    <MockEventCard title="Orientation Day" date="Sept 12, 2026" />
                    <MockEventCard title="Tech Symposium" date="Oct 05, 2026" />
                    <MockEventCard title="Annual Sports" date="Nov 20, 2026" />
                </div>
            </div>

            <AddEventModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
        </div>
    );
}

function MockEventCard({ title, date }: { title: string, date: string }) {
    return (
        <div className="bg-gray-50 p-6 rounded-3xl border border-gray-100">
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center mb-4 shadow-sm">
                <Calendar size={18} className="text-gray-400" />
            </div>
            <h4 className="font-bold text-gray-900 mb-1">{title}</h4>
            <p className="text-xs text-gray-400 font-medium">{date}</p>
        </div>
    );
}
