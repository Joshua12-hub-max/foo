/**
 * React Query v5 Hooks for Leave System
 * CSC-Compliant Leave Request Management
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { leaveApi } from '@/api/leaveApi';
import type {
  LeaveListParams,
  CreditListParams,
  LedgerParams,
  RejectLeavePayload,
  CreditUpdatePayload,
  AccrueCreditsPayload,
  AddHolidayPayload,
} from '@/types/leave.types';

// ============================================================================
// Query Keys
// ============================================================================

export const leaveKeys = {
  all: ['leave'] as const,
  applications: () => [...leaveKeys.all, 'applications'] as const,
  myApplications: (params?: LeaveListParams) => [...leaveKeys.applications(), 'my', params] as const,
  allApplications: (params?: LeaveListParams) => [...leaveKeys.applications(), 'all', params] as const,
  credits: () => [...leaveKeys.all, 'credits'] as const,
  myCredits: (year?: number) => [...leaveKeys.credits(), 'my', year] as const,
  employeeCredits: (employeeId: string, year?: number) => [...leaveKeys.credits(), employeeId, year] as const,
  allCredits: (params?: CreditListParams) => [...leaveKeys.credits(), 'all', params] as const,
  ledger: () => [...leaveKeys.all, 'ledger'] as const,
  myLedger: (params?: LedgerParams) => [...leaveKeys.ledger(), 'my', params] as const,
  employeeLedger: (employeeId: string, params?: LedgerParams) => [...leaveKeys.ledger(), employeeId, params] as const,
  holidays: (year?: number) => [...leaveKeys.all, 'holidays', year] as const,
  lwopSummary: (employeeId: string) => [...leaveKeys.all, 'lwop', employeeId] as const,
};

// ============================================================================
// Application Queries
// ============================================================================

/**
 * Get employee's own leave applications
 */
export function useMyApplications(params?: LeaveListParams) {
  return useQuery({
    queryKey: leaveKeys.myApplications(params),
    queryFn: async () => {
      const response = await leaveApi.getMyApplications(params);
      return response.data;
    },
  });
}

/**
 * Get all leave applications (admin)
 */
export function useAllApplications(params?: LeaveListParams) {
  return useQuery({
    queryKey: leaveKeys.allApplications(params),
    queryFn: async () => {
      const response = await leaveApi.getAllApplications(params);
      return response.data;
    },
  });
}

// ============================================================================
// Application Mutations
// ============================================================================

/**
 * Apply for leave
 */
export function useApplyLeave() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: FormData) => {
      const response = await leaveApi.applyLeave(data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: leaveKeys.applications() });
      queryClient.invalidateQueries({ queryKey: leaveKeys.credits() });
    },
  });
}

/**
 * Process leave (admin)
 */
export function useProcessLeave() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, formData }: { id: number; formData: FormData }) => {
      const response = await leaveApi.processLeave(id, formData);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: leaveKeys.applications() });
    },
  });
}

/**
 * Finalize leave (employee)
 */
export function useFinalizeLeave() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, formData }: { id: number; formData: FormData }) => {
      const response = await leaveApi.finalizeLeave(id, formData);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: leaveKeys.applications() });
    },
  });
}

/**
 * Approve leave (admin)
 */
export function useApproveLeave() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const response = await leaveApi.approveLeave(id);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: leaveKeys.applications() });
      queryClient.invalidateQueries({ queryKey: leaveKeys.credits() });
      queryClient.invalidateQueries({ queryKey: leaveKeys.ledger() });
    },
  });
}

/**
 * Reject leave (admin)
 */
export function useRejectLeave() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: RejectLeavePayload }) => {
      const response = await leaveApi.rejectLeave(id, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: leaveKeys.applications() });
    },
  });
}

// ============================================================================
// Credits Queries
// ============================================================================

/**
 * Get employee's own credits
 */
export function useMyCredits(year?: number) {
  return useQuery({
    queryKey: leaveKeys.myCredits(year),
    queryFn: async () => {
      const response = await leaveApi.getMyCredits(year);
      return response.data;
    },
  });
}

/**
 * Get specific employee's credits (admin)
 */
export function useEmployeeCredits(employeeId: string, year?: number) {
  return useQuery({
    queryKey: leaveKeys.employeeCredits(employeeId, year),
    queryFn: async () => {
      const response = await leaveApi.getEmployeeCredits(employeeId, year);
      return response.data;
    },
    enabled: !!employeeId,
  });
}

