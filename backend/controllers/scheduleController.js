import db from '../db/connection.js';
import { createNotification } from './notificationController.js';

export const getMySchedule = async (req, res) => {
  try {
    // Token payload usually has 'employeeId' (camelCase)
    const employeeId = req.user.employeeId || req.user.employee_id || req.user.id;
    
    console.log(`📅 [getMySchedule] Fetching schedule for employeeId: ${employeeId}`);

    const [schedules] = await db.query(`
      SELECT 
        employee_id, schedule_title, start_time, end_time, start_date, end_date, repeat_pattern, is_rest_day,
        GROUP_CONCAT(day_of_week ORDER BY FIELD(day_of_week, 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday')) as days,
        MAX(id) as id
      FROM schedules 
      WHERE employee_id = ?
      GROUP BY employee_id, schedule_title, start_time, end_time, start_date, end_date, repeat_pattern, is_rest_day
    `, [employeeId]);
    
    const formattedSchedules = schedules.map(s => ({
      ...s,
      scheduleName: s.schedule_title || 'Regular Schedule',
      scheduleTask: s.is_rest_day ? 'Rest Day' : 'Regular Work',
      startDate: s.start_date || 'Recurring',
      endDate: s.end_date || 'Recurring',
      startTime: s.start_time,
      endTime: s.end_time,
      repeat: s.repeat_pattern || 'Weekly',
      days: s.days // Added days to the response
    }));

    res.status(200).json({ schedule: formattedSchedules });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Something went wrong!" });
  }
};

export const getAllSchedules = async (req, res) => {
  try {
    const [schedules] = await db.query(`
      SELECT 
        s.employee_id, s.schedule_title, s.start_time, s.end_time, s.start_date, s.end_date, s.repeat_pattern, s.is_rest_day,
        GROUP_CONCAT(s.day_of_week ORDER BY FIELD(s.day_of_week, 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday')) as days,
        MAX(s.id) as id,
        a.first_name, a.last_name, a.department, a.employee_id as auth_employee_id
      FROM schedules s
      LEFT JOIN authentication a ON s.employee_id = a.employee_id
      GROUP BY s.employee_id, s.schedule_title, s.start_time, s.end_time, s.start_date, s.end_date, s.repeat_pattern, s.is_rest_day
    `);
    
    // Map to format expected by frontend table
    const formattedSchedules = schedules.map(s => ({
      ...s,
      employeeName: `${s.first_name || 'Unknown'} ${s.last_name || 'Employee'}`,
      department: s.department || 'N/A',
      employeeId: s.employee_id,
      scheduleName: s.schedule_title || 'Regular Schedule', 
      scheduleTask: s.is_rest_day ? 'Rest Day' : 'Regular Work',
      startDate: s.start_date || 'Recurring', 
      endDate: s.end_date || 'Recurring',
      startTime: s.start_time,
      endTime: s.end_time,
      repeat: s.repeat_pattern || 'Weekly',
      days: s.days
    }));

    res.status(200).json({ schedules: formattedSchedules });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Something went wrong!" });
  }
};

export const createSchedule = async (req, res) => {
  try {
    const { employee_id, startDate, startTime, endTime, repeat, scheduleName } = req.body;

    // Default title if not provided
    const schedule_title = scheduleName || 'Regular Shift';
    // endDate should be passed from frontend or defaulted
    const endDate = req.body.endDate || startDate; 

    console.log('Creating schedule with data:', { employee_id, startDate, endDate, startTime, endTime, repeat, schedule_title });

    // Validate required fields
    if (!employee_id) {
      return res.status(400).json({ message: "Employee ID is required" });
    }
    if (!startDate) {
      return res.status(400).json({ message: "Start date is required" });
    }
    if (!startTime) {
      return res.status(400).json({ message: "Start time is required" });
    }
    if (!endTime) {
      return res.status(400).json({ message: "End time is required" });
    }

    // Validate employee exists
    const [employeeCheck] = await db.query(
      "SELECT employee_id FROM authentication WHERE employee_id = ?",
      [employee_id]
    );

    if (employeeCheck.length === 0) {
      return res.status(404).json({ message: "Employee not found" });
    }

    const start = new Date(startDate);
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    let daysToSchedule = [];

    if (repeat === 'daily') {
      // "Daily" means Monday to Friday for a standard work week
      daysToSchedule = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    } else if (repeat === 'weekly') {
      // Weekly means the specific day of the week selected
      // Use getUTCDay() to avoid timezone shifts since startDate is YYYY-MM-DD (UTC midnight)
      daysToSchedule = [days[start.getUTCDay()]];
    } else {
      // default to single day if repeat is none or unknown
      daysToSchedule = [days[start.getUTCDay()]];
    }

    console.log('Days to schedule:', daysToSchedule);

    for (const day of daysToSchedule) {
      try {
        const [existing] = await db.query(
          "SELECT id FROM schedules WHERE employee_id = ? AND day_of_week = ?",
          [employee_id, day]
        );

        if (existing.length > 0) {
          console.log(`Updating existing schedule for ${day}, ID: ${existing[0].id}`);
          await db.query(
            "UPDATE schedules SET start_time = ?, end_time = ?, is_rest_day = FALSE, schedule_title = ?, start_date = ?, end_date = ?, repeat_pattern = ? WHERE id = ?",
            [startTime, endTime, schedule_title, startDate, endDate, repeat, existing[0].id]
          );
        } else {
          console.log(`Creating new schedule for ${day}`);
          await db.query(
            "INSERT INTO schedules (employee_id, day_of_week, start_time, end_time, is_rest_day, schedule_title, start_date, end_date, repeat_pattern) VALUES (?, ?, ?, ?, FALSE, ?, ?, ?, ?)",
            [employee_id, day, startTime, endTime, schedule_title, startDate, endDate, repeat]
          );
        }
      } catch (dbError) {
        console.error(`Error processing schedule for ${day}:`, dbError);
        throw dbError;
      }
    }

    // Notify Employee
    try {
      const adminId = req.user ? (req.user.employee_id || req.user.id) : 'Admin';
      await createNotification({
        recipientId: employee_id,
        senderId: adminId,
        title: "New Schedule Assigned",
        message: `You have been assigned a new schedule (${repeat}) starting from ${startDate} at ${startTime} - ${endTime}.`,
        type: "schedule_assigned",
        referenceId: null
      });
    } catch (notificationError) {
      console.error('Failed to create notification:', notificationError);
      // Don't fail the entire request if notification fails
    }

    console.log('Schedule created successfully');
    res.status(201).json({ message: "Schedule created/updated successfully" });
  } catch (err) {
    console.error('Error creating schedule:', err);
    const errorMessage = err.message || "Failed to create schedule";
    res.status(500).json({ message: errorMessage });
  }
};

