import { Request, Response } from 'express';
import { db } from '../db/index.js';
import { 
  performanceReviews, 
  performanceReviewCycles, 
  authentication, 
  performanceReviewItems, 
  performanceCriteria, 
  performanceAuditLog,
  policyViolations
} from '../db/schema.js';
import { eq, and, sql, desc, or, max, count, inArray, isNull, like } from 'drizzle-orm';
import { alias } from 'drizzle-orm/mysql-core';
import type { AuthenticatedRequest, ReviewStatus, PerformanceCriteriaType } from '../types/index.js';
import { calculateAttendanceScore } from '../services/attendanceRatingService.js';
import { formatToManilaDateTime } from '../utils/dateUtils.js';

const formatDateForMySQL = (date: Date | string) => {
  return formatToManilaDateTime(date);
};

interface ReviewItemInput {
  id?: number | string;
  criteria_id?: number;
  score?: number;
  weight?: number;
  max_score?: number;
  q_score?: number;
  e_score?: number;
  t_score?: number;
  comment?: string;
  criteria_title?: string;
  criteria_description?: string;
  category?: string;
  self_score?: number;
  actual_accomplishments?: string;
  evidence_file_path?: string;
  evidence_description?: string;
}

const getStats = async () => {
  const [totalEmployees] = await db.select({ count: count() })
    .from(authentication)
    .where(sql`${authentication.role} != 'admin'`);

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
    total_employees: totalEmployees?.count || 0,
    pending_evaluations: pendingReviews?.count || 0,
    completed_evaluations: completedReviews?.count || 0,
    overdue_evaluations: overdueReviews?.count || 0
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
  } catch (error) {
    console.error('Audit Log Error:', error);
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

  return totalWeight > 0 ? (totalWeightedScore / totalWeight).toFixed(2) : '0';
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
      first_name: authentication.firstName,
      last_name: authentication.lastName,
      department: authentication.department,
      job_title: authentication.jobTitle,
      position_title: authentication.positionTitle,
      avatar_url: authentication.avatarUrl,
      employee_id: authentication.employeeId,
      review_id: performanceReviews.id,
      status: performanceReviews.status,
      last_evaluation_date: performanceReviews.updatedAt,
      total_score: performanceReviews.totalScore,
      supervisor_rating_score: performanceReviews.supervisorRatingScore,
      self_rating_score: performanceReviews.selfRatingScore,
      calculated_score: calculatedScoreSubquery,
      duties: sql<string>`COALESCE((SELECT schedule_title FROM schedules WHERE employee_id = ${authentication.employeeId} ORDER BY updated_at DESC LIMIT 1), 'No Schedule')`
    })
    .from(authentication)
    .leftJoin(performanceReviews, and(
      eq(authentication.id, performanceReviews.employeeId),
      eq(performanceReviews.id, maxReviewIdSubquery)
    ))
    .where(sql`${authentication.role} != 'admin'`)
    .orderBy(authentication.lastName);

    const formattedEmployees = employees.map(emp => {
      const storedScore = emp.total_score || emp.supervisor_rating_score || emp.self_rating_score;
      return {
        id: emp.id,
        name: `${emp.first_name} ${emp.last_name}`,
        first_name: emp.first_name,
        last_name: emp.last_name,
        department: emp.department,
        job_title: emp.job_title,
        position_title: emp.position_title,
        avatar_url: emp.avatar_url,
        employee_id: emp.employee_id,
        review_id: emp.review_id,
        status: emp.status || 'Not Started',
        last_evaluation_date: emp.last_evaluation_date,
        duties: emp.duties || 'No Schedule',
        score: (storedScore && parseFloat(String(storedScore)) > 0) ? storedScore : (emp.calculated_score || null)
      };
    });

    res.json({ success: true, stats, employees: formattedEmployees });
  } catch (error) {
    console.error('Get Evaluation Summary Error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch summary' });
  }
};

export const getRatingDistribution = async (_req: Request, res: Response): Promise<void> => {
  try {
    // statuses to include
    const statuses = ['Approved', 'Finalized', 'Acknowledged', 'Submitted'];
    
    // Fetch all relevant reviews
    const allReviews = await db.select({
      id: performanceReviews.id,
      employeeId: performanceReviews.employeeId,
      finalRatingScore: performanceReviews.finalRatingScore,
      totalScore: performanceReviews.totalScore,
      supervisorRatingScore: performanceReviews.supervisorRatingScore,
      status: performanceReviews.status
    })
    .from(performanceReviews)
    .where(inArray(performanceReviews.status, statuses as any));

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
      // Coalesce score logic: Final -> Total -> Supervisor
      const scoreStr = review.finalRatingScore || review.totalScore || review.supervisorRatingScore;
      
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
  } catch (error) {
    console.error('Get Rating Distribution Error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch rating distribution' });
  }
};

