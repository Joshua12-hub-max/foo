import db from '../db/connection.js';

// Helper to get stats
const getStats = async () => {
  const [totalEmployees] = await db.query("SELECT COUNT(*) as count FROM authentication WHERE role != 'admin'");
  
  // Pending: Status is 'Draft' or 'Submitted' or 'Self-Rated'
  const [pendingReviews] = await db.query("SELECT COUNT(*) as count FROM performance_reviews WHERE status IN ('Draft', 'Submitted', 'Self-Rated')");
  const [completedReviews] = await db.query("SELECT COUNT(*) as count FROM performance_reviews WHERE status IN ('Acknowledged', 'Finalized', 'Approved')");
  
  // Overdue: Draft reviews where review period has ended
  const [overdueReviews] = await db.query("SELECT COUNT(*) as count FROM performance_reviews WHERE status = 'Draft' AND review_period_end < CURDATE()");

  return {
    total_employees: totalEmployees[0].count,
    pending_evaluations: pendingReviews[0].count,
    completed_evaluations: completedReviews[0].count,
    overdue_evaluations: overdueReviews[0].count
  };
};


export const getEvaluationSummary = async (req, res) => {
  try {
    const stats = await getStats();

    // Get list of employees with their latest review status and calculated score
    // Calculate score from items if stored score is 0/NULL
    const query = `
      SELECT 
        e.id, 
        e.first_name, 
        e.last_name, 
        e.department, 
        e.job_title, 
        e.avatar_url,
        pr.id as review_id,
        pr.status,
        pr.updated_at as last_evaluation_date,
        COALESCE(pr.total_score, pr.supervisor_rating_score, pr.self_rating_score) as stored_score,
        e.employee_id,
        (
          SELECT ROUND(SUM(pri.score * COALESCE(pc.weight, pri.weight, 1)) / NULLIF(SUM(COALESCE(pc.weight, pri.weight, 1)), 0), 2)
          FROM performance_review_items pri
          LEFT JOIN performance_criteria pc ON pri.criteria_id = pc.id
          WHERE pri.review_id = pr.id
        ) as calculated_score
      FROM authentication e
      LEFT JOIN performance_reviews pr ON e.id = pr.employee_id 
        AND pr.id = (SELECT MAX(id) FROM performance_reviews WHERE employee_id = e.id)
      WHERE e.role != 'admin'
      ORDER BY e.last_name ASC
    `;
    
    const [employees] = await db.query(query);

    // Format employees - use calculated_score if stored_score is 0 or NULL
    const formattedEmployees = employees.map(emp => ({
      id: emp.id,
      name: `${emp.first_name} ${emp.last_name}`,
      first_name: emp.first_name,
      last_name: emp.last_name,
      department: emp.department,
      job_title: emp.job_title,
      avatar_url: emp.avatar_url,
      employee_id: emp.employee_id,
      review_id: emp.review_id,
      status: emp.status || 'Not Started',
      last_evaluation_date: emp.last_evaluation_date,
      score: (emp.stored_score && parseFloat(emp.stored_score) > 0) 
        ? emp.stored_score 
        : (emp.calculated_score || null)
    }));

    res.json({
      success: true,
      stats,
      employees: formattedEmployees
    });

  } catch (error) {
    console.error("Get Evaluation Summary Error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch summary" });
  }
};


// Get rating distribution for pie chart (counts employees by rating category)
export const getRatingDistribution = async (req, res) => {
  try {
    // Query to count employees by rating category based on their latest finalized review
    const query = `
      SELECT 
        CASE
          WHEN COALESCE(pr.final_rating_score, pr.total_score, pr.supervisor_rating_score) >= 4.5 THEN 'outstanding'
          WHEN COALESCE(pr.final_rating_score, pr.total_score, pr.supervisor_rating_score) >= 3.5 THEN 'exceedsExpectations'
          WHEN COALESCE(pr.final_rating_score, pr.total_score, pr.supervisor_rating_score) >= 2.5 THEN 'meetsExpectations'
          WHEN COALESCE(pr.final_rating_score, pr.total_score, pr.supervisor_rating_score) >= 1.5 THEN 'needsImprovement'
          ELSE 'poorPerformance'
        END as rating_category,
        COUNT(DISTINCT pr.employee_id) as count
      FROM performance_reviews pr
      WHERE pr.status IN ('Approved', 'Finalized', 'Acknowledged', 'Submitted')
        AND pr.id = (
          SELECT MAX(pr2.id) 
          FROM performance_reviews pr2 
          WHERE pr2.employee_id = pr.employee_id 
            AND pr2.status IN ('Approved', 'Finalized', 'Acknowledged', 'Submitted')
        )
        AND COALESCE(pr.final_rating_score, pr.total_score, pr.supervisor_rating_score) IS NOT NULL
      GROUP BY rating_category
    `;

    const [results] = await db.query(query);

    // Initialize all categories with 0
    const distribution = {
      outstanding: 0,
      exceedsExpectations: 0,
      meetsExpectations: 0,
      needsImprovement: 0,
      poorPerformance: 0
    };

    // Populate with actual counts
    results.forEach(row => {
      if (distribution.hasOwnProperty(row.rating_category)) {
        distribution[row.rating_category] = row.count;
      }
    });

    // Calculate total
    const total = Object.values(distribution).reduce((sum, val) => sum + val, 0);

    res.json({
      success: true,
      distribution,
      total
    });

  } catch (error) {
    console.error("Get Rating Distribution Error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch rating distribution" });
  }
};

