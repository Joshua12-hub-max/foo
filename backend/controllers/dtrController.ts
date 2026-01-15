import { Request, Response } from 'express';
import db from '../db/connection.js';
import type { RowDataPacket } from 'mysql2/promise';
import { GetDTRSchema, UpdateDTRSchema } from '../schemas/dtrSchema.js';

// ============================================================================
// Interfaces
// ============================================================================

interface DTRRow extends RowDataPacket {
  id: number;
  employee_id: string;
  date: Date;
  time_in?: Date;
  time_out?: Date;
  late_minutes: number;
  undertime_minutes: number;
  status: string;
  created_at: Date;
  updated_at: Date;
  first_name?: string;
  last_name?: string;
  department?: string;
}

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
        let queryStr = `
            SELECT dtr.*, 
                   auth.first_name, 
                   auth.last_name, 
                   auth.department 
            FROM daily_time_records dtr
            LEFT JOIN authentication auth ON dtr.employee_id = auth.employee_id
            WHERE 1=1
        `;
        const queryParams: any[] = [];

        // 2. Dynamic Filtering
        if (employeeId) {
            queryStr += ' AND dtr.employee_id = ?';
            queryParams.push(employeeId);
        }

        if (startDate && endDate) {
            queryStr += ' AND dtr.date BETWEEN ? AND ?';
            queryParams.push(startDate, endDate);
        } else if (startDate) {
            queryStr += ' AND dtr.date >= ?';
            queryParams.push(startDate);
        } else if (endDate) {
            queryStr += ' AND dtr.date <= ?';
            queryParams.push(endDate);
        }

        // 3. Sorting and Pagination
        queryStr += ' ORDER BY dtr.date DESC, dtr.time_in DESC LIMIT ? OFFSET ?';
        queryParams.push(limit, offset);

        // 4. Count Total for Pagination
        let countQueryStr = 'SELECT COUNT(*) as total FROM daily_time_records dtr WHERE 1=1';
        const countParams: any[] = [];

        if (employeeId) {
            countQueryStr += ' AND dtr.employee_id = ?';
            countParams.push(employeeId);
        }

        if (startDate && endDate) {
            countQueryStr += ' AND dtr.date BETWEEN ? AND ?';
            countParams.push(startDate, endDate);
        } else if (startDate) {
            countQueryStr += ' AND dtr.date >= ?';
            countParams.push(startDate);
        } else if (endDate) {
            countQueryStr += ' AND dtr.date <= ?';
            countParams.push(endDate);
        }

        const [records] = await db.query<DTRRow[]>(queryStr, queryParams);
        const [countResult] = await db.query<RowDataPacket[]>(countQueryStr, countParams);
        const total = countResult[0].total;

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
    const [result] = await db.query(
      `UPDATE daily_time_records 
       SET time_in = ?, 
           time_out = ?, 
           status = ?, 
           late_minutes = ?, 
           undertime_minutes = ?, 
           updated_at = NOW() 
       WHERE id = ?`,
      [time_in, time_out, status, late_minutes, undertime_minutes, id]
    );

    // Check if any row was affected
    if ((result as any).affectedRows === 0) {
        res.status(404).json({ success: false, message: 'Record not found.' });
        return;
    }

    res.status(200).json({ success: true, message: 'Record updated successfully' });
  } catch (err) {
    console.error('Update DTR record error:', err);
    res.status(500).json({ success: false, message: 'Failed to update record' });
  }
};
