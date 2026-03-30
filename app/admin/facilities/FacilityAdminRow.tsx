"use client";

import React from 'react';
import { Edit2, Trash2, Star, MapPin, Beaker, Utensils, HeartPulse, Trophy, Sparkles, Palette, Briefcase, Filter } from 'lucide-react';
import { Facility } from './types';

interface Props {
    facility: Facility;
    onEdit: (f: Facility) => void;
    onDelete: (id: string) => void;
}

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
    Labs: <Beaker size={14} />,
    Food: <Utensils size={14} />,
    Health: <HeartPulse size={14} />,
    Sports: <Trophy size={14} />,
    Spiritual: <Sparkles size={14} />,
    Creative: <Palette size={14} />,
    Services: <Briefcase size={14} />,
};

export const FacilityAdminRow = ({ facility, onEdit, onDelete }: Props) => {
    const statusStyles = {
        Open: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
        Closed: 'bg-rose-500/10 text-rose-600 border-rose-500/20',
        Crowded: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
    };

    return (
        <div className="group flex items-center gap-6 p-4 hover:bg-slate-50/80 transition-all border-b border-slate-50 last:border-none">
            {/* Thumbnail */}
            <div className="relative w-14 h-14 rounded-2xl overflow-hidden shadow-sm border border-slate-100 flex-shrink-0 bg-slate-50 flex items-center justify-center">
                {facility.image && facility.image.trim() !== '' ? (
                    <img 
                        src={facility.image} 
                        alt={facility.name} 
                        className="w-full h-full object-cover"
                        onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(facility.name) + '&background=f8fafc&color=64748b&font-size=0.33';
                        }}
                    />
                ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-slate-50 text-slate-300">
                        {CATEGORY_ICONS[facility.category] || <MapPin size={24} />}
                    </div>
                )}
                <div className={`absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity`} />
            </div>

            {/* Main Info */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                    <h3 className="text-sm font-black text-slate-900 truncate uppercase tracking-tight">{facility.name}</h3>
                    <div className="flex items-center gap-1 px-1.5 py-0.5 bg-slate-100 rounded-md text-[9px] font-bold text-slate-500 uppercase tracking-wider">
                        {CATEGORY_ICONS[facility.category] || <Filter size={10} />}
                        {facility.category}
                    </div>
                </div>
                <div className="flex items-center gap-4 text-[11px] text-slate-400 font-medium">
                    <div className="flex items-center gap-1">
                        <MapPin size={12} className="text-slate-300" />
                        <span>{facility.latitude.toFixed(4)}, {facility.longitude.toFixed(4)}</span>
                    </div>
                    {facility.phone && facility.phone !== 'N/A' && (
                        <div className="hidden sm:flex items-center gap-1">
                            <span className="w-1 h-1 bg-slate-200 rounded-full" />
                            <span>{facility.phone}</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Status & Rating Bundle (Dashboard Style) */}
            <div className="flex items-center gap-8 px-4">
                <div className="flex flex-col items-center gap-1">
                    <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${statusStyles[facility.status]}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${facility.status === 'Open' ? 'bg-emerald-500' : facility.status === 'Closed' ? 'bg-rose-500' : 'bg-amber-500'} animate-pulse`} />
                        {facility.status}
                    </span>
                </div>

                <div className="hidden md:flex flex-col items-end">
                    <div className="flex items-center gap-1 text-slate-900 font-black text-xs">
                        <Star size={12} fill="#f59e0b" className="text-amber-500" />
                        {facility.rating > 0 ? facility.rating.toFixed(1) : 'NEW'}
                    </div>
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{facility.total_ratings} REVIEWS</span>
                </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 ml-4">
                <button 
                    onClick={() => onEdit(facility)}
                    className="p-2.5 rounded-xl bg-white text-slate-400 hover:text-blue-600 hover:bg-blue-50 border border-slate-100 transition-all active:scale-95 shadow-sm"
                    title="Edit Facility"
                >
                    <Edit2 size={16} />
                </button>
                <button 
                    onClick={() => onDelete(facility.id)}
                    className="p-2.5 rounded-xl bg-white text-slate-400 hover:text-red-600 hover:bg-red-50 border border-slate-100 transition-all active:scale-95 shadow-sm"
                    title="Delete Facility"
                >
                    <Trash2 size={16} />
                </button>
            </div>
        </div>
    );
};
