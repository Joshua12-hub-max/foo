import { Request, Response } from 'express';
import { db } from '../db/index.js';
import { 
  plantillaPositions, 
  departments, 
  authentication, 
  plantillaAuditLog, 
  plantillaPositionHistory, 
  salarySchedule,
  salaryTranches
} from '../db/schema.js';
import { eq, and, sql, asc, desc, isNull, ne } from 'drizzle-orm';
import type { AuthenticatedRequest } from '../types/index.js';
import { 
  createPositionSchema, 
  updatePositionSchema, 
  assignEmployeeSchema, 
  vacatePositionSchema, 
  abolishPositionSchema, 
  uploadSalarySchema 
} from '../schemas/plantillaSchema.js';
import { z } from 'zod';

/**
 * Log action to plantilla audit log
 */
const logAudit = async (
  positionId: number, 
  action: string, 
  actorId: number, 
  oldValues: any = null, 
  newValues: any = null
): Promise<void> => {
  try { 
    await db.insert(plantillaAuditLog).values({
      positionId,
      action,
      actorId,
      oldValues,
      newValues
    });
  } catch (error) { 
    console.error('Audit log error:', error); 
  }
};

export const getPlantilla = async (req: Request, res: Response): Promise<void> => {
  try {
    const { department_id, is_vacant } = req.query;
    
    const whereConditions = [];
    if (department_id && department_id !== 'All') {
      whereConditions.push(eq(plantillaPositions.departmentId, Number(department_id)));
    }
    if (is_vacant !== undefined) {
      whereConditions.push(eq(plantillaPositions.isVacant, is_vacant === 'true' || is_vacant === '1' ? 1 : 0));
    }

    const positions = await db.select({
      id: plantillaPositions.id,
      item_number: plantillaPositions.itemNumber,
      position_title: plantillaPositions.positionTitle,
      salary_grade: plantillaPositions.salaryGrade,
      step_increment: plantillaPositions.stepIncrement,
      department_id: plantillaPositions.departmentId,
      department: plantillaPositions.department,
      is_vacant: plantillaPositions.isVacant,
      incumbent_id: plantillaPositions.incumbentId,
      monthly_salary: plantillaPositions.monthlySalary,
      filled_date: plantillaPositions.filledDate,
      vacated_date: plantillaPositions.vacatedDate,
      status: plantillaPositions.status,
      area_code: plantillaPositions.areaCode,
      area_type: plantillaPositions.areaType,
      area_level: plantillaPositions.areaLevel,
      last_promotion_date: plantillaPositions.lastPromotionDate,
      department_name: departments.name,
      incumbent_first_name: authentication.firstName,
      incumbent_last_name: authentication.lastName,
      incumbent_middle_name: authentication.middleName,
      incumbent_employee_id: authentication.employeeId,
      birth_date: authentication.birthDate,
      date_hired: authentication.dateHired,
      gender: authentication.gender,
      eligibility: authentication.eligibilityType,
      original_appointment_date: authentication.originalAppointmentDate,
      emp_last_promotion_date: authentication.lastPromotionDate
    })
    .from(plantillaPositions)
    .leftJoin(departments, eq(plantillaPositions.departmentId, departments.id))
    .leftJoin(authentication, eq(plantillaPositions.incumbentId, authentication.id))
    .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
    .orderBy(asc(plantillaPositions.itemNumber));

    const formattedPositions = positions.map(pos => ({ 
      ...pos, 
      incumbent_name: pos.incumbent_first_name 
        ? `${pos.incumbent_last_name}, ${pos.incumbent_first_name} ${pos.incumbent_middle_name || ''}`.trim() 
        : null,
      last_promotion_date: pos.emp_last_promotion_date || pos.last_promotion_date
    }));

    res.json({ success: true, positions: formattedPositions });
  } catch (error) { 
    console.error('Get Plantilla Error:', error); 
    res.status(500).json({ success: false, message: 'Failed to fetch plantilla' }); 
  }
};

export const getPlantillaSummary = async (_req: Request, res: Response): Promise<void> => {
  try {
    const [summary] = await db.select({
      total: sql<number>`count(*)`,
      vacant: sql<number>`sum(case when ${plantillaPositions.isVacant} = 1 then 1 else 0 end)`,
      filled: sql<number>`sum(case when ${plantillaPositions.isVacant} = 0 then 1 else 0 end)`,
      total_monthly_salary: sql<number>`sum(coalesce(${plantillaPositions.monthlySalary}, 0))`
    }).from(plantillaPositions);
    
    const total = Number(summary.total || 0);
    const vacant = Number(summary.vacant || 0);
    const filled = Number(summary.filled || 0);
    const totalSalary = Number(summary.total_monthly_salary || 0);
    
    res.json({ 
      success: true, 
      summary: { 
        total, 
        vacant, 
        filled, 
        vacancy_rate: total > 0 ? Number(((vacant / total) * 100).toFixed(1)) : 0, 
        total_monthly_salary: totalSalary, 
        annual_budget: totalSalary * 12 
      } 
    });
  } catch (error) { 
    console.error('Get Summary Error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch summary' }); 
  }
};

