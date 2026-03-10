import fs from 'fs';

let data = JSON.parse(fs.readFileSync('lint.json', 'utf8'));
let output = '';

while (data.length > 0) {
    const file = data.shift();
    if (file.filePath.includes('auto_fix') || file.filePath.includes('parse_lint')) {
        continue;
    }

    if (file.errorCount > 0 || file.warningCount > 0) {
        output += `\n--- ${file.filePath} ---\n`;
        for (const msg of file.messages) {
            output += `Line ${msg.line}: ${msg.message} (${msg.ruleId})\n`;
        }
        
        fs.writeFileSync('lint.json', JSON.stringify(data, null, 2));
        fs.writeFileSync('current_lint_error.txt', output, 'utf8');
        process.exit(0);
    }
}

console.log("No actual lint errors found!");
fs.writeFileSync('lint.json', JSON.stringify([], null, 2));
