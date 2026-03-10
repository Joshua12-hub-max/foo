
import { db } from '../db/index.js';
import { 
  authentication, 
  attendanceLogs, 
  dailyTimeRecords, 
  performanceReviewCycles, 
  performanceReviews,
  performanceCriteria,
  performanceReviewItems
} from '../db/schema.js';
import { eq, like, and, or, between } from 'drizzle-orm';
import { calculateAttendanceScore } from '../services/attendanceRatingService.js';

// Configuration
const START_DATE = new Date('2026-01-05');
const END_DATE = new Date('2026-02-19');
const CHRMO_DEPT_STRING = '%Human Resources%';

// Helpers
const addDays = (date: Date, days: number) => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

const formatDate = (date: Date) => {
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};

const formatDateTime = (date: Date) => {
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
};


const getRandomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

const getRandomTime = (year: number, month: number, day: number, baseHour: number, baseMinute: number, variationMinutes: number) => {
  const date = new Date(year, month, day, baseHour, baseMinute, 0);
  const variation = getRandomInt(-variationMinutes, variationMinutes);
  date.setMinutes(date.getMinutes() + variation);
  return date;
};

// Seed Criteria
const STANDARD_CRITERIA = [
    { title: "Quality of Work", description: "Completeness and accuracy of work.", category: 'Core Functions', weight: 0.20, type: 'core_function' },
    { title: "Efficiency", description: "Timeliness and speed of task completion.", category: 'Core Functions', weight: 0.20, type: 'core_function' },
    { title: "Timeliness", description: "Adherence to deadlines.", category: 'Core Functions', weight: 0.20, type: 'core_function' },
    { title: "Attendance & Punctuality", description: "Regularity and promptness.", category: 'Support Functions', weight: 0.20, type: 'support_function' }, 
    { title: "Initiative", description: "Proactive approach to tasks.", category: 'Support Functions', weight: 0.20, type: 'support_function' }
];

