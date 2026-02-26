import api from './axios';
import { AxiosResponse } from 'axios';

// ==================== TYPES ====================

export interface QualificationStandard {
  id: number;
  positionTitle: string;
  salaryGrade: number;
  educationRequirement: string;
  experienceYears: number;
  trainingHours: number;
  eligibilityRequired: string;
  competencyRequirements?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface QualificationValidationResult {
  success: boolean;
  qualified: boolean;
  score: number;
  missingRequirements: string[];
  employee: {
    id: number;
    name: string;
    employeeId: string;
    education?: string;
    experienceYears: number;
    eligibility?: string;
  };
  position: {
    id: number;
    title: string;
    salaryGrade: number;
  };
  requirements: {
    education: string;
    experienceYears: number;
    trainingHours: number;
    eligibility: string;
  };
}

export interface NepotismRelationship {
  id: number;
  employeeId1: number;
  employeeId2: number;
  relationshipType: string;
  degree: number;
  verifiedBy?: number;
  verifiedAt?: string;
  notes?: string;
  createdAt: string;
  employee1Name?: string;
  employee2Name?: string;
  verifierName?: string;
}

export interface NepotismCheckResult {
  success: boolean;
  violation: boolean;
  violations: Array<{
    type: string;
    relationship: string;
    degree: number;
    relatedPerson: string;
    severity: 'CRITICAL' | 'WARNING' | 'INFO';
  }>;
  employee: {
    id: number;
    name: string;
    employeeId: string;
  };
  position: {
    id: number;
    title: string;
    department?: string;
  };
  warningMessage: string;
}

export interface StepIncrement {
  id: number;
  employeeId: number;
  positionId: number;
  currentStep: number;
  previousStep?: number;
  eligibleDate: string;
  status: 'Pending' | 'Approved' | 'Denied' | 'Processed';
  processedAt?: string;
  processedBy?: number;
  remarks?: string;
  employeeName?: string;
  employeeNumber?: string;
  positionTitle?: string;
  salaryGrade?: number;
  processorName?: string;
}

export interface EligibleEmployee {
  employee_id: number;
  employee_name: string;
  employee_employee_id: string;
  position_id: number;
  position_title: string;
  salary_grade: number;
  current_step: number;
  next_step: number;
  years_in_position: number;
  eligible_date: string;
}

export interface BudgetAllocation {
  id: number;
  year: number;
  department: string;
  totalBudget: number;
  utilizedBudget: number;
  remainingBudget: number;
  utilizationRate: number;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BudgetSummary {
  totalAllocated: number;
  totalUtilized: number;
  totalRemaining: number;
  avgUtilizationRate: number;
  departmentCount: number;
}

export interface DepartmentBudget {
  department: string;
  totalBudget: number;
  utilizedBudget: number;
  remainingBudget: number;
  utilizationRate: number;
}

export interface Form9Row {
  item_number: string;
  position_title: string;
  salary_grade: number;
  monthly_salary: number;
  education: string;
  training: number;
  experience: number;
  eligibility: string;
  competency: string;
  assignment: string;
  place_of_assignment?: string;
}


export interface PSIPOPRow {
  item_number: string;
  position_title: string;
  salary_grade: number;
  step_increment: number;
  monthly_salary: number;
  department: string;
  is_vacant: boolean;
  incumbent_name: string | null;
  employee_id: string | null;
  position_status: string;
}

export interface Form33Data {
  item_number: string;
  position_title: string;
  salary_grade: number;
  monthly_salary: number;
  department: string;
  first_name: string;
  last_name: string;
  middle_name: string | null;
  employee_id: string;
  date_of_signing: string;
  status: string;
  nature_of_appointment: string;
}

// ==================== QUALIFICATION STANDARDS API ====================

export const qualificationStandardsApi = {
  getAll: async (params?: { positionTitle?: string; salaryGrade?: number; isActive?: boolean }): Promise<AxiosResponse<{ success: boolean; standards: QualificationStandard[] }>> => {
    try {
      return await api.get('/qualification-standards', { params });
    } catch (error) {
      throw error;
    }
  },

  getById: async (id: number): Promise<AxiosResponse<{ success: boolean; standard: QualificationStandard }>> => {
    try {
      return await api.get(`/qualification-standards/${id}`);
    } catch (error) {
      throw error;
    }
  },

  create: async (data: Omit<QualificationStandard, 'id' | 'createdAt' | 'updatedAt'>): Promise<AxiosResponse> => {
    try {
      return await api.post('/qualification-standards', data);
    } catch (error) {
      throw error;
    }
  },

  update: async (id: number, data: Partial<QualificationStandard>): Promise<AxiosResponse> => {
    try {
      return await api.put(`/qualification-standards/${id}`, data);
    } catch (error) {
      throw error;
    }
  },

  delete: async (id: number): Promise<AxiosResponse> => {
    try {
      return await api.delete(`/qualification-standards/${id}`);
    } catch (error) {
      throw error;
    }
  },

  validate: async (employeeId: number, positionId: number): Promise<AxiosResponse<QualificationValidationResult>> => {
    try {
      return await api.post('/qualification-standards/validate', { employeeId, positionId });
    } catch (error) {
      throw error;
    }
  }
};

// ==================== NEPOTISM API ====================

export const nepotismApi = {
  getRelationships: async (params?: { employee_id?: number; degree?: number }): Promise<AxiosResponse<{ success: boolean; relationships: NepotismRelationship[] }>> => {
    try {
      return await api.get('/nepotism/relationships', { params });
    } catch (error) {
      throw error;
    }
  },

  getEmployeeRelationships: async (employee_id: number): Promise<AxiosResponse<{ success: boolean; relationships: NepotismRelationship[] }>> => {
    try {
      return await api.get(`/nepotism/relationships/${employee_id}`);
    } catch (error) {
      throw error;
    }
  },

  createRelationship: async (data: {
    employee_id_1: number;
    employee_id_2: number;
    relationship_type: string;
    degree: number;
    notes?: string;
  }): Promise<AxiosResponse> => {
    try {
      return await api.post('/nepotism/relationships', data);
    } catch (error) {
      throw error;
    }
  },

  deleteRelationship: async (id: number): Promise<AxiosResponse> => {
    try {
      return await api.delete(`/nepotism/relationships/${id}`);
    } catch (error) {
      throw error;
    }
  },

  checkNepotism: async (data: {
    employee_id: number;
    position_id: number;
    appointing_authority_id?: number;
  }): Promise<AxiosResponse<NepotismCheckResult>> => {
    try {
      return await api.post('/nepotism/check', data);
    } catch (error) {
      throw error;
    }
  }
};

// ==================== STEP INCREMENT API ====================

export const stepIncrementApi = {
  getAll: async (params?: { status?: string; employee_id?: number }): Promise<AxiosResponse<{ success: boolean; increments: StepIncrement[] }>> => {
    try {
      return await api.get('/step-increment', { params });
    } catch (error) {
      throw error;
    }
  },

  getEligible: async (): Promise<AxiosResponse<{ success: boolean; eligible_employees: EligibleEmployee[]; count: number }>> => {
    try {
      return await api.get('/step-increment/eligible');
    } catch (error) {
      throw error;
    }
  },

  create: async (data: {
    employee_id: number;
    position_id: number;
    current_step: number;
    eligible_date: string;
    status?: string;
    remarks?: string;
  }): Promise<AxiosResponse> => {
    try {
      return await api.post('/step-increment', data);
    } catch (error) {
      throw error;
    }
  },

  process: async (data: {
    increment_id: number;
    status: 'Approved' | 'Denied';
    remarks?: string;
  }): Promise<AxiosResponse> => {
    try {
      return await api.post('/step-increment/process', data);
    } catch (error) {
      throw error;
    }
  }
};

// ==================== BUDGET ALLOCATION API ====================

export const budgetAllocationApi = {
  getAll: async (params?: { year?: number; department?: string }): Promise<AxiosResponse<{ success: boolean; allocations: BudgetAllocation[] }>> => {
    try {
      return await api.get('/budget-allocation', { params });
    } catch (error) {
      throw error;
    }
  },

  getSummary: async (year: number): Promise<AxiosResponse<{ success: boolean; summary: BudgetSummary; byDepartment: DepartmentBudget[] }>> => {
    try {
      return await api.get('/budget-allocation/summary', { params: { year } });
    } catch (error) {
      throw error;
    }
  },

  create: async (data: {
    year: number;
    department: string;
    totalBudget: number;
    notes?: string;
  }): Promise<AxiosResponse> => {
    try {
      return await api.post('/budget-allocation', data);
    } catch (error) {
      throw error;
    }
  },

  update: async (id: number, data: {
    totalBudget?: number;
    notes?: string;
  }): Promise<AxiosResponse> => {
    try {
      return await api.put(`/budget-allocation/${id}`, data);
    } catch (error) {
      throw error;
    }
  },

  recalculate: async (year: number, department: string): Promise<AxiosResponse> => {
    try {
      return await api.post('/budget-allocation/recalculate', { year, department });
    } catch (error) {
      throw error;
    }
  }
};

// ==================== REPORTS API ====================

export const reportsApi = {
  getForm9: async (params?: { department?: string }): Promise<AxiosResponse<{ success: boolean; data: Form9Row[]; meta: Record<string, unknown> }>> => {
    try {
      return await api.get('/reports/form9', { params });
    } catch (error) {
      throw error;
    }
  },

  getForm33: async (positionId: number): Promise<AxiosResponse<{ success: boolean; data: Form33Data; meta: Record<string, unknown> }>> => {
    try {
      return await api.get('/reports/form33', { params: { positionId } });
    } catch (error) {
      throw error;
    }
  },


  getPSIPOP: async (): Promise<AxiosResponse<{ success: boolean; data: PSIPOPRow[]; meta: Record<string, unknown> }>> => {
    try {
      return await api.get('/reports/psipop');
    } catch (error) {
      throw error;
    }
  }
};

// Export all APIs
export const complianceApi = {
  qualificationStandards: qualificationStandardsApi,
  nepotism: nepotismApi,
  stepIncrement: stepIncrementApi,
  budgetAllocation: budgetAllocationApi,
  reports: reportsApi,
  getEmployeeMetrics: async (employeeId: string, params?: { year?: number; month?: number }): Promise<AxiosResponse<{ 
    success: boolean; 
    employee: {
      id: number;
      firstName: string;
      lastName: string;
      dutyType: string;
      dailyTargetHours: number;
      salaryBasis: string;
      employeeId: string;
    }; 
    metrics: {
      attendance: {
        totalLateMinutes: number;
        totalUndertimeMinutes: number;
        totalLateCount: number;
        totalUndertimeCount: number;
        totalAbsenceCount: number;
        daysEquivalent: string;
      };
      violations: Array<{
        id: number;
        violationDate: string;
        status: string;
        penalty: string | null;
        policyTitle: string;
      }>;
    }
  }>> => {
    try {
      return await api.get(`/compliance/metrics/${employeeId}`, { params });
    } catch (error) {
      throw error;
    }
  }
};
