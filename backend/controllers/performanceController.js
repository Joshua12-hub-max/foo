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

    // Get list of employees with their latest review status
    // This is a bit complex query, needing a LEFT JOIN on the latest review
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
        COALESCE(pr.total_score, pr.supervisor_rating_score, pr.self_rating_score) as score,
        e.employee_id
      FROM authentication e
      LEFT JOIN performance_reviews pr ON e.id = pr.employee_id 
        AND pr.id = (SELECT MAX(id) FROM performance_reviews WHERE employee_id = e.id)
      WHERE e.role != 'admin'
      ORDER BY e.last_name ASC
    `;
    
    const [employees] = await db.query(query);

    // Format employees
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
      score: emp.score
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
    let { employee_id, cycle_id } = req.query;
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
             emp.first_name as emp_first_name, emp.last_name as emp_last_name
      FROM performance_reviews pr
      JOIN authentication emp ON pr.employee_id = emp.id
      JOIN authentication reviewer ON pr.reviewer_id = reviewer.id
      WHERE 1=1
    `;
    const params = [];

    if (employee_id) {
      query += " AND pr.employee_id = ?";
      params.push(employee_id);
    }
    if (cycle_id) {
      query += " AND pr.cycle_id = ?";
      params.push(cycle_id);
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
        if (review.employee_id !== user.id && review.reviewer_id !== user.id) {
            return res.status(403).json({ success: false, message: "Unauthorized access to this review" });
        }
    }

    // Get items with full criteria info (including weight and category)
    const [items] = await db.query(`
      SELECT pri.*, 
             pc.title as criteria_title, 
             pc.description as criteria_description, 
             pc.max_score,
             pc.weight,
             pc.category,
             pc.criteria_type
      FROM performance_review_items pri
      JOIN performance_criteria pc ON pri.criteria_id = pc.id
      WHERE pri.review_id = ?
      ORDER BY pc.category, pc.id
    `, [id]);

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

        if (review.employee_id !== user.id) {
            return res.status(403).json({ success: false, message: "You can only acknowledge your own reviews" });
        }

        if (review.status !== 'Submitted') {
             return res.status(400).json({ success: false, message: "Review must be submitted before acknowledgement" });
        }

        await db.query("UPDATE performance_reviews SET status = 'Acknowledged' WHERE id = ?", [id]);
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

    // Check if exists (only if cycle is specified)
    if (cycleId) {
      const [existing] = await db.query(
        "SELECT * FROM performance_reviews WHERE employee_id = ? AND (cycle_id = ? OR review_cycle_id = ?)", 
        [employee_id, cycleId, cycleId]
      );
      if (existing.length > 0) {
          return res.status(409).json({ success: false, message: "Review already exists for this cycle" });
      }
    }

    // Insert review - use review_cycle_id as the canonical column
    const [result] = await db.query(
      `INSERT INTO performance_reviews 
      (employee_id, reviewer_id, review_cycle_id, review_period_start, review_period_end, status) 
      VALUES (?, ?, ?, ?, ?, 'Draft')`,
      [employee_id, reviewer_id, cycleId, periodStart, periodEnd]
    );

    const reviewId = result.insertId;

    // Initialize items based on active criteria
    const [criteria] = await db.query("SELECT id FROM performance_criteria WHERE is_active = TRUE OR is_active IS NULL");
    if (criteria.length > 0) {
      for (const c of criteria) {
        await db.query(
          "INSERT INTO performance_review_items (review_id, criteria_id, score) VALUES (?, ?, 0)",
          [reviewId, c.id]
        );
      }
    }

    res.status(201).json({ success: true, message: "Review initialized", reviewId });
  } catch (error) {
    console.error("Create Review Error:", error);
    res.status(500).json({ success: false, message: "Failed to create review: " + error.message });
  }
};




