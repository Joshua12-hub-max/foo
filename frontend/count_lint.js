const fs = require('fs');
const data = JSON.parse(fs.readFileSync('lint_results.json', 'utf8'));

const ruleCounts = {};
let totalErrors = 0;

data.forEach(file => {
  file.messages.forEach(msg => {
    if (msg.severity === 2) {
      totalErrors++;
      ruleCounts[msg.ruleId] = (ruleCounts[msg.ruleId] || 0) + 1;
    }
  });
});

console.log(`Total Remaining Errors: ${totalErrors}`);
console.log('Errors by Rule:');
console.log(JSON.stringify(ruleCounts, null, 2));

const specificFiles = [
  'src/pages/EmployeeManagementAdmin/AdminRegister.tsx',
  'src/Authentication/Register.tsx'
];

specificFiles.forEach(target => {
  const fileData = data.find(f => f.filePath.endsWith(target.replace(/\//g, '\\')));
  if (fileData) {
    console.log(`\nErrors in ${target}: ${fileData.messages.filter(m => m.severity === 2).length}`);
    fileData.messages.filter(m => m.severity === 2).forEach(m => {
      console.log(`- [${m.ruleId}] Line ${m.line}: ${m.message}`);
    });
  } else {
    console.log(`\nNo errors found in ${target}`);
  }
});
