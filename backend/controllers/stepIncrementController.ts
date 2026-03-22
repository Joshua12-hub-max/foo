import { Request, Response } from 'express';
import { db } from '../db/index.js';
import { 
  stepIncrementTracker, 
  authentication, 
  plantillaPositions, 
  plantillaPositionHistory, 
  salarySchedule,
  leaveApplications,
  lwopSummary,
  pdsHrDetails
} from '../db/schema.js';
import { eq, and, asc, desc, sql, lt, gte } from 'drizzle-orm';
import { alias } from 'drizzle-orm/mysql-core';
import type { AuthenticatedRequest } from '../types/index.js';
import { ZodError } from 'zod';
import {
  StepIncrementTrackerSchema,
  ProcessStepIncrementSchema
} from '../schemas/plantillaComplianceSchema.js';
import { formatFullName } from '../utils/nameUtils.js';

/**
 * Get all step increment records
 * GET /api/step-increment
 */
export const getStepIncrements = async (req: Request, res: Response): Promise<void> => {
  try {
    const { status, employeeId } = req.query;
    const processor = alias(authentication, 'processor');

    const filters = [];
    if (status) {
      filters.push(eq(stepIncrementTracker.status, status as 'Pending' | 'Approved' | 'Denied' | 'Processed'));
    }
    if (employeeId) {
      filters.push(eq(stepIncrementTracker.employeeId, parseInt(employeeId as string)));
    }

    const increments = await db
      .select({
        id: stepIncrementTracker.id,
        employeeId: stepIncrementTracker.employeeId,
        positionId: stepIncrementTracker.positionId,
        currentStep: stepIncrementTracker.currentStep,
        previousStep: stepIncrementTracker.previousStep,
        eligibleDate: stepIncrementTracker.eligibleDate,
        status: stepIncrementTracker.status,
        processedAt: stepIncrementTracker.processedAt,
        processedBy: stepIncrementTracker.processedBy,
        remarks: stepIncrementTracker.remarks,
        firstName: authentication.firstName,
        lastName: authentication.lastName,
        middleName: authentication.middleName,
        suffix: authentication.suffix,
        employeeEmployeeId: authentication.employeeId,
        positionTitle: plantillaPositions.positionTitle,
        salaryGrade: plantillaPositions.salaryGrade,
        procFirstName: processor.firstName,
        procLastName: processor.lastName,
        procMiddleName: processor.middleName,
        procSuffix: processor.suffix
      })
      .from(stepIncrementTracker)
      .leftJoin(authentication, eq(stepIncrementTracker.employeeId, authentication.id))
      .leftJoin(plantillaPositions, eq(stepIncrementTracker.positionId, plantillaPositions.id))
      .leftJoin(processor, eq(stepIncrementTracker.processedBy, processor.id))
      .where(filters.length > 0 ? and(...filters) : undefined)
      .orderBy(asc(stepIncrementTracker.eligibleDate), desc(stepIncrementTracker.createdAt));

    const formattedIncrements = increments.map(i => ({
        ...i,
        employeeName: formatFullName(i.lastName, i.firstName, i.middleName, i.suffix),
        processorName: i.processedBy ? formatFullName(i.procLastName, i.procFirstName, i.procMiddleName, i.procSuffix) : null
    }));

    res.json({
      success: true,
      increments: formattedIncrements
    });
  } catch (_error) {

    res.status(500).json({
      success: false,
      message: 'Failed to fetch step increments'
    });
  }
};

/**
 * Get employees eligible for step increment
 * GET /api/step-increment/eligible
 * 
 * Logic: Employee is eligible if:
 * - Has been in current position for 3+ years
 * - Current step < 8
 * - No promotion in last 3 years
 */
