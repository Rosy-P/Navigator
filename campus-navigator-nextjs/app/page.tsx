"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Search, Building2, MapPin, Menu, X, Mic, Navigation, Home, Map as MapIcon, Microscope, UtensilsCrossed, Zap } from "lucide-react";
import Sidebar from "./components/Sidebar";
import MapView from "./components/MapView";
import MapControls from "./components/MapControls";
import InfoPanel from "./components/InfoPanel";
import SettingsOverlay from "./components/SettingsOverlay";
import NavigationOverlay from "./components/NavigationOverlay";
import SearchPanel from "./components/SearchPanel";
import QuickActions from "./components/QuickActions";
import SubtitlePanel from "./components/SubtitlePanel";
import EventsPanel from "./components/events/EventsPanel";
import AuthProvider, { useAuth, UserData } from "./components/AuthOverlay"; // Updated Import
import { useMediaQuery } from "./hooks/use-media-query";
import { useSearchParams, useRouter } from 'next/navigation';
import { SpeechService } from "./lib/speech/SpeechService";
import { useSimulation } from "./context/SimulationContext";


type UIState = "IDLE" | "SEARCHING" | "PLACE_SELECTED" | "NAVIGATION_ACTIVE";
type SheetState = "PEEK" | "HALF" | "FULL";

// --- Wrapper Component ---
export default function HomePage() {
  return <HomeContent />;
}

