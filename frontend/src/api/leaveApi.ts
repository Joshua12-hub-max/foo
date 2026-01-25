import api from './axios';
import type { AxiosResponse } from 'axios';
import type {
  LeaveApplication,
  LeaveApplicationsResponse,
  LeaveCreditsResponse,
  LedgerResponse,
  HolidaysResponse,
  ApplyLeaveResponse,
  LeaveListParams,
  CreditListParams,
  LedgerParams,
  ApplyLeavePayload,
  RejectLeavePayload,
  CreditUpdatePayload,
  AccrueCreditsPayload,
  AddHolidayPayload,
  LWOPSummary,
} from '@/types/leave.types';

// ============================================================================
// Leave Applications API
// ============================================================================

export const leaveApi = {
  /**
   * Apply for leave (employee)
   */
  applyLeave: async (data: FormData): Promise<AxiosResponse<ApplyLeaveResponse>> => {
    try {
      const response = await api.post<ApplyLeaveResponse>('/leave/apply', data);
      return response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get employee's own leave applications
   */
  getMyApplications: async (params?: LeaveListParams): Promise<AxiosResponse<LeaveApplicationsResponse>> => {
    try {
      const response = await api.get<LeaveApplicationsResponse>('/leave/my-applications', { params });
      return response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get all leave applications (admin)
   */
  getAllApplications: async (params?: LeaveListParams): Promise<AxiosResponse<LeaveApplicationsResponse>> => {
    try {
      const response = await api.get<LeaveApplicationsResponse>('/leave/applications/all', { params });
      return response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Process leave - admin uploads form
   */
  processLeave: async (id: number, formData: FormData): Promise<AxiosResponse<{ message: string }>> => {
    try {
      const response = await api.put<{ message: string }>(`/leave/${id}/process`, formData);
      return response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Finalize leave - employee uploads signed form
   */
  finalizeLeave: async (id: number, formData: FormData): Promise<AxiosResponse<{ message: string }>> => {
    try {
      const response = await api.put<{ message: string }>(`/leave/${id}/finalize`, formData);
      return response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Approve leave application (admin)
   */
  approveLeave: async (id: number): Promise<AxiosResponse<{ message: string }>> => {
    try {
      const response = await api.put<{ message: string }>(`/leave/${id}/approve`);
      return response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Reject leave application (admin)
   */
  rejectLeave: async (id: number, data: RejectLeavePayload): Promise<AxiosResponse<{ message: string }>> => {
    try {
      const response = await api.put<{ message: string }>(`/leave/${id}/reject`, data);
      return response;
    } catch (error) {
      throw error;
    }
  },

  // ============================================================================
  // Credits API
  // ============================================================================

  /**
   * Get employee's own credits
   */
  getMyCredits: async (year?: number): Promise<AxiosResponse<LeaveCreditsResponse>> => {
    try {
      const response = await api.get<LeaveCreditsResponse>('/leave/my-credits', {
        params: year ? { year } : undefined,
      });
      return response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get specific employee's credits (admin)
   */
  getEmployeeCredits: async (employeeId: string, year?: number): Promise<AxiosResponse<LeaveCreditsResponse>> => {
    try {
      const response = await api.get<LeaveCreditsResponse>(`/leave/credits/${employeeId}`, {
        params: year ? { year } : undefined,
      });
      return response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get all employee credits (admin)
   */
  getAllCredits: async (params?: CreditListParams): Promise<AxiosResponse<LeaveCreditsResponse>> => {
    try {
      const response = await api.get<LeaveCreditsResponse>('/leave/credits/all', { params });
      return response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Update employee credit (admin)
   */
  updateCredit: async (employeeId: string, data: CreditUpdatePayload): Promise<AxiosResponse<{ message: string; previousBalance: number; newBalance: number }>> => {
    try {
      const response = await api.put<{ message: string; previousBalance: number; newBalance: number }>(
        `/leave/credits/${employeeId}`,
        data
      );
      return response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Delete employee credit (admin)
   */
  deleteCredit: async (employeeId: string, creditType: string, year?: number): Promise<AxiosResponse<{ message: string }>> => {
    try {
      const response = await api.delete<{ message: string }>(`/leave/credits/${employeeId}`, {
        params: { creditType, year },
      });
      return response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Accrue monthly credits (admin)
   */
  accrueMonthlyCredits: async (data: AccrueCreditsPayload): Promise<AxiosResponse<{ message: string; month: number; year: number; vlAccrued: number; slAccrued: number }>> => {
    try {
      const response = await api.post('/leave/accrue-monthly', data);
      return response;
    } catch (error) {
      throw error;
    }
  },

  // ============================================================================
  // Ledger API
  // ============================================================================

  /**
   * Get employee's own ledger
   */
  getMyLedger: async (params?: LedgerParams): Promise<AxiosResponse<LedgerResponse>> => {
    try {
      const response = await api.get<LedgerResponse>('/leave/my-ledger', { params });
      return response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get specific employee's ledger (admin)
   */
  getEmployeeLedger: async (employeeId: string, params?: LedgerParams): Promise<AxiosResponse<LedgerResponse>> => {
    try {
      const response = await api.get<LedgerResponse>(`/leave/ledger/${employeeId}`, { params });
      return response;
    } catch (error) {
      throw error;
    }
  },

  // ============================================================================
  // Holidays API
  // ============================================================================

  /**
   * Get holidays for a year
   */
  getHolidays: async (year?: number): Promise<AxiosResponse<HolidaysResponse>> => {
    try {
      const response = await api.get<HolidaysResponse>('/leave/holidays', {
        params: year ? { year } : undefined,
      });
      return response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Add a holiday (admin)
   */
  addHoliday: async (data: AddHolidayPayload): Promise<AxiosResponse<{ message: string }>> => {
    try {
      const response = await api.post<{ message: string }>('/leave/holidays', data);
      return response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Delete a holiday (admin)
   */
  deleteHoliday: async (id: number): Promise<AxiosResponse<{ message: string }>> => {
    try {
      const response = await api.delete<{ message: string }>(`/leave/holidays/${id}`);
      return response;
    } catch (error) {
      throw error;
    }
  },

  // ============================================================================
  // LWOP Summary API
  // ============================================================================

  /**
   * Get LWOP summary for employee (admin)
   */
  getLWOPSummary: async (employeeId: string): Promise<AxiosResponse<{ summary: LWOPSummary[] }>> => {
    try {
      const response = await api.get<{ summary: LWOPSummary[] }>(`/leave/lwop-summary/${employeeId}`);
      return response;
    } catch (error) {
      throw error;
    }
  },

  // ============================================================================
  // Service Record & Tardiness API (Phase 6)
  // ============================================================================

  /**
   * Get employee's service record (career history)
   */
  getServiceRecord: async (employeeId: string): Promise<AxiosResponse<{
    records: Array<{
      id: number;
      employee_id: string;
      event_type: string;
      event_date: string;
      end_date: string | null;
      leave_type: string | null;
      days_count: number;
      is_with_pay: boolean;
      remarks: string;
      reference_id: number | null;
      reference_type: string | null;
      processed_by: string;
      created_at: string;
    }>;
    totalLWOPDays: number;
  }>> => {
    try {
      const response = await api.get(`/leave/service-record/${employeeId}`);
      return response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get total LWOP for retirement calculation
   */
  getTotalLWOPForRetirement: async (employeeId: string): Promise<AxiosResponse<{
    employeeId: string;
    totalLWOPDays: number;
    retirementImpact: {
      yearsExtension: number;
      remainingDays: number;
      message: string;
    };
  }>> => {
    try {
      const response = await api.get(`/leave/service-record/${employeeId}/lwop-total`);
      return response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Process monthly tardiness → VL deduction or LWOP (admin)
   */
  processMonthlyTardiness: async (data: {
    month?: number;
    year?: number;
    employeeIds?: string[];
  }): Promise<AxiosResponse<{
    message: string;
    month: number;
    year: number;
    results: Array<{
      employeeId: string;
      daysEquivalent: number;
      deductedFromVL: number;
      chargedAsLWOP: number;
    }>;
    processedBy: string;
  }>> => {
    try {
      const response = await api.post('/leave/process-tardiness', data);
      return response;
    } catch (error) {
      throw error;
    }
  },

  // ============================================================================
  // Legacy Routes (backward compatibility)
  // ============================================================================

  /** @deprecated Use getMyApplications instead */
  getMyLeaves: async (params?: LeaveListParams): Promise<AxiosResponse<LeaveApplicationsResponse>> => {
    try {
      const response = await api.get<LeaveApplicationsResponse>('/leave/my-leaves', { params });
      return response;
    } catch (error) {
      throw error;
    }
  },

  /** @deprecated Use getAllApplications instead */
  getAllLeaves: async (params?: LeaveListParams): Promise<AxiosResponse<LeaveApplicationsResponse>> => {
    try {
      const response = await api.get<LeaveApplicationsResponse>('/leave/all', { params });
      return response;
    } catch (error) {
      throw error;
    }
  },

  /** @deprecated Use updateCredit instead */
  updateEmployeeCredit: async (employeeId: string, data: CreditUpdatePayload): Promise<AxiosResponse<{ message: string; previousBalance: number; newBalance: number }>> => {
    try {
      const response = await api.put<{ message: string; previousBalance: number; newBalance: number }>(
        `/leave/credits/${employeeId}`,
        data
      );
      return response;
    } catch (error) {
      throw error;
    }
  },

  /** @deprecated Use deleteCredit instead */
  deleteEmployeeCredit: async (employeeId: string, creditType: string, year?: number): Promise<AxiosResponse<{ message: string }>> => {
    try {
      const response = await api.delete<{ message: string }>(`/leave/credits/${employeeId}`, {
        params: { creditType, year },
      });
      return response;
    } catch (error) {
      throw error;
    }
  },
};

export default leaveApi;
