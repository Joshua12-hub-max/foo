import { useState, useEffect } from 'react';
import { attendanceApi } from '@/api/attendanceApi';

interface BiometricsLog {
  id: number;
  employee_id: string;
  first_name: string;
  last_name: string;
  scan_time: string;
  type: string;
  source: string;
}

export const useBiometricsMonitor = () => {
  const [logs, setLogs] = useState<BiometricsLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const fetchLogs = async () => {
    try {
      const response = await (attendanceApi as any).getRecentActivity();
      if (response.data && response.data.success) {
        setLogs(response.data.data);
        setLastUpdated(new Date());
      }
    } catch (error) {
      console.error("Failed to fetch biometrics logs", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
    // Poll every 3 seconds
    const interval = setInterval(fetchLogs, 3000);
    return () => clearInterval(interval);
  }, []);

  return {
    logs,
    loading,
    lastUpdated,
    fetchLogs
  };
};
