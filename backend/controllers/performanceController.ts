import { Request, Response } from 'express';
import { db } from '../db/index.js';
import { performanceReviews, 
  performanceReviewCycles, 
  authentication, 
  performanceReviewItems, 
  performanceCriteria, 
  performanceAuditLog,
  policyViolations,
  leaveApplications
} from '../db/schema.js';
import { eq, and, sql, desc, or, max, count, inArray, isNull, like, gte, lte } from 'drizzle-orm';
import { alias } from 'drizzle-orm/mysql-core';
import type { AuthenticatedRequest, ReviewStatus, PerformanceCriteriaType } from '../types/index.js';
import { calculateAttendanceScore } from '../services/attendanceRatingService.js';
import { formatToManilaDateTime } from '../utils/dateUtils.js';
import { 
  createReviewSchema, 
  updateReviewSchema,
  submitSelfRatingSchema,
  submitReviewerRatingSchema,
  createReviewCycleSchema,
} from '../schemas/performanceSchema.js';
import { z } from 'zod';

const formatDateForMySQL = (date: Date | string) => {
  return formatToManilaDateTime(date);
};

interface ReviewItemInput {
  id?: number | string;
  criteriaId?: number;
  score?: number;
  weight?: number;
  maxScore?: number;
  qScore?: number;
  eScore?: number;
  tScore?: number;
  comment?: string;
  criteriaTitle?: string;
  criteriaDescription?: string;
  category?: string;
  selfScore?: number;
  actualAccomplishments?: string;
  evidenceFilePath?: string;
  evidenceDescription?: string;
}

const getStats = async () => {
  const [totalEmployees] = await db.select({ count: count() })
    .from(authentication)
    .where(sql`${authentication.role} != 'Administrator'`);

  const [pendingReviews] = await db.select({ count: count() })
    .from(performanceReviews)
    .where(inArray(performanceReviews.status, ['Draft', 'Submitted', 'Self-Rated']));

  const [completedReviews] = await db.select({ count: count() })
    .from(performanceReviews)
    .where(inArray(performanceReviews.status, ['Acknowledged', 'Finalized', 'Approved']));

  const [overdueReviews] = await db.select({ count: count() })
    .from(performanceReviews)
    .where(and(
      eq(performanceReviews.status, 'Draft'),
      sql`${performanceReviews.reviewPeriodEnd} < CURDATE()`
    ));

  return {
    totalEmployees: totalEmployees?.count || 0,
    pendingEvaluations: pendingReviews?.count || 0,
    completedEvaluations: completedReviews?.count || 0,
    overdueEvaluations: overdueReviews?.count || 0
  };
};

const logAudit = async (reviewId: number, action: string, actorId: number, details: object | null = null): Promise<void> => {
  try {
    await db.insert(performanceAuditLog).values({
      reviewId,
      action,
      actorId,
      details: details ? JSON.stringify(details) : null
    });
  } catch (_error) {
      /* empty */

  }
};

const calculateReviewScore = async (reviewId: number): Promise<string> => {
  const items = await db.select({
    score: performanceReviewItems.score,
    itemWeight: performanceReviewItems.weight,
    criteriaWeight: performanceCriteria.weight
  })
  .from(performanceReviewItems)
  .leftJoin(performanceCriteria, eq(performanceReviewItems.criteriaId, performanceCriteria.id))
  .where(eq(performanceReviewItems.reviewId, reviewId));

  const review = await db.query.performanceReviews.findFirst({
    where: eq(performanceReviews.id, reviewId)
  });

  if (!review) return '0';

  let totalWeightedScore = 0;
  let totalWeight = 0;

  items.forEach(item => {
    // Coalesce weight: item weight -> criteria weight -> 1
    // FIXED: Item weight must take precedence to allow overrides
    const weight = parseFloat(String(item.itemWeight || item.criteriaWeight || 1));
    const score = parseFloat(String(item.score)) || 0;
    
    totalWeightedScore += score * weight;
    totalWeight += weight;
  });

  const baseScore = totalWeight > 0 ? (totalWeightedScore / totalWeight) : 0;

  try {
    const attendance = await calculateAttendanceScore(review.employeeId.toString(), review.reviewPeriodStart, review.reviewPeriodEnd);
    
    // Fetch exact violations within period to deduct
    const violations = await db.select({ count: sql<number>`count(*)` })
      .from(policyViolations)
      .where(and(
        eq(policyViolations.employeeId, review.employeeId.toString()),
        gte(policyViolations.createdAt, `${review.reviewPeriodStart} 00:00:00`),
        lte(policyViolations.createdAt, `${review.reviewPeriodEnd} 23:59:59`)
      ));
    
    const violationCount = Number(violations[0]?.count) || 0;

    // Fetch exact "Over Leave" Days (Leave Without Pay) within period
    const overLeaves = await db.select({ lwopSum: sql<number>`SUM(${leaveApplications.daysWithoutPay})` })
      .from(leaveApplications)
      .where(and(
        eq(leaveApplications.employeeId, review.employeeId.toString()),
        eq(leaveApplications.status, 'Approved'),
        gte(leaveApplications.startDate, review.reviewPeriodStart),
        lte(leaveApplications.endDate, review.reviewPeriodEnd)
      ));

    // Fallback safely to 0 if no lwop data is found
    const overLeaveDays = Number(overLeaves[0]?.lwopSum) || 0;

    // 100% Precision Deductions based on CSC/Meycauayan metrics:
    // Tardiness/Undertime: 0.01 points deducted per instance or precise equivalent
    // Absences/Leave: 0.05 points deducted per unexcused absence
    // Over Leaves: 0.05 points deducted per day WITHOUT pay (LWOP)  <--- NEWLY ADDED
    // Violations: 0.50 points deducted per policy violation
    const tardinessDeduction = (attendance.details.totalLates + attendance.details.totalUndertime) * 0.01;
    
    // Deducting -0.05 per regular absence AND -0.05 per 'Over Leave' (LWOP) day
    const leaveDeduction = (attendance.details.totalAbsences * 0.05) + (overLeaveDays * 0.05);

    const violationDeduction = violationCount * 0.50;

    const totalDeduction = tardinessDeduction + leaveDeduction + violationDeduction;

    let finalScore = baseScore - totalDeduction;

    // CSC Ratings are clamped between 1.00 (Poor) and 5.00 (Outstanding)
    if (finalScore < 1.00 && baseScore > 0) finalScore = 1.00;
    if (finalScore > 5.00) finalScore = 5.00;
    if (baseScore === 0) finalScore = 0;

    return finalScore.toFixed(2);
  } catch (_error) {

    return baseScore.toFixed(2);
  }
};

