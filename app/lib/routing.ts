export type Node = {
    id: string;
    coord: [number, number];
    neighbors: { id: string; cost: number; category?: string }[];
};

/**
 * Calculates the Haversine distance between two coordinates in meters.
 */
export function distance(a: [number, number], b: [number, number]): number {
    if (!a || !b) return Infinity;
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (a[1] * Math.PI) / 180;
    const φ2 = (b[1] * Math.PI) / 180;
    const Δφ = ((b[1] - a[1]) * Math.PI) / 180;
    const Δλ = ((b[0] - a[0]) * Math.PI) / 180;

    const x =
        Math.sin(Δφ / 2) ** 2 +
        Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;

    return 2 * R * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

/**
 * Builds a graph from a GeoJSON FeatureCollection containing LineStrings.
 * Supports merging main paths with shortcuts and snapping shortcut endpoints.
 */
export function buildGraph(mainGeojson: any, shortcutGeojson?: any): Map<string, Node> {
    const graph = new Map<string, Node>();
    let mainSegments = 0;
    let shortcutSegments = 0;

    // Helper to get normalized ID (7 decimal places ~1.1cm precision)
    const getCoordId = (c: [number, number]) => `${Math.round(c[0] * 1e7)},${Math.round(c[1] * 1e7)}`;

    // Resolution: Interpolate long segments to improve snapping accuracy
    const MAX_SEG_LEN = 2.0; // 2m resolution for millimeter-precision snapping
    const interpolateSegment = (start: [number, number], end: [number, number]): [number, number][] => {
        const d = distance(start, end);
        if (d <= MAX_SEG_LEN) return [start, end];
        const steps = Math.ceil(d / MAX_SEG_LEN);
        const pts: [number, number][] = [start];
        for (let j = 1; j < steps; j++) {
            const r = j / steps;
            pts.push([start[0] + (end[0] - start[0]) * r, start[1] + (end[1] - start[1]) * r]);
        }
        pts.push(end);
        return pts;
    };

    // PHASE 1: Process Main Paths (Paths + Connectors)
    if (mainGeojson && mainGeojson.features) {
        mainGeojson.features.forEach((feature: any) => {
            if (feature.geometry.type !== "LineString") return;
            const rawCoords = feature.geometry.coordinates;
            const category = feature.properties?.category;

            for (let i = 0; i < rawCoords.length - 1; i++) {
                const segPoints = interpolateSegment(rawCoords[i], rawCoords[i+1]);
                for (let j = 0; j < segPoints.length - 1; j++) {
                    const a = segPoints[j];
                    const b = segPoints[j+1];
                    const idA = getCoordId(a);
                    const idB = getCoordId(b);

                    if (!graph.has(idA)) graph.set(idA, { id: idA, coord: a, neighbors: [] });
                    if (!graph.has(idB)) graph.set(idB, { id: idB, coord: b, neighbors: [] });

                    const cost = distance(a, b);
                    if (!graph.get(idA)!.neighbors.some(n => n.id === idB)) {
                        graph.get(idA)!.neighbors.push({ id: idB, cost, category });
                        graph.get(idB)!.neighbors.push({ id: idA, cost, category });
                        mainSegments++;
                    }
                }
            }
        });
    }

    const mainNodes = new Set(graph.keys());

    // PHASE 2: Process Shortcuts with Snapping and Interpolation
    if (shortcutGeojson && shortcutGeojson.features) {
        shortcutGeojson.features.forEach((feature: any) => {
            if (feature.geometry.type !== "LineString") return;
            const originalCoords = [...feature.geometry.coordinates];
            const category = feature.properties?.category || "shortcut";

            // Snapping for shortcut endpoints
            const SNAP_THRESHOLD = 5.0; // meters
            
            // Start endpoint snapping
            const idStart = getCoordId(originalCoords[0]);
            if (!mainNodes.has(idStart)) {
                let nearestMain: string | null = null;
                let minDist = SNAP_THRESHOLD;
                for (const mainId of mainNodes) {
                    const d = distance(originalCoords[0], graph.get(mainId)!.coord);
                    if (d < minDist) { minDist = d; nearestMain = mainId; }
                }
                if (nearestMain) originalCoords[0] = graph.get(nearestMain)!.coord;
            }

            // End endpoint snapping
            const lastIdx = originalCoords.length - 1;
            const idEnd = getCoordId(originalCoords[lastIdx]);
            if (!mainNodes.has(idEnd)) {
                let nearestMain: string | null = null;
                let minDist = SNAP_THRESHOLD;
                for (const mainId of mainNodes) {
                    const d = distance(originalCoords[lastIdx], graph.get(mainId)!.coord);
                    if (d < minDist) { minDist = d; nearestMain = mainId; }
                }
                if (nearestMain) originalCoords[lastIdx] = graph.get(nearestMain)!.coord;
            }

            // Process segments with interpolation
            for (let i = 0; i < originalCoords.length - 1; i++) {
                const segPoints = interpolateSegment(originalCoords[i], originalCoords[i+1]);
                for (let j = 0; j < segPoints.length - 1; j++) {
                    const a = segPoints[j];
                    const b = segPoints[j+1];
                    const idA = getCoordId(a);
                    const idB = getCoordId(b);

                    if (!graph.has(idA)) graph.set(idA, { id: idA, coord: a, neighbors: [] });
                    if (!graph.has(idB)) graph.set(idB, { id: idB, coord: b, neighbors: [] });

                    const cost = distance(a, b);
                    if (!graph.get(idA)!.neighbors.some(n => n.id === idB)) {
                        graph.get(idA)!.neighbors.push({ id: idB, cost, category });
                        graph.get(idB)!.neighbors.push({ id: idA, cost, category });
                        shortcutSegments++;
                    }
                }
            }
        });
    }

    console.log(`🏗️ Graph Built: ${graph.size} nodes.`);
    console.log(`📊 Total Main Path segments: ${mainSegments}`);
    console.log(`📊 Total Shortcut segments: ${shortcutSegments}`);
    console.log(`📊 Total Graph Nodes: ${graph.size}`);

    // --- GAP REPAIR PHASE ---
    // connect nodes that are very close (e.g. broken paths) but not connected
    const GAP_REPAIR_DIST = 1.0; // 1m threshold to prevent corner-cutting while fixing data gaps
    let gapsRepaired = 0;
    const nodes = Array.from(graph.values());

    // Spatial Indexing (Simple Grid) to avoid O(N^2)
    // 0.001 degrees is roughly 111 meters. Perfect for buckets.
    const grid = new Map<string, Node[]>();
    const getGridKey = (c: [number, number]) => `${Math.floor(c[0] * 1000)},${Math.floor(c[1] * 1000)}`;

    nodes.forEach(node => {
        const key = getGridKey(node.coord);
        if (!grid.has(key)) grid.set(key, []);
        grid.get(key)!.push(node);
    });

    nodes.forEach(nodeA => {
        const key = getGridKey(nodeA.coord);
        // Check current cell and neighbors
        const [x, y] = [Math.floor(nodeA.coord[0] * 1000), Math.floor(nodeA.coord[1] * 1000)];
        
        for (let dx = -1; dx <= 1; dx++) {
            for (let dy = -1; dy <= 1; dy++) {
                const neighborKey = `${x + dx},${y + dy}`;
                const cellNodes = grid.get(neighborKey);
                if (!cellNodes) continue;

                for (const nodeB of cellNodes) {
                    if (nodeA.id === nodeB.id) continue;
                    
                    // Already connected?
                    if (nodeA.neighbors.some(n => n.id === nodeB.id)) continue;

                    const d = distance(nodeA.coord, nodeB.coord);
                    if (d < GAP_REPAIR_DIST) {
                        // Connect them!
                        nodeA.neighbors.push({ id: nodeB.id, cost: d });
                        nodeB.neighbors.push({ id: nodeA.id, cost: d });
                        gapsRepaired++;
                    }
                }
            }
        }
    });
    
    if (gapsRepaired > 0) {
        console.log(`🧵 Repaired ${gapsRepaired} gaps / split paths (dist < ${GAP_REPAIR_DIST}m).`);
    }

    // --- Component Analysis (For Logging Only) ---
    const getComponents = (currentGraph: Map<string, Node>) => {
        const visited = new Set<string>();
        const componentList: string[][] = [];
        for (const startId of currentGraph.keys()) {
            if (!visited.has(startId)) {
                const component: string[] = [];
                const stack = [startId];
                visited.add(startId);
                while (stack.length > 0) {
                    const currentId = stack.pop()!;
                    component.push(currentId);
                    const currNode = currentGraph.get(currentId);
                    if (currNode) {
                        for (const n of currNode.neighbors) {
                            if (!visited.has(n.id)) {
                                visited.add(n.id);
                                stack.push(n.id);
                            }
                        }
                    }
                }
                componentList.push(component);
            }
        }
        return componentList;
    };

    const finalComponents = getComponents(graph);
    console.log(`🌐 Final Graph Analysis: ${finalComponents.length} component(s) identified.`);
    console.log(`📊 Total nodes: ${graph.size}`);
    return graph;
}

const SHORTCUT_COST_MULTIPLIER = 1.2; // Prefer main roads unless shortcut is >20% shorter

/**
 * Finds the nearest node in the graph to a given coordinate.
 */
export function findNearestNode(
    coord: [number, number] | null | undefined,
    graph: Map<string, Node>
): Node | null {
    if (!coord) return null;
    let nearest: Node | null = null;
    let min = Infinity;

    graph.forEach((node) => {
        const d = distance(coord, node.coord);
        if (d < min) {
            min = d;
            nearest = node;
        }
    });

    return nearest;
}

/**
 * Finds the shortest path between two nodes using the A* algorithm.
 */
export function aStar(
    graph: Map<string, Node>,
    startId: string,
    goalId: string
): string[] {
    if (startId === goalId) return [startId];

    const startNode = graph.get(startId);
    const goalNode = graph.get(goalId);
    if (!startNode || !goalNode) return [];

    const open = new Set([startId]);
    const closed = new Set<string>();
    const cameFrom = new Map<string, string>();

    const g = new Map<string, number>();
    const f = new Map<string, number>();

    graph.forEach((_, id) => {
        g.set(id, Infinity);
        f.set(id, Infinity);
    });

    g.set(startId, 0);
    f.set(startId, distance(startNode.coord, goalNode.coord));

    console.log(`🗺️ A* Start: ${startId} at ${startNode.coord}`);
    console.log(`🎯 A* Goal: ${goalId} at ${goalNode.coord}`);

    let iterations = 0;
    const MAX_ITERATIONS = 5000;

    while (open.size > 0 && iterations < MAX_ITERATIONS) {
        iterations++;

        // Find the node in 'open' with the lowest f value
        let current: string | null = null;
        let minF = Infinity;

        for (const id of open) {
            const fScore = f.get(id) ?? Infinity;
            if (current === null || fScore < minF) {
                current = id;
                minF = fScore;
            }
        }

        if (!current) break;
        if (current === goalId) {
            const path = [];
            let cur: string | undefined = current;
            while (cur && cameFrom.has(cur)) {
                path.unshift(cur);
                cur = cameFrom.get(cur);
            }
            path.unshift(startId);
            return path;
        }

        open.delete(current);
        closed.add(current);

        const currentNode = graph.get(current);
        if (!currentNode) continue;

        for (const n of currentNode.neighbors) {
            if (closed.has(n.id)) continue;

            const gScore = g.get(current) ?? Infinity;
            const tempGScore = gScore + n.cost;

            if (!open.has(n.id)) {
                open.add(n.id);
            } else if (tempGScore >= (g.get(n.id) ?? Infinity)) {
                continue;
            }

            cameFrom.set(n.id, current);
            g.set(n.id, tempGScore);

            const neighborNode = graph.get(n.id);
            if (neighborNode) {
                // Weighted A*: Use 1.2x heuristic weight to prefer more direct paths
                const heuristic = distance(neighborNode.coord, goalNode.coord);
                f.set(n.id, tempGScore + (heuristic * 1.2));
            }
        }
    }

    if (iterations >= MAX_ITERATIONS) {
        console.warn("A* reached max iterations - path might be incomplete or graph too large");
    }

    return [];
}

/**
 * Calculates the bearing between two points in degrees.
 */
export function getBearing(a: [number, number], b: [number, number]): number {
    const lon1 = (a[0] * Math.PI) / 180;
    const lat1 = (a[1] * Math.PI) / 180;
    const lon2 = (b[0] * Math.PI) / 180;
    const lat2 = (b[1] * Math.PI) / 180;
    const y = Math.sin(lon2 - lon1) * Math.cos(lat2);
    const x =
        Math.cos(lat1) * Math.sin(lat2) -
        Math.sin(lat1) * Math.cos(lat2) * Math.cos(lon2 - lon1);
    const bearing = (Math.atan2(y, x) * 180) / Math.PI;
    return (bearing + 360) % 360;
}

/**
 * Determines the maneuver based on the change in bearing.
 */
export function getManeuver(b1: number, b2: number): string {
    let diff = b2 - b1;
    while (diff > 180) diff -= 360;
    while (diff < -180) diff += 360;

    if (diff > 35) return "Turn right";
    if (diff < -35) return "Turn left";
    return "Continue straight";
}
/**
 * Simplifies a path by removing redundant intermediate nodes.
 * A node is redundant if it's nearly collinear with its neighbors.
 */
function simplifyPath(
    nodePath: string[],
    graph: Map<string, Node>,
    angleThreshold: number = 160 // degrees - nodes within this angle are considered collinear (was 170)
): string[] {
    if (nodePath.length <= 2) return nodePath;

    const simplified: string[] = [nodePath[0]]; // Always keep start

    for (let i = 1; i < nodePath.length - 1; i++) {
        const prev = graph.get(nodePath[i - 1])!;
        const curr = graph.get(nodePath[i])!;
        const next = graph.get(nodePath[i + 1])!;

        // Calculate bearing from prev to curr, and curr to next
        const bearing1 = getBearing(prev.coord, curr.coord);
        const bearing2 = getBearing(curr.coord, next.coord);

        // Calculate angle difference
        let angleDiff = Math.abs(bearing2 - bearing1);
        if (angleDiff > 180) angleDiff = 360 - angleDiff;

        // If the angle is sharp (not nearly straight), keep this node
        if (angleDiff < angleThreshold) {
            simplified.push(nodePath[i]);
        }
        // Otherwise skip it (it's redundant)
    }

    simplified.push(nodePath[nodePath.length - 1]); // Always keep end
    return simplified;
}

/**
 * Helper to get a full GeoJSON LineString for a route between two points.
 * This encapsulates snapping, pathfinding, and formatting.
 */
export function getRouteGeoJSON(
    graph: Map<string, Node>,
    start: [number, number] | undefined,
    end: [number, number] | undefined
): any {
    const sNode = findNearestNode(start, graph);
    const eNode = findNearestNode(end, graph);
    if (!sNode || !eNode) return null;
    const nodePath = aStar(graph, sNode.id, eNode.id);

    if (nodePath.length === 0) {
        console.warn("⚠️ A* search found no path between", sNode.id, "and", eNode.id);
        return null;
    }

    console.log(`✅ Path found: ${nodePath.length} nodes.`);

    // Simplify path to remove redundant intermediate nodes
    const simplifiedPath = simplifyPath(nodePath, graph);
    console.log(`🔧 Path simplified: ${nodePath.length} → ${simplifiedPath.length} nodes.`);

    const coordinates = simplifiedPath.map(id => graph.get(id)!.coord);

    // VISUAL FIX: Connect the exact start/end points to the graph path
    // Also snip the tail if we are explicitly returning backwards to the node
    if (start && coordinates.length > 1) {
        const d1 = distance(start, coordinates[1]);
        const segLen = distance(coordinates[0], coordinates[1]);
        // If start is closer to the next node than the segment length, 
        // we are likely between the two nodes, so dropping the first node prevents a visible tail.
        if (d1 < segLen) {
            coordinates.shift();
            console.log("✂️ Dropped backtracking start node");
        }
    }

    if (start) {
        const firstNodeCoord = coordinates[0];
        const distToStart = distance(start, firstNodeCoord);
        if (distToStart > 0.5 && distToStart < 100) {
            coordinates.unshift(start);
            console.log(`🔌 Visually connected start point (${distToStart.toFixed(1)}m gap)`);
        }
    }

    if (end && coordinates.length > 1) {
        const lastIdx = coordinates.length - 1;
        const dPrev = distance(end, coordinates[lastIdx - 1]);
        const segLen = distance(coordinates[lastIdx - 1], coordinates[lastIdx]);
        // If end is closer to the previous node than the segment length, 
        // we are likely past the target node, so dropping the last node prevents a visible tail.
        if (dPrev < segLen) {
            coordinates.pop();
            console.log("✂️ Dropped backtracking end node");
        }
    }

    if (end) {
        const lastNodeCoord = coordinates[coordinates.length - 1];
        const distToEnd = distance(end, lastNodeCoord);
        if (distToEnd > 0.5 && distToEnd < 100) {
            coordinates.push(end);
            console.log(`🔌 Visually connected end point (${distToEnd.toFixed(1)}m gap)`);
        }
    }

    return {
        type: "Feature",
        properties: {
            distance: coordinates.reduce((acc, coord, i) => {
                if (i === 0) return 0;
                return acc + distance(coordinates[i - 1], coord);
            }, 0)
        },
        geometry: {
            type: "LineString",
            coordinates: coordinates
        }
    };

}
