import { Request, Response } from 'express';

import { db } from '../db/index.js';
import { dailyTimeRecords, authentication, dtrCorrections, departments, schedules, bioEnrolledUsers } from '../db/schema.js';
import { eq, and, desc, gte, lte, count, sql } from 'drizzle-orm';
import { GetDTRSchema, UpdateDTRSchema, RequestCorrectionSchema } from '../schemas/dtrSchema.js';
import { AuthenticatedRequest } from '../types/index.js';
import { updateTardinessSummary } from '../utils/tardinessUtils.js';
import { createNotification, notifyAdmins } from './notificationController.js';
import { DTRApiResponse } from '../types/attendance.js';
import { formatToManilaDateTime } from "../utils/dateUtils.js";
import { compareIds } from "../utils/idUtils.js";

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
  duties: string;
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

const mapToDtrApi = (record: DTRRecordRow): DTRApiResponse => {
    return {
        id: record.id,
        employeeId: record.employeeId,
        date: record.date ? new Date(record.date).toISOString().split('T')[0] : '',
        timeIn: record.timeIn ? formatToManilaDateTime(record.timeIn) : null,
        timeOut: record.timeOut ? formatToManilaDateTime(record.timeOut) : null,
        lateMinutes: record.lateMinutes ?? 0,
        undertimeMinutes: record.undertimeMinutes ?? 0,
        overtimeMinutes: record.overtimeMinutes ?? 0,
        status: record.status || 'Pending',
        createdAt: record.createdAt ? new Date(record.createdAt).toISOString() : null,
        updatedAt: record.updatedAt ? new Date(record.updatedAt).toISOString() : null,
        employeeName: record.employeeName || 'Unknown Employee',
        firstName: record.firstName || '',
        lastName: record.lastName || '',
        middleName: record.middleName || null,
        suffix: record.suffix || null,
        department: record.department || 'N/A',
        duties: record.duties || 'No Schedule',
        correctionId: record.correctionId,
        correctionStatus: record.correctionStatus,
        correctionReason: record.correctionReason,
        correctionTimeIn: record.correctionTimeIn ? formatToManilaDateTime(record.correctionTimeIn) : null,
        correctionTimeOut: record.correctionTimeOut ? formatToManilaDateTime(record.correctionTimeOut) : null
    };
};