function HomeContent() {
  // Version: 2.1.0 - Soft Auth Integrated
  const isMobile = useMediaQuery("(max-width: 768px)");

  // Auth Hook
  const { user, requireAuth, showAuthOverlay, logout } = useAuth();

  // UI States
  const [uiState, setUiState] = useState<UIState>("IDLE");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [sheetState, setSheetState] = useState<SheetState>("HALF");

  // Navigation States
  const [startLocation, setStartLocation] = useState<[number, number] | undefined>();
  const [startLabel, setStartLabel] = useState<string>("");
  const [isSelectingStart, setIsSelectingStart] = useState(false);
  const [isPlanning, setIsPlanning] = useState(false);
  const [isGuidanceActive, setIsGuidanceActive] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [isTourMode, setIsTourMode] = useState(false);
  const [isTourSimulation, setIsTourSimulation] = useState(false);
  const [isVirtualTourRunning, setIsVirtualTourRunning] = useState(false);
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
  const [markerLocation, setMarkerLocation] = useState<[number, number] | undefined>();
  const [showSubtitles, setShowSubtitles] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [isEventsOpen, setIsEventsOpen] = useState(false);
  const [selectedDestination, setSelectedDestination] = useState<string | null>(null);
  const [navigationSource, setNavigationSource] = useState<"facilities" | "events" | null>(null);
  const searchParams = useSearchParams();
  const router = useRouter();
  const hasProcessedUrlParams = useRef(false);

  // Simulation Mode Feature Flag
  const { simulationMode } = useSimulation();

  // Search State

  const [searchQuery, setSearchQuery] = useState("");
  const [filteredResults, setFilteredResults] = useState<any[]>([]);
  const [allLandmarks, setAllLandmarks] = useState<any[]>([]);
  const [connectors, setConnectors] = useState<any[]>([]);

  // DEBUG: Track markerLocation and destination changes
  useEffect(() => {
    console.log("🎯 markerLocation changed:", markerLocation);
  }, [markerLocation]);

  useEffect(() => {
    console.log("📍 destination changed:", destination);
  }, [destination]);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);

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

  // Fetch landmarks for search
  useEffect(() => {
    fetch("/data/raw/mcc-landmarks.json")
      .then(r => r.json())
      .then(data => {
        const flattened = [
          ...(data.classrooms || []),
          ...(data.departments || []),
          ...(data.facilities || [])
        ];
        setAllLandmarks(flattened);
      });

    // Fetch connectors
    fetch("/data/final/mcc-connectors.final.geojson")
      .then(r => r.json())
      .then(data => {
        setConnectors(data.features || []);
      });
  }, []);

  // Filter landmarks logic
  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setFilteredResults([]);
      setSelectedIndex(-1);
      return;
    }
    const query = searchQuery.toLowerCase();
    const filtered = allLandmarks.filter(l =>
      l.name.toLowerCase().includes(query) ||
      l.category.toLowerCase().includes(query)
    ).slice(0, 6); // Limit to top 6
    console.log(`🔎 Search query: "${searchQuery}" found ${filtered.length} results:`, filtered.map(f => f.name));
    setFilteredResults(filtered);
    setSelectedIndex(-1);
  }, [searchQuery, allLandmarks]);

  useEffect(() => {
    if (isSearchFocused && filteredResults.length > 0) {
      console.log(`📋 Dropdown should be visible with ${filteredResults.length} results`);
    }
  }, [isSearchFocused, filteredResults]);

  const handleClearHistory = useCallback(() => {
    alert("Search history has been cleared.");
  }, []);

  const handleGetGPSLocation = () => {
    requireAuth(() => {
      const mainGate: [number, number] = [80.120584, 12.923163];
      setStartLocation(mainGate);
      setStartLabel("Main Gate (My Location)");
      setOriginType("gps");
    });
  };

  const handlePickOnMapRequested = () => {
    requireAuth(() => {
      setIsSelectingStart(true);
      setPendingPickerLocation(undefined);
    });
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

  const handleSelectLandmark = useCallback((landmark: any, isFromMap: boolean = false) => {
    // 1. Check authentication first
    if (!user) {
      if (isFromMap) {
        // Requirement: Just show main view after login if triggered by map
        requireAuth();
      } else {
        // Search: Continue to selection after login
        requireAuth(() => handleSelectLandmark(landmark, false));
      }
      return;
    }

    // 2. Logic for authenticated user
    const effectiveId = landmark.landmarkId || landmark.id;
    const landmarkPos: [number, number] = [landmark.lng, landmark.lat];

    // Requirement: Open panel immediately on click
    console.log("🔍 Selection: Opening landmark:", landmark.name, "ID:", effectiveId);
    setSelectedLandmark(landmark);
    setIsSidebarCollapsed(true);
    setIsPlanning(!!startLocation);
    setRouteInfo(null);

    // Connector logic: Find connector for this landmark
    const normalizedName = landmark.name?.toLowerCase().trim();
    const connector = connectors.find(c =>
      c.properties.landmarkId === effectiveId ||
      c.properties.landmarkName?.toLowerCase().trim() === normalizedName
    );

    if (connector) {
      console.log("✅ Connector found for:", landmark.name, connector);
      // SIMPLIFIED: Route directly to landmark position for both destination and marker
      // This ensures marker always appears at the correct location
      setDestination(landmarkPos);
      setMarkerLocation(landmarkPos);
      console.log("🎯 Routing to landmark position:", landmarkPos);
    } else {
      console.warn("❌ No connector found for:", landmark.name, "- routing directly.");
      setDestination(landmarkPos);
      setMarkerLocation(landmarkPos);
    }

    setStartLocation(undefined);
    setStartLabel("");
    setOriginType(null);
    setIsSelectingStart(false);
    setIsGuidanceActive(false);
    setIsDemoMode(false);
    setUiState("PLACE_SELECTED");
    setSheetState("HALF");
    setIsTourMode(false); // Exclusivity
  }, [user, requireAuth, markerLocation, startLocation, connectors]);

  // Handle Query Parameters for Auto-Navigation
  useEffect(() => {
    if (allLandmarks.length === 0 || hasProcessedUrlParams.current) return;

    const dest = searchParams.get('dest');
    const source = searchParams.get('source');
    const demo = searchParams.get('demo');

    if (dest) {
      const normalizedDest = dest.toLowerCase().trim();
      const landmark = allLandmarks.find(l =>
        l.name.toLowerCase().includes(normalizedDest) ||
        l.id?.toString() === normalizedDest
      );

      if (landmark) {
        hasProcessedUrlParams.current = true; // Mark as processed
        handleSelectLandmark(landmark);
        if (source === 'facilities') setNavigationSource('facilities');
        if (source === 'events') setNavigationSource('events');

        // Handle Start Location override from Facilities/Events
        const sLat = searchParams.get('source_lat');
        const sLng = searchParams.get('source_lng');
        const sLabel = searchParams.get('start_label');

        if (sLat && sLng) {
          const lat = parseFloat(sLat);
          const lng = parseFloat(sLng);
          if (!isNaN(lat) && !isNaN(lng)) {
            setStartLocation([lng, lat]);
            setStartLabel(sLabel || "Selected Location");
            setOriginType("manual");
            setIsPlanning(true);
          }
        }

        // If demo mode requested, start it immediately after selection
        if (demo === 'true') {
          setTimeout(() => {
            setIsGuidanceActive(true);
            setIsDemoMode(true);
            setSelectedLandmark(null);
            setUiState("NAVIGATION_ACTIVE");
          }, 500);
        }
      }
    }
  }, [allLandmarks, searchParams, handleSelectLandmark]);

  const handleSearch = useCallback((query: string) => {
    const normalizedQuery = query.toLowerCase().trim();
    // Try to find landmark by name or ID
    const landmark = allLandmarks.find(l =>
      l.name.toLowerCase().includes(normalizedQuery) ||
      l.id?.toString() === normalizedQuery ||
      l.landmarkId?.toString() === normalizedQuery
    );

    if (landmark) {
      handleSelectLandmark(landmark);
    }
  }, [allLandmarks, handleSelectLandmark]);

  useEffect(() => {
    if (selectedDestination) {
      handleSearch(selectedDestination);
      setSelectedDestination(null); // Reset after search
    }
  }, [selectedDestination, handleSearch]);

  const quickActions = {
    hostel: [80.1199855, 12.9221401] as [number, number],
    lab: [80.1396, 12.9186] as [number, number],
    canteen: [80.12273, 12.92034] as [number, number],
  };

  const handleRouteCalculated = (distance: number) => {
    const timeInMinutes = Math.round(distance / 1.4 / 60);
    setRouteInfo({ distance, time: timeInMinutes });
  };

  // CRITICAL: Tour Simulation Handler with Correct Decoupling
  // isTourSimulation (movement) ≠ isVirtualTourRunning (narration intent)
  const handleToggleTourSimulation = (active: boolean) => {
    setIsTourSimulation(active);

    // ONLY stop narration when tour stops, do NOT auto-start
    if (!active) {
      setIsVirtualTourRunning(false);
      SpeechService.getInstance().stop();
    }
  };

  // Callback to enable narration flag (called by Start Virtual Tour button)
  const handleStartVirtualTour = () => {
    setIsVirtualTourRunning(true);
  };

  const handleStartRealTour = () => {
    console.log("🗺️ Real Tour Started");
    setIsTourMode(true);
    setIsTourSimulation(false);
    setIsVirtualTourRunning(true);
  };

  const theme = settings.appearance as 'light' | 'dark';

  return (
    <div className={`h-screen w-screen relative flex overflow-hidden transition-colors duration-500 ${theme === 'dark' ? 'bg-[#0f172a]' : 'bg-white'}`}>
      {/* Sidebar Overlay for Mobile */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-[45] md:hidden animate-in fade-in duration-300"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <Sidebar
        isCollapsed={isSidebarCollapsed}
        isMobileOpen={isMobileMenuOpen}
        isDisabled={uiState === "NAVIGATION_ACTIVE" || isEventsOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
        onOpenSettings={() => requireAuth(() => setShowSettings(true))}
        onOpenEvents={() => requireAuth(() => {
          setIsEventsOpen(true);
          // If in Tour Mode, disable it and reset UI
          if (isTourMode) {
            setIsTourMode(false);
            setIsTourSimulation(false);
            setIsVirtualTourRunning(false);
            setUiState("IDLE");
            // Reset map view logic if needed, but sidebar's tour flush handles most
          }
        })}
        forceActiveLabel={showSettings ? "Settings" : (isEventsOpen ? "Events" : (isTourMode ? "Tour Mode" : (selectedLandmark ? "Locations" : undefined)))}
        user={user}
        isTourMode={isTourMode}
        onToggleTourMode={() => {
          requireAuth(() => {
            setIsTourMode(prev => {
              const next = !prev;
              if (next) {
                // Exclusivity: Clear other states when entering Tour Mode
                setSelectedLandmark(null);
                setIsGuidanceActive(false);
                setIsPlanning(false);
                setDestination(undefined);
                setStartLocation(undefined);
                setUiState("IDLE");
              } else {
                setIsTourSimulation(false); // Stop simulation if turning off tour
                setIsVirtualTourRunning(false);
              }
              return next;
            });
          });
        }}
        onSelectLocations={() => {
          setIsTourMode(false);
          setIsTourSimulation(false);
          setIsGuidanceActive(false);
          setIsDemoMode(false);
          setDestination(undefined);
          setMarkerLocation(undefined);
          setSelectedLandmark(null);
          setIsSidebarCollapsed(false);
          setUiState("IDLE");
        }}
        onOpenAuth={showAuthOverlay}
        onLogout={() => {
          if (confirm("Are you sure you want to log out?")) {
            logout();
          }
        }}
        theme={theme}
      />

      {/* Main Content Area */}
      <main className={`
        flex-1 relative transition-all duration-500 overflow-hidden
        ${/* On desktop, add left margin to prevent map from being under the sidebar */ ""}
        ${!isSidebarCollapsed ? "md:ml-[320px] 2xl:ml-[340px]" : "md:ml-[64px]"}
      `}>
        {/* Hamburger Menu & Search Bar - Integrated for Mobile, Centered for Desktop */}
        {!isGuidanceActive && !isTourMode && !isTourSimulation && (
          <div className={`
            fixed top-6 left-0 right-0 z-[40] px-4 flex items-center gap-2 transition-all duration-500
            md:absolute md:top-8 md:left-1/2 md:-translate-x-1/2 md:px-0 md:w-auto
            ${uiState === "NAVIGATION_ACTIVE" ? "scale-95 opacity-50 pointer-events-none" : "scale-100 opacity-100"}
          `}>
            {/* Hamburger (Mobile Only) */}
            {uiState !== "NAVIGATION_ACTIVE" && (
              <button
                onClick={() => setIsMobileMenuOpen(true)}
                className="md:hidden flex-shrink-0 w-12 h-12 bg-white rounded-2xl shadow-xl flex items-center justify-center text-slate-900 active:scale-95 transition-all border border-slate-100"
              >
                <div className="flex flex-col gap-1">
                  <span className="w-5 h-0.5 bg-current rounded-full" />
                  <span className="w-5 h-0.5 bg-current rounded-full" />
                  <span className="w-3 h-0.5 bg-current rounded-full" />
                </div>
              </button>
            )}

            {/* Wrapped Search Panel Interaction */}
            <div onClickCapture={(e) => {
              // Intercept clicks on search panel to require auth for interaction if needed
              // But prompt said "search input". SearchPanel handles its own input. 
              // We'll wrap the setUiState or the focus logic if we could, 
              // but for now let's just assume the Panel is mostly read-only until typed.
              // Actually SearchInput focus might be the trigger.
              // Since SearchPanel is complex, we might want to wrap the whole container 
              // or just rely on the 'onSelectLandmark' (which we wrapped).
              // Let's wrap the focus event via a capture if possible? 
              // Ideally SearchPanel would take an onFocus prop. 
              // For now, selecting a landmark is protected. 
            }}>
              <SearchPanel
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                filteredResults={filteredResults}
                setFilteredResults={setFilteredResults}
                isSearchFocused={isSearchFocused}
                setIsSearchFocused={(focused) => {
                  if (focused) {
                    requireAuth(() => setIsSearchFocused(true));
                  } else {
                    setIsSearchFocused(false);
                  }
                }}
                selectedIndex={selectedIndex}
                setSelectedIndex={setSelectedIndex}
                onSelectLandmark={handleSelectLandmark}
                setUiState={setUiState}
                theme={theme}
                isMobile={isMobile}
              />
            </div>
          </div>
        )}
        {/* The Map */}
        <div className="absolute inset-0 z-0">
          <MapView
            startLocation={startLocation}
            destination={destination}
            markerLocation={markerLocation}
            pendingLocation={pendingPickerLocation}
            isSelectingStart={isSelectingStart}
            isGuidanceActive={isGuidanceActive}
            isDemoMode={isDemoMode}
            isTourMode={isTourMode}
            isTourSimulation={isTourSimulation}
            onToggleTourSimulation={handleToggleTourSimulation}
            onStartVirtualTour={handleStartVirtualTour}
            onStartRealTour={handleStartRealTour}
            isVirtualTourRunning={isVirtualTourRunning}
            isMobile={isMobile}
            mapStyle={settings.mapStyle}
            simulationSpeed={settings.simulationSpeed}
            onLocationSelected={handleLocationSelectedOnMap}
            onSelectLandmark={handleSelectLandmark}
            onRouteCalculated={handleRouteCalculated}
            isPaused={isPaused}
            recenterCount={recenterCount}
            activeCategory={activeCategory}
            onSimulationUpdate={(coord, path, instruction, distance) => {
              setCurrentInstruction(instruction);
              setCurrentDistance(distance);
            }}
            showSubtitles={showSubtitles}
            onToggleSubtitles={() => setShowSubtitles(prev => !prev)}
            simulationMode={simulationMode}
          />


        </div>

        {/* Subtitle Panel */}
        <SubtitlePanel theme={theme} isVisible={showSubtitles} />

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
              // Keep markerLocation so marker stays at landmark position
              setRouteInfo(null);
              setIsPaused(false);
              setIsSidebarCollapsed(false);
              setSelectedLandmark(null);
              setIsPlanning(false);
              setUiState("IDLE"); // Ensure UI state resets to IDLE

              // Redirection logic
              if (navigationSource === 'facilities') {
                router.push('/facilities');
              } else if (navigationSource === 'events') {
                setIsEventsOpen(true);
              }
              setNavigationSource(null);
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
            <div className={`px-6 py-4 2xl:px-8 2xl:py-6 backdrop-blur-2xl border rounded-3xl shadow-[0_25px_50px_-12px_rgba(0,0,0,0.15)] flex items-center gap-6 2xl:gap-8 ${theme === 'dark' ? 'bg-slate-900/80 border-slate-700/60' : 'bg-white/80 border-white/60'}`}>
              <div className="flex flex-col">
                <span className="text-[10px] 2xl:text-[12px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Time</span>
                <span className={`text-2xl 2xl:text-3xl font-black leading-none ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{routeInfo.time} min</span>
              </div>
              <div className="w-px h-8 2xl:h-10 bg-slate-200" />
              <div className="flex flex-col">
                <span className="text-[10px] 2xl:text-[12px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Dist</span>
                <span className="text-xl 2xl:text-2xl font-bold text-orange-500 leading-none">{Math.round(routeInfo.distance)} m</span>
              </div>
              <button
                onClick={() => {
                  setDestination(undefined);
                  setMarkerLocation(undefined);
                  setRouteInfo(null);
                  setIsGuidanceActive(false);
                  setIsDemoMode(false);
                }}
                className={`ml-2 w-10 h-10 2xl:w-12 2xl:h-12 flex items-center justify-center rounded-2xl transition-colors shadow-lg active:scale-95 ${theme === 'dark' ? 'bg-orange-500 text-white hover:bg-orange-600' : 'bg-slate-900 text-white hover:bg-slate-800'}`}
              >
                <Search size={18} />
              </button>
            </div>
          </div>
        )}

        {/* Info Panel / Bottom Sheet */}
        {selectedLandmark && !isSelectingStart && (
          <InfoPanel
            landmark={selectedLandmark}
            startLabel={startLabel}
            isPlanning={isPlanning}
            isNavigationActive={uiState === "NAVIGATION_ACTIVE"}
            sheetState={sheetState}
            onSetSheetState={setSheetState}
            onSetPlanning={(p) => {
              setIsPlanning(p);
              if (p) setSheetState("HALF");
            }}
            onClose={() => {
              setSelectedLandmark(null);
              setIsSidebarCollapsed(false);
              setDestination(undefined);
              setMarkerLocation(undefined);
              setStartLocation(undefined);
              setStartLabel("Current Location");
              setOriginType(null);
              setRouteInfo(null);
              setIsSelectingStart(false);
              setIsGuidanceActive(false);
              setIsPlanning(false);
              setIsDemoMode(false);
              setUiState("IDLE");
            }}
            onGetGPSLocation={handleGetGPSLocation}
            onPickOnMap={handlePickOnMapRequested}
            originType={originType}
            onStartNavigation={(coord) => {
              // Don't override destination - keep the road junction for optimal routing
              // destination and markerLocation are already set from preview mode
              setIsGuidanceActive(true);
              setIsDemoMode(false);
              setSelectedLandmark(null);
              setUiState("NAVIGATION_ACTIVE");
            }}
            onStartDemo={() => {
              console.log("🚀 onStartDemo triggered in Page.tsx");
              setIsGuidanceActive(true);
              setIsDemoMode(true);
              setSelectedLandmark(null);
              setUiState("NAVIGATION_ACTIVE");
            }}
            simulationMode={simulationMode}
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
          <div className={`
            absolute z-30 scale-90 transition-all duration-500
            ${selectedLandmark
              ? (isMobile ? "bottom-[52vh] right-4" : "bottom-8 right-[340px]")
              : "bottom-8 right-8"}
          `}>
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

        <EventsPanel
          isOpen={isEventsOpen}
          theme={theme}
          onClose={() => setIsEventsOpen(false)}
          onNavigate={(location) => {
            setNavigationSource('events');
            setSelectedDestination(location);
          }}
        />

        {/* Auth Overlay removed; managed by AuthProvider now */}



        {/* Map Category Chips / Right Side Action Buttons */}
        {!isGuidanceActive && !isTourMode && !isTourSimulation && !selectedLandmark && (
          <QuickActions
            activeCategory={activeCategory}
            onCategoryClick={(cat) => {
              setActiveCategory(prev => prev === cat ? null : cat);
            }}
            theme={theme}
            isMobile={isMobile}
          />
        )}
      </main>
    </div>
  );
}
