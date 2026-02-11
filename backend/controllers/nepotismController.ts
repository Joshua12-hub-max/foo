import { Request, Response } from 'express';
import { db } from '../db/index.js';
import { nepotismRelationships, authentication, plantillaPositions } from '../db/schema.js';
import { eq, or, and, desc, asc, sql, like } from 'drizzle-orm';
import type { AuthenticatedRequest } from '../types/index.js';
import {
  NepotismRelationshipSchema,
  CheckNepotismSchema
} from '../schemas/plantillaComplianceSchema.js';
import { alias } from 'drizzle-orm/mysql-core';

/**
 * Get all nepotism relationships
 * GET /api/nepotism/relationships
 */
export const getNepotismRelationships = async (req: Request, res: Response): Promise<void> => {
  try {
    const { employee_id, degree } = req.query;

    // Aliases for joins
    const e1 = alias(authentication, 'e1');
    const e2 = alias(authentication, 'e2');
    const v = alias(authentication, 'v');

    const conditions = [];
    if (employee_id) {
      conditions.push(or(
        eq(nepotismRelationships.employeeId1, Number(employee_id)),
        eq(nepotismRelationships.employeeId2, Number(employee_id))
      ));
    }
    if (degree) {
      conditions.push(eq(nepotismRelationships.degree, Number(degree)));
    }

    const relationships = await db.select({
      id: nepotismRelationships.id,
      employeeId1: nepotismRelationships.employeeId1,
      employeeId2: nepotismRelationships.employeeId2,
      relationshipType: nepotismRelationships.relationshipType,
      degree: nepotismRelationships.degree,
      verifiedBy: nepotismRelationships.verifiedBy,
      verifiedAt: nepotismRelationships.verifiedAt,
      notes: nepotismRelationships.notes,
      createdAt: nepotismRelationships.createdAt,
      employee1Name: sql<string>`CONCAT(${e1.firstName}, ' ', ${e1.lastName})`,
      employee2Name: sql<string>`CONCAT(${e2.firstName}, ' ', ${e2.lastName})`,
      verifierName: sql<string>`CONCAT(${v.firstName}, ' ', ${v.lastName})`
    })
    .from(nepotismRelationships)
    .leftJoin(e1, eq(nepotismRelationships.employeeId1, e1.id))
    .leftJoin(e2, eq(nepotismRelationships.employeeId2, e2.id))
    .leftJoin(v, eq(nepotismRelationships.verifiedBy, v.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(nepotismRelationships.createdAt));

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
    const empId = Number(employee_id);

    const e1 = alias(authentication, 'e1');
    const e2 = alias(authentication, 'e2');
    const v = alias(authentication, 'v');

    const relationships = await db.select({
      id: nepotismRelationships.id,
      employeeId1: nepotismRelationships.employeeId1,
      employeeId2: nepotismRelationships.employeeId2,
      relationshipType: nepotismRelationships.relationshipType,
      degree: nepotismRelationships.degree,
      verifiedBy: nepotismRelationships.verifiedBy,
      verifiedAt: nepotismRelationships.verifiedAt,
      notes: nepotismRelationships.notes,
      createdAt: nepotismRelationships.createdAt,
      employee1Name: sql<string>`CONCAT(${e1.firstName}, ' ', ${e1.lastName})`,
      employee2Name: sql<string>`CONCAT(${e2.firstName}, ' ', ${e2.lastName})`,
      verifierName: sql<string>`CONCAT(${v.firstName}, ' ', ${v.lastName})`
    })
    .from(nepotismRelationships)
    .leftJoin(e1, eq(nepotismRelationships.employeeId1, e1.id))
    .leftJoin(e2, eq(nepotismRelationships.employeeId2, e2.id))
    .leftJoin(v, eq(nepotismRelationships.verifiedBy, v.id))
    .where(or(
      eq(nepotismRelationships.employeeId1, empId),
      eq(nepotismRelationships.employeeId2, empId)
    ))
    .orderBy(asc(nepotismRelationships.degree), desc(nepotismRelationships.createdAt));

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
    const [employee1] = await db.select({ id: authentication.id }).from(authentication).where(eq(authentication.id, validatedData.employee_id_1));
    const [employee2] = await db.select({ id: authentication.id }).from(authentication).where(eq(authentication.id, validatedData.employee_id_2));

    if (!employee1 || !employee2) {
      res.status(404).json({
        success: false,
        message: 'One or both employees not found'
      });
      return;
    }

    // Prevent duplicate relationships
    const existing = await db.select({ id: nepotismRelationships.id }).from(nepotismRelationships)
      .where(or(
        and(eq(nepotismRelationships.employeeId1, validatedData.employee_id_1), eq(nepotismRelationships.employeeId2, validatedData.employee_id_2)),
        and(eq(nepotismRelationships.employeeId1, validatedData.employee_id_2), eq(nepotismRelationships.employeeId2, validatedData.employee_id_1))
      ));

    if (existing.length > 0) {
      res.status(409).json({
        success: false,
        message: 'Relationship already registered'
      });
      return;
    }

    const [result] = await db.insert(nepotismRelationships).values({
      employeeId1: validatedData.employee_id_1,
      employeeId2: validatedData.employee_id_2,
      relationshipType: validatedData.relationship_type,
      degree: validatedData.degree,
      verifiedBy: authReq.user.id,
      verifiedAt: new Date().toISOString(),
      notes: validatedData.notes || null,
      createdAt: new Date().toISOString()
    });

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
    const employee = await db.query.authentication.findFirst({
      where: eq(authentication.id, employee_id),
      columns: { id: true, firstName: true, lastName: true, employeeId: true, department: true }
    });

    if (!employee) {
      res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
      return;
    }

    // Get position details
    const position = await db.query.plantillaPositions.findFirst({
      where: eq(plantillaPositions.id, position_id),
      columns: { id: true, positionTitle: true, department: true }
    });

    if (!position) {
      res.status(404).json({
        success: false,
        message: 'Position not found'
      });
      return;
    }

    // Get all relationships of the employee (up to 3rd degree)
    const e1 = alias(authentication, 'e1');
    const e2 = alias(authentication, 'e2');

    const relationships = await db.select({
      relationshipType: nepotismRelationships.relationshipType,
      degree: nepotismRelationships.degree,
      employeeId1: nepotismRelationships.employeeId1,
      employeeId2: nepotismRelationships.employeeId2,
      employee1Name: sql<string>`CONCAT(${e1.firstName}, ' ', ${e1.lastName})`,
      employee2Name: sql<string>`CONCAT(${e2.firstName}, ' ', ${e2.lastName})`
    })
    .from(nepotismRelationships)
    .leftJoin(e1, eq(nepotismRelationships.employeeId1, e1.id))
    .leftJoin(e2, eq(nepotismRelationships.employeeId2, e2.id))
    .where(and(
      or(eq(nepotismRelationships.employeeId1, employee_id), eq(nepotismRelationships.employeeId2, employee_id)),
      sql`${nepotismRelationships.degree} <= 3`
    ));

    // Find department head for the position's department
    let departmentHeadId: number | null = null;
    if (position.department) {
      const deptHeads = await db.select({ id: authentication.id })
        .from(authentication)
        .leftJoin(plantillaPositions, eq(authentication.id, plantillaPositions.incumbentId))
        .where(and(
          eq(authentication.department, position.department),
          or(
            eq(authentication.role, 'admin'),
            like(plantillaPositions.positionTitle, '%Head%'),
            like(plantillaPositions.positionTitle, '%Chief%')
          )
        ))
        .limit(1);

      if (deptHeads.length > 0) {
        departmentHeadId = deptHeads[0].id;
      }
    }

    // Check for violations
    const violations: any[] = [];

    for (const rel of relationships) {
      const relatedPersonId = rel.employeeId1 === employee_id ? rel.employeeId2 : rel.employeeId1;
      const relatedPersonName = rel.employeeId1 === employee_id ? rel.employee2Name : rel.employee1Name;

      // Check if related person is the appointing authority
      if (appointing_authority_id && relatedPersonId === appointing_authority_id) {
        violations.push({
          type: 'Appointing Authority',
          relationship: rel.relationshipType,
          degree: rel.degree,
          related_person: relatedPersonName,
          severity: 'CRITICAL'
        });
      }

      // Check if related person is the department head
      if (departmentHeadId && relatedPersonId === departmentHeadId) {
        violations.push({
          type: 'Department Head',
          relationship: rel.relationshipType,
          degree: rel.degree,
          related_person: relatedPersonName,
          severity: 'CRITICAL'
        });
      }

      // Check if related person works in the same department (warning only)
      const relatedEmployee = await db.query.authentication.findFirst({
        where: eq(authentication.id, relatedPersonId),
        columns: { department: true }
      });

      if (relatedEmployee && relatedEmployee.department === position.department) {
        violations.push({
          type: 'Same Department',
          relationship: rel.relationshipType,
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
        name: `${employee.firstName} ${employee.lastName}`,
        employee_id: employee.employeeId
      },
      position: {
        id: position.id,
        title: position.positionTitle,
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

    const [result] = await db.delete(nepotismRelationships).where(eq(nepotismRelationships.id, Number(id)));

    // Drizzle doesn't return affectedRows easily in generic result unless configured
    // But `delete` returns [ResultSetHeader] in mysql2
    const affectedRows = (result as any).affectedRows;

    if (affectedRows === 0) {
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