export const getEvaluationSummary = async (_req: Request, res: Response): Promise<void> => {
  try {
    const stats = await getStats();
    
    // Subquery for calculated score
    // Note: Drizzle raw SQL used for complex aggregation until more advanced features are stable
    // FIXED: Priority is pri.weight -> pc.weight
    const calculatedScoreSubquery = sql`(
      SELECT ROUND(SUM(pri.score * COALESCE(pri.weight, pc.weight, 1)) / NULLIF(SUM(COALESCE(pri.weight, pc.weight, 1)), 0), 2)
      FROM ${performanceReviewItems} pri
      LEFT JOIN ${performanceCriteria} pc ON pri.criteria_id = pc.id
      WHERE pri.review_id = ${performanceReviews.id}
    )`;

    const maxReviewIdSubquery = db.select({ maxId: max(performanceReviews.id) })
      .from(performanceReviews)
      .where(eq(performanceReviews.employeeId, authentication.id));

    const employees = await db.select({
      id: authentication.id,
      firstName: authentication.firstName,
      lastName: authentication.lastName,
      middleName: authentication.middleName,
      suffix: authentication.suffix,
      department: authentication.department,
      jobTitle: authentication.jobTitle,
      positionTitle: authentication.positionTitle,
      avatarUrl: authentication.avatarUrl,
      employeeId: authentication.employeeId,
      reviewId: performanceReviews.id,
      status: performanceReviews.status,
      lastEvaluationDate: performanceReviews.updatedAt,
      totalScore: performanceReviews.totalScore,
      reviewerRatingScore: performanceReviews.reviewerRatingScore,
      selfRatingScore: performanceReviews.selfRatingScore,
      calculatedScore: calculatedScoreSubquery,
      duties: sql<string>`COALESCE((SELECT schedule_title FROM schedules WHERE employee_id = ${authentication.employeeId} ORDER BY updated_at DESC LIMIT 1), 'No Schedule')`,
      birthDate: authentication.birthDate
    })
    .from(authentication)
    .leftJoin(performanceReviews, and(
      eq(authentication.id, performanceReviews.employeeId),
      eq(performanceReviews.id, maxReviewIdSubquery)
    ))
    .where(sql`${authentication.role} != 'Administrator'`)
    .orderBy(authentication.lastName);

    const formattedEmployees = employees.map(emp => {
      const storedScore = emp.totalScore || emp.reviewerRatingScore || emp.selfRatingScore;
      const middleInitial = emp.middleName && emp.middleName.trim() ? ` ${emp.middleName.trim().charAt(0)}.` : "";
      const suffixStr = emp.suffix && emp.suffix.trim() ? ` ${emp.suffix.trim()}` : "";
      return {
        id: emp.id,
        name: `${emp.lastName}, ${emp.firstName}${middleInitial}${suffixStr}`.trim() || 'Unknown Employee',
        firstName: emp.firstName,
        lastName: emp.lastName,
        department: emp.department,
        jobTitle: emp.jobTitle,
        positionTitle: emp.positionTitle,
        avatarUrl: emp.avatarUrl,
        employeeId: emp.employeeId,
        reviewId: emp.reviewId,
        status: emp.status || 'Not Started',
        lastEvaluationDate: emp.lastEvaluationDate,
        duties: emp.duties || 'No Schedule',
        score: (storedScore && parseFloat(String(storedScore)) > 0) ? storedScore : (emp.calculatedScore || null),
        birthDate: emp.birthDate
      };
    });

    res.json({ success: true, stats, employees: formattedEmployees });
  } catch (_error) {

    res.status(500).json({ success: false, message: 'Failed to fetch summary' });
  }
};

export const getRatingDistribution = async (_req: Request, res: Response): Promise<void> => {
  try {
    // statuses to include
    const statuses: ReviewStatus[] = ['Approved', 'Finalized', 'Acknowledged', 'Submitted'];
    
    // Fetch all relevant reviews
    const allReviews = await db.select({
      id: performanceReviews.id,
      employeeId: performanceReviews.employeeId,
      finalRatingScore: performanceReviews.finalRatingScore,
      totalScore: performanceReviews.totalScore,
      reviewerRatingScore: performanceReviews.reviewerRatingScore,
      status: performanceReviews.status
    })
    .from(performanceReviews)
    .where(inArray(performanceReviews.status, statuses));

    // Group by employee to find latest review per employee
    const latestReviewsMap = new Map<number, typeof allReviews[0]>();

    allReviews.forEach(review => {
      const existing = latestReviewsMap.get(review.employeeId);
      // Assuming higher ID is later; ideally use createdAt or reviewPeriodEnd but ID is usually safe for chronological inserts
      if (!existing || review.id > existing.id) {
        latestReviewsMap.set(review.employeeId, review);
      }
    });

    const distribution: Record<string, number> = { 
      outstanding: 0, 
      exceedsExpectations: 0, 
      meetsExpectations: 0, 
      needsImprovement: 0, 
      poorPerformance: 0 
    };

    latestReviewsMap.forEach(review => {
      // Coalesce score logic: Final -> Total -> Reviewer
      const scoreStr = review.finalRatingScore || review.totalScore || review.reviewerRatingScore;
      
      if (scoreStr) {
        const score = parseFloat(String(scoreStr));
        
        if (score >= 4.5) distribution.outstanding++;
        else if (score >= 3.5) distribution.exceedsExpectations++;
        else if (score >= 2.5) distribution.meetsExpectations++;
        else if (score >= 1.5) distribution.needsImprovement++;
        else distribution.poorPerformance++;
      }
    });

    const total = Object.values(distribution).reduce((sum, val) => sum + val, 0);
    res.json({ success: true, distribution, total });
  } catch (_error) {

    res.status(500).json({ success: false, message: 'Failed to fetch rating distribution' });
  }
};