export const updateReview = async (req, res) => {
  const { id } = req.params;
  const { items, overall_feedback, total_score, strengths, improvements, goals, additional_comments } = req.body;

  try {
    // Build overall_feedback from structured fields if provided
    let feedbackJson = overall_feedback;
    if (strengths || improvements || goals || additional_comments) {
      feedbackJson = JSON.stringify({
        strengths: strengths || '',
        improvements: improvements || '',
        goals: goals || '',
        additional_comments: additional_comments || ''
      });
    }

    // Update review details
    await db.query(
      `UPDATE performance_reviews 
       SET overall_feedback = ?, total_score = ?, updated_at = NOW() 
       WHERE id = ?`,
      [feedbackJson, total_score, id]
    );

    // Update or insert items
    if (items && Array.isArray(items)) {
      for (const item of items) {
        // Check if item exists by review_id + criteria_id
        const [existing] = await db.query(
          "SELECT id FROM performance_review_items WHERE review_id = ? AND criteria_id = ?",
          [id, item.criteria_id]
        );

        if (existing.length > 0) {
          // Update existing item
          await db.query(
            `UPDATE performance_review_items 
             SET score = ?, comment = ? 
             WHERE review_id = ? AND criteria_id = ?`,
            [item.score || 0, item.comment || '', id, item.criteria_id]
          );
        } else {
          // Insert new item
          await db.query(
            `INSERT INTO performance_review_items (review_id, criteria_id, score, comment) 
             VALUES (?, ?, ?, ?)`,
            [id, item.criteria_id, item.score || 0, item.comment || '']
          );
        }
      }
    }

    res.json({ success: true, message: "Review updated successfully" });
  } catch (error) {
    console.error("Update Review Error:", error);
    res.status(500).json({ success: false, message: "Failed to update review: " + error.message });
  }
};


