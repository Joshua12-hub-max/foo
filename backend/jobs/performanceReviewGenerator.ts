import cron from 'node-cron';
import { db } from '../db/index.js';
import { 
  performanceReviewCycles, 
  performanceReviews, 
  performanceReviewItems, 
  performanceCriteria,
  performanceAuditLog,
  authentication,
  pdsHrDetails
} from '../db/schema.js';
import { pdsPersonalInformation } from '../db/tables/pds.js';
import { eq, and, isNull, lte, or } from 'drizzle-orm';
import { formatToManilaDateTime } from '../utils/dateUtils.js';

/**
 * Automatically generates performance reviews for a given cycle.
 * Designed to be called when a cycle transitions from Draft to Active.
 */
export const generateReviewsForCycle = async (cycleId: number, actorId?: number) => {
  console.warn(`[PERFORMANCE] Generating reviews for cycle ID: ${cycleId}...`);
  
  try {
    const cycle = await db.query.performanceReviewCycles.findFirst({
      where: eq(performanceReviewCycles.id, cycleId)
    });

    if (!cycle) {
      console.error(`[PERFORMANCE] Cycle ${cycleId} not found.`);
      return { success: false, message: 'Cycle not found' };
    }

    // 1. Fetch a fallback reviewer (Admin/HR) if managerId or actorId is null/invalid
    const fallbackReviewer = await db.query.authentication.findFirst({
      where: or(
        eq(authentication.role, 'Administrator'),
        eq(authentication.role, 'Human Resource')
      ),
      columns: { id: true }
    });

    const systemActorId = actorId || fallbackReviewer?.id || 1;

    // 2. Fetch all active employees
    const activeEmployees = await db.select({
      id: authentication.id,
      managerId: pdsHrDetails.managerId,
      birthDate: pdsPersonalInformation.birthDate
    })
    .from(authentication)
    .innerJoin(pdsHrDetails, eq(authentication.id, pdsHrDetails.employeeId))
    .leftJoin(pdsPersonalInformation, eq(authentication.id, pdsPersonalInformation.employeeId))
    .where(and(
      eq(pdsHrDetails.employmentStatus, 'Active'),
      sql`${authentication.role} != 'Administrator'`
    ));

    const defaultReviewerId = fallbackReviewer?.id || systemActorId;

    // 3. Fetch all active criteria
    const criteria = await db.select().from(performanceCriteria).where(or(
      eq(performanceCriteria.isActive, true),
      isNull(performanceCriteria.isActive)
    ));

    let createdCount = 0;
    let skippedCount = 0;

    for (const emp of activeEmployees) {
      // Check if review already exists
      const existing = await db.query.performanceReviews.findFirst({
        where: and(
          eq(performanceReviews.employeeId, emp.id),
          eq(performanceReviews.reviewCycleId, cycleId)
        )
      });

      if (existing) {
        skippedCount++;
        continue;
      }

      // Determine Reviewer
      const reviewerId = emp.managerId || defaultReviewerId;

      // Determine Evaluation Mode
      let evaluationMode: 'CSC' | 'IPCR' | 'Senior' = 'CSC';
      if (emp.birthDate) {
        const birthDate = new Date(emp.birthDate);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
        if (age >= 60) evaluationMode = 'Senior';
      }

      // Create Review
      const [reviewResult] = await db.insert(performanceReviews).values({
        employeeId: emp.id,
        reviewerId: reviewerId,
        reviewCycleId: cycleId,
        reviewPeriodStart: cycle.startDate,
        reviewPeriodEnd: cycle.endDate,
        status: 'Draft',
        evaluationMode: evaluationMode,
        ratingPeriod: cycle.ratingPeriod,
        createdAt: formatToManilaDateTime(new Date())
      });

      const reviewId = reviewResult.insertId;

      // Add Criteria Items
      if (criteria.length > 0) {
        for (const c of criteria) {
          await db.insert(performanceReviewItems).values({
            reviewId,
            criteriaId: c.id,
            score: '0',
            criteriaTitle: c.title,
            criteriaDescription: c.description,
            weight: c.weight,
            maxScore: c.maxScore,
            category: c.category || 'General'
          });
        }
      }
      createdCount++;
    }

    // 3. Log Audit
    await db.insert(performanceAuditLog).values({
      action: 'auto_generate_reviews',
      actorId: systemActorId,
      details: JSON.stringify({ 
        cycleId, 
        createdCount, 
        skippedCount, 
        totalEmployees: activeEmployees.length 
      }),
      createdAt: formatToManilaDateTime(new Date())
    });

    console.warn(`[PERFORMANCE] Completed generation for cycle ${cycleId}. Created: ${createdCount}, Skipped: ${skippedCount}`);
    return { success: true, createdCount, skippedCount };
  } catch (error) {
    console.error(`[PERFORMANCE] Failed to generate reviews for cycle ${cycleId}:`, error);
    return { success: false, message: 'Internal error' };
  }
};

/**
 * Cron task to check for upcoming/draft cycles that should be activated.
 */
export const checkAndActivateCycles = async () => {
  const today = new Date().toISOString().split('T')[0];
  console.warn(`[PERFORMANCE] Running cycle activation check for ${today}...`);

  try {
    const cyclesToActivate = await db.select()
      .from(performanceReviewCycles)
      .where(and(
        eq(performanceReviewCycles.status, 'Draft'),
        lte(performanceReviewCycles.startDate, today)
      ));

    for (const cycle of cyclesToActivate) {
      console.warn(`[PERFORMANCE] Activating cycle: ${cycle.title}...`);
      
      // Update Cycle Status
      await db.update(performanceReviewCycles)
        .set({ status: 'Active' })
        .where(eq(performanceReviewCycles.id, cycle.id));

      // Generate Reviews
      await generateReviewsForCycle(cycle.id);
    }
  } catch (error) {
    console.error('[PERFORMANCE] Error in cycle activation job:', error);
  }
};

/**
 * Initialize the Performance Automation Cron Jobs
 */
export const initPerformanceAutomationJob = () => {
  // Run daily at 1:00 AM
  cron.schedule('0 1 * * *', () => {
    checkAndActivateCycles();
  });
  
  console.warn('Performance Automation Job initialized (Daily at 1:00 AM)');
};

// Helper for drizzle 'sql' if needed (added to imports if used)
import { sql } from 'drizzle-orm';