export const getAllRecords = async (req: Request, res: Response): Promise<void> => {
    // 1. Zod Validation for Query Params
    const validation = GetDTRSchema.safeParse(req);

    if (!validation.success) {
        res.status(400).json({
            success: false,
            message: 'Invalid query parameters.',
            errors: validation.error.format()
        });
        return;
    }

    const { employeeId, startDate, endDate, page, limit } = validation.data.query;
    const offset = (page - 1) * limit;

    try {
        const conditions = [];

        // 2. Dynamic Filtering
        if (employeeId) {
            conditions.push(compareIds(dailyTimeRecords.employeeId, employeeId));
        }

        if (startDate && endDate) {
            conditions.push(and(
                gte(dailyTimeRecords.date, startDate),
                lte(dailyTimeRecords.date, endDate)
            ));
        } else if (startDate) {
            conditions.push(gte(dailyTimeRecords.date, startDate));
        } else if (endDate) {
            conditions.push(lte(dailyTimeRecords.date, endDate));
        }

        const records = await db.select({
            id: dailyTimeRecords.id,
            employeeId: sql<string>`${dailyTimeRecords.employeeId}`,
            date: dailyTimeRecords.date,
            timeIn: dailyTimeRecords.timeIn,
            timeOut: dailyTimeRecords.timeOut,
            lateMinutes: dailyTimeRecords.lateMinutes,
            undertimeMinutes: dailyTimeRecords.undertimeMinutes,
            status: dailyTimeRecords.status,
            createdAt: dailyTimeRecords.createdAt,
            updatedAt: dailyTimeRecords.updatedAt,
            employeeName: sql<string>`COALESCE(
                NULLIF(TRIM(CONCAT(
                    COALESCE(NULLIF(TRIM(${authentication.lastName}), ''), ''), 
                    IF(NULLIF(TRIM(${authentication.firstName}), '') IS NOT NULL, CONCAT(', ', TRIM(${authentication.firstName})), ''),
                    IF(NULLIF(TRIM(${authentication.middleName}), '') IS NOT NULL, CONCAT(' ', SUBSTRING(TRIM(${authentication.middleName}), 1, 1), '.'), ''),
                    IF(NULLIF(TRIM(${authentication.suffix}), '') IS NOT NULL, CONCAT(' ', TRIM(${authentication.suffix})), '')
                )), ''),
                NULLIF(TRIM(${bioEnrolledUsers.fullName}), ''),
                'Unknown Employee'
            )`,
            firstName: authentication.firstName,
            lastName: authentication.lastName,
            middleName: authentication.middleName,
            suffix: authentication.suffix,
            department: sql<string>`COALESCE(${departments.name}, ${bioEnrolledUsers.department}, 'N/A')`,
            duties: sql<string>`COALESCE((SELECT schedule_title FROM schedules WHERE employee_id = ${dailyTimeRecords.employeeId} ORDER BY updated_at DESC LIMIT 1), 'No Schedule')`,
            // Correction info via LEFT JOIN
            correctionId: dtrCorrections.id,
            correctionStatus: dtrCorrections.status,
            correctionReason: dtrCorrections.reason,
            correctionTimeIn: dtrCorrections.correctedTimeIn,
            correctionTimeOut: dtrCorrections.correctedTimeOut,
        })
        .from(dailyTimeRecords)
        .leftJoin(authentication, compareIds(dailyTimeRecords.employeeId, authentication.employeeId))
        .leftJoin(departments, eq(authentication.departmentId, departments.id))
        .leftJoin(bioEnrolledUsers, compareIds(bioEnrolledUsers.employeeId, dailyTimeRecords.employeeId))
        .leftJoin(
            dtrCorrections,
            and(
                eq(dtrCorrections.employeeId, dailyTimeRecords.employeeId),
                eq(dtrCorrections.dateTime, dailyTimeRecords.date),
                eq(dtrCorrections.status, 'Pending')
            )
        )
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(dailyTimeRecords.date), desc(dailyTimeRecords.timeIn))
        .limit(limit)
        .offset(offset);

        // 4. Count Total
        const [countResult] = await db.select({ total: count() })
            .from(dailyTimeRecords)
            .where(conditions.length > 0 ? and(...conditions) : undefined);
            
        const total = countResult.total;

        const formattedRecords = (records as DTRRecordRow[]).map(mapToDtrApi);

        res.status(200).json({
            success: true,
            data: formattedRecords,
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



export const updateRecord = async (req: Request, res: Response): Promise<void> => {
  // Zod Validation
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
    // 1. Check if record exists
    const [existing] = await db.select()
        .from(dailyTimeRecords)
        .where(eq(dailyTimeRecords.id, Number(id)))
        .limit(1);

    if (!existing) {
        console.warn(`[DTR Update] Record NOT found: ${id}`);
        res.status(404).json({ success: false, message: 'DTR Record not found.' });
        return;
    }

    // 2. Schedule Fetching & Calculation Logic
    // We need to calculate late/undertime based on the schedule for this day.
    // First, determine day of week from the DTR Date
    const dtrDate = new Date(existing.date);
    const dayName = dtrDate.toLocaleDateString('en-US', { weekday: 'long' }); // e.g., "Monday"

    // Fetch Schedule
    const [schedule] = await db.select()
        .from(schedules)
        .where(and(
            eq(schedules.employeeId, existing.employeeId),
            eq(schedules.dayOfWeek, dayName)
        ))
        .limit(1);

    // Default to 8-5 if no schedule
    const startStr = schedule ? schedule.startTime : '08:00:00';
    const endStr = schedule ? schedule.endTime : '17:00:00';

    // Helper to format input to MySQL DateTime
    const processInputTime = (inputTime: string | null | undefined, dateStr: string): string | null => {
        if (!inputTime) return null;
        
        // precise regex for HH:mm or HH:mm:ss
        const timeRegex = /^([0-1]?[0-9]|2[0-3]):([0-5][0-9])(:[0-5][0-9])?$/;
        
        if (timeRegex.test(inputTime)) {
             // It's a time string, combine with date
             // Ensure dateStr is YYYY-MM-DD
             const cleanDate = new Date(dateStr).toISOString().split('T')[0];
             let cleanTime = inputTime;
             if (inputTime.split(':').length === 2) cleanTime += ':00';
             return `${cleanDate} ${cleanTime}`;
        }
        
        // Otherwise treat as ISO/Date string
        return toMySQLDatetime(inputTime);
    };

    const mysqlTimeIn = processInputTime(timeIn, existing.date);
    const mysqlTimeOut = processInputTime(timeOut, existing.date);
    const now = toMySQLDatetime(new Date().toISOString());


    let calculatedLate = 0;
    let calculatedUndertime = 0;
    let newStatus = status || existing.status;

    // Calculate Late
    if (mysqlTimeIn) {
        // mysqlTimeIn is "YYYY-MM-DD HH:mm:ss"
        // Parse the time part
        const inTimePart = mysqlTimeIn.split(' ')[1]; // HH:mm:ss
        
        // Compare with startStr
        const [inH, inM] = inTimePart.split(':').map(Number);
        const [schH, schM] = startStr.split(':').map(Number);

        const inTotalMins = inH * 60 + inM;
        const schTotalMins = schH * 60 + schM;

        if (inTotalMins > schTotalMins) {
            calculatedLate = inTotalMins - schTotalMins;
            // Apply Grace Period check (optional, matching processor)
             // For now, raw calculation.
        }
    }

    // Calculate Undertime
    if (mysqlTimeOut) {
         const outTimePart = mysqlTimeOut.split(' ')[1];
         const [outH, outM] = outTimePart.split(':').map(Number);
         const [schEH, schEM] = endStr.split(':').map(Number);

         const outTotalMins = outH * 60 + outM;
         const schEndTotalMins = schEH * 60 + schEM;

         if (outTotalMins < schEndTotalMins) {
             calculatedUndertime = schEndTotalMins - outTotalMins;
         }
    }

    // Unified Status Logic
    const isLate = calculatedLate > 0;
    const isUndertime = calculatedUndertime > 0;

    if (newStatus !== 'Absent' && newStatus !== 'Leave') {
        if (isLate && isUndertime) {
            newStatus = 'Late/Undertime';
        } else if (isLate) {
            newStatus = 'Late';
        } else if (isUndertime) {
            newStatus = 'Undertime';
        } else {
            newStatus = 'Present';
        }
    }


    // 3. Perform update
    const [_result] = await db.update(dailyTimeRecords)
      .set({
        timeIn: mysqlTimeIn,
        timeOut: mysqlTimeOut,
        status: newStatus,
        lateMinutes: calculatedLate,
        undertimeMinutes: calculatedUndertime,
        updatedAt: now
      })
      .where(eq(dailyTimeRecords.id, Number(id)));

    // 4. Update Summary to reflect this manual change
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
    
    // Handle "HH:mm AM/PM" (12-hour format)
    const time12Regex = /^(\d{1,2}):(\d{2})\s?(AM|PM)$/i;
    const match12 = timeStr.match(time12Regex);
    if (match12) {
      const [_, hours, minutes, period] = match12;
      let h = parseInt(hours, 10);
      if (period.toUpperCase() === 'PM' && h < 12) h += 12;
      if (period.toUpperCase() === 'AM' && h === 12) h = 0;
      return `${datePart} ${h.toString().padStart(2, '0')}:${minutes}:00`;
    }

    // Handle "HH:mm" or "HH:mm:ss" (24-hour format)
    const time24Regex = /^(\d{1,2}):(\d{2})(:(\d{2}))?$/;
    if (time24Regex.test(timeStr)) {
      let cleanTime = timeStr;
      if (timeStr.split(':').length === 2) cleanTime += ':00';
      return `${datePart} ${cleanTime}`;
    }

    // Fallback: Try generic Date parsing
    const d = new Date(`${dateStr} ${timeStr}`);
    if (!isNaN(d.getTime())) {
      // Return YYYY-MM-DD HH:mm:ss
        return d.toISOString().replace('T', ' ').split('.')[0];
        // Note: ISOString is UTC. We might want local.
        // But for now, let's stick to simple string concat if regex fails.
        // Actually, generic parsing might be risky with timezones.
    }

    return null;
  } catch (_e) {

    return null;
  }
};

  try {

    // Format times to MySQL DateTime
    const dbOriginalIn = parseTimeInput(originalTimeIn, date);
    const dbOriginalOut = parseTimeInput(originalTimeOut, date);
    const dbCorrectedIn = parseTimeInput(correctedTimeIn, date);
    const dbCorrectedOut = parseTimeInput(correctedTimeOut, date);

    await db.insert(dtrCorrections).values({
      employeeId,
      dateTime: date, // Map 'date' from request to 'dateTime' column
      originalTimeIn: dbOriginalIn,
      originalTimeOut: dbOriginalOut,
      correctedTimeIn: dbCorrectedIn,
      correctedTimeOut: dbCorrectedOut,
      reason,
      status: 'Pending'
    });

    // Notify Admins
    try {
      await notifyAdmins({
        senderId: employeeId,
        title: 'New DTR Correction Request',
        message: `Employee ${employeeId} has requested a DTR correction for ${date}.`,
        type: 'dtr_correction',
        referenceId: null
      });
    } catch (notifErr) {
      console.error('Failed to notify admins:', notifErr);
    }

    res.status(201).json({ 
      success: true, 
      message: 'Correction request submitted successfully. Waiting for Admin approval.' 
    });
  } catch (err: unknown) {

    if (err instanceof Error && 'sqlMessage' in err) console.error('SQL Error:', (err as Error & { sqlMessage: string }).sqlMessage);
    res.status(500).json({ success: false, message: 'Failed to submit correction request' });
  }
};

import { UpdateCorrectionStatusSchema } from '../schemas/dtrSchema.js';

export const getCorrectionRequests = async (req: Request, res: Response): Promise<void> => {
  try {
    const { status } = req.query;
    
    // Build query conditions
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
          // 1. Get Correction Request
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

              // Notify Employee
              try {
                await createNotification({
                  recipientId: request.employeeId,
                  senderId: adminId,
                  title: 'DTR Correction Rejected',
                  message: `Your DTR correction request for ${request.dateTime} has been rejected. Reason: ${rejectionReason || 'No reason provided.'}`,
                  type: 'dtr_correction_result',
                  referenceId: id
                });
              } catch (nErr) { console.error(nErr); }

          } else if (status === 'Approved') {
              // APPROVED LOGIC
              // A. Fetch existing DTR record
              const [dtr] = await db.select().from(dailyTimeRecords).where(and(
                  eq(dailyTimeRecords.employeeId, request.employeeId),
                  eq(dailyTimeRecords.date, request.dateTime)
              ));

            // B. Calculate Logic (replicated from updateRecord)
            const dtrDate = new Date(request.dateTime);
            const dayName = dtrDate.toLocaleDateString('en-US', { weekday: 'long' });
            
            const [schedule] = await db.select().from(schedules).where(and(
                eq(schedules.employeeId, request.employeeId),
                eq(schedules.dayOfWeek, dayName)
            )).limit(1);

            const startStr = schedule ? schedule.startTime : '08:00:00';
            const endStr = schedule ? schedule.endTime : '17:00:00';
            
            const getTimePart = (d: string | Date | null): string | null => {
                if (!d) return null;
                // Handle DB string "YYYY-MM-DD HH:mm:ss"
                if (typeof d === 'string' && d.includes(' ')) return d.split(' ')[1];
                // Handle Date object or ISO string
                const dateObj = new Date(d);
                return isNaN(dateObj.getTime()) ? null : dateObj.toTimeString().split(' ')[0];
            };

            // Wait, logic needs checking.
            // request.correctedTimeIn is "YYYY-MM-DD HH:mm:ss"
            // We need to parse TIME part for calculation.
            
            const finalTimeIn = request.correctedTimeIn || request.originalTimeIn || (dtr ? dtr.timeIn : null);
            const finalTimeOut = request.correctedTimeOut || request.originalTimeOut || (dtr ? dtr.timeOut : null);

            let calculatedLate = 0;
            let calculatedUndertime = 0;
            let newStatus = 'Present';

            if (finalTimeIn) {
                    const inTimePart = getTimePart(finalTimeIn);
                    if (inTimePart) {
                    const [inH, inM] = inTimePart.split(':').map(Number);
                    const [schH, schM] = startStr.split(':').map(Number);
                    const inTotal = inH * 60 + inM;
                    const schTotal = schH * 60 + schM;
                    if (inTotal > schTotal) calculatedLate = inTotal - schTotal;
                    }
            }

            if (finalTimeOut) {
                    const outTimePart = getTimePart(finalTimeOut);
                    if (outTimePart) {
                    const [outH, outM] = outTimePart.split(':').map(Number);
                    const [schEH, schEM] = endStr.split(':').map(Number);
                    const outTotal = outH * 60 + outM;
                    const schEndTotal = schEH * 60 + schEM;
                    if (outTotal < schEndTotal) calculatedUndertime = schEndTotal - outTotal;
                    }
            }

            const isLate = calculatedLate > 0;
            const isUndertime = calculatedUndertime > 0;
            if (isLate && isUndertime) newStatus = 'Late/Undertime';
            else if (isLate) newStatus = 'Late';
            else if (isUndertime) newStatus = 'Undertime';
            
            // C. Update/Insert DTR
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

            // D. Update Summary
            await updateTardinessSummary(request.employeeId, request.dateTime);

            // E. Update Request Status
            await db.update(dtrCorrections)
                .set({ 
                    status: 'Approved', 
                    approvedBy: adminId,
                    updatedAt: toMySQLDatetime(new Date().toISOString())
                })
                .where(eq(dtrCorrections.id, id));

            // Notify Employee
            try {
              await createNotification({
                recipientId: request.employeeId,
                senderId: adminId,
                title: 'DTR Correction Approved',
                message: `Your DTR correction request for ${request.dateTime} has been approved.`,
                type: 'dtr_correction_result',
                referenceId: id
              });
            } catch (nErr) { console.error(nErr); }
        }
    }

    res.json({ success: true, message: `Requests ${status} successfully` });
  } catch (_err: unknown) {
    res.status(500).json({ success: false, message: 'Failed to update status' });
  }
};
