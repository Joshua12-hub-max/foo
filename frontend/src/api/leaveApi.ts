import api from './axios';
import type { AxiosResponse } from 'axios';
import type {
  LeaveApplicationsResponse,
  LeaveCreditsResponse,
  LedgerResponse,
  HolidaysResponse,
  ApplyLeaveResponse,
  ApplyLeavePayload,
  LeaveListParams,
  CreditListParams,
  LedgerParams,
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
  applyLeave: async (data: ApplyLeavePayload): Promise<AxiosResponse<ApplyLeaveResponse>> => {
    return await api.post<ApplyLeaveResponse>('/leave/apply', data);
  },

  /**
   * Get employee's own leave applications
   */
  getMyApplications: async (params?: LeaveListParams): Promise<AxiosResponse<LeaveApplicationsResponse>> => {
    return await api.get<LeaveApplicationsResponse>('/leave/my-applications', { params });
  },

  /**
   * Get all leave applications (admin)
   */
  getAllApplications: async (params?: LeaveListParams): Promise<AxiosResponse<LeaveApplicationsResponse>> => {
    return await api.get<LeaveApplicationsResponse>('/leave/applications/all', { params });
  },

  /**
   * Process leave - admin marks as processing
   */
  processLeave: async (id: number, data: FormData): Promise<AxiosResponse<{ message: string }>> => {
    return await api.put<{ message: string }>(`/leave/${id}/process`, data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  /**
   * Finalize leave - employee marks as finalized
   */
  finalizeLeave: async (id: number, data?: FormData): Promise<AxiosResponse<{ message: string }>> => {
    return await api.put<{ message: string }>(`/leave/${id}/finalize`, data, {
      headers: data ? { 'Content-Type': 'multipart/form-data' } : undefined,
    });
  },

  /**
   * Approve leave application (admin)
   */
  approveLeave: async (id: number): Promise<AxiosResponse<{ message: string }>> => {
    return await api.put<{ message: string }>(`/leave/${id}/approve`);
  },

  /**
   * Reject leave application (admin)
   */
  rejectLeave: async (id: number, data: RejectLeavePayload): Promise<AxiosResponse<{ message: string }>> => {
    return await api.put<{ message: string }>(`/leave/${id}/reject`, data);
  },

  // ============================================================================
  // Credits API
  // ============================================================================

  /**
   * Get employee's own credits
   */
  getMyCredits: async (year?: number): Promise<AxiosResponse<LeaveCreditsResponse>> => {
    return await api.get<LeaveCreditsResponse>('/leave/my-credits', {
      params: year ? { year } : undefined,
    });
  },

  /**
   * Get specific employee's credits (admin)
   */
  getEmployeeCredits: async (employeeId: string, year?: number): Promise<AxiosResponse<LeaveCreditsResponse>> => {
    return await api.get<LeaveCreditsResponse>(`/leave/credits/${employeeId}`, {
      params: year ? { year } : undefined,
    });
  },

  /**
   * Get all employee credits (admin)
   */
  getAllCredits: async (params?: CreditListParams): Promise<AxiosResponse<LeaveCreditsResponse>> => {
    return await api.get<LeaveCreditsResponse>('/leave/credits/all', { params });
  },

  /**
   * Update employee credit (admin)
   */
  updateCredit: async (employeeId: string, data: CreditUpdatePayload): Promise<AxiosResponse<{ message: string; previousBalance: number; newBalance: number }>> => {
    return await api.put<{ message: string; previousBalance: number; newBalance: number }>(
      `/leave/credits/${employeeId}`,
      data
    );
  },

  /**
   * Delete employee credit (admin)
   */
  deleteCredit: async (employeeId: string, creditType: string, year?: number): Promise<AxiosResponse<{ message: string }>> => {
    return await api.delete<{ message: string }>(`/leave/credits/${employeeId}`, {
      params: { creditType, year },
    });
  },

  /**
   * Accrue monthly credits (admin)
   */
  accrueMonthlyCredits: async (data: AccrueCreditsPayload): Promise<AxiosResponse<{ message: string; month: number; year: number; vlAccrued: number; slAccrued: number }>> => {
    return await api.post('/leave/accrue-monthly', data);
  },

  // ============================================================================
  // Ledger API
  // ============================================================================

  /**
   * Get employee's own ledger
   */
  getMyLedger: async (params?: LedgerParams): Promise<AxiosResponse<LedgerResponse>> => {
    return await api.get<LedgerResponse>('/leave/my-ledger', { params });
  },

  /**
   * Get specific employee's ledger (admin)
   */
  getEmployeeLedger: async (employeeId: string, params?: LedgerParams): Promise<AxiosResponse<LedgerResponse>> => {
    return await api.get<LedgerResponse>(`/leave/ledger/${employeeId}`, { params });
  },

  // ============================================================================
  // Holidays API
  // ============================================================================

  /**
   * Get holidays for a year
   */
  getHolidays: async (year?: number): Promise<AxiosResponse<HolidaysResponse>> => {
    return await api.get<HolidaysResponse>('/leave/holidays', {
      params: year ? { year } : undefined,
    });
  },

  /**
   * Add a holiday (admin)
   */
  addHoliday: async (data: AddHolidayPayload): Promise<AxiosResponse<{ message: string }>> => {
    return await api.post<{ message: string }>('/leave/holidays', data);
  },

  /**
   * Delete a holiday (admin)
   */
  deleteHoliday: async (id: number): Promise<AxiosResponse<{ message: string }>> => {
    return await api.delete<{ message: string }>(`/leave/holidays/${id}`);
  },

  // ============================================================================
  // LWOP Summary API
  // ============================================================================

  /**
   * Get LWOP summary for employee (admin)
   */
  getLWOPSummary: async (employeeId: string): Promise<AxiosResponse<{ summary: LWOPSummary[] }>> => {
    return await api.get<{ summary: LWOPSummary[] }>(`/leave/lwop-summary/${employeeId}`);
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
      employeeId: string;
      eventType: string;
      eventDate: string;
      endDate: string | null;
      leaveType: string | null;
      daysCount: number;
      isWithPay: boolean;
      remarks: string;
      referenceId: number | null;
      referenceType: string | null;
      processedBy: string;
      createdAt: string;
    }>;
    totalLWOPDays: number;
  }>> => {
    return await api.get(`/leave/service-record/${employeeId}`);
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
    return await api.get(`/leave/service-record/${employeeId}/lwop-total`);
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
    return await api.post('/leave/process-tardiness', data);
  },

  // ============================================================================
  // Legacy Routes (backward compatibility)
  // ============================================================================

  /** @deprecated Use getMyApplications instead */
  getMyLeaves: async (params?: LeaveListParams): Promise<AxiosResponse<LeaveApplicationsResponse>> => {
    return await api.get<LeaveApplicationsResponse>('/leave/my-leaves', { params });
  },

  /** @deprecated Use getAllApplications instead */
  getAllLeaves: async (params?: LeaveListParams): Promise<AxiosResponse<LeaveApplicationsResponse>> => {
    return await api.get<LeaveApplicationsResponse>('/leave/all', { params });
  },

  /** @deprecated Use updateCredit instead */
  updateEmployeeCredit: async (employeeId: string, data: CreditUpdatePayload): Promise<AxiosResponse<{ message: string; previousBalance: number; newBalance: number }>> => {
    return await api.put<{ message: string; previousBalance: number; newBalance: number }>(
      `/leave/credits/${employeeId}`,
      data
    );
  },

  /** @deprecated Use deleteCredit instead */
  deleteEmployeeCredit: async (employeeId: string, creditType: string, year?: number): Promise<AxiosResponse<{ message: string }>> => {
    return await api.delete<{ message: string }>(`/leave/credits/${employeeId}`, {
      params: { creditType, year },
    });
  },
};

export default leaveApi;
