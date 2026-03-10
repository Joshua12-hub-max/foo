import { Request, Response } from 'express';
import { db } from '../db/index.js';
import { qualificationStandards, plantillaPositions } from '../db/schema.js';
import { ZodError } from 'zod';

import { eq, and, desc, asc, like } from 'drizzle-orm';
import {
  QualificationStandardSchema,
  UpdateQualificationStandardSchema,
  ValidateQualificationSchema
} from '../schemas/plantillaComplianceSchema.js';
import { QualificationService } from '../services/qualificationService.js';


/**
 * Get all Qualification Standards
 * GET /api/qualification-standards
 */
export const getQualificationStandards = async (req: Request, res: Response): Promise<void> => {
  try {
    const positionTitle = (req.query.positionTitle || req.query.position_title) as string;
    const salaryGrade = (req.query.salaryGrade || req.query.salary_grade) as string;
    const isActive = (req.query.isActive || req.query.is_active) as string;

    const conditions = [];
    if (positionTitle) {
      conditions.push(like(qualificationStandards.positionTitle, `%${positionTitle}%`));
    }
    if (salaryGrade) {
      conditions.push(eq(qualificationStandards.salaryGrade, parseInt(salaryGrade)));
    }
    if (isActive !== undefined) {
      conditions.push(eq(qualificationStandards.isActive, isActive === 'true' || isActive === '1' ? true : false));
    }


    const standards = await db.select()
      .from(qualificationStandards)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(qualificationStandards.salaryGrade), asc(qualificationStandards.positionTitle));

    res.json({
      success: true,
      standards
    });
  } catch (_error) {

    res.status(500).json({
      success: false,
      message: 'Failed to fetch qualification standards'
    });
  }
};

/**
 * Get single Qualification Standard by ID
 * GET /api/qualification-standards/:id
 */
export const getQualificationStandardById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const [standard] = await db.select()
      .from(qualificationStandards)
      .where(eq(qualificationStandards.id, Number(id)))
      .limit(1);


    if (!standard) {
      res.status(404).json({
        success: false,
        message: 'Qualification standard not found'
      });
      return;
    }

    res.json({
      success: true,
      standard
    });
  } catch (_error) {

    res.status(500).json({
      success: false,
      message: 'Failed to fetch qualification standard'
    });
  }
};

/**
 * Create new Qualification Standard
 * POST /api/qualification-standards
 */
export const createQualificationStandard = async (req: Request, res: Response): Promise<void> => {
  try {
    const validatedData = QualificationStandardSchema.parse(req.body);

    const [result] = await db.insert(qualificationStandards).values({
      positionTitle: validatedData.positionTitle,
      salaryGrade: validatedData.salaryGrade,
      educationRequirement: validatedData.educationRequirement,
      experienceYears: validatedData.experienceYears,
      trainingHours: validatedData.trainingHours,
      eligibilityRequired: validatedData.eligibilityRequired,
      competencyRequirements: validatedData.competencyRequirements || null,
      isActive: validatedData.isActive ? true : false
    });

    res.status(201).json({
      success: true,
      message: 'Qualification standard created successfully',
      id: result.insertId
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

    if (error instanceof Error && 'code' in error && (error as Error & { code: string }).code === 'ER_DUP_ENTRY') {
      res.status(409).json({
        success: false,
        message: 'Qualification standard for this position and salary grade already exists'
      });
      return;
    }

    res.status(500).json({
      success: false,
      message: 'Failed to create qualification standard'
    });
  }
};

/**
 * Update Qualification Standard
 * PUT /api/qualification-standards/:id
 */
export const updateQualificationStandard = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const validatedData = UpdateQualificationStandardSchema.parse(req.body);

    const [existing] = await db.select()
      .from(qualificationStandards)
      .where(eq(qualificationStandards.id, Number(id)))
      .limit(1);


    if (!existing) {
      res.status(404).json({
        success: false,
        message: 'Qualification standard not found'
      });
      return;
    }

    const updates: Partial<typeof qualificationStandards.$inferInsert> = {};
    if (validatedData.positionTitle) updates.positionTitle = validatedData.positionTitle;
    if (validatedData.salaryGrade) updates.salaryGrade = validatedData.salaryGrade;
    if (validatedData.educationRequirement) updates.educationRequirement = validatedData.educationRequirement;
    if (validatedData.experienceYears !== undefined) updates.experienceYears = validatedData.experienceYears;
    if (validatedData.trainingHours !== undefined) updates.trainingHours = validatedData.trainingHours;
    if (validatedData.eligibilityRequired) updates.eligibilityRequired = validatedData.eligibilityRequired;
    if (validatedData.competencyRequirements !== undefined) updates.competencyRequirements = validatedData.competencyRequirements;
    if (validatedData.isActive !== undefined) updates.isActive = validatedData.isActive ? true : false;

    if (Object.keys(updates).length === 0) {
      res.status(400).json({
        success: false,
        message: 'No fields to update'
      });
      return;
    }

    await db.update(qualificationStandards)
      .set(updates)
      .where(eq(qualificationStandards.id, Number(id)));

    res.json({
      success: true,
      message: 'Qualification standard updated successfully'
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
      message: 'Failed to update qualification standard'
    });
  }
};

/**
 * Delete Qualification Standard
 * DELETE /api/qualification-standards/:id
 */
export const deleteQualificationStandard = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Check if any positions are using this QS
    const [positions] = await db.select()
      .from(plantillaPositions)
      .where(eq(plantillaPositions.qualificationStandardsId, Number(id)))
      .limit(1);


    if (positions) {
      res.status(400).json({
        success: false,
        message: `Cannot delete: positions are using this qualification standard`
      });
      return;
    }

    const [result] = await db.delete(qualificationStandards).where(eq(qualificationStandards.id, Number(id)));

    if (result.affectedRows === 0) {
      res.status(404).json({
        success: false,
        message: 'Qualification standard not found'
      });
      return;
    }

    res.json({
      success: true,
      message: 'Qualification standard deleted successfully'
    });
  } catch (_error) {

    res.status(500).json({
      success: false,
      message: 'Failed to delete qualification standard'
    });
  }
};

export const validateEmployeeQualifications = async (req: Request, res: Response): Promise<void> => {
  try {
    const validatedData = ValidateQualificationSchema.parse(req.body);
    const { employeeId, positionId } = validatedData;

    // Use the comprehensive service for validation
    const result = await QualificationService.validate(employeeId, positionId);

    // Map the service result to the expected API response format
    res.json({
      success: true,
      qualified: result.qualified,
      score: result.score,
      missingRequirements: result.missingRequirements,
      employee: {
        id: result.employeeDetails.id,
        name: result.employeeDetails.name,
        employeeId: result.employeeDetails.employeeId,
        education: result.employeeDetails.education,
        experienceYears: result.employeeDetails.experienceYears,
        eligibility: result.employeeDetails.eligibility
      },
      position: {
        id: result.positionDetails.id,
        title: result.positionDetails.title,
        salaryGrade: result.positionDetails.salaryGrade
      },
      requirements: {
        education: result.requirements.education,
        experienceYears: result.requirements.experienceYears,
        trainingHours: result.requirements.trainingHours,
        eligibility: result.requirements.eligibility
      }
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
    
    if (error instanceof Error && (error.message === 'Employee not found' || error.message === 'Position not found')) {
        res.status(404).json({ success: false, message: error.message });
        return;
    }

    res.status(500).json({
      success: false,
      message: 'Failed to validate qualifications'
    });
  }
};

