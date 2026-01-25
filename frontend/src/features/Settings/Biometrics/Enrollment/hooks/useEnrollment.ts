import { useState, useEffect } from 'react';
import { fetchEmployees } from '@/api/employeeApi';
  import { useStartEnrollment, useEnrollmentStatus } from '../../Monitor/hooks/useBiometricsQuery';

interface Employee {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  department_id?: number;
  department_name?: string;
}

  export const useEnrollment = () => {

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  const startEnrollment = useStartEnrollment();
  const { data: enrollmentStatus } = useEnrollmentStatus(selectedEmployee || null);
  const isEnrolled = enrollmentStatus?.isEnrolled || false;

  // We keep this for the employee list logic which wasn't replaced yet
  const loadEmployees = async () => {
    setIsLoading(true);
    try {
      const response = await fetchEmployees();
      if (response.success && response.employees) {
          setEmployees(response.employees);
      }
      setError('');
    } catch (err) {
      setError('Failed to load employees. Please try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEnrollClick = async () => {
    if (!selectedEmployee) return;
    
    setIsLoading(true);
    setStatusMessage('');
    setError('');

    try {
      const employee = employees.find(e => (e as any).employee_id === selectedEmployee);
      const name = employee ? `${employee.first_name} ${employee.last_name}` : undefined;
      const department = employee ? employee.department_name : undefined;

      const result = await startEnrollment.mutateAsync({
        employeeId: selectedEmployee,
        name,
        department
      });

      if (result.success) {
        setStatusMessage(result.message);
      } else {
        setError(result.message);
      }
    } catch (err: any) {
       setError(err.response?.data?.message || 'Enrollment failed');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadEmployees();
  }, []);

  return {
    employees,
    selectedEmployee,
    setSelectedEmployee,
    isEnrolled,
    isLoading: isLoading || startEnrollment.isPending,
    error,
    statusMessage,
    setStatusMessage,
    showAddModal,
    setShowAddModal,
    setError,
    handleEnrollClick,
    loadEmployees
  };
};

export default useEnrollment;