export const getReviewCycles = async (_req: Request, res: Response): Promise<void> => {
  try {
    const cycles = await db.select()
      .from(performanceReviewCycles)
      .orderBy(desc(performanceReviewCycles.startDate));
    res.json({ success: true, cycles });
  } catch (_error) {
    res.status(500).json({ success: false, message: 'Failed to fetch cycles' });
  }
};

export const getReviews = async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { cycleId, status, department } = req.query;
    let employeeId = req.query.employeeId;

    if (authReq.user.role !== 'Administrator' && authReq.user.role !== 'Human Resource') {
      employeeId = String(authReq.user.id);
    }

    const conditions = [];
    if (employeeId) conditions.push(eq(performanceReviews.employeeId, Number(employeeId)));
    if (cycleId) conditions.push(eq(performanceReviews.reviewCycleId, Number(cycleId)));
    if (status) conditions.push(eq(performanceReviews.status, status as ReviewStatus));
    if (department && department !== 'All') conditions.push(eq(authentication.department, department as string));

    const reviewer = alias(authentication, 'reviewer');

    const reviews = await db.select({
      id: performanceReviews.id,
      employeeId: performanceReviews.employeeId,
      reviewerId: performanceReviews.reviewerId,
      reviewCycleId: performanceReviews.reviewCycleId,
      status: performanceReviews.status,
      totalScore: sql<string>`COALESCE(${performanceReviews.totalScore}, ${performanceReviews.reviewerRatingScore}, ${performanceReviews.selfRatingScore})`,
      reviewPeriodStart: performanceReviews.reviewPeriodStart,
      reviewPeriodEnd: performanceReviews.reviewPeriodEnd,
      createdAt: performanceReviews.createdAt,
      updatedAt: performanceReviews.updatedAt,
      // Joins
      reviewerFirstName: reviewer.firstName,
      reviewerLastName: reviewer.lastName,
      employeeFirstName: authentication.firstName,
      employeeLastName: authentication.lastName,
      department: authentication.department,
      cycleTitle: performanceReviewCycles.title
    })
    .from(performanceReviews)
    .leftJoin(authentication, eq(performanceReviews.employeeId, authentication.id))
    .leftJoin(reviewer, eq(performanceReviews.reviewerId, reviewer.id))
    .leftJoin(performanceReviewCycles, eq(performanceReviews.reviewCycleId, performanceReviewCycles.id))
    .where(and(...conditions))
    .orderBy(desc(performanceReviews.createdAt));
    
    res.json({ success: true, reviews });
  } catch (_error) {

    res.status(500).json({ success: false, message: 'Failed to fetch reviews' });
  }
};

export const getReview = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params as { id: string };
  const authReq = req as AuthenticatedRequest;

  try {
    const review = await db.query.performanceReviews.findFirst({
      where: eq(performanceReviews.id, Number(id)),
      with: {
        authenticationEmployeeId: true,
        authenticationReviewerId: true
      }
    });

    if (!review) {
      res.status(404).json({ success: false, message: 'Review not found' });
      return;
    }

    if (authReq.user.role !== 'Administrator' && authReq.user.role !== 'Human Resource') {
      if (review.employeeId != authReq.user.id && review.reviewerId != authReq.user.id) {
        res.status(403).json({ success: false, message: 'Unauthorized access to this review' });
        return;
      }
    }

    let attendanceDetails = null;

    // 1. Auto-calculate Attendance Score if period is defined
    if (review.reviewPeriodStart && review.reviewPeriodEnd) {
      const attendanceScore = await calculateAttendanceScore(review.employeeId, review.reviewPeriodStart, review.reviewPeriodEnd);
      attendanceDetails = attendanceScore.details;
      
      const attRate = attendanceScore.score;
      
      // Update items in DB
      await db.update(performanceReviewItems)
        .set({ 
          tScore: String(attRate),
          score: sql<string>`(COALESCE(${performanceReviewItems.qScore}, 0) + COALESCE(${performanceReviewItems.eScore}, 0) + ${attRate}) / 3`
        })
        .where(and(
          eq(performanceReviewItems.reviewId, Number(id)),
          or(
            like(performanceReviewItems.criteriaTitle, '%Attendance%'),
            like(performanceReviewItems.criteriaTitle, '%Punctuality%')
          )
        ));

      // Recalculate total review score
      const newTotalScore = await calculateReviewScore(Number(id));
      await db.update(performanceReviews)
        .set({ totalScore: newTotalScore })
        .where(eq(performanceReviews.id, Number(id)));
    }

    // 2. Fetch fresh items (with criteria info)
    const items = await db.select({
      id: performanceReviewItems.id,
      reviewId: performanceReviewItems.reviewId,
      criteriaId: performanceReviewItems.criteriaId,
      score: performanceReviewItems.score,
      selfScore: performanceReviewItems.selfScore,
      qScore: performanceReviewItems.qScore,
      eScore: performanceReviewItems.eScore,
      tScore: performanceReviewItems.tScore,
      comment: performanceReviewItems.comment,
      criteriaTitle: sql<string>`COALESCE(${performanceReviewItems.criteriaTitle}, ${performanceCriteria.title})`,
      criteriaDescription: sql<string>`COALESCE(${performanceReviewItems.criteriaDescription}, ${performanceCriteria.description})`,
      maxScore: sql<number>`COALESCE(${performanceReviewItems.maxScore}, ${performanceCriteria.maxScore})`,
      weight: sql<number>`COALESCE(${performanceReviewItems.weight}, ${performanceCriteria.weight})`,
      category: sql<string>`COALESCE(${performanceReviewItems.category}, ${performanceCriteria.category})`,
      criteriaType: performanceCriteria.criteriaType,
      actualAccomplishments: performanceReviewItems.actualAccomplishments,
      ratingDefinition5: performanceCriteria.ratingDefinition5,
      ratingDefinition4: performanceCriteria.ratingDefinition4,
      ratingDefinition3: performanceCriteria.ratingDefinition3,
      ratingDefinition2: performanceCriteria.ratingDefinition2,
      ratingDefinition1: performanceCriteria.ratingDefinition1,
      evidenceRequirements: performanceCriteria.evidenceRequirements,
      evidenceFilePath: performanceReviewItems.evidenceFilePath,
      evidenceDescription: performanceReviewItems.evidenceDescription
    })
    .from(performanceReviewItems)
    .leftJoin(performanceCriteria, eq(performanceReviewItems.criteriaId, performanceCriteria.id))
    .where(eq(performanceReviewItems.reviewId, Number(id)))
    .orderBy(
      sql<string>`COALESCE(${performanceReviewItems.category}, ${performanceCriteria.category})`,
      performanceReviewItems.id
    );

    // 3. Fetch Violation Count
    const violations = await db.select({ count: count() })
      .from(policyViolations)
      .where(and(
        eq(policyViolations.employeeId, String(review.employeeId)),
        eq(policyViolations.status, 'pending')
      ));

    // 4. Resolve flattened structure
    const flatReview = {
        ...review,
        employeeFirstName: review.authenticationEmployeeId.firstName,
        employeeLastName: review.authenticationEmployeeId.lastName,
        employeeDepartment: review.authenticationEmployeeId.department,
        employeeJobTitle: review.authenticationEmployeeId.jobTitle,
        reviewerFirstName: review.authenticationReviewerId.firstName,
        reviewerLastName: review.authenticationReviewerId.lastName,
        employeePositionTitle: review.authenticationEmployeeId.positionTitle,
        attendanceDetails: attendanceDetails,
        violationCount: violations[0].count,
        items
    };

    res.json({ success: true, review: flatReview });
  } catch (_error) {

    res.status(500).json({ success: false, message: 'Failed to fetch review' });
  }
};

