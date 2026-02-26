

// Mock DB Query for testing
// We will monkey-patch or just copy logic for strict testing if direct unit test is hard.
// Actually, since we can't easily mock `db.query` without a library, 
// I will create a "Testable" version of the logic here to prove the algorithm is wrong,
// matching the file content I just read.

// Updated Logic matching attendanceRatingService.ts
function testLogic(lates: number, lateMinutes: number, undertimes: number, absences: number, violations: number = 0) {
    const totalInstances = lates + undertimes; // Absences separate now in logic, usually

    let score = 5;
    // let ratingDescription = 'Result';

    // Strict Scoring Logic (Reference: CSC / Internal Policy)
    // 5 - Outstanding: No lates, no undertime, no absences.
    // 4 - Very Satisfactory: <= 5 instances AND <= 60 mins late AND 0 Absences
    // 3 - Satisfactory: <= 10 instances AND <= 120 mins late AND <= 1 Absence
    // 2 - Unsatisfactory: > 10 instances OR > 120 mins late OR >= 2 Absences
    // 1 - Poor: Habitual (>= 3 absences OR >= 10 consecutive absences checks) OR Violation

    if (violations > 0) {
        score = 1;
        // ratingDescription = `Poor (Has ${violations} Policy Violation/s)`;
    } else if (absences >= 3) {
        score = 1;
        // ratingDescription = `Poor (Habitual Absenteeism: ${absences} days)`;
    } else if (lateMinutes > 240) { // > 4 hours total
        score = 1;
        // ratingDescription = `Poor (Severe Tardiness: ${lateMinutes} mins)`;
    } else if (totalInstances === 0 && absences === 0 && lateMinutes === 0) {
        score = 5;
    } else if (totalInstances <= 5 && lateMinutes <= 60 && absences === 0) {
        score = 4;
    } else if (totalInstances <= 10 && lateMinutes <= 120 && absences <= 1) {
        score = 3;
    } else if (totalInstances <= 15 || absences <= 2) {
        score = 2;
    } else {
        score = 1;
    }
    
    return score;
}

function verifyAttendanceScoring() {
    console.log('--- Verifying Attendance Scoring Algo (New Strict Rules) ---');

    console.log('Test 1: 1 Late, 500 Minutes (Severe Tardiness)');
    const score1 = testLogic(1, 500, 0, 0);
    console.log(`   Input: 1 Instance, 500 Mins`);
    console.log(`   Actual: ${score1}`); 
    if (score1 === 1) console.log('   [PASS] Correctly flagged as Poor due to severe minutes.');
    else console.log('   [FAIL] Algorithm still too lenient.');

    console.log('\nTest 2: 3 Absences (Habitual), 0 Lates');
    const score2 = testLogic(0, 0, 0, 3);
    console.log(`   Input: 3 Absences`);
    console.log(`   Actual: ${score2}`);
    if (score2 === 1) console.log('   [PASS] Correctly flagged as Poor due to habitual absenteeism.');

    console.log('\nTest 3: 10 Undentimes, 0 Mins Late, 0 Absences');
    const score3 = testLogic(0, 0, 10, 0);
    // Instances=10. Mins=0. Absences=0. 
    // Matches: <= 10 && <= 120 && <= 1 ? YES -> Score 3.
    console.log(`   Input: 10 Undentimes`);
    console.log(`   Expected: 3 (Satisfactory)`);
    console.log(`   Actual: ${score3}`); 

    console.log('\nTest 4: 1 Violation (Tardiness)');
    const score4 = testLogic(0, 0, 0, 0, 1);
    console.log(`   Input: 0 Lates, 1 Violation`);
    console.log(`   Actual: ${score4}`);
    if (score4 === 1) console.log('   [PASS] Violation triggers immediate Poor rating.');
}

verifyAttendanceScoring();
