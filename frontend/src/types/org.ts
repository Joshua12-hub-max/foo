import { Employee } from './employee';

export interface Department {
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

export interface DepartmentDetailed extends Department {
  employees: Employee[];
}

export interface PlantillaPosition {
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

export interface PlantillaAuditLog {
  id: number;
  positionId: number;
  action: string;
  actorId: number;
  oldValues: Record<string, string | number | boolean | null | undefined> | null;
  newValues: Record<string, string | number | boolean | null | undefined> | null;
  createdAt: string | null;
  itemNumber?: string;
  positionTitle?: string;
  actorName?: string;
}

export interface PlantillaHistory {
  id: number;
  positionId: number;
  employeeId: string;
  employeeName: string | null;
  positionTitle: string | null;
  startDate: string;
  endDate: string | null;
  reason: string | null;
  createdAt: string | null;
}
