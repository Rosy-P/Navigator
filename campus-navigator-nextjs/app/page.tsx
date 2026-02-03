"use client";

import { useState, useCallback, useEffect } from "react";
import { Search, Map as MapIcon, Home, Microscope, UtensilsCrossed, Mic } from "lucide-react";
import Sidebar from "./components/Sidebar";
import MapView from "./components/MapView";
import MapControls from "./components/MapControls";
import InfoPanel from "./components/InfoPanel";
import SettingsOverlay from "./components/SettingsOverlay";
import NavigationOverlay from "./components/NavigationOverlay";

export default function HomePage() {
  // Navigation States
  const [startLocation, setStartLocation] = useState<[number, number] | undefined>();
  const [startLabel, setStartLabel] = useState<string>("");
  const [isSelectingStart, setIsSelectingStart] = useState(false);
  const [isPlanning, setIsPlanning] = useState(false);
  const [isGuidanceActive, setIsGuidanceActive] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [destination, setDestination] = useState<[number, number] | undefined>();
  const [routeInfo, setRouteInfo] = useState<{ distance: number; time: number } | null>(null);
  const [selectedLandmark, setSelectedLandmark] = useState<any>(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [pendingPickerLocation, setPendingPickerLocation] = useState<[number, number] | undefined>();
  const [originType, setOriginType] = useState<"gps" | "manual" | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [recenterCount, setRecenterCount] = useState(0);
  const [currentInstruction, setCurrentInstruction] = useState("Continue straight");
  const [currentDistance, setCurrentDistance] = useState("60m");

  // Settings States
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState({
    mapStyle: "voyager",
    simulationSpeed: "normal",
    appearance: "light",
    notifications: true,
    locationAccuracy: true
  });

  const handleUpdateSetting = useCallback((key: string, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  }, []);

  const handleResetSettings = useCallback(() => {
    setSettings({
      mapStyle: "voyager",
      simulationSpeed: "normal",
      appearance: "light",
      notifications: true,
      locationAccuracy: true
    });
  }, []);

  const handleClearHistory = useCallback(() => {
    alert("Search history has been cleared.");
  }, []);

  const handleGetGPSLocation = () => {
    const mainGate: [number, number] = [80.120584, 12.923163];
    setStartLocation(mainGate);
    setStartLabel("Main Gate (My Location)");
    setOriginType("gps");
  };

  const handlePickOnMapRequested = () => {
    setIsSelectingStart(true);
    setPendingPickerLocation(undefined);
  };

  const handleLocationSelectedOnMap = (coord: [number, number]) => {
    setPendingPickerLocation(coord);
  };

  const handleConfirmLocation = () => {
    if (pendingPickerLocation) {
      setStartLocation(pendingPickerLocation);
      setStartLabel("Point on Map");
      setOriginType("manual");
      setIsSelectingStart(false);
      setPendingPickerLocation(undefined);
    }
  };

  const handleCancelPicking = () => {
    setIsSelectingStart(false);
    setPendingPickerLocation(undefined);
  };

  const handleSelectLandmark = (landmark: any) => {
    setSelectedLandmark(landmark);
    setIsSidebarCollapsed(true);
    // If we already have a start location, stay in planning mode to show the route
    setIsPlanning(!!startLocation);
    setRouteInfo(null);
    setDestination([landmark.lng, landmark.lat]);
    setStartLocation(undefined);
    setStartLabel("");
    setOriginType(null);
    setIsSelectingStart(false);
    setIsGuidanceActive(false);
    setIsDemoMode(false);
  };

  const quickActions = {
    hostel: [80.1199855, 12.9221401] as [number, number],
    lab: [80.1396, 12.9186] as [number, number],
    canteen: [80.12273, 12.92034] as [number, number],
  };

  const handleRouteCalculated = (distance: number) => {
    const timeInMinutes = Math.round(distance / 1.4 / 60);
    setRouteInfo({ distance, time: timeInMinutes });
  };

  const theme = settings.appearance as 'light' | 'dark';

  return (
    <div className={`h-screen w-screen relative flex overflow-hidden transition-colors duration-500 ${theme === 'dark' ? 'bg-[#0f172a]' : 'bg-white'}`}>
      {/* Sidebar */}
      <Sidebar
        isCollapsed={isSidebarCollapsed}
        onOpenSettings={() => setShowSettings(true)}
        forceActiveLabel={showSettings ? "Settings" : (selectedLandmark ? "Locations" : undefined)}
      />

      {/* Main Content Area */}
      <main className="flex-1 relative transition-all duration-300 overflow-hidden">
        {/* The Map */}
        <div className="absolute inset-0 z-0">
          <MapView
            startLocation={startLocation}
            destination={destination}
            pendingLocation={pendingPickerLocation}
            isSelectingStart={isSelectingStart}
            isGuidanceActive={isGuidanceActive}
            isDemoMode={isDemoMode}
            mapStyle={settings.mapStyle}
            simulationSpeed={settings.simulationSpeed}
            onLocationSelected={handleLocationSelectedOnMap}
            onSelectLandmark={handleSelectLandmark}
            onRouteCalculated={handleRouteCalculated}
            isPaused={isPaused}
            recenterCount={recenterCount}
            onSimulationUpdate={(coord, path, instruction, distance) => {
              setCurrentInstruction(instruction);
              setCurrentDistance(distance);
            }}
          />
        </div>

        {/* Navigation Overlay */}
        {isGuidanceActive && (
          <NavigationOverlay
            isPaused={isPaused}
            isMuted={isMuted}
            onPauseToggle={() => setIsPaused(!isPaused)}
            onMuteToggle={() => setIsMuted(!isMuted)}
            onEndNavigation={() => {
              setIsGuidanceActive(false);
              setIsDemoMode(false);
              setDestination(undefined);
              setRouteInfo(null);
              setIsPaused(false);
              setIsSidebarCollapsed(false);
              setSelectedLandmark(null);
              setIsPlanning(false);
            }}
            onRecenter={() => setRecenterCount(prev => prev + 1)}
            instruction={currentInstruction}
            distance={currentDistance}
            totalDistance={routeInfo ? `${Math.round(routeInfo.distance)} m` : undefined}
            totalTime={routeInfo ? `${routeInfo.time} min` : undefined}
            theme={theme}
          />
        )}

        {/* Route Info Card */}
        {routeInfo && !isGuidanceActive && (
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-40 animate-in fade-in slide-in-from-bottom-5 duration-500">
            <div className={`px-6 py-4 backdrop-blur-2xl border rounded-3xl shadow-[0_25px_50px_-12px_rgba(0,0,0,0.15)] flex items-center gap-6 ${theme === 'dark' ? 'bg-slate-900/80 border-slate-700/60' : 'bg-white/80 border-white/60'}`}>
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Estimated Time</span>
                <span className={`text-2xl font-black leading-none ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{routeInfo.time} min</span>
              </div>
              <div className="w-px h-8 bg-slate-200" />
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Distance</span>
                <span className="text-xl font-bold text-orange-500 leading-none">{Math.round(routeInfo.distance)} m</span>
              </div>
              <button
                onClick={() => {
                  setDestination(undefined);
                  setRouteInfo(null);
                  setIsGuidanceActive(false);
                  setIsDemoMode(false);
                }}
                className={`ml-2 w-10 h-10 flex items-center justify-center rounded-2xl transition-colors shadow-lg active:scale-95 ${theme === 'dark' ? 'bg-orange-500 text-white hover:bg-orange-600' : 'bg-slate-900 text-white hover:bg-slate-800'}`}
              >
                <Search size={18} />
              </button>
            </div>
          </div>
        )}

        {/* PREMIUM SEARCH BAR */}
        {!isGuidanceActive && (
          <div className="absolute top-8 left-1/2 -translate-x-1/2 z-30 w-full max-w-lg px-4 animate-in fade-in duration-500">
            <div className={`flex items-center gap-2 p-1.5 backdrop-blur-xl border rounded-[24px] shadow-[0_25px_60px_rgba(0,0,0,0.12)] transition-all group ${theme === 'dark' ? 'bg-slate-900/40 border-slate-700/60 hover:bg-slate-900/60' : 'bg-white/40 border-white/60 hover:bg-white/60'}`}>
              <div className={`flex-1 flex items-center gap-3 pl-4 pr-1 rounded-[20px] h-12 shadow-sm border transition-all focus-within:ring-2 focus-within:ring-orange-500/5 ${theme === 'dark' ? 'bg-slate-900 border-slate-800 focus-within:border-slate-600' : 'bg-white border-slate-100 focus-within:border-orange-200'}`}>
                <Search className="text-slate-400 group-focus-within:text-orange-500 transition-colors" size={18} />
                <input
                  className={`w-full bg-transparent outline-none text-[14.5px] placeholder:text-slate-500 font-semibold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}
                  placeholder="Search campus..."
                />
                <button className="px-3 py-2 text-slate-300 hover:text-slate-600 transition-colors">
                  <Mic size={18} />
                </button>
              </div>
              <button
                onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                className={`flex items-center justify-center w-12 h-12 rounded-[20px] transition-all shadow-lg active:scale-95 group/btn ${theme === 'dark' ? 'bg-orange-500 text-white hover:bg-orange-600' : 'bg-[#111827] text-white hover:bg-slate-800'}`}
              >
                <MapIcon size={18} className="group-hover/btn:scale-110 transition-transform" />
              </button>
            </div>
          </div>
        )}

        {/* Info Panel */}
        {selectedLandmark && !isSelectingStart && (
          <InfoPanel
            landmark={selectedLandmark}
            startLabel={startLabel}
            isPlanning={isPlanning}
            onSetPlanning={(p) => setIsPlanning(p)}
            onClose={() => {
              setSelectedLandmark(null);
              setIsSidebarCollapsed(false);
              setDestination(undefined);
              setStartLocation(undefined);
              setStartLabel("Current Location");
              setOriginType(null);
              setRouteInfo(null);
              setIsSelectingStart(false);
              setIsGuidanceActive(false);
              setIsPlanning(false);
              setIsDemoMode(false);
            }}
            onGetGPSLocation={handleGetGPSLocation}
            onPickOnMap={handlePickOnMapRequested}
            originType={originType}
            onStartNavigation={(coord) => {
              setDestination(coord);
              setIsGuidanceActive(true);
              setIsDemoMode(false);
              setSelectedLandmark(null);
            }}
            onStartDemo={() => {
              setIsGuidanceActive(true);
              setIsDemoMode(true);
              setSelectedLandmark(null);
            }}
          />
        )}

        {/* Confirmation Footer for Map Picking */}
        {isSelectingStart && (
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-[100] animate-in slide-in-from-bottom-5 duration-500">
            <div className={`backdrop-blur-2xl border rounded-3xl shadow-[0_25px_50px_-12px_rgba(0,0,0,0.15)] p-4 flex flex-col gap-3 min-w-[280px] ${theme === 'dark' ? 'bg-slate-900/80 border-slate-700/60' : 'bg-white/80 border-white/60'}`}>
              <div className="text-center px-4">
                <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1">Choosing Origin</p>
                <p className={`text-[14px] font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                  {pendingPickerLocation ? "Location Selected" : "Tap on map to pick origin"}
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleCancelPicking}
                  className={`flex-1 h-11 rounded-xl font-black text-[14px] transition-all active:scale-95 ${theme === 'dark' ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                >
                  Cancel
                </button>
                <button
                  disabled={!pendingPickerLocation}
                  onClick={handleConfirmLocation}
                  className={`flex-1 h-11 rounded-xl font-black text-[14px] flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg ${pendingPickerLocation
                    ? (theme === 'dark' ? "bg-orange-500 text-white hover:bg-orange-600" : "bg-[#111827] text-white hover:bg-[#fb923c]")
                    : (theme === 'dark' ? "bg-slate-800 text-slate-600 cursor-not-allowed" : "bg-slate-50 text-slate-300 cursor-not-allowed")
                    }`}
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Custom Map Controls */}
        {!isGuidanceActive && (
          <div className="absolute bottom-8 right-8 z-30 scale-90">
            <MapControls onZoomIn={() => { }} onZoomOut={() => { }} />
          </div>
        )}

        {/* Settings Overlay */}
        <SettingsOverlay
          isOpen={showSettings}
          onClose={() => setShowSettings(false)}
          theme={theme}
          settings={settings}
          onUpdateSetting={handleUpdateSetting}
          onReset={handleResetSettings}
          onClearHistory={handleClearHistory}
        />

        {/* Right Side Action Buttons */}
        {!isGuidanceActive && (
          <div className="absolute top-10 right-8 z-30 flex flex-col gap-3 animate-in slide-in-from-right-10 duration-500">
            <QuickActionBtn icon={<Home size={18} />} label="Hostel" onClick={() => setDestination(quickActions.hostel)} theme={theme} />
            <QuickActionBtn icon={<Microscope size={18} />} label="Lab" onClick={() => setDestination(quickActions.lab)} theme={theme} />
            <QuickActionBtn icon={<UtensilsCrossed size={18} />} label="Canteen" onClick={() => setDestination(quickActions.canteen)} theme={theme} />
          </div>
        )}
      </main>
    </div>
  );
}

function QuickActionBtn({ icon, label, onClick, theme }: { icon: React.ReactNode; label: string; onClick?: () => void; theme: 'light' | 'dark' }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-3 px-4 h-11 backdrop-blur-md border shadow-[0_10px_35px_rgba(0,0,0,0.05)] rounded-xl font-bold transition-all group active:scale-95 ${theme === 'dark' ? 'bg-slate-900/90 border-slate-700/50 text-white hover:bg-slate-800' : 'bg-white/90 border-white/50 text-slate-800 hover:bg-white'}`}
    >
      <div className={`w-8 h-8 flex items-center justify-center rounded-lg text-orange-500 transition-colors ${theme === 'dark' ? 'bg-slate-800 group-hover:bg-slate-700' : 'bg-slate-50 group-hover:bg-orange-50'}`}>
        {icon}
      </div>
      <span className="text-[13px] tracking-tight">{label}</span>
    </button>
  );
}
