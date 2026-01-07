import { useState, useEffect, useMemo, useCallback } from 'react';
import { plantillaApi } from '@api/plantillaApi';
import { fetchEmployeeOptions } from '@api/employeeApi';
import { INITIAL_FORM_STATE, INITIAL_SUMMARY } from '../constants/plantillaConstants';

/**
 * Custom hook for Plantilla management
 * @param {Object} options - Hook options
 * @param {Function} options.showNotification - Optional callback for notifications (message, type)
 */
export const usePlantilla = ({ showNotification } = {}) => {
    // Notification helper - falls back to console if no callback provided
    const notify = (message, type = 'success') => {
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
    
    const [positions, setPositions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [departments, setDepartments] = useState([]);
    const [summary, setSummary] = useState(INITIAL_SUMMARY);
    
    // Filter state
    const [selectedDept, setSelectedDept] = useState('All');
    const [searchTerm, setSearchTerm] = useState('');
  
    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState('create');
    const [currentPosition, setCurrentPosition] = useState(null);
    const [formData, setFormData] = useState(INITIAL_FORM_STATE);

    // Automated Salary Lookup
    useEffect(() => {
        if (isModalOpen && formData.salary_grade && formData.step_increment) {
            const fetchSalary = async () => {
                try {
                    const res = await plantillaApi.getSalarySchedule(formData.salary_grade, formData.step_increment);
                    if (res.data.success && res.data.monthly_salary) {
                        setFormData(prev => ({ ...prev, monthly_salary: res.data.monthly_salary }));
                    }
                } catch (err) {
                    console.error("Failed to fetch suggested salary", err);
                }
            };
            fetchSalary();
        }
    }, [formData.salary_grade, formData.step_increment, isModalOpen]);
  
    // Assign modal state
    const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
    const [availableEmployees, setAvailableEmployees] = useState([]);
    const [selectedEmployee, setSelectedEmployee] = useState('');
  
    // History modal state
    const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
    const [positionHistory, setPositionHistory] = useState([]);
  
    // Vacate modal state
    const [isVacateModalOpen, setIsVacateModalOpen] = useState(false);
    const [vacateReason, setVacateReason] = useState('');
  
    const fetchData = useCallback(async () => {
      setLoading(true);
      try {
        const response = await plantillaApi.getPositions({ 
          department: selectedDept !== 'All' ? selectedDept : undefined 
        });
        setPositions(response.data.positions);
        setError(null);
      } catch (err) {
        setError('Failed to load plantilla positions.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }, [selectedDept]);
  
    const loadDepartments = async () => {
      try {
        const options = await fetchEmployeeOptions();
        if (options.success) {
          setDepartments(options.departments);
        }
      } catch (err) {
        console.error("Failed to load departments", err);
      }
    };
  
    const loadSummary = async () => {
      try {
        const response = await plantillaApi.getSummary();
        if (response.data.success && response.data.summary) {
          setSummary(response.data.summary);
        }
      } catch (err) {
        console.error("Failed to load summary", err);
      }
    };

    useEffect(() => {
        fetchData();
        loadDepartments();
        loadSummary();
    }, [fetchData]);

    // Actions
    const handleDelete = useCallback(async (id) => {
        if (!window.confirm("Are you sure you want to delete this position?")) return;
        try {
          await plantillaApi.deletePosition(id);
          fetchData();
          loadSummary();
        } catch (err) {
          notify(err.response?.data?.message || "Failed to delete position", "error");
        }
    }, [fetchData]);

    const handleCreateOrUpdate = useCallback(async (e) => {
        e.preventDefault();
        try {
          if (modalMode === 'create') {
            await plantillaApi.createPosition(formData);
          } else {
            if (!currentPosition?.id) throw new Error("No position selected for update");
            await plantillaApi.updatePosition(currentPosition.id, formData);
          }
          setIsModalOpen(false);
          fetchData();
          loadSummary();
        } catch (err) {
          notify(err.response?.data?.message || "Operation failed", "error");
        }
    }, [modalMode, formData, currentPosition, fetchData]);

    const handleAssign = useCallback(async () => {
        if (!selectedEmployee) {
          notify("Please select an employee", "error");
          return;
        }
        try {
          await plantillaApi.assignEmployee(currentPosition.id, { 
            employee_id: parseInt(selectedEmployee) 
          });
          setIsAssignModalOpen(false);
          fetchData();
          loadSummary();
        } catch (err) {
          notify(err.response?.data?.message || "Failed to assign employee", "error");
        }
    }, [selectedEmployee, currentPosition, fetchData]);

    const handleVacate = useCallback(async () => {
        try {
          await plantillaApi.vacatePosition(currentPosition.id, { reason: vacateReason });
          setIsVacateModalOpen(false);
          fetchData();
          loadSummary();
        } catch (err) {
          notify(err.response?.data?.message || "Failed to vacate position", "error");
        }
    }, [currentPosition, vacateReason, fetchData]);

    const fetchHistory = useCallback(async (position) => {
        setCurrentPosition(position);
        try {
          const response = await plantillaApi.getPositionHistory(position.id);
          setPositionHistory(response.data.history);
          setIsHistoryModalOpen(true);
        } catch (err) {
          notify("Failed to load position history", "error");
        }
    }, []);

    const openAssignModal = useCallback(async (position) => {
        setCurrentPosition(position);
        try {
          const response = await plantillaApi.getAvailableEmployees();
          setAvailableEmployees(response.data.employees);
          setSelectedEmployee('');
          setIsAssignModalOpen(true);
        } catch (err) {
          notify("Failed to load available employees", "error");
        }
    }, []);

    const filteredPositions = useMemo(() => 
        positions.filter(p => 
          p.position_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.item_number.toLowerCase().includes(searchTerm.toLowerCase())
        ), [positions, searchTerm]
    );

    return {
        // State
        positions, loading, error, departments, summary,
        selectedDept, setSelectedDept, searchTerm, setSearchTerm,
        isModalOpen, setIsModalOpen, modalMode, setModalMode, currentPosition, setCurrentPosition,
        formData, setFormData,
        isAssignModalOpen, setIsAssignModalOpen, availableEmployees, selectedEmployee, setSelectedEmployee,
        isHistoryModalOpen, setIsHistoryModalOpen, positionHistory,
        isVacateModalOpen, setIsVacateModalOpen, vacateReason, setVacateReason,
        filteredPositions,
        
        // Actions
        handleDelete, handleCreateOrUpdate, handleAssign, handleVacate, fetchHistory, openAssignModal
    };
};