export const acknowledgeReview = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params as { id: string };
  const authReq = req as AuthenticatedRequest;

  try {
    const review = await db.query.performanceReviews.findFirst({
      where: eq(performanceReviews.id, Number(id))
    });

    if (!review) {
      res.status(404).json({ success: false, message: 'Review not found' });
      return;
    }

    if (review.employeeId != authReq.user.id) {
      res.status(403).json({ success: false, message: 'You can only acknowledge your own reviews' });
      return;
    }

    if (review.disagreed) {
      res.status(400).json({ success: false, message: 'Cannot acknowledge a review you have disagreed with.' });
      return;
    }

    await db.update(performanceReviews)
      .set({ status: 'Acknowledged' })
      .where(eq(performanceReviews.id, Number(id)));

    await logAudit(Number(id), 'acknowledged', authReq.user.id, {});
    res.json({ success: true, message: 'Review acknowledged successfully' });
  } catch (_error) {
    res.status(500).json({ success: false, message: 'Failed to acknowledge review' });
  }
};

export const disagreeWithReview = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params as { id: string };
  const authReq = req as AuthenticatedRequest;
  const { disagreeRemarks } = req.body as { disagreeRemarks?: string };

  try {
    const review = await db.query.performanceReviews.findFirst({
      where: eq(performanceReviews.id, Number(id))
    });

    if (!review) {
      res.status(404).json({ success: false, message: 'Review not found' });
      return;
    }

    if (review.employeeId != authReq.user.id) {
      res.status(403).json({ success: false, message: 'You can only disagree with your own reviews' });
      return;
    }

    if (review.disagreed) {
      res.status(400).json({ success: false, message: 'You have already disagreed with this review.' });
      return;
    }

    if (!['Submitted', 'Approved', 'Finalized'].includes(review.status || '')) {
      res.status(400).json({ success: false, message: 'Cannot disagree with a review in its current status.' });
      return;
    }

    await db.update(performanceReviews)
      .set({
        disagreed: true,
        disagreeRemarks: disagreeRemarks || null,
        employeeRemarks: disagreeRemarks || null
      })
      .where(eq(performanceReviews.id, Number(id)));

    await logAudit(Number(id), 'disagreed', authReq.user.id, { disagreeRemarks });
    res.json({ success: true, message: 'Review disagreement recorded successfully' });
  } catch (_error) {

    res.status(500).json({ success: false, message: 'Failed to record disagreement' });
  }
};