export const getReviewCycles = async (req, res) => {
  try {
    const [cycles] = await db.query("SELECT * FROM performance_review_cycles ORDER BY start_date DESC");
    res.json({ success: true, cycles });
  } catch (error) {
    console.error("Get Review Cycles Error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch cycles" });
  }
};

export const getReviews = async (req, res) => {
  try {
    let { employee_id, cycle_id, status, department } = req.query;
    const user = req.user; // Attached by verifyToken middleware

    // Security: Non-admins can only view their own reviews
    if (user.role !== 'admin' && user.role !== 'hr') {
        // If they try to query someone else, override or block. Overriding is safer/easier here.
        employee_id = user.id; 
    }

    let query = `
      SELECT pr.*, 
             COALESCE(pr.total_score, pr.supervisor_rating_score, pr.self_rating_score) as total_score,
             reviewer.first_name as reviewer_first_name, reviewer.last_name as reviewer_last_name,
             emp.first_name as emp_first_name, emp.last_name as emp_last_name,
             emp.department as department,
             prc.title as cycle_title
      FROM performance_reviews pr
      LEFT JOIN authentication emp ON pr.employee_id = emp.id
      LEFT JOIN authentication reviewer ON pr.reviewer_id = reviewer.id
      LEFT JOIN performance_review_cycles prc ON pr.review_cycle_id = prc.id
      WHERE 1=1
    `;
    const params = [];

    if (employee_id) {
      query += " AND pr.employee_id = ?";
      params.push(employee_id);
    }
    if (cycle_id) {
      query += " AND pr.review_cycle_id = ?";
      params.push(cycle_id);
    }
    if (status) {
      query += " AND pr.status = ?";
      params.push(status);
    }
    if (department && department !== 'All') {
      query += " AND emp.department = ?";
      params.push(department);
    }

    query += " ORDER BY pr.created_at DESC";

    const [reviews] = await db.query(query, params);
    
    res.json({ success: true, reviews });
  } catch (error) {
    console.error("Get Reviews Error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch reviews" });
  }
};

export const getReview = async (req, res) => {
  const { id } = req.params;
  const user = req.user;

  try {
    // Get review with employee and reviewer info
    const [reviews] = await db.query(`
      SELECT pr.*, 
             emp.first_name as employee_first_name, emp.last_name as employee_last_name,
             emp.department as employee_department, emp.job_title as employee_job_title,
             reviewer.first_name as reviewer_first_name, reviewer.last_name as reviewer_last_name
      FROM performance_reviews pr
      LEFT JOIN authentication emp ON pr.employee_id = emp.id
      LEFT JOIN authentication reviewer ON pr.reviewer_id = reviewer.id
      WHERE pr.id = ?
    `, [id]);
    
    if (reviews.length === 0) {
      return res.status(404).json({ success: false, message: "Review not found" });
    }
    const review = reviews[0];

    // Security Check (allow admin, hr, the employee, or the reviewer)
    if (user.role !== 'admin' && user.role !== 'hr') {
        if (review.employee_id != user.id && review.reviewer_id != user.id) {
            return res.status(403).json({ success: false, message: "Unauthorized access to this review" });
        }
    }

    // Get items with full criteria info (including weight and category)
    // Get items (Standard CSC Mode)
    const [cscItems] = await db.query(`
      SELECT pri.*, 
             COALESCE(pri.criteria_title, pc.title) as criteria_title, 
             COALESCE(pri.criteria_description, pc.description) as criteria_description, 
             COALESCE(pri.max_score, pc.max_score) as max_score,
             COALESCE(pri.weight, pc.weight) as weight,
             COALESCE(pri.category, pc.category) as category,
             pc.criteria_type
      FROM performance_review_items pri
      LEFT JOIN performance_criteria pc ON pri.criteria_id = pc.id
      WHERE pri.review_id = ?
      ORDER BY COALESCE(pri.category, pc.category), pri.id
    `, [id]);
    const items = cscItems;

    review.items = items;

    res.json({ success: true, review });
  } catch (error) {
    console.error("Get Review Error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch review" });
  }
};