export const getReviewCycles = async (_req: Request, res: Response): Promise<void> => {
  try {
    const cycles = await db.select()
      .from(performanceReviewCycles)
      .orderBy(desc(performanceReviewCycles.startDate));
    res.json({ success: true, cycles });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch cycles' });
  }
};

export const getReviews = async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    let { employee_id, cycle_id, status, department } = req.query;

    if (authReq.user.role !== 'admin' && authReq.user.role !== 'hr') {
      employee_id = String(authReq.user.id);
    }

    const conditions = [];
    if (employee_id) conditions.push(eq(performanceReviews.employeeId, Number(employee_id)));
    if (cycle_id) conditions.push(eq(performanceReviews.reviewCycleId, Number(cycle_id)));
    if (status) conditions.push(eq(performanceReviews.status, status as ReviewStatus));
    if (department && department !== 'All') conditions.push(eq(authentication.department, department as string));

    const reviewer = alias(authentication, 'reviewer');

    const reviews = await db.select({
      id: performanceReviews.id,
      employeeId: performanceReviews.employeeId,
      reviewerId: performanceReviews.reviewerId,
      reviewCycleId: performanceReviews.reviewCycleId,
      status: performanceReviews.status,
      totalScore: sql`COALESCE(${performanceReviews.totalScore}, ${performanceReviews.supervisorRatingScore}, ${performanceReviews.selfRatingScore})`,
      reviewPeriodStart: performanceReviews.reviewPeriodStart,
      reviewPeriodEnd: performanceReviews.reviewPeriodEnd,
      createdAt: performanceReviews.createdAt,
      updatedAt: performanceReviews.updatedAt,
      // Joins
      reviewer_first_name: reviewer.firstName,
      reviewer_last_name: reviewer.lastName,
      emp_first_name: authentication.firstName,
      emp_last_name: authentication.lastName,
      department: authentication.department,
      cycle_title: performanceReviewCycles.title
    })
    .from(performanceReviews)
    .leftJoin(authentication, eq(performanceReviews.employeeId, authentication.id))
    .leftJoin(reviewer, eq(performanceReviews.reviewerId, reviewer.id))
    .leftJoin(performanceReviewCycles, eq(performanceReviews.reviewCycleId, performanceReviewCycles.id))
    .where(and(...conditions))
    .orderBy(desc(performanceReviews.createdAt));
    
    res.json({ success: true, reviews });
  } catch (error) {
    console.error('Get Reviews Error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch reviews' });
  }
};

export const getReview = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const authReq = req as AuthenticatedRequest;

  try {
    const review = await db.query.performanceReviews.findFirst({
      where: eq(performanceReviews.id, Number(id)),
      with: {
        authentication_employeeId: true,
        authentication_reviewerId: true
      }
    });

    if (!review) {
      res.status(404).json({ success: false, message: 'Review not found' });
      return;
    }

    if (authReq.user.role !== 'admin' && authReq.user.role !== 'hr') {
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
      sql`COALESCE(${performanceReviewItems.category}, ${performanceCriteria.category})`,
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
        employee_first_name: review.authentication_employeeId.firstName,
        employee_last_name: review.authentication_employeeId.lastName,
        employee_department: review.authentication_employeeId.department,
        employee_job_title: review.authentication_employeeId.jobTitle,
        reviewer_first_name: review.authentication_reviewerId.firstName,
        reviewer_last_name: review.authentication_reviewerId.lastName,
        employee_position_title: review.authentication_employeeId.positionTitle,
        attendance_details: attendanceDetails,
        violation_count: violations[0].count,
        items
    };

    res.json({ success: true, review: flatReview });
  } catch (error) {
    console.error('Get Review Error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch review' });
  }
};

export const acknowledgeReview = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
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
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to acknowledge review' });
  }
};

