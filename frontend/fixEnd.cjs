const fs = require('fs');
const files = [
  'src/pages/Public/JobDetail.tsx',
  'src/pages/EmployeeManagementAdmin/AdminRegister.tsx'
];
files.forEach(f => {
  let c = fs.readFileSync(f, 'utf8');
  c = c.replace(/\\\\\$\{/g, '${'); // `\\$\{` to replace `\${` 
  c = c.replace(/\\\$\{/g, '${');   // `\$\{` to replace `\${`
  fs.writeFileSync(f, c);
});
console.log('Fixed interpolations');
