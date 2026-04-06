import { Request, Response } from 'express';
import { db } from '../db/index.js';
import { 
  plantillaPositions, 
  departments, 
  authentication, 
  plantillaAuditLog, 
  plantillaPositionHistory, 
  salarySchedule,
  salaryTranches,
  pdsHrDetails
} from '../db/schema.js';
import { eq, and, sql, asc, desc, isNull, ne, inArray } from 'drizzle-orm';
import type { AuthenticatedRequest } from '../types/index.js';
import { 
  PlantillaPositionApiResponse, 
  PlantillaAuditLogApiResponse, 
  PlantillaHistoryApiResponse 
} from '../types/org.js';
import { 
  createPositionSchema, 
  updatePositionSchema, 
  assignEmployeeSchema, 
  vacatePositionSchema, 
  abolishPositionSchema, 
  uploadSalarySchema,
  createTrancheSchema 
} from '../schemas/plantillaSchema.js';
import { z } from 'zod';
import { InferSelectModel } from 'drizzle-orm';
import { QualificationService } from '../services/qualificationService.js';
import { formatFullName } from '../utils/nameUtils.js';

interface PlantillaSelectRow {
  id: number;
  itemNumber: string;
  positionTitle: string;
  salaryGrade: number;
  stepIncrement: number | null;
  department: string | null;
  departmentId: number | null;
  isVacant: boolean | null;
  incumbentId: number | null;
  monthlySalary: string | null;
  filledDate: string | null;
  vacatedDate: string | null;
  status: 'Active' | 'Abolished' | 'Frozen' | null;
  areaCode: string | null;
  areaType: 'R' | 'P' | 'D' | 'M' | 'F' | 'B' | null;
  areaLevel: 'K' | 'T' | 'S' | 'A' | null;
  lastPromotionDate: string | null;
  departmentName: string | null;
  incumbentFirstName: string | null;
  incumbentLastName: string | null;
  incumbentMiddleName: string | null;
  incumbentEmployeeId: string | null;
  empLastPromotionDate?: string | null;
  ordinanceNumber?: string | null;
  ordinanceDate?: string | null;
  abolishmentOrdinance?: string | null;
  abolishmentDate?: string | null;
  qualificationStandardsId?: number | null;
  budgetSource?: string | null;
  isCoterminous?: boolean | null;
}

interface AuditLogSelectRow {
  id: number;
  positionId: number;
  action: string;
  actorId: number;
  oldValues: unknown;
  newValues: unknown;
  createdAt: string | null;
  itemNumber: string | null;
  positionTitle: string | null;
  actorFirstName: string | null;
  actorLastName: string | null;
}

/**
 * Strictly maps a Plantilla Position DB/Join model to its API response counterpart.
 */