export const getEligibleEmployees = async (_req: Request, res: Response): Promise<void> => {
  try {
    // 1. Fetch all active regular employees with their position details
    // We use leftJoin for history because it might not exist for initial appointments
    const employees = await db.select({
      employeeId: authentication.id,
      firstName: authentication.firstName,
      lastName: authentication.lastName,
      middleName: authentication.middleName,
      suffix: authentication.suffix,
      employeeEmployeeId: authentication.employeeId,
      positionId: plantillaPositions.id,
      positionTitle: plantillaPositions.positionTitle,
      salaryGrade: plantillaPositions.salaryGrade,
      currentStep: pdsHrDetails.stepIncrement,
      dateHired: pdsHrDetails.dateHired,
      historyStartDate: plantillaPositionHistory.startDate
    })
    .from(authentication)
    .innerJoin(plantillaPositions, eq(authentication.id, plantillaPositions.incumbentId))
    .leftJoin(pdsHrDetails, eq(authentication.id, pdsHrDetails.employeeId))
    .leftJoin(plantillaPositionHistory, and(
      eq(plantillaPositions.id, plantillaPositionHistory.positionId),
      eq(authentication.id, plantillaPositionHistory.employeeId),
      sql`${plantillaPositionHistory.endDate} IS NULL`
    ))
    .where(and(
      eq(pdsHrDetails.employmentStatus, 'Active'),
      lt(pdsHrDetails.stepIncrement, 8) // Optimize: pre-filter steps < 8
    ));

    const eligibleEmployees: {
      employeeId: number;
      employeeName: string;
      employeeEmployeeId: string;
      positionTitle: string | null;
      salaryGrade: number;
      currentStep: number;
      yearsInPosition: number;
      eligibleDate: string;
      nextStep: number;
    }[] = [];
    const currentTime = new Date();

    for (const emp of employees) {
      // Determine Start Date
      // Priority: History Start Date -> Date Hired
      const startDateStr = emp.historyStartDate || emp.dateHired;
      if (!startDateStr) continue; // Cannot determine tenure

      const startDate = new Date(startDateStr);
      
      // Calculate Total LWOP Days since Start Date
      const lwopRecords = await db.select({ total: sql<number>`SUM(CAST(total_lwop_days AS DECIMAL(10,3)))` })
        .from(lwopSummary)
        .where(and(
            eq(lwopSummary.employeeId, String(emp.employeeId)),
            sql`year >= YEAR(${startDateStr})`
        ));
      
      const totalLwopDays = Number(lwopRecords[0].total) || 0;
      const lwopTime = totalLwopDays * 24 * 60 * 60 * 1000;

      // Calculate Adjusted Tenure
      const diffTime = currentTime.getTime() - startDate.getTime();
      const adjustedTenureYears = (diffTime - lwopTime) / (1000 * 60 * 60 * 24 * 365.25);

      if (adjustedTenureYears < 3) continue; // Not yet 3 years of actual service

      // Check for Pending or Recent Approved Increments
      const existingTracker = await db.select()
        .from(stepIncrementTracker)
        .where(eq(stepIncrementTracker.employeeId, Number(emp.employeeId)))
        .orderBy(desc(stepIncrementTracker.processedAt));

      // Check 1: Pending Request Exists
      const hasPending = existingTracker.some(t => t.status === 'Pending');
      if (hasPending) continue;

      // Check 2: Recent Approved Increment (< 3 years ago)
      const lastApproved = existingTracker.find(t => t.status === 'Approved');
      let isEligible = true;
      let eligibleDate = new Date(startDate);
      eligibleDate.setFullYear(eligibleDate.getFullYear() + 3);
      if (totalLwopDays > 0) {
        eligibleDate.setDate(eligibleDate.getDate() + Math.ceil(totalLwopDays));
      }

      if (lastApproved && lastApproved.processedAt) {
        const lastProcessedDate = new Date(lastApproved.processedAt);
        const yearsSinceLast = (currentTime.getTime() - lastProcessedDate.getTime() - lwopTime) / (1000 * 60 * 60 * 24 * 365.25);
        
        if (yearsSinceLast < 3) {
          isEligible = false;
        } else {
           // The NEXT eligible date is 3 years from last approval + any LWOP days
           eligibleDate = new Date(lastProcessedDate);
           eligibleDate.setFullYear(eligibleDate.getFullYear() + 3);
           eligibleDate.setDate(eligibleDate.getDate() + Math.ceil(totalLwopDays));
        }
      }

      if (isEligible) {
        // Deduplicate: Check if employee already exists in the list
        const isDuplicate = eligibleEmployees.some(e => e.employeeId === emp.employeeId);
        if (!isDuplicate) {
          eligibleEmployees.push({
            employeeId: emp.employeeId,
            employeeName: formatFullName(emp.lastName, emp.firstName, emp.middleName, emp.suffix),
            employeeEmployeeId: emp.employeeEmployeeId || '',
            positionTitle: emp.positionTitle,
            salaryGrade: Number(emp.salaryGrade),
            currentStep: Number(emp.currentStep),
            yearsInPosition: parseFloat(adjustedTenureYears.toFixed(2)),
            eligibleDate: eligibleDate.toISOString().split('T')[0],
            nextStep: Number(emp.currentStep) + 1
          });
        }
      }
    }

    // Sort by name
    eligibleEmployees.sort((a, b) => a.employeeName.localeCompare(b.employeeName));

    res.json({
      success: true,
      eligibleEmployees: eligibleEmployees,
      count: eligibleEmployees.length
    });
  } catch (_error) {

    res.status(500).json({
      success: false,
      message: 'Failed to fetch eligible employees'
    });
  }
};

