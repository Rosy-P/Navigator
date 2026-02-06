export type Node = {
    id: string;
    coord: [number, number];
    neighbors: { id: string; cost: number }[];
};

/**
 * Calculates the Haversine distance between two coordinates in meters.
 */
export function distance(a: [number, number], b: [number, number]): number {
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
 */
export function buildGraph(geojson: any): Map<string, Node> {
    const graph = new Map<string, Node>();

    geojson.features.forEach((feature: any) => {
        if (feature.geometry.type !== "LineString") return;

        const coords = feature.geometry.coordinates;

        for (let i = 0; i < coords.length - 1; i++) {
            const a = coords[i] as [number, number];
            const b = coords[i + 1] as [number, number];

            // Normalize coordinates to 7 decimal places to handle precision issues
            const idA = `${a[0].toFixed(7)},${a[1].toFixed(7)}`;
            const idB = `${b[0].toFixed(7)},${b[1].toFixed(7)}`;

            if (!graph.has(idA)) {
                graph.set(idA, { id: idA, coord: a, neighbors: [] });
            }
            if (!graph.has(idB)) {
                graph.set(idB, { id: idB, coord: b, neighbors: [] });
            }

            const cost = distance(a, b);

            graph.get(idA)!.neighbors.push({ id: idB, cost });
            graph.get(idB)!.neighbors.push({ id: idA, cost });
        }
    });

    // --- Component Analysis and Bridging ---
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

    let iteration = 0;
    let currentComponents = getComponents(graph);
    console.log(`🌐 Initially: ${currentComponents.length} disjoint networks.`);

    const BRIDGE_MAX_DIST = 100.0; // 100m max gap bridging to catch sparse campus data

    while (currentComponents.length > 1 && iteration < 100) {
        iteration++;
        // Sort components by size (smallest first)
        currentComponents.sort((a, b) => a.length - b.length);
        const smallest = currentComponents[0];

        let bestBridge: { a: string, b: string, dist: number } | null = null;
        let minDist = BRIDGE_MAX_DIST;

        // Try to bridge the smallest component to MUST find a node in ANY other component
        for (const idA of smallest) {
            const nodeA = graph.get(idA)!;

            // Check against nodes in all other components
            for (let i = 1; i < currentComponents.length; i++) {
                for (const idB of currentComponents[i]) {
                    const nodeB = graph.get(idB)!;
                    const d = distance(nodeA.coord, nodeB.coord);
                    if (d < minDist) {
                        minDist = d;
                        bestBridge = { a: idA, b: idB, dist: d };
                    }
                }
            }
        }

        if (bestBridge) {
            const nodeA = graph.get(bestBridge.a)!;
            const nodeB = graph.get(bestBridge.b)!;
            nodeA.neighbors.push({ id: nodeB.id, cost: bestBridge.dist });
            nodeB.neighbors.push({ id: nodeA.id, cost: bestBridge.dist });
            console.log(`🌉 Bridge [${iteration}]: ${nodeA.id} <-> ${nodeB.id} (${bestBridge.dist.toFixed(2)}m)`);
            currentComponents = getComponents(graph);
        } else {
            console.warn(`⚠️ Could not bridge further. ${currentComponents.length} components remain.`);
            break;
        }
    }

    // --- FINAL AGGRESSIVE PASS: Connect ALL remaining components ---
    if (currentComponents.length > 1) {
        console.log(`🔧 Aggressive bridging: Connecting ${currentComponents.length} remaining components...`);

        while (currentComponents.length > 1) {
            currentComponents.sort((a, b) => a.length - b.length);
            const smallest = currentComponents[0];

            // Find the absolute nearest node in ANY other component (no distance limit)
            let bestBridge: { a: string, b: string, dist: number } | null = null;
            let minDist = Infinity;

            for (const idA of smallest) {
                const nodeA = graph.get(idA)!;

                for (let i = 1; i < currentComponents.length; i++) {
                    for (const idB of currentComponents[i]) {
                        const nodeB = graph.get(idB)!;
                        const d = distance(nodeA.coord, nodeB.coord);
                        if (d < minDist) {
                            minDist = d;
                            bestBridge = { a: idA, b: idB, dist: d };
                        }
                    }
                }
            }

            if (bestBridge) {
                const nodeA = graph.get(bestBridge.a)!;
                const nodeB = graph.get(bestBridge.b)!;
                nodeA.neighbors.push({ id: nodeB.id, cost: bestBridge.dist });
                nodeB.neighbors.push({ id: nodeA.id, cost: bestBridge.dist });
                console.log(`🔗 Aggressive bridge: ${nodeA.id} <-> ${nodeB.id} (${bestBridge.dist.toFixed(2)}m)`);
                currentComponents = getComponents(graph);
            } else {
                console.error(`❌ FATAL: Cannot find any nodes to bridge!`);
                break;
            }
        }
    }

    console.log(`✅ Final Graph Analysis: ${currentComponents.length} component(s) remaining.`);
    return graph;
}

/**
 * Finds the nearest node in the graph to a given coordinate.
 */
export function findNearestNode(
    coord: [number, number],
    graph: Map<string, Node>
): Node {
    let nearest!: Node;
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
    angleThreshold: number = 170 // degrees - nodes within this angle are considered collinear
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
    start: [number, number],
    end: [number, number]
): any {
    const sNode = findNearestNode(start, graph);
    const eNode = findNearestNode(end, graph);
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