const mapToPlantillaApi = (pos: PlantillaSelectRow): PlantillaPositionApiResponse => {
  return {
    id: pos.id,
    itemNumber: String(pos.itemNumber || ''),
    positionTitle: String(pos.positionTitle || ''),
    salaryGrade: Number(pos.salaryGrade),
    stepIncrement: pos.stepIncrement ? Number(pos.stepIncrement) : null,
    department: String(pos.departmentName || pos.department || ''),
    departmentId: pos.departmentId ? Number(pos.departmentId) : null,
    isVacant: pos.isVacant !== undefined && pos.isVacant !== null ? (pos.isVacant ? 1 : 0) : 1,
    incumbentId: pos.incumbentId ? Number(pos.incumbentId) : null,
    monthlySalary: pos.monthlySalary ? String(pos.monthlySalary) : null,
    filledDate: pos.filledDate ? String(pos.filledDate) : null,
    vacatedDate: pos.vacatedDate ? String(pos.vacatedDate) : null,
    ordinanceNumber: pos.ordinanceNumber ? String(pos.ordinanceNumber) : null,
    ordinanceDate: pos.ordinanceDate ? String(pos.ordinanceDate) : null,
    abolishmentOrdinance: pos.abolishmentOrdinance ? String(pos.abolishmentOrdinance) : null,
    abolishmentDate: pos.abolishmentDate ? String(pos.abolishmentDate) : null,
    qualificationStandardsId: pos.qualificationStandardsId ? Number(pos.qualificationStandardsId) : null,
    budgetSource: String(pos.budgetSource || 'Regular'),
    isCoterminous: pos.isCoterminous !== undefined && pos.isCoterminous !== null ? (pos.isCoterminous ? 1 : 0) : 0,
    status: (pos.status || 'Active') as 'Active' | 'Abolished' | 'Frozen',
    areaCode: pos.areaCode ? String(pos.areaCode) : null,
    areaType: pos.areaType ? pos.areaType as 'R' | 'P' | 'D' | 'M' | 'F' | 'B' : null,
    areaLevel: pos.areaLevel ? pos.areaLevel as 'K' | 'T' | 'S' | 'A' : null,
    lastPromotionDate: (pos.empLastPromotionDate || pos.lastPromotionDate) ? String(pos.empLastPromotionDate || pos.lastPromotionDate) : null,
    
    // Joined fields
    incumbentName: String(pos.incumbentLastName 
      ? `${pos.incumbentLastName}, ${pos.incumbentFirstName} ${pos.incumbentMiddleName || ''}`.trim() 
      : ''),
    incumbentEmployeeId: pos.incumbentEmployeeId ? String(pos.incumbentEmployeeId) : null,
    incumbentFirstName: pos.incumbentFirstName ? String(pos.incumbentFirstName) : null,
    incumbentLastName: pos.incumbentLastName ? String(pos.incumbentLastName) : null,
    incumbentMiddleName: pos.incumbentMiddleName ? String(pos.incumbentMiddleName) : null,
    departmentName: pos.departmentName ? String(pos.departmentName) : null
  };
};

/**
 * Strictly maps an Audit Log DB model to its API response counterpart.
 */
const mapToAuditLogApi = (log: AuditLogSelectRow): PlantillaAuditLogApiResponse => {
  return {
    id: log.id,
    positionId: Number(log.positionId),
    action: String(log.action),
    actorId: Number(log.actorId),
    oldValues: (log.oldValues as Record<string, unknown> | null) || null,
    newValues: (log.newValues as Record<string, unknown> | null) || null,
    createdAt: log.createdAt ? new Date(String(log.createdAt)).toISOString() : null,
    itemNumber: log.itemNumber ? String(log.itemNumber) : undefined,
    positionTitle: log.positionTitle ? String(log.positionTitle) : undefined,
    actorName: (log.actorFirstName || log.actorLastName) ? `${log.actorLastName}, ${log.actorFirstName}`.trim() : 'Unknown'
  };
};

/**
 * Strictly maps a Position History DB model to its API response counterpart.
 */
const mapToHistoryApi = (history: InferSelectModel<typeof plantillaPositionHistory>): PlantillaHistoryApiResponse => {
  return {
    id: history.id,
    positionId: history.positionId,
    employeeId: history.employeeId,
    employeeName: history.employeeName || null,
    positionTitle: history.positionTitle || null,
    startDate: String(history.startDate),
    endDate: history.endDate ? String(history.endDate) : null,
    reason: history.reason || null,
    createdAt: history.createdAt ? new Date(String(history.createdAt)).toISOString() : null
  };
};

/**
 * Log action to plantilla audit log
 */
const logAudit = async (
  positionId: number, 
  action: string, 
  actorId: number, 
  oldValues: Record<string, unknown> | null = null, 
  newValues: Record<string, unknown> | null = null
): Promise<void> => {
  try { 
    await db.insert(plantillaAuditLog).values({
      positionId,
      action,
      actorId,
      oldValues,
      newValues
    });
  } catch (_error) { 
      /* empty */

  }
};

/**
 * Recursively fetch all sub-department IDs for a parent department.
 * @param parentId - The current parent department ID
 * @returns Array of descendant department IDs (including the parent)
 */
const getDepartmentDescendants = async (parentId: number): Promise<number[]> => {
  const children = await db.select({ id: departments.id })
    .from(departments)
    .where(eq(departments.parentDepartmentId, parentId));
  
  let ids = [parentId];
  for (const child of children) {
    const descendantIds = await getDepartmentDescendants(child.id);
    ids = [...ids, ...descendantIds];
  }
  return ids;
};

