import fs from 'fs';
import path from 'path';

// --- Porting logic from routing.ts ---
function distance(a, b) {
    const R = 6371e3;
    const φ1 = (a[1] * Math.PI) / 180;
    const φ2 = (b[1] * Math.PI) / 180;
    const Δφ = ((b[1] - a[1]) * Math.PI) / 180;
    const Δλ = ((b[0] - a[0]) * Math.PI) / 180;
    const x = Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
    return 2 * R * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

function buildGraph(geojson) {
    const graph = new Map();
    geojson.features.forEach((feature) => {
        if (feature.geometry.type !== "LineString") return;
        const coords = feature.geometry.coordinates;
        for (let i = 0; i < coords.length - 1; i++) {
            const a = coords[i];
            const b = coords[i + 1];
            const idA = `${a[0].toFixed(7)},${a[1].toFixed(7)}`;
            const idB = `${b[0].toFixed(7)},${b[1].toFixed(7)}`;
            if (!graph.has(idA)) graph.set(idA, { id: idA, coord: a, neighbors: [] });
            if (!graph.has(idB)) graph.set(idB, { id: idB, coord: b, neighbors: [] });
            const cost = distance(a, b);
            graph.get(idA).neighbors.push({ id: idB, cost });
            graph.get(idB).neighbors.push({ id: idA, cost });
        }
    });

    const getComponents = (currentGraph) => {
        const visited = new Set();
        const componentList = [];
        for (const startId of currentGraph.keys()) {
            if (!visited.has(startId)) {
                const component = [];
                const stack = [startId];
                visited.add(startId);
                while (stack.length > 0) {
                    const currentId = stack.pop();
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

    let currentComponents = getComponents(graph);
    let iteration = 0;
    const BRIDGE_MAX_DIST = 100.0;
    while (currentComponents.length > 1 && iteration < 100) {
        iteration++;
        currentComponents.sort((a, b) => a.length - b.length);
        const smallest = currentComponents[0];
        let bestBridge = null;
        let minDist = BRIDGE_MAX_DIST;
        for (const idA of smallest) {
            const nodeA = graph.get(idA);
            for (let i = 1; i < currentComponents.length; i++) {
                for (const idB of currentComponents[i]) {
                    const nodeB = graph.get(idB);
                    const d = distance(nodeA.coord, nodeB.coord);
                    if (d < minDist) {
                        minDist = d;
                        bestBridge = { a: idA, b: idB, dist: d };
                    }
                }
            }
        }
        if (bestBridge) {
            const nodeA = graph.get(bestBridge.a);
            const nodeB = graph.get(bestBridge.b);
            nodeA.neighbors.push({ id: nodeB.id, cost: bestBridge.dist });
            nodeB.neighbors.push({ id: nodeA.id, cost: bestBridge.dist });
            currentComponents = getComponents(graph);
        } else break;
    }
    return { graph, components: currentComponents.length };
}

function findNearestNode(coord, graph) {
    let nearest = null;
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

function aStar(graph, startId, goalId) {
    if (startId === goalId) return [startId];
    if (!graph.has(startId) || !graph.has(goalId)) return [];
    const open = new Set([startId]);
    const closed = new Set();
    const cameFrom = new Map();
    const g = new Map();
    const f = new Map();
    graph.forEach((_, id) => { g.set(id, Infinity); f.set(id, Infinity); });
    g.set(startId, 0);
    const startNode = graph.get(startId);
    const goalNode = graph.get(goalId);
    f.set(startId, distance(startNode.coord, goalNode.coord));
    let iterations = 0;
    while (open.size > 0 && iterations < 5000) {
        iterations++;
        let current = null;
        let minF = Infinity;
        for (const id of open) {
            const fScore = f.get(id);
            if (current === null || fScore < minF) { current = id; minF = fScore; }
        }
        if (current === goalId) {
            const path = [];
            let cur = current;
            while (cur && cameFrom.has(cur)) { path.unshift(cur); cur = cameFrom.get(cur); }
            path.unshift(startId);
            return path;
        }
        open.delete(current);
        closed.add(current);
        const currentNode = graph.get(current);
        for (const n of currentNode.neighbors) {
            if (closed.has(n.id)) continue;
            const tempGScore = (g.get(current) || Infinity) + n.cost;
            if (!open.has(n.id)) open.add(n.id);
            else if (tempGScore >= (g.get(n.id) || Infinity)) continue;
            cameFrom.set(n.id, current);
            g.set(n.id, tempGScore);
            f.set(n.id, tempGScore + distance(graph.get(n.id).coord, goalNode.coord));
        }
    }
    return [];
}

// --- Main Execution ---
try {
    console.log('Starting routing diagnostics...');
    const processCwd = process.cwd();
    console.log('Working directory:', processCwd);

    const networkPath = path.join(processCwd, 'public', 'data', 'final', 'mcc-walk-network.geojson');
    const landmarksPath = path.join(processCwd, 'public', 'data', 'raw', 'mcc-landmarks.json');

    console.log('Loading network from:', networkPath);
    console.log('Loading landmarks from:', landmarksPath);

    const network = JSON.parse(fs.readFileSync(networkPath, 'utf8'));
    const landmarks = JSON.parse(fs.readFileSync(landmarksPath, 'utf8'));

    console.log('Files loaded successfully');
    console.log('Network features:', network.features?.length || 0);
    console.log('Landmark categories:', Object.keys(landmarks));

    const { graph, components } = buildGraph(network);
    console.log(`Graph built with ${graph.size} nodes and ${components} components.`);

    const mainGate = landmarks.facilities.find(f => f.id === 'main_gate');
    if (!mainGate) {
        console.error("Main Gate not found in landmarks!");
        console.error("Available facilities:", landmarks.facilities.map(f => f.id || f.name));
        process.exit(1);
    }
    console.log('Main Gate found:', mainGate.name, 'at', [mainGate.lng, mainGate.lat]);

    const startCoord = [mainGate.lng, mainGate.lat];
    const startNode = findNearestNode(startCoord, graph);
    console.log('Start node:', startNode.id, 'at', startNode.coord);

    let successCount = 0;
    let totalCount = 0;

    ['classrooms', 'departments', 'facilities'].forEach(cat => {
        if (!landmarks[cat]) return;
        landmarks[cat].forEach(item => {
            totalCount++;
            const endCoord = [item.lng, item.lat];
            const endNode = findNearestNode(endCoord, graph);
            const path = aStar(graph, startNode.id, endNode.id);
            if (path.length > 0) {
                successCount++;
                console.log(`✅ Success: ${item.name} (${path.length} nodes)`);
            } else {
                console.log(`❌ Failure: ${item.name}`);
            }
        });
    });

    console.log(`\nFinal Score: ${successCount}/${totalCount} reachable from Main Gate.`);
} catch (error) {
    console.error('ERROR:', error.message);
    console.error(error.stack);
    process.exit(1);
}
