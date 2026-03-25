const fs = require('fs');
const path = require('path');

const csvData = "room_id,room_name,building_id,floor_number,latitude,longitude\n" +
",c101,,0,12.92288,80.11982\n" +
",c102,,0,12.92305,80.11980\n" +
",c103,,0,12.92305,80.11950\n" +
",c104,,0,12.92296,80.11935\n" +
",c201,,1,12.92288,80.11982\n" +
",c202,,1,12.92305,80.11980\n" +
",c203,,1,12.92305,80.11950\n" +
",c204,,1,12.92296,80.11935\n" +
",Wash room -Comerce Block,,0,12.922911,80.119423\n" +
",a-118,,,12.92149,80.122943\n" +
",a-117,,,12.921524,80.120797\n" +
",a-116,,,12.921619,80.120816\n" +
",department of Public Administration,,,12.921558,80.120952\n" +
",a-114,,,12.92163,80.120936\n" +
",a-113,,,NA,NA\n" +
",a-112,,,12.921566,80.121151\n" +
",a-111,,,12.921552,80.121158\n" +
",a-110,,,12.921528,80.121158\n" +
",a-109,,,,\n" +
",a-108,,,12.921603,80.121151\n" +
",a-107,,,12.921664,80.121216\n" +
",a-106,,,12.921678,80.121264\n" +
",a-105,,,12.921687,80.121326\n" +
",a-104,,,12.921632,80.121382\n" +
",a-103,,,12.921627,80.121387\n" +
",a-102,,,12.921602,80.121434\n" +
",Department of English,,,12.921529,80.121503\n" +
",a-101,,,12.921297,80.121317\n" +
",A129,,,12.921202,80.121318\n" +
",A126,,,12.921466,80.121162\n" +
",A127,,,12.921505,80.121074\n" +
",A128,,,12.921509,80.121024\n" +
",department of Micro Biology,,,12.92154,80.121025\n" +
",A120,,,12.921533,80.120691\n" +
",A119,,,12.921452,80.120829\n" +
",A118,,,12.921389,80.120759\n" +
",Department of Economics,,,12.921429,80.120671\n" +
",A123,,,12.921378,80.12067\n" +
",A121,,,12.921343,80.120622\n" +
",A218,,,12.921343,80.120622\n" +
",Department of History,,,12.921352,80.120711\n" +
",A215,,,12.921678,80.120583\n" +
",A214,,,12.921673,80.120649\n" +
",A213,,,12.921685,80.120701\n" +
",A212,,,12.92164,80.120809\n" +
",A211(Department of Languages),,,12.921652,80.120867\n" +
",A113,,,12.921666,80.120932\n" +
",A210,,,12.921666,80.120932\n" +
",A209(department of political science),,,12.921678,80.120957\n" +
",A208,,,12.921649,80.121036\n" +
",A207,,,12.921636,80.121162\n" +
",A206,,,12.921644,80.121227\n" +
",A205,,,12.921629,80.121295\n" +
",A203,,,12.921583,80.121258\n" +
",A202,,,12.921546,80.121283\n" +
",A201,,,12.92148,80.12127\n" +
",A204,,,12.921586,80.121399\n" +
",A200,,,12.921436,80.121528\n" +
",A231,,,12.921363,80.121594\n" +
",Exam gallery,,,12.921281,80.121678\n" +
",Staff break time place,,,12.921282,80.121914\n" +
",Principal Office,,,12.921194,80.122082\n" +
",Vice Principal Office,,,12.921141,80.12211\n" +
",Bursar Office,,,12.921107,80.121983\n" +
",Examination Hall,,,12.9214,80.121733\n" +
",A113,,,12.921614,80.120901\n" +
",S221,,,12.921134,80.123459\n" +
",S222,,,12.921136,80.123434\n" +
",S220,,,12.921248,80.123477\n" +
",S219,,,12.921243,80.123507\n" +
",Department o Geograhy,,,12.92125,80.123447\n" +
",S217,,,12.921354,80.123478\n" +
",stair down 2- Science Block,,,12.921505,80.123101\n" +
",stairs up 1 - Science block,,,12.921168,80.122723\n" +
",S103,,,12.921123,80.122953\n" +
",S102,,,12.921076,80.122961\n" +
",S101,,,12.921055,80.122998\n" +
",S125,,,12.921055,80.123199\n" +
",gents restroom,,,12.921065,80.123185\n" +
",S123,,,12.921116,80.12334\n" +
",S122,,,12.921063,80.123376\n" +
",S121,,,12.9210821,80.123381\n" +
",S120 - SEMINAR HALL,,,12.92114,80.123463\n" +
",stair up 3 - Science Block,,,12.921117,80.123475\n" +
",S119- Chemistry store,,,12.921362,80.123397\n" +
",S118- Allies Chemistry Lab,,,12.921368,80.123432\n" +
",UG Major Chemistry lab,,,12.921454,80.123326\n" +
",S216,,,12.921561,80.123394\n" +
",stair up 2 - Science block,,,12.921453,80.123275\n" +
",stair up 2 - Science block,,,12.921391,80.123092\n" +
",Computation Intrumentation Facility,,,12.921513,80.122964\n" +
",S107,,,12.921229,80.122294\n" +
",S109,,,12.921377,80.122525\n" +
",SCIENCE BLOCK ENTRANCE,,,12.921477,80.122668\n" +
",S218,,,12.921477,80.122693\n" +
",Solid State Ionic Research lab,,,12.921444,80.122706\n" +
",stair up 1-Science Block,,,12.921244,80.122707\n" +
",Estate Office,,,12.921141,80.12198\n" +
",stair up near Anderson Hall - Main building,,,12.921113,80.121978\n" +
",stair down -Main building,,,12.921222,80.122096\n" +
",Woman staff Washroom,,,12.921253,80.12261\n" +
",stair down 1 _ Science Block,,,12.921218,80.122817\n" +
",S201,,,12.921153,80.122965\n" +
",S202,,,12.921175,80.122874\n" +
",S203,,,12.92114,80.122801\n" +
",S204-Department of physics,,,12.921327,80.122774\n" +
",S205,,,12.921471,80.122804\n" +
",S206-Physics Lab,,,12.921494,80.122917\n" +
",S207,,,12.921494,80.123019\n" +
",S208,,,12.921489,80.123099\n" +
",S209,,,12.921495,80.123202\n" +
",S210,,,12.921459,80.123196\n" +
",S211,,,12.92145,80.123265\n" +
",S212,,,12.921469,80.123367\n" +
",Department of statisic,,,12.921534,80.123302";

