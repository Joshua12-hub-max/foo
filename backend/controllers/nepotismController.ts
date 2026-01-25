import { Request, Response } from 'express';
import db from '../db/connection.js';
import type { RowDataPacket, ResultSetHeader } from 'mysql2/promise';
import type { AuthenticatedRequest } from '../types/index.js';
import {
  NepotismRelationshipSchema,
  CheckNepotismSchema,
  type NepotismRelationshipInput,
  type CheckNepotismInput
} from '../schemas/plantillaComplianceSchema.js';

interface NepotismRow extends RowDataPacket {
  id: number;
  employee_id_1: number;
  employee_id_2: number;
  relationship_type: string;
  degree: number;
  verified_by?: number;
  verified_at?: Date;
  notes?: string;
  created_at: Date;
  // Joined fields
  employee_1_name?: string;
  employee_2_name?: string;
  verifier_name?: string;
}

interface EmployeeRow extends RowDataPacket {
  id: number;
  first_name: string;
  last_name: string;
  employee_id: string;
  department?: string;
}

interface PositionRow extends RowDataPacket {
  id: number;
  position_title: string;
  department?: string;
}

/**
 * Get all nepotism relationships
 * GET /api/nepotism/relationships
 */
export const getNepotismRelationships = async (req: Request, res: Response): Promise<void> => {
  try {
    const { employee_id, degree } = req.query;

    let query = `
      SELECT nr.*,
             CONCAT(e1.first_name, ' ', e1.last_name) as employee_1_name,
             CONCAT(e2.first_name, ' ', e2.last_name) as employee_2_name,
             CONCAT(v.first_name, ' ', v.last_name) as verifier_name
      FROM nepotism_relationships nr
      LEFT JOIN authentication e1 ON nr.employee_id_1 = e1.id
      LEFT JOIN authentication e2 ON nr.employee_id_2 = e2.id
      LEFT JOIN authentication v ON nr.verified_by = v.id
      WHERE 1=1
    `;
    const params: (string | number)[] = [];

    if (employee_id) {
      query += ' AND (nr.employee_id_1 = ? OR nr.employee_id_2 = ?)';
      params.push(parseInt(employee_id as string), parseInt(employee_id as string));
    }

    if (degree) {
      query += ' AND nr.degree = ?';
      params.push(parseInt(degree as string));
    }

    query += ' ORDER BY nr.created_at DESC';

    const [relationships] = await db.query<NepotismRow[]>(query, params);

    res.json({
      success: true,
      relationships
    });
  } catch (error) {
    console.error('Get Nepotism Relationships Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch nepotism relationships'
    });
  }
};

/**
 * Get relationships for a specific employee
 * GET /api/nepotism/relationships/:employee_id
 */
export const getEmployeeRelationships = async (req: Request, res: Response): Promise<void> => {
  try {
    const { employee_id } = req.params;

    const [relationships] = await db.query<NepotismRow[]>(
      `SELECT nr.*,
              CONCAT(e1.first_name, ' ', e1.last_name) as employee_1_name,
              CONCAT(e2.first_name, ' ', e2.last_name) as employee_2_name,
              CONCAT(v.first_name, ' ', v.last_name) as verifier_name
       FROM nepotism_relationships nr
       LEFT JOIN authentication e1 ON nr.employee_id_1 = e1.id
       LEFT JOIN authentication e2 ON nr.employee_id_2 = e2.id
       LEFT JOIN authentication v ON nr.verified_by = v.id
       WHERE nr.employee_id_1 = ? OR nr.employee_id_2 = ?
       ORDER BY nr.degree ASC, nr.created_at DESC`,
      [employee_id, employee_id]
    );

    res.json({
      success: true,
      relationships
    });
  } catch (error) {
    console.error('Get Employee Relationships Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch employee relationships'
    });
  }
};

/**
 * Register a new nepotism relationship
 * POST /api/nepotism/relationships
 */
export const createNepotismRelationship = async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const validatedData = NepotismRelationshipSchema.parse(req.body);

    // Verify both employees exist
    const [employee1] = await db.query<EmployeeRow[]>(
      'SELECT id FROM authentication WHERE id = ?',
      [validatedData.employee_id_1]
    );

    const [employee2] = await db.query<EmployeeRow[]>(
      'SELECT id FROM authentication WHERE id = ?',
      [validatedData.employee_id_2]
    );

    if (employee1.length === 0 || employee2.length === 0) {
      res.status(404).json({
        success: false,
        message: 'One or both employees not found'
      });
      return;
    }

    // Prevent duplicate relationships
    const [existing] = await db.query<NepotismRow[]>(
      `SELECT id FROM nepotism_relationships 
       WHERE (employee_id_1 = ? AND employee_id_2 = ?) 
          OR (employee_id_1 = ? AND employee_id_2 = ?)`,
      [
        validatedData.employee_id_1,
        validatedData.employee_id_2,
        validatedData.employee_id_2,
        validatedData.employee_id_1
      ]
    );

    if (existing.length > 0) {
      res.status(409).json({
        success: false,
        message: 'Relationship already registered'
      });
      return;
    }

    const [result] = await db.query<ResultSetHeader>(
      `INSERT INTO nepotism_relationships 
       (employee_id_1, employee_id_2, relationship_type, degree, verified_by, verified_at, notes)
       VALUES (?, ?, ?, ?, ?, NOW(), ?)`,
      [
        validatedData.employee_id_1,
        validatedData.employee_id_2,
        validatedData.relationship_type,
        validatedData.degree,
        authReq.user.id,
        validatedData.notes || null
      ]
    );

    res.status(201).json({
      success: true,
      message: 'Nepotism relationship registered successfully',
      id: result.insertId
    });
  } catch (error: any) {
    console.error('Create Nepotism Relationship Error:', error);

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
      message: 'Failed to register nepotism relationship'
    });
  }
};

