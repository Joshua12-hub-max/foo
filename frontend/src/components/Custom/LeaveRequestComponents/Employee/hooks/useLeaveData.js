import { useState, useEffect, useCallback } from 'react';
import { leaveApi } from '../../../../../api/leaveApi';

export const useLeaveData = () => {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchLeaves = useCallback(async () => {
    try {
      const response = await leaveApi.getMyLeaves();
      
      // Map API data to component structure
      const mapped = (response.data?.leaves || []).map(l => ({
        id: l.id,
        employee_id: l.employee_id,
        leaveType: l.leave_type,
        fromDate: l.start_date,
        toDate: l.end_date,
        reason: l.reason,
        status: l.status,
        with_pay: l.with_pay,
        attachment_path: l.attachment_path,
        department: l.department || 'N/A',
        name: `${l.first_name || ''} ${l.last_name || ''}`.trim() || 'N/A'
      }));
      
      setLeaves(mapped);
      setError(null);
    } catch (err) {
      console.error('Error fetching leaves:', err.message);
      setError('Failed to fetch leave requests.');
      setLeaves([]); 
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLeaves();
  }, [fetchLeaves]);

  return { leaves, loading, error, refreshLeaves: fetchLeaves };
};
