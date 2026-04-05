const fs = require('fs');
const path = require('path');

function walk(dir) {
    let files = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        const filePath = path.join(dir, file);
        if (fs.statSync(filePath).isDirectory()) {
            if (file !== 'node_modules' && file !== '.next') {
                files = files.concat(walk(filePath));
            }
        } else if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
            files.push(filePath);
        }
    });
    return files;
}

const targetDir = 'c:/Users/acer/OneDrive/Documents/project/Navigator/app';
const files = walk(targetDir);
let count = 0;

files.forEach(f => {
    let content = fs.readFileSync(f, 'utf8');
    // We are replacing `${process.env.NEXT_PUBLIC_API_URL}/`
    // with `${(process.env.NEXT_PUBLIC_API_URL || '').replace(/\/$/, '')}/`
    
    // To be safer, let's just use string replace.
    const searchString = "`${process.env.NEXT_PUBLIC_API_URL}/";
    const replacementString = "`${(process.env.NEXT_PUBLIC_API_URL || '').replace(/\\/$/, '')}/";
    
    if (content.includes(searchString)) {
        content = content.split(searchString).join(replacementString);
        fs.writeFileSync(f, content);
        count++;
        console.log('Updated: ' + f);
    }
});

console.log('Total files updated: ' + count);
