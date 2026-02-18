
import fs from 'fs';
import path from 'path';

const rootDir = path.resolve('.');
const excludeDirs = ['node_modules', 'dist', '.git', 'uploads', 'coverage', '.system_generated', 'brain'];
const extensions = ['.ts', '.tsx'];

function scanDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
            if (!excludeDirs.includes(file)) {
                scanDir(fullPath);
            }
        } else {
            if (extensions.includes(path.extname(file))) {
                checkFile(fullPath);
            }
        }
    }
}

function checkFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    let found = false;
    lines.forEach((line, index) => {
        // Regex for : any or as any
        // Note: careful not to match 'many' or 'anything'
        if (/:\s*any\b/.test(line) || /\bas\s+any\b/.test(line)) {
            // Also ignore comments if possible, but simple regex is fine for now
            if (!line.trim().startsWith('//')) {
                console.log(`${path.relative(rootDir, filePath)}:${index + 1}: ${line.trim()}`);
                found = true;
            }
        }
    });
}

console.log('--- Scanning for explicit any ---');
scanDir(process.cwd());
console.log('--- Scan Complete ---');
