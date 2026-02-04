"use client";

import { Search, X, Mic, Navigation, Home, Building2, MapPin } from "lucide-react";

interface SearchPanelProps {
    searchQuery: string;
    setSearchQuery: (query: string) => void;
    filteredResults: any[];
    setFilteredResults: (results: any[]) => void;
    isSearchFocused: boolean;
    setIsSearchFocused: (focused: boolean) => void;
    selectedIndex: number;
    setSelectedIndex: (index: number) => void;
    onSelectLandmark: (landmark: any) => void;
    setUiState: (state: any) => void;
    theme: 'light' | 'dark';
    isMobile: boolean;
}

export default function SearchPanel({
    searchQuery,
    setSearchQuery,
    filteredResults,
    setFilteredResults,
    isSearchFocused,
    setIsSearchFocused,
    selectedIndex,
    setSelectedIndex,
    onSelectLandmark,
    setUiState,
    theme,
    isMobile
}: SearchPanelProps) {
    return (
        <div className="flex-1 md:w-[440px] 2xl:w-[500px] relative z-[50]">
            <div className="group relative">
                {/* Outer Shadow Layer */}
                <div className={`
          absolute -inset-1 rounded-[22px] transition-all opacity-0 md:opacity-100
          ${theme === 'dark' ? 'bg-slate-800/20' : 'bg-white/20 shadow-2xl shadow-black/10'}
        `} />

                {/* Inner Layer */}
                <div className={`
          relative h-12 md:h-14 2xl:h-16 px-5 md:px-6 flex items-center gap-3 md:gap-4 rounded-2xl border shadow-xl transition-all
          ${theme === 'dark' ? 'bg-[#1a1c2e] border-slate-700' : 'bg-white border-slate-200'}
        `}>
                    <Search className="text-slate-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search MCC..."
                        value={searchQuery}
                        className={`flex-1 bg-transparent border-none outline-none font-bold text-[14px] 2xl:text-lg placeholder:text-slate-400 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}
                        onFocus={() => {
                            setUiState("SEARCHING");
                            setIsSearchFocused(true);
                        }}
                        onBlur={() => {
                            // Small delay to allow clicking suggestions
                            setTimeout(() => setIsSearchFocused(false), 200);
                        }}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "ArrowDown") {
                                setSelectedIndex(Math.min(selectedIndex + 1, filteredResults.length - 1));
                                e.preventDefault();
                            } else if (e.key === "ArrowUp") {
                                setSelectedIndex(Math.max(selectedIndex - 1, -1));
                                e.preventDefault();
                            } else if (e.key === "Enter") {
                                if (selectedIndex >= 0 && filteredResults[selectedIndex]) {
                                    onSelectLandmark(filteredResults[selectedIndex]);
                                    setSearchQuery("");
                                    setFilteredResults([]);
                                }
                            } else if (e.key === "Escape") {
                                setIsSearchFocused(false);
                                setUiState("IDLE");
                            }
                        }}
                    />

                    {searchQuery && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setSearchQuery("");
                                setFilteredResults([]);
                                setIsSearchFocused(false);
                                setUiState("IDLE");
                            }}
                            className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-400"
                        >
                            <X size={16} />
                        </button>
                    )}

                    <div className="flex items-center gap-2">
                        {!isMobile && (
                            <div className="w-8 h-8 2xl:w-10 2xl:h-10 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors cursor-pointer">
                                <Mic size={18} />
                            </div>
                        )}
                        <div className="w-8 h-8 2xl:w-10 2xl:h-10 bg-orange-500 rounded-xl flex items-center justify-center text-white shadow-lg active:scale-90 transition-transform cursor-pointer">
                            <Navigation size={14} fill="white" />
                        </div>
                    </div>
                </div>

                {/* Auto-complete Dropdown */}
                {isSearchFocused && filteredResults.length > 0 && (
                    <div
                        className={`
              absolute top-full left-0 right-0 mt-2 rounded-[20px] border-2 shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-300 z-[9999]
              ${theme === 'dark' ? 'bg-[#1e293b] border-slate-600' : 'bg-white border-slate-300'}
            `}>
                        <div className="py-2">
                            {filteredResults.map((result, idx) => (
                                <div
                                    key={idx}
                                    className={`
                    px-6 py-3 flex items-center gap-4 cursor-pointer transition-colors
                    ${selectedIndex === idx
                                            ? (theme === 'dark' ? 'bg-slate-800' : 'bg-slate-100')
                                            : (theme === 'dark' ? 'hover:bg-slate-800/80' : 'hover:bg-slate-50')}
                  `}
                                    onMouseDown={(e) => {
                                        e.preventDefault();
                                        onSelectLandmark(result);
                                        setSearchQuery("");
                                        setFilteredResults([]);
                                        setIsSearchFocused(false);
                                        setUiState("PLACE_SELECTED");
                                    }}
                                >
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${theme === 'dark' ? 'bg-slate-700 text-orange-400' : 'bg-orange-100 text-orange-600'}`}>
                                        {result.category === 'Auditorium' && <Home size={18} />}
                                        {result.category === 'Department' && <Building2 size={18} />}
                                        {result.category === 'Hostel' && <Home size={18} />}
                                        {result.category === 'Library' && <Building2 size={18} />}
                                        {(!['Auditorium', 'Department', 'Hostel', 'Library'].includes(result.category)) && <MapPin size={18} />}
                                    </div>
                                    <div className="flex flex-col">
                                        <span className={`text-[14px] 2xl:text-[15px] font-extrabold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                                            {result.name}
                                        </span>
                                        <span className={`text-[11px] 2xl:text-[12px] font-semibold tracking-tight ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                                            {result.category} • {result.floor ? `Floor ${result.floor}` : 'Main Campus'}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
