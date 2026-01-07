import { useState, useEffect, useCallback } from "react";
import { scheduleApi } from "@api";

export const useScheduleData = () => {
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await scheduleApi.getMySchedule();
      setData(response.data.schedule || []);
    } catch (err) {
      setError("Failed to load your schedule. Please try again.");
      console.error('❌ [Employee Schedule] Error fetching schedule:', err);
      console.error('❌ [Employee Schedule] Error response:', err.response?.data);
      console.error('❌ [Employee Schedule] Error status:', err.response?.status);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRefresh = () => {
    fetchData();
  };

  return { data, setData, isLoading, setIsLoading, error, setError, handleRefresh };
};
