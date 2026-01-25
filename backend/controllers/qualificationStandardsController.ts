import { Request, Response } from 'express';
import db from '../db/connection.js';
import type { RowDataPacket, ResultSetHeader } from 'mysql2/promise';
import type { AuthenticatedRequest } from '../types/index.js';
import {
  QualificationStandardSchema,
  UpdateQualificationStandardSchema,
  ValidateQualificationSchema,
  type QualificationStandardInput,
  type UpdateQualificationStandardInput,
  type ValidateQualificationInput
} from '../schemas/plantillaComplianceSchema.js';

interface QSRow extends RowDataPacket {
  id: number;
  position_title: string;
  salary_grade: number;
  education_requirement: string;
  experience_years: number;
  training_hours: number;
  eligibility_required: string;
  competency_requirements?: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

interface EmployeeRow extends RowDataPacket {
  id: number;
  first_name: string;
  last_name: string;
  employee_id: string;
  eligibility_type?: string;
  eligibility_number?: string;
  eligibility_date?: string;
  highest_education?: string;
  years_of_experience: number;
}

interface PositionRow extends RowDataPacket {
  id: number;
  position_title: string;
  salary_grade: number;
  qualification_standards_id?: number;
}

/**
 * Get all Qualification Standards
 * GET /api/qualification-standards
 */
export const getQualificationStandards = async (req: Request, res: Response): Promise<void> => {
  try {
    const { position_title, salary_grade, is_active } = req.query;

    let query = 'SELECT * FROM qualification_standards WHERE 1=1';
    const params: (string | number)[] = [];

    if (position_title) {
      query += ' AND position_title LIKE ?';
      params.push(`%${position_title}%`);
    }

    if (salary_grade) {
      query += ' AND salary_grade = ?';
      params.push(parseInt(salary_grade as string));
    }

    if (is_active !== undefined) {
      query += ' AND is_active = ?';
      params.push(is_active === 'true' || is_active === '1' ? 1 : 0);
    }

    query += ' ORDER BY salary_grade DESC, position_title ASC';

    const [standards] = await db.query<QSRow[]>(query, params);

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

    const [standards] = await db.query<QSRow[]>(
      'SELECT * FROM qualification_standards WHERE id = ?',
      [id]
    );

    if (standards.length === 0) {
      res.status(404).json({
        success: false,
        message: 'Qualification standard not found'
      });
      return;
    }

    res.json({
      success: true,
      standard: standards[0]
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

    const [result] = await db.query<ResultSetHeader>(
      `INSERT INTO qualification_standards 
       (position_title, salary_grade, education_requirement, experience_years, 
        training_hours, eligibility_required, competency_requirements, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        validatedData.position_title,
        validatedData.salary_grade,
        validatedData.education_requirement,
        validatedData.experience_years,
        validatedData.training_hours,
        validatedData.eligibility_required,
        validatedData.competency_requirements || null,
        validatedData.is_active
      ]
    );

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

    // Check if exists
    const [existing] = await db.query<QSRow[]>(
      'SELECT id FROM qualification_standards WHERE id = ?',
      [id]
    );

    if (existing.length === 0) {
      res.status(404).json({
        success: false,
        message: 'Qualification standard not found'
      });
      return;
    }

    // Build update query dynamically
    const updates: string[] = [];
    const values: any[] = [];

    Object.entries(validatedData).forEach(([key, value]) => {
      if (value !== undefined) {
        updates.push(`${key} = ?`);
        values.push(value);
      }
    });

    if (updates.length === 0) {
      res.status(400).json({
        success: false,
        message: 'No fields to update'
      });
      return;
    }

    values.push(id);

    await db.query(
      `UPDATE qualification_standards SET ${updates.join(', ')} WHERE id = ?`,
      values
    );

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
    const [positions] = await db.query<PositionRow[]>(
      'SELECT id FROM plantilla_positions WHERE qualification_standards_id = ?',
      [id]
    );

    if (positions.length > 0) {
      res.status(400).json({
        success: false,
        message: `Cannot delete: ${positions.length} position(s) are using this qualification standard`
      });
      return;
    }

    const [result] = await db.query<ResultSetHeader>(
      'DELETE FROM qualification_standards WHERE id = ?',
      [id]
    );

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
    const { employee_id, position_id } = validatedData;

    // Get employee details
    const [employees] = await db.query<EmployeeRow[]>(
      `SELECT id, first_name, last_name, employee_id, eligibility_type, eligibility_number, 
              eligibility_date, highest_education, years_of_experience
       FROM authentication WHERE id = ?`,
      [employee_id]
    );

    if (employees.length === 0) {
      res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
      return;
    }

    const employee = employees[0];

    // Get position with QS
    const [positions] = await db.query<PositionRow[]>(
      `SELECT p.id, p.position_title, p.salary_grade, p.qualification_standards_id
       FROM plantilla_positions p
       WHERE p.id = ?`,
      [position_id]
    );

    if (positions.length === 0) {
      res.status(404).json({
        success: false,
        message: 'Position not found'
      });
      return;
    }

    const position = positions[0];

    if (!position.qualification_standards_id) {
      res.json({
        success: true,
        qualified: true,
        message: 'No qualification standards defined for this position',
        score: 100
      });
      return;
    }

    // Get QS requirements
    const [standards] = await db.query<QSRow[]>(
      'SELECT * FROM qualification_standards WHERE id = ?',
      [position.qualification_standards_id]
    );

    if (standards.length === 0) {
      res.status(404).json({
        success: false,
        message: 'Qualification standards not found'
      });
      return;
    }

    const qs = standards[0];

    // Validation logic
    const missingRequirements: string[] = [];
    let score = 0;
    const maxScore = 4; // Education, Experience, Training, Eligibility

    // 1. Education (25%)
    if (employee.highest_education) {
      // Simple check: if employee has education data
      score += 1;
    } else {
      missingRequirements.push(`Education: ${qs.education_requirement}`);
    }

    // 2. Experience (25%)
    if (employee.years_of_experience >= qs.experience_years) {
      score += 1;
    } else {
      missingRequirements.push(
        `Experience: ${qs.experience_years} years required (has ${employee.years_of_experience} years)`
      );
    }

    // 3. Training (25%) - Simplified: assume met if employee has experience
    if (employee.years_of_experience > 0) {
      score += 1;
    } else if (qs.training_hours > 0) {
      missingRequirements.push(`Training: ${qs.training_hours} hours required`);
    } else {
      score += 1; // No training required
    }

    // 4. Eligibility (25%)
    if (employee.eligibility_type) {
      // Check if eligibility matches (case-insensitive partial match)
      const employeeElig = employee.eligibility_type.toLowerCase();
      const requiredElig = qs.eligibility_required.toLowerCase();

      if (
        employeeElig.includes(requiredElig) ||
        requiredElig.includes(employeeElig) ||
        employeeElig.includes('professional') ||
        employeeElig.includes('cpa') ||
        employeeElig.includes('engineer')
      ) {
        score += 1;
      } else {
        missingRequirements.push(`Eligibility: ${qs.eligibility_required} (has ${employee.eligibility_type})`);
      }
    } else {
      missingRequirements.push(`Eligibility: ${qs.eligibility_required}`);
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
        name: `${employee.first_name} ${employee.last_name}`,
        employee_id: employee.employee_id,
        education: employee.highest_education,
        experience_years: employee.years_of_experience,
        eligibility: employee.eligibility_type
      },
      position: {
        id: position.id,
        title: position.position_title,
        salary_grade: position.salary_grade
      },
      requirements: {
        education: qs.education_requirement,
        experience_years: qs.experience_years,
        training_hours: qs.training_hours,
        eligibility: qs.eligibility_required
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
