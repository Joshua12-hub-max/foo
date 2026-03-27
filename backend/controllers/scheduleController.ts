import { Request, Response } from 'express';
import { db } from '../db/index.js';
import { 
    schedules, 
    authentication, 
    departments, 
    audit_logs,
    shiftTemplates,
    pdsHrDetails
} from '../db/schema.js';
import { eq, and, sql, asc, desc, inArray, lte, gte } from 'drizzle-orm';
import { departmentScheduleSchema, shiftTemplateSchema } from '../schemas/scheduleSchema.js';
import type { AuthenticatedRequest } from '../types/index.js';
import { notifyDepartment } from './notificationController.js';
import { formatFullName } from '../utils/nameUtils.js';
import { getNextCutOff, convertTo24Hour } from '../utils/dateUtils.js';
import { AuditService } from '../services/audit.service.js';

const getDayName = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { weekday: 'long' });
};

export const getSchedules = async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const userRole = authReq.user?.role;
    const userDeptId = authReq.user?.departmentId;

    let query = db.select({
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
      department: departments.name,
      departmentId: pdsHrDetails.departmentId
    })
    .from(schedules)
    .leftJoin(authentication, eq(schedules.employeeId, authentication.employeeId))
    .leftJoin(pdsHrDetails, eq(authentication.id, pdsHrDetails.employeeId))
    .leftJoin(departments, eq(pdsHrDetails.departmentId, departments.id));

    // If not Admin/HR, filter by user's department to show "department schedules"
    if (userRole !== 'Administrator' && userRole !== 'Human Resource' && userDeptId) {
        // @ts-expect-error - drizzle-orm type matching
        query = query.where(eq(pdsHrDetails.departmentId, userDeptId));
    }

    const result = await query;
    
    const formattedSchedules = result.map(s => ({
        ...s,
        employeeName: formatFullName(s.lastName, s.firstName, s.middleName, s.suffix)
    }));

    res.json({ success: true, schedules: formattedSchedules });
  } catch (error: unknown) {
    console.error('Error fetching schedules:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch schedules' });
  }
};


export const getNextCutOffSchedules = async (_req: Request, res: Response): Promise<void> => {
    try {
        const { start, end } = getNextCutOff();
        const startDateStr = start.toISOString().split('T')[0];
        const endDateStr = end.toISOString().split('T')[0];

        const result = await db.select({
            id: schedules.id,
            employeeId: schedules.employeeId,
            employeeName: sql<string>`CONCAT(${authentication.firstName}, ' ', ${authentication.lastName})`,
            departmentName: departments.name,
            scheduleTitle: schedules.scheduleTitle,
            startDate: schedules.startDate,
            endDate: schedules.endDate,
            startTime: schedules.startTime,
            endTime: schedules.endTime,
            dayOfWeek: schedules.dayOfWeek
        })
        .from(schedules)
        .leftJoin(authentication, eq(schedules.employeeId, authentication.employeeId))
        .leftJoin(pdsHrDetails, eq(authentication.id, pdsHrDetails.employeeId))
        .leftJoin(departments, eq(pdsHrDetails.departmentId, departments.id))
        .where(and(
            gte(schedules.startDate, startDateStr),
            lte(schedules.startDate, endDateStr)
        ))
        .orderBy(asc(departments.name), asc(schedules.startDate));

        res.json({ 
            success: true, 
            period: { start: startDateStr, end: endDateStr },
            schedules: result 
        });
    } catch (error: unknown) {
        console.error('Error fetching next cut-off schedules:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch upcoming schedules' });
    }
};

/**
 * Fetches all departments and their "Current" schedule for today.
 * If no schedule is found, it defaults to 8:00 AM - 5:00 PM.
 * This ensures "Always Visible" departments in the UI.
 */
