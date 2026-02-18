import { Request, Response } from 'express';

import { db } from '../db/index.js';
import { dailyTimeRecords, authentication, dtrCorrections, departments, schedules } from '../db/schema.js';
import { eq, and, desc, gte, lte, count, sql } from 'drizzle-orm';
import { GetDTRSchema, UpdateDTRSchema, RequestCorrectionSchema } from '../schemas/dtrSchema.js';
import { AuthenticatedRequest } from '../types/index.js';
import { updateTardinessSummary } from '../utils/tardinessUtils.js';
import { DTRApiResponse } from '../types/attendance.js';
import { formatToManilaDateTime } from '../utils/dateUtils.js';


const toMySQLDatetime = (isoStr: string | null | undefined): string | null => {
  if (!isoStr) return null;
  try {
    const date = new Date(isoStr);
    if (isNaN(date.getTime())) return null;
    
    // Use proper timezone aware formatting or just simple ISO if database handles it
    // But since the original code had specific formatting, let's keep it but arguably cleaner
    // For now, let's trust the logic but maybe use dateUtils if applicable?
    // dateUtils has formatToManilaDateTime which returns "YYYY-MM-DD HH:mm:ss"
    // Let's use that one to be consistent
    return formatToManilaDateTime(date);
  } catch (e: unknown) {
    console.error('toMySQLDatetime error:', e);
    return null;
  }
};

const mapToDtrApi = (record: any): DTRApiResponse => {
    return {
        id: record.id,
        employee_id: record.employee_id || record.employeeId,
        date: record.date ? new Date(record.date).toISOString().split('T')[0] : '',
        time_in: record.time_in ? formatToManilaDateTime(record.time_in) : (record.timeIn ? formatToManilaDateTime(record.timeIn) : null),
        time_out: record.time_out ? formatToManilaDateTime(record.time_out) : (record.timeOut ? formatToManilaDateTime(record.timeOut) : null),
        late_minutes: record.late_minutes ?? record.lateMinutes ?? 0,
        undertime_minutes: record.undertime_minutes ?? record.undertimeMinutes ?? 0,
        overtime_minutes: record.overtime_minutes ?? record.overtimeMinutes ?? 0,
        status: record.status || 'Pending',
        created_at: record.created_at ? new Date(record.created_at).toISOString() : (record.createdAt ? new Date(record.createdAt).toISOString() : null),
        updated_at: record.updated_at ? new Date(record.updated_at).toISOString() : (record.updatedAt ? new Date(record.updatedAt).toISOString() : null),
        employee_name: record.employee_name || 'Unknown Employee',
        department: record.department || 'N/A',
        duties: record.duties || 'No Schedule'
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
            employee_name: sql<string>`COALESCE(CONCAT(${authentication.firstName}, ' ', ${authentication.lastName}), 'Unknown Employee')`,
            department: sql<string>`COALESCE(${departments.name}, 'N/A')`,
            duties: sql<string>`COALESCE((SELECT schedule_title FROM schedules WHERE employee_id = ${dailyTimeRecords.employeeId} ORDER BY updated_at DESC LIMIT 1), 'No Schedule')`
        })
        .from(dailyTimeRecords)
        .leftJoin(authentication, eq(dailyTimeRecords.employeeId, authentication.employeeId))
        .leftJoin(departments, eq(authentication.departmentId, departments.id))
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(dailyTimeRecords.date), desc(dailyTimeRecords.timeIn))
        .limit(limit)
        .offset(offset);

        // 4. Count Total
        const [countResult] = await db.select({ total: count() })
            .from(dailyTimeRecords)
            .where(conditions.length > 0 ? and(...conditions) : undefined);
            
        const total = countResult.total;

        const formattedRecords = records.map(mapToDtrApi);

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

  try {
    await db.insert(dtrCorrections).values({
      employeeId,
      dateTime: date,
      originalTimeIn,
      originalTimeOut,
      correctedTimeIn,
      correctedTimeOut,
      reason,
      status: 'Pending'
    });

    res.status(201).json({ 
      success: true, 
      message: 'Correction request submitted successfully. Waiting for Admin approval.' 
    });
  } catch (err: unknown) {
    console.error('Request DTR correction error:', err);
    res.status(500).json({ success: false, message: 'Failed to submit correction request' });
  }
};
