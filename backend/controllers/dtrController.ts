import { Request, Response } from 'express';

import { db } from '../db/index.js';
import { dailyTimeRecords, authentication, dtrCorrections, departments, schedules } from '../db/schema.js';
import { eq, and, desc, gte, lte, count, sql } from 'drizzle-orm';
import { GetDTRSchema, UpdateDTRSchema, RequestCorrectionSchema } from '../schemas/dtrSchema.js';
import { AuthenticatedRequest } from '../types/index.js';
import { updateTardinessSummary } from '../utils/tardinessUtils.js';
import { DTRApiResponse } from '../types/attendance.js';
import { formatToManilaDateTime } from '../utils/dateUtils.js';

/** Shape returned by the getAllRecords db.select() query */
interface DTRRecordRow {
  id: number;
  employee_id: string;
  date: string;
  time_in: string | Date | null;
  time_out: string | Date | null;
  late_minutes: number | null;
  undertime_minutes: number | null;
  overtime_minutes?: number | null;
  status: string | null;
  created_at: string | Date | null;
  updated_at: string | Date | null;
  employee_name: string;
  first_name: string;
  last_name: string;
  middle_name: string | null;
  suffix: string | null;
  department: string;
  duties: string;
  correction_id: number | null;
  correction_status: string | null;
  correction_reason: string | null;
  correction_time_in: string | Date | null;
  correction_time_out: string | Date | null;
}

const toMySQLDatetime = (isoStr: string | null | undefined): string | null => {
  if (!isoStr) return null;
  try {
    const date = new Date(isoStr);
    if (isNaN(date.getTime())) return null;
    return formatToManilaDateTime(date);
  } catch (e: unknown) {
    console.error('toMySQLDatetime error:', e);
    return null;
  }
};