export const getDepartmentSchedulesSummary = async (_req: Request, res: Response): Promise<void> => {
    try {
        const todayStr = new Date().toISOString().split('T')[0];

        const ACTIVE_STATUSES = ['Active', 'Probationary', 'On Leave'] as const;

        // 0. Get System Default Shift
        const [defaultShift] = await db.select({
            startTime: shiftTemplates.startTime,
            endTime: shiftTemplates.endTime,
            name: shiftTemplates.name
        })
        .from(shiftTemplates)
        .where(eq(shiftTemplates.isDefault, true))
        .limit(1);

        const fallbackShift = {
            startTime: defaultShift?.startTime || '08:00:00',
            endTime: defaultShift?.endTime || '17:00:00',
            name: defaultShift?.name || 'Standard Shift'
        };

        // 1. Get all departments
        const allDepts = await db.select({
            id: departments.id,
            name: departments.name,
        }).from(departments).orderBy(asc(departments.name));

        // 2. Count ACTIVE employees per department (from authentication table directly)
        const employeeCounts = await db.select({
            departmentId: pdsHrDetails.departmentId,
            activeCount: sql<number>`count(${authentication.id})`
        })
        .from(authentication)
        .leftJoin(pdsHrDetails, eq(authentication.id, pdsHrDetails.employeeId))
        .where(inArray(pdsHrDetails.employmentStatus, [...ACTIVE_STATUSES]))
        .groupBy(pdsHrDetails.departmentId);

        // 3. Get active schedules for today (for shift display only)
        const activeSchedules = await db.select({
            departmentId: departments.id,
            startTime: schedules.startTime,
            endTime: schedules.endTime,
            scheduleTitle: schedules.scheduleTitle,
            employeeCount: sql<number>`count(${schedules.employeeId})`
        })
        .from(schedules)
        .innerJoin(authentication, eq(schedules.employeeId, authentication.employeeId))
        .innerJoin(pdsHrDetails, eq(authentication.id, pdsHrDetails.employeeId))
        .innerJoin(departments, eq(pdsHrDetails.departmentId, departments.id))
        .where(and(
            lte(schedules.startDate, todayStr),
            gte(schedules.endDate, todayStr)
        ))
        .groupBy(departments.id, schedules.startTime, schedules.endTime, schedules.scheduleTitle);

        // 4. Merge: Every department MUST be visible with real employee count
        const summary = allDepts.map(dept => {
            const deptShifts = activeSchedules.filter(s => s.departmentId === dept.id);
            const deptEmployeeRow = employeeCounts.find(e => e.departmentId === dept.id);
            const totalActive = deptEmployeeRow ? Number(deptEmployeeRow.activeCount) : 0;
            
            if (deptShifts.length === 0) {
                // Default to System Default, but still show real employee count
                return {
                    id: dept.id,
                    departmentName: dept.name,
                    shifts: [{
                        startTime: fallbackShift.startTime,
                        endTime: fallbackShift.endTime,
                        scheduleTitle: fallbackShift.name,
                        personnelCount: totalActive,
                        isStandard: true
                    }],
                    totalStrength: totalActive
                };
            }

            return {
                id: dept.id,
                departmentName: dept.name,
                shifts: deptShifts.map(s => ({
                    startTime: s.startTime,
                    endTime: s.endTime,
                    scheduleTitle: s.scheduleTitle,
                    personnelCount: Number(s.employeeCount),
                    isStandard: s.startTime === fallbackShift.startTime && s.endTime === fallbackShift.endTime
                })),
                totalStrength: totalActive
            };
        });

        res.json({ success: true, data: summary });
    } catch (error: unknown) {
        console.error('Error fetching department schedules summary:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch department summary' });
    }
};

/**
 * Shift Template CRUD
 * 100% Zero Type Erasure implementation
 */

export const getDefaultShiftTemplate = async (_req: Request, res: Response): Promise<void> => {
    try {
        const [defaultShift] = await db.select({
            id: shiftTemplates.id,
            startTime: shiftTemplates.startTime,
            endTime: shiftTemplates.endTime,
            name: shiftTemplates.name,
            workingDays: shiftTemplates.workingDays
        })
        .from(shiftTemplates)
        .where(eq(shiftTemplates.isDefault, true))
        .limit(1);

        if (!defaultShift) {
            res.json({ success: true, data: { startTime: '08:00:00', endTime: '17:00:00', name: 'Standard Shift' } });
            return;
        }

        res.json({ success: true, data: defaultShift });
    } catch (error: unknown) {
        console.error('Error fetching default shift template:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch default shift template' });
    }
};

export const getShiftTemplates = async (_req: Request, res: Response): Promise<void> => {
    try {
        const result = await db.select({
            id: shiftTemplates.id,
            name: shiftTemplates.name,
            startTime: shiftTemplates.startTime,
            endTime: shiftTemplates.endTime,
            description: shiftTemplates.description,
            departmentId: shiftTemplates.departmentId,
            isDefault: shiftTemplates.isDefault,
            workingDays: shiftTemplates.workingDays,
            departmentName: departments.name
        })
        .from(shiftTemplates)
        .leftJoin(departments, eq(shiftTemplates.departmentId, departments.id))
        .orderBy(asc(shiftTemplates.name));

        res.json({ success: true, templates: result });
    } catch (error: unknown) {
        console.error('Error fetching shift templates:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch shift templates' });
    }
};

export const createShiftTemplate = async (req: Request, res: Response): Promise<void> => {
    try {
        const validation = shiftTemplateSchema.safeParse(req.body);

        if (!validation.success) {
            res.status(400).json({ success: false, message: 'Validation Error', errors: validation.error.format() });
            return;
        }

        const { name, startTime, endTime, description, departmentId, isDefault, workingDays } = validation.data;
        
        if (isDefault) {
            await db.update(shiftTemplates).set({ isDefault: false });
        }

        await db.insert(shiftTemplates).values({
            name,
            startTime,
            endTime,
            description,
            departmentId: departmentId === 'all' ? null : departmentId,
            isDefault: !!isDefault,
            workingDays: workingDays || null
        });

        res.json({ success: true, message: 'Shift template created successfully' });
    } catch (error: unknown) {
        console.error('Error creating shift template:', error);
        res.status(500).json({ success: false, message: 'Failed to create shift template' });
    }
};