export const disagreeWithReview = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const authReq = req as AuthenticatedRequest;
  const { disagree_remarks } = req.body;

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
        disagreed: 1,
        disagreeRemarks: disagree_remarks || null,
        employeeRemarks: disagree_remarks || null
      })
      .where(eq(performanceReviews.id, Number(id)));

    await logAudit(Number(id), 'disagreed', authReq.user.id, { disagree_remarks });
    res.json({ success: true, message: 'Review disagreement recorded successfully' });
  } catch (error) {
    console.error('Disagree With Review Error:', error);
    res.status(500).json({ success: false, message: 'Failed to record disagreement' });
  }
};

export const createReview = async (req: Request, res: Response): Promise<void> => {
  const authReq = req as AuthenticatedRequest;
  const { employee_id, reviewer_id, cycle_id, review_cycle_id, start_date, end_date, review_period_start, review_period_end } = req.body;
  const cycleId = cycle_id || review_cycle_id || null;
  let periodStart = start_date || review_period_start || null;
  let periodEnd = end_date || review_period_end || null;

  if (!employee_id || !reviewer_id) {
    res.status(400).json({ success: false, message: 'Employee and Reviewer are required' });
    return;
  }

  try {
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
          eq(performanceReviews.employeeId, employee_id),
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
        eq(performanceReviews.employeeId, employee_id),
        eq(performanceReviews.status, 'Draft')
      ),
      orderBy: [desc(performanceReviews.createdAt)]
    });

    if (existingDraft) {
      res.status(200).json({ success: true, message: 'Draft review exists', reviewId: existingDraft.id, existing: true });
      return;
    }

    const [result] = await db.insert(performanceReviews).values({
      employeeId: employee_id,
      reviewerId: reviewer_id,
      reviewCycleId: cycleId,
      reviewPeriodStart: periodStart,
      reviewPeriodEnd: periodEnd,
      status: 'Draft',
      createdAt: formatDateForMySQL(new Date())
    });

    const reviewId = result.insertId;

    // Add criteria
    const criteria = await db.select().from(performanceCriteria).where(or(
      eq(performanceCriteria.isActive, 1),
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

    await logAudit(reviewId, 'created', authReq.user.id, { employee_id, reviewer_id, cycle_id: cycleId });
    res.status(201).json({ success: true, message: 'Review initialized', reviewId });
  } catch (error) {
    console.error('Create Review Error:', error);
    const msg = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ success: false, message: 'Failed to create review: ' + msg });
  }
};

