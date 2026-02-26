import { useState, useEffect, useCallback, useMemo } from 'react';
import axios from '@/api/axios';
// @ts-ignore
import { useAuth } from '@hooks/useAuth';

export interface Department {
  id: number;
  name: string;
  description?: string;
  head_of_department?: string;
}

export interface Colleague {
  id: number;
  first_name?: string;
  last_name?: string;
  email?: string;
  job_title?: string;
  position_title?: string;
  avatar?: string;
  avatar_url?: string; // Added for compatibility
  employment_status?: string; // Added for compatibility
  employee_id?: string | number; // Added for compatibility
  date_hired?: string; // Added for compatibility
}

export interface UseEmployeeDepartmentReturn {
  departmentData: Department | null;
  colleagues: Colleague[];
  totalMembers: number;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export const useEmployeeDepartment = (): UseEmployeeDepartmentReturn => {
  const { user } = useAuth();
  
  // Data state
  const [departmentData, setDepartmentData] = useState<Department | null>(null);
  const [colleagues, setColleagues] = useState<Colleague[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
        const dept = deptRes.data.departments.find((d: Department) => d.name === deptName);
        
        if (dept) {
          setDepartmentData(dept);
          
          // Fetch department details with employees
          const detailRes = await axios.get(`/departments/${dept.id}`);
          if (detailRes.data.success) {
            // Return ALL employees - filtering happens in component
            setColleagues(detailRes.data.employees || []);
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
