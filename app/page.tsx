"use client";

import { useState, useCallback, useEffect, useRef, Suspense } from "react";
import { Search, Home, Microscope, UtensilsCrossed, Zap } from "lucide-react";
import Sidebar from "./components/Sidebar";
import MapView, { Building, Entrance, MapViewHandle } from "./components/MapView";
import MapControls from "./components/MapControls";
import InfoPanel from "./components/InfoPanel";
import SettingsOverlay from "./components/SettingsOverlay";
import NavigationOverlay from "./components/NavigationOverlay";
import SearchPanel from "./components/SearchPanel";
import QuickActions from "./components/QuickActions";
import SubtitlePanel from "./components/SubtitlePanel";
import SavedPlacesPanel from "./components/SavedPlacesPanel";
import EventsPanel from "./components/events/EventsPanel";
import AuthProvider, { useAuth, UserData } from "./components/AuthOverlay"; // Updated Import
import { useMediaQuery } from "./hooks/use-media-query";
import { useSearchParams, useRouter } from 'next/navigation';
import { SpeechService } from "./lib/speech/SpeechService";
import { useSimulation } from "./context/SimulationContext";
import { useGeolocation } from "./hooks/useGeolocation";
import { Landmark } from "./lib/navigation/GuidanceSynthesizer";
import { useMemo } from "react";


type UIState = "IDLE" | "SEARCHING" | "PLACE_SELECTED" | "NAVIGATION_ACTIVE";
type SheetState = "PEEK" | "HALF" | "FULL";
type NavigationPhase = "outdoor" | "indoor" | "completed";

// --- Types ---
export interface Room {
  id: string;
  name: string;
  type: "room";
  category: "Classroom";
  buildingId: string;
  buildingName: string;
  floor: number | string;
  rangeStart: number;
  rangeEnd: number;
  prefix?: string;
}



