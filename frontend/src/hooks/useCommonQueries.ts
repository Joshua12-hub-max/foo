import { useQuery } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import api from '@/api/axios';

export interface Barangay {
  id: number;
  name: string;
  zipCode: string;
}

export interface Department {
  id: number;
  name: string;
}

export interface Position {
  id: number;
  positionTitle: string;
  itemNumber: string;
  department: string;
  departmentId: number;
}

export interface BarangaysResponse {
  success: boolean;
  data: Barangay[];
}

export interface DepartmentsResponse {
  success: boolean;
  departments: Department[];
}

export interface PositionsResponse {
  success: boolean;
  positions: Position[];
}

export interface NextIdResponse {
  success: boolean;
  data: string;
}

export const useBarangaysQuery = () => {
  return useQuery({
    queryKey: ['barangays'],
    queryFn: async (): Promise<Barangay[]> => {
      try {
        const response = await api.get<BarangaysResponse>('/common/barangays');
        return response.data.data;
      } catch (error) {
        if (error instanceof AxiosError) {
          throw new Error(error.response?.data?.message || 'Failed to fetch barangays');
        }
        throw new Error('An unexpected error occurred while fetching barangays');
      }
    },
    staleTime: 1000 * 60 * 60, // 1 hour
  });
};

export const useDepartmentsQuery = () => {
  return useQuery({
    queryKey: ['departments', 'public'],
    queryFn: async (): Promise<Department[]> => {
      try {
        const response = await api.get<DepartmentsResponse>('/departments/public');
        return response.data.departments;
      } catch (error) {
        if (error instanceof AxiosError) {
          throw new Error(error.response?.data?.message || 'Failed to fetch departments');
        }
        throw new Error('An unexpected error occurred while fetching departments');
      }
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

export const usePositionsQuery = () => {
  return useQuery({
    queryKey: ['positions', 'public'],
    queryFn: async (): Promise<Position[]> => {
      try {
        const response = await api.get<PositionsResponse>('/plantilla/public');
        return response.data.positions;
      } catch (error) {
        if (error instanceof AxiosError) {
          throw new Error(error.response?.data?.message || 'Failed to fetch positions');
        }
        throw new Error('An unexpected error occurred while fetching positions');
      }
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

export const useNextEmployeeIdQuery = () => {
  return useQuery({
    queryKey: ['nextEmployeeId'],
    queryFn: async (): Promise<string> => {
      try {
        const response = await api.get<NextIdResponse>('/auth/next-id');
        return response.data.data || "1";
      } catch (error) {
        if (error instanceof AxiosError) {
          throw new Error(error.response?.data?.message || 'Failed to fetch next employee ID');
        }
        throw new Error('An unexpected error occurred while fetching next employee ID');
      }
    },
    staleTime: 0, // Always fetch fresh
  });
};

export const useEmailUniquenessQuery = (email: string, enabled: boolean) => {
  return useQuery({
    queryKey: ['email-uniqueness', email],
    queryFn: async (): Promise<{ isUnique: boolean; message: string }> => {
      try {
        const response = await api.get(`/auth/check-email`, {
          params: { email }
        });
        return { isUnique: true, message: response.data.message };
      } catch (error) {
        if (error instanceof AxiosError && error.response?.status === 409) {
          return { isUnique: false, message: 'Email already exists.' };
        }
        return { isUnique: true, message: '' };
      }
    },
    enabled: enabled && !!email && email.includes('@'),
    retry: false,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

export interface GovtIdUniquenessParams {
  umidNumber?: string;
  tinNumber?: string;
  philhealthNumber?: string;
  pagibigNumber?: string;
  gsisNumber?: string;
  philsysId?: string;
  agencyEmployeeNo?: string;
  eligibilityNumber?: string;
  licenseNo?: string;
  govtIdNo?: string;
  excludeAuthId?: number;
  excludeApplicantId?: number;
}

export const useGovtIdUniquenessQuery = (params: GovtIdUniquenessParams, enabled: boolean) => {
  // Use a stable query key based on provided parameters
  const queryKey = ['govt-id-uniqueness', ...Object.values(params).filter(Boolean)];

  return useQuery({
    queryKey,
    queryFn: async (): Promise<{ 
      isUnique: boolean; 
      message: string; 
      conflicts?: Record<string, string>;
      errors?: string[];
    }> => {
      try {
        const hasValues = Object.values(params).some(v => v && String(v).length > 2);
        if (!hasValues) return { isUnique: true, message: '' };

        const response = await api.get(`/auth/check-govt-id`, {
          params
        });
        return { isUnique: true, message: response.data.message };
      } catch (error) {
        if (error instanceof AxiosError && error.response?.status === 409) {
          return { 
            isUnique: false, 
            message: error.response.data.message || 'ID already exists.',
            conflicts: error.response.data.conflicts,
            errors: error.response.data.errors
          };
        }
        return { isUnique: true, message: '' };
      }
    },
    enabled: enabled && Object.values(params).some(v => v && String(v).length > 2),
    retry: false,
    staleTime: 1000 * 60 * 5,
  });
};


import { HiredApplicant } from '../types/recruitment_applicant';

export const useHiredApplicantSearch = (firstName: string, lastName: string, enabled: boolean) => {
  return useQuery({
    queryKey: ['hired-applicant', firstName, lastName],
    queryFn: async (): Promise<HiredApplicant | null> => {
      try {
        const response = await api.get(`/auth/hired-applicant-search`, {
          params: { firstName, lastName }
        });
        return response.data.data;
      } catch (error) {
        if (error instanceof AxiosError && error.response?.status === 404) {
          return null; // Return null if not found
        }
        if (error instanceof AxiosError) {
          throw new Error(error.response?.data?.message || 'Failed to search for applicant');
        }
        throw new Error('An unexpected error occurred');
      }
    },
    enabled: enabled && firstName.length > 2 && lastName.length > 2,
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: false
  });
};
export const useEmploymentMetadataQuery = () => {
  return useQuery({
    queryKey: ['employmentMetadata'],
    queryFn: async () => {
      try {
        const response = await api.get('/common/employment-metadata');
        return response.data.data as { 
          appointmentTypes: string[], 
          dutyTypes: string[], 
          roles: string[],
          pdsCivilStatus: string[],
          pdsBloodTypes: string[],
          pdsCitizenship: string[],
          pdsAppointmentStatus: string[],
          pdsLdTypes: string[],
          pdsGovtIdTypes: string[],
          employmentStatus: string[],
          pdsEligibilityTypes: { value: string, label: string }[],
          pdsGender: string[],
          pdsRelationshipTypes: string[]
        };
      } catch (error) {
        if (error instanceof AxiosError) {
          throw new Error(error.response?.data?.message || 'Failed to fetch employment metadata');
        }
        throw new Error('An unexpected error occurred');
      }
    },
    staleTime: 1000 * 60 * 60, // 1 hour
  });
};
