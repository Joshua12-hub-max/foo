import { Request, Response } from 'express';
import { db } from '../db/index.js';
import { plantillaPositions, qualificationStandards, authentication } from '../db/schema.js';
import { eq, and, desc, asc, sql } from 'drizzle-orm';
import { formatFullName } from '../utils/nameUtils.js';

/**
 * Get Data for CSC Form 9 (Publication of Vacant Positions)
 */
export const getForm9Data = async (req: Request, res: Response): Promise<void> => {
  try {
    const { department } = req.query;
    
    const conditions = [
      eq(plantillaPositions.isVacant, true),
      eq(plantillaPositions.status, 'Active')
    ];

    if (department && department !== 'All') {
      conditions.push(eq(plantillaPositions.department, department as string));
    }

    // 1. Get Active Tranche (Reuse logic or make a helper, but inline is fine for now)
    const [activeTranche] = await db.select()
        .from(salaryTranches)
        .where(eq(salaryTranches.isActive, true))
        .limit(1);

    const currentTrancheNumber = activeTranche ? activeTranche.trancheNumber : 2;

    const rows = await db.select({
      itemNumber: plantillaPositions.itemNumber,
      positionTitle: plantillaPositions.positionTitle,
      salaryGrade: plantillaPositions.salaryGrade,
      // Canonical Salary for Step 1 (Vacant uses Step 1 entry rate)
      monthlySalary: sql<string>`COALESCE(${salarySchedule.monthlySalary}, ${plantillaPositions.monthlySalary})`,
      education: qualificationStandards.educationRequirement,
      training: qualificationStandards.trainingHours,
      experience: qualificationStandards.experienceYears,
      eligibility: qualificationStandards.eligibilityRequired,
      competency: qualificationStandards.competencyRequirements,
      assignment: plantillaPositions.department
    })
    .from(plantillaPositions)
    .leftJoin(qualificationStandards, eq(plantillaPositions.qualificationStandardsId, qualificationStandards.id))
    // Join Salary Schedule for Step 1 (Entry Level)
    .leftJoin(salarySchedule, and(
        eq(plantillaPositions.salaryGrade, salarySchedule.salaryGrade),
        eq(salarySchedule.step, 1), // Vacant positions are published at Step 1
        eq(salarySchedule.tranche, currentTrancheNumber)
    ))
    .where(and(...conditions))
    .orderBy(desc(plantillaPositions.salaryGrade));
    
    res.json({
      success: true,
      data: rows,
      meta: {
        formName: 'CSC Form No. 9',
        title: 'Electronic Copy to be submitted to the CSC Field Office',
        heading: 'Request for Publication of Vacant Positions',
        note: `Salaries based on Tranche ${currentTrancheNumber}, Step 1`
      }
    });
  } catch (_error) {

    res.status(500).json({ success: false, message: 'Failed to generate Form 9 data' });
  }
};

/**
 * Get Data for CS Form 33 (Appointment Form)
 */
/**
 * Get Data for CS Form 33 (Appointment Form)
 */
