import { Request, Response } from 'express';

import { db } from '../db/index.js';
import { dailyTimeRecords, authentication, dtrCorrections, departments, schedules, bioEnrolledUsers, attendanceLogs, bioAttendanceLogs, shiftTemplates, pdsHrDetails } from '../db/schema.js';
import { eq, and, desc, gte, lte, count, sql, between, like } from 'drizzle-orm';
import { UpdateDTRSchema, RequestCorrectionSchema } from '../schemas/dtrSchema.js';
import { AuthenticatedRequest } from '../types/index.js';
import { updateTardinessSummary } from '../utils/tardinessUtils.js';
import { createNotification, notifyAdmins, updateNotificationsByReference } from './notificationController.js';
import { DTRApiResponse } from '../types/attendance.js';
import { formatToManilaDateTime, normalizeToIsoDate } from "../utils/dateUtils.js";
import { formatFullName } from "../utils/nameUtils.js";
import { compareIds, normalizeIdJs } from "../utils/idUtils.js";
import { internalPolicies } from '../db/schema.js';
import { calculateLateUndertime, determineStatus } from '../utils/attendanceUtils.js';
import { ATTENDANCE_STATUS } from '../constants/statusConstants.js';

/** Shape returned by the getAllRecords db.select() query */
interface DTRRecordRow {
  id: number;
  employeeId: string;
  date: string;
  timeIn: string | Date | null;
  timeOut: string | Date | null;
  lateMinutes: number | null;
  undertimeMinutes: number | null;
  overtimeMinutes?: number | null;
  status: string | null;
  createdAt: string | Date | null;
  updatedAt: string | Date | null;
  employeeName: string;
  firstName: string;
  lastName: string;
  middleName: string | null;
  suffix: string | null;
  department: string;
  dutyType: string;
  duties: string;
  shift: string;
  correctionId: number | null;
  correctionStatus: string | null;
  correctionReason: string | null;
  correctionTimeIn: string | Date | null;
  correctionTimeOut: string | Date | null;
}

const toMySQLDatetime = (isoStr: string | null | undefined): string | null => {
  if (!isoStr) return null;
  try {
    const date = new Date(isoStr);
    if (isNaN(date.getTime())) return null;
    return formatToManilaDateTime(date);
  } catch (_e: unknown) {
    return null;
  }
};

const toTitleCase = (str: string) => str.replace(/\w\S*/g, txt => txt.charAt(0).toUpperCase() + txt.substring(1).toLowerCase());

const mapToDtrApi = (record: DTRRecordRow & { dutyType?: string; shift?: string }): DTRApiResponse => {
    return {
        id: record.id,
        employeeId: record.employeeId,
        date: record.date ? new Date(record.date).toISOString().split('T')[0] : '',
        timeIn: record.timeIn ? formatToManilaDateTime(record.timeIn) : null,
        timeOut: record.timeOut ? formatToManilaDateTime(record.timeOut) : null,
        lateMinutes: record.lateMinutes ?? 0,
        undertimeMinutes: record.undertimeMinutes ?? 0,
        overtimeMinutes: record.overtimeMinutes ?? 0,
        status: record.status || ATTENDANCE_STATUS.PENDING,
        createdAt: record.createdAt ? new Date(record.createdAt).toISOString() : null,
        updatedAt: record.updatedAt ? new Date(record.updatedAt).toISOString() : null,
        employeeName: record.employeeName || 'Unknown Employee',
        firstName: record.firstName || '',
        lastName: record.lastName || '',
        middleName: record.middleName || null,
        suffix: record.suffix || null,
        department: record.department || 'N/A',
        duties: record.duties || 'System Default',
        shift: record.shift || 'No Schedule',
        dutyType: record.dutyType || 'Standard',
        correctionId: record.correctionId,
        correctionStatus: record.correctionStatus,
        correctionReason: record.correctionReason,
        correctionTimeIn: record.correctionTimeIn ? formatToManilaDateTime(record.correctionTimeIn) : null,
        correctionTimeOut: record.correctionTimeOut ? formatToManilaDateTime(record.correctionTimeOut) : null
    };
};


