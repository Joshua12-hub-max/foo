import { Request, Response } from 'express';
import { db } from '../db/index.js';
import { schedules, authentication } from '../db/schema.js';
import { eq, sql } from 'drizzle-orm';
import { scheduleSchema, updateScheduleSchema } from '../schemas/scheduleSchema.js';
import type { AuthenticatedRequest } from '../types/index.js';
import { createNotification } from './notificationController.js';

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

export const getSchedules = async (_req: Request, res: Response) => {
  try {
    const result = await db.select({
      id: schedules.id,
      employee_id: schedules.employeeId,
      day_of_week: schedules.dayOfWeek,
      start_time: schedules.startTime,
      end_time: schedules.endTime,
      first_name: authentication.firstName,
      last_name: authentication.lastName,
      employee_name: sql<string>`CONCAT(${authentication.firstName}, ' ', ${authentication.lastName})`,
      department: authentication.department
    })
    .from(schedules)
    .leftJoin(authentication, eq(schedules.employeeId, authentication.employeeId));
    
    res.json({ schedules: result });
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

    const { employee_id, start_date, start_time, end_time, repeat, title } = validation.data;

    
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
      const startTime24 = convertTo24Hour(start_time || '');
      const endTime24 = convertTo24Hour(end_time || '');
      
      return db.insert(schedules).values({
        employeeId: employee_id,
        dayOfWeek: day,
        startTime: startTime24,
        endTime: endTime24,
        // isRestDay: is_rest_day ? 1 : 0 // Column missing in schema
      }).onDuplicateKeyUpdate({
        set: {
          startTime: startTime24,
          endTime: endTime24,
          // isRestDay: is_rest_day ? 1 : 0 // Column missing in schema
        }
      });
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
        const startTime24 = convertTo24Hour(start_time || '');
        const endTime24 = convertTo24Hour(end_time || '');
        
        await db.update(schedules)
            .set({ startTime: startTime24, endTime: endTime24 })
            .where(eq(schedules.id, Number(id)));

        res.json({ message: 'Schedule updated successfully' });
    } catch (error) {
        console.error('Update Schedule Error:', error);
        res.status(500).json({ message: 'Failed to update schedule' });
    }
};

export const deleteSchedule = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        await db.delete(schedules).where(eq(schedules.id, Number(id)));
        res.json({ message: 'Schedule deleted successfully' });
    } catch (error) {
        console.error('Delete Schedule Error:', error);
        res.status(500).json({ message: 'Failed to delete schedule' });
    }
};