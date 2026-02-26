import { Request, Response } from 'express';
import { db } from '../db/index.js';
import { authentication, tardinessSummary, policyViolations } from '../db/schema.js';
import { employeeMemos } from '../db/tables/pds.js';
import { eq, and, desc, sql } from 'drizzle-orm';

/**
 * Get detailed metrics for an employee
 * Includes: Duty Type, Target Hours, Tardiness Stats, and Violation History
 */
export const getEmployeeMetrics = async (req: Request, res: Response): Promise<void> => {
  try {
    const { employeeId } = req.params as { employeeId: string };
    const { year, month } = req.query;

    if (!employeeId) {
      res.status(400).json({ success: false, message: 'Employee ID is required' });
      return;
    }

    // 1. Fetch Employee Duty Info
    // Try by numeric id first if possible, else by employeeId string
    const isNumericId = !isNaN(Number(employeeId));
    let employee;

    if (isNumericId) {
        [employee] = await db.select({
            id: authentication.id,
            firstName: authentication.firstName,
            lastName: authentication.lastName,
            dutyType: authentication.dutyType,
            dailyTargetHours: authentication.dailyTargetHours,
            salaryBasis: authentication.salaryBasis,
            employeeId: authentication.employeeId // internal string ID
        })
        .from(authentication)
        .where(eq(authentication.id, Number(employeeId)))
        .limit(1);
    }

    if (!employee) {
        [employee] = await db.select({
            id: authentication.id,
            firstName: authentication.firstName,
            lastName: authentication.lastName,
            dutyType: authentication.dutyType,
            dailyTargetHours: authentication.dailyTargetHours,
            salaryBasis: authentication.salaryBasis,
            employeeId: authentication.employeeId
        })
        .from(authentication)
        .where(eq(authentication.employeeId, employeeId))
        .limit(1);
    }

    if (!employee) {
      res.status(404).json({ success: false, message: 'Employee not found' });
      return;
    }

    // 2. Fetch Tardiness Summary
    const currentYear = year ? Number(year) : new Date().getFullYear();
    const currentMonth = month ? Number(month) : new Date().getMonth() + 1;

    const [summary] = await db.select()
    .from(tardinessSummary)
    .where(and(
      eq(tardinessSummary.employeeId, employee.employeeId),
      eq(tardinessSummary.year, currentYear),
      eq(tardinessSummary.month, currentMonth)
    ))
    .limit(1);

    // 3. Fetch Recent Violations
    const violations = await db.select({
      id: policyViolations.id,
      violationDate: policyViolations.createdAt,
      status: policyViolations.status,
      penalty: employeeMemos.memoType,
      policyTitle: sql`COALESCE(${employeeMemos.subject}, ${policyViolations.type})`
    })
    .from(policyViolations)
    .leftJoin(employeeMemos, eq(policyViolations.memoId, employeeMemos.id))
    .where(eq(policyViolations.employeeId, employee.employeeId))
    .orderBy(desc(policyViolations.createdAt))
    .limit(5);

    res.json({
      success: true,
      employee: {
        ...employee,
        employeeId: employee.employeeId
      },
      metrics: {
        attendance: summary || {
          totalLateMinutes: 0,
          totalUndertimeMinutes: 0,
          totalLateCount: 0,
          totalUndertimeCount: 0,
          totalAbsenceCount: 0,
          daysEquivalent: "0.000"
        },
        violations: violations
      }
    });

  } catch (error) {
    console.error('[COMPLIANCE] Error fetching employee metrics:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

/**
 * Get all violations summary for the compliance dashboard
 */
export const getAllViolations = async (_req: Request, res: Response): Promise<void> => {
    try {
        const violations = await db.select({
            id: policyViolations.id,
            employeeId: policyViolations.employeeId,
            employeeName: sql`CONCAT(${authentication.firstName}, ' ', ${authentication.lastName})`,
            violationDate: policyViolations.createdAt,
            status: policyViolations.status,
            penalty: employeeMemos.memoType,
            policyTitle: sql`COALESCE(${employeeMemos.subject}, ${policyViolations.type})`
        })
        .from(policyViolations)
        .leftJoin(authentication, eq(policyViolations.employeeId, authentication.employeeId))
        .leftJoin(employeeMemos, eq(policyViolations.memoId, employeeMemos.id))
        .orderBy(desc(policyViolations.createdAt))
        .limit(100);

        res.json({ success: true, violations });
    } catch (error) {
        console.error('[COMPLIANCE] Error fetching violations:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};
