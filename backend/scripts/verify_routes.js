import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const backendRoot = path.join(__dirname, '../');

// Function to extract exports from a JS file
function getExports(filePath) {
  if (!fs.existsSync(filePath)) return [];
  const content = fs.readFileSync(filePath, 'utf8');
  const exports = [];

  // Regex for "export const functionName ="
  const constMatch = content.matchAll(/export\s+const\s+(\w+)\s*=/g);
  for (const match of constMatch) exports.push(match[1]);

  // Regex for "export function functionName("
  const funcMatch = content.matchAll(/export\s+function\s+(\w+)\s*\(/g);
  for (const match of funcMatch) exports.push(match[1]);

  // Regex for "export default functionName" or "export default { ... }"
  // We'll treat default export specially if needed, but mostly we look for named exports
  return exports;
}

function verifyRoutes() {
  const routesDir = path.join(backendRoot, 'routes');
  if (!fs.existsSync(routesDir)) {
    console.error('Routes directory not found!');
    return;
  }

  const files = fs.readdirSync(routesDir);
  let hasErrors = false;

  files.forEach(file => {
    if (!file.endsWith('.js')) return;

    const routePath = path.join(routesDir, file);
    const content = fs.readFileSync(routePath, 'utf8');

    // Parse imports: import { X, Y } from '../controllers/Z.js'
    const importRegex = /import\s+\{([^}]+)\}\s+from\s+['"]\.\.\/controllers\/([^'"]+)['"]/g;

    for (const match of content.matchAll(importRegex)) {
      // Clean imports: Remove comments and whitespace
      const rawImports = match[1]
        .replace(/\/\*[\s\S]*?\*\//g, '') // Remove multi-line comments
        .replace(/\/\/.*$/gm, '')       // Remove single-line comments
        .replace(/\n/g, ' ');           // Replace newlines with space

      const imports = rawImports.split(',')
        .map(s => s.trim().split(' as ')[0]) // Handle "X as Y"
        .filter(s => s.length > 0);          // Remove empty strings

      const controllerFile = match[2];
      const controllerPath = path.join(backendRoot, 'controllers', controllerFile);

      if (!fs.existsSync(controllerPath)) {
        console.error(`ERROR: ${file} imports from non-existent controller ${controllerFile}`);
        hasErrors = true;
        continue;
      }

      const availableExports = getExports(controllerPath);

      imports.forEach(imp => {
        if (imp && !availableExports.includes(imp)) {
          console.error(`ERROR: ${file} imports '${imp}' which is NOT exported by ${controllerFile}`);
          // console.log(`Available exports in ${controllerFile}:`, availableExports);
          hasErrors = true;
        }
      });
    }
  });

  if (!hasErrors) {
    console.log('All route imports verified successfully.');
  } else {
    console.log('Route verification failed with errors.');
  }
}

verifyRoutes();
