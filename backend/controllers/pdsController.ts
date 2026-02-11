import { Request, Response } from 'express';
import { db } from '../db/index.js';
import { sql } from 'drizzle-orm';
import { AuthenticatedRequest } from '../types/index.js';
import {
  pdsFamily,
  pdsEducation,
  pdsEligibility,
  pdsWorkExperience,
  pdsVoluntaryWork,
  pdsLearningDevelopment,
  pdsOtherInfo,
  pdsReferences
} from '../db/schema.js';

// Generic handler for PDS list tables
// Tables: pds_family, pds_education, pds_eligibility, pds_work_experience, pds_voluntary_work, pds_learning_development, pds_other_info, pds_references

const getTableObject = (section: string) => {
  switch (section) {
    case 'family': return pdsFamily;
    case 'education': return pdsEducation;
    case 'eligibility': return pdsEligibility;
    case 'work_experience': return pdsWorkExperience;
    case 'voluntary_work': return pdsVoluntaryWork;
    case 'learning_development': return pdsLearningDevelopment;
    case 'other_info': return pdsOtherInfo;
    case 'references': return pdsReferences;
    default: return null;
  }
};

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
    const userId = authReq.user?.id;
    const { section } = req.params;

    if (!userId) {
      res.status(401).json({ success: false, message: 'Not authenticated' });
      return;
    }

    const tableName = getTableName(section);
    if (!tableName) {
      res.status(400).json({ success: false, message: 'Invalid PDS section' });
      return;
    }

    // Using raw SQL to preserve snake_case column names expected by frontend
    const [rows] = await db.execute(sql.raw(`SELECT * FROM ${tableName} WHERE employee_id = ${userId}`));

    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('Get PDS Section Error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch PDS data' });
  }
};

export const updatePDSSection = async (req: Request, res: Response) => {
    try {
      const authReq = req as AuthenticatedRequest;
      const userId = authReq.user?.id;
      const { section } = req.params;
      const { items } = req.body; // Expecting an array of items
  
      if (!userId) return res.status(401).json({ success: false, message: 'Not authenticated' });
      if (!Array.isArray(items)) return res.status(400).json({ success: false, message: 'Items must be an array' });
  
      const tableName = getTableName(section);
      if (!tableName) return res.status(400).json({ success: false, message: 'Invalid PDS section' });
  
      await db.transaction(async (tx) => {
        // Strategy: Delete all existing for this user and section, then insert new.
        await tx.execute(sql.raw(`DELETE FROM ${tableName} WHERE employee_id = ${userId}`));
  
        if (items.length > 0) {
          // Get columns from first item, filter out system columns
          const columns = Object.keys(items[0]).filter(k => k !== 'id' && k !== 'employee_id' && k !== 'created_at' && k !== 'updated_at');
          
          if (columns.length > 0) {
            // We use a parameterized query for safety, even with dynamic columns (columns are checked against allowlist ideally, but here filtered from body)
            // Note: sql.raw allows string injection, so we must be careful. 
            // In a strict refactor we'd map to Drizzle objects, but for generic dynamic handling preserving snake_case inputs:
            
            for (const item of items) {
               const colNames = [...columns, 'employee_id'];
               const values = [...columns.map(col => item[col] ?? null), userId];
               
               // Construct SQL safely
               const insertSql = `INSERT INTO ${tableName} (${colNames.join(', ')}) VALUES (${colNames.map(() => '?').join(', ')})`;
               await tx.execute(sql.raw(insertSql.replace(/\?/g, () => {
                   const val = values.shift();
                   return val === null ? 'NULL' : typeof val === 'string' ? `'${val.replace(/'/g, "''")}'` : `${val}`;
               })));
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