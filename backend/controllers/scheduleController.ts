import { Request, Response } from 'express';
import { db } from '../db/index.js';
import { departments, schedules, authentication, shiftTemplates } from '../db/schema.js';
import { eq, and, sql, asc, ne } from 'drizzle-orm';
import { scheduleSchema, updateScheduleSchema } from '../schemas/scheduleSchema.js';
import type { AuthenticatedRequest } from '../types/index.js';
import { createNotification } from './notificationController.js';
import { formatFullName } from '../utils/nameUtils.js';

const convertTo24Hour = (time12h: string): string => {
  if (!time12h) return '00:00:00';
  const [time, modifier] = time12h.split(' ');
  if (!time || !modifier) {
      // Check if it's already in 24h format but might be HH:mm
      if (time12h.includes(':') && !time12h.includes(' ')) {
          return time12h.length === 5 ? `${time12h}:00` : time12h;
      }
      return time12h;
  }
  const [hoursStr, minutes] = time.split(':');
  let hours = parseInt(hoursStr, 10);
  if (hours === 12) hours = 0;
  if (modifier.toUpperCase() === 'PM') hours += 12;
  return `${String(hours).padStart(2, '0')}:${minutes}:00`;
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
      startDate: schedules.startDate,
      endDate: schedules.endDate,
      scheduleTitle: schedules.scheduleTitle,
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
  } catch (error) {
    console.error('Error fetching schedules:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch schedules' });
  }
};

export const getDepartmentSchedules = async (_req: Request, res: Response): Promise<void> => {
    try {
        const result = await db.select({
            id: departments.id,
            departmentName: departments.name,
            employeeId: authentication.employeeId,
            employeeName: sql<string>`CONCAT(${authentication.firstName}, ' ', ${authentication.lastName})`,
            startTime: authentication.startTime,
            endTime: authentication.endTime
        })
        .from(departments)
        .innerJoin(authentication, eq(authentication.departmentId, departments.id))
        .where(and(
            ne(authentication.startTime, ''),
            ne(authentication.endTime, '')
        ))
        .orderBy(asc(departments.name), asc(authentication.lastName));

        res.json({ success: true, schedules: result });
    } catch (error) {
        console.error('Error fetching department schedules:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch department schedules' });
    }
};

export const getShiftTemplates = async (_req: Request, res: Response): Promise<void> => {
    try {
        const result = await db.select({
            id: shiftTemplates.id,
            name: shiftTemplates.name,
            startTime: shiftTemplates.startTime,
            endTime: shiftTemplates.endTime,
            departmentId: shiftTemplates.departmentId,
            departmentName: departments.name,
            employeeId: shiftTemplates.employeeId,
            employeeName: sql<string>`CONCAT(${authentication.firstName}, ' ', ${authentication.lastName})`,
            description: shiftTemplates.description,
            createdAt: shiftTemplates.createdAt,
            updatedAt: shiftTemplates.updatedAt
        })
        .from(shiftTemplates)
        .leftJoin(departments, eq(shiftTemplates.departmentId, departments.id))
        .leftJoin(authentication, eq(shiftTemplates.employeeId, authentication.employeeId));

        console.warn(`[DEBUG] Fetched ${result.length} shift templates for API`);
        res.json({ success: true, templates: result });
    } catch (error) {
        console.error('[ERROR] Failed to fetch shift templates:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch shift templates' });
    }
};

export const createShiftTemplate = async (req: Request, res: Response): Promise<void> => {
    try {
        const { name, startTime, endTime, description, departmentId, employeeId } = req.body;
        console.log('[DEBUG] createShiftTemplate request:', { name, startTime, endTime, departmentId, employeeId });
        if (!name || !startTime || !endTime) {
            res.status(400).json({ success: false, message: 'Missing required fields' });
            return;
        }
        await db.insert(shiftTemplates).values({ 
            name, 
            startTime, 
            endTime, 
            description, 
            departmentId: departmentId ? Number(departmentId) : null,
            employeeId: employeeId || null
        });
        console.log('[DEBUG] Shift template created successfully');
        res.status(201).json({ success: true, message: 'Shift template created successfully' });
    } catch (error) {
        console.error('[ERROR] createShiftTemplate error:', error);
        res.status(500).json({ success: false, message: 'Failed to create shift template' });
    }
};

export const updateShiftTemplate = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const { name, startTime, endTime, description, departmentId, employeeId } = req.body;
        console.log('[DEBUG] updateShiftTemplate request for ID:', id, { departmentId, employeeId });
        await db.update(shiftTemplates)
            .set({ 
                name, 
                startTime, 
                endTime, 
                description, 
                departmentId: departmentId ? Number(departmentId) : null,
                employeeId: employeeId || null
            })
            .where(eq(shiftTemplates.id, Number(id)));
        console.log('[DEBUG] Shift template updated successfully');
        res.json({ success: true, message: 'Shift template updated successfully' });
    } catch (error) {
        console.error('[ERROR] updateShiftTemplate error:', error);
        res.status(500).json({ success: false, message: 'Failed to update shift template' });
    }
};

