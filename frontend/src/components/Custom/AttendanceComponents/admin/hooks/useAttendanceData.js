import { useState, useEffect, useCallback } from 'react';
import { attendanceApi } from '../../../../../api/attendanceApi';
import { useAuth } from '../../../../../hooks/useAuth';

/**
 * Hook to fetch attendance data
 * @param {boolean} isAdmin - If true, fetches all data; otherwise fetches only for current user
 */
export const useAttendanceData = (isAdmin = false) => {
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user, loading: authLoading } = useAuth();

  const fetchData = useCallback(async () => {
    // Wait for auth to complete
    if (authLoading) return;
    
    // If not admin, we need a user
    if (!isAdmin && !user) return;

    setIsLoading(true);
    setError(null);
    try {
      const params = isAdmin ? {} : { employeeId: user?.employeeId };
      const response = await attendanceApi.getLogs(params);
      
      if (response.data && response.data.success) {
        const mappedData = response.data.data.map(record => {
            const timeIn = record.time_in ? new Date(record.time_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-';
            const timeOut = record.time_out ? new Date(record.time_out).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-';
            
            // Calculate total hours if both exist
            let totalHours = 0;
            if (record.time_in && record.time_out) {
                const start = new Date(record.time_in);
                const end = new Date(record.time_out);
                totalHours = ((end - start) / (1000 * 60 * 60)).toFixed(2);
            }

            return {
                id: record.id,
                department: record.department || '-',
                employee_id: record.employee_id,
                employee_name: record.employee_name || `${record.first_name || ''} ${record.last_name || ''}`.trim(),
                present: record.status === 'Present' ? 'Yes' : 'No',
                absent: record.status === 'Absent' ? 'Yes' : 'No',
                late: record.late_minutes || 0,
                wfh: 'No', // Default
                undertime: record.undertime_minutes || 0,
                date: record.date,
                overtime: record.overtime_minutes || 0,
                on_leave: record.status === 'Leave' ? 'Yes' : 'No',
                lunch_break_in: '-', // Not tracking
                lunch_break_out: '-', // Not tracking
                total_hours: totalHours,
                time_in: timeIn,
                time_out: timeOut,
                total_work: `${totalHours}h`,
                daily_status: record.status || 'Absent',
                notes: ''
            };
        });
        setData(mappedData);
      } else {
        // If success is false or no data
        console.warn("API returned unsuccessful response or no data structure matches.");
        setData([]);
      }
    } catch (err) {
      console.error('Error fetching attendance data:', err);
      setError('Failed to load attendance records.');
    } finally {
      setIsLoading(false);
    }
  }, [isAdmin, user, authLoading]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, isLoading: isLoading || authLoading, error, refetch: fetchData };
};