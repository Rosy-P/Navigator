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

            const idA = a.join(",");
            const idB = b.join(",");

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
                f.set(
                    n.id,
                    tempGScore + distance(neighborNode.coord, goalNode.coord)
                );
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

    if (nodePath.length === 0) return null;

    const coordinates = nodePath.map(id => graph.get(id)!.coord);

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
