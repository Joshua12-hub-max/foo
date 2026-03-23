const fs = require('fs');

function replaceInFile(file, search, replacement) {
    if (!fs.existsSync(file)) return;
    let content = fs.readFileSync(file, 'utf8');
    content = content.replace(search, replacement);
    fs.writeFileSync(file, content);
}

// 1. AdminAgendaView.tsx
let f = 'frontend/src/components/Custom/CalendarComponents/admin/components/AdminAgendaView.tsx';
replaceInFile(f, /\(item as Record<string, string>\)/g, '(item as unknown as Record<string, string>)');

// 2. ProfilePerformance.tsx
f = 'frontend/src/components/Custom/EmployeeManagement/Admin/Profile/ProfilePerformance.tsx';
replaceInFile(f, /r:\s*Record<string,\s*string>/g, 'r: Record<string, string | number>');
replaceInFile(f, /id:\s*r\.id,/g, 'id: Number(r.id),');
replaceInFile(f, /totalScore:\s*r\.totalScore \|\| r\.total_score,/g, 'totalScore: Number(r.totalScore || r.total_score),');
replaceInFile(f, /\(r\.employeeFirstName/g, '(String(r.employeeFirstName)');
replaceInFile(f, /r\.employee_first/g, 'String(r.employee_first)');
replaceInFile(f, /r\.employeeLastName/g, 'String(r.employeeLastName)');
replaceInFile(f, /r\.employee_last/g, 'String(r.employee_last)');
replaceInFile(f, /r\.employee_last_name/g, 'String(r.employee_last_name)');
replaceInFile(f, /r\.cycleTitle/g, 'String(r.cycleTitle)');
replaceInFile(f, /r\.reviewPeriodStart/g, 'String(r.reviewPeriodStart)');
replaceInFile(f, /r\.reviewPeriodEnd/g, 'String(r.reviewPeriodEnd)');
replaceInFile(f, /r\.status/g, 'String(r.status)');

// 3. Approve.tsx
f = 'frontend/src/components/Custom/Timekeeping/LeaveRequestComponents/Admin/Modals/Approve.tsx';
// If prediction is inferred as never, it's likely from `setPrediction` or state.
// Let's replace `never` with a proper type if possible, or just cast prediction.
replaceInFile(f, /prediction\./g, '(prediction as Record<string, string | number>).');

// 4. ModalContainer.tsx
f = 'frontend/src/components/Global/ModalContainer.tsx';
replaceInFile(f, /React\.ComponentType<never>/g, 'React.ComponentType<Record<string, unknown>>');
// We had `Component {...modal.props}` which I stripped to `Component onClose=...` let's put props back
replaceInFile(f, /<Component  onClose/g, '<Component {...(modal.props as Record<string, unknown>)} onClose');

// 5. authStore.ts
f = 'frontend/src/stores/authStore.ts';
replaceInFile(f, /\(\(user as Record<string, User>\)\?\.user\)/g, '("user" in user ? (user as unknown as Record<string, User>).user : undefined)');

console.log('Fixed final frontend TS errors');
