import { Request, Response } from 'express';
import { db } from '../db/index.js';
import { qualificationStandards, plantillaPositions } from '../db/schema.js';

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
    const position_title = (req.query.positionTitle || req.query.position_title) as string;
    const salary_grade = (req.query.salaryGrade || req.query.salary_grade) as string;
    const is_active = (req.query.isActive || req.query.is_active) as string;

    const conditions = [];
    if (position_title) {
      conditions.push(like(qualificationStandards.positionTitle, `%${position_title}%`));
    }
    if (salary_grade) {
      conditions.push(eq(qualificationStandards.salaryGrade, parseInt(salary_grade)));
    }
    if (is_active !== undefined) {
      conditions.push(eq(qualificationStandards.isActive, is_active === 'true' || is_active === '1' ? 1 : 0));
    }

    const standards = await db.select()
      .from(qualificationStandards)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(qualificationStandards.salaryGrade), asc(qualificationStandards.positionTitle));

    res.json({
      success: true,
      standards
    });
  } catch (error) {
    console.error('Get QS Error:', error);
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
  } catch (error) {
    console.error('Get QS by ID Error:', error);
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
      isActive: validatedData.isActive ? 1 : 0
    });

    res.status(201).json({
      success: true,
      message: 'Qualification standard created successfully',
      id: result.insertId
    });
  } catch (error: any) {
    console.error('Create QS Error:', error);

    if (error.name === 'ZodError') {
      res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.errors
      });
      return;
    }

    if (error.code === 'ER_DUP_ENTRY') {
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

    const updates: any = {};
    if (validatedData.positionTitle) updates.positionTitle = validatedData.positionTitle;
    if (validatedData.salaryGrade) updates.salaryGrade = validatedData.salaryGrade;
    if (validatedData.educationRequirement) updates.educationRequirement = validatedData.educationRequirement;
    if (validatedData.experienceYears !== undefined) updates.experienceYears = validatedData.experienceYears;
    if (validatedData.trainingHours !== undefined) updates.trainingHours = validatedData.trainingHours;
    if (validatedData.eligibilityRequired) updates.eligibilityRequired = validatedData.eligibilityRequired;
    if (validatedData.competencyRequirements !== undefined) updates.competencyRequirements = validatedData.competencyRequirements;
    if (validatedData.isActive !== undefined) updates.isActive = validatedData.isActive ? 1 : 0;

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
  } catch (error: any) {
    console.error('Update QS Error:', error);

    if (error.name === 'ZodError') {
      res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.errors
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
  } catch (error) {
    console.error('Delete QS Error:', error);
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
      missing_requirements: result.missingRequirements,
      employee: {
        id: result.employeeDetails.id,
        name: result.employeeDetails.name,
        employee_id: result.employeeDetails.employee_id,

        education: result.employeeDetails.education,
        experience_years: result.employeeDetails.experienceYears,
        eligibility: result.employeeDetails.eligibility
      },
      position: {
        id: result.positionDetails.id,
        title: result.positionDetails.title,
        salary_grade: result.positionDetails.salaryGrade
      },
      requirements: {
        education: result.requirements.education,
        experience_years: result.requirements.experienceYears,
        training_hours: result.requirements.trainingHours,
        eligibility: result.requirements.eligibility
      }
    });

  } catch (error: any) {
    console.error('Validate QS Error:', error);

    if (error.name === 'ZodError') {
      res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.errors
      });
      return;
    }
    
    if (error.message === 'Employee not found' || error.message === 'Position not found') {
        res.status(404).json({ success: false, message: error.message });
        return;
    }

    res.status(500).json({
      success: false,
      message: 'Failed to validate qualifications'
    });
  }
};