export const createPosition = async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    
    // Zod Validation
    const validatedData = createPositionSchema.parse(req.body);

    const dept = await db.query.departments.findFirst({
      where: eq(departments.id, validatedData.department_id),
      columns: { name: true }
    });

    const result = await db.insert(plantillaPositions).values({
      itemNumber: validatedData.item_number,
      positionTitle: validatedData.position_title,
      salaryGrade: validatedData.salary_grade,
      stepIncrement: validatedData.step_increment,
      departmentId: validatedData.department_id,
      department: dept?.name || null,
      monthlySalary: validatedData.monthly_salary ? String(validatedData.monthly_salary) : null,
      areaCode: validatedData.area_code || null,
      areaType: validatedData.area_type || null,
      areaLevel: validatedData.area_level || null,
      isVacant: validatedData.is_vacant ? 1 : 0
    });

    const insertId = result[0].insertId;
    await logAudit(insertId, 'created', authReq.user.id, null, validatedData);
    
    res.status(201).json({ success: true, message: 'Position created successfully', id: insertId });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
        res.status(400).json({ success: false, message: 'Validation Error', errors: error.errors });
        return;
    }
    if (error.code === 'ER_DUP_ENTRY') { 
      res.status(409).json({ success: false, message: 'Item number already exists' }); 
      return; 
    }
    console.error('Create Position Error:', error);
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

    const dept = updates.department_id ? await db.query.departments.findFirst({
      where: eq(departments.id, updates.department_id),
      columns: { name: true }
    }) : null;

    await db.update(plantillaPositions)
      .set({
        itemNumber: updates.item_number,
        positionTitle: updates.position_title,
        salaryGrade: updates.salary_grade,
        stepIncrement: updates.step_increment,
        departmentId: updates.department_id,
        department: dept?.name || oldData.department, // Keep old department name if not updating department_id
        isVacant: updates.is_vacant ? 1 : 0,
        monthlySalary: updates.monthly_salary ? String(updates.monthly_salary) : null,
        areaCode: updates.area_code || null,
        areaType: updates.area_type || null,
        areaLevel: updates.area_level || null,
        lastPromotionDate: updates.last_promotion_date || null
      })
      .where(eq(plantillaPositions.id, Number(id)));

    await logAudit(Number(id), 'updated', authReq.user.id, oldData, updates);
    res.json({ success: true, message: 'Position updated successfully' });
  } catch (error: any) { 
    if (error instanceof z.ZodError) {
        res.status(400).json({ success: false, message: 'Validation Error', errors: error.errors });
        return;
    }
    console.error('Update Position Error:', error);
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
  } catch (error) { 
    console.error('Delete Position Error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete position' }); 
  }
};

export const assignEmployee = async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest; 
    const { id } = req.params;
    
    // Zod Validation
    const { employee_id, start_date } = assignEmployeeSchema.parse(req.body);

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
      where: eq(authentication.id, Number(employee_id))
    });

    if (!employee) { 
      res.status(404).json({ success: false, message: 'Employee not found' }); 
      return; 
    }
    
    let currentSalary = 0;
    if (employee.positionId) {
       const currentPos = await db.query.plantillaPositions.findFirst({
         where: eq(plantillaPositions.id, employee.positionId),
         columns: { monthlySalary: true }
       });
       if (currentPos) {
         currentSalary = Number(currentPos.monthlySalary || 0);
       }
    }

    // 3. Calculate Salary for Promotion
    const newGrade = position.salaryGrade;
    const activeTranche = await db.query.salaryTranches.findFirst({
      where: eq(salaryTranches.isActive, 1)
    });
    const trancheNum = activeTranche?.trancheNumber || 2;

    const salarySteps = await db.select()
      .from(salarySchedule)
      .where(and(
        eq(salarySchedule.salaryGrade, newGrade),
        eq(salarySchedule.tranche, trancheNum)
      ))
      .orderBy(asc(salarySchedule.step));

    let targetStep = 1;
    let targetSalary = 0;

    if (salarySteps.length > 0) {
      const step1Salary = Number(salarySteps[0].monthlySalary);
      targetSalary = currentSalary > step1Salary ? currentSalary : step1Salary;
    } else {
      const positionSalary = Number(position.monthlySalary || 0);
      targetSalary = currentSalary > positionSalary ? currentSalary : positionSalary;
    }

    const assignDate = start_date || new Date().toISOString().split('T')[0];

    await db.transaction(async (tx) => {
      // 4. Update Position Table
      await tx.update(plantillaPositions)
        .set({ 
          incumbentId: Number(employee_id), 
          isVacant: 0, 
          filledDate: assignDate, 
          vacatedDate: null, 
          stepIncrement: targetStep, 
          monthlySalary: String(targetSalary)
        })
        .where(eq(plantillaPositions.id, Number(id)));

      // 5. Update Employee Profile
      await tx.update(authentication)
        .set({ 
          jobTitle: position.positionTitle, 
          positionTitle: position.positionTitle, 
          itemNumber: position.itemNumber, 
          positionId: Number(id), 
          departmentId: position.departmentId, 
          department: position.department, 
          salaryGrade: String(position.salaryGrade), 
          stepIncrement: targetStep 
        })
        .where(eq(authentication.id, Number(employee_id)));

      // 6. Record History
      await tx.insert(plantillaPositionHistory).values({
        positionId: Number(id),
        employeeId: Number(employee_id),
        employeeName: `${employee.firstName} ${employee.lastName}`,
        positionTitle: position.positionTitle,
        startDate: assignDate
      });

      await logAudit(Number(id), 'assigned', authReq.user.id, 
        { isVacant: 1, incumbentId: null }, 
        { isVacant: 0, incumbentId: employee_id, step: targetStep, salary: targetSalary }
      );
    });
    
    res.json({ success: true, message: 'Employee assigned and salary protected successfully', step: targetStep, salary: targetSalary });
  } catch (error) { 
    if (error instanceof z.ZodError) {
        res.status(400).json({ success: false, message: 'Validation Error', errors: error.errors });
        return;
    }
    console.error('Assign Employee Error:', error); 
    res.status(500).json({ success: false, message: 'Failed to assign employee' }); 
  }
};

