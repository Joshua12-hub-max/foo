import { Request, Response } from 'express';
import { db } from '../db/index.js';
import { sql } from 'drizzle-orm';
import { MySqlTable } from 'drizzle-orm/mysql-core';
import { AuthenticatedRequest } from '../types/index.js';
import { PDSParserService } from '../services/PDSParserService.js';
import fs from 'fs';
import { 
  pdsFamily, 
  pdsEducation, 
  pdsEligibility, 
  pdsWorkExperience, 
  pdsLearningDevelopment, 
  pdsOtherInfo, 
  pdsReferences,
  pdsVoluntaryWork,
  pdsPersonalInformation,
  pdsDeclarations
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

    // Use Drizzle's sql tagged template for typesafe querying
    const rows = await db.select().from(table).where(sql`employee_id = ${userId}`);
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

    await db.transaction(async (tx) => {
      // 1. Delete all existing records for this user and section
      await tx.delete(table).where(sql`employee_id = ${userId}`);

      // 2. Insert new records
      if (items.length > 0) {
        const valuesToInsert = items.map((item) => {
          // Filter out system columns and ensure employeeId is set
          const filteredItem: Record<string, string | number | boolean | null> = { ...item, employeeId: userId } as Record<string, string | number | boolean | null>;
          delete filteredItem.id;
          delete filteredItem.createdAt;
          delete filteredItem.updatedAt;
          return filteredItem;
        });

        // Batch insert
        await tx.insert(table).values(valuesToInsert); // Explicitly typed array
      }
    });

    res.json({ success: true, message: 'PDS section updated successfully' });
  } catch (_error) {

    res.status(500).json({ success: false, message: 'Failed to update PDS data' });
  }
};

/**
 * Handle PDS File Upload and Parsing
 */
export const parsePDSUpload = async (req: Request, res: Response): Promise<void> => {
  try {
    const file = req.file;
    if (!file) {
      res.status(400).json({ success: false, message: 'No file uploaded' });
      return;
    }

    const buffer = await fs.promises.readFile(file.path);
    const extension = file.originalname.split('.').pop()?.toLowerCase();

    let extractedData: Record<string, string | number | boolean | null | object> = {};
    let avatar: string | null = null;

    if (extension === 'xlsx' || extension === 'xls') {
      extractedData = await PDSParserService.parseExcel(buffer);
      avatar = await PDSParserService.extractImageFromExcel(buffer);
    } else if (extension === 'pdf') {
      extractedData = await PDSParserService.parsePDF(buffer);
    } else {
      res.status(400).json({ success: false, message: 'Unsupported file format' });
      return;
    }

    // Clean up uploaded file
    await fs.promises.unlink(file.path);

    res.json({
      success: true,
      data: extractedData,
      avatar,
      message: 'PDS parsed successfully'
    });
  } catch (err: unknown) {
    const error = err instanceof Error ? err : new Error('Unknown error');
    console.error('PDS Parsing Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to parse PDS file: ' + error.message
    });
  }
};
/**
 * Get PDS Personal Information
 */
export const getPdsPersonal = async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const requesterId = authReq.user?.id;
    const targetEmployeeId = req.query.employeeId as string;

    if (!requesterId) {
      res.status(401).json({ success: false, message: 'Not authenticated' });
      return;
    }

    let userId = requesterId;
    if (targetEmployeeId && targetEmployeeId !== requesterId.toString()) {
      userId = parseInt(targetEmployeeId);
    }

    const rows = await db.select().from(pdsPersonalInformation).where(sql`employee_id = ${userId}`);
    res.json({ success: true, data: rows[0] || null });
  } catch (_error) {
    res.status(500).json({ success: false, message: 'Failed to fetch personal information' });
  }
};

/**
 * Update PDS Personal Information
 */
export const updatePdsPersonal = async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const requesterId = authReq.user?.id;
    const body = req.body as Record<string, unknown>;
    const targetEmployeeId = body.employeeId as string | undefined;

    if (!requesterId) {
      res.status(401).json({ success: false, message: 'Not authenticated' });
      return;
    }

    let userId = requesterId;
    if (targetEmployeeId && targetEmployeeId !== requesterId.toString()) {
      userId = parseInt(targetEmployeeId);
    }

    const filteredData = { ...body, employeeId: userId };
    delete (filteredData as { id?: unknown }).id;

    await db.transaction(async (tx) => {
      await tx.delete(pdsPersonalInformation).where(sql`employee_id = ${userId}`);
      await tx.insert(pdsPersonalInformation).values([filteredData]);
    });

    res.json({ success: true, message: 'Personal information updated successfully' });
  } catch (_error) {
    res.status(500).json({ success: false, message: 'Failed to update personal information' });
  }
};

/**
 * Get PDS Declarations (Questions 34-40)
 */
export const getPdsQuestions = async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const requesterId = authReq.user?.id;
    const targetEmployeeId = req.query.employeeId as string;

    if (!requesterId) {
      res.status(401).json({ success: false, message: 'Not authenticated' });
      return;
    }

    let userId = requesterId;
    if (targetEmployeeId && targetEmployeeId !== requesterId.toString()) {
      userId = parseInt(targetEmployeeId);
    }

    const rows = await db.select().from(pdsDeclarations).where(sql`employee_id = ${userId}`);
    res.json({ success: true, data: rows[0] || null });
  } catch (_error) {
    res.status(500).json({ success: false, message: 'Failed to fetch PDS questions' });
  }
};

/**
 * Update PDS Declarations
 */
export const updatePdsQuestions = async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const requesterId = authReq.user?.id;
    const body = req.body as Record<string, unknown>;
    const targetEmployeeId = body.employeeId as string | undefined;

    if (!requesterId) {
      res.status(401).json({ success: false, message: 'Not authenticated' });
      return;
    }

    let userId = requesterId;
    if (targetEmployeeId && targetEmployeeId !== requesterId.toString()) {
      userId = parseInt(targetEmployeeId);
    }

    const filteredData = { ...body, employeeId: userId };
    delete (filteredData as { id?: number }).id;

    await db.transaction(async (tx) => {
      await tx.delete(pdsDeclarations).where(sql`employee_id = ${userId}`);
      await tx.insert(pdsDeclarations).values([filteredData]);
    });

    res.json({ success: true, message: 'Questions updated successfully' });
  } catch (_error) {
    res.status(500).json({ success: false, message: 'Failed to update PDS questions' });
  }
};