export const getPlantilla = async (req: Request, res: Response): Promise<void> => {
  try {
    const { departmentId, isVacant } = req.query;
    
    const whereConditions = [];
    if (departmentId && departmentId !== 'All') {
      const deptIdNum = Number(departmentId);
      // Recursively get all descendant department IDs (including parent)
      const allRelatedDeptIds = await getDepartmentDescendants(deptIdNum);
      
      if (allRelatedDeptIds.length > 1) {
        whereConditions.push(inArray(plantillaPositions.departmentId, allRelatedDeptIds));
      } else {
        whereConditions.push(eq(plantillaPositions.departmentId, deptIdNum));
      }
    }
    if (isVacant !== undefined) {
      whereConditions.push(eq(plantillaPositions.isVacant, isVacant === 'true' || isVacant === '1' ? true : false));
    }

    const positions = await db.select({
      id: plantillaPositions.id,
      itemNumber: plantillaPositions.itemNumber,
      positionTitle: plantillaPositions.positionTitle,
      salaryGrade: plantillaPositions.salaryGrade,
      stepIncrement: plantillaPositions.stepIncrement,
      departmentId: plantillaPositions.departmentId,
      department: plantillaPositions.department,
      isVacant: plantillaPositions.isVacant,
      incumbentId: plantillaPositions.incumbentId,
      monthlySalary: plantillaPositions.monthlySalary,
      filledDate: plantillaPositions.filledDate,
      vacatedDate: plantillaPositions.vacatedDate,
      status: plantillaPositions.status,
      areaCode: plantillaPositions.areaCode,
      areaType: plantillaPositions.areaType,
      areaLevel: plantillaPositions.areaLevel,
      lastPromotionDate: plantillaPositions.lastPromotionDate,
      departmentName: departments.name,
      incumbentFirstName: authentication.firstName,
      incumbentLastName: authentication.lastName,
      incumbentMiddleName: authentication.middleName,
      incumbentEmployeeId: authentication.employeeId,
      dateHired: pdsHrDetails.dateHired,
      originalAppointmentDate: pdsHrDetails.originalAppointmentDate,
      empLastPromotionDate: pdsHrDetails.lastPromotionDate
    })
    .from(plantillaPositions)
    .leftJoin(departments, eq(plantillaPositions.departmentId, departments.id))
    .leftJoin(authentication, eq(plantillaPositions.incumbentId, authentication.id))
    .leftJoin(pdsHrDetails, eq(authentication.id, pdsHrDetails.employeeId))
    .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
    .orderBy(asc(plantillaPositions.itemNumber));

    const formattedPositions = positions.map(mapToPlantillaApi);

    res.json({ success: true, positions: formattedPositions });
  } catch (_error) { 

    res.status(500).json({ success: false, message: 'Failed to fetch plantilla' }); 
  }
};


export const getPublicPositions = async (_req: Request, res: Response): Promise<void> => {
  try {
    const result = await db
      .select({ 
        id: plantillaPositions.id, 
        positionTitle: plantillaPositions.positionTitle,
        itemNumber: plantillaPositions.itemNumber,
        department: plantillaPositions.department,
        departmentId: plantillaPositions.departmentId
      })
      .from(plantillaPositions)
      .orderBy(asc(plantillaPositions.positionTitle));
      
    res.status(200).json({ success: true, positions: result });
  } catch (_error) {

    res.status(500).json({ success: false, message: 'Failed to fetch positions' });
  }
};

export const getPlantillaSummary = async (_req: Request, res: Response): Promise<void> => {
  try {
    const [summary] = await db.select({
      total: sql<number>`count(*)`,
      vacant: sql<number>`sum(case when ${plantillaPositions.isVacant} = 1 then 1 else 0 end)`,
      filled: sql<number>`sum(case when ${plantillaPositions.isVacant} = 0 then 1 else 0 end)`,
      totalMonthlySalary: sql<number>`sum(coalesce(${plantillaPositions.monthlySalary}, 0))`
    }).from(plantillaPositions);
    
    const total = Number(summary.total || 0);
    const vacant = Number(summary.vacant || 0);
    const filled = Number(summary.filled || 0);
    const totalSalary = Number(summary.totalMonthlySalary || 0);
    
    res.json({ 
      success: true, 
      summary: { 
        total, 
        vacant, 
        filled, 
        vacancyRate: total > 0 ? Number(((vacant / total) * 100).toFixed(1)) : 0, 
        totalMonthlySalary: totalSalary, 
        annualBudget: totalSalary * 12 
      } 
    });
  } catch (_error) { 

    res.status(500).json({ success: false, message: 'Failed to fetch summary' }); 
  }
};