export const vacatePosition = async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest; 
    const { id } = req.params;

    // Zod Validation
    const { reason, end_date } = vacatePositionSchema.parse(req.body);

    const position = await db.query.plantillaPositions.findFirst({
      where: eq(plantillaPositions.id, Number(id))
    });

    if (!position) { res.status(404).json({ success: false, message: 'Position not found' }); return; }
    if (position.isVacant) { res.status(400).json({ success: false, message: 'Position is already vacant' }); return; }

    const vacateDate = end_date || new Date().toISOString().split('T')[0];

    await db.transaction(async (tx) => {
      await tx.update(plantillaPositionHistory)
        .set({ endDate: vacateDate, reason: reason || 'Position vacated' })
        .where(and(
          eq(plantillaPositionHistory.positionId, Number(id)),
          eq(plantillaPositionHistory.employeeId, position.incumbentId!),
          isNull(plantillaPositionHistory.endDate)
        ));

      await tx.update(plantillaPositions)
        .set({ incumbentId: null, isVacant: 1, vacatedDate: vacateDate })
        .where(eq(plantillaPositions.id, Number(id)));

      await tx.update(authentication)
        .set({ jobTitle: 'Unassigned', positionTitle: null, itemNumber: null, positionId: null })
        .where(eq(authentication.id, position.incumbentId!));

      await logAudit(Number(id), 'vacated', authReq.user.id, 
        { isVacant: 0, incumbentId: position.incumbentId }, 
        { isVacant: 1, incumbentId: null, reason }
      );
    });

    res.json({ success: true, message: 'Position vacated successfully' });
  } catch (error) { 
    if (error instanceof z.ZodError) {
        res.status(400).json({ success: false, message: 'Validation Error', errors: error.errors });
        return;
    }
    console.error('Vacate Position Error:', error);
    res.status(500).json({ success: false, message: 'Failed to vacate position' }); 
  }
};

export const getPositionHistory = async (req: Request, res: Response): Promise<void> => {
  try { 
    const { id } = req.params; 
    const history = await db.select()
      .from(plantillaPositionHistory)
      .where(eq(plantillaPositionHistory.positionId, Number(id)))
      .orderBy(desc(plantillaPositionHistory.startDate));
    
    res.json({ success: true, history }); 
  } catch (error) { 
    console.error('Get Position History Error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch position history' }); 
  }
};

export const getAuditLog = async (req: Request, res: Response): Promise<void> => {
  try {
    const { position_id, limit = '50' } = req.query;
    
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
      actor_first_name: authentication.firstName,
      actor_last_name: authentication.lastName
    })
    .from(plantillaAuditLog)
    .leftJoin(plantillaPositions, eq(plantillaAuditLog.positionId, plantillaPositions.id))
    .leftJoin(authentication, eq(plantillaAuditLog.actorId, authentication.id))
    .where(position_id ? eq(plantillaAuditLog.positionId, Number(position_id)) : undefined)
    .orderBy(desc(plantillaAuditLog.createdAt))
    .limit(Number(limit));

    const formattedLogs = logs.map(log => ({ 
      ...log, 
      actor_name: `${log.actor_first_name} ${log.actor_last_name}`
    }));

    res.json({ success: true, logs: formattedLogs });
  } catch (error) { 
    console.error('Get Audit Log Error:', error);
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
      department: authentication.department
    })
    .from(authentication)
    .leftJoin(plantillaPositions, eq(authentication.id, plantillaPositions.incumbentId))
    .where(and(
      ne(authentication.role, 'admin'),
      isNull(plantillaPositions.id)
    ))
    .orderBy(asc(authentication.lastName), asc(authentication.firstName));

    res.json({ success: true, employees });
  } catch (error) { 
    console.error('Get Available Employees Error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch available employees' }); 
  }
};

