import api from './axios';
import { AxiosResponse } from 'axios';

// ==================== TYPES ====================

export interface QualificationStandard {
  id: number;
  position_title: string;
  salary_grade: number;
  education_requirement: string;
  experience_years: number;
  training_hours: number;
  eligibility_required: string;
  competency_requirements?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface QualificationValidationResult {
  success: boolean;
  qualified: boolean;
  score: number;
  missing_requirements: string[];
  employee: {
    id: number;
    name: string;
    employee_id: string;
    education?: string;
    experience_years: number;
    eligibility?: string;
  };
  position: {
    id: number;
    title: string;
    salary_grade: number;
  };
  requirements: {
    education: string;
    experience_years: number;
    training_hours: number;
    eligibility: string;
  };
}

export interface NepotismRelationship {
  id: number;
  employee_id_1: number;
  employee_id_2: number;
  relationship_type: string;
  degree: number;
  verified_by?: number;
  verified_at?: string;
  notes?: string;
  created_at: string;
  employee_1_name?: string;
  employee_2_name?: string;
  verifier_name?: string;
}

export interface NepotismCheckResult {
  success: boolean;
  violation: boolean;
  violations: Array<{
    type: string;
    relationship: string;
    degree: number;
    related_person: string;
    severity: 'CRITICAL' | 'WARNING' | 'INFO';
  }>;
  employee: {
    id: number;
    name: string;
    employee_id: string;
  };
  position: {
    id: number;
    title: string;
    department?: string;
  };
  warning_message: string;
}

export interface StepIncrement {
  id: number;
  employee_id: number;
  position_id: number;
  current_step: number;
  previous_step?: number;
  eligible_date: string;
  status: 'Pending' | 'Approved' | 'Denied' | 'Processed';
  processed_at?: string;
  processed_by?: number;
  remarks?: string;
  employee_name?: string;
  employee_employee_id?: string;
  position_title?: string;
  salary_grade?: number;
  processor_name?: string;
}

export interface BudgetAllocation {
  id: number;
  year: number;
  department: string;
  total_budget: number;
  utilized_budget: number;
  remaining_budget: number;
  utilization_rate: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

// ==================== QUALIFICATION STANDARDS API ====================

export const qualificationStandardsApi = {
  getAll: async (params?: { position_title?: string; salary_grade?: number; is_active?: boolean }): Promise<AxiosResponse<{ success: boolean; standards: QualificationStandard[] }>> => {
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

  create: async (data: Omit<QualificationStandard, 'id' | 'created_at' | 'updated_at'>): Promise<AxiosResponse> => {
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

  validate: async (employee_id: number, position_id: number): Promise<AxiosResponse<QualificationValidationResult>> => {
    try {
      return await api.post('/qualification-standards/validate', { employee_id, position_id });
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

  getEligible: async (): Promise<AxiosResponse<{ success: boolean; eligible_employees: any[]; count: number }>> => {
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

  getSummary: async (year: number): Promise<AxiosResponse<{ success: boolean; summary: any; by_department: any[] }>> => {
    try {
      return await api.get('/budget-allocation/summary', { params: { year } });
    } catch (error) {
      throw error;
    }
  },

  create: async (data: {
    year: number;
    department: string;
    total_budget: number;
    notes?: string;
  }): Promise<AxiosResponse> => {
    try {
      return await api.post('/budget-allocation', data);
    } catch (error) {
      throw error;
    }
  },

  update: async (id: number, data: {
    total_budget?: number;
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

// Export all APIs
export const complianceApi = {
  qualificationStandards: qualificationStandardsApi,
  nepotism: nepotismApi,
  stepIncrement: stepIncrementApi,
  budgetAllocation: budgetAllocationApi
};