/**
 * Get all employee credits (admin)
 */
export function useAllCredits(params?: CreditListParams) {
  return useQuery({
    queryKey: leaveKeys.allCredits(params),
    queryFn: async () => {
      const response = await leaveApi.getAllCredits(params);
      return response.data;
    },
  });
}

// ============================================================================
// Credits Mutations
// ============================================================================

/**
 * Update employee credit (admin)
 */
export function useUpdateCredit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ employeeId, data }: { employeeId: string; data: CreditUpdatePayload }) => {
      const response = await leaveApi.updateCredit(employeeId, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: leaveKeys.credits() });
      queryClient.invalidateQueries({ queryKey: leaveKeys.ledger() });
    },
  });
}

/**
 * Delete employee credit (admin)
 */
export function useDeleteCredit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ employeeId, creditType, year }: { employeeId: string; creditType: string; year?: number }) => {
      const response = await leaveApi.deleteCredit(employeeId, creditType, year);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: leaveKeys.credits() });
    },
  });
}

/**
 * Accrue monthly credits (admin)
 */
export function useAccrueCredits() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: AccrueCreditsPayload) => {
      const response = await leaveApi.accrueMonthlyCredits(data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: leaveKeys.credits() });
      queryClient.invalidateQueries({ queryKey: leaveKeys.ledger() });
    },
  });
}

// ============================================================================
// Ledger Queries
// ============================================================================

/**
 * Get employee's own ledger
 */
export function useMyLedger(params?: LedgerParams) {
  return useQuery({
    queryKey: leaveKeys.myLedger(params),
    queryFn: async () => {
      const response = await leaveApi.getMyLedger(params);
      return response.data;
    },
  });
}

/**
 * Get specific employee's ledger (admin)
 */
export function useEmployeeLedger(employeeId: string, params?: LedgerParams) {
  return useQuery({
    queryKey: leaveKeys.employeeLedger(employeeId, params),
    queryFn: async () => {
      const response = await leaveApi.getEmployeeLedger(employeeId, params);
      return response.data;
    },
    enabled: !!employeeId,
  });
}

// ============================================================================
// Holidays Queries & Mutations
// ============================================================================

/**
 * Get holidays for a year
 */
export function useHolidays(year?: number) {
  return useQuery({
    queryKey: leaveKeys.holidays(year),
    queryFn: async () => {
      const response = await leaveApi.getHolidays(year);
      return response.data;
    },
  });
}

/**
 * Add a holiday (admin)
 */
export function useAddHoliday() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: AddHolidayPayload) => {
      const response = await leaveApi.addHoliday(data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: leaveKeys.holidays() });
    },
  });
}

/**
 * Delete a holiday (admin)
 */
export function useDeleteHoliday() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const response = await leaveApi.deleteHoliday(id);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: leaveKeys.holidays() });
    },
  });
}

// ============================================================================
// LWOP Summary Query
// ============================================================================

/**
 * Get LWOP summary for employee (admin)
 */
export function useLWOPSummary(employeeId: string) {
  return useQuery({
    queryKey: leaveKeys.lwopSummary(employeeId),
    queryFn: async () => {
      const response = await leaveApi.getLWOPSummary(employeeId);
      return response.data;
    },
    enabled: !!employeeId,
  });
}

// ============================================================================
// Service Record & Tardiness (Phase 6)
// ============================================================================

/**
 * Get employee's service record (career history)
 */
export function useServiceRecord(employeeId: string) {
  return useQuery({
    queryKey: [...leaveKeys.all, 'service-record', employeeId] as const,
    queryFn: async () => {
      const response = await leaveApi.getServiceRecord(employeeId);
      return response.data;
    },
    enabled: !!employeeId,
  });
}

/**
 * Get total LWOP for retirement calculation
 */
export function useTotalLWOPForRetirement(employeeId: string) {
  return useQuery({
    queryKey: [...leaveKeys.all, 'retirement-lwop', employeeId] as const,
    queryFn: async () => {
      const response = await leaveApi.getTotalLWOPForRetirement(employeeId);
      return response.data;
    },
    enabled: !!employeeId,
  });
}

/**
 * Process monthly tardiness (admin)
 */
export function useProcessTardiness() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { month?: number; year?: number; employeeIds?: string[] }) => {
      const response = await leaveApi.processMonthlyTardiness(data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: leaveKeys.credits() });
      queryClient.invalidateQueries({ queryKey: leaveKeys.ledger() });
    },
  });
}
