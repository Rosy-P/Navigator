"use client";

import { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import {
  buildGraph,
  findNearestNode,
  aStar,
  Node,
  distance,
  getBearing,
  getManeuver,
  getRouteGeoJSON,
} from "../lib/routing";
import { useVoiceNavigation } from "../hooks/useVoiceNavigation";
import { Landmark } from "../lib/navigation/GuidanceSynthesizer";
import { SpeechService } from "@/app/lib/speech/SpeechService";

interface MapViewProps {
  startLocation?: [number, number];
  destination?: [number, number];
  pendingLocation?: [number, number];
  isSelectingStart?: boolean;
  isGuidanceActive?: boolean;
  isTourMode?: boolean;
  isTourSimulation?: boolean;
  onToggleTourSimulation?: (active: boolean) => void;
  onStartVirtualTour?: () => void;
  onStartRealTour?: () => void;
  isVirtualTourRunning?: boolean;
  isDemoMode?: boolean;
  mapStyle?: string;
  simulationSpeed?: string;
  onLocationSelected?: (coord: [number, number]) => void;
  onSimulationUpdate?: (
    coord: [number, number],
    coveredPoints: [number, number][],
    instruction: string,
    distanceToNext: string,
  ) => void;
  onRouteCalculated?: (distance: number) => void;
  onSelectLandmark?: (landmark: any, isFromMap?: boolean) => void;
  isPaused?: boolean;
  recenterCount?: number;
  isMobile?: boolean;
  markerLocation?: [number, number];
  showSubtitles?: boolean;
  onToggleSubtitles?: () => void;
  activeCategory?: string | null;
  simulationMode?: boolean;
}

const GRAND_TOUR_PATH: [number, number][] = [
  [80.120584, 12.923163], // Main Gate
  [80.1199855, 12.9221401], // Thomas Hall
  [80.121124, 12.920936], // Boxing Ring
  [80.122281, 12.921221], // Anderson Hall
  [80.122117, 12.921766], // Quadrangle
  [80.12273, 12.92034], // Cafeteria
  [80.1237728, 12.9195085], // Heber Hall
  [80.1237943, 12.9187664], // Chapel
  [80.12421, 12.92138], // Selaiyur Hall
];

export default function MapView({
  startLocation,
  destination,
  pendingLocation,
  isSelectingStart,
  isGuidanceActive,
  isTourMode = false,
  isTourSimulation = false,
  onToggleTourSimulation,
  onStartVirtualTour,
  onStartRealTour,
  isVirtualTourRunning = false,
  isDemoMode,
  mapStyle = "voyager",
  simulationSpeed = "normal",
  onLocationSelected,
  onSimulationUpdate,
  onRouteCalculated,
  onSelectLandmark,
  isPaused = false,
  recenterCount = 0,
  isMobile = false,
  markerLocation,
  showSubtitles = true,
  onToggleSubtitles,
  activeCategory = null,
  simulationMode = false,
}: MapViewProps) {
  console.log("🗺️ MapView Rendering:", { isDemoMode, isGuidanceActive, isTourSimulation, startLocation });
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<maplibregl.Map | null>(null);
  const graphRef = useRef<Map<string, Node> | null>(null);
  const startMarkerRef = useRef<maplibregl.Marker | null>(null);
  const pendingMarkerRef = useRef<maplibregl.Marker | null>(null);
  const destMarkerRef = useRef<maplibregl.Marker | null>(null);

  const currentRouteRef = useRef<[number, number][]>([]);
  const animFrameRef = useRef<number | null>(null);
  const defaultLocation: [number, number] = [80.120584, 12.923163];
  const [isGraphReady, setIsGraphReady] = useState(false);
  const [allLandmarks, setAllLandmarks] = useState<Landmark[]>([]);
  const [simulationPosition, setSimulationPosition] = useState<
    [number, number] | null
  >(startLocation || defaultLocation);
  const [currentNavManeuver, setCurrentNavManeuver] = useState<string>("");
  const [currentManeuverCoord, setCurrentManeuverCoord] = useState<
    [number, number] | null
  >(null);
  const [currentDistToManeuver, setCurrentDistToManeuver] = useState<number>(0);
  const [isPathReady, setIsPathReady] = useState(false);

  // Camera Management Refs
  const cameraModeRef = useRef<"IDLE" | "FOLLOW" | "TURN">("IDLE");
  const lastCameraPosRef = useRef<[number, number] | null>(null);
  const lastCameraBearingRef = useRef<number>(0);
  const smoothedBearingRef = useRef<number>(0);
  const smoothedSpeedRef = useRef<number>(0);

  // Refs for state
  const isSelectingStartRef = useRef(isSelectingStart);
  const onLocationSelectedRef = useRef(onLocationSelected);
  const onSelectLandmarkRef = useRef(onSelectLandmark);

  // Persistent Simulation State Refs
  const simIndexRef = useRef<number>(0);
  const simStartTimeRef = useRef<number | null>(null);
  const simSegmentDistRef = useRef<number>(0);
  const simSegmentDurationRef = useRef<number>(0);

  useEffect(() => {
    onSelectLandmarkRef.current = onSelectLandmark;
  }, [onSelectLandmark]);

  useEffect(() => {
    isSelectingStartRef.current = isSelectingStart;
  }, [isSelectingStart]);

  useEffect(() => {
    onLocationSelectedRef.current = onLocationSelected;
  }, [onLocationSelected]);

  const currentUserLocation = startLocation || defaultLocation;

  // Voice Navigation Hook
  const { isMuted, toggleMute, resetSession, repeatLastNarration } =
    useVoiceNavigation(allLandmarks, {
      currentLocation:
        isGuidanceActive || isTourMode || isTourSimulation
          ? isDemoMode || isTourSimulation
            ? simulationPosition
            : currentUserLocation
          : null,
      nextManeuver: currentNavManeuver,
      maneuverCoord: currentManeuverCoord,
      distanceToManeuver: currentDistToManeuver,
      isTourMode: isTourMode || isTourSimulation,
      isGuidanceActive: isGuidanceActive,
      isDemoMode: isDemoMode,
      isVirtualTourRunning: isVirtualTourRunning,
    });

  const speedMap = { slow: 1500, normal: 800, fast: 300 };

  // Valid Satellite Style JSON for MapLibre
  const SATELLITE_STYLE = {
    version: 8,
    sources: {
      "raster-tiles": {
        type: "raster",
        tiles: [
          "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        ],
        tileSize: 256,
        attribution: "ESRI World Imagery",
      },
    },
    layers: [
      {
        id: "satellite",
        type: "raster",
        source: "raster-tiles",
        minzoom: 0,
        maxzoom: 22,
      },
    ],
  };

  const styleMap: Record<string, any> = {
    voyager: "https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json",
    dark: "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json",
    satellite: SATELLITE_STYLE,
  };

  useEffect(() => {
    if (!mapRef.current) return;

    const campusCenter: [number, number] = [80.1235, 12.918];
    const bounds: [number, number, number, number] = [
      80.108, 12.91, 80.132, 12.926,
    ];

    const map = new maplibregl.Map({
      container: mapRef.current,
      style: styleMap[mapStyle] || styleMap.voyager,
      center: campusCenter,
      zoom: 16.2,
      maxBounds: bounds,
      pitch: 0,
      bearing: 0,
      attributionControl: false,
    });

    mapInstance.current = map;

    const loadResources = async () => {
      try {
        // GLYPHS OVERRIDE: Prevent CORS errors by using a public fonts server
        const fixStyle = async (url: string) => {
          const res = await fetch(url);
          const style = await res.json();
          style.glyphs =
            "https://tiles.basemaps.cartocdn.com/fonts/{fontstack}/{range}.pbf";
          return style;
        };

        const voyagerStyle = await fixStyle(styleMap.voyager);
        const darkStyle = await fixStyle(styleMap.dark);

        const finalStyles: Record<string, any> = {
          voyager: voyagerStyle,
          dark: darkStyle,
          satellite: SATELLITE_STYLE,
        };

        map.setStyle(finalStyles[mapStyle]);

        // 1. Boundary
        fetch("/data/raw/mcc-boundary.geojson")
          .then((r) => r.json())
          .then((data) => {
            map.addSource("mcc-boundary", { type: "geojson", data });
          });

        // 2. Landmarks (Restoring to raw data)
        const landmarkRes = await fetch("/data/raw/mcc-landmarks.json");
        const rawLandmarks = await landmarkRes.json();
        const features: any[] = [];
        ["classrooms", "departments", "facilities"].forEach((cat) => {
          if (rawLandmarks[cat]) {
            rawLandmarks[cat].forEach((item: any, idx: number) => {
              features.push({
                type: "Feature",
                properties: {
                  landmarkId: item.id || `${cat}-${idx}`,
                  id: item.id || `${cat}-${idx}`, // Keep both for compatibility
                  ...item,
                },
                geometry: { type: "Point", coordinates: [item.lng, item.lat] },
              });
            });
          }
        });

        map.addSource("landmarks", {
          type: "geojson",
          data: { type: "FeatureCollection", features } as any,
        });
        setAllLandmarks(
          features.map((f) => ({
            id: f.properties.id,
            name: f.properties.name,
            lat: f.geometry.coordinates[1],
            lng: f.geometry.coordinates[0],
            navPrompt: f.properties.navPrompt,
            voice: f.properties.voice,
            category: f.properties.category,
          })),
        );
        setIsGraphReady(true);

        map.addLayer({
          id: "landmarks-points",
          type: "circle",
          source: "landmarks",
          paint: {
            "circle-radius": [
              "interpolate",
              ["linear"],
              ["zoom"],
              15,
              9,
              18,
              18,
            ],
            "circle-color": mapStyle === "satellite" ? "#ffffff" : "#111827",
            "circle-stroke-width": 2,
            "circle-stroke-color":
              mapStyle === "satellite" ? "#111827" : "#ffffff",
          },
        });

        map.addLayer({
          id: "landmarks-icons",
          type: "symbol",
          source: "landmarks",
          layout: {
            "text-field": "📍",
            "text-size": 12,
            "text-allow-overlap": true,
          },
          paint: { "text-color": "#fb923c" },
        });

        map.addLayer({
          id: "landmarks-labels",
          type: "symbol",
          source: "landmarks",
          layout: {
            "text-field": ["get", "name"],
            "text-size": [
              "interpolate",
              ["linear"],
              ["zoom"],
              15,
              0,
              16,
              11,
              18,
              14,
            ],
            "text-offset": [0, 1.5],
            "text-anchor": "top",
            "text-allow-overlap": false,
          },
          paint: {
            "text-color": mapStyle === "satellite" ? "#ffffff" : "#1e293b",
            "text-halo-color": mapStyle === "satellite" ? "#000000" : "#ffffff",
            "text-halo-width": 2,
          },
        });

        // 3. Unified Walk Network
        const networkRes = await fetch("/data/final/mcc-walk-network.geojson");
        const networkData = await networkRes.json();
        graphRef.current = buildGraph(networkData);
        map.addSource("mcc-paths", { type: "geojson", data: networkData });

        map.addLayer({
          id: "paths-main",
          type: "line",
          source: "mcc-paths",
          paint: {
            "line-color": mapStyle === "satellite" ? "#ffffff" : "#e2e8f0",
            "line-width": ["interpolate", ["linear"], ["zoom"], 15, 1, 18, 3],
            "line-opacity": 0.6,
          },
        });

        // 4. Route Layers
        map.addSource("route", {
          type: "geojson",
          data: { type: "FeatureCollection", features: [] },
        });
        map.addSource("route-covered", {
          type: "geojson",
          data: { type: "FeatureCollection", features: [] },
        });

        map.addLayer({
          id: "route-covered",
          type: "line",
          source: "route-covered",
          layout: { "line-join": "round", "line-cap": "round" },
          paint: {
            "line-color": "#94a3b8",
            "line-width": 8,
            "line-opacity": 0.7,
          },
        });

        map.addLayer({
          id: "route-line",
          type: "line",
          source: "route",
          layout: { "line-join": "round", "line-cap": "round" },
          paint: {
            "line-color": "#3b82f6",
            "line-width": 8,
            "line-opacity": 1,
          },
        });

        // Tour Mode Layers (Dotted/Solid Orange)
        map.addLayer({
          id: "tour-route-covered",
          type: "line",
          source: "route-covered",
          layout: {
            "line-join": "round",
            "line-cap": "round",
            visibility: "none",
          },
          paint: {
            "line-color": "#FFA500",
            "line-width": 6,
            "line-opacity": 0.8,
          },
        });

        map.addLayer({
          id: "tour-route-line",
          type: "line",
          source: "route",
          layout: {
            "line-join": "round",
            "line-cap": "round",
            visibility: "none",
          },
          paint: {
            "line-color": "#FFA500",
            "line-width": 4,
            "line-dasharray": [1.5, 2],
          },
        });

        // Marker
        const el = document.createElement("div");
        el.className = "user-marker-container";
        el.innerHTML =
          '<div class="user-dot"></div><div class="nav-shadow"></div><div class="nav-arrow"></div><div class="user-marker-pulse"></div>';
        startMarkerRef.current = new maplibregl.Marker({
          element: el,
          rotationAlignment: "map",
        })
          .setLngLat(currentUserLocation)
          .addTo(map);

        // 5. Interaction
        map.on("click", (e) => {
          if (isSelectingStartRef.current && onLocationSelectedRef.current) {
            onLocationSelectedRef.current([e.lngLat.lng, e.lngLat.lat]);
          }
        });

        map.on("click", "landmarks-points", (e) => {
          if (isSelectingStartRef.current) return;
          if (e.features && e.features[0]) {
            const feature = e.features[0];
            const coord = (feature.geometry as any).coordinates as [
              number,
              number,
            ];
            if (onSelectLandmarkRef.current) {
              onSelectLandmarkRef.current(
                { ...feature.properties, lng: coord[0], lat: coord[1] },
                true,
              );
            }
            map.easeTo({ center: coord, zoom: 18, duration: 1000 });
          }
        });
      } catch (err) {
        console.error("Map error:", err);
      }
    };

    map.on("load", loadResources);

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, [mapStyle]);

  // Handle Category Filtering and Map Bounds
  useEffect(() => {
    if (!mapInstance.current || !allLandmarks.length) return;

    const filtered = activeCategory
      ? allLandmarks.filter((l) => l.category === activeCategory)
      : allLandmarks;

    if (activeCategory && filtered.length === 0) {
      console.warn(`No landmarks found for category: ${activeCategory}`);
      return;
    }

    const source = mapInstance.current.getSource("landmarks") as maplibregl.GeoJSONSource;
    if (source) {
      const features = filtered.map((item) => ({
        type: "Feature",
        properties: { ...item },
        geometry: { type: "Point", coordinates: [item.lng, item.lat] },
      }));
      source.setData({ type: "FeatureCollection", features } as any);
    }

    // Auto-fit bounds if a category is active
    if (activeCategory && filtered.length > 0) {
      const bounds = new maplibregl.LngLatBounds();
      filtered.forEach((l) => bounds.extend([l.lng, l.lat]));
      mapInstance.current.fitBounds(bounds, {
        padding: 80,
        duration: 1200,
        essential: true,
      });
    }
  }, [activeCategory, allLandmarks]);

  // Zoom to Destination
  useEffect(() => {
    if (!mapInstance.current || !destination || isGuidanceActive) return;
    mapInstance.current.easeTo({
      center: destination,
      zoom: 18,
      duration: 1200,
    });
  }, [destination, isGuidanceActive]);

  // Reset Map View when Navigation or Tour Ends
  const prevGuidanceRef = useRef(isGuidanceActive);
  const prevTourModeRef = useRef(isTourMode);
  const prevTourSimRef = useRef(isTourSimulation);

  useEffect(() => {
    const navEnded = !isGuidanceActive && prevGuidanceRef.current === true;
    const tourEnded = !isTourMode && prevTourModeRef.current === true;
    const simEnded = !isTourSimulation && prevTourSimRef.current === true;

    if ((navEnded || tourEnded || simEnded) && mapInstance.current) {
      const campusCenter: [number, number] = [80.1235, 12.918];
      mapInstance.current.flyTo({
        center: campusCenter,
        zoom: 16.2,
        pitch: 0,
        bearing: 0,
        duration: 2000,
        essential: true,
      });

      // Cleanup simulation state
      cameraModeRef.current = "IDLE";
      lastCameraPosRef.current = null;
      smoothedSpeedRef.current = 0;

      // Clear route data from sources
      const rSrc = mapInstance.current.getSource(
        "route",
      ) as maplibregl.GeoJSONSource;
      if (rSrc) rSrc.setData({ type: "FeatureCollection", features: [] });
      const cSrc = mapInstance.current.getSource(
        "route-covered",
      ) as maplibregl.GeoJSONSource;
      if (cSrc) cSrc.setData({ type: "FeatureCollection", features: [] });

      // Remove destination marker when navigation ends
      if (destMarkerRef.current) {
        destMarkerRef.current.remove();
        destMarkerRef.current = null;
      }

      // Reset start marker position and style
      if (startMarkerRef.current) {
        const defaultLocation: [number, number] = [80.120584, 12.923163];
        startMarkerRef.current.setLngLat(startLocation || defaultLocation);
        startMarkerRef.current.setRotation(0);
        startMarkerRef.current.getElement().classList.remove("navigating");
      }

      // Reset voice session for next time
      resetSession();
      setIsPathReady(false);
    }
    if (
      (isGuidanceActive && !prevGuidanceRef.current) ||
      (isTourSimulation && !prevTourSimRef.current)
    ) {
      // New navigation or tour session started
      resetSession();
      // Don't reset isPathReady here, we want to allow simulations to start if a route exists
    }
    prevGuidanceRef.current = isGuidanceActive;
    prevTourModeRef.current = isTourMode;
    prevTourSimRef.current = isTourSimulation;
  }, [isGuidanceActive, isTourMode, isTourSimulation, startLocation]);

  // Speed configuration (meters per second)
  const speedTable = {
    slow: 3,
    normal: 7,
    fast: 15,
  };

  useEffect(() => {
    if (
      !(isDemoMode || isTourSimulation) ||
      (!isGuidanceActive && !isTourSimulation) ||
      !isPathReady ||
      !mapInstance.current ||
      isPaused
    ) {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      cameraModeRef.current = "IDLE";
      return;
    }

    const path = currentRouteRef.current;
    if (!path || path.length < 2) {
      cameraModeRef.current = "IDLE";
      return;
    }

    // CRITICAL: Reset simulation state when starting new animation
    simIndexRef.current = 0;
    simStartTimeRef.current = null;
    simSegmentDistRef.current = 0;
    simSegmentDurationRef.current = 0;

    const map = mapInstance.current!;
    const speed = (speedTable as any)[simulationSpeed] || 7;

    const animate = (time: number) => {
      if (simStartTimeRef.current === null) {
        simStartTimeRef.current = time;
        // Initialize current segment info
        const start = path[simIndexRef.current];
        const end = path[simIndexRef.current + 1];
        simSegmentDistRef.current = distance(start, end);
        simSegmentDurationRef.current =
          (simSegmentDistRef.current / speed) * 1000;

        // Set initial bearing
        smoothedBearingRef.current = getBearing(start, end);
      }

      const elapsed = time - simStartTimeRef.current;
      let t = Math.min(elapsed / simSegmentDurationRef.current, 1);

      if (isPaused) {
        simStartTimeRef.current = time - t * simSegmentDurationRef.current;
        animFrameRef.current = requestAnimationFrame(animate);
        return;
      }

      const segmentStartPos = path[simIndexRef.current];
      const segmentEndPos = path[simIndexRef.current + 1];

      const currentLng =
        segmentStartPos[0] + (segmentEndPos[0] - segmentStartPos[0]) * t;
      const currentLat =
        segmentStartPos[1] + (segmentEndPos[1] - segmentStartPos[1]) * t;
      const currentPos: [number, number] = [currentLng, currentLat];

      setSimulationPosition(currentPos);

      const targetBearing = getBearing(segmentStartPos, segmentEndPos);
      const alpha = 0.08;
      let diff = targetBearing - smoothedBearingRef.current;
      while (diff > 180) diff -= 360;
      while (diff < -180) diff += 360;
      smoothedBearingRef.current =
        (smoothedBearingRef.current + diff * alpha + 360) % 360;

      if (startMarkerRef.current) {
        startMarkerRef.current.setLngLat(currentPos);
        startMarkerRef.current.setRotation(targetBearing);
      }

      const distChanged =
        !lastCameraPosRef.current ||
        distance(currentPos, lastCameraPosRef.current) > 1.2;
      const bearingChanged =
        Math.abs(smoothedBearingRef.current - lastCameraBearingRef.current) >
        2.5;

      if (distChanged || bearingChanged) {
        if (simIndexRef.current < path.length - 2) {
          const b1 = getBearing(segmentStartPos, segmentEndPos);
          const bNext = getBearing(
            path[simIndexRef.current + 1],
            path[simIndexRef.current + 2],
          );
          const maneuver = getManeuver(b1, bNext);
          cameraModeRef.current =
            maneuver !== "Continue straight" ? "TURN" : "FOLLOW";
        }

        const targetSpeed = speed;
        const speedAlpha = 0.03;
        smoothedSpeedRef.current =
          smoothedSpeedRef.current +
          (targetSpeed - smoothedSpeedRef.current) * speedAlpha;
        const speedFactor = Math.max(
          0,
          Math.min(1, (smoothedSpeedRef.current - 3) / (15 - 3)),
        );
        const dynamicOffset = isMobile ? 0 : 110 + speedFactor * (220 - 110);
        const rad = smoothedBearingRef.current * (Math.PI / 180);
        const x = Math.sin(rad);
        const y = Math.cos(rad);
        const offsetX = -x * dynamicOffset;
        const offsetY = y * dynamicOffset;

        map.easeTo({
          center: currentPos,
          bearing: smoothedBearingRef.current,
          pitch: cameraModeRef.current === "TURN" ? 45 : 60,
          zoom: 18.5,
          offset: [offsetX, offsetY],
          duration: 350,
          easing: (t) => t * (2 - t),
        });

        lastCameraPosRef.current = currentPos;
        lastCameraBearingRef.current = smoothedBearingRef.current;
      }

      const cSrc = map.getSource("route-covered") as maplibregl.GeoJSONSource;
      if (cSrc) {
        const covered = [...path.slice(0, simIndexRef.current + 1), currentPos];
        cSrc.setData({
          type: "Feature",
          geometry: { type: "LineString", coordinates: covered },
        } as any);
      }

      const rSrc = map.getSource("route") as maplibregl.GeoJSONSource;
      if (rSrc) {
        const remaining = [currentPos, ...path.slice(simIndexRef.current + 1)];
        rSrc.setData({
          type: "Feature",
          geometry: { type: "LineString", coordinates: remaining },
        } as any);
      }

      let instruction = "Continue straight";
      let distToManeuver = simSegmentDistRef.current * (1 - t);
      let targetManeuverCoord: [number, number] | null = null;

      if (simIndexRef.current < path.length - 2) {
        const b1 = getBearing(segmentStartPos, segmentEndPos);
        const bNext = getBearing(
          path[simIndexRef.current + 1],
          path[simIndexRef.current + 2],
        );
        const nextManeuver = getManeuver(b1, bNext);

        if (nextManeuver !== "Continue straight") {
          instruction = nextManeuver;
          targetManeuverCoord = path[simIndexRef.current + 1];
        } else {
          let lookaheadDist = distToManeuver;
          for (let i = simIndexRef.current + 1; i < path.length - 1; i++) {
            const bCurr = getBearing(path[i - 1], path[i]);
            const bNextCheck = getBearing(path[i], path[i + 1]);
            const m = getManeuver(bCurr, bNextCheck);
            if (m !== "Continue straight") {
              instruction = m;
              targetManeuverCoord = path[i];
              break;
            }
            lookaheadDist += distance(path[i], path[i + 1]);
          }
          distToManeuver = lookaheadDist;
        }
      } else if (simIndexRef.current === path.length - 2) {
        if (t > 0.95) {
          instruction = "You have arrived";
          distToManeuver = 0;
          targetManeuverCoord = path[path.length - 1];
        } else {
          instruction = "You have arrived";
          distToManeuver = distance(currentPos, path[path.length - 1]);
          targetManeuverCoord = path[path.length - 1];
        }
      }

      const distText =
        distToManeuver >= 1000
          ? `${(distToManeuver / 1000).toFixed(1)}km`
          : `${Math.round(distToManeuver)}m`;

      if (
        simIndexRef.current % 30 === 0 ||
        instruction !== currentNavManeuver
      ) {
        setCurrentNavManeuver(instruction);
        setCurrentDistToManeuver(distToManeuver);
        setCurrentManeuverCoord(targetManeuverCoord);
        setSimulationPosition(currentPos);
      }

      if (onSimulationUpdate) {
        onSimulationUpdate(
          currentPos,
          [...path.slice(0, simIndexRef.current + 1), currentPos],
          instruction,
          distText,
        );
      }

      setCurrentNavManeuver(instruction);
      setCurrentDistToManeuver(distToManeuver);
      setCurrentManeuverCoord(targetManeuverCoord);

      if (t < 1) {
        animFrameRef.current = requestAnimationFrame(animate);
      } else {
        simIndexRef.current++;
        if (simIndexRef.current < path.length - 1) {
          simStartTimeRef.current = time;
          const nextStart = path[simIndexRef.current];
          const nextEnd = path[simIndexRef.current + 1];
          simSegmentDistRef.current = distance(nextStart, nextEnd);
          simSegmentDurationRef.current =
            (simSegmentDistRef.current / speed) * 1000;
          animFrameRef.current = requestAnimationFrame(animate);
        } else {
          console.log("🏁 Simulation arrived at destination");
        }
      }
    };

    animFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [
    isDemoMode,
    isGuidanceActive,
    isPaused,
    simulationSpeed,
    isTourSimulation,
    isPathReady,
  ]);

  // Manual Recenter
  useEffect(() => {
    if (recenterCount > 0 && mapInstance.current && startMarkerRef.current) {
      mapInstance.current.easeTo({
        center: startMarkerRef.current.getLngLat(),
        zoom: 18,
        duration: 1000,
      });
    }
  }, [recenterCount]);

  // Handle Tour Simulation Route Generation
  useEffect(() => {
    if (
      (isTourSimulation || isTourMode) &&
      isGraphReady &&
      graphRef.current &&
      mapInstance.current
    ) {
      console.log("🚀 Starting Grand Tour Simulation...");
      // Reset Voice Session to clear visited landmarks and ensure fresh start
      resetSession();

      let fullPath: [number, number][] = [];
      
      // Determine points to visit
      // For real tour (not simulation), start from current location
      const pointsToVisit = [...GRAND_TOUR_PATH];
      if (isTourMode && !isTourSimulation && startLocation) {
         // Prepend current location to the tour
         pointsToVisit.unshift(startLocation);
      } else if (isTourMode && !isTourSimulation && !startLocation) {
         // Fallback if startLocation is not yet available, maybe just use default or wait?
         // For now, let's just use GRAND_TOUR_PATH if startLocation is missing, 
         // OR we could use the defaultLocation but that might be far. 
         // Let's assume startLocation is available or we use GRAND_TOUR_PATH basic loop.
      }

      // Connect all points in the tour path
      for (let i = 0; i < pointsToVisit.length - 1; i++) {
        const start = pointsToVisit[i];
        const end = pointsToVisit[i + 1];
        const segment = getRouteGeoJSON(graphRef.current, start, end);
        if (segment) {
          // Avoid duplicating coordinates at joint points
          const coords = segment.geometry.coordinates as [number, number][];
          fullPath = [...fullPath, ...coords.slice(0, -1)];
        }
      }
      // Add the last point
      fullPath.push(pointsToVisit[pointsToVisit.length - 1]);

      if (fullPath.length > 0) {
        currentRouteRef.current = fullPath;
        setSimulationPosition(fullPath[0]);
        setIsPathReady(true);

        // Show path on map source (layers handle styling)
        const rSrc = mapInstance.current.getSource(
          "route",
        ) as maplibregl.GeoJSONSource;
        if (rSrc) {
          rSrc.setData({
            type: "Feature",
            properties: {},
            geometry: { type: "LineString", coordinates: fullPath },
          });
        }
      }
    } else if (!isTourSimulation && !isGuidanceActive && mapInstance.current) {
      // Clear sources when both are off
      const rSrc = mapInstance.current.getSource(
        "route",
      ) as maplibregl.GeoJSONSource;
      if (rSrc) rSrc.setData({ type: "FeatureCollection", features: [] });
      const cSrc = mapInstance.current.getSource(
        "route-covered",
      ) as maplibregl.GeoJSONSource;
      if (cSrc) cSrc.setData({ type: "FeatureCollection", features: [] });
      setIsPathReady(false);
    }
  }, [isTourSimulation, isTourMode, isGraphReady, startLocation]);

  // ===============================
  // Navigation Demo Route Generator
  // ===============================
  useEffect(() => {
    console.log("🔍 Checking Demo Route Condition:", {
      isDemoMode,
      destination,
      hasGraph: !!graphRef.current,
      hasMap: !!mapInstance.current
    });

    if (!isDemoMode || !destination || !graphRef.current || !mapInstance.current) {
      return;
    }

    console.log("🎬 Starting Navigation Demo...");

    const effectiveStart: [number, number] = startLocation || defaultLocation;

    const routeFeature = getRouteGeoJSON(
      graphRef.current,
      effectiveStart,
      destination
    );

    if (!routeFeature) {
      console.error("❌ Demo Route Generation Failed: No route found");
      return;
    }

    const routeCoords = routeFeature.geometry.coordinates;

    currentRouteRef.current = routeCoords;

    const rSrc = mapInstance.current.getSource("route") as maplibregl.GeoJSONSource;
    if (rSrc) {
      rSrc.setData(routeFeature);
    }

    setSimulationPosition(routeCoords[0]);

    simIndexRef.current = 0;
    simStartTimeRef.current = null;

    setIsPathReady(true);

    // Destination marker
    if (destMarkerRef.current) destMarkerRef.current.remove();
    destMarkerRef.current = new maplibregl.Marker({ color: "#ef4444" })
      .setLngLat(destination)
      .addTo(mapInstance.current);

    const bounds = new maplibregl.LngLatBounds();
    routeCoords.forEach((c: any) => bounds.extend(c as [number, number]));
    mapInstance.current.fitBounds(bounds, { padding: 100, duration: 1000 });

  }, [isDemoMode, destination, isGraphReady]);

  // Toggle Layer Visibility (Navigation vs Tour)
  useEffect(() => {
    if (!mapInstance.current) return;
    const map = mapInstance.current;
    const isTourActive = isTourMode || isTourSimulation;

    try {
      // Standard Navigation Layers
      if (map.getLayer("route-line")) {
        map.setLayoutProperty(
          "route-line",
          "visibility",
          isTourActive ? "none" : "visible",
        );
      }
      if (map.getLayer("route-covered")) {
        map.setLayoutProperty(
          "route-covered",
          "visibility",
          isTourActive ? "none" : "visible",
        );
      }

      // Tour Mode Layers
      if (map.getLayer("tour-route-line")) {
        map.setLayoutProperty(
          "tour-route-line",
          "visibility",
          isTourActive ? "visible" : "none",
        );
      }
      if (map.getLayer("tour-route-covered")) {
        map.setLayoutProperty(
          "tour-route-covered",
          "visibility",
          isTourActive ? "visible" : "none",
        );
      }
    } catch (e) {
      console.warn("Could not toggle layers:", e);
    }
  }, [isTourMode, isTourSimulation]);

  useEffect(() => {
    if (!mapInstance.current) return;
    if (pendingLocation) {
      if (!pendingMarkerRef.current) {
        pendingMarkerRef.current = new maplibregl.Marker({ color: "#a855f7" })
          .setLngLat(pendingLocation)
          .addTo(mapInstance.current);
      } else {
        pendingMarkerRef.current.setLngLat(pendingLocation);
      }
    } else if (pendingMarkerRef.current) {
      pendingMarkerRef.current.remove();
      pendingMarkerRef.current = null;
    }

    if (!graphRef.current) return;
    if (startMarkerRef.current) {
      if (!isDemoMode) startMarkerRef.current.setLngLat(currentUserLocation);
      // Toggle marker style
      if (isGuidanceActive || isTourSimulation) {
        startMarkerRef.current.getElement().classList.add("navigating");
      } else {
        startMarkerRef.current.getElement().classList.remove("navigating");
      }
    }

    if (isTourSimulation) return;

    if (!destination || !startLocation || isSelectingStart) {
      // clear route only if NOT demo mode
      if (!isDemoMode) {
        const rSrc = mapInstance.current?.getSource("route") as maplibregl.GeoJSONSource;
        if (rSrc) rSrc.setData({ type: "FeatureCollection", features: [] });

        const cSrc = mapInstance.current?.getSource("route-covered") as maplibregl.GeoJSONSource;
        if (cSrc) cSrc.setData({ type: "FeatureCollection", features: [] });

        setIsPathReady(false);
      }

      return;
    }

    if (isDemoMode || isTourSimulation) return;

    const routeFeature = getRouteGeoJSON(
      graphRef.current,
      currentUserLocation,
      destination,
    );

    if (routeFeature) {
      const routeCoords = routeFeature.geometry.coordinates;
      currentRouteRef.current = routeCoords;

      if (onRouteCalculated) {
        onRouteCalculated(routeFeature.properties.distance);
      }

      const rSrc = mapInstance.current.getSource(
        "route",
      ) as maplibregl.GeoJSONSource;
      if (rSrc) {
        rSrc.setData(routeFeature);
        if (isDemoMode) {
          setSimulationPosition(routeCoords[0]);
        }
        simIndexRef.current = 0;
        simStartTimeRef.current = null;
        setIsPathReady(true);
      }

      if (destMarkerRef.current) destMarkerRef.current.remove();
      const markerPos = markerLocation || destination;
      if (markerPos) {
        destMarkerRef.current = new maplibregl.Marker({ color: "#ef4444" })
          .setLngLat(markerPos)
          .addTo(mapInstance.current);
      }

      const b = new maplibregl.LngLatBounds();
      routeCoords.forEach((c: any) => b.extend(c as [number, number]));
      mapInstance.current.fitBounds(b, { padding: 100, duration: 1000 });
    }
  }, [
    startLocation,
    destination,
    markerLocation,
    pendingLocation,
    isSelectingStart,
    isDemoMode,
    mapStyle,
    isGraphReady,
    isGuidanceActive,
    isTourSimulation,
  ]);



  return (
    <div className="absolute inset-0">
      <div ref={mapRef} className="absolute inset-0" />

      {/* Voice Control Overlay */}
      {(isGuidanceActive || isTourMode || isTourSimulation) && (
        <div className="absolute top-4 right-4 z-[10] flex flex-col gap-2">
          <button
            onClick={toggleMute}
            className={`p-3 rounded-full shadow-lg backdrop-blur-md transition-all ${isMuted ? "bg-red-500 text-white" : "bg-white/90 text-slate-800"
              }`}
            title={isMuted ? "Unmute Voice" : "Mute Voice"}
          >
            {isMuted ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2"
                />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
                />
              </svg>
            )}
          </button>

          <button
            onClick={onToggleSubtitles}
            className={`p-3 rounded-full shadow-lg backdrop-blur-md transition-all ${showSubtitles
                ? "bg-orange-500 text-white"
                : "bg-white/90 text-slate-800"
              }`}
            title={showSubtitles ? "Hide Subtitles" : "Show Subtitles"}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
              />
            </svg>
          </button>

          {(isTourMode || isTourSimulation) && (
            <button
              onClick={repeatLastNarration}
              className="p-3 bg-white/90 text-slate-800 rounded-full shadow-lg backdrop-blur-md transition-all active:scale-90"
              title="Repeat Description"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
            </button>
          )}
        </div>
      )}

      {/* Tour Mode Start Button - Bottom Center */}
      {simulationMode && isTourMode && !isTourSimulation && (
        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 z-[40]">
          <button
            onClick={() => {
              resetSession(); // Clear visited landmarks
              onStartVirtualTour?.(); // Enable narration flag
              onToggleTourSimulation?.(true); // Start movement
            }}
            className="px-8 py-4 bg-indigo-600 text-white font-bold rounded-2xl shadow-2xl hover:bg-indigo-700 active:scale-95 transition-all flex items-center gap-3 border border-indigo-500/20 whitespace-nowrap"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            Start Virtual Tour
          </button>
        </div>
      )}

      {/* Real Application Start Tour Button (GPS Mode) */}
       {!simulationMode && isTourMode && !isTourSimulation && !isVirtualTourRunning && (
        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 z-[40]">
          <button
            onClick={() => {
              resetSession();
              onStartRealTour?.();
            }}
            className="px-8 py-4 bg-orange-500 text-white font-bold rounded-2xl shadow-2xl hover:bg-orange-600 active:scale-95 transition-all flex items-center gap-3 border border-orange-500/20 whitespace-nowrap"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
               <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            Start Tour
          </button>
        </div>
      )}

      {/* Stop Tour Button - Bottom Center */}
      {isTourSimulation && (
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-[40] flex items-center gap-3">
          <button
            onClick={toggleMute}
            className={`p-4 rounded-2xl shadow-2xl backdrop-blur-md transition-all border border-slate-200 ${isMuted ? "bg-red-500 text-white" : "bg-white/90 text-slate-800"
              }`}
          >
            {isMuted ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2"
                />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
                />
              </svg>
            )}
          </button>
          <button
            onClick={() => onToggleTourSimulation?.(false)}
            className="px-8 py-4 bg-red-500 text-white font-bold rounded-2xl shadow-2xl hover:bg-red-600 active:scale-95 transition-all flex items-center gap-3 border border-red-400/20 whitespace-nowrap"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
            Stop Tour
          </button>
        </div>
      )}
    </div>
  );
}
