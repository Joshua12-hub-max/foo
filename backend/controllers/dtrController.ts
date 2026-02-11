import { Request, Response } from 'express';
import { ResultSetHeader } from 'mysql2';
import { db } from '../db/index.js';
import { dailyTimeRecords, authentication, dtrCorrections } from '../db/schema.js';
import { eq, and, desc, gte, lte, count } from 'drizzle-orm';
import { GetDTRSchema, UpdateDTRSchema, RequestCorrectionSchema } from '../schemas/dtrSchema.js';
import { AuthenticatedRequest } from '../types/index.js';

// ============================================================================
// Controllers
// ============================================================================

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

        // 3. Main Query
        const records = await db.select({
            id: dailyTimeRecords.id,
            employee_id: dailyTimeRecords.employeeId,
            date: dailyTimeRecords.date,
            time_in: dailyTimeRecords.timeIn,
            time_out: dailyTimeRecords.timeOut,
            late_minutes: dailyTimeRecords.lateMinutes,
            undertime_minutes: dailyTimeRecords.undertimeMinutes,
            status: dailyTimeRecords.status,
            created_at: dailyTimeRecords.createdAt,
            updated_at: dailyTimeRecords.updatedAt,
            first_name: authentication.firstName,
            last_name: authentication.lastName,
            department: authentication.department
        })
        .from(dailyTimeRecords)
        .leftJoin(authentication, eq(dailyTimeRecords.employeeId, authentication.employeeId))
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(dailyTimeRecords.date), desc(dailyTimeRecords.timeIn))
        .limit(limit)
        .offset(offset);

        // 4. Count Total
        const [countResult] = await db.select({ total: count() })
            .from(dailyTimeRecords)
            .where(conditions.length > 0 ? and(...conditions) : undefined);
            
        const total = countResult.total;

        res.status(200).json({
            success: true,
            data: records,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (err) {
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
  const { time_in, time_out, status, late_minutes, undertime_minutes } = validation.data.body;

  try {
    const result = await db.update(dailyTimeRecords)
      .set({
        timeIn: time_in,
        timeOut: time_out,
        status,
        lateMinutes: late_minutes,
        undertimeMinutes: undertime_minutes,
        updatedAt: new Date().toISOString()
      })
      .where(eq(dailyTimeRecords.id, Number(id)));

    // Drizzle doesn't return affectedRows directly in all drivers like mysql2, 
    // but the promise resolution implies success. 
    // For strict "not found" checks, we can check result[0].affectedRows if using mysql driver directly, 
    // or fetch first. But update returns a ResultSetHeader in mysql2 driver used by Drizzle.
    
    // Type assertion for MySQL driver result structure if needed, or just assume success if no error.
    // result is [ResultSetHeader, FieldPacket[]] in mysql2 driver for execute, but Drizzle abstracts it.
    // Drizzle's MySqlUpdate result is [ResultSetHeader].
    
    const updateResult = result[0] as unknown as ResultSetHeader;
    
    if (updateResult.affectedRows === 0) {
        res.status(404).json({ success: false, message: 'Record not found.' });
        return;
    }

    res.status(200).json({ success: true, message: 'Record updated successfully' });
  } catch (err) {
    console.error('Update DTR record error:', err);
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
  } catch (err) {
    console.error('Request DTR correction error:', err);
    res.status(500).json({ success: false, message: 'Failed to submit correction request' });
  }
};
