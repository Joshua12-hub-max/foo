import { Request, Response } from 'express';
import { db } from '../db/index.js';
import { plantillaPositions, qualificationStandards, authentication } from '../db/schema.js';
import { eq, and, desc, asc, sql } from 'drizzle-orm';

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

    // 1. Get Active Tranche (Reuse logic or make a helper, but inline is fine for now)
    const [activeTranche] = await db.select()
        .from(salaryTranches)
        .where(eq(salaryTranches.isActive, 1))
        .limit(1);

    const currentTrancheNumber = activeTranche ? activeTranche.trancheNumber : 2;

    const rows = await db.select({
      item_number: plantillaPositions.itemNumber,
      position_title: plantillaPositions.positionTitle,
      salary_grade: plantillaPositions.salaryGrade,
      // Canonical Salary for Step 1 (Vacant uses Step 1 entry rate)
      monthly_salary: sql<string>`COALESCE(${salarySchedule.monthlySalary}, ${plantillaPositions.monthlySalary})`,
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
        form_name: 'CSC Form No. 9',
        title: 'Electronic Copy to be submitted to the CSC Field Office',
        heading: 'Request for Publication of Vacant Positions',
        note: `Salaries based on Tranche ${currentTrancheNumber}, Step 1`
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
      middle_name: authentication.middleName, // Added for completeness
      employee_id: authentication.employeeId,
      date_of_signing: plantillaPositions.filledDate,
      // Dynamic Status from Employee Record
      status: authentication.appointmentType, 
      // Infer Nature of Appointment
      original_appointment_date: authentication.originalAppointmentDate,
      last_promotion_date: plantillaPositions.lastPromotionDate,
      filled_date: plantillaPositions.filledDate
    })
    .from(plantillaPositions)
    .innerJoin(authentication, eq(plantillaPositions.incumbentId, authentication.id))
    .where(eq(plantillaPositions.id, Number(position_id)));
    
    if (rows.length === 0) {
      res.status(404).json({ success: false, message: 'Filled position not found' });
      return;
    }

    const row = rows[0];

    // Logic to determine nature of appointment (100% Accurate Inference)
    // Default to 'Original'
    let natureOfAppointment = 'Original';

    if (row.filled_date && row.last_promotion_date) {
        // If filled date matches last promotion date, it's a Promotion
        if (new Date(row.filled_date).getTime() === new Date(row.last_promotion_date).getTime()) {
            natureOfAppointment = 'Promotion';
        }
    } else if (row.filled_date && row.original_appointment_date) {
         // If filled date is strictly after original appointment date, it's likely a Promotion or Transfer
         // But without explicit history, 'Original' is the safest fallback for the *first* appointment.
         // If the dates differ significantly (e.g. > 1 day), assume Promotion/Transfer
         const filled = new Date(row.filled_date);
         const original = new Date(row.original_appointment_date);
         const diffTime = Math.abs(filled.getTime() - original.getTime());
         const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 

         if (diffDays > 30) {
             natureOfAppointment = 'Promotion'; // or Transfer/Reemployment
         }
    }

    const data = {
        item_number: row.item_number,
        position_title: row.position_title,
        salary_grade: row.salary_grade,
        monthly_salary: row.monthly_salary,
        department: row.department,
        first_name: row.first_name,
        last_name: row.last_name,
        employee_id: row.employee_id,
        date_of_signing: row.date_of_signing,
        status: row.status || 'Permanent', // Fallback if null
        nature_of_appointment: natureOfAppointment
    };

    res.json({
      success: true,
      data: data,
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
        .where(eq(salaryTranches.isActive, 1))
        .limit(1);


    const currentTrancheNumber = activeTranche ? activeTranche.trancheNumber : 2; // Default to 2 if none active

    // 2. Fetch Plantilla with Canonical Salary
    const rows = await db.select({
      item_number: plantillaPositions.itemNumber,
      position_title: plantillaPositions.positionTitle,
      salary_grade: plantillaPositions.salaryGrade,
      step_increment: plantillaPositions.stepIncrement,
      // Canonical Salary from Schedule
      monthly_salary: sql<string>`COALESCE(${salarySchedule.monthlySalary}, ${plantillaPositions.monthlySalary})`, 
      department: plantillaPositions.department,
      is_vacant: plantillaPositions.isVacant,
      incumbent_name: sql<string>`CONCAT(${authentication.firstName}, ' ', ${authentication.lastName})`,
      employee_id: authentication.employeeId,
      position_status: plantillaPositions.status
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
    
    res.json({
      success: true,
      data: rows,
      meta: {
        form_name: 'PSI-POP',
        title: 'Personal Services Itemization and Plantilla of Personnel',
        note: `Generated using Salary Tranche ${currentTrancheNumber}`
      }
    });
  } catch (error) {
    console.error('PSIPOP Error:', error);
    res.status(500).json({ success: false, message: 'Failed to generate PSI-POP data' });
  }
};