export const createPosition = async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    
    // Zod Validation
    const validatedData = createPositionSchema.parse(req.body);

    const dept = await db.query.departments.findFirst({
      where: eq(departments.id, validatedData.departmentId),
      columns: { name: true }
    });

    const result = await db.insert(plantillaPositions).values({
      itemNumber: validatedData.itemNumber,
      positionTitle: validatedData.positionTitle,
      salaryGrade: validatedData.salaryGrade,
      stepIncrement: validatedData.stepIncrement,
      departmentId: validatedData.departmentId,
      department: dept?.name || null,
      monthlySalary: validatedData.monthlySalary ? String(validatedData.monthlySalary) : null,
      areaCode: validatedData.areaCode || null,
      areaType: validatedData.areaType || null,
      areaLevel: validatedData.areaLevel || null,
      isVacant: validatedData.isVacant ? true : false
    });

    const insertId = result[0].insertId;
    await logAudit(insertId, 'created', authReq.user.id, null, validatedData);
    
    res.status(201).json({ success: true, message: 'Position created successfully', id: insertId });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
        res.status(400).json({ success: false, message: 'Validation Error', errors: (error as z.ZodError).issues });
        return;
    }
    if (error instanceof Error && 'code' in error && (error as Record<string, unknown>).code === 'ER_DUP_ENTRY') { 
      res.status(409).json({ success: false, message: 'Item number already exists' }); 
      return; 
    }

    res.status(500).json({ success: false, message: 'Failed to create position' });
  }
};

export const updatePosition = async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest; 
    const { id } = req.params;
    
    // Zod Validation
    const updates = updatePositionSchema.parse(req.body);

    const oldData = await db.query.plantillaPositions.findFirst({
      where: eq(plantillaPositions.id, Number(id))
    });

    if (!oldData) { 
      res.status(404).json({ success: false, message: 'Position not found' }); 
      return; 
    }

    const dept = updates.departmentId ? await db.query.departments.findFirst({
      where: eq(departments.id, updates.departmentId),
      columns: { name: true }
    }) : null;

    await db.update(plantillaPositions)
      .set({
        itemNumber: updates.itemNumber,
        positionTitle: updates.positionTitle,
        salaryGrade: updates.salaryGrade,
        stepIncrement: updates.stepIncrement,
        departmentId: updates.departmentId,
        department: dept?.name || oldData.department, // Keep old department name if not updating departmentId
        isVacant: updates.isVacant ? true : false,
        monthlySalary: updates.monthlySalary ? String(updates.monthlySalary) : null,
        areaCode: updates.areaCode || null,
        areaType: updates.areaType || null,
        areaLevel: updates.areaLevel || null,
        lastPromotionDate: updates.lastPromotionDate || null
      })
      .where(eq(plantillaPositions.id, Number(id)));

    await logAudit(Number(id), 'updated', authReq.user.id, oldData, updates);
    res.json({ success: true, message: 'Position updated successfully' });
  } catch (error: unknown) { 
    if (error instanceof z.ZodError) {
        res.status(400).json({ success: false, message: 'Validation Error', errors: (error as z.ZodError).issues });
        return;
    }

    res.status(500).json({ success: false, message: 'Failed to update position' }); 
  }
};

export const deletePosition = async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest; 
    const { id } = req.params;

    const oldData = await db.query.plantillaPositions.findFirst({
      where: eq(plantillaPositions.id, Number(id))
    });

    if (!oldData) { 
      res.status(404).json({ success: false, message: 'Position not found' }); 
      return; 
    }

    if (oldData.incumbentId) { 
      res.status(400).json({ success: false, message: 'Cannot delete filled position. Please vacate the position first.' }); 
      return; 
    }

    await db.delete(plantillaPositions).where(eq(plantillaPositions.id, Number(id)));
    await logAudit(Number(id), 'deleted', authReq.user.id, oldData, null);
    
    res.json({ success: true, message: 'Position deleted successfully' });
  } catch (_error) { 

    res.status(500).json({ success: false, message: 'Failed to delete position' }); 
  }
};

