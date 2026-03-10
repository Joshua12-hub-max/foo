import { useQuery } from '@tanstack/react-query';
import axios, { AxiosError } from 'axios';

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
        const response = await axios.get<BarangaysResponse>('http://localhost:5000/api/common/barangays');
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
        const response = await axios.get<DepartmentsResponse>('http://localhost:5000/api/departments/public');
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
        const response = await axios.get<PositionsResponse>('http://localhost:5000/api/plantilla/public');
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
        const response = await axios.get<NextIdResponse>('http://localhost:5000/api/auth/next-id');
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
import { HiredApplicant } from '../types/recruitment_applicant';

export const useHiredApplicantSearch = (firstName: string, lastName: string, enabled: boolean) => {
  return useQuery({
    queryKey: ['hired-applicant', firstName, lastName],
    queryFn: async (): Promise<HiredApplicant | null> => {
      try {
        const response = await axios.get(`http://localhost:5000/api/auth/hired-applicant-search`, {
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
        const response = await axios.get('http://localhost:5000/api/common/employment-metadata');
        return response.data.data as { appointmentTypes: string[], dutyTypes: string[], roles: string[] };
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
