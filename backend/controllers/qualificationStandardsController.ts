import { Request, Response } from 'express';
import { db } from '../db/index.js';
import { qualificationStandards, plantillaPositions, authentication } from '../db/schema.js';
import { eq, and, desc, asc, like } from 'drizzle-orm';
import {
  QualificationStandardSchema,
  UpdateQualificationStandardSchema,
  ValidateQualificationSchema
} from '../schemas/plantillaComplianceSchema.js';

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

    const standard = await db.query.qualificationStandards.findFirst({
      where: eq(qualificationStandards.id, Number(id))
    });

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

    const existing = await db.query.qualificationStandards.findFirst({
      where: eq(qualificationStandards.id, Number(id))
    });

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
    const positions = await db.query.plantillaPositions.findFirst({
      where: eq(plantillaPositions.qualificationStandardsId, Number(id))
    });

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

/**
 * Validate Employee against Position's Qualification Standards
 * POST /api/qualification-standards/validate
 */
export const validateEmployeeQualifications = async (req: Request, res: Response): Promise<void> => {
  try {
    const validatedData = ValidateQualificationSchema.parse(req.body);
    const { employeeId, positionId } = validatedData;

    // Get employee details
    const employee = await db.query.authentication.findFirst({
      where: eq(authentication.id, employee_id),
      columns: {
        id: true,
        firstName: true,
        lastName: true,
        employeeId: true,
        eligibilityType: true,
        eligibilityNumber: true,
        eligibilityDate: true,
        highestEducation: true,
        yearsOfExperience: true
      }
    });

    if (!employee) {
      res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
      return;
    }

    // Get position with QS
    const position = await db.query.plantillaPositions.findFirst({
      where: eq(plantillaPositions.id, position_id),
      columns: {
        id: true,
        positionTitle: true,
        salaryGrade: true,
        qualificationStandardsId: true
      }
    });

    if (!position) {
      res.status(404).json({
        success: false,
        message: 'Position not found'
      });
      return;
    }

    if (!position.qualificationStandardsId) {
      res.json({
        success: true,
        qualified: true,
        message: 'No qualification standards defined for this position',
        score: 100
      });
      return;
    }

    // Get QS requirements
    const qs = await db.query.qualificationStandards.findFirst({
      where: eq(qualificationStandards.id, position.qualificationStandardsId)
    });

    if (!qs) {
      res.status(404).json({
        success: false,
        message: 'Qualification standards not found'
      });
      return;
    }

    // Validation logic
    const missingRequirements: string[] = [];
    let score = 0;
    const maxScore = 4; // Education, Experience, Training, Eligibility

    // 1. Education (25%)
    if (employee.highestEducation) {
      // Simple check: if employee has education data
      score += 1;
    } else {
      missingRequirements.push(`Education: ${qs.educationRequirement}`);
    }

    // 2. Experience (25%)
    const empExp = employee.yearsOfExperience || 0;
    // Fix: Handle possibly null values with defaults
    const requiredExp = qs.experienceYears || 0;
    
    if (empExp >= requiredExp) {
      score += 1;
    } else {
      missingRequirements.push(
        `Experience: ${requiredExp} years required (has ${empExp} years)`
      );
    }

    // 3. Training (25%) - Simplified: assume met if employee has experience
    const requiredTraining = qs.trainingHours || 0;
    
    if (empExp > 0) {
      score += 1;
    } else if (requiredTraining > 0) {
      missingRequirements.push(`Training: ${requiredTraining} hours required`);
    } else {
      score += 1; // No training required
    }

    // 4. Eligibility (25%)
    if (employee.eligibilityType) {
      // Check if eligibility matches (case-insensitive partial match)
      const employeeElig = employee.eligibilityType.toLowerCase();
      const requiredElig = (qs.eligibilityRequired || '').toLowerCase();

      if (
        requiredElig === '' || // No requirement
        employeeElig.includes(requiredElig) ||
        requiredElig.includes(employeeElig) ||
        employeeElig.includes('professional') ||
        employeeElig.includes('cpa') ||
        employeeElig.includes('engineer')
      ) {
        score += 1;
      } else {
        missingRequirements.push(`Eligibility: ${qs.eligibilityRequired} (has ${employee.eligibilityType})`);
      }
    } else {
      missingRequirements.push(`Eligibility: ${qs.eligibilityRequired}`);
    }

    const qualificationScore = Math.round((score / maxScore) * 100);
    const qualified = qualificationScore === 100;

    res.json({
      success: true,
      qualified,
      score: qualificationScore,
      missing_requirements: missingRequirements,
      employee: {
        id: employee.id,
        name: `${employee.firstName} ${employee.lastName}`,
        employee_id: employee.employeeId,
        education: employee.highestEducation,
        experience_years: empExp,
        eligibility: employee.eligibilityType
      },
      position: {
        id: position.id,
        title: position.positionTitle,
        salary_grade: position.salaryGrade
      },
      requirements: {
        education: qs.educationRequirement,
        experience_years: qs.experienceYears,
        training_hours: qs.trainingHours,
        eligibility: qs.eligibilityRequired
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

    res.status(500).json({
      success: false,
      message: 'Failed to validate qualifications'
    });
  }
};