export const updateReview = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const authReq = req as AuthenticatedRequest;
  const { items, overall_feedback, strengths, improvements, additional_comments } = req.body;

  try {
    const review = await db.query.performanceReviews.findFirst({
      where: eq(performanceReviews.id, Number(id))
    });

    if (!review) {
      res.status(404).json({ success: false, message: 'Review not found' });
      return;
    }

    const isReviewer = ['admin', 'hr'].includes(authReq.user.role.toLowerCase()) || review.reviewerId == authReq.user.id;
    const isEmployee = review.employeeId == authReq.user.id;

    if (!isReviewer && !isEmployee) {
      res.status(403).json({ success: false, message: 'Unauthorized: You cannot edit this review.' });
      return;
    }

    if (isEmployee && !isReviewer && !['Draft', 'Self-Rated'].includes(review.status || '')) {
      res.status(403).json({ success: false, message: 'Cannot edit review in current status.' });
      return;
    }

    let feedbackJson: string | null = overall_feedback;
    if (overall_feedback === undefined || overall_feedback === null) {
      if (strengths || improvements || additional_comments) {
        let existingFeedback: Record<string, string> = {};
        try {
          existingFeedback = JSON.parse(review.overallFeedback || '{}');
        } catch { /* ignore */ }
        if (strengths) existingFeedback.strengths = strengths;
        if (improvements) existingFeedback.improvements = improvements;
        if (additional_comments) existingFeedback.additional_comments = additional_comments;
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
        const maxScore = parseFloat(String(item.max_score)) || 5;
        const isExistingItem = item.id && (typeof item.id === 'number' || !String(item.id).startsWith('temp'));

        if (isExistingItem) {
          await db.update(performanceReviewItems)
            .set({
              score: String(score),
              qScore: item.q_score ? String(item.q_score) : null,
              eScore: item.e_score ? String(item.e_score) : null,
              tScore: item.t_score ? String(item.t_score) : null,
              comment: item.comment || '',
              criteriaTitle: item.criteria_title,
              criteriaDescription: item.criteria_description,
              weight: String(weight),
              maxScore,
              selfScore: item.self_score ? String(item.self_score) : '0',

              actualAccomplishments: item.actual_accomplishments || '',
              evidenceFilePath: item.evidence_file_path || null,
              evidenceDescription: item.evidence_description || null
            })
            .where(and(
              eq(performanceReviewItems.id, Number(item.id)),
              eq(performanceReviewItems.reviewId, Number(id))
            ));
        } else {
          await db.insert(performanceReviewItems).values({
            reviewId: Number(id),
            criteriaId: item.criteria_id || null,
            score: String(score),
            qScore: item.q_score ? String(item.q_score) : null,
            eScore: item.e_score ? String(item.e_score) : null,
            tScore: item.t_score ? String(item.t_score) : null,
            comment: item.comment || '',
            criteriaTitle: item.criteria_title,
            criteriaDescription: item.criteria_description,
            weight: String(weight),
            maxScore,
            selfScore: item.self_score ? String(item.self_score) : '0',

            actualAccomplishments: item.actual_accomplishments || '',
            evidenceFilePath: item.evidence_file_path || null,
            evidenceDescription: item.evidence_description || null
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

    await logAudit(parseInt(id), 'updated', authReq.user.id, { items_updated: items?.length || 0 });
    res.json({ success: true, message: 'Review updated successfully', total_score: totalScore });
  } catch (error) {
    console.error('Update Review Error:', error);
    const msg = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ success: false, message: 'Failed to update review: ' + msg });
  }
};

export const submitReview = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  try {
    const totalScore = await calculateReviewScore(parseInt(id));
    await db.update(performanceReviews)
      .set({ 
        status: 'Submitted', 
        totalScore, 
        supervisorRatingScore: totalScore 
      })
      .where(eq(performanceReviews.id, Number(id)));
    
    res.json({ success: true, message: 'Review submitted', total_score: totalScore });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to submit review' });
  }
};

export const deleteReview = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
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

    if (!['admin', 'hr'].includes(authReq.user.role.toLowerCase()) && review.reviewerId != authReq.user.id) {
      res.status(403).json({ success: false, message: 'Unauthorized to delete this review' });
      return;
    }

    await db.delete(performanceReviewItems).where(eq(performanceReviewItems.reviewId, Number(id)));
    await db.delete(performanceReviews).where(eq(performanceReviews.id, Number(id)));

    res.json({ success: true, message: 'Draft review deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete review' });
  }
};

// ... (Criteria and Cycle CRUDs are simple, migrating similarly)

export const getCriteria = async (req: Request, res: Response): Promise<void> => {
  try {
    const { criteria_type, is_active } = req.query;
    const conditions = [];
    
    if (criteria_type) conditions.push(eq(performanceCriteria.criteriaType, criteria_type as PerformanceCriteriaType));
    if (is_active !== undefined) conditions.push(eq(performanceCriteria.isActive, is_active === 'true' ? 1 : 0));

    const criteria = await db.select()
      .from(performanceCriteria)
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(performanceCriteria.category, performanceCriteria.createdAt);

    res.json({ success: true, criteria });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch criteria' });
  }
};

