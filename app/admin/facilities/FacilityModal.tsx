"use client";

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { Facility } from './types';

const CATEGORIES = [
    { id: 'Labs', label: 'Labs' },
    { id: 'Food', label: 'Food' },
    { id: 'Health', label: 'Health' },
    { id: 'Sports', label: 'Sports' },
    { id: 'Spiritual', label: 'Spiritual' },
    { id: 'Creative', label: 'Creative' },
    { id: 'Services', label: 'Services' },
];

export const FacilityAdminModal = ({ 
    isOpen, 
    onClose, 
    facility, 
    onSave 
}: { 
    isOpen: boolean; 
    onClose: () => void; 
    facility?: Facility | null; 
    onSave: (data: any) => Promise<void>;
}) => {
    const [formData, setFormData] = useState<any>({
        name: '',
        category: 'Labs',
        description: '',
        status: 'Open',
        image: '',
        latitude: 12.9230,
        longitude: 80.1240,
        hours: '09:00 - 17:00',
        phone: 'N/A'
    });

    useEffect(() => {
        if (facility) {
            setFormData(facility);
        } else {
            setFormData({
                name: '',
                category: 'Labs',
                description: '',
                status: 'Open',
                image: '',
                latitude: 12.9230,
                longitude: 80.1240,
                hours: '09:00 - 17:00',
                phone: 'N/A'
            });
        }
    }, [facility, isOpen]);

    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);

    if (!isOpen || !mounted) return null;

    return createPortal(
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white w-full max-w-lg rounded-[32px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="p-8">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-black text-slate-900">{facility ? 'Edit Facility' : 'Add New Facility'}</h2>
                        <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><X size={20} /></button>
                    </div>

                    <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Name</label>
                                <input 
                                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-orange-500/20 transition-all outline-none"
                                    value={formData.name || ''}
                                    onChange={e => setFormData({...formData, name: e.target.value})}
                                    placeholder="e.g. Zoology Lab"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Category</label>
                                <select 
                                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-orange-500/20 transition-all outline-none"
                                    value={formData.category || 'Labs'}
                                    onChange={e => setFormData({...formData, category: e.target.value})}
                                >
                                    {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                                </select>
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Description</label>
                            <textarea 
                                className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-orange-500/20 transition-all outline-none min-h-[100px]"
                                value={formData.description || ''}
                                onChange={e => setFormData({...formData, description: e.target.value})}
                                placeholder="Brief description of the facility..."
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Status</label>
                                <select 
                                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-orange-500/20 transition-all outline-none"
                                    value={formData.status || 'Open'}
                                    onChange={e => setFormData({...formData, status: e.target.value as any})}
                                >
                                    <option value="Open">Open</option>
                                    <option value="Closed">Closed</option>
                                    <option value="Crowded">Crowded</option>
                                </select>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Image URL</label>
                                <input 
                                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-orange-500/20 transition-all outline-none"
                                    value={formData.image || ''}
                                    onChange={e => setFormData({...formData, image: e.target.value})}
                                    placeholder="https://..."
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Latitude</label>
                                <input 
                                    type="number" step="0.0001"
                                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-orange-500/20 transition-all outline-none"
                                    value={formData.latitude ?? 12.9230}
                                    onChange={e => setFormData({...formData, latitude: parseFloat(e.target.value) || 0})}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Longitude</label>
                                <input 
                                    type="number" step="0.0001"
                                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-orange-500/20 transition-all outline-none"
                                    value={formData.longitude ?? 80.1240}
                                    onChange={e => setFormData({...formData, longitude: parseFloat(e.target.value) || 0})}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Hours</label>
                                <input 
                                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-orange-500/20 transition-all outline-none"
                                    value={formData.hours || ''}
                                    onChange={e => setFormData({...formData, hours: e.target.value})}
                                    placeholder="09:00 - 17:00"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Phone</label>
                                <input 
                                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-orange-500/20 transition-all outline-none"
                                    value={formData.phone || ''}
                                    onChange={e => setFormData({...formData, phone: e.target.value})}
                                    placeholder="Ext 123"
                                />
                            </div>
                        </div>


                    </div>

                    <div className="mt-8 flex gap-3">
                        <button onClick={onClose} className="flex-1 px-6 py-4 rounded-2xl bg-slate-100 text-slate-600 font-bold hover:bg-slate-200 transition-all active:scale-95">Cancel</button>
                        <button onClick={() => onSave(formData)} className="flex-[2] px-6 py-4 rounded-2xl bg-orange-600 text-white font-bold hover:bg-orange-700 shadow-lg shadow-orange-500/20 transition-all active:scale-95">
                            {facility ? 'Save Changes' : 'Create Facility'}
                        </button>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
};