export const createReview = async (req: Request, res: Response): Promise<void> => {
  const authReq = req as AuthenticatedRequest;
  try {
    const validatedData = createReviewSchema.parse(req.body);
    const { employeeId, reviewerId, reviewCycleId } = validatedData;
    let { reviewPeriodStart: periodStart, reviewPeriodEnd: periodEnd } = validatedData;
    const cycleId = reviewCycleId || null;

    if (cycleId && (!periodStart || !periodEnd)) {
      const cycle = await db.query.performanceReviewCycles.findFirst({
        where: eq(performanceReviewCycles.id, cycleId)
      });
      if (cycle) {
        periodStart = periodStart || cycle.startDate;
        periodEnd = periodEnd || cycle.endDate;
      }
    }

    if (!periodStart) periodStart = new Date().toISOString().split('T')[0];
    if (!periodEnd) {
      const sixMonths = new Date();
      sixMonths.setMonth(sixMonths.getMonth() + 6);
      periodEnd = sixMonths.toISOString().split('T')[0];
    }

    // Check existing by cycle
    if (cycleId) {
      const existing = await db.query.performanceReviews.findFirst({
        where: and(
          eq(performanceReviews.employeeId, employeeId),
          eq(performanceReviews.reviewCycleId, cycleId)
        )
      });
      if (existing) {
        res.status(200).json({ success: true, message: 'Review already exists', reviewId: existing.id, existing: true });
        return;
      }
    }

    // Check draft
    const existingDraft = await db.query.performanceReviews.findFirst({
      where: and(
        eq(performanceReviews.employeeId, employeeId),
        eq(performanceReviews.status, 'Draft')
      ),
      orderBy: [desc(performanceReviews.createdAt)]
    });

    if (existingDraft) {
      res.status(200).json({ success: true, message: 'Draft review exists', reviewId: existingDraft.id, existing: true });
      return;
    }

    // Auto-Senior Logic
    let evaluationMode: 'CSC' | 'IPCR' | 'Senior' = 'CSC';
    const employee = await db.query.authentication.findFirst({
      where: eq(authentication.id, employeeId)
    });

    if (employee?.birthDate) {
      const birthDate = new Date(employee.birthDate);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      if (age >= 60) {
        evaluationMode = 'Senior';
      }
    }

    const [result] = await db.insert(performanceReviews).values({
      employeeId: employeeId,
      reviewerId: reviewerId,
      reviewCycleId: cycleId,
      reviewPeriodStart: periodStart,
      reviewPeriodEnd: periodEnd,
      status: 'Draft',
      evaluationMode: evaluationMode,
      createdAt: formatDateForMySQL(new Date())
    });

    const reviewId = result.insertId;

    // Add criteria
    const criteria = await db.select().from(performanceCriteria).where(or(
      eq(performanceCriteria.isActive, true),
      isNull(performanceCriteria.isActive)
    ));

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

    await logAudit(reviewId, 'created', authReq.user.id, { employeeId, reviewerId, cycleId: cycleId });
    res.status(201).json({ success: true, message: 'Review initialized', reviewId });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, message: 'Validation failed', errors: error.flatten() });
      return;
    }

    const msg = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ success: false, message: 'Failed to create review: ' + msg });
  }
};

export const updateReview = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params as { id: string };
  const authReq = req as AuthenticatedRequest;
  try {
    const validatedData = updateReviewSchema.parse(req.body);
    const { items, overallFeedback, strengths, improvements, additionalComments } = validatedData;

    const review = await db.query.performanceReviews.findFirst({
      where: eq(performanceReviews.id, Number(id))
    });

    if (!review) {
      res.status(404).json({ success: false, message: 'Review not found' });
      return;
    }

    const isReviewer = ['Administrator', 'Human Resource'].includes(authReq.user.role) || review.reviewerId == authReq.user.id;
    const isEmployee = review.employeeId == authReq.user.id;

    if (!isReviewer && !isEmployee) {
      res.status(403).json({ success: false, message: 'Unauthorized: You cannot edit this review.' });
      return;
    }

    if (isEmployee && !isReviewer && !['Draft', 'Self-Rated'].includes(review.status || '')) {
      res.status(403).json({ success: false, message: 'Cannot edit review in current status.' });
      return;
    }

    let feedbackJson: string | null = overallFeedback || null;
    if (overallFeedback === undefined || overallFeedback === null) {
      if (strengths || improvements || additionalComments) {
        let existingFeedback: Record<string, string> = {};
        try {
          existingFeedback = JSON.parse(review.overallFeedback || '{}') as Record<string, string>;
        } catch { /* ignore */ }
        if (strengths) existingFeedback.strengths = strengths;
        if (improvements) existingFeedback.improvements = improvements;
        if (additionalComments) existingFeedback.additionalComments = additionalComments;
        feedbackJson = JSON.stringify(existingFeedback);
      } else {
        feedbackJson = review.overallFeedback || null;
      }
    }

    if (items && Array.isArray(items)) {
      const incomingIds = (items as ReviewItemInput[])
        .filter(i => i.id && (typeof i.id === 'number' || !String(i.id).startsWith('temp')))
        .map(i => Number(i.id));

      // Fetch existing item IDs to detect deletions
      const existingItems = await db.select({ id: performanceReviewItems.id })
        .from(performanceReviewItems)
        .where(eq(performanceReviewItems.reviewId, Number(id)));
      
      const existingIds = existingItems.map(i => i.id);
      const idsToDelete = existingIds.filter(eid => !incomingIds.includes(eid));

      if (idsToDelete.length > 0) {
        await db.delete(performanceReviewItems)
          .where(inArray(performanceReviewItems.id, idsToDelete));
      }

      for (const item of items as ReviewItemInput[]) {
        const score = parseFloat(String(item.score)) || 0;
        const weight = parseFloat(String(item.weight)) || 1;
        const maxScore = parseFloat(String(item.maxScore)) || 5;
        const isExistingItem = item.id && (typeof item.id === 'number' || !String(item.id).startsWith('temp'));

        if (isExistingItem) {
          await db.update(performanceReviewItems)
            .set({
              score: String(score),
              qScore: item.qScore ? String(item.qScore) : null,
              eScore: item.eScore ? String(item.eScore) : null,
              tScore: item.tScore ? String(item.tScore) : null,
              comment: item.comment || '',
              criteriaTitle: item.criteriaTitle,
              criteriaDescription: item.criteriaDescription,
              weight: String(weight),
              maxScore,
              selfScore: item.selfScore ? String(item.selfScore) : '0',

              actualAccomplishments: item.actualAccomplishments || '',
              evidenceFilePath: item.evidenceFilePath || null,
              evidenceDescription: item.evidenceDescription || null
            })
            .where(and(
              eq(performanceReviewItems.id, Number(item.id)),
              eq(performanceReviewItems.reviewId, Number(id))
            ));
        } else {
          await db.insert(performanceReviewItems).values({
            reviewId: Number(id),
            criteriaId: item.criteriaId || null,
            score: String(score),
            qScore: item.qScore ? String(item.qScore) : null,
            eScore: item.eScore ? String(item.eScore) : null,
            tScore: item.tScore ? String(item.tScore) : null,
            comment: item.comment || '',
            criteriaTitle: item.criteriaTitle,
            criteriaDescription: item.criteriaDescription,
            weight: String(weight),
            maxScore,
            selfScore: item.selfScore ? String(item.selfScore) : '0',

            actualAccomplishments: item.actualAccomplishments || '',
            evidenceFilePath: item.evidenceFilePath || null,
            evidenceDescription: item.evidenceDescription || null
          });
        }
      }
    }

    const totalScore = await calculateReviewScore(parseInt(id));
    await db.update(performanceReviews)
      .set({ 
        overallFeedback: feedbackJson, 
        totalScore, 
        updatedAt: formatDateForMySQL(new Date()) 
      })
      .where(eq(performanceReviews.id, Number(id)));

    await logAudit(parseInt(id), 'updated', authReq.user.id, { itemsUpdated: items?.length || 0 });
    res.json({ success: true, message: 'Review updated successfully', totalScore: totalScore });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, message: 'Validation failed', errors: error.flatten() });
      return;
    }

    const msg = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ success: false, message: 'Failed to update review: ' + msg });
  }
};

