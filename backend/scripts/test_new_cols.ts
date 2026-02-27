import { db } from '../db/index.js';
import { policyViolations, employeeMemos } from '../db/schema.js';

async function checkRows() {
  console.log('--- VIOLATIONS TRACKER ---');
  const violations = await db.select().from(policyViolations).limit(10);
  console.table(violations.map(v => ({
    empId: v.employeeId,
    type: v.type,
    offenseLvl: v.offenseLevel,
    offenseNum: v.offenseNumber,
    subtype: v.violationSubtype,
    months: v.triggeredMonths,
    fingerprint: v.fingerprint?.substring(0, 10) + '...'
  })));

  console.log('\n--- GENERATED MEMOS ---');
  const memos = await db.select().from(employeeMemos).limit(5);
  console.table(memos.map(m => ({
    memoNo: m.memoNumber,
    type: m.memoType,
    severity: m.severity,
    subject: m.subject
  })));
  
  process.exit(0);
}

checkRows();
