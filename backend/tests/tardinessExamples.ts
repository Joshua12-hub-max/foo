/**
 * TEST EXAMPLES FOR TARDINESS GRACE PERIOD
 * 
 * To run: npx ts-node backend/tests/tardinessExamples.ts
 */

// Mock logic matching attendanceProcessor.ts
function calculateLates(actualTimeIn: string, scheduleStartTime: string, gracePeriod: number): number {
  const [inH, inM] = actualTimeIn.split(':').map(Number);
  const [schH, schM] = scheduleStartTime.split(':').map(Number);
  
  const inMinutes = inH * 60 + inM;
  const schMinutes = schH * 60 + schM;
  
  if (inMinutes <= schMinutes) return 0;
  
  const diff = inMinutes - schMinutes;
  
  // Apply Grace Period Rule
  if (diff > gracePeriod) {
    return diff; // Outside grace: full lates recorded
  } else {
    return 0; // Within grace: recorded as 0
  }
}

// ----------------------------------------------------------------------------
// TEST CASE 1: WITHIN GRACE (15 mins)
// ----------------------------------------------------------------------------
const example1In = "08:10";
const example1Sch = "08:00";
const grace = 15;
const result1 = calculateLates(example1In, example1Sch, grace);

console.log("--- TEST EXAMPLE 1: WITHIN GRACE ---");
console.log(`Schedule: ${example1Sch}, Scan In: ${example1In}, Grace: ${grace} mins`);
console.log(`Result: ${result1} Late Minutes`);
console.log(`Status: ${result1 > 0 ? 'LATE' : 'PRESENT'}`);
console.log("");

// ----------------------------------------------------------------------------
// TEST CASE 2: OUTSIDE GRACE (15 mins)
// ----------------------------------------------------------------------------
const example2In = "08:20";
const example2Sch = "08:00";
const result2 = calculateLates(example2In, example2Sch, grace);

console.log("--- TEST EXAMPLE 2: OUTSIDE GRACE ---");
console.log(`Schedule: ${example2Sch}, Scan In: ${example2In}, Grace: ${grace} mins`);
console.log(`Result: ${result2} Late Minutes`);
console.log(`Status: ${result2 > 0 ? 'LATE' : 'PRESENT'}`);