export const submitReview = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params as { id: string };
  try {
    const totalScore = await calculateReviewScore(parseInt(id));
    await db.update(performanceReviews)
      .set({ 
        status: 'Submitted', 
        totalScore, 
        reviewerRatingScore: totalScore 
      })
      .where(eq(performanceReviews.id, Number(id)));
    
    res.json({ success: true, message: 'Review submitted', totalScore: totalScore });
  } catch (_error) {
    res.status(500).json({ success: false, message: 'Failed to submit review' });
  }
};

export const deleteReview = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params as { id: string };
  const authReq = req as AuthenticatedRequest;
  try {
    const review = await db.query.performanceReviews.findFirst({
      where: eq(performanceReviews.id, Number(id))
    });

    if (!review) {
      res.status(404).json({ success: false, message: 'Review not found' });
      return;
    }

    if (review.status !== 'Draft') {
      res.status(400).json({ success: false, message: 'Only draft reviews can be deleted' });
      return;
    }

    if (!['admin', 'human resource'].includes(authReq.user.role.toLowerCase()) && review.reviewerId != authReq.user.id) {
      res.status(403).json({ success: false, message: 'Unauthorized to delete this review' });
      return;
    }

    await db.delete(performanceReviewItems).where(eq(performanceReviewItems.reviewId, Number(id)));
    await db.delete(performanceReviews).where(eq(performanceReviews.id, Number(id)));

    res.json({ success: true, message: 'Draft review deleted successfully' });
  } catch (_error) {
    res.status(500).json({ success: false, message: 'Failed to delete review' });
  }
};

// ... (Criteria and Cycle CRUDs are simple, migrating similarly)

export const getCriteria = async (req: Request, res: Response): Promise<void> => {
  try {
    const { criteriaType, isActive } = req.query;
    const conditions = [];
    
    if (criteriaType) conditions.push(eq(performanceCriteria.criteriaType, criteriaType as PerformanceCriteriaType));
    if (isActive !== undefined) conditions.push(eq(performanceCriteria.isActive, isActive === 'true' ? true : false));

    const criteria = await db.select()
      .from(performanceCriteria)
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(performanceCriteria.category, performanceCriteria.createdAt);

    res.json({ success: true, criteria });
  } catch (_error) {
    res.status(500).json({ success: false, message: 'Failed to fetch criteria' });
  }
};

export const addCriteria = async (req: Request, res: Response): Promise<void> => {
  const { title, description, weight, maxScore, category } = req.body as { title: string; description: string; weight?: number; maxScore?: number; category?: string };
  try {
    await db.insert(performanceCriteria).values({
      title,
      description,
      weight: weight || 1,
      maxScore: maxScore || 5,
      category: category || 'General'
    });
    res.status(201).json({ success: true, message: 'Criteria added' });
  } catch (_error) {
    res.status(500).json({ success: false, message: 'Failed to add criteria' });
  }
};

export const updateCriteria = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params as { id: string };
  const { title, description, weight, maxScore, category } = req.body as { title?: string; description?: string; weight?: number; maxScore?: number; category?: string };
  try {
    await db.update(performanceCriteria)
      .set({ title, description, weight, maxScore, category })
      .where(eq(performanceCriteria.id, Number(id)));
    res.json({ success: true, message: 'Criteria updated' });
  } catch (_error) {
    res.status(500).json({ success: false, message: 'Failed to update criteria' });
  }
};

export const deleteCriteria = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params as { id: string };
  try {
    await db.delete(performanceCriteria).where(eq(performanceCriteria.id, Number(id)));
    res.json({ success: true, message: 'Criteria deleted' });
  } catch (_error) {
    res.status(500).json({ success: false, message: 'Failed to delete criteria' });
  }
};

export const createReviewCycle = async (req: Request, res: Response): Promise<void> => {
  try {
    const validatedData = createReviewCycleSchema.parse(req.body);
    const { title, description, startDate: start, endDate: end } = validatedData;

    const startDateObj = new Date(start);
    const endDateObj = new Date(end);
    if (endDateObj <= startDateObj) {
      res.status(400).json({ success: false, message: 'End date must be after start date' });
      return;
    }
    
    await db.insert(performanceReviewCycles).values({
      title,
      description,
      startDate: start,
      endDate: end
    });
    res.status(201).json({ success: true, message: 'Review cycle created' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, message: 'Validation failed', errors: error.flatten() });
      return;
    }
    res.status(500).json({ success: false, message: 'Failed to create review cycle' });
  }
};

export const updateReviewCycle = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params as { id: string };
  const { title, description, startDate, endDate } = req.body as { title?: string; description?: string; startDate?: string; endDate?: string };
  const start = startDate;
  const end = endDate;

  try {
    await db.update(performanceReviewCycles)
      .set({ title, description, startDate: start, endDate: end })
      .where(eq(performanceReviewCycles.id, Number(id)));
    res.json({ success: true, message: 'Review cycle updated' });
  } catch (_error) {
    res.status(500).json({ success: false, message: 'Failed to update review cycle' });
  }
};

export const deleteReviewCycle = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params as { id: string };
  try {
    await db.delete(performanceReviewCycles).where(eq(performanceReviewCycles.id, Number(id)));
    res.json({ success: true, message: 'Review cycle deleted' });
  } catch (_error) {
    res.status(500).json({ success: false, message: 'Failed to delete review cycle' });
  }
};

