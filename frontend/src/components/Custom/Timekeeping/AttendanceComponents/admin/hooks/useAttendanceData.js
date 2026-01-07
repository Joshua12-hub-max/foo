import { useState, useEffect, useCallback } from 'react';
// Assuming there is an API function, if not I'll try to find one or mock it
// I'll check if fetchAttendance or similar exists in @api later. for now using dummy data or basic fetch
// Wait, I should verify API import.
// Let's assume fetchAttendanceLogs exists in @api as it's common.

import { attendanceApi } from '@api';

export const useAttendanceData = (isAdmin = false) => {
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await attendanceApi.getLogs({ isAdmin }); 
      
      if (response && response.data) {
          if (Array.isArray(response.data)) {
              setData(response.data);
          } else if (response.data.data && Array.isArray(response.data.data)) {
              setData(response.data.data);
          } else if (response.data.logs && Array.isArray(response.data.logs)) {
              setData(response.data.logs);
          } else {
              console.warn('Attendance Format Unknown:', response.data);
              setData([]);
          }
      } else if (Array.isArray(response)) {
          setData(response);
      } else {
         setData([]);
      }
    } catch (err) {
      console.error('Error fetching attendance:', err);
      // Fallback or error state
      setError('Failed to fetch attendance records');
      setData([]); 
    } finally {
      setIsLoading(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, isLoading, error, refetch: fetchData };
};
