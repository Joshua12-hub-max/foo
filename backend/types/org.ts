import { InferSelectModel } from 'drizzle-orm';
import { departments, plantillaPositions, plantillaAuditLog, plantillaPositionHistory } from '../db/schema.js';
import { EmployeeApiResponse } from './employee.js';

// --- Database Models ---
export type DepartmentDbModel = InferSelectModel<typeof departments>;
export type PlantillaPositionDbModel = InferSelectModel<typeof plantillaPositions>;
export type PlantillaAuditLogDbModel = InferSelectModel<typeof plantillaAuditLog>;
export type PlantillaHistoryDbModel = InferSelectModel<typeof plantillaPositionHistory>;

// --- API Response Models (snake_case) ---

export interface DepartmentApiResponse {
  id: number;
  name: string;
  description: string | null;
  head_of_department: string | null;
  budget: string | null;
  parent_department_id: number | null;
  location: string | null;
  created_at: string | null;
  updated_at: string | null;
  employee_count?: number;
}

export interface DepartmentDetailedApiResponse extends DepartmentApiResponse {
  employees: EmployeeApiResponse[];
}

export interface PlantillaPositionApiResponse {
  id: number;
  item_number: string;
  position_title: string;
  salary_grade: number;
  step_increment: number | null;
  department: string | null;
  department_id: number | null;
  is_vacant: number;
  incumbent_id: number | null;
  monthly_salary: string | null;
  filled_date: string | null;
  vacated_date: string | null;
  ordinance_number: string | null;
  ordinance_date: string | null;
  abolishment_ordinance: string | null;
  abolishment_date: string | null;
  qualification_standards_id: number | null;
  budget_source: string | null;
  is_coterminous: number;
  status: 'Active' | 'Abolished' | 'Frozen';
  area_code: string | null;
  area_type: 'R' | 'P' | 'D' | 'M' | 'F' | 'B' | null;
  area_level: 'K' | 'T' | 'S' | 'A' | null;
  last_promotion_date: string | null;
  
  // Joined fields
  incumbent_name?: string | null;
  incumbent_employee_id?: string | null;
  incumbent_first_name?: string | null;
  incumbent_last_name?: string | null;
  incumbent_middle_name?: string | null;
  department_name?: string | null;
}

export interface PlantillaAuditLogApiResponse {
  id: number;
  position_id: number;
  action: string;
  actor_id: number;
  old_values: Record<string, unknown> | null;
  new_values: Record<string, unknown> | null;
  created_at: string | null;
  item_number?: string;
  position_title?: string;
  actor_name?: string;
}

export interface PlantillaHistoryApiResponse {
  id: number;
  position_id: number;
  employee_id: number;
  employee_name: string | null;
  position_title: string | null;
  start_date: string;
  end_date: string | null;
  reason: string | null;
  created_at: string | null;
}
