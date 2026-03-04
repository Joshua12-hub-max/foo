import { useQuery } from '@tanstack/react-query';
import api from '../api/axios';

// Interface matching the seeded JSON structure
export interface LeavePolicyContent {
  types: string[];
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
  types: ['Vacation Leave', 'Sick Leave'],
  annualLimits: {},
  advanceFilingDays: { days: 5, appliesTo: ['Vacation Leave'] },
  sickLeaveWindow: { maxDaysAfterReturn: 3 },
  crossChargeMap: { 'Sick Leave': 'Vacation Leave' },
  leaveToCreditMap: { 'Vacation Leave': 'Vacation Leave', 'Sick Leave': 'Sick Leave' },
  specialLeavesNoDeduction: [],
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
      const { data } = await api.get('/policies?category=leave');
      
      if (!data.policies || data.policies.length === 0) {
        return DEFAULT_POLICY;
      }

      const policy = data.policies[0];
      
      try {
        const content: LeavePolicyContent = typeof policy.content === 'string' 
          ? JSON.parse(policy.content) 
          : policy.content;
          
        return {
          ...DEFAULT_POLICY,
          ...content
        };
      } catch (e) {
        console.error("Failed to parse leave policy content:", e);
        return DEFAULT_POLICY;
      }
    },
    staleTime: 1000 * 60 * 60, // Cache for 1 hour
  });
};