export const acknowledgeReview = async (req, res) => {
    const { id } = req.params;
    const user = req.user;

    try {
        const [reviews] = await db.query("SELECT * FROM performance_reviews WHERE id = ?", [id]);
        if (reviews.length === 0) {
            return res.status(404).json({ success: false, message: "Review not found" });
        }
        const review = reviews[0];

        if (review.employee_id != user.id) {
            return res.status(403).json({ success: false, message: "You can only acknowledge your own reviews" });
        }

        if (review.disagreed) {
            return res.status(400).json({ success: false, message: "Cannot acknowledge a review you have disagreed with. Please resolve the disagreement first." });
        }

        await db.query("UPDATE performance_reviews SET status = 'Acknowledged' WHERE id = ?", [id]);
        
        // Log audit
        await logAudit(id, 'acknowledged', user.id, {});

        res.json({ success: true, message: "Review acknowledged successfully" });

    } catch (error) {
        console.error("Acknowledge Review Error:", error);
        res.status(500).json({ success: false, message: "Failed to acknowledge review" });
    }
};

export const createReview = async (req, res) => {
  const { employee_id, reviewer_id, cycle_id, review_cycle_id, start_date, end_date, review_period_start, review_period_end } = req.body;
  
  // Accept both field names for flexibility
  const cycleId = cycle_id || review_cycle_id || null;
  let periodStart = start_date || review_period_start || null;
  let periodEnd = end_date || review_period_end || null;
  
  // Basic validation
  if (!employee_id || !reviewer_id) {
    return res.status(400).json({ success: false, message: "Employee and Reviewer are required" });
  }

  try {
    // If cycle is provided but dates are not, get dates from cycle
    if (cycleId && (!periodStart || !periodEnd)) {
      const [cycles] = await db.query("SELECT start_date, end_date FROM performance_review_cycles WHERE id = ?", [cycleId]);
      if (cycles.length > 0) {
        periodStart = periodStart || cycles[0].start_date;
        periodEnd = periodEnd || cycles[0].end_date;
      }
    }

    // Default to current date if still null
    if (!periodStart) {
      const today = new Date();
      periodStart = today.toISOString().split('T')[0];
    }
    if (!periodEnd) {
      const sixMonthsLater = new Date();
      sixMonthsLater.setMonth(sixMonthsLater.getMonth() + 6);
      periodEnd = sixMonthsLater.toISOString().split('T')[0];
    }

    console.log("=== createReview: About to check for duplicates ===", { employee_id, cycleId });

    // Check if exists - return existing ID instead of 409 error
    if (cycleId) {
      const [existing] = await db.query(
        "SELECT id, status FROM performance_reviews WHERE employee_id = ? AND review_cycle_id = ?", 
        [employee_id, cycleId]
      );
      if (existing.length > 0) {
        // Return the existing review ID so the frontend can use it
        return res.status(200).json({ success: true, message: "Review already exists", reviewId: existing[0].id, existing: true });
      }
    }

    // Also check without cycle - if there's any draft review for this employee, return that
    const [existingDraft] = await db.query(
      "SELECT id FROM performance_reviews WHERE employee_id = ? AND status = 'Draft' ORDER BY created_at DESC LIMIT 1",
      [employee_id]
    );
    if (existingDraft.length > 0) {
      return res.status(200).json({ success: true, message: "Draft review exists", reviewId: existingDraft[0].id, existing: true });
    }

    // Create the review
    const [result] = await db.query(
      `INSERT INTO performance_reviews 
       (employee_id, reviewer_id, review_cycle_id, review_period_start, review_period_end, status, created_at) 
       VALUES (?, ?, ?, ?, ?, 'Draft', NOW())`,
      [employee_id, reviewer_id, cycleId, periodStart, periodEnd]
    );

    const reviewId = result.insertId;

    // Initialize items based on active criteria
    const [criteria] = await db.query("SELECT * FROM performance_criteria WHERE is_active = TRUE OR is_active IS NULL");
    console.log("=== createReview: Found criteria ===", criteria.length);
    
    if (criteria.length > 0) {
      for (const c of criteria) {
        await db.query(
          `INSERT INTO performance_review_items 
           (review_id, criteria_id, score, criteria_title, criteria_description, weight, max_score, category) 
           VALUES (?, ?, 0, ?, ?, ?, ?, ?)`,
          [reviewId, c.id, c.title, c.description, c.weight || 1, c.max_score || 5, c.category || 'General']
        );
      }
    }

    // Audit log for transparency
    await logAudit(reviewId, 'created', req.user.id, { employee_id, reviewer_id, cycle_id: cycleId });

    res.status(201).json({ success: true, message: "Review initialized", reviewId });
  } catch (error) {
    console.error("Create Review Error:", error);
    res.status(500).json({ success: false, message: "Failed to create review: " + error.message });
  }
};




