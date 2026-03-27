const fs = require('fs');
const content = fs.readFileSync('c:/Users/Joshua/project/nebr/frontend/src/pages/EmployeeManagementAdmin/AdminRegister.tsx', 'utf8');

const tags = [];
const regex = /<(\/?[a-zA-Z0-9]+)(\s|>)/g;
let match;

while ((match = regex.exec(content)) !== null) {
    const tagName = match[1];
    if (tagName.startsWith('/')) {
        const last = tags.pop();
        if (last !== tagName.substring(1)) {
            console.log(`Mismatch: Expected ${last}, found ${tagName} at position ${match.index}`);
        }
    } else {
        // Skip self-closing tags (approximate)
        const segment = content.substring(match.index, content.indexOf('>', match.index) + 1);
        if (!segment.endsWith('/>') && !['img', 'input', 'hr', 'br'].includes(tagName)) {
            tags.push(tagName);
        }
    }
}

console.log('Unclosed tags:', tags);