export const addCriteria = async (req: Request, res: Response): Promise<void> => {
  const { title, description, weight, max_score, category } = req.body;
  try {
    await db.insert(performanceCriteria).values({
      title,
      description,
      weight: weight || 1,
      maxScore: max_score || 5,
      category: category || 'General'
    });
    res.status(201).json({ success: true, message: 'Criteria added' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to add criteria' });
  }
};

export const updateCriteria = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { title, description, weight, max_score, category } = req.body;
  try {
    await db.update(performanceCriteria)
      .set({ title, description, weight, maxScore: max_score, category })
      .where(eq(performanceCriteria.id, Number(id)));
    res.json({ success: true, message: 'Criteria updated' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update criteria' });
  }
};

export const deleteCriteria = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  try {
    await db.delete(performanceCriteria).where(eq(performanceCriteria.id, Number(id)));
    res.json({ success: true, message: 'Criteria deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete criteria' });
  }
};

export const createReviewCycle = async (req: Request, res: Response): Promise<void> => {
  const { title, description, startDate, endDate, start_date, end_date } = req.body;
  const start = startDate || start_date;
  const end = endDate || end_date;

  if (!title || !start || !end) {
    res.status(400).json({ success: false, message: 'Title, start date, and end date are required' });
    return;
  }
  const startDateObj = new Date(start);
  const endDateObj = new Date(end);
  if (endDateObj <= startDateObj) {
    res.status(400).json({ success: false, message: 'End date must be after start date' });
    return;
  }
  try {
    await db.insert(performanceReviewCycles).values({
      title,
      description,
      startDate: start,
      endDate: end
    });
    res.status(201).json({ success: true, message: 'Review cycle created' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to create review cycle' });
  }
};

export const updateReviewCycle = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { title, description, startDate, endDate, start_date, end_date } = req.body;
  const start = startDate || start_date;
  const end = endDate || end_date;

  try {
    await db.update(performanceReviewCycles)
      .set({ title, description, startDate: start, endDate: end })
      .where(eq(performanceReviewCycles.id, Number(id)));
    res.json({ success: true, message: 'Review cycle updated' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update review cycle' });
  }
};

export const deleteReviewCycle = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  try {
    await db.delete(performanceReviewCycles).where(eq(performanceReviewCycles.id, Number(id)));
    res.json({ success: true, message: 'Review cycle deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete review cycle' });
  }
};

export const submitSelfRating = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const authReq = req as AuthenticatedRequest;
  const { items, employee_remarks, isDraft } = req.body;

  try {
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
              selfScore: String(item.self_score || 0), 
              actualAccomplishments: item.actual_accomplishments || '' 
            })
            .where(and(
              eq(performanceReviewItems.id, Number(item.id)),
              eq(performanceReviewItems.reviewId, Number(id))
            ));
        } else if (item.criteria_id) {
          await db.update(performanceReviewItems)
            .set({ 
              selfScore: String(item.self_score || 0), 
              actualAccomplishments: item.actual_accomplishments || '' 
            })
            .where(and(
              eq(performanceReviewItems.reviewId, Number(id)),
              eq(performanceReviewItems.criteriaId, Number(item.criteria_id))
            ));
        }
        const weight = parseFloat(String(item.weight)) || 1;
        const score = parseFloat(String(item.self_score)) || 0;
        totalSelfScore += score * weight;
        totalWeight += weight;
      }
    }

    const calculatedSelfScore = totalWeight > 0 ? (totalSelfScore / totalWeight).toFixed(2) : '0';
    const newStatus = isDraft ? 'Draft' : 'Self-Rated';

    await db.update(performanceReviews)
      .set({ 
        selfRatingScore: calculatedSelfScore, 
        employeeRemarks: employee_remarks || '', 
        status: newStatus as ReviewStatus, 
        updatedAt: new Date().toISOString() 
      })
      .where(eq(performanceReviews.id, Number(id)));

    await logAudit(parseInt(id), isDraft ? 'self_rating_draft' : 'self_rated', authReq.user.id, { self_rating_score: calculatedSelfScore });
    res.json({ success: true, message: isDraft ? 'Draft saved successfully' : 'Self-rating submitted successfully', self_rating_score: calculatedSelfScore });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to submit self rating' });
  }
};

export const submitSupervisorRating = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const authReq = req as AuthenticatedRequest;
  const { items, supervisor_remarks, overall_feedback } = req.body;

  try {
    if (!['admin', 'hr', 'supervisor'].includes(authReq.user.role.toLowerCase())) {
      res.status(403).json({ success: false, message: 'Only supervisors can submit ratings' });
      return;
    }

    const review = await db.query.performanceReviews.findFirst({
      where: eq(performanceReviews.id, Number(id))
    });

    if (!review) {
      res.status(404).json({ success: false, message: 'Review not found' });
      return;
    }

    if (review.reviewerId != authReq.user.id && !['admin', 'hr'].includes(authReq.user.role.toLowerCase())) {
      res.status(403).json({ success: false, message: 'Unauthorized: You are not the assigned reviewer for this employee.' });
      return;
    }

    if (items && Array.isArray(items)) {
      for (const item of items as ReviewItemInput[]) {
        const updateValues: any = {
          score: String(item.score || 0),
          qScore: item.q_score ? String(item.q_score) : null,
          eScore: item.e_score ? String(item.e_score) : null,
          tScore: item.t_score ? String(item.t_score) : null,
          comment: item.comment || ''
        };

        if (item.id) {
          await db.update(performanceReviewItems)
            .set(updateValues)
            .where(and(
              eq(performanceReviewItems.id, Number(item.id)),
              eq(performanceReviewItems.reviewId, Number(id))
            ));
        } else if (item.criteria_id) {
          await db.update(performanceReviewItems)
            .set(updateValues)
            .where(and(
              eq(performanceReviewItems.reviewId, Number(id)),
              eq(performanceReviewItems.criteriaId, Number(item.criteria_id))
            ));
        }
      }
    }

    const supervisorRatingScore = await calculateReviewScore(parseInt(id));
    await db.update(performanceReviews)
      .set({ 
        supervisorRatingScore, 
        supervisorRemarks: supervisor_remarks || '', 
        overallFeedback: overall_feedback || '', 
        totalScore: supervisorRatingScore, 
        status: 'Submitted' 
      })
      .where(eq(performanceReviews.id, Number(id)));

    await logAudit(parseInt(id), 'supervisor_rated', authReq.user.id, { supervisor_rating_score: supervisorRatingScore });
    res.json({ success: true, message: 'Supervisor rating submitted successfully', supervisor_rating_score: supervisorRatingScore });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to submit supervisor rating' });
  }
};