// Helper to calculate total score from items
const calculateReviewScore = async (reviewId) => {
    const [items] = await db.query(
      `SELECT pri.score, COALESCE(pc.weight, pri.weight, 1) as weight 
       FROM performance_review_items pri 
       LEFT JOIN performance_criteria pc ON pri.criteria_id = pc.id 
       WHERE pri.review_id = ?`,
      [reviewId]
    );

    let totalScore = 0;
    if (items.length > 0) {
      let totalWeightedScore = 0;
      let totalWeight = 0;
      
      items.forEach(item => {
        const weight = parseFloat(item.weight) || 1;
        const score = parseFloat(item.score) || 0;
        totalWeightedScore += score * weight;
        totalWeight += weight;
      });
      
      totalScore = totalWeight > 0 ? (totalWeightedScore / totalWeight).toFixed(2) : 0;
    }
    
    return totalScore;
};

export const updateReview = async (req, res) => {
  const { id } = req.params;
  const { items, overall_feedback, strengths, improvements, additional_comments } = req.body;
  const user = req.user;

  try {
    // Check if review exists and get ownership info
    const [reviews] = await db.query("SELECT * FROM performance_reviews WHERE id = ?", [id]);
    if (reviews.length === 0) {
      return res.status(404).json({ success: false, message: "Review not found" });
    }
    const review = reviews[0];

    // Security: Only Admin, HR, or the assigned Reviewer can use this generic update.
    // Employees must use submitSelfRating for their parts, but we might allow them to save draft items if status is Draft.
    const isReviewer = ['admin', 'hr'].includes(user.role.toLowerCase()) || review.reviewer_id == user.id;
    const isEmployee = review.employee_id == user.id;
    
    if (!isReviewer && !isEmployee) {
       return res.status(403).json({ success: false, message: "Unauthorized: You cannot edit this review." });
    }
    
    // Employee can only edit if Draft or Self-Rated
    if (isEmployee && !isReviewer && !['Draft', 'Self-Rated'].includes(review.status)) {
        return res.status(403).json({ success: false, message: "Cannot edit review in current status." });
    }

    // Handle overall_feedback
    // 1. If overall_feedback is sent as a string (JSON), use it.
    // 2. If not, but legacy fields are present, construct it.
    // 3. If neither, keep existing or ignore.
    let feedbackJson = overall_feedback;
    
    if (overall_feedback === undefined || overall_feedback === null) {
         if (strengths || improvements || additional_comments) {
             // We have legacy fields but no JSON blob.
             // Try to preserve existing JSON structure if possible, or create new.
             let existingFeedback = {};
             try { existingFeedback = JSON.parse(review.overall_feedback || '{}'); } catch(e) {}
             
             if (strengths) existingFeedback.strengths = strengths;
             if (improvements) existingFeedback.improvements = improvements;
             if (additional_comments) existingFeedback.additional_comments = additional_comments;
             
             feedbackJson = JSON.stringify(existingFeedback);
         } else {
             // No feedback changes
             feedbackJson = review.overall_feedback; 
         }
    }

    // Update or insert items
    if (items && Array.isArray(items)) {
      // 1. Handle Deletions: Identify IDs from frontend
      const incomingIds = items
        .filter(i => i.id && (typeof i.id === 'number' || (typeof i.id === 'string' && !i.id.startsWith('temp')))) 
        .map(i => i.id);
        
      // Get all current items for this review
      const [existingItems] = await db.query("SELECT id FROM performance_review_items WHERE review_id = ?", [id]);
      const existingIds = existingItems.map(i => i.id);
      
      const idsToDelete = existingIds.filter(eid => !incomingIds.includes(eid));
      
      if (idsToDelete.length > 0) {
          const placeholders = idsToDelete.map(() => '?').join(',');
          await db.query(`DELETE FROM performance_review_items WHERE id IN (${placeholders})`, idsToDelete);
      }

      // 2. Loop through incoming items to Update or Insert
      for (const item of items) {
        // Prepare values
        const score = parseFloat(item.score) || 0;
        const q_score = parseFloat(item.q_score) || null;
        const e_score = parseFloat(item.e_score) || null;
        const t_score = parseFloat(item.t_score) || null;
        const weight = parseFloat(item.weight) || 1;
        const max_score = parseFloat(item.max_score) || 5;
        
        if (item.id && (typeof item.id === 'number' || !item.id.toString().startsWith('temp'))) {
            // Update existing item
             await db.query(
            `UPDATE performance_review_items 
             SET score = ?, q_score = ?, e_score = ?, t_score = ?, comment = ?,
                 criteria_title = ?, criteria_description = ?, weight = ?, max_score = ?, category = ?,
                 self_score = ?, actual_accomplishments = ?
             WHERE id = ? AND review_id = ?`,
            [
                score, q_score, e_score, t_score, item.comment || '',
                item.criteria_title, item.criteria_description, weight, max_score, item.category,
                item.self_score || 0, item.actual_accomplishments || '',
                item.id, id
            ]
          );
        } else {
            // Insert new item
           await db.query(
            `INSERT INTO performance_review_items 
             (review_id, criteria_id, score, q_score, e_score, t_score, comment, criteria_title, criteria_description, weight, max_score, category, self_score, actual_accomplishments) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                id, item.criteria_id || null, score, q_score, e_score, t_score, item.comment || '',
                item.criteria_title, item.criteria_description, weight, max_score, item.category,
                item.self_score || 0, item.actual_accomplishments || ''
            ]
          );
        }
      }
    }

    // Recalculate total score
    const totalScore = await calculateReviewScore(id);

    // Update review details
    await db.query(
      `UPDATE performance_reviews 
       SET overall_feedback = ?, total_score = ?, updated_at = NOW() 
       WHERE id = ?`,
      [feedbackJson, totalScore, id]
    );

    // Audit log for transparency
    await logAudit(id, 'updated', req.user.id, { items_updated: items?.length || 0 });

    res.json({ success: true, message: "Review updated successfully", total_score: totalScore });
  } catch (error) {
    console.error("Update Review Error:", error);
    res.status(500).json({ success: false, message: "Failed to update review: " + error.message });
  }
};


export const submitReview = async (req, res) => {
  const { id } = req.params;
  try {
    // Calculate total score from review items before submitting
    // Use LEFT JOIN to include items without criteria_id, fallback to item's own weight
    const [items] = await db.query(
      `SELECT pri.score, COALESCE(pc.weight, pri.weight, 1) as weight 
       FROM performance_review_items pri 
       LEFT JOIN performance_criteria pc ON pri.criteria_id = pc.id 
       WHERE pri.review_id = ?`,
      [id]
    );

    let totalScore = 0;
    if (items.length > 0) {
      let totalWeightedScore = 0;
      let totalWeight = 0;
      
      items.forEach(item => {
        const weight = parseFloat(item.weight) || 1;
        const score = parseFloat(item.score) || 0;
        totalWeightedScore += score * weight;
        totalWeight += weight;
      });
      
      totalScore = totalWeight > 0 ? (totalWeightedScore / totalWeight).toFixed(2) : 0;
    }

    // Update both status and total_score
    await db.query(
      "UPDATE performance_reviews SET status = 'Submitted', total_score = ?, supervisor_rating_score = ? WHERE id = ?", 
      [totalScore, totalScore, id]
    );
    
    res.json({ success: true, message: "Review submitted", total_score: totalScore });
  } catch (error) {
    console.error("Submit Review Error:", error);
    res.status(500).json({ success: false, message: "Failed to submit review" });
  }
};

export const deleteReview = async (req, res) => {
  const { id } = req.params;
  const user = req.user;

  try {
    // Verify the review exists
    const [reviews] = await db.query("SELECT * FROM performance_reviews WHERE id = ?", [id]);
    if (reviews.length === 0) {
      return res.status(404).json({ success: false, message: "Review not found" });
    }
    const review = reviews[0];

    // Only allow deletion of Draft status reviews
    if (review.status !== 'Draft') {
      return res.status(400).json({ success: false, message: "Only draft reviews can be deleted" });
    }

    // Security: Only admin/hr or the reviewer can delete
    if (!['admin', 'hr'].includes(user.role.toLowerCase()) && review.reviewer_id != user.id) {
      return res.status(403).json({ success: false, message: "Unauthorized to delete this review" });
    }

    // Delete review items first (foreign key constraint)
    await db.query("DELETE FROM performance_review_items WHERE review_id = ?", [id]);
    
    // Delete the review
    await db.query("DELETE FROM performance_reviews WHERE id = ?", [id]);

    res.json({ success: true, message: "Draft review deleted successfully" });
  } catch (error) {
    console.error("Delete Review Error:", error);
    res.status(500).json({ success: false, message: "Failed to delete review" });
  }
};

// --- Criteria Management ---
export const getCriteria = async (req, res) => {
  try {
    const { criteria_type, is_active } = req.query;
    
    let query = "SELECT * FROM performance_criteria WHERE 1=1";
    const params = [];

    if (criteria_type) {
      query += " AND criteria_type = ?";
      params.push(criteria_type);
    }
    if (is_active !== undefined) {
      query += " AND is_active = ?";
      params.push(is_active === 'true' || is_active === true);
    }

    query += " ORDER BY category, created_at ASC";

    const [criteria] = await db.query(query, params);
    res.json({ success: true, criteria });
  } catch (error) {
    console.error("Get Criteria Error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch criteria" });
  }
};

export const addCriteria = async (req, res) => {
  const { title, description, weight, max_score, category } = req.body;
  try {
    await db.query(
      "INSERT INTO performance_criteria (title, description, weight, max_score, category) VALUES (?, ?, ?, ?, ?)",
      [title, description, weight || 1, max_score || 5, category || 'General']
    );
    res.status(201).json({ success: true, message: "Criteria added" });
  } catch (error) {
    console.error("Add Criteria Error:", error);
    res.status(500).json({ success: false, message: "Failed to add criteria" });
  }
};

export const updateCriteria = async (req, res) => {
  const { id } = req.params;
  const { title, description, weight, max_score, category } = req.body;
  try {
    await db.query(
      "UPDATE performance_criteria SET title = ?, description = ?, weight = ?, max_score = ?, category = ? WHERE id = ?",
      [title, description, weight, max_score, category, id]
    );
    res.json({ success: true, message: "Criteria updated" });
  } catch (error) {
    console.error("Update Criteria Error:", error);
    res.status(500).json({ success: false, message: "Failed to update criteria" });
  }
};

export const deleteCriteria = async (req, res) => {
  const { id } = req.params;
  try {
    await db.query("DELETE FROM performance_criteria WHERE id = ?", [id]);
    res.json({ success: true, message: "Criteria deleted" });
  } catch (error) {
    console.error("Delete Criteria Error:", error);
    res.status(500).json({ success: false, message: "Failed to delete criteria" });
  }
};

// --- Cycle Management ---
export const createReviewCycle = async (req, res) => {
  const { title, description, start_date, end_date } = req.body;

  // Input validation
  if (!title || !start_date || !end_date) {
    return res.status(400).json({ success: false, message: "Title, start date, and end date are required" });
  }

  // Date validation
  const startDateObj = new Date(start_date);
  const endDateObj = new Date(end_date);
  if (endDateObj <= startDateObj) {
    return res.status(400).json({ success: false, message: "End date must be after start date" });
  }

  try {
    await db.query(
      "INSERT INTO performance_review_cycles (title, description, start_date, end_date) VALUES (?, ?, ?, ?)",
      [title, description, start_date, end_date]
    );
    res.status(201).json({ success: true, message: "Review cycle created" });
  } catch (error) {
    console.error("Create Cycle Error:", error);
    res.status(500).json({ success: false, message: "Failed to create review cycle" });
  }
};

export const updateReviewCycle = async (req, res) => {
    const { id } = req.params;
    const { title, description, start_date, end_date } = req.body;
    try {
        await db.query(
            `UPDATE performance_review_cycles 
             SET title = ?, description = ?, start_date = ?, end_date = ? 
             WHERE id = ?`,
            [title, description, start_date, end_date, id]
        );
        res.json({ success: true, message: "Review cycle updated" });
    } catch (error) {
        console.error("Update Cycle Error:", error);
        res.status(500).json({ success: false, message: "Failed to update review cycle" });
    }
};


export const deleteReviewCycle = async (req, res) => {
    const { id } = req.params;
    try {
        await db.query("DELETE FROM performance_review_cycles WHERE id = ?", [id]);
        res.json({ success: true, message: "Review cycle deleted" });
    } catch (error) {
        console.error("Delete Cycle Error:", error);
        res.status(500).json({ success: false, message: "Failed to delete review cycle" });
    }
};

// ============================================
// CSC-COMPLIANT PERFORMANCE EVALUATION FEATURES
// ============================================

// Helper: Log audit trail
const logAudit = async (reviewId, action, actorId, details = null) => {
    try {
        await db.query(
            `INSERT INTO performance_audit_log (review_id, action, actor_id, details) VALUES (?, ?, ?, ?)`,
            [reviewId, action, actorId, details ? JSON.stringify(details) : null]
        );
    } catch (error) {
        console.error("Audit Log Error:", error);
        // Don't throw - audit failures shouldn't break main operations
    }
};



// Submit employee self-rating
export const submitSelfRating = async (req, res) => {
    const { id } = req.params;
    const { items, employee_remarks, isDraft } = req.body;
    const user = req.user;

    try {
        const [reviews] = await db.query("SELECT * FROM performance_reviews WHERE id = ?", [id]);
        if (reviews.length === 0) {
            return res.status(404).json({ success: false, message: "Review not found" });
        }
        const review = reviews[0];

        // Security: Ensure the acting user is the employee
        if (review.employee_id != user.id) {
            return res.status(403).json({ success: false, message: "Unauthorized: You are not the assigned employee for this review." });
        }

        // Update items
        let totalSelfScore = 0;
        let totalWeight = 0;

        if (items && Array.isArray(items)) {
            for (const item of items) {
                // Update item
                if (item.id) {
                    await db.query(
                        `UPDATE performance_review_items SET self_score = ?, actual_accomplishments = ? WHERE id = ? AND review_id = ?`,
                        [item.self_score || 0, item.actual_accomplishments || '', item.id, id]
                    );
                } else if (item.criteria_id) {
                    await db.query(
                         `UPDATE performance_review_items SET self_score = ?, actual_accomplishments = ? WHERE review_id = ? AND criteria_id = ?`,
                        [item.self_score || 0, item.actual_accomplishments || '', id, item.criteria_id]
                    );
                }
                
                // Calculate score on the fly
                const weight = parseFloat(item.weight) || 1;
                const score = parseFloat(item.self_score) || 0;
                totalSelfScore += score * weight;
                totalWeight += weight;
            }
        }

        const calculatedSelfScore = totalWeight > 0 ? (totalSelfScore / totalWeight).toFixed(2) : 0;
        const newStatus = isDraft ? 'Draft' : 'Self-Rated';

        // Update review
        await db.query(
            `UPDATE performance_reviews 
             SET self_rating_score = ?, employee_remarks = ?, 
                 status = ?, updated_at = NOW()
             WHERE id = ?`,
            [calculatedSelfScore, employee_remarks || '', newStatus, id]
        );

        // Log audit
        await logAudit(id, isDraft ? 'self_rating_draft' : 'self_rated', user.id, { self_rating_score: calculatedSelfScore });

        res.json({ success: true, message: isDraft ? "Draft saved successfully" : "Self-rating submitted successfully", self_rating_score: calculatedSelfScore });
    } catch (error) {
        console.error("Submit Self Rating Error:", error);
        res.status(500).json({ success: false, message: "Failed to submit self rating" });
    }
};


// Submit supervisor rating (Admin/HR/Supervisor)
export const submitSupervisorRating = async (req, res) => {
    const { id } = req.params;
    const { items, supervisor_remarks, overall_feedback } = req.body;
    const user = req.user;

    try {
        // Verify permissions
        if (!['admin', 'hr', 'supervisor'].includes(user.role.toLowerCase())) {
            return res.status(403).json({ success: false, message: "Only supervisors can submit ratings" });
        }

        const [reviews] = await db.query("SELECT * FROM performance_reviews WHERE id = ?", [id]);
        if (reviews.length === 0) {
            return res.status(404).json({ success: false, message: "Review not found" });
        }
        const review = reviews[0];

        // Security: Ensure the acting supervisor is actually the assigned reviewer (or Admin/HR)
        if (review.reviewer_id != user.id && !['admin', 'hr'].includes(user.role.toLowerCase())) {
            return res.status(403).json({ success: false, message: "Unauthorized: You are not the assigned reviewer for this employee." });
        }

        // Update items first
        if (items && Array.isArray(items)) {
            for (const item of items) {
                // Update item
                if (item.id) {
                    await db.query(
                        `UPDATE performance_review_items SET score = ?, q_score = ?, e_score = ?, t_score = ?, comment = ? WHERE id = ? AND review_id = ?`,
                        [item.score, item.q_score || null, item.e_score || null, item.t_score || null, item.comment || '', item.id, id]
                    );
                } else if (item.criteria_id) {
                    await db.query(
                        `UPDATE performance_review_items SET score = ?, q_score = ?, e_score = ?, t_score = ?, comment = ? WHERE review_id = ? AND criteria_id = ?`,
                        [item.score, item.q_score || null, item.e_score || null, item.t_score || null, item.comment || '', id, item.criteria_id]
                    );
                }
            }
        }

        // Calculate score using the standard helper
        const supervisorRatingScore = await calculateReviewScore(id);

        // Update review
        await db.query(
            `UPDATE performance_reviews 
             SET supervisor_rating_score = ?, supervisor_remarks = ?, 
                 overall_feedback = ?, total_score = ?, status = 'Submitted'
             WHERE id = ?`,
            [supervisorRatingScore, supervisor_remarks || '', overall_feedback || '', supervisorRatingScore, id]
        );

        // Log audit
        await logAudit(id, 'supervisor_rated', user.id, { supervisor_rating_score: supervisorRatingScore });

        res.json({ success: true, message: "Supervisor rating submitted successfully", supervisor_rating_score: supervisorRatingScore });
    } catch (error) {
        console.error("Submit Supervisor Rating Error:", error);
        res.status(500).json({ success: false, message: "Failed to submit supervisor rating" });
    }
};

// Approve review (Head of Office)
export const approveReview = async (req, res) => {
    const { id } = req.params;
    const { head_remarks, final_rating_score } = req.body;
    const user = req.user;

    try {
        // Verify permissions
        if (!['admin', 'hr'].includes(user.role.toLowerCase())) {
            return res.status(403).json({ success: false, message: "Only Head of Office can approve reviews" });
        }

        const [reviews] = await db.query("SELECT * FROM performance_reviews WHERE id = ?", [id]);
        if (reviews.length === 0) {
            return res.status(404).json({ success: false, message: "Review not found" });
        }
        const review = reviews[0];

        if (!['Submitted', 'Acknowledged'].includes(review.status)) {
            return res.status(400).json({ success: false, message: "Review must be submitted or acknowledged before approval" });
        }

        // Use provided final score or supervisor score
        const finalScore = final_rating_score || review.supervisor_rating_score || review.total_score;

        await db.query(
            `UPDATE performance_reviews 
             SET status = 'Approved', final_rating_score = ?, head_remarks = ?,
                 approved_by = ?, approved_at = NOW()
             WHERE id = ?`,
            [finalScore, head_remarks || '', user.id, id]
        );

        // Log audit
        await logAudit(id, 'approved', user.id, { final_rating_score: finalScore });

        res.json({ success: true, message: "Review approved successfully" });
    } catch (error) {
        console.error("Approve Review Error:", error);
        res.status(500).json({ success: false, message: "Failed to approve review" });
    }
};





// Finalize review (Final step after approval)
export const finalizeReview = async (req, res) => {
    const { id } = req.params;
    const user = req.user;

    try {
        if (!['admin', 'hr'].includes(user.role.toLowerCase())) {
            return res.status(403).json({ success: false, message: "Only Admin/HR can finalize reviews" });
        }

        const [reviews] = await db.query("SELECT * FROM performance_reviews WHERE id = ?", [id]);
        if (reviews.length === 0) {
            return res.status(404).json({ success: false, message: "Review not found" });
        }

        if (reviews[0].status !== 'Approved') {
            return res.status(400).json({ success: false, message: "Review must be approved before finalizing" });
        }

        await db.query("UPDATE performance_reviews SET status = 'Finalized' WHERE id = ?", [id]);
        
        // Log audit
        await logAudit(id, 'finalized', user.id, {});

        res.json({ success: true, message: "Review finalized" });
    } catch (error) {
        console.error("Finalize Review Error:", error);
        res.status(500).json({ success: false, message: "Failed to finalize review" });
    }
};

// --- Granular Item Management (For Immediate Persistence) ---

export const addItemToReview = async (req, res) => {
    const { review_id, criteria_id, criteria_title, criteria_description, weight, max_score, category } = req.body;
    
    try {
        const [result] = await db.query(
            `INSERT INTO performance_review_items 
             (review_id, criteria_id, score, comment, criteria_title, criteria_description, weight, max_score, category, self_score, actual_accomplishments) 
             VALUES (?, ?, 0, '', ?, ?, ?, ?, ?, 0, '')`,
            [review_id, criteria_id || null, criteria_title, criteria_description, weight || 1, max_score || 5, category || 'General']
        );
        
        // Recalculate total score for the review
        const totalScore = await calculateReviewScore(review_id);
        await db.query("UPDATE performance_reviews SET total_score = ? WHERE id = ?", [totalScore, review_id]);

        res.status(201).json({ success: true, message: "Item added", itemId: result.insertId, total_score: totalScore });
    } catch (error) {
        console.error("Add Item Error:", error);
        res.status(500).json({ success: false, message: "Failed to add item" });
    }
};

export const updateReviewItem = async (req, res) => {
    const { id } = req.params;
    const { 
        score, comment, self_score, actual_accomplishments, q_score, e_score, t_score,
        criteria_title, criteria_description, category, weight, max_score 
    } = req.body;
    
    try {
        // Get review_id first to recalculate later
        const [items] = await db.query("SELECT review_id FROM performance_review_items WHERE id = ?", [id]);
        if (items.length === 0) return res.status(404).json({ success: false, message: "Item not found" });
        const reviewId = items[0].review_id;

        await db.query(
            `UPDATE performance_review_items 
             SET score = COALESCE(?, score), 
                 comment = COALESCE(?, comment), 
                 self_score = COALESCE(?, self_score), 
                 actual_accomplishments = COALESCE(?, actual_accomplishments),
                 q_score = COALESCE(?, q_score),
                 e_score = COALESCE(?, e_score),
                 t_score = COALESCE(?, t_score),
                 criteria_title = COALESCE(?, criteria_title),
                 criteria_description = COALESCE(?, criteria_description),
                 category = COALESCE(?, category),
                 weight = COALESCE(?, weight),
                 max_score = COALESCE(?, max_score)
             WHERE id = ?`,
            [score, comment, self_score, actual_accomplishments, q_score, e_score, t_score,
             criteria_title, criteria_description, category, weight, max_score, id]
        );

        // Recalculate total score
        const totalScore = await calculateReviewScore(reviewId);
        await db.query("UPDATE performance_reviews SET total_score = ? WHERE id = ?", [totalScore, reviewId]);

        res.json({ success: true, message: "Item updated", total_score: totalScore });
    } catch (error) {
        console.error("Update Item Error:", error);
        res.status(500).json({ success: false, message: "Failed to update item" });
    }
};

export const deleteReviewItem = async (req, res) => {
    const { id } = req.params;
    
    try {
        // Get review_id first
        const [items] = await db.query("SELECT review_id FROM performance_review_items WHERE id = ?", [id]);
        if (items.length === 0) return res.status(404).json({ success: false, message: "Item not found" });
        const reviewId = items[0].review_id;

        await db.query("DELETE FROM performance_review_items WHERE id = ?", [id]);

        // Recalculate total score
        const totalScore = await calculateReviewScore(reviewId);
        await db.query("UPDATE performance_reviews SET total_score = ? WHERE id = ?", [totalScore, reviewId]);

        res.json({ success: true, message: "Item deleted", total_score: totalScore });
    } catch (error) {
        console.error("Delete Item Error:", error);
        res.status(500).json({ success: false, message: "Failed to delete item" });
    }
};



