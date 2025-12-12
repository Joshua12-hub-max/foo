/**
 * PMT Controller (Performance Management Team)
 * Manages PMT members, meetings, and calibration sessions
 */

import db from '../db/connection.js';

// =====================================================
// PMT MEMBERS
// =====================================================

export const getPMTMembers = async (req, res) => {
  try {
    const { active_only } = req.query;
    
    let query = `
      SELECT 
        p.*,
        e.first_name, e.last_name, e.email, e.job_title, e.department
      FROM spms_pmt_members p
      JOIN authentication e ON p.employee_id = e.id
    `;
    
    if (active_only === 'true') {
      query += ' WHERE p.is_active = TRUE';
    }
    
    query += ' ORDER BY FIELD(p.role, "Chairperson", "Vice Chairperson", "Secretariat", "Member"), e.last_name';

    const [members] = await db.query(query);
    res.json({ success: true, members });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch PMT members' });
  }
};

export const addPMTMember = async (req, res) => {
  try {
    const { employee_id, role, designation, office, appointment_order } = req.body;

    // Check if already a member
    const [existing] = await db.query(
      'SELECT id FROM spms_pmt_members WHERE employee_id = ? AND is_active = TRUE',
      [employee_id]
    );

    if (existing.length > 0) {
      return res.status(409).json({ success: false, message: 'Employee is already an active PMT member' });
    }

    const [result] = await db.query(
      `INSERT INTO spms_pmt_members 
       (employee_id, role, designation, office, appointment_order, appointed_date) 
       VALUES (?, ?, ?, ?, ?, CURDATE())`,
      [employee_id, role, designation, office, appointment_order]
    );

    res.status(201).json({ 
      success: true, 
      message: 'PMT member added successfully',
      memberId: result.insertId 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to add PMT member' });
  }
};

export const updatePMTMember = async (req, res) => {
  try {
    const { id } = req.params;
    const { role, designation, office, is_active, end_date } = req.body;

    await db.query(
      `UPDATE spms_pmt_members SET 
        role = COALESCE(?, role),
        designation = COALESCE(?, designation),
        office = COALESCE(?, office),
        is_active = COALESCE(?, is_active),
        end_date = COALESCE(?, end_date)
       WHERE id = ?`,
      [role, designation, office, is_active, end_date, id]
    );

    res.json({ success: true, message: 'PMT member updated' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update PMT member' });
  }
};

export const removePMTMember = async (req, res) => {
  try {
    const { id } = req.params;

    await db.query(
      "UPDATE spms_pmt_members SET is_active = FALSE, end_date = CURDATE() WHERE id = ?",
      [id]
    );

    res.json({ success: true, message: 'PMT member removed' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to remove PMT member' });
  }
};

// =====================================================
// PMT MEETINGS
// =====================================================

export const getPMTMeetings = async (req, res) => {
  try {
    const { cycle_id, meeting_type, status } = req.query;
    
    let query = `
      SELECT 
        m.*,
        c.title as cycle_title, c.year, c.period,
        cb.first_name as created_by_first, cb.last_name as created_by_last
      FROM spms_pmt_meetings m
      LEFT JOIN spms_cycles c ON m.cycle_id = c.id
      LEFT JOIN authentication cb ON m.created_by = cb.id
      WHERE 1=1
    `;
    const params = [];

    if (cycle_id) {
      query += ' AND m.cycle_id = ?';
      params.push(cycle_id);
    }
    if (meeting_type) {
      query += ' AND m.meeting_type = ?';
      params.push(meeting_type);
    }
    if (status) {
      query += ' AND m.status = ?';
      params.push(status);
    }

    query += ' ORDER BY m.meeting_date DESC';

    const [meetings] = await db.query(query, params);
    res.json({ success: true, meetings });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch meetings' });
  }
};

export const getPMTMeeting = async (req, res) => {
  try {
    const { id } = req.params;

    const [meetings] = await db.query(`
      SELECT 
        m.*,
        c.title as cycle_title, c.year, c.period,
        cb.first_name as created_by_first, cb.last_name as created_by_last
      FROM spms_pmt_meetings m
      LEFT JOIN spms_cycles c ON m.cycle_id = c.id
      LEFT JOIN authentication cb ON m.created_by = cb.id
      WHERE m.id = ?
    `, [id]);

    if (meetings.length === 0) {
      return res.status(404).json({ success: false, message: 'Meeting not found' });
    }

    // Get attachments
    const [attachments] = await db.query(
      'SELECT * FROM spms_pmt_attachments WHERE meeting_id = ?',
      [id]
    );

    const meeting = meetings[0];
    meeting.attachments = attachments;

    res.json({ success: true, meeting });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch meeting' });
  }
};

export const createPMTMeeting = async (req, res) => {
  try {
    const { 
      cycle_id, meeting_type, meeting_date, meeting_time, 
      venue, agenda, attendees 
    } = req.body;
    const user = req.user;

    const [result] = await db.query(
      `INSERT INTO spms_pmt_meetings 
       (cycle_id, meeting_type, meeting_date, meeting_time, venue, agenda, attendees, created_by) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [cycle_id, meeting_type, meeting_date, meeting_time, venue, agenda, 
       JSON.stringify(attendees), user.id]
    );

    res.status(201).json({ 
      success: true, 
      message: 'Meeting scheduled successfully',
      meetingId: result.insertId 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to create meeting' });
  }
};

export const updatePMTMeeting = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      meeting_date, meeting_time, venue, agenda, attendees, 
      absentees, minutes, resolutions, action_items, status 
    } = req.body;

    await db.query(
      `UPDATE spms_pmt_meetings SET 
        meeting_date = COALESCE(?, meeting_date),
        meeting_time = COALESCE(?, meeting_time),
        venue = COALESCE(?, venue),
        agenda = COALESCE(?, agenda),
        attendees = COALESCE(?, attendees),
        absentees = COALESCE(?, absentees),
        minutes = COALESCE(?, minutes),
        resolutions = COALESCE(?, resolutions),
        action_items = COALESCE(?, action_items),
        status = COALESCE(?, status)
       WHERE id = ?`,
      [meeting_date, meeting_time, venue, agenda, 
       attendees ? JSON.stringify(attendees) : null,
       absentees ? JSON.stringify(absentees) : null,
       minutes, resolutions, action_items, status, id]
    );

    res.json({ success: true, message: 'Meeting updated' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update meeting' });
  }
};

export const deletePMTMeeting = async (req, res) => {
  try {
    const { id } = req.params;

    // Only allow deletion of scheduled meetings
    const [meetings] = await db.query('SELECT status FROM spms_pmt_meetings WHERE id = ?', [id]);
    if (meetings.length === 0) {
      return res.status(404).json({ success: false, message: 'Meeting not found' });
    }

    if (meetings[0].status !== 'Scheduled') {
      return res.status(400).json({ success: false, message: 'Only scheduled meetings can be cancelled' });
    }

    await db.query("UPDATE spms_pmt_meetings SET status = 'Cancelled' WHERE id = ?", [id]);
    res.json({ success: true, message: 'Meeting cancelled' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to cancel meeting' });
  }
};

// =====================================================
// PMT CALIBRATION
// =====================================================

export const getCalibrationData = async (req, res) => {
  try {
    const { cycle_id } = req.query;

    // Get all departments with their OPCR and IPCR averages
    const [data] = await db.query(`
      SELECT 
        d.name as department,
        o.id as opcr_id,
        o.status as opcr_status,
        o.final_rating as opcr_rating,
        o.adjectival_rating as opcr_adjectival,
        COUNT(DISTINCT i.id) as ipcr_count,
        AVG(i.final_rating) as avg_ipcr_rating,
        MAX(i.final_rating) as max_ipcr_rating,
        MIN(i.final_rating) as min_ipcr_rating,
        SUM(CASE WHEN i.final_rating >= 4.50 THEN 1 ELSE 0 END) as outstanding_count,
        SUM(CASE WHEN i.final_rating >= 3.50 AND i.final_rating < 4.50 THEN 1 ELSE 0 END) as vs_count,
        SUM(CASE WHEN i.final_rating >= 2.50 AND i.final_rating < 3.50 THEN 1 ELSE 0 END) as s_count,
        SUM(CASE WHEN i.final_rating < 2.50 THEN 1 ELSE 0 END) as below_s_count
      FROM departments d
      LEFT JOIN spms_opcr o ON o.department = d.name AND o.cycle_id = ?
      LEFT JOIN authentication e ON e.department = d.name
      LEFT JOIN spms_ipcr i ON i.employee_id = e.id AND i.cycle_id = ? AND i.status = 'Finalized'
      GROUP BY d.name, o.id, o.status, o.final_rating, o.adjectival_rating
      ORDER BY d.name
    `, [cycle_id, cycle_id]);

    // Check for violations (avg IPCR > OPCR)
    const violations = data.filter(d => 
      d.opcr_rating && d.avg_ipcr_rating && d.avg_ipcr_rating > d.opcr_rating
    );

    res.json({ 
      success: true, 
      calibrationData: data,
      violations,
      hasViolations: violations.length > 0
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch calibration data' });
  }
};

export const getPMTDashboard = async (req, res) => {
  try {
    const { cycle_id } = req.query;

    // Get summary stats
    const [opcrStats] = await db.query(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'Draft' THEN 1 ELSE 0 END) as draft,
        SUM(CASE WHEN status = 'Submitted' THEN 1 ELSE 0 END) as submitted,
        SUM(CASE WHEN status = 'PMT Review' THEN 1 ELSE 0 END) as pmt_review,
        SUM(CASE WHEN status = 'Approved' THEN 1 ELSE 0 END) as approved,
        SUM(CASE WHEN status = 'Finalized' THEN 1 ELSE 0 END) as finalized
      FROM spms_opcr
      ${cycle_id ? 'WHERE cycle_id = ?' : ''}
    `, cycle_id ? [cycle_id] : []);

    const [appealStats] = await db.query(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'Filed' THEN 1 ELSE 0 END) as filed,
        SUM(CASE WHEN status = 'Under Review' THEN 1 ELSE 0 END) as under_review,
        SUM(CASE WHEN status = 'Decided' THEN 1 ELSE 0 END) as decided
      FROM spms_appeals
    `);

    const [pmtMembers] = await db.query(
      'SELECT COUNT(*) as count FROM spms_pmt_members WHERE is_active = TRUE'
    );

    const [upcomingMeetings] = await db.query(`
      SELECT * FROM spms_pmt_meetings 
      WHERE status = 'Scheduled' AND meeting_date >= CURDATE()
      ORDER BY meeting_date LIMIT 5
    `);

    res.json({
      success: true,
      dashboard: {
        opcr: opcrStats[0],
        appeals: appealStats[0],
        pmtMemberCount: pmtMembers[0].count,
        upcomingMeetings
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch dashboard' });
  }
};