const mapToDtrApi = (record: DTRRecordRow): DTRApiResponse => {
    return {
        id: record.id,
        employee_id: record.employee_id,
        date: record.date ? new Date(record.date).toISOString().split('T')[0] : '',
        time_in: record.time_in ? formatToManilaDateTime(record.time_in) : null,
        time_out: record.time_out ? formatToManilaDateTime(record.time_out) : null,
        late_minutes: record.late_minutes ?? 0,
        undertime_minutes: record.undertime_minutes ?? 0,
        overtime_minutes: record.overtime_minutes ?? 0,
        status: record.status || 'Pending',
        created_at: record.created_at ? new Date(record.created_at).toISOString() : null,
        updated_at: record.updated_at ? new Date(record.updated_at).toISOString() : null,
        employee_name: record.employee_name || 'Unknown Employee',
        first_name: record.first_name || '',
        last_name: record.last_name || '',
        middle_name: record.middle_name || null,
        suffix: record.suffix || null,
        department: record.department || 'N/A',
        duties: record.duties || 'No Schedule',
        correction_id: record.correction_id,
        correction_status: record.correction_status,
        correction_reason: record.correction_reason,
        correction_time_in: record.correction_time_in ? formatToManilaDateTime(record.correction_time_in) : null,
        correction_time_out: record.correction_time_out ? formatToManilaDateTime(record.correction_time_out) : null
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
            conditions.push(eq(dailyTimeRecords.employeeId, employeeId));
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
            employee_id: sql<string>`${dailyTimeRecords.employeeId}`,
            date: dailyTimeRecords.date,
            time_in: dailyTimeRecords.timeIn,
            time_out: dailyTimeRecords.timeOut,
            late_minutes: dailyTimeRecords.lateMinutes,
            undertime_minutes: dailyTimeRecords.undertimeMinutes,
            status: dailyTimeRecords.status,
            created_at: dailyTimeRecords.createdAt,
            updated_at: dailyTimeRecords.updatedAt,
            employee_name: sql<string>`COALESCE(TRIM(CONCAT(${authentication.lastName}, ', ', ${authentication.firstName}, IF(${authentication.middleName} IS NOT NULL && ${authentication.middleName} != '', CONCAT(' ', SUBSTRING(${authentication.middleName}, 1, 1), '.'), ''), IF(${authentication.suffix} IS NOT NULL && ${authentication.suffix} != '', CONCAT(' ', ${authentication.suffix}), ''))), 'Unknown Employee')`,
            department: sql<string>`COALESCE(${departments.name}, 'N/A')`,
            duties: sql<string>`COALESCE((SELECT schedule_title FROM schedules WHERE employee_id = ${dailyTimeRecords.employeeId} ORDER BY updated_at DESC LIMIT 1), 'No Schedule')`,
            // Correction info via LEFT JOIN
            correction_id: dtrCorrections.id,
            correction_status: dtrCorrections.status,
            correction_reason: dtrCorrections.reason,
            correction_time_in: dtrCorrections.correctedTimeIn,
            correction_time_out: dtrCorrections.correctedTimeOut,
        })
        .from(dailyTimeRecords)
        .leftJoin(authentication, eq(dailyTimeRecords.employeeId, authentication.employeeId))
        .leftJoin(departments, eq(authentication.departmentId, departments.id))
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
    } catch (err: unknown) {
        console.error('Get all DTR records error:', err);
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
  const { time_in, time_out, status } = validation.data.body;

  console.log(`[DTR Update] Request Body for ID ${id}:`, { time_in, time_out, status });

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

    const mysqlTimeIn = processInputTime(time_in, existing.date);
    const mysqlTimeOut = processInputTime(time_out, existing.date);
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

    console.log(`[DTR Update] Calculated for ID ${id}: Late=${calculatedLate}, Undertime=${calculatedUndertime}, Status=${newStatus}`);
    console.log(`[DTR Update] Formatted values for ID ${id}:`, { mysqlTimeIn, mysqlTimeOut, now });

    // 3. Perform update
    const [result] = await db.update(dailyTimeRecords)
      .set({
        timeIn: mysqlTimeIn,
        timeOut: mysqlTimeOut,
        status: newStatus,
        lateMinutes: calculatedLate,
        undertimeMinutes: calculatedUndertime,
        updatedAt: now
      })
      .where(eq(dailyTimeRecords.id, Number(id)));

    console.log(`[DTR Update] Success for ID ${id}. Result:`, result);

    // 4. Update Summary to reflect this manual change
    await updateTardinessSummary(existing.employeeId, existing.date);

    res.status(200).json({ success: true, message: 'Record updated successfully' });
  } catch (err: unknown) {
    console.error(`[DTR Update] CRITICAL ERROR for ID ${id}:`, err);
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
      let [_, hours, minutes, period] = match12;
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
  } catch (e) {
    console.error('Time parsing error:', e);
    return null;
  }
};

  try {
    console.log('[DTR Correction] Requesting correction for:', { employeeId, date, originalTimeIn, correctedTimeIn });

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

    res.status(201).json({ 
      success: true, 
      message: 'Correction request submitted successfully. Waiting for Admin approval.' 
    });
  } catch (err: unknown) {
    console.error('Request DTR correction error:', err);
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
    .leftJoin(authentication, eq(dtrCorrections.employeeId, authentication.employeeId))
    .where(and(...conditions))
    .orderBy(desc(dtrCorrections.createdAt));
    
    res.json({
        success: true,
        data: requests
    });
  } catch (error) {
    console.error('getCorrectionRequests error:', error);
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
            
            // Wait, logic needs checking.
            // request.correctedTimeIn is "YYYY-MM-DD HH:mm:ss"
            // We need to parse TIME part for calculation.
            
            const finalTimeIn = request.correctedTimeIn || request.originalTimeIn || (dtr ? dtr.timeIn : null);
            const finalTimeOut = request.correctedTimeOut || request.originalTimeOut || (dtr ? dtr.timeOut : null);

            let calculatedLate = 0;
            let calculatedUndertime = 0;
            let newStatus = 'Present';

            if (finalTimeIn) {
                    const inTimePart = finalTimeIn.split(' ')[1]; // HH:mm:ss
                    const [inH, inM] = inTimePart.split(':').map(Number);
                    const [schH, schM] = startStr.split(':').map(Number);
                    const inTotal = inH * 60 + inM;
                    const schTotal = schH * 60 + schM;
                    if (inTotal > schTotal) calculatedLate = inTotal - schTotal;
            }

            if (finalTimeOut) {
                    const outTimePart = finalTimeOut.split(' ')[1]; // HH:mm:ss
                    const [outH, outM] = outTimePart.split(':').map(Number);
                    const [schEH, schEM] = endStr.split(':').map(Number);
                    const outTotal = outH * 60 + outM;
                    const schEndTotal = schEH * 60 + schEM;
                    if (outTotal < schEndTotal) calculatedUndertime = schEndTotal - outTotal;
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
        }
    }

    res.json({ success: true, message: `Requests ${status} successfully` });
  } catch (err) {
      console.error('updateCorrectionStatus error:', err);
      res.status(500).json({ success: false, message: 'Failed to update status' });
  }
};