export const submitReview = async (req, res) => {
  const { id } = req.params;
  try {
    // Calculate total score from review items before submitting
    const [items] = await db.query(
      `SELECT pri.score, pc.weight 
       FROM performance_review_items pri 
       JOIN performance_criteria pc ON pri.criteria_id = pc.id 
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
    if (!['admin', 'hr'].includes(user.role.toLowerCase()) && review.reviewer_id !== user.id) {
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
    const [criteria] = await db.query("SELECT * FROM performance_criteria ORDER BY created_at ASC");
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

// Get employee's pending reviews (for self-rating)
export const getMyPendingReviews = async (req, res) => {
    const user = req.user;
    try {
        const query = `
            SELECT pr.*, 
                   pc.title as cycle_title,
                   reviewer.first_name as reviewer_first_name, 
                   reviewer.last_name as reviewer_last_name
            FROM performance_reviews pr
            LEFT JOIN performance_cycles pc ON pr.cycle_id = pc.id
            JOIN authentication reviewer ON pr.reviewer_id = reviewer.id
            WHERE pr.employee_id = ? 
            AND pr.status IN ('Draft', 'Self-Rated', 'Submitted')
            ORDER BY pr.created_at DESC
        `;
        const [reviews] = await db.query(query, [user.id]);
        res.json({ success: true, reviews });
    } catch (error) {
        console.error("Get My Pending Reviews Error:", error);
        res.status(500).json({ success: false, message: "Failed to fetch pending reviews" });
    }
};

// Submit self-rating (Employee)
export const submitSelfRating = async (req, res) => {
    const { id } = req.params;
    const { items, employee_remarks } = req.body;
    const user = req.user;

    try {
        // Verify the employee owns this review
        const [reviews] = await db.query("SELECT * FROM performance_reviews WHERE id = ?", [id]);
        if (reviews.length === 0) {
            return res.status(404).json({ success: false, message: "Review not found" });
        }
        const review = reviews[0];

        if (review.employee_id !== user.id) {
            return res.status(403).json({ success: false, message: "You can only self-rate your own reviews" });
        }

        if (!['Draft', 'Self-Rated'].includes(review.status)) {
            return res.status(400).json({ success: false, message: "Self-rating can only be done when status is Draft or Self-Rated" });
        }

        // Calculate self-rating score
        let totalWeightedScore = 0;
        let totalWeight = 0;

        if (items && Array.isArray(items)) {
            for (const item of items) {
                // Update self-rating fields
                await db.query(
                    `UPDATE performance_review_items 
                     SET self_score = ?, actual_accomplishments = ? 
                     WHERE review_id = ? AND criteria_id = ?`,
                    [item.self_score, item.actual_accomplishments || '', id, item.criteria_id]
                );
                
                // Get weight for this criteria
                const [criteria] = await db.query("SELECT weight FROM performance_criteria WHERE id = ?", [item.criteria_id]);
                const weight = criteria[0]?.weight || 1;
                totalWeightedScore += (parseFloat(item.self_score) || 0) * weight;
                totalWeight += weight;
            }
        }

        const selfRatingScore = totalWeight > 0 ? (totalWeightedScore / totalWeight).toFixed(2) : 0;

        // Update review
        await db.query(
            `UPDATE performance_reviews 
             SET self_rating_score = ?, self_rating_status = 'submitted', 
                 employee_remarks = ?, status = 'Self-Rated'
             WHERE id = ?`,
            [selfRatingScore, employee_remarks || '', id]
        );

        // Log audit
        await logAudit(id, 'self_rated', user.id, { self_rating_score: selfRatingScore });

        res.json({ success: true, message: "Self-rating submitted successfully", self_rating_score: selfRatingScore });
    } catch (error) {
        console.error("Submit Self-Rating Error:", error);
        res.status(500).json({ success: false, message: "Failed to submit self-rating" });
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

        // Calculate supervisor rating score
        let totalWeightedScore = 0;
        let totalWeight = 0;

        if (items && Array.isArray(items)) {
            for (const item of items) {
                await db.query(
                    `UPDATE performance_review_items SET score = ?, comment = ? WHERE review_id = ? AND criteria_id = ?`,
                    [item.score, item.comment || '', id, item.criteria_id]
                );
                
                const [criteria] = await db.query("SELECT weight FROM performance_criteria WHERE id = ?", [item.criteria_id]);
                const weight = criteria[0]?.weight || 1;
                totalWeightedScore += (parseFloat(item.score) || 0) * weight;
                totalWeight += weight;
            }
        }

        const supervisorRatingScore = totalWeight > 0 ? (totalWeightedScore / totalWeight).toFixed(2) : 0;

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

// Get review audit history (Transparency)
export const getReviewHistory = async (req, res) => {
    const { id } = req.params;
    const user = req.user;

    try {
        // Verify access
        const [reviews] = await db.query("SELECT * FROM performance_reviews WHERE id = ?", [id]);
        if (reviews.length === 0) {
            return res.status(404).json({ success: false, message: "Review not found" });
        }
        const review = reviews[0];

        // Allow access if admin/hr, the employee, or the reviewer
        if (!['admin', 'hr'].includes(user.role.toLowerCase()) && 
            review.employee_id !== user.id && 
            review.reviewer_id !== user.id) {
            return res.status(403).json({ success: false, message: "Unauthorized access" });
        }

        const [history] = await db.query(`
            SELECT pal.*, 
                   a.first_name as actor_first_name, 
                   a.last_name as actor_last_name,
                   a.role as actor_role
            FROM performance_audit_log pal
            JOIN authentication a ON pal.actor_id = a.id
            WHERE pal.review_id = ?
            ORDER BY pal.created_at DESC
        `, [id]);

        res.json({ success: true, history });
    } catch (error) {
        console.error("Get Review History Error:", error);
        res.status(500).json({ success: false, message: "Failed to fetch review history" });
    }
};

// Disagree with rating (Employee transparency feature)
export const disagreeWithRating = async (req, res) => {
    const { id } = req.params;
    const { disagree_remarks } = req.body;
    const user = req.user;

    try {
        const [reviews] = await db.query("SELECT * FROM performance_reviews WHERE id = ?", [id]);
        if (reviews.length === 0) {
            return res.status(404).json({ success: false, message: "Review not found" });
        }
        const review = reviews[0];

        if (review.employee_id !== user.id) {
            return res.status(403).json({ success: false, message: "You can only disagree with your own reviews" });
        }

        if (!['Submitted', 'Acknowledged'].includes(review.status)) {
            return res.status(400).json({ success: false, message: "Can only disagree after review is submitted" });
        }

        await db.query(
            `UPDATE performance_reviews SET disagreed = TRUE, disagree_remarks = ? WHERE id = ?`,
            [disagree_remarks || '', id]
        );

        // Log audit
        await logAudit(id, 'disagreed', user.id, { disagree_remarks });

        res.json({ success: true, message: "Disagreement recorded. HR will review your concerns." });
    } catch (error) {
        console.error("Disagree With Rating Error:", error);
        res.status(500).json({ success: false, message: "Failed to record disagreement" });
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