// --- Wrapper Component ---
export default function HomePage() {
  return (
    <Suspense fallback={
      <div className="h-screen w-screen flex items-center justify-center bg-[#0f172a] text-white">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
          <p className="font-bold tracking-widest uppercase text-sm">Initializing Map...</p>
        </div>
      </div>
    }>
      <HomeContent />
    </Suspense>
  );
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
  const [navigationPhase, setNavigationPhase] = useState<NavigationPhase>("outdoor");
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
  const [selectedLandmark, setSelectedLandmark] = useState<Landmark | Building | Room | null>(null);
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
  const [selectedDestination, setSelectedDestination] = useState<any | null>(null);
  const [selectedEntrance, setSelectedEntrance] = useState<any | null>(null);
  const [navigationSource, setNavigationSource] = useState<"facilities" | "events" | null>(null);
  const [isSavedPlacesOpen, setIsSavedPlacesOpen] = useState(false);
  const [savedLocations, setSavedLocations] = useState<any[]>([]);
  const searchParams = useSearchParams();
  const router = useRouter();
  const hasProcessedUrlParams = useRef(false);
  const mapViewRef = useRef<MapViewHandle | null>(null);

  // GPS Tracking State
  const [isTracking, setIsTracking] = useState(false);
  const { coords: gpsCoords, error: gpsError } = useGeolocation(isTracking);

  // Sync startLocation with GPS coords
  useEffect(() => {
    if (isTracking && gpsCoords) {
      setStartLocation(gpsCoords);
      setStartLabel("My Location (Live)");
      setOriginType("gps");
    }
  }, [isTracking, gpsCoords]);

  // Stop tracking when navigation ends or planning cancels
  useEffect(() => {
    if (!isGuidanceActive && !isPlanning && uiState !== "PLACE_SELECTED") {
      setIsTracking(false);
    }
  }, [isGuidanceActive, isPlanning, uiState]);

  // Simulation Mode Feature Flag
  const { simulationMode } = useSimulation();

  // Search State

  const [searchQuery, setSearchQuery] = useState("");
  const [allLandmarks, setAllLandmarks] = useState<Landmark[]>([]);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [entrances, setEntrances] = useState<Entrance[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [isRoomsLoaded, setIsRoomsLoaded] = useState(false);
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
    notifications: false, // Default to false until enabled
    locationAccuracy: true
  });

  // Load settings from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('mcc-navigator-settings');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setSettings(prev => ({ ...prev, ...parsed }));
      } catch (e) {
        console.error("Failed to parse settings", e);
      }
    }
  }, []);

  // Save settings on update
  useEffect(() => {
    localStorage.setItem('mcc-navigator-settings', JSON.stringify(settings));
  }, [settings]);

  // Handle Service Worker and Notifications
  useEffect(() => {
    if ('serviceWorker' in navigator && settings.notifications) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
          .then(reg => console.log('SW: Registered', reg))
          .catch(err => console.error('SW: Registration failed', err));
      });
    }
  }, [settings.notifications]);

  const handleUpdateSetting = useCallback((key: string, value: any) => {
    // If enabling notifications, request permission
    if (key === 'notifications' && value === true) {
      if ('Notification' in window) {
        Notification.requestPermission().then(permission => {
          if (permission === 'granted') {
            setSettings(prev => ({ ...prev, notifications: true }));
          } else {
            alert("Please allow notification permission in your browser to enable this feature.");
            setSettings(prev => ({ ...prev, notifications: false }));
          }
        });
        return;
      } else {
        alert("Push notifications are not supported in this browser.");
        return;
      }
    }
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

  const fetchSavedLocations = useCallback(async () => {
    if (!user) {
      setSavedLocations([]);
      return;
    }
    try {
      const res = await fetch("http://localhost:8080/campus-navigator-backend/get_saved_locations.php", {
        credentials: "include"
      });
      const data = await res.json();
      if (data.status === "success") {
        setSavedLocations(data.data);
      }
    } catch (err) {
      console.error("Error fetching saved locations:", err);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchSavedLocations();
    } else {
      setSavedLocations([]);
    }
  }, [user, fetchSavedLocations]);

  // Fetch initial data (Landmarks, Buildings, Entrances)
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [primaryRes, buildingsRes, entrancesRes, connectorsRes, facilitiesRes] = await Promise.all([
          fetch("/data/raw/mcc-landmarks.json"),
          fetch("/data/buildings.geojson"),
          fetch("/data/entrances.json"),
          fetch("/data/final/mcc-connectors.final.geojson"),
          fetch("http://localhost:8080/campus-navigator-backend/getfacilities.php")
        ]);

        const primaryData = await primaryRes.json();
        const buildingsGeoJSON = await buildingsRes.json();
        const buildingsData = buildingsGeoJSON.features.map((f: any) => {
          if (f.geometry && f.geometry.coordinates && f.geometry.coordinates[0]) {
            const coords = f.geometry.coordinates[0];
            f.lng = coords.reduce((acc: number, curr: number[]) => acc + curr[0], 0) / coords.length;
            f.lat = coords.reduce((acc: number, curr: number[]) => acc + curr[1], 0) / coords.length;
          }
          return f;
        });
        const entrancesData = await entrancesRes.json();
        const connectorsData = await connectorsRes.json();

        let dbFacilities: any[] = [];
        try {
          const rawFacilities = await facilitiesRes.json();
          const fList = Array.isArray(rawFacilities) ? rawFacilities : (rawFacilities.data || []);
          dbFacilities = fList.map((f: any) => ({
            id: `db-facility-${f.id}`,
            landmarkId: `db-facility-${f.id}`,
            name: f.name,
            category: f.category || "Facility",
            type: "facility", // or 'landmark' depending on how we treat it
            lat: parseFloat(f.latitude),
            lng: parseFloat(f.longitude),
            description: f.description,
            status: f.status,
            image: f.image,
            navPrompt: `Navigating to ${f.name}`
          }));
        } catch (err) {
          console.error("Failed to parse DB facilities:", err);
        }

        const initialLandmarks = [
          ...(primaryData.classrooms || []),
          ...(primaryData.departments || []),
          ...(primaryData.facilities || []),
          ...dbFacilities,
          ...buildingsData.map((f: any) => ({ 
            ...f.properties, 
            id: f.id || f.properties.id,
            category: "Building", 
            type: "building",
            lng: f.lng,
            lat: f.lat
          }))
        ];

        setAllLandmarks(initialLandmarks);
        setBuildings(buildingsData);
        setEntrances(entrancesData);
        setConnectors(connectorsData.features || []);
      } catch (err) {
        console.error("Error fetching map data:", err);
      }
    };

    fetchData();
  }, []);

  // Lazy load rooms when search is focused
  useEffect(() => {
    if (isSearchFocused && !isRoomsLoaded) {
      const loadRooms = async () => {
        try {
          const res = await fetch("/data/rooms.json");
          const roomsData = await res.json();
          setRooms(roomsData);
          setIsRoomsLoaded(true);
        } catch (err) {
          console.error("Error loading rooms:", err);
        }
      };
      loadRooms();
    }
  }, [isSearchFocused, isRoomsLoaded]);

  // Filter landmarks logic
  const filteredResults = useMemo(() => {
    if (searchQuery.trim().length < 2) {
      return [];
    }
    const query = searchQuery.toLowerCase().trim();
    
    // Dynamic logic for blocks
    const matchedRooms: any[] = [];
    const roomMatch = query.match(/^([a-z])\s*(\d+)$/i);
    if (roomMatch) {
      const prefix = roomMatch[1].toUpperCase();
      const number = parseInt(roomMatch[2], 10);
      
      const block = rooms.find((r: any) => r.prefix === prefix && number >= r.rangeStart && number <= r.rangeEnd);
      if (block) {
        matchedRooms.push({
          id: `room-${prefix}${number}`,
          name: `${prefix}${number}`,
          type: "room",
          category: "Classroom",
          buildingId: block.buildingId,
          buildingName: block.buildingName,
          floor: block.floor,
          rangeStart: block.rangeStart,
          rangeEnd: block.rangeEnd,
        });
      }
    }

    const filtered = allLandmarks.filter(l =>
      l.name.toLowerCase().includes(query) ||
      (l.category && l.category.toLowerCase().includes(query)) ||
      (l.buildingName && l.buildingName.toLowerCase().includes(query)) ||
      (l.room && (l as any).room.toLowerCase().includes(query))
    ).slice(0, 10);
    
    return [...matchedRooms, ...filtered].slice(0, 10);
  }, [searchQuery, allLandmarks, rooms]);

  useEffect(() => {
    setSelectedIndex(-1);
  }, [searchQuery]);

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
      setIsTracking(true);
      // No immediate setStartLocation here, useEffect will handle it once GPS fixes
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

  const isProcessingSelection = useRef(false);

  const handleSelectLandmark = useCallback((landmark: any, isFromMap: boolean = false) => {
    if (isProcessingSelection.current) return;
    isProcessingSelection.current = true;
    setTimeout(() => { isProcessingSelection.current = false; }, 300);

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
    let landmarkPos: [number, number] | undefined = [landmark.lng, landmark.lat];

    // Normalize Destination Type
    let normalizedLandmark = { ...landmark };
    if (!landmark.type) {
      if (landmark.category === "Classroom") normalizedLandmark.type = "room";
      else if (landmark.category === "Building") normalizedLandmark.type = "building";
      else normalizedLandmark.type = "landmark";
    }

    // Coordinates are optional for rooms
    if (normalizedLandmark.type === "room") {
      landmarkPos = undefined;
      const building = buildings.find(b => b.id === landmark.buildingId);
      if (building) {
        // Initial view can be building center
        landmarkPos = [building.lng, building.lat];
      }
    }

    console.log("🔍 Selection: Opening:", normalizedLandmark.name, "Type:", normalizedLandmark.type);
    setSelectedLandmark(normalizedLandmark);
    setSelectedEntrance(null); // Reset entrance for new selection
    setIsSidebarCollapsed(true);
    setIsPlanning(false);
    setRouteInfo(null);

    // Connector logic: Find connector for this landmark
    const normalizedName = landmark.name?.toLowerCase().trim();
    const connector = connectors.find(c =>
      c.properties.landmarkId === effectiveId ||
      c.properties.landmarkName?.toLowerCase().trim() === normalizedName
    );

    if (connector) {
      setDestination(landmarkPos);
      setMarkerLocation(landmarkPos);
      setNavigationPhase("outdoor");
    } else {
      setDestination(landmarkPos);
      setMarkerLocation(landmarkPos);
      setNavigationPhase("outdoor");
    }

    setStartLocation(undefined);
    setStartLabel("");
    setOriginType(null);
    setIsSelectingStart(false);
    setIsGuidanceActive(false);
    setIsDemoMode(false);
    setUiState("PLACE_SELECTED");
    if (landmark.type === "room") {
      setSheetState("PEEK");
    } else {
      setSheetState("HALF");
    }
    setIsTourMode(false); // Exclusivity
  }, [user, requireAuth, markerLocation, startLocation, connectors]);

  // Auto-expand InfoPanel on indoor phase
  useEffect(() => {
    if (navigationPhase === "indoor" && selectedLandmark?.type === "room") {
      setSheetState("HALF");
    }
  }, [navigationPhase, selectedLandmark]);

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
  
  // Handle Panel query params
  useEffect(() => {
    const open = searchParams.get('open');
    if (open === 'saved') {
      setIsSavedPlacesOpen(true);
      setIsEventsOpen(false);
      setShowSettings(false);
    } else if (open === 'events') {
      setIsEventsOpen(true);
      setIsSavedPlacesOpen(false);
      setShowSettings(false);
    } else if (open === 'settings') {
      setShowSettings(true);
      setIsSavedPlacesOpen(false);
      setIsEventsOpen(false);
    }
  }, [searchParams]);

  // Handle navigation from other pages via sessionStorage
  useEffect(() => {
    const pendingNav = sessionStorage.getItem('pendingNavDestination');
    if (pendingNav) {
      try {
        const destination = JSON.parse(pendingNav);
        setSelectedDestination(destination);
        sessionStorage.removeItem('pendingNavDestination');
      } catch (e) {
        console.error("Failed to parse pending destination", e);
      }
    }
  }, []);

  const handleSearch = useCallback((query: string | any) => {
    if (!query) return;
    
    // If we're passed a full object, we already have what we need
    if (typeof query !== 'string') {
      handleSelectLandmark(query);
      return;
    }

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
      setSelectedDestination(null); // Only clear if we processed it
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
        onOpenSettings={() => requireAuth(() => {
          setShowSettings(true);
          setIsSavedPlacesOpen(false);
          setIsEventsOpen(false);
        })}
        onOpenSavedPlaces={() => requireAuth(() => {
          setIsSavedPlacesOpen(true);
          setIsEventsOpen(false);
          setShowSettings(false);
        })}
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
        onOpenFacilities={() => requireAuth(() => router.push('/facilities'))}
        onOpenEmergency={() => requireAuth(() => router.push('/emergency'))}
        forceActiveLabel={showSettings ? "Settings" : (isSavedPlacesOpen ? "Saved Places" : (isEventsOpen ? "Events" : (isTourMode ? "Tour Mode" : (selectedLandmark ? "Locations" : undefined))))}
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
            ref={mapViewRef}
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
            buildings={buildings}
            entrances={entrances}
            selectedLandmark={selectedLandmark}
            onEntranceSelected={setSelectedEntrance}
            navigationPhase={navigationPhase}
            onPhaseChange={setNavigationPhase}
          />
        </div>

        {/* Auto-End Navigation when completed */}
        {navigationPhase === "completed" && (
          <AutoEndTimer
            onComplete={() => {
              setIsGuidanceActive(false);
              setIsDemoMode(false);
              setDestination(undefined);
              setRouteInfo(null);
              setIsPaused(false);
              setIsSidebarCollapsed(false);
              setSelectedLandmark(null);
              setIsPlanning(false);
              setNavigationPhase("outdoor");
              setUiState("IDLE");

              // Redirection logic
              if (navigationSource === 'facilities') {
                router.push('/facilities');
              } else if (navigationSource === 'events') {
                setIsEventsOpen(true);
              }
              setNavigationSource(null);
            }}
          />
        )}

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
              setMarkerLocation(undefined); // Clear marker for fresh start
              setRouteInfo(null);
              setIsPaused(false);
              setIsSidebarCollapsed(false);
              setSelectedLandmark(null);
              setIsPlanning(false);
              setNavigationPhase("outdoor");
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
            destination={selectedLandmark}
            entrance={selectedEntrance}
            navigationPhase={navigationPhase}
            onStartNewNavigation={() => {
              setIsGuidanceActive(false);
              setIsDemoMode(false);
              setDestination(undefined);
              setRouteInfo(null);
              setIsPaused(false);
              setIsSidebarCollapsed(false);
              setSelectedLandmark(null);
              setIsPlanning(false);
              setNavigationPhase("outdoor");
              setUiState("IDLE");
            }}
          />
        )}

        <SavedPlacesPanel
            isOpen={isSavedPlacesOpen}
            onClose={() => setIsSavedPlacesOpen(false)}
            theme={theme}
            onNavigate={(lng, lat) => {
                setDestination([lng, lat]);
                setMarkerLocation([lng, lat]);
                setStartLabel("Current Location");
                requireAuth(() => {
                    setIsTracking(true);
                });
                setIsPlanning(true);
                setIsSavedPlacesOpen(false); // Close panel on navigate
            }}
            onRefresh={fetchSavedLocations}
        />

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
        {selectedLandmark && !isSelectingStart && (uiState !== "NAVIGATION_ACTIVE" || navigationPhase === "indoor") && (
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
              setNavigationPhase("outdoor");
              setIsGuidanceActive(true);
              setIsDemoMode(false);
              // Maintain selectedLandmark to keep highlight active
              setUiState("NAVIGATION_ACTIVE");
            }}
            onStartDemo={() => {
              console.log("🚀 onStartDemo triggered in Page.tsx");
              setNavigationPhase("outdoor");
              setIsGuidanceActive(true);
              setIsDemoMode(true);
              // Maintain selectedLandmark to keep highlight active
              setUiState("NAVIGATION_ACTIVE");
            }}
            simulationMode={simulationMode}
            entrance={selectedEntrance}
            theme={theme}
            navigationPhase={navigationPhase}
            savedLocations={savedLocations}
            onSavedStatusChange={fetchSavedLocations}
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
            <MapControls
              onZoomIn={() => mapViewRef.current?.zoomIn()}
              onZoomOut={() => mapViewRef.current?.zoomOut()}
              onRotateLeft={() => mapViewRef.current?.rotateLeft()}
              onRotateRight={() => mapViewRef.current?.rotateRight()}
              onResetNorth={() => mapViewRef.current?.resetNorth()}
            />
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
              setIsPaused(false);
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

// Helper component for auto-ending navigation without breaking hook rules in the main component
function AutoEndTimer({ onComplete }: { onComplete: () => void }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete();
    }, 3500); // Wait 3.5s so voice message finishes
    return () => clearTimeout(timer);
  }, [onComplete]);
  return null;
}
