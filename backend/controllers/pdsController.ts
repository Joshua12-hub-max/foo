import { Request, Response } from 'express';
import { db } from '../db/index.js';
import { sql } from 'drizzle-orm';
import { AuthenticatedRequest } from '../types/index.js';
import '../db/schema.js';
import { PDSUpdateSchema } from '../schemas/employeeSchema.js';

// Generic handler for PDS list tables
// Tables: pds_family, pds_education, pds_eligibility, pds_work_experience, pds_voluntary_work, pds_learning_development, pds_other_info, pds_references



const getTableName = (section: string): string | null => {
  switch (section) {
    case 'family': return 'pds_family';
    case 'education': return 'pds_education';
    case 'eligibility': return 'pds_eligibility';
    case 'work_experience': return 'pds_work_experience';
    case 'voluntary_work': return 'pds_voluntary_work';
    case 'learning_development': return 'pds_learning_development';
    case 'other_info': return 'pds_other_info';
    case 'references': return 'pds_references';
    default: return null;
  }
};

export const getPDSSection = async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const requesterId = authReq.user?.id;
    const requesterRole = authReq.user?.role?.toLowerCase();
    const { section } = req.params as { section: string };
    const targetEmployeeId = req.query.employee_id || req.query.employeeId;

    if (!requesterId) {
      res.status(401).json({ success: false, message: 'Not authenticated' });
      return;
    }

    // Determine whose data to fetch
    let userId = requesterId;
    if (targetEmployeeId && targetEmployeeId !== requesterId.toString()) {
      if (!['admin', 'hr'].includes(requesterRole)) {
        res.status(403).json({ success: false, message: 'Access Denied' });
        return;
      }
      userId = parseInt(targetEmployeeId as string);
    }

    const tableName = getTableName(section);
    if (!tableName) {
      res.status(400).json({ success: false, message: 'Invalid PDS section' });
      return;
    }

    // Use parameterized query for safety
    const [rows] = await db.execute(sql`SELECT * FROM ${sql.raw(tableName)} WHERE employee_id = ${userId}`);

    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('Get PDS Section Error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch PDS data' });
  }
};

    export const updatePDSSection = async (req: Request, res: Response) => {
    try {
      const authReq = req as AuthenticatedRequest;
      const requesterId = authReq.user?.id;
      const requesterRole = authReq.user?.role?.toLowerCase();
      const { section } = req.params as { section: string };
      
      const { items, employee_id, employeeId } = PDSUpdateSchema.parse(req.body);
      
      const targetEmployeeId = employee_id || employeeId;
  
      if (!requesterId) return res.status(401).json({ success: false, message: 'Not authenticated' });
  
      // Determine whose data to update
      let userId = requesterId;
      if (targetEmployeeId && targetEmployeeId.toString() !== requesterId.toString()) {
        if (!['admin', 'hr'].includes(requesterRole)) {
          return res.status(403).json({ success: false, message: 'Access Denied' });
        }
        userId = parseInt(targetEmployeeId.toString());
      }

      const tableName = getTableName(section);
      if (!tableName) return res.status(400).json({ success: false, message: 'Invalid PDS section' });
  
      await db.transaction(async (tx) => {
        // Strategy: Delete all existing for this user and section, then insert new.
        await tx.execute(sql`DELETE FROM ${sql.raw(tableName)} WHERE employee_id = ${userId}`);
  
        if (items.length > 0) {
          // Get columns from first item, filter out system columns
          const columns = Object.keys(items[0]).filter(k => k !== 'id' && k !== 'employee_id' && k !== 'created_at' && k !== 'updated_at');
          
          if (columns.length > 0) {
            for (const item of items) {
               const colNames = [...columns, 'employee_id'];
               const values = [...columns.map(col => item[col] ?? null), userId];
               
               const colNamesSql = sql.raw(colNames.join(', '));
               const valuesSql = sql.join(values.map(v => sql`${v}`), sql`, `);
               
               await tx.execute(sql`INSERT INTO ${sql.raw(tableName)} (${colNamesSql}) VALUES (${valuesSql})`);
            }
          }
        }
      });
  
      res.json({ success: true, message: 'PDS section updated successfully' });
    } catch (error) {
      console.error('Update PDS Section Error:', error);
      res.status(500).json({ success: false, message: 'Failed to update PDS data' });
    }
};