export const assignEmployee = async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest; 
    const { id } = req.params;
    
    // Zod Validation
    const { employeeId, startDate } = assignEmployeeSchema.parse(req.body);

    // 1. Get Target Position
    const position = await db.query.plantillaPositions.findFirst({
      where: eq(plantillaPositions.id, Number(id))
    });

    if (!position) { 
      res.status(404).json({ success: false, message: 'Position not found' }); 
      return; 
    }
    if (!position.isVacant) { 
      res.status(400).json({ success: false, message: 'Position is already filled' }); 
      return; 
    }

    // 2. Get Employee and their Current Salary
    const employee = await db.query.authentication.findFirst({
      where: eq(authentication.id, Number(employeeId)),
      with: {
        hrDetails: true
      }
    });

    if (!employee) { 
      res.status(404).json({ success: false, message: 'Employee not found' }); 
      return; 
    }
    
    let currentSalary = 0;
    if (employee?.hrDetails?.positionId) {
       const currentPos = await db.query.plantillaPositions.findFirst({
         where: eq(plantillaPositions.id, employee.hrDetails.positionId),
         columns: { monthlySalary: true }
       });
       if (currentPos) {
         currentSalary = Number(currentPos.monthlySalary || 0);
       }
    }

    // 3. Calculate Salary for Promotion
    const newGrade = position.salaryGrade;
    const activeTranche = await db.query.salaryTranches.findFirst({
      where: eq(salaryTranches.isActive, true)
    });
    const trancheNum = activeTranche?.trancheNumber || 2;

    const salarySteps = await db.select()
      .from(salarySchedule)
      .where(and(
        eq(salarySchedule.salaryGrade, newGrade),
        eq(salarySchedule.tranche, trancheNum)
      ))
      .orderBy(asc(salarySchedule.step));

    const targetStep = 1;
    let targetSalary = 0;

    if (salarySteps.length > 0) {
      const step1Salary = Number(salarySteps[0].monthlySalary);
      targetSalary = currentSalary > step1Salary ? currentSalary : step1Salary;
    } else {
      const positionSalary = Number(position.monthlySalary || 0);
      targetSalary = currentSalary > positionSalary ? currentSalary : positionSalary;
    }

    // 3.5. Enforce Qualification Standards
    // Import dynamically or at top. Since we're in a controller, importing at top is better, but let's check imports first.
    // For now, I will assume the import is added at the top in a separate step or I can add it here if I replace the whole file or a larger chunk.
    // To be safe and clean, I will use a separate step to add the import, and here I will just add the logic.
    // Wait, I can't easily add import if I don't see the top. 
    // I will use a multi-step approach: 1. Add import, 2. Add logic.
    // Actually, I can doing it all in one go if I read the file again or just trust my memory/view.
    // Let's look at `plantillaController.ts` again to be sure where to insert import.
    // It's already imported in `qualificationStandardsController.ts`, so I need to import `QualificationService` in `plantillaController.ts`.
    
    // Logic insertion:
    const validationResult = await QualificationService.validate(Number(employeeId), Number(id));
    
    if (!validationResult.qualified) {
        res.status(400).json({ 
            success: false, 
            message: 'Employee does not meet the Qualification Standards for this position',
            missingRequirements: validationResult.missingRequirements,
            score: validationResult.score
        });
        return;
    }

    const assignDate = startDate || new Date().toISOString().split('T')[0];

    await db.transaction(async (tx) => {
      // 4. Update Position Table
      await tx.update(plantillaPositions)
        .set({ 
          incumbentId: Number(employeeId), 
          isVacant: false, 
          filledDate: assignDate, 
          vacatedDate: null, 
          stepIncrement: targetStep, 
          monthlySalary: String(targetSalary)
        })
        .where(eq(plantillaPositions.id, Number(id)));

      // 5. Update Employee Profile
      await tx.update(pdsHrDetails)
        .set({ 
          jobTitle: position.positionTitle, 
          positionTitle: position.positionTitle, 
          itemNumber: position.itemNumber, 
          positionId: Number(id), 
          departmentId: position.departmentId, 
          salaryGrade: String(position.salaryGrade), 
          stepIncrement: targetStep 
        })
        .where(eq(pdsHrDetails.employeeId, Number(employeeId)));

      // 6. Record History
      await tx.insert(plantillaPositionHistory).values({
        positionId: Number(id),
        employeeId: Number(employeeId),
        employeeName: formatFullName(employee.lastName, employee.firstName, employee.middleName, employee.suffix),
        positionTitle: position.positionTitle,
        startDate: assignDate
      });

      await logAudit(Number(id), 'assigned', authReq.user.id, 
        { isVacant: true, incumbentId: null }, 
        { isVacant: false, incumbentId: employeeId, step: targetStep, salary: targetSalary }
      );
    });
    
    res.json({ success: true, message: 'Employee assigned and salary protected successfully', step: targetStep, salary: targetSalary });
  } catch (error) { 
    if (error instanceof z.ZodError) {
        res.status(400).json({ success: false, message: 'Validation Error', errors: (error as z.ZodError).issues });
        return;
    }

    res.status(500).json({ success: false, message: 'Failed to assign employee' }); 
  }
};