export const getAllRecords = async (req: Request, res: Response): Promise<void> => {
    const authReq = req as AuthenticatedRequest;
    const user = authReq.user;
    const rawQuery = req.query;
    
    const page = Number(rawQuery.page) || 1;
    const limit = Number(rawQuery.limit) || 100;
    const queryEmployeeId = rawQuery.employeeId as string | undefined;
    const department = rawQuery.department as string | undefined;
    const startDate = rawQuery.startDate as string | undefined;
    const endDate = rawQuery.endDate as string | undefined;

    const isAdminOrHr = ['Administrator', 'Human Resource'].includes(user.role);
    
    // 100% PRECISE FILTERING: 
    // 1. If an explicit employeeId is provided (and it's not 'all'), use it strictly.
    // 2. If 'all' is explicitly provided, use 'all' (only for Admin/HR).
    // 3. IF NO ID IS PROVIDED (empty or missing):
    //    - If Admin/HR, use 'all' (This is for the Admin Portal).
    //    - If regular user, use user.employeeId (Self).
    const effectiveEmployeeId = (queryEmployeeId && queryEmployeeId !== 'all' && queryEmployeeId !== 'All Employees' && queryEmployeeId !== '') 
      ? String(queryEmployeeId) 
      : (isAdminOrHr && queryEmployeeId === 'all' ? 'all' : (isAdminOrHr && !queryEmployeeId ? 'all' : user.employeeId));

    const offset = (page - 1) * limit;

    // Normalize Dates for MySQL compatibility
    const normStartDate = normalizeToIsoDate(startDate);
    const normEndDate = normalizeToIsoDate(endDate);

    try {
        const conditions = [];

        if (effectiveEmployeeId !== 'all') {
            conditions.push(compareIds(dailyTimeRecords.employeeId, effectiveEmployeeId));
        }

        if (department && department !== 'all' && department !== 'All Departments') {
            conditions.push(like(sql`LOWER(COALESCE(${departments.name}, ${bioEnrolledUsers.department}, 'N/A'))`, `%${department.toLowerCase()}%`));
        }

        if (normStartDate && normEndDate) {
            conditions.push(between(dailyTimeRecords.date, normStartDate, normEndDate));
        } else if (normStartDate) {
            conditions.push(gte(dailyTimeRecords.date, normStartDate));
        } else if (normEndDate) {
            conditions.push(lte(dailyTimeRecords.date, normEndDate));
        }

        const records = await db.select({
            id: dailyTimeRecords.id,
            employeeId: dailyTimeRecords.employeeId,
            date: dailyTimeRecords.date,
            timeIn: dailyTimeRecords.timeIn,
            timeOut: dailyTimeRecords.timeOut,
            lateMinutes: dailyTimeRecords.lateMinutes,
            undertimeMinutes: dailyTimeRecords.undertimeMinutes,
            status: dailyTimeRecords.status,
            createdAt: dailyTimeRecords.createdAt,
            updatedAt: dailyTimeRecords.updatedAt,
            firstName: authentication.firstName,
            lastName: authentication.lastName,
            middleName: authentication.middleName,
            suffix: authentication.suffix,
            bioFullName: bioEnrolledUsers.fullName,
            department: sql<string>`COALESCE(${departments.name}, ${bioEnrolledUsers.department}, 'N/A')`,
            dutyType: sql<string>`COALESCE(${pdsHrDetails.dutyType}, 'Standard')`,
            duties: sql<string>`COALESCE(
                (SELECT schedule_title FROM schedules WHERE employee_id = ${dailyTimeRecords.employeeId} AND (start_date IS NULL OR start_date <= ${dailyTimeRecords.date}) AND (end_date IS NULL OR end_date >= ${dailyTimeRecords.date}) ORDER BY updated_at DESC LIMIT 1),
                (SELECT schedule_title FROM schedules WHERE employee_id = ${dailyTimeRecords.employeeId} AND (start_date IS NULL OR start_date <= ${dailyTimeRecords.date}) ORDER BY start_date DESC LIMIT 1),
                (SELECT name FROM shift_templates WHERE is_default = 1 LIMIT 1),
                'Standard Shift'
            )`,
            shift: sql<string>`COALESCE(
                (SELECT CONCAT(TIME_FORMAT(start_time, '%h:%i %p'), ' - ', TIME_FORMAT(end_time, '%h:%i %p')) FROM schedules WHERE employee_id = ${dailyTimeRecords.employeeId} AND (start_date IS NULL OR start_date <= ${dailyTimeRecords.date}) AND (end_date IS NULL OR end_date >= ${dailyTimeRecords.date}) ORDER BY updated_at DESC LIMIT 1),
                (SELECT CONCAT(TIME_FORMAT(start_time, '%h:%i %p'), ' - ', TIME_FORMAT(end_time, '%h:%i %p')) FROM schedules WHERE employee_id = ${dailyTimeRecords.employeeId} AND (start_date IS NULL OR start_date <= ${dailyTimeRecords.date}) ORDER BY start_date DESC LIMIT 1),
                (SELECT CONCAT(TIME_FORMAT(start_time, '%h:%i %p'), ' - ', TIME_FORMAT(end_time, '%h:%i %p')) FROM shift_templates WHERE is_default = 1 LIMIT 1),
                '08:00 AM - 05:00 PM'
            )`,
            correctionId: dtrCorrections.id,
            correctionStatus: dtrCorrections.status,
            correctionReason: dtrCorrections.reason,
            correctionTimeIn: dtrCorrections.correctedTimeIn,
            correctionTimeOut: dtrCorrections.correctedTimeOut,
        })
        .from(dailyTimeRecords)
        .leftJoin(authentication, compareIds(dailyTimeRecords.employeeId, authentication.employeeId))
        .leftJoin(pdsHrDetails, eq(authentication.id, pdsHrDetails.employeeId))
        .leftJoin(departments, eq(pdsHrDetails.departmentId, departments.id))
        .leftJoin(bioEnrolledUsers, compareIds(bioEnrolledUsers.employeeId, dailyTimeRecords.employeeId))
        .leftJoin(
            dtrCorrections,
            eq(dtrCorrections.id, sql`(
                SELECT MAX(id) FROM dtr_corrections dc 
                WHERE ${compareIds(sql`dc.employee_id`, dailyTimeRecords.employeeId)} 
                AND dc.date_time = ${dailyTimeRecords.date} 
                AND dc.status = 'Pending'
            )`)
        )
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(dailyTimeRecords.date), desc(dailyTimeRecords.timeIn))
        .limit(limit)
        .offset(offset);

        const [countResult] = await db.select({ total: count() })
            .from(dailyTimeRecords)
            .leftJoin(authentication, compareIds(dailyTimeRecords.employeeId, authentication.employeeId))
            .leftJoin(pdsHrDetails, eq(authentication.id, pdsHrDetails.employeeId))
            .leftJoin(departments, eq(pdsHrDetails.departmentId, departments.id))
            .leftJoin(bioEnrolledUsers, compareIds(bioEnrolledUsers.employeeId, dailyTimeRecords.employeeId))
            .where(conditions.length > 0 ? and(...conditions) : undefined);

        const [totalsResult] = await db.select({
            totalLate: sql<string>`SUM(COALESCE(${dailyTimeRecords.lateMinutes}, 0))`,
            totalUndertime: sql<string>`SUM(COALESCE(${dailyTimeRecords.undertimeMinutes}, 0))`,
            totalSeconds: sql<string>`SUM(
                COALESCE(
                    CASE 
                        WHEN TIMESTAMPDIFF(SECOND, ${dailyTimeRecords.timeIn}, ${dailyTimeRecords.timeOut}) > 18000 
                        THEN TIMESTAMPDIFF(SECOND, ${dailyTimeRecords.timeIn}, ${dailyTimeRecords.timeOut}) - 3600
                        ELSE TIMESTAMPDIFF(SECOND, ${dailyTimeRecords.timeIn}, ${dailyTimeRecords.timeOut})
                    END, 
                    0
                )
            )`
        })
        .from(dailyTimeRecords)
        .leftJoin(authentication, compareIds(dailyTimeRecords.employeeId, authentication.employeeId))
        .leftJoin(pdsHrDetails, eq(authentication.id, pdsHrDetails.employeeId))
        .leftJoin(departments, eq(pdsHrDetails.departmentId, departments.id))
        .leftJoin(bioEnrolledUsers, compareIds(bioEnrolledUsers.employeeId, dailyTimeRecords.employeeId))
        .where(conditions.length > 0 ? and(...conditions) : undefined);
            
        const total = countResult.total;

        const formattedRecords = records.map((r) => {
          const fullName = r.firstName && r.lastName 
            ? formatFullName(r.lastName, r.firstName, r.middleName, r.suffix)
            : (r.bioFullName || `Employee ${normalizeIdJs(r.employeeId)}`);

          return mapToDtrApi({
            ...r,
            employeeId: normalizeIdJs(r.employeeId),
            employeeName: fullName
          } as DTRRecordRow);
        });

        res.status(200).json({
            success: true,
            data: formattedRecords,
            totals: {
                lateMinutes: Number(totalsResult?.totalLate || 0),
                undertimeMinutes: Number(totalsResult?.totalUndertime || 0),
                hoursWorked: (Number(totalsResult?.totalSeconds || 0) / 3600).toFixed(2)
            },
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (_err: unknown) {
        res.status(500).json({ message: 'Something went wrong!' });
    }
};

/** Shared helper to fetch grace period from policies */
const getGracePeriod = async (): Promise<number> => {
    try {
        const [policy] = await db.select().from(internalPolicies).where(eq(internalPolicies.category, 'tardiness')).limit(1);
        if (policy?.content) {
            const content = (typeof policy.content === 'string' ? JSON.parse(policy.content) : policy.content) as { gracePeriod?: number | string };
            return Number(content.gracePeriod) || 0;
        }
    } catch (e) {
        console.warn('[DTR] Failed to fetch grace period, defaulting to 0:', e);
    }
    return 0;
};



export const updateRecord = async (req: Request, res: Response): Promise<void> => {
  const validation = UpdateDTRSchema.safeParse(req);
  
  if (!validation.success) {
      res.status(400).json({ 
          success: false,
          message: 'Validation Error', 
          errors: validation.error.format() 
      });
      return;
  }
  
  const { id } = validation.data.params;
  const { timeIn, timeOut, status } = validation.data.body;

  try {
    const [existing] = await db.select()
        .from(dailyTimeRecords)
        .where(eq(dailyTimeRecords.id, Number(id)))
        .limit(1);

    if (!existing) {
        res.status(404).json({ success: false, message: 'DTR Record not found.' });
        return;
    }

    const dtrDate = new Date(existing.date);
    const dayName = dtrDate.toLocaleDateString('en-US', { weekday: 'long' });

    const [schedule] = await db.select()
        .from(schedules)
        .where(and(
            compareIds(schedules.employeeId, existing.employeeId),
            eq(schedules.dayOfWeek, dayName)
        ))
        .limit(1);

    const [defaultShift] = await db.select({
        startTime: shiftTemplates.startTime,
        endTime: shiftTemplates.endTime
    })
    .from(shiftTemplates)
    .where(eq(shiftTemplates.isDefault, true))
    .limit(1);

    const startStr = schedule ? schedule.startTime : (defaultShift?.startTime || '08:00:00');
    const endStr = schedule ? schedule.endTime : (defaultShift?.endTime || '17:00:00');

    const processInputTime = (inputTime: string | null | undefined, dateStr: string): string | null => {
        if (!inputTime) return null;
        const timeRegex = /^([0-1]?[0-9]|2[0-3]):([0-5][0-9])(:[0-5][0-9])?$/;
        if (timeRegex.test(inputTime)) {
             const cleanDate = new Date(dateStr).toISOString().split('T')[0];
             let cleanTime = inputTime;
             if (inputTime.split(':').length === 2) cleanTime += ':00';
             return `${cleanDate} ${cleanTime}`;
        }
        return toMySQLDatetime(inputTime);
    };

    const mysqlTimeIn = processInputTime(timeIn, existing.date);
    const mysqlTimeOut = processInputTime(timeOut, existing.date);
    const now = toMySQLDatetime(new Date().toISOString());

    const gracePeriod = await getGracePeriod();

    const { lateMinutes: calculatedLate, undertimeMinutes: calculatedUndertime } = calculateLateUndertime(
        mysqlTimeIn ? new Date(mysqlTimeIn) : null,
        mysqlTimeOut ? new Date(mysqlTimeOut) : null,
        new Date(`${existing.date} ${startStr}`),
        new Date(`${existing.date} ${endStr}`),
        gracePeriod
    );

    const newStatus = determineStatus(
        calculatedLate,
        calculatedUndertime,
        status || existing.status || ATTENDANCE_STATUS.PRESENT,
        true, // hasSchedule
        false, // isShiftActive
        !!mysqlTimeOut, // hasTimeOut
        mysqlTimeIn, // timeIn
        mysqlTimeOut // timeOut
    );

    await db.update(dailyTimeRecords)
      .set({
        timeIn: mysqlTimeIn,
        timeOut: mysqlTimeOut,
        status: newStatus,
        lateMinutes: calculatedLate,
        undertimeMinutes: calculatedUndertime,
        updatedAt: now
      })
      .where(eq(dailyTimeRecords.id, Number(id)));

    try {
        const dateStr = new Date(existing.date).toISOString().split('T')[0];
        
        await db.delete(attendanceLogs).where(and(
            compareIds(attendanceLogs.employeeId, existing.employeeId),
            eq(sql`DATE(${attendanceLogs.scanTime})`, dateStr)
        ));

        await db.delete(bioAttendanceLogs).where(and(
            compareIds(bioAttendanceLogs.employeeId, existing.employeeId),
            eq(bioAttendanceLogs.logDate, dateStr)
        ));

        const getTimeOnly = (dt: string | null): string | null => {
            if (!dt) return null;
            if (dt.includes(' ')) return dt.split(' ')[1];
            return dt;
        };

        if (mysqlTimeIn) {
            await db.insert(attendanceLogs).values({
                employeeId: existing.employeeId,
                scanTime: mysqlTimeIn,
                type: 'IN',
                source: 'MANUAL_EDIT'
            });

            await db.insert(bioAttendanceLogs).values({
                employeeId: existing.employeeId,
                cardType: 'IN',
                logDate: dateStr,
                logTime: getTimeOnly(mysqlTimeIn) || '00:00:00'
            });
        }

        if (mysqlTimeOut) {
            await db.insert(attendanceLogs).values({
                employeeId: existing.employeeId,
                scanTime: mysqlTimeOut,
                type: 'OUT',
                source: 'MANUAL_EDIT'
            });

            await db.insert(bioAttendanceLogs).values({
                employeeId: existing.employeeId,
                cardType: 'OUT',
                logDate: dateStr,
                logTime: getTimeOnly(mysqlTimeOut) || '00:00:00'
            });
        }
    } catch (syncErr) {
        console.error('[DTR-SYNC] Failed to sync manual update to biometrics:', syncErr);
    }

    await updateTardinessSummary(existing.employeeId, existing.date);

    res.status(200).json({ success: true, message: 'Record updated successfully' });
  } catch (_err: unknown) {
    res.status(500).json({ success: false, message: 'Failed to update record' });
  }
};

export const requestCorrection = async (req: Request, res: Response): Promise<void> => {
  const authReq = req as AuthenticatedRequest;
  const employeeId = authReq.user.employeeId;

  if (!employeeId) {
    res.status(401).json({ success: false, message: 'Unauthorized. Missing Employee ID.' });
    return;
  }

  const validation = RequestCorrectionSchema.safeParse(req);
  if (!validation.success) {
    res.status(400).json({ 
      success: false, 
      message: 'Validation Error', 
      errors: validation.error.format() 
    });
    return;
  }

  const { date, originalTimeIn, originalTimeOut, correctedTimeIn, correctedTimeOut, reason } = validation.data.body;

const parseTimeInput = (timeStr: string | null | undefined, dateStr: string): string | null => {
  if (!timeStr) return null;
  try {
    const datePart = new Date(dateStr).toISOString().split('T')[0];
    const time12Regex = /^(\d{1,2}):(\d{2})\s?(AM|PM)$/i;
    const match12 = timeStr.match(time12Regex);
    if (match12) {
      const [_, hours, minutes, period] = match12;
      let h = parseInt(hours, 10);
      if (period.toUpperCase() === 'PM' && h < 12) h += 12;
      if (period.toUpperCase() === 'AM' && h === 12) h = 0;
      return `${datePart} ${h.toString().padStart(2, '0')}:${minutes}:00`;
    }
    const time24Regex = /^(\d{1,2}):(\d{2})(:(\d{2}))?$/;
    if (time24Regex.test(timeStr)) {
      let cleanTime = timeStr;
      if (timeStr.split(':').length === 2) cleanTime += ':00';
      return `${datePart} ${cleanTime}`;
    }
    const d = new Date(`${dateStr} ${timeStr}`);
    if (!isNaN(d.getTime())) {
        return d.toISOString().replace('T', ' ').split('.')[0];
    }
    return null;
  } catch (_e) {
    return null;
  }
};

  try {
    const dbOriginalIn = parseTimeInput(originalTimeIn, date);
    const dbOriginalOut = parseTimeInput(originalTimeOut, date);
    const dbCorrectedIn = parseTimeInput(correctedTimeIn, date);
    const dbCorrectedOut = parseTimeInput(correctedTimeOut, date);

    const [result] = await db.insert(dtrCorrections).values({
      employeeId,
      dateTime: date,
      originalTimeIn: dbOriginalIn,
      originalTimeOut: dbOriginalOut,
      correctedTimeIn: dbCorrectedIn,
      correctedTimeOut: dbCorrectedOut,
      reason,
      status: 'Pending'
    });

    const correctionId = result.insertId;

    try {
      const userRole = authReq.user?.role;
      const isAdminOrHR = userRole === 'Administrator' || userRole === 'Human Resource';

      await notifyAdmins({
        senderId: employeeId,
        title: 'New DTR Correction Request',
        message: `Employee ${employeeId} has requested a DTR correction for ${date}. Status: Pending`,
        type: 'dtr_request',
        referenceId: correctionId,
        excludeId: employeeId 
      });

      await createNotification({
        recipientId: employeeId,
        senderId: isAdminOrHR ? employeeId : null,
        title: isAdminOrHR ? 'New DTR Correction Request' : 'DTR Correction Request Submitted',
        message: isAdminOrHR 
          ? `You have submitted a DTR correction for ${date}. Status: Pending` 
          : `Your DTR correction request for ${date} has been submitted. Status: Pending`,
        type: 'dtr_request',
        referenceId: correctionId
      });
    } catch (notifErr) {
      console.error('Failed to notify admins:', notifErr);
    }

    res.status(201).json({ 
      success: true, 
      message: 'Correction request submitted successfully. Waiting for Admin approval.' 
    });
  } catch (err: unknown) {
    res.status(500).json({ success: false, message: 'Failed to submit correction request' });
  }
};

import { UpdateCorrectionStatusSchema } from '../schemas/dtrSchema.js';

export const getCorrectionRequests = async (req: Request, res: Response): Promise<void> => {
  try {
    const { status } = req.query;
    const conditions = [];
    if (status && typeof status === 'string' && status !== 'All') {
        conditions.push(eq(dtrCorrections.status, status as 'Pending' | 'Approved' | 'Rejected'));
    }
    
    const requests = await db.select({
        id: dtrCorrections.id,
        employeeId: dtrCorrections.employeeId,
        firstName: authentication.firstName,
        lastName: authentication.lastName,
        bioFullName: bioEnrolledUsers.fullName,
        date: dtrCorrections.dateTime,
        originalTimeIn: dtrCorrections.originalTimeIn,
        originalTimeOut: dtrCorrections.originalTimeOut,
        correctedTimeIn: dtrCorrections.correctedTimeIn,
        correctedTimeOut: dtrCorrections.correctedTimeOut,
        reason: dtrCorrections.reason,
        status: dtrCorrections.status,
        rejectionReason: dtrCorrections.rejectionReason,
        createdAt: dtrCorrections.createdAt
    })
    .from(dtrCorrections)
    .leftJoin(authentication, compareIds(dtrCorrections.employeeId, authentication.employeeId))
    .leftJoin(bioEnrolledUsers, compareIds(bioEnrolledUsers.employeeId, dtrCorrections.employeeId))
    .where(and(...conditions))
    .orderBy(desc(dtrCorrections.createdAt));
    
    const formattedRequests = requests.map(req => {
        let name = "Unknown Employee";
        if (req.firstName && req.lastName) {
            name = `${toTitleCase(req.lastName)}, ${toTitleCase(req.firstName)}`;
        } else if (req.bioFullName) {
            name = req.bioFullName;
        } else {
            name = `Employee ${req.employeeId}`;
        }
        return { ...req, employeeName: name };
    });

    res.json({
        success: true,
        data: formattedRequests
    });
  } catch (_error: unknown) {
    res.status(500).json({ success: false, message: 'Failed to fetch correction requests' });
  }
};


export const updateCorrectionStatus = async (req: Request, res: Response): Promise<void> => {
  const validation = UpdateCorrectionStatusSchema.safeParse(req);
  if (!validation.success) {
      res.status(400).json({ 
          success: false, 
          message: 'Validation Error', 
          errors: validation.error.format() 
      });
      return;
  }

  const { ids, status, rejectionReason } = validation.data.body;
  const adminId = (req as AuthenticatedRequest).user?.employeeId || 'System';

  try {
      for (const id of ids) {
          const [request] = await db.select().from(dtrCorrections).where(eq(dtrCorrections.id, id)).limit(1);
          if (!request) continue;

          if (status === 'Rejected') {
              await db.update(dtrCorrections)
                  .set({ 
                      status: 'Rejected', 
                      rejectionReason, 
                      approvedBy: adminId,
                      updatedAt: toMySQLDatetime(new Date().toISOString())
                  })
                  .where(eq(dtrCorrections.id, id));

              try {
                await updateNotificationsByReference({
                  type: 'dtr_request',
                  referenceId: id,
                  title: 'DTR Correction Rejected',
                  message: `DTR correction request for ${request.employeeId} on ${request.dateTime} has been rejected. Reason: ${rejectionReason || 'No reason provided.'}`,
                  newType: 'dtr_rejection'
                });
              } catch (nErr) { console.error('Notification Update Error:', nErr); }

          } else if (status === 'Approved') {
              const [dtr] = await db.select().from(dailyTimeRecords).where(and(
                  compareIds(dailyTimeRecords.employeeId, request.employeeId),
                  eq(dailyTimeRecords.date, request.dateTime)
              ));

            const dtrDate = new Date(request.dateTime);
            const dayName = dtrDate.toLocaleDateString('en-US', { weekday: 'long' });
            
            const [schedule] = await db.select().from(schedules).where(and(
                compareIds(schedules.employeeId, request.employeeId),
                eq(schedules.dayOfWeek, dayName)
            )).limit(1);

            const [defaultShift] = await db.select({
                startTime: shiftTemplates.startTime,
                endTime: shiftTemplates.endTime
            })
            .from(shiftTemplates)
            .where(eq(shiftTemplates.isDefault, true))
            .limit(1);

            const startStr = schedule ? schedule.startTime : (defaultShift?.startTime || '08:00:00');
            const endStr = schedule ? schedule.endTime : (defaultShift?.endTime || '17:00:00');
            
            const finalTimeIn = request.correctedTimeIn || request.originalTimeIn || (dtr ? dtr.timeIn : null);
            const finalTimeOut = request.correctedTimeOut || request.originalTimeOut || (dtr ? dtr.timeOut : null);

            const gracePeriod = await getGracePeriod();
            const { lateMinutes: calculatedLate, undertimeMinutes: calculatedUndertime } = calculateLateUndertime(
                finalTimeIn ? (typeof finalTimeIn === 'string' ? new Date(finalTimeIn) : finalTimeIn) : null,
                finalTimeOut ? (typeof finalTimeOut === 'string' ? new Date(finalTimeOut) : finalTimeOut) : null,
                new Date(`${request.dateTime} ${startStr}`),
                new Date(`${request.dateTime} ${endStr}`),
                gracePeriod
            );

            const newStatus = determineStatus(
                calculatedLate,
                calculatedUndertime,
                ATTENDANCE_STATUS.PRESENT,
                true, // hasSchedule
                false, // isShiftActive
                !!finalTimeOut, // hasTimeOut
                finalTimeIn, // timeIn
                finalTimeOut // timeOut
            );
            
            if (dtr) {
                await db.update(dailyTimeRecords).set({
                    timeIn: finalTimeIn,
                    timeOut: finalTimeOut,
                    lateMinutes: calculatedLate,
                    undertimeMinutes: calculatedUndertime,
                    status: newStatus,
                    updatedAt: toMySQLDatetime(new Date().toISOString())
                }).where(eq(dailyTimeRecords.id, dtr.id));
            } else {
                    await db.insert(dailyTimeRecords).values({
                    employeeId: request.employeeId,
                    date: request.dateTime,
                    timeIn: finalTimeIn,
                    timeOut: finalTimeOut,
                    lateMinutes: calculatedLate,
                    undertimeMinutes: calculatedUndertime,
                    status: newStatus
                    });
            }

            await updateTardinessSummary(request.employeeId, request.dateTime);

            try {
                const syncDate = new Date(request.dateTime);
                const dateStr = syncDate.toISOString().split('T')[0];
                
                await db.delete(attendanceLogs).where(and(
                    compareIds(attendanceLogs.employeeId, request.employeeId),
                    eq(sql`DATE(${attendanceLogs.scanTime})`, dateStr)
                ));

                await db.delete(bioAttendanceLogs).where(and(
                    compareIds(bioAttendanceLogs.employeeId, request.employeeId),
                    eq(bioAttendanceLogs.logDate, dateStr)
                ));

                const getCorrectedTime = (val: string | Date | null): string | null => {
                    if (!val) return null;
                    if (typeof val === 'string' && val.includes(' ')) return val.split(' ')[1];
                    const dateObj = new Date(val);
                    return isNaN(dateObj.getTime()) ? null : dateObj.toTimeString().split(' ')[0];
                };

                if (finalTimeIn) {
                    const timeInVal = typeof finalTimeIn === 'string' ? finalTimeIn : formatToManilaDateTime(finalTimeIn);
                    await db.insert(attendanceLogs).values({
                        employeeId: request.employeeId,
                        scanTime: timeInVal,
                        type: 'IN',
                        source: 'CORRECTION'
                    });

                    await db.insert(bioAttendanceLogs).values({
                        employeeId: request.employeeId,
                        cardType: 'IN',
                        logDate: dateStr,
                        logTime: getCorrectedTime(finalTimeIn) || '00:00:00'
                    });
                }

                if (finalTimeOut) {
                    const timeOutVal = typeof finalTimeOut === 'string' ? finalTimeOut : formatToManilaDateTime(finalTimeOut);
                    await db.insert(attendanceLogs).values({
                        employeeId: request.employeeId,
                        scanTime: timeOutVal,
                        type: 'OUT',
                        source: 'CORRECTION'
                    });

                    await db.insert(bioAttendanceLogs).values({
                        employeeId: request.employeeId,
                        cardType: 'OUT',
                        logDate: dateStr,
                        logTime: getCorrectedTime(finalTimeOut) || '00:00:00'
                    });
                }
            } catch (syncErr: unknown) {
                console.error('[DTR-SYNC] Failed to sync correction to biometrics:', syncErr);
            }

            await db.update(dtrCorrections)
                .set({ 
                    status: 'Approved', 
                    approvedBy: adminId,
                    updatedAt: toMySQLDatetime(new Date().toISOString())
                })
                .where(eq(dtrCorrections.id, id));

            try {
              await updateNotificationsByReference({
                type: 'dtr_request',
                referenceId: id,
                title: 'DTR Correction Approved',
                message: `DTR correction request for ${request.employeeId} on ${request.dateTime} has been approved.`,
                newType: 'dtr_approval'
              });
            } catch (nErr: unknown) { console.error('Notification Update Error:', nErr); }
        }
    }
    res.json({ success: true, message: `Requests ${status} successfully` });
  } catch (_err: unknown) {
    res.status(500).json({ success: false, message: 'Failed to update status' });
  }
};
