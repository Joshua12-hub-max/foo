import { Request, Response } from 'express';
import { db } from '../db/index.js';
import { plantillaPositions, qualificationStandards, authentication, plantillaPositionHistory } from '../db/schema.js';
import { eq, and, desc, asc, sql, gte, lte } from 'drizzle-orm';

/**
 * Get Data for CSC Form 9 (Publication of Vacant Positions)
 */
export const getForm9Data = async (req: Request, res: Response): Promise<void> => {
  try {
    const { department } = req.query;
    
    const conditions = [
      eq(plantillaPositions.isVacant, 1),
      eq(plantillaPositions.status, 'Active')
    ];

    if (department && department !== 'All') {
      conditions.push(eq(plantillaPositions.department, department as string));
    }

    const rows = await db.select({
      item_number: plantillaPositions.itemNumber,
      position_title: plantillaPositions.positionTitle,
      salary_grade: plantillaPositions.salaryGrade,
      monthly_salary: plantillaPositions.monthlySalary,
      education: qualificationStandards.educationRequirement,
      training: qualificationStandards.trainingHours,
      experience: qualificationStandards.experienceYears,
      eligibility: qualificationStandards.eligibilityRequired,
      competency: qualificationStandards.competencyRequirements,
      assignment: plantillaPositions.department
    })
    .from(plantillaPositions)
    .leftJoin(qualificationStandards, eq(plantillaPositions.qualificationStandardsId, qualificationStandards.id))
    .where(and(...conditions))
    .orderBy(desc(plantillaPositions.salaryGrade));
    
    res.json({
      success: true,
      data: rows,
      meta: {
        form_name: 'CSC Form No. 9',
        title: 'Electronic Copy to be submitted to the CSC Field Office',
        heading: 'Request for Publication of Vacant Positions'
      }
    });
  } catch (error) {
    console.error('Form 9 Error:', error);
    res.status(500).json({ success: false, message: 'Failed to generate Form 9 data' });
  }
};

/**
 * Get Data for CS Form 33 (Appointment Form)
 */
export const getForm33Data = async (req: Request, res: Response): Promise<void> => {
  try {
    const { position_id } = req.query;
    if (!position_id) {
      res.status(400).json({ success: false, message: 'Position ID is required' });
      return;
    }

    const rows = await db.select({
      item_number: plantillaPositions.itemNumber,
      position_title: plantillaPositions.positionTitle,
      salary_grade: plantillaPositions.salaryGrade,
      monthly_salary: plantillaPositions.monthlySalary,
      department: plantillaPositions.department,
      first_name: authentication.firstName,
      last_name: authentication.lastName,
      employee_id: authentication.employeeId,
      date_of_signing: plantillaPositions.filledDate,
      status: sql<string>`'Permanent'`, // Default or fetch from profile
      nature_of_appointment: sql<string>`'Original'` // Default or fetch from profile
    })
    .from(plantillaPositions)
    .innerJoin(authentication, eq(plantillaPositions.incumbentId, authentication.id))
    .where(eq(plantillaPositions.id, Number(position_id)));
    
    if (rows.length === 0) {
      res.status(404).json({ success: false, message: 'Filled position not found' });
      return;
    }

    res.json({
      success: true,
      data: rows[0],
      meta: {
        form_name: 'CS Form No. 33-A',
        revision: 'Revised 2018',
        title: 'Appointment Form'
      }
    });
  } catch (error) {
    console.error('Form 33 Error:', error);
    res.status(500).json({ success: false, message: 'Failed to generate Form 33 data' });
  }
};

/**
 * Get Data for RAI (Report on Appointments Issued)
 */
export const getRAIData = async (req: Request, res: Response): Promise<void> => {
  try {
    const { start_date, end_date } = req.query;
    
    const conditions = [];
    if (start_date) {
      conditions.push(gte(plantillaPositionHistory.startDate, String(start_date)));
    }
    if (end_date) {
      conditions.push(lte(plantillaPositionHistory.startDate, String(end_date)));
    }

    const rows = await db.select({
      employee_name: plantillaPositionHistory.employeeName,
      position_title: plantillaPositionHistory.positionTitle,
      item_number: plantillaPositions.itemNumber,
      salary_grade: plantillaPositions.salaryGrade,
      monthly_salary: plantillaPositions.monthlySalary,
      date_issued: plantillaPositionHistory.startDate,
      status: sql<string>`'Permanent'`,
      nature_of_appointment: sql<string>`'Original'`,
      department: plantillaPositions.department
    })
    .from(plantillaPositionHistory)
    .innerJoin(plantillaPositions, eq(plantillaPositionHistory.positionId, plantillaPositions.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(plantillaPositionHistory.startDate));
    
    res.json({
      success: true,
      data: rows,
      meta: {
        form_name: 'RAI',
        title: 'Report on Appointments Issued'
      }
    });
  } catch (error) {
    console.error('RAI Error:', error);
    res.status(500).json({ success: false, message: 'Failed to generate RAI data' });
  }
};

/**
 * Get Data for PSI-POP (Plantilla of Personnel)
 */
export const getPSIPOPData = async (_req: Request, res: Response): Promise<void> => {
  try {
    const rows = await db.select({
      item_number: plantillaPositions.itemNumber,
      position_title: plantillaPositions.positionTitle,
      salary_grade: plantillaPositions.salaryGrade,
      step_increment: plantillaPositions.stepIncrement,
      monthly_salary: plantillaPositions.monthlySalary,
      department: plantillaPositions.department,
      is_vacant: plantillaPositions.isVacant,
      incumbent_name: sql<string>`CONCAT(${authentication.firstName}, ' ', ${authentication.lastName})`,
      employee_id: authentication.employeeId,
      position_status: plantillaPositions.status
    })
    .from(plantillaPositions)
    .leftJoin(authentication, eq(plantillaPositions.incumbentId, authentication.id))
    .orderBy(asc(plantillaPositions.department), desc(plantillaPositions.salaryGrade));
    
    res.json({
      success: true,
      data: rows,
      meta: {
        form_name: 'PSI-POP',
        title: 'Personal Services Itemization and Plantilla of Personnel'
      }
    });
  } catch (error) {
    console.error('PSIPOP Error:', error);
    res.status(500).json({ success: false, message: 'Failed to generate PSI-POP data' });
  }
};
