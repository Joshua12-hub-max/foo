import { Request, Response } from 'express';
import db from '../db/connection.js';
import type { RowDataPacket } from 'mysql2/promise';

interface ReportRow extends RowDataPacket {
  [key: string]: any;
}

/**
 * Get Data for CSC Form 9 (Publication of Vacant Positions)
 */
export const getForm9Data = async (req: Request, res: Response): Promise<void> => {
  try {
    const { department } = req.query;
    let query = `
      SELECT 
        p.item_number, 
        p.position_title, 
        p.salary_grade, 
        p.monthly_salary,
        qs.education_requirement as education,
        qs.training_hours as training,
        qs.experience_years as experience,
        qs.eligibility_required as eligibility,
        qs.competency_requirements as competency,
        p.department as assignment
      FROM plantilla_positions p
      LEFT JOIN qualification_standards qs ON p.qualification_standards_id = qs.id
      WHERE p.is_vacant = 1 AND p.status = 'Active'
    `;
    
    const params: any[] = [];
    if (department && department !== 'All') {
      query += ` AND p.department = ?`;
      params.push(department);
    }
    
    query += ` ORDER BY p.salary_grade DESC`;
    
    const [rows] = await db.query<ReportRow[]>(query, params);
    
    res.json({
      success: true,
      data: rows,
      meta: {
        form_name: 'CSC Form No. 9',
        title: 'Electronic Copy to be submitted to the CSC Field Office',
        heading: 'Request for Publication of Vacant Positions'
      }
    });
  } catch (error) {
    console.error('Form 9 Error:', error);
    res.status(500).json({ success: false, message: 'Failed to generate Form 9 data' });
  }
};

/**
 * Get Data for CS Form 33 (Appointment Form)
 */
export const getForm33Data = async (req: Request, res: Response): Promise<void> => {
  try {
    const { position_id } = req.query;
    if (!position_id) {
      res.status(400).json({ success: false, message: 'Position ID is required' });
      return;
    }

    const query = `
      SELECT 
        p.item_number, 
        p.position_title, 
        p.salary_grade, 
        p.monthly_salary,
        p.department,
        a.first_name,
        a.last_name,
        a.middle_name,
        a.employee_id,
        p.filled_date as date_of_signing,
        'Permanent' as status, -- Default or fetch from profile
        'Original' as nature_of_appointment -- Default or fetch from profile
      FROM plantilla_positions p
      JOIN authentication a ON p.incumbent_id = a.id
      WHERE p.id = ?
    `;
    
    const [rows] = await db.query<ReportRow[]>(query, [position_id]);
    
    if (rows.length === 0) {
      res.status(404).json({ success: false, message: 'Filled position not found' });
      return;
    }

    res.json({
      success: true,
      data: rows[0],
      meta: {
        form_name: 'CS Form No. 33-A',
        revision: 'Revised 2018',
        title: 'Appointment Form'
      }
    });
  } catch (error) {
    console.error('Form 33 Error:', error);
    res.status(500).json({ success: false, message: 'Failed to generate Form 33 data' });
  }
};

/**
 * Get Data for RAI (Report on Appointments Issued)
 */
export const getRAIData = async (req: Request, res: Response): Promise<void> => {
  try {
    const { start_date, end_date } = req.query;
    
    let query = `
      SELECT 
        ph.employee_name,
        ph.position_title,
        p.item_number,
        p.salary_grade,
        p.monthly_salary,
        ph.start_date as date_issued,
        'Permanent' as status,
        'Original' as nature_of_appointment,
        p.department
      FROM plantilla_position_history ph
      JOIN plantilla_positions p ON ph.position_id = p.id
      WHERE 1=1
    `;
    
    const params: any[] = [];
    if (start_date) {
      query += ` AND ph.start_date >= ?`;
      params.push(start_date);
    }
    if (end_date) {
      query += ` AND ph.start_date <= ?`;
      params.push(end_date);
    }
    
    query += ` ORDER BY ph.start_date DESC`;
    
    const [rows] = await db.query<ReportRow[]>(query, params);
    
    res.json({
      success: true,
      data: rows,
      meta: {
        form_name: 'RAI',
        title: 'Report on Appointments Issued'
      }
    });
  } catch (error) {
    console.error('RAI Error:', error);
    res.status(500).json({ success: false, message: 'Failed to generate RAI data' });
  }
};

/**
 * Get Data for PSI-POP (Plantilla of Personnel)
 */
export const getPSIPOPData = async (req: Request, res: Response): Promise<void> => {
  try {
    const [rows] = await db.query<ReportRow[]>(`
      SELECT 
        p.item_number,
        p.position_title,
        p.salary_grade,
        p.step_increment,
        p.monthly_salary,
        p.department,
        p.is_vacant,
        CONCAT(a.first_name, ' ', a.last_name) as incumbent_name,
        a.employee_id,
        p.status as position_status
      FROM plantilla_positions p
      LEFT JOIN authentication a ON p.incumbent_id = a.id
      ORDER BY p.department ASC, p.salary_grade DESC
    `);
    
    res.json({
      success: true,
      data: rows,
      meta: {
        form_name: 'PSI-POP',
        title: 'Personal Services Itemization and Plantilla of Personnel'
      }
    });
  } catch (error) {
    console.error('PSIPOP Error:', error);
    res.status(500).json({ success: false, message: 'Failed to generate PSI-POP data' });
  }
};
