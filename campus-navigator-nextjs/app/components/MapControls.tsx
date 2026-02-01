"use client";

import { Plus, Minus } from "lucide-react";

export default function MapControls({
    onZoomIn,
    onZoomOut
}: {
    onZoomIn: () => void;
    onZoomOut: () => void;
}) {
    return (
        <div className="flex flex-col gap-1 p-1 bg-white/90 backdrop-blur-md border border-white shadow-[0_10px_30px_rgba(0,0,0,0.08)] rounded-xl overflow-hidden">
            <button
                onClick={onZoomIn}
                className="w-10 h-10 flex items-center justify-center text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-all active:scale-95 rounded-lg"
                title="Zoom In"
            >
                <Plus size={18} strokeWidth={2.5} />
            </button>
            <div className="h-px w-6 mx-auto bg-slate-100" />
            <button
                onClick={onZoomOut}
                className="w-10 h-10 flex items-center justify-center text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-all active:scale-95 rounded-lg"
                title="Zoom Out"
            >
                <Minus size={18} strokeWidth={2.5} />
            </button>
        </div>
    );
}
