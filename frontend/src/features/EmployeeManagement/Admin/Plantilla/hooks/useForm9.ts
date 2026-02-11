import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect } from 'react';
import { reportsApi } from '@/api/reportsApi';
import { plantillaApi, Position } from '@/api/plantillaApi';
import { useForm9Store } from '@/stores/form9Store';
import { Form9VacantPosition } from '@/schemas/compliance';
import toast from 'react-hot-toast';

interface Form9ApiResponse {
  success: boolean;
  data: Array<{
    item_number: string;
    position_title: string;
    salary_grade: number;
    monthly_salary: string;
    education: string | null;
    training: number | null;
    experience: number | null;
    eligibility: string | null;
    competency: string | null;
    assignment: string | null;
  }>;
  meta: {
    form_name: string;
    title: string;
    heading: string;
  };
}

/**
 * Custom hook for Form 9 - Request for Publication of Vacant Positions
 * Uses React Query for data fetching and Zustand for state management
 */
export const useForm9 = () => {
  const queryClient = useQueryClient();
  const store = useForm9Store();

  // Fetch vacant positions from plantilla API
  const vacantPositionsQuery = useQuery({
    queryKey: ['form9-vacant-positions'],
    queryFn: async () => {
      try {
        const response = await plantillaApi.getPositions({ is_vacant: true });
        return response.data?.positions || [];
      } catch (error) {
        console.error('Failed to fetch vacant positions:', error);
        throw error;
      }
    },
    enabled: store.isOpen, // Only fetch when modal is open
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Fetch Form 9 data from reports API (with qualification standards)
  const form9DataQuery = useQuery({
    queryKey: ['form9-report-data'],
    queryFn: async () => {
      try {
        const response = await reportsApi.getReportData('form9', {});
        return response as Form9ApiResponse;
      } catch (error) {
        console.error('Failed to fetch Form 9 data:', error);
        throw error;
      }
    },
    enabled: store.isOpen,
    staleTime: 1000 * 60 * 5,
  });

  // Transform API data to Form9VacantPosition format
  const transformPositionsToForm9 = useCallback((positions: Position[]): Form9VacantPosition[] => {
    return positions.map((pos, index) => ({
      no: index + 1,
      positionTitle: pos.position_title || '',
      plantillaItemNo: pos.item_number || '',
      salaryGrade: pos.salary_grade?.toString() || '',
      monthlySalary: pos.monthly_salary
        ? parseFloat(pos.monthly_salary.toString()).toLocaleString('en-PH', { minimumFractionDigits: 2 })
        : '',
      education: '',
      training: 'None required',
      experience: 'None required',
      eligibility: 'Career Service (Subprofessional) First Level Eligibility',
      competency: '',
      placeOfAssignment: pos.department || ''
    }));
  }, []);

  // Auto-populate positions when data is loaded
  useEffect(() => {
    if (vacantPositionsQuery.data && store.positions.length === 0) {
      const transformedPositions = transformPositionsToForm9(vacantPositionsQuery.data);
      
      // If we have Form 9 report data with qualification standards, merge it
      if (form9DataQuery.data?.data) {
        const reportData = form9DataQuery.data.data;
        const mergedPositions = transformedPositions.map(pos => {
          const matchingReport = reportData.find(
            r => r.item_number === pos.plantillaItemNo
          );
          if (matchingReport) {
            return {
              ...pos,
              education: matchingReport.education || pos.education,
              training: matchingReport.training 
                ? `${matchingReport.training} hours` 
                : pos.training,
              experience: matchingReport.experience 
                ? `${matchingReport.experience} years` 
                : pos.experience,
              eligibility: matchingReport.eligibility || pos.eligibility,
              competency: matchingReport.competency || pos.competency,
              placeOfAssignment: matchingReport.assignment || pos.placeOfAssignment
            };
          }
          return pos;
        });
        store.setPositions(mergedPositions);
      } else {
        store.setPositions(transformedPositions);
      }
    }
  }, [vacantPositionsQuery.data, form9DataQuery.data, store.positions.length, transformPositionsToForm9]);

  // Refresh data
  const refetch = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['form9-vacant-positions'] });
    queryClient.invalidateQueries({ queryKey: ['form9-report-data'] });
  }, [queryClient]);

  // Open modal and reset/fetch fresh data
  const openForm9Modal = useCallback(() => {
    store.resetForm();
    store.openModal();
    refetch();
  }, [store, refetch]);

  // Close modal
  const closeForm9Modal = useCallback(() => {
    store.closeModal();
  }, [store]);

  return {
    // Store state
    isOpen: store.isOpen,
    header: store.header,
    positions: store.positions,

    // Store actions
    setHeader: store.setHeader,
    setPositions: store.setPositions,
    addPosition: store.addPosition,
    updatePosition: store.updatePosition,
    removePosition: store.removePosition,

    // Query state
    isLoading: vacantPositionsQuery.isLoading || form9DataQuery.isLoading,
    error: vacantPositionsQuery.error || form9DataQuery.error,
    
    // Actions
    openForm9Modal,
    closeForm9Modal,
    refetch
  };
};
