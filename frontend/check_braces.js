
const fs = require('fs');
const content = fs.readFileSync('c:/Users/Joshua/project/nebr/frontend/src/pages/EmployeeManagementAdmin/AdminRegister.tsx', 'utf8');

let stack = [];
let lines = content.split('\n');

for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    for (let char of line) {
        if (char === '{') stack.push({ char, line: i + 1 });
        if (char === '}') {
            if (stack.length === 0) {
                console.log(`Unmatched } at line ${i + 1}`);
            } else {
                stack.pop();
            }
        }
    }
}

if (stack.length > 0) {
    stack.forEach(s => console.log(`Unmatched { at line ${s.line}`));
} else {
    console.log('Braces are balanced');
}
