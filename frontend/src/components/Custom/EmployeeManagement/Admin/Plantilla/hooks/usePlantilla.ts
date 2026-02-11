import { useState, useMemo, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { plantillaApi, Position } from '@api/plantillaApi';
import { fetchEmployeeOptions } from '@api/employeeApi';
import { INITIAL_SUMMARY, PlantillaSummary } from '../constants/plantillaConstants';
import { PlantillaSchema } from '@/schemas/plantilla';

// Position interface imported from plantillaApi

export interface Employee {
  id: number;
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
  modalMode: string;
  setModalMode: React.Dispatch<React.SetStateAction<string>>;
  currentPosition: Position | null;
  setCurrentPosition: React.Dispatch<React.SetStateAction<Position | null>>;
  // Appointment modal state
  isAppointmentModalOpen: boolean;
  setIsAppointmentModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  openAppointmentModal: (pos: Position) => void;
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
    const [modalMode, setModalMode] = useState('create');
    const [currentPosition, setCurrentPosition] = useState<Position | null>(null);

    // Appointment Modal
    const [isAppointmentModalOpen, setIsAppointmentModalOpen] = useState(false);
    
    // Assign modal state
    const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
    const [availableEmployees, setAvailableEmployees] = useState<Employee[]>([]);
  
    // History modal state
    const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
    const [positionHistory, setPositionHistory] = useState<HistoryRecord[]>([]);
  
    // Vacate modal state
    const [isVacateModalOpen, setIsVacateModalOpen] = useState(false);
    const { data: positionsData, isLoading: positionsLoading, error: positionsError, refetch: refetchPositions } = useQuery({
        queryKey: ['plantilla', selectedDept],
        queryFn: async () => {
            const response = await plantillaApi.getPositions({ 
                department: selectedDept !== 'All' ? selectedDept : undefined 
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
        initialData: [] as { id: number; name: string }[]
    });
    
    // Actions
    const handleDelete = useCallback(async (id: number) => {
        if (!window.confirm("Are you sure you want to delete this position?")) return;
        try {
          await plantillaApi.deletePosition(id);
          refetchPositions();
          refetchSummary();
          notify("Position deleted successfully");
        } catch (err: unknown) {
          const error = err as any;
          notify(error.response?.data?.message || "Failed to delete position", "error");
        }
    }, [refetchPositions, refetchSummary]);

    const handleCreateOrUpdate = useCallback(async (data: PlantillaSchema) => {
        try {
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
        } catch (err: unknown) {
          const error = err as any;
          notify(error.response?.data?.message || "Operation failed", "error");
        }
    }, [modalMode, currentPosition, refetchPositions, refetchSummary]);

    // handleAssign and handleVacate are removed from hook as they are handled in modals now

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

    const openAppointmentModal = useCallback((position: Position) => {
        setCurrentPosition(position);
        setIsAppointmentModalOpen(true);
    }, []);

    const filteredPositions = useMemo(() => 
        (positionsData || []).filter((p: Position) => 
          p.position_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.item_number.toLowerCase().includes(searchTerm.toLowerCase())
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
        isAppointmentModalOpen, setIsAppointmentModalOpen, openAppointmentModal,
        isAssignModalOpen, setIsAssignModalOpen, availableEmployees, 
        selectedEmployee: '', setSelectedEmployee: (_: React.SetStateAction<string>) => {}, // Deprecated shim
        isHistoryModalOpen, setIsHistoryModalOpen, positionHistory,
        isVacateModalOpen, setIsVacateModalOpen, 
        vacateReason: '', setVacateReason: (_: React.SetStateAction<string>) => {}, // Deprecated shim
        filteredPositions,
        
        // Actions
        handleDelete, handleCreateOrUpdate, 
        handleAssign: async () => {}, // Deprecated shim
        handleVacate: async () => {}, // Deprecated shim
        fetchHistory, openAssignModal,
        refetch: () => { refetchPositions(); refetchSummary(); }
    };
};
