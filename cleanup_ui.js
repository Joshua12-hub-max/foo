import fs from 'fs';
import path from 'path';

const targetDirs = [
  'frontend/src/features/Recruitment/',
  'frontend/src/features/Settings/Biometrics/',
  'frontend/src/features/LeaveRequests/',
  'frontend/src/pages/EmployeeManagementAdmin/',
  'frontend/src/pages/EmployeeManagementEmployee/',
  'frontend/src/pages/TimekeepingAdmin/',
  'frontend/src/pages/TimekeepingEmployee/'
];

const acronyms = ['ID', 'HR', 'GSIS', 'SSS', 'PHIC', 'HDMF', 'PDS', 'DTR', 'URL', 'PDF', 'QR', 'IP', 'MAC', 'API'];

function toTitleCase(str) {
  return str.toLowerCase().split(/\s+/).map(word => {
    if (acronyms.includes(word.toUpperCase())) {
      return word.toUpperCase();
    }
    return word.charAt(0).toUpperCase() + word.slice(1);
  }).join(' ');
}

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;

  // Task 1: Remove 'uppercase' from className
  // Handles className="...", className='...', and className={`...`}
  // Use a regex that handles boundaries well
  content = content.replace(/(className\s*=\s*(?:["']|{\s*`))([^"'`}]*)\b(uppercase)\b([^"'`}]*)(["'`}]?)/g, (match, p1, p2, p3, p4, p5) => {
    let classes = (p2 + p4).split(/\s+/).filter(c => c && c !== 'uppercase').join(' ');
    // Preserve leading/trailing spaces if they were there (important for template literals)
    if (p2.startsWith(' ')) classes = ' ' + classes;
    if (p4.endsWith(' ')) classes = classes + ' ';
    return p1 + classes + p5;
  });

  // Task 2: Convert all-caps strings to Title Case
  // 1. Text between JSX tags: > ALL CAPS < or >ALL CAPS:<
  // We match strings that have at least 2 uppercase letters and might have spaces or common punctuation
  content = content.replace(/>(\s*[A-Z][A-Z\s:]{1,}[A-Z\s:]*\s*)</g, (match, p1) => {
    // Avoid matching if it looks like a variable {NAME}
    if (p1.trim().startsWith('{') && p1.trim().endsWith('}')) return match;
    
    // Check if it's all caps (ignoring spaces and punctuation)
    const textOnly = p1.replace(/[^A-Za-z]/g, '');
    if (textOnly.length > 0 && textOnly === textOnly.toUpperCase()) {
      // Preserve leading/trailing spaces
      const leadingSpaces = p1.match(/^\s*/)[0];
      const trailingSpaces = p1.match(/\s*$/)[0];
      const trimmed = p1.trim();
      
      // Handle trailing colon
      let result = toTitleCase(trimmed.replace(/:$/, '')).trim();
      if (trimmed.endsWith(':')) result += ':';
      
      return `>${leadingSpaces}${result}${trailingSpaces}<`;
    }
    return match;
  });

  // 2. Attributes: title="ALL CAPS", placeholder="ALL CAPS", label="ALL CAPS"
  const attributes = ['title', 'placeholder', 'label', 'aria-label', 'confirmText', 'cancelText'];
  attributes.forEach(attr => {
    const regex = new RegExp(`(${attr}\\s*=\s*["'])([A-Z][A-Z\\s:]{1,})([^"']*)(["'])`, 'g');
    content = content.replace(regex, (match, p1, p2, p3, p4) => {
      // Check if p2+p3 is all caps
      const fullValue = p2 + p3;
      const textOnly = fullValue.replace(/[^A-Za-z]/g, '');
      if (textOnly.length > 0 && textOnly === textOnly.toUpperCase()) {
        return p1 + toTitleCase(fullValue) + p4;
      }
      return match;
    });
  });

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated: ${filePath}`);
  }
}

function traverse(dir) {
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      traverse(fullPath);
    } else if (/\.(tsx|ts|js|jsx)$/.test(file)) {
      processFile(fullPath);
    }
  });
}

targetDirs.forEach(dir => {
  const fullPath = path.resolve(process.cwd(), dir);
  traverse(fullPath);
});
