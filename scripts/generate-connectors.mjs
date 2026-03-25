import fs from 'fs';
import path from 'path';

const processCwd = process.cwd();

// Utility functions for geometry
function getDistance(p1, p2) {
    const dx = p1[0] - p2[0];
    const dy = p1[1] - p2[1];
    return Math.sqrt(dx * dx + dy * dy);
}

function getNearestPointOnSegment(p, a, b) {
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];

    if (dx === 0 && dy === 0) return a;

    const t = ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / (dx * dx + dy * dy);

    if (t < 0) return a;
    if (t > 1) return b;

    return [
        a[0] + t * dx,
        a[1] + t * dy
    ];
}

function findNearestPointOnLineString(point, lineCoords) {
    let minDistance = Infinity;
    let nearestPoint = [0, 0];

    for (let i = 0; i < lineCoords.length - 1; i++) {
        const a = lineCoords[i];
        const b = lineCoords[i + 1];
        const p = getNearestPointOnSegment(point, a, b);
        const dist = getDistance(point, p);

        if (dist < minDistance) {
            minDistance = dist;
            nearestPoint = p;
        }
    }

    return { point: nearestPoint, distance: minDistance };
}

// Main script logic
async function main() {
    console.log('--- Connector Generator ---');
    console.log(`CWD: ${processCwd}`);

    const rawDataDir = path.join(processCwd, 'public', 'data', 'raw');
    const generatedDir = path.join(processCwd, 'public', 'data', 'generated');

    const landmarksPath = path.join(processCwd, 'public', 'data', 'mcc-landmarks.json');
    const pathsPath = path.join(rawDataDir, 'mcc-paths.geojson');
    const outputPath = path.join(generatedDir, 'mcc-connectors.auto.geojson');

    console.log(`Paths:
    - Landmarks: ${landmarksPath}
    - Paths: ${pathsPath}
    - Output: ${outputPath}`);

    if (!fs.existsSync(landmarksPath)) throw new Error(`Missing landmarks file at ${landmarksPath}`);
    if (!fs.existsSync(pathsPath)) throw new Error(`Missing paths file at ${pathsPath}`);
    if (!fs.existsSync(generatedDir)) {
        console.log('Creating generated dir...');
        fs.mkdirSync(generatedDir, { recursive: true });
    }

    console.log('Loading data...');
    const landmarksData = JSON.parse(fs.readFileSync(landmarksPath, 'utf8'));
    const pathsData = JSON.parse(fs.readFileSync(pathsPath, 'utf8'));

    const allLandmarks = [
        ...(landmarksData.classrooms || []),
        ...(landmarksData.departments || []),
        ...(landmarksData.facilities || [])
    ];

    console.log(`Found ${allLandmarks.length} landmarks total.`);

    const connectors = [];

    for (const landmark of allLandmarks) {
        if (!landmark.id) {
            console.warn(`Landmark missing ID: ${landmark.name}`);
            // Use name as backup ID for now if needed, but Step 2 should have fixed this
            landmark.id = landmark.name.toLowerCase().replace(/\s+/g, '_');
        }

        const landmarkPoint = [landmark.lng, landmark.lat];
        let globalMinDist = Infinity;
        let globalNearestPoint = null;

        for (const feature of pathsData.features) {
            if (feature.geometry.type === 'LineString') {
                const { point, distance } = findNearestPointOnLineString(landmarkPoint, feature.geometry.coordinates);
                if (distance < globalMinDist) {
                    globalMinDist = distance;
                    globalNearestPoint = point;
                }
            }
        }

        if (globalNearestPoint) {
            connectors.push({
                type: 'Feature',
                properties: {
                    id: `conn_${landmark.id}`,
                    landmarkId: landmark.id,
                    landmarkName: landmark.name,
                    type: 'connector'
                },
                geometry: {
                    type: 'LineString',
                    coordinates: [
                        globalNearestPoint, // Start at road
                        landmarkPoint      // End at building center
                    ]
                }
            });
        }
    }

    const outputCollection = {
        type: 'FeatureCollection',
        features: connectors
    };

    console.log(`Ready to write ${connectors.length} connectors...`);
    fs.writeFileSync(outputPath, JSON.stringify(outputCollection, null, 2));
    console.log(`Success! Written to ${outputPath}`);
}

main().catch(err => {
    console.error('ERROR:', err);
    process.exit(1);
});
