import { useState, useMemo, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { plantillaApi, type Position } from '@/api/plantillaApi';
import { fetchEmployeeOptions } from '@/api/employeeApi';
import { INITIAL_SUMMARY, PlantillaSummary } from '../constants/plantillaConstants';
import { PlantillaSchema } from '@/schemas/plantilla';

export type { Position };

interface ApiErrorResponse {
  message?: string;
}

export interface Employee {
  id: number;
  employee_id: string;
  first_name: string;
  last_name: string;
}

export interface HistoryRecord {
  id: number;
  employee_name: string;
  start_date: string;
  end_date?: string;
  reason?: string;
}

export interface UsePlantillaOptions {
  showNotification?: (message: string, type?: string) => void;
}

export interface UsePlantillaReturn {
  positions: Position[];
  loading: boolean;
  error: string | null;
  departments: { id: number; name: string }[];
  summary: PlantillaSummary;
  selectedDept: string;
  setSelectedDept: React.Dispatch<React.SetStateAction<string>>;
  searchTerm: string;
  setSearchTerm: React.Dispatch<React.SetStateAction<string>>;
  isModalOpen: boolean;
  setIsModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  modalMode: 'create' | 'edit';
  setModalMode: React.Dispatch<React.SetStateAction<'create' | 'edit'>>;
  currentPosition: Position | null;
  setCurrentPosition: React.Dispatch<React.SetStateAction<Position | null>>;
  isAssignModalOpen: boolean;
  setIsAssignModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  availableEmployees: Employee[];
  selectedEmployee: string;
  setSelectedEmployee: React.Dispatch<React.SetStateAction<string>>;
  isHistoryModalOpen: boolean;
  setIsHistoryModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  positionHistory: HistoryRecord[];
  isVacateModalOpen: boolean;
  setIsVacateModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isAppointmentModalOpen: boolean;
  setIsAppointmentModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  vacateReason: string;
  setVacateReason: React.Dispatch<React.SetStateAction<string>>;
  filteredPositions: Position[];
  handleDelete: (id: number) => Promise<void>;
  handleCreateOrUpdate: (data: PlantillaSchema) => Promise<void>;
  handleAssign: () => Promise<void>;
  handleVacate: () => Promise<void>;
  fetchHistory: (position: Position) => Promise<void>;
  openAssignModal: (position: Position) => Promise<void>;
  openAppointmentModal: (position: Position) => void;
  refetch: () => void;
}

/**
 * Custom hook for Plantilla management
 * @param options - Hook options
 * @param options.showNotification - Optional callback for notifications (message, type)
 */
export const usePlantilla = ({ showNotification }: UsePlantillaOptions = {}): UsePlantillaReturn => {
    // Notification helper - falls back to console if no callback provided
    const notify = (message: string, type = 'success') => {
        if (showNotification) {
            showNotification(message, type);
        } else {
            if (type === 'error') {
                console.error('[Plantilla]', message);
            } else {
                console.log('[Plantilla]', message);
            }
        }
    };

    // Filter state
    const [selectedDept, setSelectedDept] = useState('All');
    const [searchTerm, setSearchTerm] = useState('');
  
    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
    const [currentPosition, setCurrentPosition] = useState<Position | null>(null);
    
    // Assign modal state
    const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
    const [availableEmployees, setAvailableEmployees] = useState<Employee[]>([]);
  
    // History modal state
    const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
    const [positionHistory, setPositionHistory] = useState<HistoryRecord[]>([]);
  
    // Vacate modal state
    const [isVacateModalOpen, setIsVacateModalOpen] = useState(false);
    const [vacateReason, setVacateReason] = useState('');
    const [selectedEmployee, setSelectedEmployee] = useState('');
    // Appointment modal state
    const [isAppointmentModalOpen, setIsAppointmentModalOpen] = useState(false);
    const { data: positionsData, isLoading: positionsLoading, error: positionsError, refetch: refetchPositions } = useQuery({
        queryKey: ['plantilla', selectedDept],
        queryFn: async () => {
            const response = await plantillaApi.getPositions({ 
                department_id: selectedDept !== 'All' ? Number(selectedDept) : undefined
            });
            return response.data.positions;
        },
        staleTime: 0,
    });

    const { data: summaryData, refetch: refetchSummary } = useQuery({
        queryKey: ['plantilla-summary'],
        queryFn: async () => {
            try {
                const response = await plantillaApi.getSummary();
                return response.data.summary;
            } catch (error) {
                console.error('Failed to fetch summary:', error);
                return INITIAL_SUMMARY;
            }
        },
        staleTime: 0,
        refetchOnMount: true,
        refetchOnWindowFocus: true
    });

    const { data: departmentsData } = useQuery({
        queryKey: ['departments-options'],
        queryFn: async () => {
            const response = await fetchEmployeeOptions();
            // Ensure response structure is handled correctly
            return (response.departments || []) as { id: number; name: string }[];
        },
    });
    
    // Actions
    const handleDelete = useCallback(async (id: number) => {
        if (!window.confirm("Are you sure you want to delete this position?")) return;
        try {
          await plantillaApi.deletePosition(id);
          refetchPositions();
          refetchSummary();
          notify("Position deleted successfully");
        } catch (err) {
          const axiosErr = err as AxiosError<ApiErrorResponse>;
          notify(axiosErr.response?.data?.message || "Failed to delete position", "error");
        }
    }, [refetchPositions, refetchSummary]);

    const handleCreateOrUpdate = useCallback(async (data: PlantillaSchema) => {
        try {
          // Ensure numbers are actually numbers for the API
          const payload = {
            ...data,
            salary_grade: Number(data.salary_grade),
            step_increment: Number(data.step_increment),
            monthly_salary: data.monthly_salary ? Number(data.monthly_salary) : undefined,
            department_id: Number(data.department_id),
            // Explicitly map optional fields to avoid undefined if the backend expects null
            area_code: data.area_code || undefined,
            area_type: data.area_type || undefined,
            area_level: data.area_level || undefined,
            status: 'Active' as const,
            is_vacant: data.is_vacant
          };

          if (modalMode === 'create') {
            await plantillaApi.createPosition(payload as unknown as Omit<Position, 'id'>);
          } else {
            if (!currentPosition?.id) throw new Error("No position selected for update");
            await plantillaApi.updatePosition(currentPosition.id, payload as unknown as Partial<Position>);
          }
          setIsModalOpen(false);
          refetchPositions();
          refetchSummary();
          notify(modalMode === 'create' ? "Position created successfully" : "Position updated successfully");
        } catch (err) {
          const axiosErr = err as AxiosError<ApiErrorResponse>;
          notify(axiosErr.response?.data?.message || "Operation failed", "error");
        }
    }, [modalMode, currentPosition, refetchPositions, refetchSummary]);

    const handleAssign = useCallback(async () => {
        if (!currentPosition || !selectedEmployee) return;
        try {
            await plantillaApi.assignEmployee(currentPosition.id, {
                employee_id: parseInt(selectedEmployee),
                start_date: new Date().toISOString().split('T')[0]
            });
            setIsAssignModalOpen(false);
            setSelectedEmployee('');
            refetchPositions();
            refetchSummary();
            notify("Employee assigned successfully");
        } catch (err) {
            const axiosErr = err as AxiosError<ApiErrorResponse>;
            notify(axiosErr.response?.data?.message || "Failed to assign employee", "error");
        }
    }, [currentPosition, selectedEmployee, refetchPositions, refetchSummary]);

    const handleVacate = useCallback(async () => {
        if (!currentPosition) return;
        try {
            await plantillaApi.vacatePosition(currentPosition.id, { reason: vacateReason });
            setIsVacateModalOpen(false);
            setVacateReason('');
            refetchPositions();
            refetchSummary();
            notify("Position vacated successfully");
        } catch (err) {
            const axiosErr = err as AxiosError<ApiErrorResponse>;
            notify(axiosErr.response?.data?.message || "Failed to vacate position", "error");
        }
    }, [currentPosition, vacateReason, refetchPositions, refetchSummary]);

    const fetchHistory = useCallback(async (position: Position) => {
        setCurrentPosition(position);
        try {
          const response = await plantillaApi.getPositionHistory(position.id);
          // @ts-ignore - History record type mismatch in some environments, casting safely
          setPositionHistory(response.data.history as HistoryRecord[]);
          setIsHistoryModalOpen(true);
        } catch (err) {
          notify("Failed to load position history", "error");
        }
    }, []);

    const openAssignModal = useCallback(async (position: Position) => {
        setCurrentPosition(position);
        try {
          const response = await plantillaApi.getAvailableEmployees();
          // @ts-ignore - Employee type mismatch
          setAvailableEmployees(response.data.employees as Employee[]);
          setIsAssignModalOpen(true);
        } catch (err) {
          notify("Failed to load available employees", "error");
        }
    }, []);

    const openAppointmentModal = useCallback((position: Position) => {
        setCurrentPosition(position);
        setIsAppointmentModalOpen(true);
    }, []);

    const filteredPositions = useMemo(() => {
        const data = positionsData || [];
        const lowerSearch = searchTerm?.toLowerCase() || '';

        if (!lowerSearch) return data;

        return data.filter((p: Position) => {
            const posTitle = p.position_title?.toLowerCase() || '';
            const itemNum = p.item_number?.toLowerCase() || '';
            const incumbent = p.incumbent_name?.toLowerCase() || '';
            const dept = p.department?.toLowerCase() || '';
            const deptName = p.department_name?.toLowerCase() || '';

            return (
                posTitle.includes(lowerSearch) ||
                itemNum.includes(lowerSearch) ||
                incumbent.includes(lowerSearch) ||
                dept.includes(lowerSearch) ||
                deptName.includes(lowerSearch)
            );
        });
    }, [positionsData, searchTerm]);

    return {
        // State
        positions: positionsData || [], 
        loading: positionsLoading, 
        error: positionsError ? (positionsError as Error).message : null, 
        departments: departmentsData || [], 
        summary: summaryData || INITIAL_SUMMARY,
        selectedDept, setSelectedDept, searchTerm, setSearchTerm,
        isModalOpen, setIsModalOpen, modalMode, setModalMode, currentPosition, setCurrentPosition,
        isAssignModalOpen, setIsAssignModalOpen, availableEmployees, 
        selectedEmployee, setSelectedEmployee,
        isHistoryModalOpen, setIsHistoryModalOpen, positionHistory,
        isVacateModalOpen, setIsVacateModalOpen, 
        vacateReason, setVacateReason,
        filteredPositions,
        
        // Actions
        handleDelete, handleCreateOrUpdate, 
        handleAssign, handleVacate,
        fetchHistory, openAssignModal,
        openAppointmentModal,
        isAppointmentModalOpen, setIsAppointmentModalOpen,
        refetch: () => { refetchPositions(); refetchSummary(); }
    };
};
