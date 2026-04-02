import fs from 'fs';
import path from 'path';

const networkPath = 'c:\\Users\\acer\\OneDrive\\Documents\\project\\Navigator\\public\\data\\final\\mcc-walk-network.geojson';
const targets = [
  { id: 'arts_entrance_1', c: [80.12059479998305, 12.92164376931595] },
  { id: 'arts_entrance_2', c: [80.12142351049192, 12.92163481945586] },
  { id: 'arts_entrance_3', c: [80.12084731565022, 12.921343948813757] },
  { id: 'arts_entrance_4', c: [80.12140108610242, 12.921278098400634] }
];

function distSq(p1, p2) {
    const dx = p1[0] - p2[0], dy = p1[1] - p2[1];
    return dx*dx + dy*dy;
}

function nearestOnSeg(p, a, b) {
    const dx = b[0]-a[0], dy = b[1]-a[1];
    if (!dx && !dy) return a;
    const t = ((p[0]-a[0])*dx + (p[1]-a[1])*dy) / (dx*dx+dy*dy);
    if (t<0) return a; if (t>1) return b;
    return [a[0]+t*dx, a[1]+t*dy];
}

const data = JSON.parse(fs.readFileSync(networkPath, 'utf8'));
for (const t of targets) {
    let minDist = Infinity, best = null;
    for (const f of data.features) {
        if (f.geometry.type === 'LineString') {
            const coords = f.geometry.coordinates;
            for (let i=0; i<coords.length-1; i++) {
                const p = nearestOnSeg(t.c, coords[i], coords[i+1]);
                const d = distSq(t.c, p);
                if (d < minDist) { minDist = d; best = p; }
            }
        }
    }
    console.log(`${t.id} target: ${JSON.stringify(t.c)} nearest: ${JSON.stringify(best)}`);
}