/**
 * Create step increment request
 * POST /api/step-increment
 */
export const createStepIncrement = async (req: Request, res: Response): Promise<void> => {
  try {
    const validatedData = StepIncrementTrackerSchema.parse(req.body);

    // Verify employee exists
    const employee = await db.query.authentication.findFirst({
      where: eq(authentication.id, validatedData.employeeId),
      columns: { id: true },
      with: {
        hrDetails: {
          columns: { stepIncrement: true }
        }
      } as any // Workaround for query builder with joins if needed, or use db.select
    });

    if (!employee) {
      res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
      return;
    }

    const result = await db.insert(stepIncrementTracker).values({
      employeeId: validatedData.employeeId,
      positionId: validatedData.positionId,
      currentStep: validatedData.currentStep,
      previousStep: validatedData.previousStep || null,
      eligibleDate: validatedData.eligibleDate,
      status: validatedData.status as 'Pending' | 'Approved' | 'Denied' | 'Processed',
      remarks: validatedData.remarks || null
    });

    res.status(201).json({
      success: true,
      message: 'Step increment request created successfully',
      id: result[0].insertId
    });
  } catch (error) {

    if (error instanceof ZodError) {
      res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.issues
      });
      return;
    }

    res.status(500).json({
      success: false,
      message: 'Failed to create step increment request'
    });
  }
};

/**
 * Process step increment (Approve/Deny)
 * POST /api/step-increment/process
 */
export const processStepIncrement = async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const validatedData = ProcessStepIncrementSchema.parse(req.body);
    const { incrementId, status, remarks } = validatedData;


    // Get increment details
    const increment = await db.query.stepIncrementTracker.findFirst({
      where: eq(stepIncrementTracker.id, incrementId)

    });

    if (!increment) {
      res.status(404).json({
        success: false,
        message: 'Step increment request not found'
      });
      return;
    }

    if (increment.status === 'Processed') {
      res.status(400).json({
        success: false,
        message: 'This increment has already been processed'
      });
      return;
    }

    // Update increment status
    await db.update(stepIncrementTracker)
      .set({ 
        status: status as 'Pending' | 'Approved' | 'Denied' | 'Processed', 
        processedAt: new Date().toISOString(), 
        processedBy: authReq.user.id, 
        remarks: remarks || null 
      })
      .where(eq(stepIncrementTracker.id, incrementId));


    // If approved, update employee and position
    if (status === 'Approved') {
      const newStep = increment.currentStep + 1;

      // Update employee step in pdsHrDetails
      await db.update(pdsHrDetails)
        .set({ stepIncrement: newStep })
        .where(eq(pdsHrDetails.employeeId, increment.employeeId));

      // Update position step
      await db.update(plantillaPositions)
        .set({ stepIncrement: newStep })
        .where(eq(plantillaPositions.id, increment.positionId));

      // Get new salary from salary_schedule
      // We need to fetch the salary grade of the position first
      const position = await db.query.plantillaPositions.findFirst({
        where: eq(plantillaPositions.id, increment.positionId),
        columns: { salaryGrade: true }
      });

      if (position) {
        const salary = await db.query.salarySchedule.findFirst({
          where: and(
            eq(salarySchedule.salaryGrade, position.salaryGrade),
            eq(salarySchedule.step, newStep)
          )
        });

        if (salary) {
          await db.update(plantillaPositions)
            .set({ monthlySalary: salary.monthlySalary })
            .where(eq(plantillaPositions.id, increment.positionId));
        }
      }

      // Mark as processed
      await db.update(stepIncrementTracker)
        .set({ status: 'Processed' })
        .where(eq(stepIncrementTracker.id, incrementId));

    }

    res.json({
      success: true,
      message: `Step increment ${status.toLowerCase()} successfully`
    });
  } catch (error) {

    if (error instanceof ZodError) {
      res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.issues
      });
      return;
    }

    res.status(500).json({
      success: false,
      message: 'Failed to process step increment'
    });
  }
};

