
import { db } from '../db/index.js';
import { authentication, performancereviews, performanceReviews, dailyTimeRecords, attendanceLogs } from '../db/schema.js';
import { eq, like, and, sql } from 'drizzle-orm';

async function verifyAndFix() {
  console.log('Verifying CHRMO Activity...');

  // 1. Check Attendance
  const logsCount = await db.select({ count: sql<number>`count(*)` }).from(attendanceLogs);
  const dtrCount = await db.select({ count: sql<number>`count(*)` }).from(dailyTimeRecords);
  
  console.log(`Total Attendance Logs: ${logsCount[0].count}`);
  console.log(`Total DTR Records: ${dtrCount[0].count}`);

  const sampleDTR = await db.select().from(dailyTimeRecords).limit(5);
  console.table(sampleDTR.map(d => ({ 
      date: d.date, 
      id: d.employeeId, 
      status: d.status, 
      in: d.timeIn?.split(' ')[1], 
      out: d.timeOut?.split(' ')[1],
      late: d.lateMinutes
  })));

  // 2. Fix Reviewers
  console.log('Fixing Reviewer Assignments...');
  const headEmail = 'judiths.guevarra@cityhall.gov.ph'; // Corrected email
  const deptHead = await db.query.authentication.findFirst({
      where: eq(authentication.email, headEmail)
  });

  if (deptHead) {
      console.log(`Department Head Found: ${deptHead.firstName} ${deptHead.lastName} (ID: ${deptHead.id})`);
      
      // Update all CHRMO reviews where reviewer is self (and not the head herself)
      // Note: We need to filter by CHRMO employees first.
      
      const chrmoEmployees = await db.select().from(authentication).where(like(authentication.department, '%Human Resources%'));
      const empIds = chrmoEmployees.map(e => e.id);

      // Update reviews for these employees
      await db.update(performanceReviews)
          .set({ reviewerId: deptHead.id })
          .where(and(
              sql`${performanceReviews.employeeId} IN ${empIds}`,
              // Don't update the head's own review to be reviewed by herself (or maybe yes, self-review is distinct)
              // Usually the head is reviewed by the Mayor/Administrator. 
              // But strictly, let's set staff reviewers to Head.
              sql`${performanceReviews.employeeId} != ${deptHead.id}`
          ));
          
      console.log('Updated reviewer IDs for staff.');
  } else {
      console.error('Department Head still not found with corrected email.');
  }

  // 3. Verify Reviews
  const reviews = await db.select({
      emp: authentication.firstName,
      reviewerId: performanceReviews.reviewerId,
      status: performanceReviews.status
  })
  .from(performanceReviews)
  .leftJoin(authentication, eq(performanceReviews.employeeId, authentication.id))
  .where(like(authentication.department, '%Human Resources%'));

  console.table(reviews);

  process.exit(0);
}

verifyAndFix();