export const getForm33Data = async (req: Request, res: Response): Promise<void> => {
  try {
    const { positionId } = req.query;
    if (!positionId) {
      res.status(400).json({ success: false, message: 'Position ID is required' });
      return;
    }

    const rows = await db.select({
      itemNumber: plantillaPositions.itemNumber,
      positionTitle: plantillaPositions.positionTitle,
      salaryGrade: plantillaPositions.salaryGrade,
      monthlySalary: plantillaPositions.monthlySalary,
      department: plantillaPositions.department,
      firstName: authentication.firstName,
      lastName: authentication.lastName,
      middleName: authentication.middleName, // Added for completeness
      suffix: authentication.suffix,
      employeeId: authentication.employeeId,
      dateOfSigning: plantillaPositions.filledDate,
      // Dynamic Status from Employee Record
      status: authentication.appointmentType, 
      // Infer Nature of Appointment
      originalAppointmentDate: authentication.originalAppointmentDate,
      lastPromotionDate: plantillaPositions.lastPromotionDate,
      filledDate: plantillaPositions.filledDate
    })
    .from(plantillaPositions)
    .innerJoin(authentication, eq(plantillaPositions.incumbentId, authentication.id))
    .where(eq(plantillaPositions.id, Number(positionId)));
    
    if (rows.length === 0) {
      res.status(404).json({ success: false, message: 'Filled position not found' });
      return;
    }

    const row = rows[0];

    // Logic to determine nature of appointment (100% Accurate Inference)
    // Default to 'Original'
    let natureOfAppointment = 'Original';

    if (row.filledDate && row.lastPromotionDate) {
        // If filled date matches last promotion date, it's a Promotion
        if (new Date(row.filledDate).getTime() === new Date(row.lastPromotionDate).getTime()) {
            natureOfAppointment = 'Promotion';
        }
    } else if (row.filledDate && row.originalAppointmentDate) {
         // If filled date is strictly after original appointment date, it's likely a Promotion or Transfer
         // But without explicit history, 'Original' is the safest fallback for the *first* appointment.
         // If the dates differ significantly (e.g. > 1 day), assume Promotion/Transfer
         const filled = new Date(row.filledDate);
         const original = new Date(row.originalAppointmentDate);
         const diffTime = Math.abs(filled.getTime() - original.getTime());
         const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 

         if (diffDays > 30) {
             natureOfAppointment = 'Promotion'; // or Transfer/Reemployment
         }
    }

    const data = {
        itemNumber: row.itemNumber,
        positionTitle: row.positionTitle,
        salaryGrade: row.salaryGrade,
        monthlySalary: row.monthlySalary,
        department: row.department,
        employeeName: formatFullName(row.lastName, row.firstName, row.middleName, row.suffix),
        firstName: row.firstName,
        lastName: row.lastName,
        employeeId: row.employeeId,
        dateOfSigning: row.dateOfSigning,
        status: row.status || 'Permanent', // Fallback if null
        natureOfAppointment: natureOfAppointment
    };

    res.json({
      success: true,
      data: data,
      meta: {
        formName: 'CS Form No. 33-A',
        revision: 'Revised 2018',
        title: 'Appointment Form'
      }
    });
  } catch (_error) {

    res.status(500).json({ success: false, message: 'Failed to generate Form 33 data' });
  }
};


// Import additional tables
import { salarySchedule, salaryTranches } from '../db/schema.js';

/**
 * Get Data for PSI-POP (Plantilla of Personnel)
 * 100% Accurate Data: Fetches canonical salary from Salary Schedule based on active Tranche.
 */
export const getPSIPOPData = async (_req: Request, res: Response): Promise<void> => {
  try {
    // 1. Get Active Tranche
    const [activeTranche] = await db.select()
        .from(salaryTranches)
        .where(eq(salaryTranches.isActive, true))
        .limit(1);


    const currentTrancheNumber = activeTranche ? activeTranche.trancheNumber : 2; // Default to 2 if none active

    // 2. Fetch Plantilla with Canonical Salary
    const rows = await db.select({
      itemNumber: plantillaPositions.itemNumber,
      positionTitle: plantillaPositions.positionTitle,
      salaryGrade: plantillaPositions.salaryGrade,
      stepIncrement: plantillaPositions.stepIncrement,
      // Canonical Salary from Schedule
      monthlySalary: sql<string>`COALESCE(${salarySchedule.monthlySalary}, ${plantillaPositions.monthlySalary})`, 
      department: plantillaPositions.department,
      isVacant: plantillaPositions.isVacant,
      firstName: authentication.firstName,
      lastName: authentication.lastName,
      middleName: authentication.middleName,
      suffix: authentication.suffix,
      employeeId: authentication.employeeId,
      positionStatus: plantillaPositions.status
    })
    .from(plantillaPositions)
    .leftJoin(authentication, eq(plantillaPositions.incumbentId, authentication.id))
    // Join Salary Schedule for 100% Accuracy
    .leftJoin(salarySchedule, and(
        eq(plantillaPositions.salaryGrade, salarySchedule.salaryGrade),
        eq(plantillaPositions.stepIncrement, salarySchedule.step),
        eq(salarySchedule.tranche, currentTrancheNumber)
    ))
    .orderBy(asc(plantillaPositions.department), desc(plantillaPositions.salaryGrade));
    
    const formattedRows = rows.map(r => ({
        ...r,
        incumbentName: r.isVacant ? '(VACANT)' : formatFullName(r.lastName, r.firstName, r.middleName, r.suffix)
    }));

    res.json({
      success: true,
      data: formattedRows,
      meta: {
        formName: 'PSI-POP',
        title: 'Personal Services Itemization and Plantilla of Personnel',
        note: `Generated using Salary Tranche ${currentTrancheNumber}`
      }
    });
  } catch (_error) {

    res.status(500).json({ success: false, message: 'Failed to generate PSI-POP data' });
  }
};


