/**
 * useEmployeeDepartment Hook
 * Custom hook for employee department view (read-only)
 * Optimized with useCallback for performance
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import axios from '../../../../api/axios';
import { useAuth } from '../../../../hooks/useAuth';

export const useEmployeeDepartment = () => {
  const { user } = useAuth();
  
  // Data state
  const [departmentData, setDepartmentData] = useState(null);
  const [colleagues, setColleagues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch department data - memoized with useCallback
  const fetchDepartmentData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get department name from auth context
      const deptName = user?.department;
      
      if (!deptName) {
        setError('No department assigned');
        setLoading(false);
        return;
      }
      
      // Fetch all departments to find the matching one
      const deptRes = await axios.get('/departments');
      
      if (deptRes.data.success) {
        const dept = deptRes.data.departments.find(d => d.name === deptName);
        
        if (dept) {
          setDepartmentData(dept);
          
          // Fetch department details with employees
          const detailRes = await axios.get(`/departments/${dept.id}`);
          if (detailRes.data.success) {
            // Filter out current user from colleagues list
            const filteredColleagues = (detailRes.data.employees || []).filter(
              emp => emp.id !== user?.id
            );
            setColleagues(filteredColleagues);
          }
        } else {
          setError('Department not found');
        }
      } else {
        setError('Failed to load departments');
      }
    } catch (err) {
      setError('Failed to load department data');
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Initial load
  useEffect(() => {
    if (user) {
      fetchDepartmentData();
    }
  }, [user, fetchDepartmentData]);

  // Total members count - memoized
  const totalMembers = useMemo(() => {
    return colleagues.length + 1;
  }, [colleagues]);

  return {
    // Data
    departmentData,
    colleagues,
    totalMembers,
    loading,
    error,
    
    // Actions
    refresh: fetchDepartmentData
  };
};

export default useEmployeeDepartment;
