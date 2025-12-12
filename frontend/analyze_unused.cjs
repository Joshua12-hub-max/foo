const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');
const extensions = ['.js', '.jsx', '.json', '.css', '.scss'];

function getAllFiles(dirPath, arrayOfFiles) {
  const files = fs.readdirSync(dirPath);

  arrayOfFiles = arrayOfFiles || [];

  files.forEach(function(file) {
    if (fs.statSync(dirPath + "/" + file).isDirectory()) {
      arrayOfFiles = getAllFiles(dirPath + "/" + file, arrayOfFiles);
    } else {
      arrayOfFiles.push(path.join(dirPath, "/", file));
    }
  });

  return arrayOfFiles;
}

const allFiles = getAllFiles(srcDir);
const usedFiles = new Set();

// Add entry points
const entryPoints = [
  path.join(srcDir, 'main.jsx'),
  path.join(srcDir, 'index.css'), 
];

entryPoints.forEach(file => {
  if (fs.existsSync(file)) {
    usedFiles.add(file);
  }
});

function resolveImport(sourceFile, importPath) {
  let targetPath;

  if (importPath.startsWith('.')) {
    targetPath = path.resolve(path.dirname(sourceFile), importPath);
  } else if (importPath.startsWith('/')) {
     targetPath = path.join(srcDir, importPath);
  } else {
    if (importPath.startsWith('src/')) {
        targetPath = path.join(path.dirname(srcDir), importPath);
    } else {
        return null; 
    }
  }

  // Try exact match
  if (fs.existsSync(targetPath) && fs.statSync(targetPath).isFile()) {
    return targetPath;
  }

  // Try extensions
  for (const ext of extensions) {
    if (fs.existsSync(targetPath + ext) && fs.statSync(targetPath + ext).isFile()) {
      return targetPath + ext;
    }
  }

  // Try directory index
  if (fs.existsSync(targetPath) && fs.statSync(targetPath).isDirectory()) {
    for (const ext of extensions) {
      const indexPath = path.join(targetPath, 'index' + ext);
      if (fs.existsSync(indexPath) && fs.statSync(indexPath).isFile()) {
        return indexPath;
      }
    }
  }

  return null;
}

// Updated Regex to catch export ... from ...
const importRegex = /(?:import|export)\s+(?:[\w\s{},*]*\s+from\s+)?['"](.*?)['"]|require\(['"](.*?)['"]\)|import\(['"](.*?)['"]\)/g;

// Queue based traversal to find all reachable files
const queue = [...entryPoints];
const visited = new Set(entryPoints);

while (queue.length > 0) {
  const currentFile = queue.pop();
  
  if (!fs.existsSync(currentFile)) continue;
  
  const ext = path.extname(currentFile);
  if (!extensions.includes(ext)) continue;

  try {
    const content = fs.readFileSync(currentFile, 'utf8');
    let match;
    while ((match = importRegex.exec(content)) !== null) {
      const importPath = match[1] || match[2] || match[3];
      if (!importPath) continue;

      const resolved = resolveImport(currentFile, importPath);
      
      if (resolved && !visited.has(resolved)) {
        // Ensure it is inside src
        if (resolved.startsWith(srcDir)) {
            visited.add(resolved);
            queue.push(resolved);
            usedFiles.add(resolved);
        }
      }
    }
  } catch (err) {
    console.error(`Error reading ${currentFile}:`, err);
  }
}

// Compare
const unused = allFiles.filter(file => !usedFiles.has(file));

console.log('Total files:', allFiles.length);
console.log('Used files:', usedFiles.size);
console.log('Unused files count:', unused.length);
console.log('--- Unused Files List ---');
unused.forEach(file => {
    // print relative to src
    console.log(path.relative(srcDir, file));
});