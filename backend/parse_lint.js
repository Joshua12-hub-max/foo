const fs = require('fs');

const data = JSON.parse(fs.readFileSync('lint.json', 'utf8'));
let found = false;

for (const file of data) {
    if (file.errorCount > 0 || file.warningCount > 0) {
        console.log(`\n--- ${file.filePath} ---`);
        for (const msg of file.messages) {
            console.log(`Line ${msg.line}: ${msg.message} (${msg.ruleId})`);
        }
        found = true;
        break; // Process one file at a time to prevent output overflow
    }
}

if (!found) {
    console.log("No lint errors found!");
}