/**
 * Check for nepotism violations
 * POST /api/nepotism/check
 * 
 * Checks if appointing an employee to a position would violate nepotism rules.
 * CSC Rule: No person shall be appointed to a position if they have a 3rd degree
 * relationship with the appointing authority or the head of the department.
 */
export const checkNepotism = async (req: Request, res: Response): Promise<void> => {
  try {
    const validatedData = CheckNepotismSchema.parse(req.body);
    const { employee_id, position_id, appointing_authority_id } = validatedData;

    // Get employee details
    const [employees] = await db.query<EmployeeRow[]>(
      'SELECT id, first_name, last_name, employee_id, department FROM authentication WHERE id = ?',
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

    // Get position details
    const [positions] = await db.query<PositionRow[]>(
      'SELECT id, position_title, department FROM plantilla_positions WHERE id = ?',
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

    // Get all relationships of the employee (up to 3rd degree)
    const [relationships] = await db.query<NepotismRow[]>(
      `SELECT nr.*,
              CONCAT(e1.first_name, ' ', e1.last_name) as employee_1_name,
              CONCAT(e2.first_name, ' ', e2.last_name) as employee_2_name,
              e1.id as e1_id, e2.id as e2_id
       FROM nepotism_relationships nr
       LEFT JOIN authentication e1 ON nr.employee_id_1 = e1.id
       LEFT JOIN authentication e2 ON nr.employee_id_2 = e2.id
       WHERE (nr.employee_id_1 = ? OR nr.employee_id_2 = ?)
         AND nr.degree <= 3`,
      [employee_id, employee_id]
    );

    // Find department head for the position's department
    let departmentHeadId: number | null = null;
    if (position.department) {
      const [deptHeads] = await db.query<EmployeeRow[]>(
        `SELECT a.id FROM authentication a
         LEFT JOIN plantilla_positions pp ON a.id = pp.incumbent_id
         WHERE a.department = ? 
           AND (a.role = 'admin' OR pp.position_title LIKE '%Head%' OR pp.position_title LIKE '%Chief%')
         LIMIT 1`,
        [position.department]
      );

      if (deptHeads.length > 0) {
        departmentHeadId = deptHeads[0].id;
      }
    }

    // Check for violations
    const violations: any[] = [];

    for (const rel of relationships) {
      const relatedPersonId = rel.employee_id_1 === employee_id ? rel.employee_id_2 : rel.employee_id_1;
      const relatedPersonName = rel.employee_id_1 === employee_id ? rel.employee_2_name : rel.employee_1_name;

      // Check if related person is the appointing authority
      if (appointing_authority_id && relatedPersonId === appointing_authority_id) {
        violations.push({
          type: 'Appointing Authority',
          relationship: rel.relationship_type,
          degree: rel.degree,
          related_person: relatedPersonName,
          severity: 'CRITICAL'
        });
      }

      // Check if related person is the department head
      if (departmentHeadId && relatedPersonId === departmentHeadId) {
        violations.push({
          type: 'Department Head',
          relationship: rel.relationship_type,
          degree: rel.degree,
          related_person: relatedPersonName,
          severity: 'CRITICAL'
        });
      }

      // Check if related person works in the same department (warning only)
      const [relatedEmployee] = await db.query<EmployeeRow[]>(
        'SELECT department FROM authentication WHERE id = ?',
        [relatedPersonId]
      );

      if (relatedEmployee.length > 0 && relatedEmployee[0].department === position.department) {
        violations.push({
          type: 'Same Department',
          relationship: rel.relationship_type,
          degree: rel.degree,
          related_person: relatedPersonName,
          severity: rel.degree <= 3 ? 'WARNING' : 'INFO'
        });
      }
    }

    const hasViolation = violations.some(v => v.severity === 'CRITICAL');

    res.json({
      success: true,
      violation: hasViolation,
      violations,
      employee: {
        id: employee.id,
        name: `${employee.first_name} ${employee.last_name}`,
        employee_id: employee.employee_id
      },
      position: {
        id: position.id,
        title: position.position_title,
        department: position.department
      },
      warning_message: hasViolation
        ? '⚠️ NEPOTISM VIOLATION DETECTED: This appointment violates CSC nepotism rules. The employee has a 3rd degree or closer relationship with the appointing authority or department head.'
        : violations.length > 0
        ? '⚠️ WARNING: Employee has relatives in the same department. Please review carefully.'
        : '✅ No nepotism violations detected.'
    });
  } catch (error: any) {
    console.error('Check Nepotism Error:', error);

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
      message: 'Failed to check nepotism'
    });
  }
};

/**
 * Delete a nepotism relationship
 * DELETE /api/nepotism/relationships/:id
 */
export const deleteNepotismRelationship = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const [result] = await db.query<ResultSetHeader>(
      'DELETE FROM nepotism_relationships WHERE id = ?',
      [id]
    );

    if (result.affectedRows === 0) {
      res.status(404).json({
        success: false,
        message: 'Relationship not found'
      });
      return;
    }

    res.json({
      success: true,
      message: 'Relationship deleted successfully'
    });
  } catch (error) {
    console.error('Delete Nepotism Relationship Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete relationship'
    });
  }
};