export const submitSelfRating = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params as { id: string };
  const authReq = req as AuthenticatedRequest;
  try {
    const validatedData = submitSelfRatingSchema.parse(req.body);
    const { items, employeeRemarks, isDraft } = validatedData;
    const review = await db.query.performanceReviews.findFirst({
      where: eq(performanceReviews.id, Number(id))
    });

    if (!review) {
      res.status(404).json({ success: false, message: 'Review not found' });
      return;
    }

    if (review.employeeId != authReq.user.id) {
      res.status(403).json({ success: false, message: 'Unauthorized: You are not the assigned employee for this review.' });
      return;
    }

    let totalSelfScore = 0;
    let totalWeight = 0;

    if (items && Array.isArray(items)) {
      for (const item of items as ReviewItemInput[]) {
        if (item.id) {
          await db.update(performanceReviewItems)
            .set({ 
              selfScore: String(item.selfScore || 0), 
              actualAccomplishments: item.actualAccomplishments || '' 
            })
            .where(and(
              eq(performanceReviewItems.id, Number(item.id)),
              eq(performanceReviewItems.reviewId, Number(id))
            ));
        } else if (item.criteriaId) {
          await db.update(performanceReviewItems)
            .set({ 
              selfScore: String(item.selfScore || 0), 
              actualAccomplishments: item.actualAccomplishments || '' 
            })
            .where(and(
              eq(performanceReviewItems.reviewId, Number(id)),
              eq(performanceReviewItems.criteriaId, Number(item.criteriaId))
            ));
        }
        const weight = parseFloat(String(item.weight || 1));
        const score = parseFloat(String(item.selfScore || 0));
        totalSelfScore += score * weight;
        totalWeight += weight;
      }
    }

    const calculatedSelfScore = totalWeight > 0 ? (totalSelfScore / totalWeight).toFixed(2) : '0';
    const newStatus: ReviewStatus = isDraft ? 'Draft' : 'Self-Rated';

    await db.update(performanceReviews)
      .set({ 
        selfRatingScore: calculatedSelfScore, 
        employeeRemarks: (employeeRemarks as string) || '', 
        status: newStatus, 
        updatedAt: new Date().toISOString() 
      })
      .where(eq(performanceReviews.id, Number(id)));

    await logAudit(parseInt(id), isDraft ? 'self_rating_draft' : 'self_rated', authReq.user.id, { selfRatingScore: calculatedSelfScore });
    res.json({ success: true, message: isDraft ? 'Draft saved successfully' : 'Self-rating submitted successfully', selfRatingScore: calculatedSelfScore });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, message: 'Validation failed', errors: error.flatten() });
      return;
    }

    res.status(500).json({ success: false, message: 'Failed to submit self rating' });
  }
};

export const submitReviewerRating = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params as { id: string };
  const authReq = req as AuthenticatedRequest;
  try {
    const validatedData = submitReviewerRatingSchema.parse(req.body);
    const { items, reviewerRemarks, overallFeedback } = validatedData;
    if (!['Administrator', 'Human Resource'].includes(authReq.user.role)) {
      res.status(403).json({ success: false, message: 'Only authorized reviewers can submit ratings' });
      return;
    }

    const review = await db.query.performanceReviews.findFirst({
      where: eq(performanceReviews.id, Number(id))
    });

    if (!review) {
      res.status(404).json({ success: false, message: 'Review not found' });
      return;
    }

    if (review.reviewerId != authReq.user.id && !['Administrator', 'Human Resource'].includes(authReq.user.role)) {
      res.status(403).json({ success: false, message: 'Unauthorized: You are not the assigned reviewer for this employee.' });
      return;
    }

    if (items && Array.isArray(items)) {
      for (const item of items as ReviewItemInput[]) {
        const updateValues: Partial<typeof performanceReviewItems.$inferInsert> = {
          score: String(item.score || 0),
          qScore: item.qScore ? String(item.qScore) : null,
          eScore: item.eScore ? String(item.eScore) : null,
          tScore: item.tScore ? String(item.tScore) : null,
          comment: (item.comment as string) || ''
        };

        if (item.id) {
          await db.update(performanceReviewItems)
            .set(updateValues)
            .where(and(
              eq(performanceReviewItems.id, Number(item.id)),
              eq(performanceReviewItems.reviewId, Number(id))
            ));
        } else if (item.criteriaId) {
          await db.update(performanceReviewItems)
            .set(updateValues)
            .where(and(
              eq(performanceReviewItems.reviewId, Number(id)),
              eq(performanceReviewItems.criteriaId, Number(item.criteriaId))
            ));
        }
      }
    }

    const reviewerRatingScore = await calculateReviewScore(parseInt(id));
    await db.update(performanceReviews)
      .set({ 
        reviewerRatingScore, 
        reviewerRemarks: (reviewerRemarks as string) || '', 
        overallFeedback: (overallFeedback as string) || '', 
        totalScore: reviewerRatingScore, 
        status: 'Submitted' 
      })
      .where(eq(performanceReviews.id, Number(id)));

    await logAudit(parseInt(id), 'reviewer_rated', authReq.user.id, { reviewerRatingScore });
    res.json({ success: true, message: 'Reviewer rating submitted successfully', reviewerRatingScore });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, message: 'Validation failed', errors: error.flatten() });
      return;
    }

    res.status(500).json({ success: false, message: 'Failed to submit reviewer rating' });
  }
};

