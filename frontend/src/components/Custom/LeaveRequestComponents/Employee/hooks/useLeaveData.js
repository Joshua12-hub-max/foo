import { useState, useEffect, useCallback } from 'react';
import { leaveApi } from '../../../../../api/leaveApi';

export const useLeaveData = () => {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchLeaves = useCallback(async () => {
    try {
      setLoading(true);
      // Assuming getMyLeaves returns { data: [...] } or just [...]
      const response = await leaveApi.getMyLeaves();
      // Adjust based on actual API response structure. 
      // Assuming response.data is the array.
      setLeaves(response.data || []);
      setError(null);
    } catch (err) {
      console.error("Error fetching leaves:", err);
      setError(err);
      // Fallback for demo if API fails
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
