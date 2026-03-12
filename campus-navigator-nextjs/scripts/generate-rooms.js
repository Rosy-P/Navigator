const fs = require('fs');

const secondaryDataPath = 'c:\\Users\\acer\\OneDrive\\Documents\\project\\Navigator\\campus-navigator-nextjs\\public\\data\\raw\\mcc-secondary-locations.json';
const buildingsPath = 'c:\\Users\\acer\\OneDrive\\Documents\\project\\Navigator\\campus-navigator-nextjs\\public\\data\\buildings.geojson';
const roomsOutputPath = 'c:\\Users\\acer\\OneDrive\\Documents\\project\\Navigator\\campus-navigator-nextjs\\public\\data\\rooms.json';

const secondaryData = JSON.parse(fs.readFileSync(secondaryDataPath, 'utf8'));
const buildingsGeoJSON = JSON.parse(fs.readFileSync(buildingsPath, 'utf8'));
const buildings = buildingsGeoJSON.features.map(f => ({ ...f.properties, id: f.id || f.properties.id }));

const rooms = secondaryData.classrooms.map(c => {
    const buildingId = c.block === 'science' ? 'science_block' : 
                      c.block === 'commerce' ? 'commerce_block' : 
                      c.block === 'arts' ? 'arts_block' : 'main_building';
    
    const building = buildings.find(b => b.id === buildingId);
    
    return {
        room: c.name,
        buildingId: buildingId,
        buildingName: building ? building.name : "Unknown Building",
        floor: c.floor.toString()
    };
});

fs.writeFileSync(roomsOutputPath, JSON.stringify(rooms, null, 2));
console.log('Successfully written rooms.json with buildingNames');