export const approveReview = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const authReq = req as AuthenticatedRequest;
  const { head_remarks, final_rating_score } = req.body;

  try {
    if (!['admin', 'hr'].includes(authReq.user.role.toLowerCase())) {
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

    const finalScore = final_rating_score || review.supervisorRatingScore || review.totalScore;
    
    await db.update(performanceReviews)
      .set({ 
        status: 'Approved', 
        finalRatingScore: finalScore, 
        headRemarks: head_remarks || '', 
        approvedBy: authReq.user.id, 
        approvedAt: new Date().toISOString() 
      })
      .where(eq(performanceReviews.id, Number(id)));

    await logAudit(parseInt(id), 'approved', authReq.user.id, { final_rating_score: finalScore });
    res.json({ success: true, message: 'Review approved successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to approve review' });
  }
};

export const finalizeReview = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const authReq = req as AuthenticatedRequest;

  try {
    if (!['admin', 'hr'].includes(authReq.user.role.toLowerCase())) {
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
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to finalize review' });
  }
};

export const addItemToReview = async (req: Request, res: Response): Promise<void> => {
  const { review_id, criteria_id, criteria_title, criteria_description, weight, max_score, category } = req.body;
  try {
    const [result] = await db.insert(performanceReviewItems).values({
      reviewId: review_id,
      criteriaId: criteria_id || null,
      score: '0',
      comment: '',
      criteriaTitle: criteria_title,
      criteriaDescription: criteria_description,
      weight: weight || 1,
      maxScore: max_score || 5,
      category: category || 'General',
      selfScore: '0',
      actualAccomplishments: ''
    });

    const totalScore = await calculateReviewScore(review_id);
    await db.update(performanceReviews)
      .set({ totalScore })
      .where(eq(performanceReviews.id, review_id));

    res.status(201).json({ success: true, message: 'Item added', itemId: result.insertId, total_score: totalScore });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to add item' });
  }
};

export const updateReviewItem = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { score, comment, self_score, actual_accomplishments, q_score, e_score, t_score, criteria_title, criteria_description, category, weight, max_score } = req.body;
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
    
    // Using simple undefined checks for selective update, or implementing logic to update only what's passed
    // For simplicity, we can use an object with defined properties
    const updates: any = {};
    if (score !== undefined) updates.score = score;
    if (comment !== undefined) updates.comment = comment;
    if (self_score !== undefined) updates.selfScore = self_score;
    if (actual_accomplishments !== undefined) updates.actualAccomplishments = actual_accomplishments;
    if (q_score !== undefined) updates.qScore = q_score;
    if (e_score !== undefined) updates.eScore = e_score;
    if (t_score !== undefined) updates.tScore = t_score;
    if (criteria_title !== undefined) updates.criteriaTitle = criteria_title;
    if (criteria_description !== undefined) updates.criteriaDescription = criteria_description;
    if (category !== undefined) updates.category = category;
    if (weight !== undefined) updates.weight = weight;
    if (max_score !== undefined) updates.maxScore = max_score;

    if (Object.keys(updates).length > 0) {
      await db.update(performanceReviewItems)
        .set(updates)
        .where(eq(performanceReviewItems.id, Number(id)));
    }

    const totalScore = await calculateReviewScore(reviewId);
    await db.update(performanceReviews)
      .set({ totalScore })
      .where(eq(performanceReviews.id, reviewId));

    res.json({ success: true, message: 'Item updated', total_score: totalScore });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update item' });
  }
};

export const deleteReviewItem = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
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

    res.json({ success: true, message: 'Item deleted', total_score: totalScore });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete item' });
  }
};