export const vacatePosition = async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest; 
    const { id } = req.params;

    // Zod Validation
    const { reason, endDate } = vacatePositionSchema.parse(req.body);

    const position = await db.query.plantillaPositions.findFirst({
      where: eq(plantillaPositions.id, Number(id))
    });

    if (!position) { res.status(404).json({ success: false, message: 'Position not found' }); return; }
    if (position.isVacant) { res.status(400).json({ success: false, message: 'Position is already vacant' }); return; }

    const vacateDate = endDate || new Date().toISOString().split('T')[0];

    await db.transaction(async (tx) => {
      await tx.update(plantillaPositionHistory)
        .set({ endDate: vacateDate, reason: reason || 'Position vacated' })
        .where(and(
          eq(plantillaPositionHistory.positionId, Number(id)),
          eq(plantillaPositionHistory.employeeId, position.incumbentId!),
          isNull(plantillaPositionHistory.endDate)
        ));

      await tx.update(plantillaPositions)
        .set({ incumbentId: null, isVacant: true, vacatedDate: vacateDate })
        .where(eq(plantillaPositions.id, Number(id)));

      await tx.update(pdsHrDetails)
        .set({ jobTitle: 'Unassigned', positionTitle: null, itemNumber: null, positionId: null })
        .where(eq(pdsHrDetails.employeeId, position.incumbentId!));

      await logAudit(Number(id), 'vacated', authReq.user.id, 
        { isVacant: false, incumbentId: position.incumbentId }, 
        { isVacant: true, incumbentId: null, reason }
      );
    });

    res.json({ success: true, message: 'Position vacated successfully' });
  } catch (error) { 
    if (error instanceof z.ZodError) {
        res.status(400).json({ success: false, message: 'Validation Error', errors: (error as z.ZodError).issues });
        return;
    }

    res.status(500).json({ success: false, message: 'Failed to vacate position' }); 
  }
};

export const getPositionHistory = async (req: Request, res: Response): Promise<void> => {
  try { 
    const { id } = req.params; 
    const history = await db.select()
      .from(plantillaPositionHistory)
      .where(eq(plantillaPositionHistory.positionId, Number(id)))
    const formattedHistory = history.map(mapToHistoryApi);
    res.json({ success: true, history: formattedHistory }); 
  } catch (_error) { 

    res.status(500).json({ success: false, message: 'Failed to fetch position history' }); 
  }
};

export const getAuditLog = async (req: Request, res: Response): Promise<void> => {
  try {
    const { positionId, limit = '50' } = req.query;
    
    const logs = await db.select({
      id: plantillaAuditLog.id,
      positionId: plantillaAuditLog.positionId,
      action: plantillaAuditLog.action,
      actorId: plantillaAuditLog.actorId,
      oldValues: plantillaAuditLog.oldValues,
      newValues: plantillaAuditLog.newValues,
      createdAt: plantillaAuditLog.createdAt,
      itemNumber: plantillaPositions.itemNumber,
      positionTitle: plantillaPositions.positionTitle,
      actorFirstName: authentication.firstName,
      actorLastName: authentication.lastName
    })
    .from(plantillaAuditLog)
    .leftJoin(plantillaPositions, eq(plantillaAuditLog.positionId, plantillaPositions.id))
    .leftJoin(authentication, eq(plantillaAuditLog.actorId, authentication.id))
    .where(positionId ? eq(plantillaAuditLog.positionId, Number(positionId)) : undefined)
    .orderBy(desc(plantillaAuditLog.createdAt))
    .limit(Number(limit));

    const formattedLogs = logs.map(mapToAuditLogApi);

    res.json({ success: true, logs: formattedLogs });
  } catch (_error) { 

    res.status(500).json({ success: false, message: 'Failed to fetch audit log' }); 
  }
};