/**
 * Get next step increment date for a specific employee
 * GET /api/step-increment/:id/next
 */
export const getNextStepIncrement = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params as { id: string };
    const employeeId = parseInt(id);

    // 1. Get Employee Position & Start Date
    const employee = await db.select({
      employeeId: authentication.id,
      dateHired: pdsHrDetails.dateHired,
      historyStartDate: plantillaPositionHistory.startDate,
      lastPromotionDate: plantillaPositions.lastPromotionDate,
      currentStep: pdsHrDetails.stepIncrement,
    })
    .from(authentication)
    .leftJoin(pdsHrDetails, eq(authentication.id, pdsHrDetails.employeeId))
    .leftJoin(plantillaPositions, eq(authentication.id, plantillaPositions.incumbentId))
    .leftJoin(plantillaPositionHistory, and(
      eq(plantillaPositions.id, plantillaPositionHistory.positionId),
      eq(authentication.id, plantillaPositionHistory.employeeId),
      sql`${plantillaPositionHistory.endDate} IS NULL`
    ))
    .where(eq(authentication.id, employeeId))
    .limit(1);

    if (!employee || employee.length === 0) {
      res.status(404).json({ success: false, message: 'Employee not found' });
      return;
    }

    const emp = employee[0];
    
    // Determine Base Date for calculation
    const baseDateStr = emp.lastPromotionDate || emp.historyStartDate || emp.dateHired;
    
    if (!baseDateStr) {
      res.json({ success: true, nextStepDate: null, reason: 'No start date found' });
      return;
    }

    const baseDate = new Date(baseDateStr);

    // 2. Calculate Total LWOP Days since Base Date (Precise Calculation)
    const lwopResult = await db.select({ 
      totalLwop: sql<string>`sum(${leaveApplications.daysWithoutPay})` 
    })
    .from(leaveApplications)
    .where(and(
      eq(leaveApplications.employeeId, String(employeeId)),
      gte(leaveApplications.startDate, baseDateStr), // Only count LWOP *after* the base date
      eq(leaveApplications.status, 'Approved')
    ));
    
    const totalLwopDays = Number(lwopResult[0]?.totalLwop || 0);

    // 3. Calculate Next Step Date
    // Formula: Base Date + 3 Years + Total LWOP Days
    const nextStepDate = new Date(baseDate);
    nextStepDate.setFullYear(nextStepDate.getFullYear() + 3);
    
    if (totalLwopDays > 0) {
      nextStepDate.setDate(nextStepDate.getDate() + Math.ceil(totalLwopDays));
    }

    res.json({
      success: true,
      currentStep: emp.currentStep,
      baseDate: baseDateStr,
      totalLwopDays,
      nextStepDate: nextStepDate.toISOString().split('T')[0]
    });

  } catch (_error) {

    res.status(500).json({ success: false, message: 'Failed to calculate next step increment' });
  }
};



