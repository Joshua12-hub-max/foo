import { Request, Response } from 'express';
import { db } from '../db/index.js';
import { eq } from 'drizzle-orm';
import { MySqlTable } from 'drizzle-orm/mysql-core';
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
import { PDSUpdateSchema } from '../schemas/employeeSchema.js';

/**
 * PdsTableWithEmployeeId represents the structure of a PDS-related Drizzle table
 * ensuring we can safely access the employeeId column.
 */
// PdsTableWithEmployeeId removed
/* eslint-disable @typescript-eslint/naming-convention */
const PDS_TABLES: Record<string, MySqlTable> = {
  'family': pdsFamily,
  'education': pdsEducation,
  'eligibility': pdsEligibility,
  'work_experience': pdsWorkExperience,
  'voluntary_work': pdsVoluntaryWork,
  'learning_development': pdsLearningDevelopment,
  'other_info': pdsOtherInfo,
  'references': pdsReferences
};
/* eslint-enable @typescript-eslint/naming-convention */

/**
 * Get a specific PDS section for an employee.
 */
export const getPDSSection = async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const requesterId = authReq.user?.id;
    const requesterRole = authReq.user?.role?.toLowerCase();
    const { section } = req.params as { section: string };
    const targetEmployeeId = req.query.employeeId as string;

    if (!requesterId) {
      res.status(401).json({ success: false, message: 'Not authenticated' });
      return;
    }

    const table = PDS_TABLES[section];
    if (!table) {
      res.status(400).json({ success: false, message: 'Invalid PDS section' });
      return;
    }

    // Determine whose data to fetch
    let userId = requesterId;
    if (targetEmployeeId && targetEmployeeId !== requesterId.toString()) {
      if (!['admin', 'human resource'].includes(requesterRole || '')) {
        res.status(403).json({ success: false, message: 'Access Denied' });
        return;
      }
      userId = parseInt(targetEmployeeId as string);
    }

    // Use Drizzle's typed selection
    // Explicitly cast to internal base table with employeeId
    const baseTable = table as unknown as { employeeId: unknown } & MySqlTable;
    const rows = await db.select().from(table).where(eq(baseTable.employeeId, userId));
    res.json({ success: true, data: rows });
  } catch (_error) {

    res.status(500).json({ success: false, message: 'Failed to fetch PDS data' });
  }
};

/**
 * Update a specific PDS section (Bulk replace).
 */
export const updatePDSSection = async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const requesterId = authReq.user?.id;
    const requesterRole = authReq.user?.role?.toLowerCase();
    const { section } = req.params as { section: string };
    
    const { items, employeeId } = PDSUpdateSchema.parse(req.body);
    const targetEmployeeId = employeeId;

    if (!requesterId) {
      res.status(401).json({ success: false, message: 'Not authenticated' });
      return;
    }

    const table = PDS_TABLES[section];
    if (!table) {
      res.status(400).json({ success: false, message: 'Invalid PDS section' });
      return;
    }

    // Determine whose data to update
    let userId = requesterId;
    if (targetEmployeeId && targetEmployeeId.toString() !== requesterId.toString()) {
      if (!['admin', 'human resource'].includes(requesterRole || '')) {
        res.status(403).json({ success: false, message: 'Access Denied' });
        return;
      }
      userId = parseInt(targetEmployeeId.toString());
    }

    const baseTable = table as unknown as { employeeId: unknown } & MySqlTable;
    await db.transaction(async (tx) => {
      // 1. Delete all existing records for this user and section
      await tx.delete(table).where(eq(baseTable.employeeId, userId));

      // 2. Insert new records
      if (items.length > 0) {
        const valuesToInsert = items.map((item) => {
          // Filter out system columns and ensure employeeId is set
          const filteredItem: Record<string, unknown> = { ...item, employeeId: userId };
          delete filteredItem.id;
          delete filteredItem.createdAt;
          delete filteredItem.updatedAt;
          return filteredItem;
        });

        // Batch insert
        await tx.insert(table).values(valuesToInsert as unknown[]); // Explicitly typed array
      }
    });

    res.json({ success: true, message: 'PDS section updated successfully' });
  } catch (_error) {

    res.status(500).json({ success: false, message: 'Failed to update PDS data' });
  }
};




