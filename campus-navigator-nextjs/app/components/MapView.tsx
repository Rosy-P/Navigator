"use client";

import { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { buildGraph, findNearestNode, aStar, Node, distance } from "../lib/routing";

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
    onSimulationUpdate?: (coord: [number, number], coveredPoints: [number, number][]) => void;
    onRouteCalculated?: (distance: number) => void;
    onSelectLandmark?: (landmark: any) => void;
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
    onSelectLandmark
}: MapViewProps) {
    const mapRef = useRef<HTMLDivElement>(null);
    const mapInstance = useRef<maplibregl.Map | null>(null);
    const graphRef = useRef<Map<string, Node> | null>(null);
    const startMarkerRef = useRef<maplibregl.Marker | null>(null);
    const pendingMarkerRef = useRef<maplibregl.Marker | null>(null);
    const destMarkerRef = useRef<maplibregl.Marker | null>(null);

    const currentRouteRef = useRef<[number, number][]>([]);
    const simulationIntervalRef = useRef<NodeJS.Timeout | null>(null);

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
                fetch("/data/mcc-boundary.geojson").then(r => r.json()).then(data => {
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

                // 3. Paths
                const pathsRes = await fetch("/data/mcc-paths.geojson");
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
                el.innerHTML = '<div class="user-marker-pulse"></div><div class="user-marker-dot"></div>';
                startMarkerRef.current = new maplibregl.Marker({ element: el }).setLngLat(currentUserLocation).addTo(map);

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

    // Guidance mode & Demo
    useEffect(() => {
        if (!mapInstance.current) return;
        if (isGuidanceActive) {
            mapInstance.current.easeTo({ pitch: 45, duration: 1000 });
        } else {
            mapInstance.current.easeTo({ pitch: 0, duration: 1000 });
        }
    }, [isGuidanceActive]);

    useEffect(() => {
        if (!isDemoMode || !isGuidanceActive || currentRouteRef.current.length === 0 || !mapInstance.current) {
            if (simulationIntervalRef.current) clearInterval(simulationIntervalRef.current);
            return;
        }

        let step = 0;
        const fullPath = currentRouteRef.current;
        const interval = (speedMap as any)[simulationSpeed] || 800;

        simulationIntervalRef.current = setInterval(() => {
            if (step >= fullPath.length) {
                if (simulationIntervalRef.current) clearInterval(simulationIntervalRef.current);
                return;
            }
            const currentPos = fullPath[step] as [number, number];
            if (startMarkerRef.current) startMarkerRef.current.setLngLat(currentPos);

            const cSrc = mapInstance.current!.getSource("route-covered") as maplibregl.GeoJSONSource;
            if (cSrc) cSrc.setData({ type: "Feature", geometry: { type: "LineString", coordinates: fullPath.slice(0, step + 1) } } as any);

            const rSrc = mapInstance.current!.getSource("route") as maplibregl.GeoJSONSource;
            if (rSrc) rSrc.setData({ type: "Feature", geometry: { type: "LineString", coordinates: fullPath.slice(step) } } as any);

            step++;
        }, interval);

        return () => { if (simulationIntervalRef.current) clearInterval(simulationIntervalRef.current); };
    }, [isDemoMode, isGuidanceActive, simulationSpeed]);

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

        const sNode = findNearestNode(currentUserLocation, graphRef.current);
        const eNode = findNearestNode(destination, graphRef.current);
        const nodePath = aStar(graphRef.current, sNode.id, eNode.id);

        if (nodePath.length > 0) {
            const routeCoords = nodePath.map(id => graphRef.current!.get(id)!.coord);
            currentRouteRef.current = routeCoords;
            if (onRouteCalculated) onRouteCalculated(distance(routeCoords[0] as any, routeCoords[routeCoords.length - 1] as any)); // rough dist

            const rSrc = mapInstance.current.getSource("route") as maplibregl.GeoJSONSource;
            if (rSrc) rSrc.setData({ type: "Feature", geometry: { type: "LineString", coordinates: routeCoords } } as any);

            if (destMarkerRef.current) destMarkerRef.current.remove();
            destMarkerRef.current = new maplibregl.Marker({ color: "#ef4444" }).setLngLat(destination).addTo(mapInstance.current);

            const b = new maplibregl.LngLatBounds();
            routeCoords.forEach(c => b.extend(c as [number, number]));
            mapInstance.current.fitBounds(b, { padding: 100 });
        }
    }, [startLocation, destination, pendingLocation, isSelectingStart, isDemoMode, mapStyle]);

    return <div ref={mapRef} className="absolute inset-0" />;
}
