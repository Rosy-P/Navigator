import fs from 'fs';

const buildingsPath = 'c:/Users/acer/OneDrive/Documents/project/Navigator/public/data/buildings.geojson';
const walkNetworkPath = 'c:/Users/acer/OneDrive/Documents/project/Navigator/public/data/final/mcc-walk-network.geojson';
const entrancesPath = 'c:/Users/acer/OneDrive/Documents/project/Navigator/public/data/entrances.json';

const walkNetwork = JSON.parse(fs.readFileSync(walkNetworkPath, 'utf8'));
const entrances = JSON.parse(fs.readFileSync(entrancesPath, 'utf8'));

const scienceEntrances = entrances.filter(e => e.buildingId === 'science_block');

function distance(a, b) {
    const dx = a[0] - b[0];
    const dy = a[1] - b[1];
    return Math.sqrt(dx * dx + dy * dy);
}

const results = scienceEntrances.map(ent => {
    let minD = Infinity;
    let nearestNode = null;
    let nearestWay = null;

    walkNetwork.features.forEach(f => {
        if (f.geometry.type === 'LineString') {
            f.geometry.coordinates.forEach(coord => {
                const d = distance([ent.lng, ent.lat], coord);
                if (d < minD) {
                    minD = d;
                    nearestNode = coord;
                    nearestWay = f.properties.id || f.properties['@id'];
                }
            });
        }
    });

    return {
        entranceName: ent.name,
        entranceCoords: [ent.lng, ent.lat],
        nearestNode: nearestNode,
        dist: minD,
        nearestWay: nearestWay
    };
});

fs.writeFileSync('c:/Users/acer/OneDrive/Documents/project/Navigator/scripts/node_results.json', JSON.stringify(results, null, 2));
console.log('Results written to node_results.json');