export const getAvailableEmployees = async (_req: Request, res: Response): Promise<void> => {
  try {
    const employees = await db.select({
      id: authentication.id,
      firstName: authentication.firstName,
      lastName: authentication.lastName,
      employeeId: authentication.employeeId,
      department: departments.name
    })
    .from(authentication)
    .leftJoin(pdsHrDetails, eq(authentication.id, pdsHrDetails.employeeId))
    .leftJoin(departments, eq(pdsHrDetails.departmentId, departments.id))
    .leftJoin(plantillaPositions, eq(authentication.id, plantillaPositions.incumbentId))
    .where(and(
      ne(authentication.role, 'Administrator'),
      isNull(plantillaPositions.id)
    ))
    .orderBy(asc(authentication.lastName), asc(authentication.firstName));

    const formattedEmployees = employees.map(emp => ({
      id: emp.id,
      firstName: emp.firstName,
      lastName: emp.lastName,
      employeeId: emp.employeeId,
      department: emp.department
    }));

    res.json({ success: true, employees: formattedEmployees });
  } catch (_error) { 

    res.status(500).json({ success: false, message: 'Failed to fetch available employees' }); 
  }
};

export const getSalarySchedule = async (req: Request, res: Response): Promise<void> => {
  try {
    const { grade, step, tranche } = req.query;
    
    let trancheNum = Number(tranche);
    if (!trancheNum) {
      const activeTranche = await db.query.salaryTranches.findFirst({
        where: eq(salaryTranches.isActive, true)
      });
      trancheNum = activeTranche?.trancheNumber || 2;
    }
    
    if (!grade) { 
      const schedule = await db.select()
        .from(salarySchedule)
        .where(eq(salarySchedule.tranche, trancheNum))
        .orderBy(asc(salarySchedule.salaryGrade), asc(salarySchedule.step));
      
      res.json({ success: true, schedule, tranche: trancheNum }); 
      return; 
    }
    
    const result = await db.query.salarySchedule.findFirst({
      where: and(
        eq(salarySchedule.salaryGrade, Number(grade)),
        eq(salarySchedule.step, Number(step || 1)),
        eq(salarySchedule.tranche, trancheNum)
      )
    });
    
    if (!result) { 
      res.status(404).json({ success: false, message: 'Salary not found for this grade/step/tranche' }); 
      return; 
    }
    res.json({ success: true, monthlySalary: result.monthlySalary, tranche: trancheNum });
  } catch (_error) { 

    res.status(500).json({ success: false, message: 'Failed to fetch salary schedule' }); 
  }
};

export const getTranches = async (_req: Request, res: Response): Promise<void> => {
  try {
    const tranches = await db.query.salaryTranches.findMany({
      orderBy: [asc(salaryTranches.trancheNumber)]
    });
    res.json({ success: true, tranches });
  } catch (_error) {

    res.status(500).json({ success: false, message: 'Failed to fetch tranches' });
  }
};

export const setActiveTranche = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    await db.transaction(async (tx) => {
      await tx.update(salaryTranches).set({ isActive: false });
      await tx.update(salaryTranches).set({ isActive: true }).where(eq(salaryTranches.id, Number(id)));
    });
    
    res.json({ success: true, message: 'Active tranche updated' });
  } catch (_error) {

    res.status(500).json({ success: false, message: 'Failed to update active tranche' });
  }
};

export const getActiveTranche = async (_req: Request, res: Response): Promise<void> => {
  try {
    let tranche = await db.query.salaryTranches.findFirst({
      where: eq(salaryTranches.isActive, true)
    });
    
    if (!tranche) {
      tranche = await db.query.salaryTranches.findFirst({
        orderBy: [desc(salaryTranches.trancheNumber)]
      });
    }
    
    res.json({ success: true, tranche: tranche || null });
  } catch (_error) {

    res.status(500).json({ success: false, message: 'Failed to fetch active tranche' });
  }
};

