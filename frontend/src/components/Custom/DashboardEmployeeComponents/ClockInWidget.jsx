import React, { useState, useEffect } from 'react';
import { Clock, LogIn, LogOut, CheckCircle } from 'lucide-react';
import { attendanceApi } from '@api/attendanceApi';
import { useAuth } from '@hooks/useAuth';

const ClockInWidget = ({ onStatusChange }) => {
  const { user } = useAuth();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [status, setStatus] = useState('loading');
  const [times, setTimes] = useState({ in: null, out: null });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const fetchStatus = async () => {
      if (!user) return;
      try {
        const response = await attendanceApi.getTodayStatus({ employeeId: user.employeeId });
        if (response.data?.success) {
          const { timeIn, timeOut } = response.data.data;
          setTimes({ in: timeIn, out: timeOut });
          if (timeIn && timeOut) setStatus('completed');
          else if (timeIn) setStatus('in');
          else setStatus('out');
        }
      } catch (err) {
        console.error("Error fetching today's status:", err);
        setError('Failed to load status');
      }
    };
    fetchStatus();
  }, [user]);

  const handleClockAction = async (action) => {
    setIsLoading(true);
    setError(null);
    try {
      const apiCall = action === 'in' ? attendanceApi.clockIn : attendanceApi.clockOut;
      const response = await apiCall({ employeeId: user.employeeId, time: new Date().toISOString() });
      
      if (response.data?.success) {
        setStatus(action === 'in' ? 'in' : 'completed');
        if (action === 'in') {
          setTimes(prev => ({ ...prev, in: response.data.data.timeIn }));
        } else {
          setTimes(prev => ({ ...prev, out: response.data.data.timeOut }));
        }
        onStatusChange?.();
      } else {
        setError(response.data.message || 'Action failed');
      }
    } catch (err) {
      console.error(`Error clocking ${action}:`, err);
      setError(`Failed to clock ${action}`);
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (dateString) => {
    if (!dateString) return '--:--';
    return new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-3 mb-4 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <div>
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-gray-600" />
            {currentTime.toLocaleTimeString()}
          </h2>
          <p className="text-xs text-gray-500">
            {currentTime.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
          </p>
        </div>
        
        <div className="h-8 w-px bg-gray-200 hidden sm:block"></div>

        <div className="text-xs text-gray-600 flex gap-3">
          <span>In: <span className="font-semibold text-gray-800">{formatTime(times.in)}</span></span>
          <span>Out: <span className="font-semibold text-gray-800">{formatTime(times.out)}</span></span>
        </div>
        {error && <p className="text-red-500 text-xs">{error}</p>}
      </div>

      <div>
        {status === 'loading' ? (
          <div className="animate-pulse bg-gray-200 h-8 w-20 rounded-lg"></div>
        ) : status === 'out' ? (
          <button
            onClick={() => handleClockAction('in')}
            disabled={isLoading}
            className="flex items-center gap-1.5 bg-gray-900 hover:bg-gray-800 text-white px-4 py-2 rounded-lg text-sm font-semibold disabled:opacity-50 transition-all"
          >
            <LogIn className="w-4 h-4" />
            {isLoading ? '...' : 'Time In'}
          </button>
        ) : status === 'in' ? (
          <button
            onClick={() => handleClockAction('out')}
            disabled={isLoading}
            className="flex items-center gap-1.5 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm font-semibold disabled:opacity-50 transition-all"
          >
            <LogOut className="w-4 h-4" />
            {isLoading ? '...' : 'Time Out'}
          </button>
        ) : (
          <div className="flex items-center gap-1.5 bg-green-100 text-green-700 px-3 py-2 rounded-lg text-sm font-semibold">
            <CheckCircle className="w-4 h-4" />
            <span>Done</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClockInWidget;
