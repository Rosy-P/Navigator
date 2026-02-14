"use client";

import React, { useEffect, useState } from "react";
import { X, Calendar, Loader2 } from "lucide-react";
import EventCard from "./EventCard";
import { Event } from "./types";

interface EventsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (location: string) => void;
  theme: 'light' | 'dark';
}

export default function EventsPanel({ isOpen, onClose, onNavigate, theme }: EventsPanelProps) {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const isDark = theme === 'dark';

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      fetch("http://localhost:8080/campus-navigator-backend/get-events.php", {
        credentials: "include"
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.status === "success") {
            setEvents(data.events || []);
          }
        })
        .catch((err) => console.error("Failed to fetch events:", err))
        .finally(() => setLoading(false));
    }
  }, [isOpen]);

  return (
    <>
      {/* Overlay - SaaS Quality backdrop */}
      <div
        className={`fixed inset-0 bg-black/40 backdrop-blur-sm z-40 transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />

      {/* Slide-in Panel - SaaS Quality Container */}
      <div
        className={`
          fixed top-0 right-0 h-full w-[380px] shadow-xl shadow-black/5 z-50 
          transform transition-transform duration-300 ease-out rounded-l-3xl 
          flex flex-col overflow-hidden
          ${isOpen ? "translate-x-0" : "translate-x-full"} 
          ${isDark ? "bg-gray-900 border-l border-white/5" : "bg-white"}
        `}
      >
        {/* Header Section - Defined rhythm */}
        <div className="p-6 border-b border-slate-100 dark:border-white/5 flex flex-col gap-1 relative">
          <button
            onClick={onClose}
            className={`
              absolute top-6 right-6 p-2 rounded-full transition-all active:scale-90
              ${isDark ? "hover:bg-white/5 text-gray-400" : "hover:bg-slate-100 text-slate-400"}
            `}
          >
            <X size={20} />
          </button>
          
          <div className="space-y-2">
            <h2 className={`text-xl font-semibold tracking-tight ${isDark ? "text-white" : "text-gray-900"}`}>
              Campus Events
            </h2>
            <p className={`text-xs uppercase tracking-wider ${isDark ? "text-gray-400" : "text-gray-500"}`}>
              Stay updated with MCC
            </p>
          </div>
        </div>

        {/* Content Area - Minimal scroll area */}
        <div className="flex-1 overflow-y-auto px-6 pb-6 space-y-5 custom-scrollbar mt-6">
          {loading ? (
            <div className="h-full flex flex-col items-center justify-center gap-3 py-20">
              <Loader2 size={24} className="text-orange-600 animate-spin" />
              <span className={`text-xs font-bold uppercase tracking-widest ${isDark ? "text-gray-600" : "text-gray-400"}`}>
                Syncing events...
              </span>
            </div>
          ) : events.length > 0 ? (
            <div className="grid gap-5">
              {events.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  onNavigate={(location) => {
                    onNavigate(location);
                    onClose();
                  }}
                  theme={theme}
                />
              ))}
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center px-4 py-20">
              <div className={`w-16 h-16 rounded-3xl mb-6 flex items-center justify-center border shadow-sm ${isDark ? "bg-gray-800 border-white/5" : "bg-slate-50 border-slate-100"}`}>
                <Calendar size={28} className={isDark ? "text-gray-600" : "text-slate-300"} />
              </div>
              <h3 className={`text-base font-bold mb-2 uppercase tracking-tight ${isDark ? "text-white" : "text-gray-800"}`}>
                No Active Events
              </h3>
              <p className={`text-xs leading-relaxed ${isDark ? "text-gray-500" : "text-slate-400"}`}>
                Check back later for upcoming campus workshops, fests, and programs.
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