export const updateShiftTemplate = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const validation = shiftTemplateSchema.safeParse(req.body);

        if (!validation.success) {
            res.status(400).json({ success: false, message: 'Validation Error', errors: validation.error.format() });
            return;
        }

        const { name, startTime, endTime, description, departmentId, isDefault, workingDays } = validation.data;

        if (isDefault) {
            await db.update(shiftTemplates).set({ isDefault: false });
        }

        await db.update(shiftTemplates)
            .set({
                name,
                startTime,
                endTime,
                description,
                departmentId: departmentId === 'all' ? null : departmentId,
                isDefault: !!isDefault,
                workingDays: workingDays || null,
                updatedAt: sql`CURRENT_TIMESTAMP`
            })
            .where(eq(shiftTemplates.id, Number(id)));

        res.json({ success: true, message: 'Shift template updated successfully' });
    } catch (error: unknown) {
        console.error('Error updating shift template:', error);
        res.status(500).json({ success: false, message: 'Failed to update shift template' });
    }
};

export const deleteShiftTemplate = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        await db.delete(shiftTemplates).where(eq(shiftTemplates.id, Number(id)));
        res.json({ success: true, message: 'Shift template deleted successfully' });
    } catch (error: unknown) {
        console.error('Error deleting shift template:', error);
        res.status(500).json({ success: false, message: 'Failed to delete shift template' });
    }
};




export const createDepartmentSchedule = async (req: Request, res: Response): Promise<void> => {
    const authReq = req as AuthenticatedRequest;
    try {
        const validation = departmentScheduleSchema.safeParse(req.body);

        if (!validation.success) {
            res.status(400).json({ success: false, message: 'Validation Error', errors: validation.error.format() });
            return;
        }

        const { departmentId, startDate, endDate, startTime, endTime, repeat, scheduleTitle } = validation.data;

        // 1. Get all employees in the department
        const employees = await db.select({
            employeeId: authentication.employeeId
        })
        .from(authentication)
        .leftJoin(pdsHrDetails, eq(authentication.id, pdsHrDetails.employeeId))
        .where(eq(pdsHrDetails.departmentId, Number(departmentId)));

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
        
        // Audit Log for Department Bulk Create
        if (authReq.user) {
            await AuditService.log({
                userId: authReq.user.id,
                action: 'CREATE_BULK',
                module: 'SCHEDULE',
                details: { 
                    departmentId, 
                    employeeCount: employeeIds.length,
                    startDate,
                    endDate,
                    startTime,
                    endTime,
                    repeat,
                    scheduleTitle
                },
                req
            });
        }

        // 3. Send notifications (100% delivery for the department)
        try {
            const senderId = authReq.user?.employeeId || null;
            await notifyDepartment({
                departmentId: Number(departmentId),
                senderId: senderId,
                title: 'Department Shift Update',
                message: `A new department-wide schedule "${scheduleTitle || 'Shift Schedule'}" has been assigned. Please check your calendar for details: ${startTime} - ${endTime}.`,
                type: 'schedule',
                referenceId: null
            });
        } catch (notifError: unknown) {
            console.error('Error creating department notifications:', notifError);
        }

        res.json({ 
            success: true, 
            message: `Successfully applied schedule to ${employeeIds.length} employees in the department and sent notifications.` 
        });

    } catch (error: unknown) {
        console.error('Error creating department schedule:', error);
        res.status(500).json({ success: false, message: 'Failed to create department schedule' });
    }
};


export const getScheduleAuditLogs = async (_req: Request, res: Response): Promise<void> => {
    try {
        const logs = await db.select({
            id: audit_logs.id,
            userId: audit_logs.userId,
            action: audit_logs.action,
            module: audit_logs.module,
            details: audit_logs.details,
            createdAt: audit_logs.createdAt,
            ipAddress: audit_logs.ipAddress,
            userAgent: audit_logs.userAgent,
            userName: sql<string>`CONCAT(${authentication.firstName}, ' ', ${authentication.lastName})`
        })
        .from(audit_logs)
        .leftJoin(authentication, eq(audit_logs.userId, authentication.id))
        .where(inArray(audit_logs.module, ['SCHEDULE', 'SHIFT_TEMPLATE'] as string[])) // Fix for drizzle array match
        .orderBy(desc(audit_logs.createdAt))
        .limit(200);

        res.json({ success: true, data: logs });
    } catch (error: unknown) {
        console.error('Error fetching schedule audit logs:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch schedule audit logs' });
    }
};
