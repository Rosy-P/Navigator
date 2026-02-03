import fs from 'fs';
import path from 'path';

const processCwd = process.cwd();

async function main() {
    console.log('--- Network Merger ---');

    const rawPathsPath = path.join(processCwd, 'public', 'data', 'raw', 'mcc-paths.geojson');
    const finalConnectorsPath = path.join(processCwd, 'public', 'data', 'final', 'mcc-connectors.final.geojson');
    const outputPath = path.join(processCwd, 'public', 'data', 'final', 'mcc-walk-network.geojson');

    console.log('Loading road network...');
    const pathsData = JSON.parse(fs.readFileSync(rawPathsPath, 'utf8'));

    console.log('Loading connector layer...');
    const connectorsData = JSON.parse(fs.readFileSync(finalConnectorsPath, 'utf8'));

    console.log(`Summary:
    - Road segments: ${pathsData.features.length}
    - Connector segments: ${connectorsData.features.length}`);

    const mergedNetwork = {
        type: 'FeatureCollection',
        features: [
            ...pathsData.features,
            ...connectorsData.features
        ]
    };

    fs.writeFileSync(outputPath, JSON.stringify(mergedNetwork, null, 2));
    console.log(`Success! Unified walk network written to ${outputPath}`);
}

main().catch(console.error);
