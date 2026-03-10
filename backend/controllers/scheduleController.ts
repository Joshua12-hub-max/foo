import { Request, Response } from 'express';
import { db } from '../db/index.js';
import { schedules, authentication } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import { scheduleSchema, updateScheduleSchema } from '../schemas/scheduleSchema.js';
import type { AuthenticatedRequest } from '../types/index.js';
import { createNotification } from './notificationController.js';
import { formatFullName } from '../utils/nameUtils.js';

const convertTo24Hour = (time12h: string): string => {
  const [time, modifier] = time12h.split(' ');
  if (!time || !modifier) return time12h;
  const [hoursStr, minutes] = time.split(':');
  let hours = hoursStr;
  if (hours === '12') hours = '00';
  if (modifier.toUpperCase() === 'PM') hours = String(parseInt(hours, 10) + 12);
  return `${hours.padStart(2, '0')}:${minutes}:00`;
};

const getDayName = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { weekday: 'long' });
};

export const getSchedules = async (_req: Request, res: Response): Promise<void> => {
  try {
    const result = await db.select({
      id: schedules.id,
      employeeId: schedules.employeeId,
      dayOfWeek: schedules.dayOfWeek,
      startTime: schedules.startTime,
      endTime: schedules.endTime,
      firstName: authentication.firstName,
      lastName: authentication.lastName,
      middleName: authentication.middleName,
      suffix: authentication.suffix,
      department: authentication.department
    })
    .from(schedules)
    .leftJoin(authentication, eq(schedules.employeeId, authentication.employeeId));
    
    const formattedSchedules = result.map(s => ({
        ...s,
        employeeName: formatFullName(s.lastName, s.firstName, s.middleName, s.suffix)
    }));

    res.json({ success: true, schedules: formattedSchedules });
  } catch (_error) {

    res.status(500).json({ success: false, message: 'Failed to fetch schedules' });
  }
};

export const createSchedule = async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const senderId = authReq.user?.employeeId || null;

    const validation = scheduleSchema.safeParse(req.body);
    
    if (!validation.success) {
      res.status(400).json({ 
        success: false,
        message: 'Validation Error', 
        errors: validation.error.format() 
      });
      return;
    }

    const { employeeId, startDate, startTime, endTime, repeat, title } = validation.data;
    
    const daysToSet: string[] = [];
    
    if (repeat === 'daily') {
      // Mon-Fri
      daysToSet.push('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday');
    } else if (repeat === 'weekly') {
        const startDay = getDayName(startDate || '');
        daysToSet.push(startDay);
    } else {
        // Default behavior for 'none' or 'monthly': Set for the specific day of start_date
        const startDay = getDayName(startDate || '');
        daysToSet.push(startDay);
    }

    const startTime24 = convertTo24Hour(startTime || '');
    const endTime24 = convertTo24Hour(endTime || '');

    const queries = daysToSet.map(day => {
      return db.insert(schedules).values({
        employeeId: employeeId,
        dayOfWeek: day,
        startTime: startTime24,
        endTime: endTime24
      }).onDuplicateKeyUpdate({
        set: {
          startTime: startTime24,
          endTime: endTime24
        }
      });
    });

    await Promise.all(queries);

    // Send notification to the employee
    try {
      await createNotification({
        recipientId: employeeId,
        senderId: senderId,
        title: 'New Schedule Assigned',
        message: `A new schedule "${title || 'Work Schedule'}" has been assigned to you. Details: ${startTime} - ${endTime} (${repeat === 'none' ? 'One-time' : repeat}).`,
        type: 'schedule',
        referenceId: null 
      });
    } catch (_notifError) {
      /* empty */

    }

    res.status(201).json({ success: true, message: 'Schedule created/updated successfully' });
  } catch (_error) {

    res.status(500).json({ success: false, message: 'Failed to create schedule' });
  }
};

export const updateSchedule = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const validation = updateScheduleSchema.safeParse(req.body);

        if (!validation.success) {
             res.status(400).json({ success: false, message: 'Validation Error', errors: validation.error.format() });
             return;
        }
    
        const { startTime, endTime } = validation.data;
        const startTime24 = convertTo24Hour(startTime || '');
        const endTime24 = convertTo24Hour(endTime || '');
        
        await db.update(schedules)
            .set({ startTime: startTime24, endTime: endTime24 })
            .where(eq(schedules.id, Number(id)));

        res.json({ success: true, message: 'Schedule updated successfully' });
    } catch (_error) {

        res.status(500).json({ success: false, message: 'Failed to update schedule' });
    }
};

export const deleteSchedule = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        await db.delete(schedules).where(eq(schedules.id, Number(id)));
        res.json({ success: true, message: 'Schedule deleted successfully' });
    } catch (_error) {

        res.status(500).json({ success: false, message: 'Failed to delete schedule' });
    }
};