export const getSalarySchedule = async (req: Request, res: Response): Promise<void> => {
  try {
    const { grade, step, tranche } = req.query;
    
    let trancheNum = Number(tranche);
    if (!trancheNum) {
      const activeTranche = await db.query.salaryTranches.findFirst({
        where: eq(salaryTranches.isActive, 1)
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
    res.json({ success: true, monthly_salary: result.monthlySalary, tranche: trancheNum });
  } catch (error) { 
    console.error('Get Salary Schedule Error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch salary schedule' }); 
  }
};

export const getTranches = async (_req: Request, res: Response): Promise<void> => {
  try {
    const tranches = await db.query.salaryTranches.findMany({
      orderBy: [asc(salaryTranches.trancheNumber)]
    });
    res.json({ success: true, tranches });
  } catch (error) {
    console.error('Get Tranches Error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch tranches' });
  }
};

export const setActiveTranche = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    await db.transaction(async (tx) => {
      await tx.update(salaryTranches).set({ isActive: 0 });
      await tx.update(salaryTranches).set({ isActive: 1 }).where(eq(salaryTranches.id, Number(id)));
    });
    
    res.json({ success: true, message: 'Active tranche updated' });
  } catch (error) {
    console.error('Set Active Tranche Error:', error);
    res.status(500).json({ success: false, message: 'Failed to update active tranche' });
  }
};

export const getActiveTranche = async (_req: Request, res: Response): Promise<void> => {
  try {
    let tranche = await db.query.salaryTranches.findFirst({
      where: eq(salaryTranches.isActive, 1)
    });
    
    if (!tranche) {
      tranche = await db.query.salaryTranches.findFirst({
        orderBy: [desc(salaryTranches.trancheNumber)]
      });
    }
    
    res.json({ success: true, tranche: tranche || null });
  } catch (error) {
    console.error('Get Active Tranche Error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch active tranche' });
  }
};

export const createTranche = async (req: Request, res: Response): Promise<void> => {
    try {
        const { name, tranche_number, circular_number, effective_date } = req.body;

        const existing = await db.query.salaryTranches.findFirst({
            where: eq(salaryTranches.trancheNumber, tranche_number)
        });

        if (existing) {
            res.status(400).json({ success: false, message: 'Tranche number already exists' });
            return;
        }

        const [newTranche] = await db.insert(salaryTranches).values({
            name,
            trancheNumber: tranche_number,
            circularNumber: circular_number,
            effectiveDate: effective_date,
            dateIssued: new Date().toISOString(),
            applicableTo: 'Civilian Government Personnel',
            isActive: 0
        }).returning();

        res.status(201).json({ success: true, tranche: newTranche });
    } catch (error) {
        console.error('Create Tranche Error:', error);
        res.status(500).json({ success: false, message: 'Failed to create tranche' });
    }
};

export const abolishPosition = async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { id } = req.params;

    // Zod Validation
    const { abolishment_ordinance, abolishment_date, reason } = abolishPositionSchema.parse(req.body);

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
        abolishmentOrdinance: abolishment_ordinance, 
        abolishmentDate: abolishment_date 
      })
      .where(eq(plantillaPositions.id, Number(id)));

    await logAudit(
      Number(id),
      'abolished',
      authReq.user.id,
      { status: position.status, abolishmentOrdinance: position.abolishmentOrdinance },
      { status: 'Abolished', abolishmentOrdinance: abolishment_ordinance, abolishmentDate: abolishment_date, reason }
    );

    res.json({ success: true, message: 'Position abolished successfully' });
  } catch (error) {
    if (error instanceof z.ZodError) {
        res.status(400).json({ success: false, message: 'Validation Error', errors: error.errors });
        return;
    }
    console.error('Abolish Position Error:', error);
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
          salaryGrade: item.salary_grade,
          step: item.step,
          monthlySalary: String(item.monthly_salary),
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
        res.status(400).json({ success: false, message: 'Validation Error', errors: error.errors });
        return;
    }
    console.error('Upload Salary Schedule Error:', error);
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
  } catch (error) {
    console.error('Delete Salary Schedule Error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete salary schedule' });
  }
};



