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
  headOfDepartment: string | null;
  budget: string | null;
  parentDepartmentId: number | null;
  location: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  employeeCount?: number;
}

export interface DepartmentDetailedApiResponse extends DepartmentApiResponse {
  employees: EmployeeApiResponse[];
}

export interface PlantillaPositionApiResponse {
  id: number;
  itemNumber: string;
  positionTitle: string;
  salaryGrade: number;
  stepIncrement: number | null;
  department: string | null;
  departmentId: number | null;
  isVacant: number;
  incumbentId: number | null;
  monthlySalary: string | null;
  filledDate: string | null;
  vacatedDate: string | null;
  ordinanceNumber: string | null;
  ordinanceDate: string | null;
  abolishmentOrdinance: string | null;
  abolishmentDate: string | null;
  qualificationStandardsId: number | null;
  budgetSource: string | null;
  isCoterminous: number;
  status: 'Active' | 'Abolished' | 'Frozen';
  areaCode: string | null;
  areaType: 'R' | 'P' | 'D' | 'M' | 'F' | 'B' | null;
  areaLevel: 'K' | 'T' | 'S' | 'A' | null;
  lastPromotionDate: string | null;
  
  // Joined fields
  incumbentName?: string | null;
  incumbentEmployeeId?: string | null;
  incumbentFirstName?: string | null;
  incumbentLastName?: string | null;
  incumbentMiddleName?: string | null;
  departmentName?: string | null;
}

export interface PlantillaAuditLogApiResponse {
  id: number;
  positionId: number;
  action: string;
  actorId: number;
  oldValues: Record<string, unknown> | null;
  newValues: Record<string, unknown> | null;
  createdAt: string | null;
  itemNumber?: string;
  positionTitle?: string;
  actorName?: string;
}

export interface PlantillaHistoryApiResponse {
  id: number;
  positionId: number;
  employeeId: number;
  employeeName: string | null;
  positionTitle: string | null;
  startDate: string;
  endDate: string | null;
  reason: string | null;
  createdAt: string | null;
}
