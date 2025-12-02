import { useState, useEffect, useCallback } from "react";
import { scheduleApi } from "../../../../../api/scheduleApi";

export const useScheduleData = () => {
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await scheduleApi.getAllSchedules();
      setData(response.data.schedules || []);
    } catch (err) {
      setError("Failed to load schedule data. Please try again.");
      console.error(err);
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