export const updateSchedule = async (req, res) => {
  try {
    const { id } = req.params;
    const { employee_id, day_of_week, start_time, end_time, is_rest_day } = req.body;
    await db.query(
      "UPDATE schedules SET employee_id = ?, day_of_week = ?, start_time = ?, end_time = ?, is_rest_day = ? WHERE id = ?",
      [employee_id, day_of_week, start_time, end_time, is_rest_day, id]
    );
    res.status(200).json({ message: "Schedule updated" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Something went wrong!" });
  }
};

export const deleteSchedule = async (req, res) => {
  const { id } = req.params;

  try {
    // Check if schedule exists
    const [existing] = await db.query('SELECT * FROM schedules WHERE id = ?', [id]);
    
    if (existing.length === 0) {
      return res.status(404).json({ message: 'Schedule not found' });
    }

    // Delete the schedule
    await db.query('DELETE FROM schedules WHERE id = ?', [id]);
    
    res.status(200).json({ message: 'Schedule deleted successfully' });
  } catch (error) {
    console.error('Error deleting schedule:', error);
    res.status(500).json({ message: 'Failed to delete schedule' });
  }
};

export const getEmployeeSchedule = async (req, res) => {
  const { employeeId } = req.params;

  try {
    const [schedules] = await db.query(
      'SELECT * FROM schedules WHERE employee_id = ? ORDER BY day_of_week',
      [employeeId]
    );
    
    res.status(200).json({ schedules });
  } catch (error) {
    console.error('Error fetching employee schedule:', error);
    res.status(500).json({ message: 'Failed to fetch employee schedule' });
  }
};

export const checkScheduleConflicts = async (req, res) => {
  const { employee_id, startDate, endDate, startTime, endTime } = req.body;

  if (!employee_id || !startDate || !endDate) {
    return res.status(400).json({ message: 'Employee ID, start date, and end date are required' });
  }

  try {
    const conflicts = [];
    
    // Check for leave conflicts
    const [leaves] = await db.query(
      `SELECT * FROM leaves 
       WHERE employee_id = ? 
       AND status = 'approved' 
       AND (
         (start_date <= ? AND end_date >= ?) OR
         (start_date <= ? AND end_date >= ?) OR
         (start_date >= ? AND end_date <= ?)
       )`,
      [employee_id, startDate, startDate, endDate, endDate, startDate, endDate]
    );

    if (leaves.length > 0) {
      conflicts.push({
        type: 'leave',
        message: `Employee has approved leave from ${leaves[0].start_date} to ${leaves[0].end_date}`,
        details: leaves
      });
    }

    // Check for overlapping schedules
    const start = new Date(startDate);
    const end = new Date(endDate);
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const daysInRange = [];
    
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      daysInRange.push(days[d.getDay()]);
    }

    const uniqueDays = [...new Set(daysInRange)];
    
    if (uniqueDays.length > 0) {
      const placeholders = uniqueDays.map(() => '?').join(',');
      const [existingSchedules] = await db.query(
        `SELECT * FROM schedules 
         WHERE employee_id = ? 
         AND day_of_week IN (${placeholders})`,
        [employee_id, ...uniqueDays]
      );

      if (existingSchedules.length > 0) {
        conflicts.push({
          type: 'schedule',
          message: `Employee already has schedules for some of these days`,
          details: existingSchedules
        });
      }
    }

    res.status(200).json({ 
      hasConflicts: conflicts.length > 0,
      conflicts 
    });
  } catch (error) {
    console.error('Error checking schedule conflicts:', error);
    res.status(500).json({ message: 'Failed to check schedule conflicts' });
  }
};