const lines = csvData.trim().split('\n');
const headers = lines[0].split(',');
const data = lines.slice(1).map(line => {
    const values = line.split(',');
    const obj = {};
    headers.forEach((header, i) => obj[header] = values[i]);
    return obj;
});

const classrooms = [];
const departments = [];

data.forEach((row, index) => {
    let rawName = row.room_name.trim();
    if (!rawName) return;

    let latStr = row.latitude.replace('12..', '12.').trim();
    let lngStr = row.longitude ? row.longitude.trim() : "";

    // Fix A118 misalignment
    if (rawName.toLowerCase() === 'a-118' && lngStr === '80.122943') {
        lngStr = '80.120750'; // Move closer to other A rooms
    }

    if (!latStr || latStr === 'NA' || !lngStr || lngStr === 'NA') return;

    const lat = parseFloat(latStr);
    const lng = parseFloat(lngStr);
    const floorInt = row.floor_number ? parseInt(row.floor_number) || 0 : 0;

    let id = rawName.toUpperCase().replace(/[- ]/g, '');
    let name = rawName;
    let block = "science";
    let roomNumber = "";
    let isClassroom = false;

    // Pattern for classrooms: prefix[SCA] + numbers
    const classroomMatch = id.match(/^([SCA])(\d+)$/);
    if (classroomMatch) {
        isClassroom = true;
        const prefix = classroomMatch[1];
        roomNumber = classroomMatch[2];
        name = prefix + roomNumber;
        if (prefix === 'S') block = "science";
        else if (prefix === 'C') block = "commerce";
        else if (prefix === 'A') block = "arts";
    } else {
        const aMatch = rawName.match(/^[aA]-(\d+)$/);
        if (aMatch) {
            isClassroom = true;
            block = "arts";
            roomNumber = aMatch[1];
            name = "A" + roomNumber;
        }
    }

    if (rawName.toLowerCase().includes('department')) {
        isClassroom = false;
    }

    if (isClassroom) {
        // Special case for Commerce Block alignment
        if (block === "commerce") {
            // Already handled in CSV data for C101-104 and C201-204
        }
        
        classrooms.push({
            name: name,
            block: block,
            roomNumber: roomNumber,
            floor: floorInt,
            lat: lat,
            lng: lng,
            category: "Classroom",
            id: id + '-' + index
        });
    } else {
        departments.push({
            name: name,
            lat: lat,
            lng: lng,
            category: "Department",
            id: id + '-' + index,
            address: block + ", MCC",
            floor: floorInt
        });
    }
});

const output = { classrooms, departments };
fs.writeFileSync('public/data/raw/mcc-secondary-locations.json', JSON.stringify(output, null, 4));
console.log('Successfully written to public/data/raw/mcc-secondary-locations.json');