export const approveReview = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params as { id: string };
  const authReq = req as AuthenticatedRequest;
  const { headRemarks, finalRatingScore } = req.body as { headRemarks?: string; finalRatingScore?: string };

  try {
    if (!['Administrator', 'Human Resource'].includes(authReq.user.role)) {
      res.status(403).json({ success: false, message: 'Only Head of Office can approve reviews' });
      return;
    }

    const review = await db.query.performanceReviews.findFirst({
      where: eq(performanceReviews.id, Number(id))
    });

    if (!review) {
      res.status(404).json({ success: false, message: 'Review not found' });
      return;
    }

    if (!['Submitted', 'Acknowledged'].includes(review.status || '')) {
      res.status(400).json({ success: false, message: 'Review must be submitted or acknowledged before approval' });
      return;
    }

    const finalScore = (finalRatingScore as string) || review.reviewerRatingScore || review.totalScore;
    
    await db.update(performanceReviews)
      .set({ 
        status: 'Approved', 
        finalRatingScore: finalScore, 
        headRemarks: (headRemarks as string) || '', 
        approvedBy: authReq.user.id, 
        approvedAt: new Date().toISOString() 
      })
      .where(eq(performanceReviews.id, Number(id)));

    await logAudit(parseInt(id), 'approved', authReq.user.id, { finalRatingScore: finalScore });
    res.json({ success: true, message: 'Review approved successfully' });
  } catch (_error) {

    res.status(500).json({ success: false, message: 'Failed to approve review' });
  }
};


export const finalizeReview = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params as { id: string };
  const authReq = req as AuthenticatedRequest;

  try {
    if (!['Administrator', 'Human Resource'].includes(authReq.user.role)) {
      res.status(403).json({ success: false, message: 'Only Admin/HR can finalize reviews' });
      return;
    }

    const review = await db.query.performanceReviews.findFirst({
      where: eq(performanceReviews.id, Number(id))
    });

    if (!review) {
      res.status(404).json({ success: false, message: 'Review not found' });
      return;
    }

    if (review.status !== 'Approved') {
      res.status(400).json({ success: false, message: 'Review must be approved before finalizing' });
      return;
    }

    await db.update(performanceReviews)
      .set({ status: 'Finalized' })
      .where(eq(performanceReviews.id, Number(id)));

    await logAudit(parseInt(id), 'finalized', authReq.user.id, {});
    res.json({ success: true, message: 'Review finalized' });
  } catch (_error) {
    res.status(500).json({ success: false, message: 'Failed to finalize review' });
  }
};

export const addItemToReview = async (req: Request, res: Response): Promise<void> => {
  const { reviewId, criteriaId, criteriaTitle, criteriaDescription, weight, maxScore, category } = req.body as { reviewId: number; criteriaId?: number; criteriaTitle: string; criteriaDescription: string; weight?: number; maxScore?: number; category?: string };
  try {
    const [result] = await db.insert(performanceReviewItems).values({
      reviewId: reviewId,
      criteriaId: criteriaId || null,
      score: '0',
      comment: '',
      criteriaTitle: criteriaTitle,
      criteriaDescription: criteriaDescription,
      weight: weight || 1,
      maxScore: maxScore || 5,
      category: category || 'General',
      selfScore: '0',
      actualAccomplishments: ''
    });

    const totalScore = await calculateReviewScore(reviewId);
    await db.update(performanceReviews)
      .set({ totalScore })
      .where(eq(performanceReviews.id, reviewId));

    res.status(201).json({ success: true, message: 'Item added', itemId: result.insertId, totalScore });
  } catch (_error) {
    res.status(500).json({ success: false, message: 'Failed to add item' });
  }
};

export const updateReviewItem = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params as { id: string };
  const { score, comment, selfScore, actualAccomplishments, qScore, eScore, tScore, criteriaTitle, criteriaDescription, category, weight, maxScore } = req.body as { score?: number; comment?: string; selfScore?: number; actualAccomplishments?: string; qScore?: number; eScore?: number; tScore?: number; criteriaTitle?: string; criteriaDescription?: string; category?: string; weight?: number; maxScore?: number };
  try {
    const item = await db.query.performanceReviewItems.findFirst({
      where: eq(performanceReviewItems.id, Number(id)),
      columns: { reviewId: true }
    });

    if (!item) {
      res.status(404).json({ success: false, message: 'Item not found' });
      return;
    }

    const reviewId = item.reviewId;

    const updates: Partial<typeof performanceReviewItems.$inferInsert> = {};
    if (score !== undefined) updates.score = String(score);
    if (comment !== undefined) updates.comment = comment as string;
    if (selfScore !== undefined) updates.selfScore = String(selfScore);
    if (actualAccomplishments !== undefined) updates.actualAccomplishments = actualAccomplishments as string;
    if (qScore !== undefined) updates.qScore = String(qScore);
    if (eScore !== undefined) updates.eScore = String(eScore);
    if (tScore !== undefined) updates.tScore = String(tScore);
    if (criteriaTitle !== undefined) updates.criteriaTitle = criteriaTitle as string;
    if (criteriaDescription !== undefined) updates.criteriaDescription = criteriaDescription as string;
    if (category !== undefined) updates.category = category as string;
    if (weight !== undefined) updates.weight = String(weight);
    if (maxScore !== undefined) updates.maxScore = Number(maxScore);


    if (Object.keys(updates).length > 0) {
      await db.update(performanceReviewItems)
        .set(updates)
        .where(eq(performanceReviewItems.id, Number(id)));
    }

    const totalScore = await calculateReviewScore(reviewId);
    await db.update(performanceReviews)
      .set({ totalScore })
      .where(eq(performanceReviews.id, reviewId));

    res.json({ success: true, message: 'Item updated', totalScore });
  } catch (_error) {
    res.status(500).json({ success: false, message: 'Failed to update item' });
  }
};

export const deleteReviewItem = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params as { id: string };
  try {
    const item = await db.query.performanceReviewItems.findFirst({
      where: eq(performanceReviewItems.id, Number(id)),
      columns: { reviewId: true }
    });

    if (!item) {
      res.status(404).json({ success: false, message: 'Item not found' });
      return;
    }

    const reviewId = item.reviewId;
    await db.delete(performanceReviewItems).where(eq(performanceReviewItems.id, Number(id)));

    const totalScore = await calculateReviewScore(reviewId);
    await db.update(performanceReviews)
      .set({ totalScore })
      .where(eq(performanceReviews.id, reviewId));

    res.json({ success: true, message: 'Item deleted', totalScore });
  } catch (_error) {
    res.status(500).json({ success: false, message: 'Failed to delete item' });
  }
};
