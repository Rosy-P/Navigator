"use client";

import { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { buildGraph, findNearestNode, aStar, Node, distance, getBearing, getManeuver, getRouteGeoJSON } from "../lib/routing";

interface MapViewProps {
    startLocation?: [number, number];
    destination?: [number, number];
    pendingLocation?: [number, number];
    isSelectingStart?: boolean;
    isGuidanceActive?: boolean;
    isDemoMode?: boolean;
    mapStyle?: string;
    simulationSpeed?: string;
    onLocationSelected?: (coord: [number, number]) => void;
    onSimulationUpdate?: (coord: [number, number], coveredPoints: [number, number][], instruction: string, distanceToNext: string) => void;
    onRouteCalculated?: (distance: number) => void;
    onSelectLandmark?: (landmark: any) => void;
    isPaused?: boolean;
    recenterCount?: number;
}

export default function MapView({
    startLocation,
    destination,
    pendingLocation,
    isSelectingStart,
    isGuidanceActive,
    isDemoMode,
    mapStyle = "voyager",
    simulationSpeed = "normal",
    onLocationSelected,
    onSimulationUpdate,
    onRouteCalculated,
    onSelectLandmark,
    isPaused = false,
    recenterCount = 0
}: MapViewProps) {
    const mapRef = useRef<HTMLDivElement>(null);
    const mapInstance = useRef<maplibregl.Map | null>(null);
    const graphRef = useRef<Map<string, Node> | null>(null);
    const startMarkerRef = useRef<maplibregl.Marker | null>(null);
    const pendingMarkerRef = useRef<maplibregl.Marker | null>(null);
    const destMarkerRef = useRef<maplibregl.Marker | null>(null);

    const currentRouteRef = useRef<[number, number][]>([]);
    const animFrameRef = useRef<number | null>(null);

    // Camera Management Refs
    const cameraModeRef = useRef<"IDLE" | "FOLLOW" | "TURN">("IDLE");
    const lastCameraPosRef = useRef<[number, number] | null>(null);
    const lastCameraBearingRef = useRef<number>(0);
    const smoothedBearingRef = useRef<number>(0);
    const smoothedSpeedRef = useRef<number>(0);

    // Refs for state
    const isSelectingStartRef = useRef(isSelectingStart);
    const onLocationSelectedRef = useRef(onLocationSelected);

    useEffect(() => {
        isSelectingStartRef.current = isSelectingStart;
    }, [isSelectingStart]);

    useEffect(() => {
        onLocationSelectedRef.current = onLocationSelected;
    }, [onLocationSelected]);

    const defaultLocation: [number, number] = [80.120584, 12.923163];
    const currentUserLocation = startLocation || defaultLocation;

    const speedMap = { slow: 1500, normal: 800, fast: 300 };

    // Valid Satellite Style JSON for MapLibre
    const SATELLITE_STYLE = {
        version: 8,
        sources: {
            "raster-tiles": {
                type: "raster",
                tiles: ["https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"],
                tileSize: 256,
                attribution: "ESRI World Imagery"
            }
        },
        layers: [
            { id: "satellite", type: "raster", source: "raster-tiles", minzoom: 0, maxzoom: 22 }
        ]
    };

    const styleMap: Record<string, any> = {
        voyager: "https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json",
        dark: "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json",
        satellite: SATELLITE_STYLE
    };

    useEffect(() => {
        if (!mapRef.current) return;

        const campusCenter: [number, number] = [80.1235, 12.9180];
        const bounds: [number, number, number, number] = [80.108, 12.910, 80.132, 12.926];

        const map = new maplibregl.Map({
            container: mapRef.current,
            style: styleMap[mapStyle] || styleMap.voyager,
            center: campusCenter,
            zoom: 16.2,
            maxBounds: bounds,
            pitch: 0,
            bearing: 0,
            attributionControl: false
        });

        mapInstance.current = map;

        const loadResources = async () => {
            try {
                // 1. Boundary
                fetch("/data/raw/mcc-boundary.geojson").then(r => r.json()).then(data => {
                    map.addSource("mcc-boundary", { type: "geojson", data });
                });

                // 2. Landmarks
                const landmarkRes = await fetch("/data/mcc-landmarks.json");
                const rawLandmarks = await landmarkRes.json();
                const features: any[] = [];
                ["classrooms", "departments", "facilities"].forEach(cat => {
                    if (rawLandmarks[cat]) {
                        rawLandmarks[cat].forEach((item: any, idx: number) => {
                            if (item.lng > 80.108 && item.lng < 80.132) {
                                features.push({
                                    type: "Feature",
                                    properties: { id: `${cat}-${idx}`, ...item },
                                    geometry: { type: "Point", coordinates: [item.lng, item.lat] }
                                });
                            }
                        });
                    }
                });

                map.addSource("landmarks", { type: "geojson", data: { type: "FeatureCollection", features } as any });

                map.addLayer({
                    id: "landmarks-points",
                    type: "circle",
                    source: "landmarks",
                    paint: {
                        "circle-radius": ["interpolate", ["linear"], ["zoom"], 15, 9, 18, 18],
                        "circle-color": mapStyle === "satellite" ? "#ffffff" : "#111827",
                        "circle-stroke-width": 2,
                        "circle-stroke-color": mapStyle === "satellite" ? "#111827" : "#ffffff",
                    },
                });

                map.addLayer({
                    id: "landmarks-icons",
                    type: "symbol",
                    source: "landmarks",
                    layout: { "text-field": "📍", "text-size": 12, "text-allow-overlap": true },
                    paint: { "text-color": "#fb923c" }
                });

                map.addLayer({
                    id: "landmarks-labels",
                    type: "symbol",
                    source: "landmarks",
                    layout: {
                        "text-field": ["get", "name"],
                        "text-font": ["Open Sans Bold", "Arial Unicode MS Bold"],
                        "text-size": ["interpolate", ["linear"], ["zoom"], 15, 0, 16, 11, 18, 14],
                        "text-offset": [0, 1.5],
                        "text-anchor": "top",
                        "text-allow-overlap": false
                    },
                    paint: {
                        "text-color": mapStyle === "satellite" ? "#ffffff" : "#1e293b",
                        "text-halo-color": mapStyle === "satellite" ? "#000000" : "#ffffff",
                        "text-halo-width": 2
                    }
                });

                // 3. Paths (Using unified walk network)
                const pathsRes = await fetch("/data/final/mcc-walk-network.geojson");
                const pathsData = await pathsRes.json();
                graphRef.current = buildGraph(pathsData);
                map.addSource("mcc-paths", { type: "geojson", data: pathsData });

                map.addLayer({
                    id: "paths-main",
                    type: "line",
                    source: "mcc-paths",
                    paint: {
                        "line-color": mapStyle === "satellite" ? "#ffffff" : "#e2e8f0",
                        "line-width": ["interpolate", ["linear"], ["zoom"], 15, 1, 18, 3],
                        "line-opacity": 0.6
                    },
                });

                // 4. Route Layers
                map.addSource("route", { type: "geojson", data: { type: "FeatureCollection", features: [] } });
                map.addSource("route-covered", { type: "geojson", data: { type: "FeatureCollection", features: [] } });

                map.addLayer({
                    id: "route-covered",
                    type: "line",
                    source: "route-covered",
                    layout: { "line-join": "round", "line-cap": "round" },
                    paint: { "line-color": "#94a3b8", "line-width": 8, "line-opacity": 0.7 }
                });

                map.addLayer({
                    id: "route-line",
                    type: "line",
                    source: "route",
                    layout: { "line-join": "round", "line-cap": "round" },
                    paint: { "line-color": "#3b82f6", "line-width": 8, "line-opacity": 1 }
                });

                // Marker
                const el = document.createElement('div');
                el.className = 'user-marker-container';
                el.innerHTML = '<div class="nav-shadow"></div><div class="nav-arrow"></div><div class="user-marker-pulse"></div>';
                startMarkerRef.current = new maplibregl.Marker({ element: el, rotationAlignment: 'map' }).setLngLat(currentUserLocation).addTo(map);

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
                        const coord = (feature.geometry as any).coordinates as [number, number];
                        if (onSelectLandmark) onSelectLandmark({ ...feature.properties, lng: coord[0], lat: coord[1] });
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


    // Zoom to Destination
    useEffect(() => {
        if (!mapInstance.current || !destination || isGuidanceActive) return;
        mapInstance.current.easeTo({
            center: destination,
            zoom: 18,
            duration: 1200
        });
    }, [destination, isGuidanceActive]);

    // Speed configuration (meters per second)
    const speedTable = {
        "slow": 3,
        "normal": 7,
        "fast": 15
    };

    useEffect(() => {
        if (!isDemoMode || !isGuidanceActive || currentRouteRef.current.length === 0 || !mapInstance.current || isPaused) {
            if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
            cameraModeRef.current = "IDLE";
            return;
        }

        const path = currentRouteRef.current;
        let segmentIndex = 0;
        let segmentStartPos = path[0];
        let segmentEndPos = path[1];
        let segmentStartTime = performance.now();
        let segmentDistance = distance(segmentStartPos, segmentEndPos);
        const map = mapInstance.current!;
        const speed = (speedTable as any)[simulationSpeed] || 7;
        let segmentDuration = (segmentDistance / speed) * 1000;

        cameraModeRef.current = "FOLLOW";
        smoothedBearingRef.current = getBearing(segmentStartPos, segmentEndPos);

        const animate = (time: number) => {
            if (isPaused) {
                segmentStartTime = time - (time - segmentStartTime); // Pause logic
                animFrameRef.current = requestAnimationFrame(animate);
                return;
            }

            let elapsed = time - segmentStartTime;
            let t = Math.min(elapsed / segmentDuration, 1);

            // Interpolate position
            const currentLng = segmentStartPos[0] + (segmentEndPos[0] - segmentStartPos[0]) * t;
            const currentLat = segmentStartPos[1] + (segmentEndPos[1] - segmentStartPos[1]) * t;
            const currentPos: [number, number] = [currentLng, currentLat];

            const targetBearing = getBearing(segmentStartPos, segmentEndPos);

            // Smoothing for map bearing
            const alpha = 0.08;
            let diff = targetBearing - smoothedBearingRef.current;
            while (diff > 180) diff -= 360;
            while (diff < -180) diff += 360;
            smoothedBearingRef.current = (smoothedBearingRef.current + diff * alpha + 360) % 360;

            if (startMarkerRef.current) {
                startMarkerRef.current.setLngLat(currentPos);
                startMarkerRef.current.setRotation(targetBearing);
            }

            // Camera Throttling: Only easeTo when needed to prevent stutter
            const distChanged = !lastCameraPosRef.current || distance(currentPos, lastCameraPosRef.current) > 0.4;
            const bearingChanged = Math.abs(smoothedBearingRef.current - lastCameraBearingRef.current) > 1.0;

            if (distChanged || bearingChanged) {
                if (segmentIndex < path.length - 2) {
                    const b1 = getBearing(segmentStartPos, segmentEndPos);
                    const bNext = getBearing(path[segmentIndex + 1], path[segmentIndex + 2]);
                    const maneuver = getManeuver(b1, bNext);
                    cameraModeRef.current = maneuver !== "Continue straight" ? "TURN" : "FOLLOW";
                }

                // Calculate and Smooth Velocity
                const targetSpeed = speed; // Use segment speed
                const speedAlpha = 0.03; // Smooth velocity transitions
                smoothedSpeedRef.current = smoothedSpeedRef.current + (targetSpeed - smoothedSpeedRef.current) * speedAlpha;

                // Map speed to dynamic offset (110px at 3m/s -> 220px at 15m/s)
                const speedFactor = Math.max(0, Math.min(1, (smoothedSpeedRef.current - 3) / (15 - 3)));
                const dynamicOffset = 110 + speedFactor * (220 - 110);

                const rad = smoothedBearingRef.current * (Math.PI / 180);
                const x = Math.sin(rad);
                const y = Math.cos(rad);

                const offsetX = -x * dynamicOffset;
                const offsetY = y * dynamicOffset;

                map.easeTo({
                    center: currentPos,
                    bearing: smoothedBearingRef.current,
                    pitch: cameraModeRef.current === "TURN" ? 45 : 60,
                    offset: [offsetX, offsetY],
                    duration: 150,
                    easing: (t) => t
                });

                lastCameraPosRef.current = currentPos;
                lastCameraBearingRef.current = smoothedBearingRef.current;
            }

            // Update Route Layers
            const cSrc = mapInstance.current!.getSource("route-covered") as maplibregl.GeoJSONSource;
            if (cSrc) {
                const covered = [...path.slice(0, segmentIndex + 1), currentPos];
                cSrc.setData({ type: "Feature", geometry: { type: "LineString", coordinates: covered } } as any);
            }

            const rSrc = mapInstance.current!.getSource("route") as maplibregl.GeoJSONSource;
            if (rSrc) {
                const remaining = [currentPos, ...path.slice(segmentIndex + 1)];
                rSrc.setData({ type: "Feature", geometry: { type: "LineString", coordinates: remaining } } as any);
            }

            // Navigation Instructions calculation
            let instruction = "Continue straight";
            let distToManeuver = segmentDistance * (1 - t);

            // Look ahead for turns
            if (segmentIndex < path.length - 2) {
                const b1 = getBearing(segmentStartPos, segmentEndPos);
                const bNext = getBearing(path[segmentIndex + 1], path[segmentIndex + 2]);
                const nextManeuver = getManeuver(b1, bNext);

                if (nextManeuver !== "Continue straight") {
                    instruction = nextManeuver;
                } else {
                    // Accumulate distance if straight
                    let lookaheadDist = distToManeuver;
                    for (let i = segmentIndex + 1; i < path.length - 1; i++) {
                        const bCurr = getBearing(path[i - 1], path[i]);
                        const bNextCheck = getBearing(path[i], path[i + 1]);
                        const m = getManeuver(bCurr, bNextCheck);
                        if (m !== "Continue straight") {
                            instruction = m;
                            break;
                        }
                        lookaheadDist += distance(path[i], path[i + 1]);
                    }
                    distToManeuver = lookaheadDist;
                }
            } else {
                if (segmentIndex === path.length - 2 && t > 0.95) {
                    instruction = "You have arrived";
                    distToManeuver = 0;
                }
            }

            const distText = distToManeuver >= 1000
                ? `${(distToManeuver / 1000).toFixed(1)}km`
                : `${Math.round(distToManeuver)}m`;

            if (onSimulationUpdate) {
                onSimulationUpdate(currentPos, path.slice(0, segmentIndex + 1), instruction, distText);
            }

            if (t < 1) {
                animFrameRef.current = requestAnimationFrame(animate);
            } else {
                // Move to next segment
                segmentIndex++;
                if (segmentIndex < path.length - 1) {
                    segmentStartPos = path[segmentIndex];
                    segmentEndPos = path[segmentIndex + 1];
                    segmentStartTime = performance.now();
                    segmentDistance = distance(segmentStartPos, segmentEndPos);
                    segmentDuration = (segmentDistance / speed) * 1000;
                    animFrameRef.current = requestAnimationFrame(animate);
                } else {
                    // Finished
                }
            }
        };

        animFrameRef.current = requestAnimationFrame(animate);

        return () => {
            if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
        };
    }, [isDemoMode, isGuidanceActive, isPaused, simulationSpeed]);

    // Manual Recenter
    useEffect(() => {
        if (recenterCount > 0 && mapInstance.current && startMarkerRef.current) {
            mapInstance.current.easeTo({
                center: startMarkerRef.current.getLngLat(),
                zoom: 18,
                duration: 1000
            });
        }
    }, [recenterCount]);

    useEffect(() => {
        if (!mapInstance.current) return;
        if (pendingLocation) {
            if (!pendingMarkerRef.current) {
                pendingMarkerRef.current = new maplibregl.Marker({ color: "#a855f7" }).setLngLat(pendingLocation).addTo(mapInstance.current);
            } else {
                pendingMarkerRef.current.setLngLat(pendingLocation);
            }
        } else if (pendingMarkerRef.current) {
            pendingMarkerRef.current.remove();
            pendingMarkerRef.current = null;
        }

        if (!graphRef.current) return;
        if (startMarkerRef.current && !isDemoMode) startMarkerRef.current.setLngLat(currentUserLocation);

        if (!destination || !startLocation || isSelectingStart) {
            const rSrc = mapInstance.current.getSource("route") as maplibregl.GeoJSONSource;
            if (rSrc) rSrc.setData({ type: "FeatureCollection", features: [] });
            const cSrc = mapInstance.current.getSource("route-covered") as maplibregl.GeoJSONSource;
            if (cSrc) cSrc.setData({ type: "FeatureCollection", features: [] });

            if (destMarkerRef.current && !destination) destMarkerRef.current.remove();
            if (destination) {
                if (destMarkerRef.current) destMarkerRef.current.remove();
                destMarkerRef.current = new maplibregl.Marker({ color: "#ef4444" }).setLngLat(destination).addTo(mapInstance.current);
            }
            return;
        }

        const routeFeature = getRouteGeoJSON(graphRef.current, currentUserLocation, destination);

        if (routeFeature) {
            const routeCoords = routeFeature.geometry.coordinates;
            currentRouteRef.current = routeCoords;

            if (onRouteCalculated) {
                onRouteCalculated(routeFeature.properties.distance);
            }

            const rSrc = mapInstance.current.getSource("route") as maplibregl.GeoJSONSource;
            if (rSrc) rSrc.setData(routeFeature);

            if (destMarkerRef.current) destMarkerRef.current.remove();
            destMarkerRef.current = new maplibregl.Marker({ color: "#ef4444" }).setLngLat(destination).addTo(mapInstance.current);

            const b = new maplibregl.LngLatBounds();
            routeCoords.forEach((c: any) => b.extend(c as [number, number]));
            mapInstance.current.fitBounds(b, { padding: 100, duration: 1000 });
        }
    }, [startLocation, destination, pendingLocation, isSelectingStart, isDemoMode, mapStyle]);

    return <div ref={mapRef} className="absolute inset-0" />;
}
