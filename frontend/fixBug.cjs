const fs = require('fs');
const p = 'src/pages/EmployeeManagementAdmin/AdminRegister.tsx';
let c = fs.readFileSync(p, 'utf8');

c = c.replace(/className=\{\`\\\s*\$\{errors/g, 'className={`\\${inputClass} \\${errors');
fs.writeFileSync(p, c);
