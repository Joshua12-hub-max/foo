import { useState, useEffect, useCallback } from 'react';
import { leaveApi } from '../../../../../api/leaveApi';

/**
 * Custom hook to fetch and manage admin leave request data
 * @returns {Object} { leaves, loading, error, refreshLeaves }
 */
export const useAdminLeaveData = () => {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchLeaves = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const res = await leaveApi.getAllLeaves();
      
      // Map API data to component structure
      const mapped = res.data.leaves.map(l => ({
        id: l.id,
        employee_id: l.employee_id,
        name: `${l.first_name} ${l.last_name}`,
        department: l.department || 'N/A',
        leaveType: l.leave_type,
        fromDate: l.start_date,
        toDate: l.end_date,
        reason: l.reason,
        status: l.status,
        with_pay: l.with_pay,
        attachment_path: l.attachment_path,
        final_attachment_path: l.final_attachment_path,
        first_name: l.first_name,
        last_name: l.last_name,
        leave_type: l.leave_type,
        start_date: l.start_date,
        end_date: l.end_date
      }));
      
      setLeaves(mapped);
    } catch (err) {
      console.error('Error fetching leave requests:', err);
      setError('Failed to fetch leave requests.');
      setLeaves([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLeaves();
  }, [fetchLeaves]);

  return { 
    leaves, 
    loading, 
    error, 
    refreshLeaves: fetchLeaves 
  };
};
