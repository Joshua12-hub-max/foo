import { useState, useEffect } from 'react';
import { fetchEmployees, startFingerprintEnrollment, checkEnrollmentStatus } from '@api/employeeApi';

export const useEnrollment = () => {
  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [isEnrolled, setIsEnrolled] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

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

  useEffect(() => {
    loadEmployees();
  }, []);

  useEffect(() => {
    const checkStatus = async () => {
        if (!selectedEmployee) {
            setIsEnrolled(null);
            return;
        }
        try {
            const result = await checkEnrollmentStatus(selectedEmployee);
            setIsEnrolled(result.isEnrolled);
        } catch (e) {
            console.error(e);
        }
    };
    checkStatus();
  }, [selectedEmployee]);

  const handleEnrollClick = async () => {
    if (!selectedEmployee) {
      setError('Please select an employee first.');
      return;
    }

    setIsLoading(true);
    setError('');
    setStatusMessage('');

    try {
      const result = await startFingerprintEnrollment(selectedEmployee);
      setStatusMessage(result.message + ' Please place your finger on the scanner now.');
    } catch (err) {
      setError(err.toString());
    } finally {
      setIsLoading(false);
    }
  };

  return {
    employees,
    selectedEmployee,
    isEnrolled,
    isLoading,
    error,
    statusMessage,
    showAddModal,
    setSelectedEmployee,
    setShowAddModal,
    setError,
    setStatusMessage,
    handleEnrollClick,
    loadEmployees
  };
};
