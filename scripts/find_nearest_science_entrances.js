import fs from 'fs';
import path from 'path';

const networkPath = 'c:\\Users\\acer\\OneDrive\\Documents\\project\\Navigator\\public\\data\\final\\mcc-walk-network.geojson';
const targetCoordinates = [
  [80.12278146453741, 12.921156361859886],
  [80.12280232009641, 12.921541019842238],
  [80.1232948321678, 12.921098506746944],
  [80.12360926984275, 12.9211297797831]
];

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
    return [a[0] + t * dx, a[1] + t * dy];
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

const networkData = JSON.parse(fs.readFileSync(networkPath, 'utf8'));

const results = targetCoordinates.map(target => {
    let globalMinDist = Infinity;
    let globalNearestPoint = null;

    for (const feature of networkData.features) {
        if (feature.geometry.type === 'LineString') {
            const { point, distance } = findNearestPointOnLineString(target, feature.geometry.coordinates);
            if (distance < globalMinDist) {
                globalMinDist = distance;
                globalNearestPoint = point;
            }
        } else if (feature.geometry.type === 'Point') {
            const dist = getDistance(target, feature.geometry.coordinates);
            if (dist < globalMinDist) {
                globalMinDist = dist;
                globalNearestPoint = feature.geometry.coordinates;
            }
        }
    }
    return { target, nearest: globalNearestPoint };
});

console.log(JSON.stringify(results, null, 2));