async function seedActivity() {
  console.log('Seeding CHRMO Activity (Corrected 8-5)...');

  // 1. Get CHRMO Employees
  const employees = await db.select().from(authentication).where(like(authentication.department, CHRMO_DEPT_STRING));
  console.log(`Found ${employees.length} CHRMO employees.`);

  if (employees.length === 0) {
    console.error('No CHRMO employees found to seed.');
    process.exit(1);
  }

  // Clear existing logs for these employees in this range to avoid duplicates
  console.log('Clearing existing records for CHRMO within date range...');
  // Note: Drizzle delete with `inArray` can be tricky if array is large, loop is safer.
  
  // Note: Drizzle delete with `inArray` can be tricky if array is large, loop is safer for "delete where... and date between..."
  // But here we'll just rely on overwrite/update or manual cleanup if needed. 
  // Actually, let's just delete ALL DTRs and Logs for these employees in the range to be clean.
  // Using SQL raw for efficiency if needed, but let's try standard drizzle.
  
  for (const emp of employees) {
     await db.delete(dailyTimeRecords).where(and(
         eq(dailyTimeRecords.employeeId, emp.employeeId),
         between(dailyTimeRecords.date, formatDate(START_DATE), formatDate(END_DATE))
     ));
     
     // Logs deletion is harder by date string, we'll skip deleting raw logs to save time/complexity and just insert new ones.
     // The DTR is the source of truth for the dashboard/performance usually. 
     // Wait, performance depends on DTRs. So deleting DTRs is key.
  }
  console.log('DTRs cleared.');

  // 2. Attendance Seeding
  let currentDate = START_DATE;
  while (currentDate <= END_DATE) {
    const dayOfWeek = currentDate.getDay();
    const dateStr = formatDate(currentDate);

    if (dayOfWeek === 0 || dayOfWeek === 6) {
      currentDate = addDays(currentDate, 1);
      continue;
    }

    console.log(`Processing Attendance: ${dateStr}`);
    
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const day = currentDate.getDate();

    for (const emp of employees) {
      const rand = Math.random();
      let status = 'Present';
      let timeInDate: Date | null = null;
      let timeOutDate: Date | null = null;
      let lateMinutes = 0;
      let undertimeMinutes = 0;

      // 8:00 AM to 5:00 PM (17:00)
      if (rand < 0.85) { 
          // PRESENT
          // In: 7:45 - 8:00
          status = 'Present'; 
          timeInDate = getRandomTime(year, month, day, 7, 50, 10); 
          timeOutDate = getRandomTime(year, month, day, 17, 5, 5); // 5:00 - 5:10 PM
      }
      else if (rand < 0.90) { 
          // LATE
          // In: 8:01 - 8:30
          status = 'Late'; 
          timeInDate = getRandomTime(year, month, day, 8, 15, 14); 
          
          const eightAM = new Date(year, month, day, 8, 0, 0);
          lateMinutes = Math.floor((timeInDate.getTime() - eightAM.getTime()) / 60000); 
          if (lateMinutes < 0) lateMinutes = 0; 
          
          timeOutDate = getRandomTime(year, month, day, 17, 5, 5); 
      }
      else if (rand < 0.95) { 
          // UNDERTIME
          // In: 7:45 - 8:00
          status = 'Undertime'; 
          timeInDate = getRandomTime(year, month, day, 7, 50, 10); 
          
          // Out: 16:30 - 16:59
          timeOutDate = getRandomTime(year, month, day, 16, 45, 14); 
          
          const fivePM = new Date(year, month, day, 17, 0, 0);
          undertimeMinutes = Math.floor((fivePM.getTime() - timeOutDate.getTime()) / 60000); 
          if (undertimeMinutes < 0) undertimeMinutes = 0; 
      }
      else { 
          status = 'Absent'; 
      }

      if (status !== 'Absent') {
           // Logs
           await db.insert(attendanceLogs).values([
              { employeeId: emp.employeeId, scanTime: formatDateTime(timeInDate!), type: 'IN', source: 'BIOMETRIC' },
              { employeeId: emp.employeeId, scanTime: formatDateTime(timeOutDate!), type: 'OUT', source: 'BIOMETRIC' }
           ]);
           // DTR
           await db.insert(dailyTimeRecords).values({
              employeeId: emp.employeeId, 
              date: dateStr, 
              timeIn: formatDateTime(timeInDate!), 
              timeOut: formatDateTime(timeOutDate!), 
              lateMinutes, 
              undertimeMinutes, 
              status, 
              createdAt: formatDateTime(new Date())
           });
      } else {
           await db.insert(dailyTimeRecords).values({
              employeeId: emp.employeeId, 
              date: dateStr, 
              status: 'Absent', 
              createdAt: formatDateTime(new Date())
           });
      }
    }
    currentDate = addDays(currentDate, 1);
  }

  // 3. Performance Criteria Seeding (Idempotent)
  console.log('Seeding Performance Criteria...');
  for (const c of STANDARD_CRITERIA) {
      const existing = await db.query.performanceCriteria.findFirst({
          where: eq(performanceCriteria.title, c.title)
      });
      if (!existing) {
          await db.insert(performanceCriteria).values({
              title: c.title,
              description: c.description,
              category: c.category,
              weight: String(c.weight),
              criteriaType: c.type as unknown,
              isActive: true,
              maxScore: 5
          } as unknown);
      }
  }

  // 4. Performance Reviews Seeding
  console.log('Seeding Performance Reviews...');
  const cycleTitle = 'Jan - Jun 2026';
  let cycleId: number;

  const existingCycle = await db.query.performanceReviewCycles.findFirst({ where: eq(performanceReviewCycles.title, cycleTitle) });
  if (existingCycle) {
      cycleId = existingCycle.id;
  } else {
      const [res] = await db.insert(performanceReviewCycles).values({
          title: cycleTitle,
          description: 'First Semester 2026 Evaluation',
          startDate: '2026-01-01',
          endDate: '2026-06-30',
          status: 'Active',
          ratingPeriod: '1st_sem'
      });
      cycleId = res.insertId;
  }

  const deptHead = employees.find(e => e.email === 'judiths.guevarra@cityhall.gov.ph') || employees.find(e => e.email.includes('judith'));
  const deptHeadId = deptHead ? deptHead.id : null;

  for (const emp of employees) {
      let reviewId: number;
      const existingReview = await db.query.performanceReviews.findFirst({
          where: and(eq(performanceReviews.employeeId, emp.id), eq(performanceReviews.reviewCycleId, cycleId))
      });

      if (existingReview) {
          reviewId = existingReview.id;
      } else {
          const reviewerId = (deptHeadId && emp.id !== deptHeadId) ? deptHeadId : emp.id;
          const [insertRes] = await db.insert(performanceReviews).values({
              employeeId: emp.id,
              reviewerId: reviewerId,
              reviewPeriodStart: '2026-01-01',
              reviewPeriodEnd: '2026-06-30',
              status: 'Draft',
              reviewCycleId: cycleId,
              ratingPeriod: '1st_sem',
              evaluationMode: 'CSC'
          });
          reviewId = insertRes.insertId;
      }

      // Ensure items exist
      const reviewItems = await db.select().from(performanceReviewItems).where(eq(performanceReviewItems.reviewId, reviewId));
      if (reviewItems.length === 0) {
          const allCriteria = await db.select().from(performanceCriteria).where(eq(performanceCriteria.isActive, true));
          for (const c of allCriteria) {
               const score = (Math.random() * (5 - 3) + 3).toFixed(2);
               const selfScore = (Math.random() * (5 - 4) + 4).toFixed(2);
               const isAttendance = c.title.toLowerCase().includes('attendance') || c.title.toLowerCase().includes('punctuality');
              
              await db.insert(performanceReviewItems).values({
                  reviewId: reviewId,
                  criteriaId: c.id,
                  criteriaTitle: c.title,
                  criteriaDescription: c.description,
                  weight: c.weight,
                  maxScore: c.maxScore,
                  category: c.category,
                  score: isAttendance ? '0' : String(score), 
                  selfScore: String(selfScore),
                  comment: isAttendance ? 'Auto-calculated' : 'Good performance.',
              });
          }
      }

      // Re-Compute Attendance Score (This will fix the score based on NEW DTRs)
      const attResult = await calculateAttendanceScore(emp.employeeId, '2026-01-01', '2026-06-30');
      const attScore = attResult.score;

      await db.update(performanceReviewItems)
          .set({ 
              score: String(attScore),
              tScore: String(attScore),
              comment: `Auto-computed: ${attResult.details.ratingDescription}`
          })
          .where(and(
              eq(performanceReviewItems.reviewId, reviewId),
              or(like(performanceReviewItems.criteriaTitle, '%Attendance%'), like(performanceReviewItems.criteriaTitle, '%Punctuality%'))
          ));

      // Re-Calculate Final Score
      const currentItems = await db.select().from(performanceReviewItems).where(eq(performanceReviewItems.reviewId, reviewId));
      let totalWeightedScore = 0;
      let totalWeight = 0;

      for (const item of currentItems) {
          const w = parseFloat(String(item.weight)) || 1;
          const s = parseFloat(String(item.score)) || 0;
          totalWeightedScore += s * w;
          totalWeight += w;
      }

      const finalScore = totalWeight > 0 ? (totalWeightedScore / totalWeight).toFixed(2) : '0';

      await db.update(performanceReviews)
          .set({
              totalScore: finalScore,
              finalRatingScore: finalScore,
              reviewerRatingScore: finalScore,
              status: 'Finalized',
              updatedAt: formatDateTime(new Date())
          })
          .where(eq(performanceReviews.id, reviewId));

      console.log(`Updated Review for ${emp.firstName}: Score ${finalScore}`);
  }

  console.log('Seeding Activity & Performance (Corrected) Complete.');
  process.exit(0);
}

seedActivity();