export const createTranche = async (req: Request, res: Response): Promise<void> => {
    try {
        const { name, trancheNumber, circularNumber, effectiveDate } = createTrancheSchema.parse(req.body);

        const existing = await db.query.salaryTranches.findFirst({
            where: eq(salaryTranches.trancheNumber, trancheNumber)
        });

        if (existing) {
            res.status(400).json({ success: false, message: 'Tranche number already exists' });
            return;
        }

        const [result] = await db.insert(salaryTranches).values({
            name,
            trancheNumber: trancheNumber,
            circularNumber: circularNumber,
            effectiveDate: effectiveDate,
            dateIssued: new Date().toISOString(),
            applicableTo: 'Civilian Government Personnel',
            isActive: false
        });

        const newTranche = await db.query.salaryTranches.findFirst({
            where: eq(salaryTranches.id, result.insertId)
        });

        res.status(201).json({ success: true, tranche: newTranche });
    } catch (error) {
        if (error instanceof z.ZodError) {
            res.status(400).json({ success: false, message: 'Validation Error', errors: (error as z.ZodError).issues });
            return;
        }
        res.status(500).json({ success: false, message: 'Failed to create tranche' });
    }
};

export const abolishPosition = async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { id } = req.params;

    // Zod Validation
    const { abolishmentOrdinance, abolishmentDate, reason } = abolishPositionSchema.parse(req.body);

    const position = await db.query.plantillaPositions.findFirst({
      where: eq(plantillaPositions.id, Number(id))
    });

    if (!position) {
      res.status(404).json({ success: false, message: 'Position not found' });
      return;
    }

    if (!position.isVacant) {
      res.status(400).json({ success: false, message: 'Cannot abolish a filled position. Please vacate the position first.' });
      return;
    }

    await db.update(plantillaPositions)
      .set({ 
        status: 'Abolished', 
        abolishmentOrdinance: abolishmentOrdinance, 
        abolishmentDate: abolishmentDate 
      })
      .where(eq(plantillaPositions.id, Number(id)));

    await logAudit(
      Number(id),
      'abolished',
      authReq.user.id,
      { status: position.status, abolishmentOrdinance: position.abolishmentOrdinance },
      { status: 'Abolished', abolishmentOrdinance: abolishmentOrdinance, abolishmentDate: abolishmentDate, reason }
    );

    res.json({ success: true, message: 'Position abolished successfully' });
  } catch (error) {
    if (error instanceof z.ZodError) {
        res.status(400).json({ success: false, message: 'Validation Error', errors: (error as z.ZodError).issues });
        return;
    }

    res.status(500).json({ success: false, message: 'Failed to abolish position' });
  }
};

export const uploadSalarySchedule = async (req: Request, res: Response): Promise<void> => {
  try {
    // Zod Validation
    const { tranche, salaryData } = uploadSalarySchema.parse(req.body);

    await db.transaction(async (tx) => {
      await tx.delete(salarySchedule).where(eq(salarySchedule.tranche, Number(tranche)));

      for (const item of salaryData) {
        await tx.insert(salarySchedule).values({
          salaryGrade: item.salaryGrade,
          step: item.step,
          monthlySalary: String(item.monthlySalary),
          tranche: Number(tranche)
        });
      }
    });

    res.json({ 
      success: true, 
      message: `Successfully uploaded ${salaryData.length} salary entries for Tranche ${tranche}`,
      count: salaryData.length
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
        res.status(400).json({ success: false, message: 'Validation Error', errors: (error as z.ZodError).issues });
        return;
    }

    res.status(500).json({ success: false, message: 'Failed to upload salary schedule' });
  }
};

export const deleteSalaryScheduleByTranche = async (req: Request, res: Response): Promise<void> => {
  try {
    const { tranche } = req.params;

    const result = await db.delete(salarySchedule).where(eq(salarySchedule.tranche, Number(tranche)));

    res.json({ 
      success: true, 
      message: `Deleted salary entries for Tranche ${tranche}`,
      deletedCount: result[0].affectedRows
    });
  } catch (_error) {

    res.status(500).json({ success: false, message: 'Failed to delete salary schedule' });
  }
};
