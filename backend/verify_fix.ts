import { processDailyAttendance } from './services/attendanceProcessor.js';

async function verify() {
  const empId = 'Emp-001';
  const date = '2026-04-10';
  console.log(`Processing attendance for ${empId} on ${date}...`);
  await processDailyAttendance(empId, date);
  console.log('Done.');
  process.exit(0);
}

verify().catch(console.error);
