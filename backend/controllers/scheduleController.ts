import { Request, Response } from 'express';
import db from '../db/connection.js';
import { scheduleSchema, updateScheduleSchema } from '../schemas/scheduleSchema.js';
import type { RowDataPacket, ResultSetHeader } from 'mysql2/promise';
import type { AuthenticatedRequest } from '../types/index.js';
import { createNotification } from './notificationController.js';

interface ScheduleRow extends RowDataPacket {
  id: number;
  employee_id: string;
  day_of_week: string;
  start_time: string;
  end_time: string;
  is_rest_day: boolean;
  // Metadata for Calendar display
  first_name?: string;
  last_name?: string;
  department?: string;
}

const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// Helper to map date to day name
const getDayName = (dateStr: string) => {
  const date = new Date(dateStr);
  return DAYS_OF_WEEK[date.getDay()];
};

/**
 * Convert 12-hour time format to 24-hour format for MySQL TIME column
 * @param time12h - Time in "9:00 AM" or "5:00 PM" format
 * @returns Time in "HH:MM:SS" format (e.g., "09:00:00", "17:00:00")
 */
const convertTo24Hour = (time12h: string): string => {
  try {
    if (!time12h) return '09:00:00';
    
    // If already in 24h format (e.g., "09:00" or "17:00:00"), return as-is with seconds
    if (!time12h.toLowerCase().includes('am') && !time12h.toLowerCase().includes('pm')) {
      const parts = time12h.split(':');
      const hours = parts[0].padStart(2, '0');
      const minutes = parts[1] || '00';
      return `${hours}:${minutes}:00`;
    }
    
    const [time, period] = time12h.split(' ');
    let [hours, minutes] = time.split(':').map(Number);
    
    if (period?.toLowerCase() === 'pm' && hours !== 12) {
      hours += 12;
    } else if (period?.toLowerCase() === 'am' && hours === 12) {
      hours = 0;
    }
    
    return `${hours.toString().padStart(2, '0')}:${(minutes || 0).toString().padStart(2, '0')}:00`;
  } catch (error) {
    console.error('Error converting time:', time12h, error);
    return '09:00:00'; // Default fallback
  }
};

export const getSchedules = async (req: Request, res: Response) => {
  try {
    const [schedules] = await db.query<ScheduleRow[]>(`
      SELECT 
        s.*, 
        a.first_name, 
        a.last_name, 
        CONCAT(a.first_name, ' ', a.last_name) as employee_name,
        a.department 
      FROM schedules s
      LEFT JOIN authentication a ON s.employee_id = a.employee_id
    `);
    
    res.json({ schedules });
  } catch (error) {
    console.error('Get Schedules Error:', error);
    res.status(500).json({ message: 'Failed to fetch schedules' });
  }
};

export const createSchedule = async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const senderId = authReq.user?.employeeId;

    const validation = scheduleSchema.safeParse(req.body);
    
    if (!validation.success) {
      res.status(400).json({ 
        message: 'Validation Error', 
        errors: validation.error.format() 
      });
      return;
    }

    const { employee_id, start_date, end_date, start_time, end_time, repeat, is_rest_day, title } = validation.data;
    
    const daysToSet = [];
    
    if (repeat === 'daily') {
      // Mon-Fri
      daysToSet.push('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday');
    } else if (repeat === 'weekly') {
        const startDay = getDayName(start_date);
        daysToSet.push(startDay);
    } else {
        // Default behavior for 'none' or 'monthly': Set for the specific day of start_date (treated as weekly pattern in this simple schema)
        const startDay = getDayName(start_date);
        daysToSet.push(startDay);
    }

    const queries = daysToSet.map(day => {
      // Convert 12-hour format to 24-hour format for MySQL TIME column
      const startTime24 = convertTo24Hour(start_time);
      const endTime24 = convertTo24Hour(end_time);
      
      return db.query(
        `INSERT INTO schedules (employee_id, day_of_week, start_time, end_time, is_rest_day)
         VALUES (?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE 
         start_time = VALUES(start_time),
         end_time = VALUES(end_time),
         is_rest_day = VALUES(is_rest_day)`,
         [employee_id, day, startTime24, endTime24, is_rest_day || false]
      );
    });

    await Promise.all(queries);

    // Send notification to the employee
    try {
      await createNotification({
        recipientId: employee_id,
        senderId: senderId,
        title: 'New Schedule Assigned',
        message: `A new schedule "${title || 'Work Schedule'}" has been assigned to you. Details: ${start_time} - ${end_time} (${repeat === 'none' ? 'One-time' : repeat}).`,
        type: 'schedule',
        referenceId: null 
      });
    } catch (notifError) {
      console.error('Failed to send notification for schedule:', notifError);
    }

    res.status(201).json({ message: 'Schedule created/updated successfully' });
  } catch (error) {
    console.error('Create Schedule Error:', error);
    res.status(500).json({ message: 'Failed to create schedule' });
  }
};

export const updateSchedule = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const validation = updateScheduleSchema.safeParse(req.body);

        if (!validation.success) {
             res.status(400).json({ message: 'Validation Error', errors: validation.error.format() });
             return;
        }
    
        const { start_time, end_time } = validation.data;
        
        await db.query(
            'UPDATE schedules SET start_time = ?, end_time = ? WHERE id = ?',
            [start_time, end_time, id]
        );

        res.json({ message: 'Schedule updated successfully' });
    } catch (error) {
        console.error('Update Schedule Error:', error);
        res.status(500).json({ message: 'Failed to update schedule' });
    }
};

export const deleteSchedule = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        await db.query('DELETE FROM schedules WHERE id = ?', [id]);
        res.json({ message: 'Schedule deleted successfully' });
    } catch (error) {
        console.error('Delete Schedule Error:', error);
        res.status(500).json({ message: 'Failed to delete schedule' });
    }
};
