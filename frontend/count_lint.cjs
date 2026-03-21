const fs = require('fs');

function analyzeResults(filePath) {
  let content;
  try {
    // Try reading as UTF-8 first
    content = fs.readFileSync(filePath, 'utf8');
    if (content.startsWith('\ufeff') || content.includes('\u0000')) {
        // Likely UTF-16 LE or has BOM
        content = fs.readFileSync(filePath, 'utf16le');
    }
    
    // Remove potential leading BOM or garbage
    content = content.replace(/^\ufeff/, '');
    
    // If it still looks like UTF-16 with spaces, try to fix it
    if (content.match(/^[^{]*\{[ \t\n\r]*"filePath"/)) {
       // Proceed to parse
    } else if (content.includes('\u0000')) {
       // This shouldn't happen if we read as utf16le correctly
    }

    const data = JSON.parse(content);
    let totalErrors = 0;
    const ruleCounts = {};

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

  } catch (err) {
    console.error(`Error analyzing results: ${err.message}`);
    process.exit(1);
  }
}

analyzeResults('lint_results.json');
