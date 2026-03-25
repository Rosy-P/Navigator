"use client";

import React from "react";
import { Navigation, Calendar, Clock, MapPin } from "lucide-react";
import { Event } from "./types";

interface EventCardProps {
  event: Event;
  onNavigate: (location: string) => void;
  theme: 'light' | 'dark';
}

export default function EventCard({ event, onNavigate, theme }: EventCardProps) {
  const isDark = theme === 'dark';

  return (
    <div className={`
      relative group rounded-2xl p-5 border transition-all duration-200 
      ${isDark 
        ? "bg-gray-900 border-gray-700 shadow-xl shadow-black/20" 
        : "bg-white border-slate-200 shadow-sm hover:shadow-md"}
      hover:-translate-y-1 overflow-hidden flex flex-col
    `}>
      {/* Subtle left accent bar */}
      <div className="absolute left-0 top-0 h-full w-1.5 bg-orange-500 rounded-l-2xl" />

      {/* Header Row */}
      <div className="flex justify-between items-start mb-2">
        <h3 className={`text-lg font-semibold tracking-tight ${isDark ? "text-white" : "text-gray-900"}`}>
          {event.title}
        </h3>
        <span className={`
          text-[10px] font-medium px-3 py-1 rounded-full uppercase tracking-wider 
          ${isDark 
            ? "bg-green-900/40 text-green-400" 
            : "bg-green-100 text-green-700"}
        `}>
          Upcoming
        </span>
      </div>
      
      {/* Description - Spacing: space-y-2 rules applied via margins for fine control */}
      <p className={`text-sm leading-relaxed line-clamp-2 mt-2 ${isDark ? "text-gray-400" : "text-gray-600"}`}>
        {event.description}
      </p>

      {/* Metadata - Spacing: space-y-3 rule (mt-3) */}
      <div className="mt-3 flex flex-col gap-2">
        <div className={`flex items-center gap-2 text-xs ${isDark ? "text-gray-400" : "text-gray-500"}`}>
          <MapPin size={14} className="text-orange-500" />
          <span className="font-medium">{event.location}</span>
        </div>
        
        <div className="flex items-center gap-4">
          <div className={`flex items-center gap-2 text-xs ${isDark ? "text-gray-400" : "text-gray-500"}`}>
            <Calendar size={14} className="text-orange-500 opacity-80" />
            <span className="font-medium">{event.event_date}</span>
          </div>
          <div className={`flex items-center gap-2 text-xs ${isDark ? "text-gray-400" : "text-gray-500"}`}>
            <Clock size={14} className="text-orange-500 opacity-80" />
            <span className="font-medium">{event.event_time}</span>
          </div>
        </div>
      </div>

      {/* Button - Spacing: space-y-4 rule (mt-4) */}
      <button
        onClick={() => onNavigate(event.location)}
        className="
          mt-4 w-full bg-orange-500 hover:bg-orange-600 active:scale-[0.98] 
          text-white text-sm font-medium rounded-xl py-2.5 
          transition-all duration-200 shadow-sm hover:shadow-md flex items-center justify-center gap-2
        "
      >
        <Navigation size={14} fill="currentColor" />
        Navigate
      </button>
    </div>
  );
}
