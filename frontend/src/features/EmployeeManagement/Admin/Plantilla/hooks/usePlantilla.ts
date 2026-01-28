import { useState, useMemo, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
// @ts-ignore
import { plantillaApi, type Position } from '@api/plantillaApi';
export type { Position }; // Re-export for legacy code support
// @ts-ignore
import { fetchEmployeeOptions } from '@api/employeeApi';
import { INITIAL_SUMMARY, PlantillaSummary } from '../constants/plantillaConstants';
import { PlantillaSchema } from '@/schemas/plantilla';

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
  // formData removed
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
  vacateReason: string;
  setVacateReason: React.Dispatch<React.SetStateAction<string>>;
  filteredPositions: Position[];
  handleDelete: (id: number) => Promise<void>;
  handleCreateOrUpdate: (data: PlantillaSchema) => Promise<void>;
  handleAssign: () => Promise<void>;
  handleVacate: () => Promise<void>;
  fetchHistory: (position: Position) => Promise<void>;
  openAssignModal: (position: Position) => Promise<void>;
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
    const { data: positionsData, isLoading: positionsLoading, error: positionsError, refetch: refetchPositions } = useQuery({
        queryKey: ['plantilla', selectedDept],
        queryFn: async () => {
            const response = await plantillaApi.getPositions({ 
                department_id: selectedDept !== 'All' ? selectedDept : undefined
            });
            return response.data.positions;
        },
        initialData: []
    });

    const { data: summaryData, refetch: refetchSummary } = useQuery({
        queryKey: ['plantilla-summary'],
        queryFn: async () => {
            const response = await plantillaApi.getSummary();
            return response.data.summary || INITIAL_SUMMARY;
        },
        initialData: INITIAL_SUMMARY
    });

    const { data: departmentsData } = useQuery({
        queryKey: ['departments-options'],
        queryFn: async () => {
            const options = await fetchEmployeeOptions();
            return (options.departments || []) as { id: number; name: string }[];
        },
        initialData: []
    });
    
    // Actions
    const handleDelete = useCallback(async (id: number) => {
        if (!window.confirm("Are you sure you want to delete this position?")) return;
        try {
          await plantillaApi.deletePosition(id);
          refetchPositions();
          refetchSummary();
          notify("Position deleted successfully");
        } catch (err: any) {
          notify(err.response?.data?.message || "Failed to delete position", "error");
        }
    }, [refetchPositions, refetchSummary]);

    const handleCreateOrUpdate = useCallback(async (data: PlantillaSchema) => {
        try {
          const payload = {
            ...data,
            salary_grade: String(data.salary_grade),
            monthly_salary: data.monthly_salary ? String(data.monthly_salary) : undefined,
            department_id: data.department_id,
            status: 'Active' as const
          };

          if (modalMode === 'create') {
            await plantillaApi.createPosition(data as Omit<Position, 'id'>);
          } else {
            if (!currentPosition?.id) throw new Error("No position selected for update");
            await plantillaApi.updatePosition(currentPosition.id, data as Partial<Position>);
          }
          setIsModalOpen(false);
          refetchPositions();
          refetchSummary();
          notify(modalMode === 'create' ? "Position created successfully" : "Position updated successfully");
        } catch (err: any) {
          notify(err.response?.data?.message || "Operation failed", "error");
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
        } catch (err: any) {
            notify(err.response?.data?.message || "Failed to assign employee", "error");
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
        } catch (err: any) {
            notify(err.response?.data?.message || "Failed to vacate position", "error");
        }
    }, [currentPosition, vacateReason, refetchPositions, refetchSummary]);

    const fetchHistory = useCallback(async (position: Position) => {
        setCurrentPosition(position);
        try {
          const response = await plantillaApi.getPositionHistory(position.id);
          setPositionHistory(response.data.history);
          setIsHistoryModalOpen(true);
        } catch (err) {
          notify("Failed to load position history", "error");
        }
    }, []);

    const openAssignModal = useCallback(async (position: Position) => {
        setCurrentPosition(position);
        try {
          const response = await plantillaApi.getAvailableEmployees();
          setAvailableEmployees(response.data.employees);
          // setSelectedEmployee(''); // Handled in modal
          setIsAssignModalOpen(true);
        } catch (err) {
          notify("Failed to load available employees", "error");
        }
    }, []);

    const filteredPositions = useMemo(() => 
        (positionsData || []).filter((p: Position) => 
          p.position_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.item_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (p.incumbent_name && p.incumbent_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (p.department && p.department.toLowerCase().includes(searchTerm.toLowerCase()))
        ), [positionsData, searchTerm]
    );

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
        refetch: () => { refetchPositions(); refetchSummary(); }
    };
};
