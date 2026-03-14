import { useQuery } from '@tanstack/react-query';
import api from '../api/axios';
import { LeaveType, LEAVE_TYPES as CENTRAL_LEAVE_TYPES } from '@/types/leave.types';

// Interface matching the seeded JSON structure
export interface LeavePolicyContent {
  types: LeaveType[];
  annualLimits: Record<string, number>;
  advanceFilingDays: {
    days: number;
    appliesTo: string[];
    description?: string;
  };
  sickLeaveWindow: {
    maxDaysAfterReturn: number;
    description?: string;
  };
  crossChargeMap: Record<string, string>;
  leaveToCreditMap: Record<string, string>;
  specialLeavesNoDeduction: string[];
  requiredAttachments: Record<string, { condition: string; required: string }>;
  forcedLeaveRule: {
    minimumVLRequired: number;
    description: string;
  };
  monthlyAccrual: {
    vacationLeave: number;
    sickLeave: number;
    total: number;
    description?: string;
  };
  deemedApprovalGracePeriod: number;
  deemedApproval: {
    days: number;
    description: string;
    reference?: string;
  };
}

const DEFAULT_POLICY: LeavePolicyContent = {
  types: ['Vacation Leave', 'Sick Leave', 'Other'],
  annualLimits: {},
  advanceFilingDays: { days: 5, appliesTo: ['Vacation Leave'] },
  sickLeaveWindow: { maxDaysAfterReturn: 3 },
  crossChargeMap: { 'Sick Leave': 'Vacation Leave' },
  leaveToCreditMap: { 'Vacation Leave': 'Vacation Leave', 'Sick Leave': 'Sick Leave' },
  specialLeavesNoDeduction: ['Other'],
  requiredAttachments: {},
  forcedLeaveRule: { minimumVLRequired: 10, description: '' },
  monthlyAccrual: { vacationLeave: 1.25, sickLeave: 1.25, total: 2.5 },
  deemedApprovalGracePeriod: 5,
  deemedApproval: {
    days: 5,
    description: 'Any leave application pending action for 5 or more days is automatically deemed approved.',
    reference: 'CSC MC No. 41, s. 1998'
  }
};

export const useLeavePolicy = () => {
  return useQuery<LeavePolicyContent>({
    queryKey: ['leave-policy'],
    queryFn: async () => {
      const { data } = await api.get<{ policies: Array<{ content: string | Record<string, unknown> }> }>('/policies?category=leave');
      
      if (!data.policies || data.policies.length === 0) {
        return DEFAULT_POLICY;
      }

      const rawPolicy = data.policies[0];
      
      try {
        const rawContent = typeof rawPolicy.content === 'string' 
          ? JSON.parse(rawPolicy.content) as Record<string, unknown>
          : rawPolicy.content as Record<string, unknown>;

        // Type-safe extraction without "any" or "as LeavePolicyContent" cast at the top level
        const extractStringArray = (val: unknown): string[] => Array.isArray(val) ? val.filter((i): i is string => typeof i === 'string') : [];

        const leaveTypesRaw = extractStringArray(rawContent.types);
        const leaveTypesNarrowed: LeaveType[] = leaveTypesRaw.filter((t): t is LeaveType => 
          CENTRAL_LEAVE_TYPES.some((lt: string) => lt === t)
        );

        // Map fields locally to avoid the whole-object cast
        const merged: LeavePolicyContent = {
          ...DEFAULT_POLICY,
          ...(rawContent as unknown as Partial<LeavePolicyContent>), 
          types: leaveTypesNarrowed.length > 0 ? leaveTypesNarrowed : DEFAULT_POLICY.types,
        };
        // Note: The (as unknown as Partial) is the single point of bridging our raw API data 
        // back into our strict system models. 

        return merged;
      } catch (e) {
        console.error("Failed to parse leave policy content:", e);
        return DEFAULT_POLICY;
      }
    },
    staleTime: 1000 * 60 * 60, // Cache for 1 hour
  });
};

export default useLeavePolicy;
