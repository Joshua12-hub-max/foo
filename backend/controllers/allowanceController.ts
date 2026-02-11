import { Request, Response } from 'express';
import { db } from '../db/index.js';
import { allowanceSchedules, allowanceDefinitions, allowanceMatrixValues } from '../db/schema.js';
import { desc, eq } from 'drizzle-orm';

/**
 * Get all allowance schedules
 * GET /api/allowances/schedules
 */
export const getAllowanceSchedules = async (_req: Request, res: Response): Promise<void> => {
  try {
    const schedules = await db.query.allowanceSchedules.findMany({
      orderBy: [desc(allowanceSchedules.effectivityDate)]
    });
    res.json({ success: true, schedules });
  } catch (error) {
    console.error('Get Allowance Schedules Error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch allowance schedules' });
  }
};

/**
 * Create a new allowance schedule
 * POST /api/allowances/schedules
 */
export const createAllowanceSchedule = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, effectivity_date, legal_basis } = req.body;
    if (!name || !effectivity_date) {
      res.status(400).json({ success: false, message: 'Name and effectivity date are required' });
      return;
    }

    const [result] = await db.insert(allowanceSchedules).values({
      name,
      effectivityDate: effectivity_date,
      legalBasis: legal_basis,
      isActive: 0
    });

    res.status(201).json({ 
      success: true, 
      message: 'Allowance schedule created successfully', 
      id: result.insertId 
    });
  } catch (error) {
    console.error('Create Allowance Schedule Error:', error);
    res.status(500).json({ success: false, message: 'Failed to create allowance schedule' });
  }
};

/**
 * Get allowances for a specific schedule
 * GET /api/allowances/schedules/:id/allowances
 */
export const getScheduleAllowances = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const scheduleId = parseInt(id);
    
    const allowances = await db.query.allowanceDefinitions.findMany({
      where: eq(allowanceDefinitions.allowanceScheduleId, scheduleId),
      with: {
        allowanceMatrixValues: true
      },
      orderBy: [allowanceDefinitions.category, allowanceDefinitions.name]
    });

    // Format for frontend expectations (mapping allowanceMatrixValues to rates)
    const formattedAllowances = allowances.map(allowance => ({
      ...allowance,
      rates: allowance.allowanceMatrixValues
    }));

    res.json({ success: true, allowances: formattedAllowances });
  } catch (error) {
    console.error('Get Schedule Allowances Error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch allowances' });
  }
};

/**
 * Update active allowance schedule
 * PUT /api/allowances/schedules/:id/activate
 */
export const setActiveAllowanceSchedule = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const scheduleId = parseInt(id);

    await db.transaction(async (tx) => {
      // 1. Deactivate all
      await tx.update(allowanceSchedules).set({ isActive: 0 });

      // 2. Activate one
      await tx.update(allowanceSchedules)
        .set({ isActive: 1 })
        .where(eq(allowanceSchedules.id, scheduleId));
    });

    res.json({ success: true, message: 'Allowance schedule activated' });
  } catch (error) {
    console.error('Set Active Schedule Error:', error);
    res.status(500).json({ success: false, message: 'Failed to activate schedule' });
  }
};

/**
 * Get active allowance schedule
 * GET /api/allowances/active
 */
export const getActiveAllowanceSchedule = async (_req: Request, res: Response): Promise<void> => {
  try {
    const schedule = await db.query.allowanceSchedules.findFirst({
      where: eq(allowanceSchedules.isActive, 1),
      with: {
        allowanceDefinitions: true
      }
    });
    
    res.json({ success: true, schedule: schedule || null });
  } catch (error) {
    console.error('Get Active Schedule Error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch active schedule' });
  }
};

/**
 * Add or Update Allowance Definition
 * POST /api/allowances/definitions
 */
export const upsertAllowanceDefinition = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id, allowance_schedule_id, name, description, amount, is_matrix, category, rates } = req.body;
        
        if (!allowance_schedule_id || !name) {
             res.status(400).json({ success: false, message: 'Schedule ID and Name are required' });
             return;
        }

        const resultId = await db.transaction(async (tx) => {
            let allowanceId = id;

            if (id) {
                // Update
                await tx.update(allowanceDefinitions)
                    .set({
                        name,
                        description,
                        amount: amount?.toString(),
                        isMatrix: is_matrix ? 1 : 0,
                        category
                    })
                    .where(eq(allowanceDefinitions.id, id));
            } else {
                // Insert
                const [insertResult] = await tx.insert(allowanceDefinitions).values({
                    allowanceScheduleId: allowance_schedule_id,
                    name,
                    description,
                    amount: amount?.toString(),
                    isMatrix: is_matrix ? 1 : 0,
                    category
                });
                allowanceId = insertResult.insertId;
            }

            // Handle Matrix Rates
            if (is_matrix && rates && Array.isArray(rates)) {
                await tx.delete(allowanceMatrixValues).where(eq(allowanceMatrixValues.allowanceId, allowanceId));
                
                if (rates.length > 0) {
                    const valuesToInsert = rates.map((r: any) => ({
                        allowanceId: allowanceId,
                        conditionKey: r.condition_key,
                        amount: r.amount?.toString(),
                        valueType: r.value_type || 'FIXED'
                    }));
                    await tx.insert(allowanceMatrixValues).values(valuesToInsert);
                }
            }
            
            return allowanceId;
        });

        res.json({ success: true, message: 'Allowance definition saved', id: resultId });
    } catch (error) {
        console.error('Upsert Allowance Definition Error:', error);
        res.status(500).json({ success: false, message: 'Failed to save allowance' });
    }
};
