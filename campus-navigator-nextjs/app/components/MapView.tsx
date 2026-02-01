"use client";

import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

export default function MapView() {
    const mapRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!mapRef.current) return;

        // Madras Christian College Coordinates
        // Centering: Balanced perspective before the strict lock
        const campusCenter: [number, number] = [80.1235, 12.9180];

        // Looser bounds providing "breathing room" on the left as requested before the lock
        const bounds: [number, number, number, number] = [
            80.108, 12.910, // Sw: Lng, Lat
            80.132, 12.926  // Ne: Lng, Lat
        ];

        const map = new maplibregl.Map({
            container: mapRef.current,
            style: "https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json",
            center: campusCenter,
            zoom: 16.2,
            maxBounds: bounds,
            pitch: 0,
            bearing: 0,
            attributionControl: false
        });

        map.on("load", async () => {
            try {
                // 1. Load MCC Boundary (Source only)
                const boundaryRes = await fetch("/data/mcc-boundary.geojson");
                const boundaryData = await boundaryRes.json();

                map.addSource("mcc-boundary", {
                    type: "geojson",
                    data: boundaryData,
                });

                // 2. Load and Transform Landmarks (Custom JSON -> GeoJSON)
                const landmarkRes = await fetch("/data/mcc-landmarks.json");
                const rawLandmarks = await landmarkRes.json();

                const features: any[] = [];
                const categories = ["classrooms", "departments", "facilities"];

                categories.forEach(cat => {
                    if (rawLandmarks[cat]) {
                        rawLandmarks[cat].forEach((item: any, idx: number) => {
                            // Filter: Match the looser campus range
                            if (item.lng > 80.108 && item.lng < 80.132) {
                                features.push({
                                    type: "Feature",
                                    properties: {
                                        id: `${cat}-${idx}`,
                                        name: item.name,
                                        category: item.category,
                                        ...item
                                    },
                                    geometry: {
                                        type: "Point",
                                        coordinates: [item.lng, item.lat]
                                    }
                                });
                            }
                        });
                    }
                });

                map.addSource("landmarks", {
                    type: "geojson",
                    data: { type: "FeatureCollection", features } as any,
                });

                // 3. Landmarks Layer: POINTS
                map.addLayer({
                    id: "landmarks-points",
                    type: "circle",
                    source: "landmarks",
                    paint: {
                        "circle-radius": ["interpolate", ["linear"], ["zoom"], 12, 2, 16, 5, 18, 9],
                        "circle-color": "#f59e0b",
                        "circle-stroke-width": ["interpolate", ["linear"], ["zoom"], 15, 1, 18, 2],
                        "circle-stroke-color": "#ffffff",
                    },
                });

                // 4. Landmarks Layer: LABELS
                map.addLayer({
                    id: "landmarks-labels",
                    type: "symbol",
                    source: "landmarks",
                    minzoom: 15.0,
                    layout: {
                        "text-field": ["get", "name"],
                        "text-font": ["Open Sans Bold"],
                        "text-size": 11,
                        "text-offset": [0, 1.5],
                        "text-anchor": "top",
                    },
                    paint: {
                        "text-color": "#0f172a",
                        "text-halo-color": "#ffffff",
                        "text-halo-width": 2,
                    },
                });

                // 5. Load MCC Paths
                map.addSource("mcc-paths", {
                    type: "geojson",
                    data: "/data/mcc-paths.geojson",
                });

                map.addLayer({
                    id: "paths-glow",
                    type: "line",
                    source: "mcc-paths",
                    paint: {
                        "line-color": "#ffffff",
                        "line-width": ["interpolate", ["linear"], ["zoom"], 15, 3, 18, 7],
                        "line-opacity": 0.2,
                        "line-blur": 2,
                    },
                });

                map.addLayer({
                    id: "paths-main",
                    type: "line",
                    source: "mcc-paths",
                    paint: {
                        "line-color": "#e2e8f0",
                        "line-width": ["interpolate", ["linear"], ["zoom"], 15, 0.5, 18, 2],
                    },
                });

                // Interaction Logic
                map.on("click", "landmarks-points", (e) => {
                    if (e.features && e.features[0]) {
                        const feature = e.features[0];
                        map.easeTo({
                            center: (feature.geometry as any).coordinates,
                            zoom: 18,
                            duration: 1000
                        });
                    }
                });

                map.on("mouseenter", "landmarks-points", () => map.getCanvas().style.cursor = "pointer");
                map.on("mouseleave", "landmarks-points", () => map.getCanvas().style.cursor = "");

            } catch (err) {
                console.error("Error loading map assets:", err);
            }
        });

        return () => map.remove();
    }, []);

    return <div ref={mapRef} className="absolute inset-0" />;
}