export const deleteShiftTemplate = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        console.log('[DEBUG] deleteShiftTemplate request for ID:', id);
        await db.delete(shiftTemplates).where(eq(shiftTemplates.id, Number(id)));
        console.log('[DEBUG] Shift template deleted successfully');
        res.json({ success: true, message: 'Shift template deleted successfully' });
    } catch (error) {
        console.error('[ERROR] deleteShiftTemplate error:', error);
        res.status(500).json({ success: false, message: 'Failed to delete shift template' });
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

    const { employeeId, startDate, endDate, startTime, endTime, repeat, title } = validation.data;
    
    const daysToSet: string[] = [];
    
    if (repeat === 'daily') {
      // Mon-Fri
      daysToSet.push('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday');
    } else {
        const startDay = getDayName(startDate || '');
        daysToSet.push(startDay);
    }

    const startTime24 = convertTo24Hour(startTime || '');
    const endTime24 = convertTo24Hour(endTime || '');

    const queries = daysToSet.map(day => {
      return db.insert(schedules).values({
        employeeId: employeeId,
        scheduleTitle: title || 'Regular Schedule',
        startDate: startDate,
        endDate: endDate,
        dayOfWeek: day,
        startTime: startTime24,
        endTime: endTime24
      }).onDuplicateKeyUpdate({
        set: {
          startTime: startTime24,
          endTime: endTime24,
          scheduleTitle: title || 'Regular Schedule',
          startDate: startDate,
          endDate: endDate
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
    } catch (notifError) {
      console.error('Error creating notification:', notifError);
    }

    res.status(201).json({ success: true, message: 'Schedule created successfully' });
  } catch (error) {
    console.error('Error creating schedule:', error);
    res.status(500).json({ success: false, message: 'Failed to create schedule' });
  }
};

export const createDepartmentSchedule = async (req: Request, res: Response): Promise<void> => {
    try {
        const authReq = req as AuthenticatedRequest;
        const senderId = authReq.user?.employeeId || null;
        
        const { departmentId, startDate, endDate, startTime, endTime, repeat, scheduleTitle } = req.body;

        if (!departmentId || !startDate || !endDate || !startTime || !endTime) {
            res.status(400).json({ success: false, message: 'Missing required fields' });
            return;
        }

        // 1. Get all employees in the department
        const employees = await db.select({
            employeeId: authentication.employeeId
        })
        .from(authentication)
        .where(eq(authentication.departmentId, Number(departmentId)));

        if (employees.length === 0) {
            res.status(404).json({ success: false, message: 'No employees found in this department' });
            return;
        }

        const employeeIds = employees.map(e => e.employeeId).filter((id): id is string => id !== null);
        
        const daysToSet: string[] = [];
        if (repeat === 'daily') {
            daysToSet.push('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday');
        } else {
            const startDay = getDayName(startDate);
            daysToSet.push(startDay);
        }

        const startTime24 = convertTo24Hour(startTime);
        const endTime24 = convertTo24Hour(endTime);

        // 2. Insert schedules for all employees
        const insertPromises = [];
        for (const employeeId of employeeIds) {
            for (const day of daysToSet) {
                insertPromises.push(
                    db.insert(schedules).values({
                        employeeId: employeeId,
                        scheduleTitle: scheduleTitle || 'Department Schedule',
                        startDate: startDate,
                        endDate: endDate,
                        dayOfWeek: day,
                        startTime: startTime24,
                        endTime: endTime24,
                        repeatPattern: repeat === 'daily' ? 'Weekly' : 'Once'
                    }).onDuplicateKeyUpdate({
                        set: {
                            startTime: startTime24,
                            endTime: endTime24,
                            scheduleTitle: scheduleTitle || 'Department Schedule',
                            startDate: startDate,
                            endDate: endDate
                        }
                    })
                );
            }
        }

        await Promise.all(insertPromises);

        // 3. Send notifications (bulk or individually)
        // For simplicity, we can just return success for now or implement bulk notification
        
        res.json({ 
            success: true, 
            message: `Successfully applied schedule to ${employeeIds.length} employees in the department.` 
        });

    } catch (error) {
        console.error('Error creating department schedule:', error);
        res.status(500).json({ success: false, message: 'Failed to create department schedule' });
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
    } catch (error) {
        console.error('Error updating schedule:', error);
        res.status(500).json({ success: false, message: 'Failed to update schedule' });
    }
};

export const deleteSchedule = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        await db.delete(schedules).where(eq(schedules.id, Number(id)));
        res.json({ success: true, message: 'Schedule deleted successfully' });
    } catch (error) {
        console.error('Error deleting schedule:', error);
        res.status(500).json({ success: false, message: 'Failed to delete schedule' });
    }
};
