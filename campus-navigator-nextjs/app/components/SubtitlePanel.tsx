"use client";

import { useEffect, useState } from "react";
import { SpeechService } from "../lib/speech/SpeechService";
import { Navigation, Compass, MessageSquare } from "lucide-react";

export default function SubtitlePanel({ theme = "light", isVisible = true }: { theme?: "light" | "dark", isVisible?: boolean }) {
    const [subtitle, setSubtitle] = useState<string | null>(null);
    const [type, setType] = useState<"NAV" | "TOUR" | null>(null);
    const [isFading, setIsFading] = useState(false);

    useEffect(() => {
        const speechService = SpeechService.getInstance();
        speechService.setSubtitleCallback((text) => {
            const currentType = speechService.getCurrentType();
            
            // Only show subtitles for TOUR stories, not NAV commands
            if (text && currentType === "TOUR") {
                setSubtitle(text);
                setType(currentType);
                setIsFading(false);
            } else if (!text) {
                setIsFading(true);
                setTimeout(() => {
                    setSubtitle(null);
                    setType(null);
                }, 500);
            }
        });

        return () => speechService.setSubtitleCallback(() => {});
    }, []);

    if (!isVisible || (!subtitle && !isFading)) return null;

    return (
        <div className={`
            fixed bottom-36 left-1/2 -translate-x-1/2 z-[40] w-[90%] max-w-[600px] 
            transition-all duration-500 transform
            ${isFading ? "opacity-0 translate-y-2" : "opacity-100 translate-y-0"}
        `}>
            <div className={`
                backdrop-blur-xl border p-4 rounded-2xl shadow-2xl flex items-start gap-4
                ${theme === "dark" ? "bg-slate-900/80 border-slate-700/60" : "bg-white/80 border-white/60"}
            `}>
                <div className={`
                    w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0
                    ${type === "NAV" ? "bg-blue-500/10 text-blue-500" : "bg-orange-500/10 text-orange-500"}
                `}>
                    {type === "NAV" ? <Navigation size={20} /> : <Compass size={20} />}
                </div>
                
                <div className="flex-1 min-w-0">
                    <p className={`
                        text-[13px] 2xl:text-base font-medium leading-relaxed
                        ${theme === "dark" ? "text-slate-200" : "text-slate-700"}
                    `}>
                        {subtitle}
                    </p>
                </div>
            </div>
        </div>
    );
}
