import React, { useState, useEffect } from 'react';
import { Clock, LogIn, LogOut } from 'lucide-react';
import { attendanceApi } from '../../../api/attendanceApi';
import { useAuth } from '../../../hooks/useAuth';

const ClockInWidget = ({ onStatusChange }) => {
  const { user } = useAuth();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [status, setStatus] = useState('loading'); // loading, out, in, completed
  const [times, setTimes] = useState({ in: null, out: null });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Update clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch initial status
  useEffect(() => {
    const fetchStatus = async () => {
      if (!user) return;
      try {
        const response = await attendanceApi.getTodayStatus({ employeeId: user.employeeId });
        if (response.data && response.data.success) {
          const { timeIn, timeOut } = response.data.data;
          setTimes({ in: timeIn, out: timeOut });
          
          if (timeIn && timeOut) {
            setStatus('completed');
          } else if (timeIn) {
            setStatus('in');
          } else {
            setStatus('out');
          }
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
      
      if (response.data && response.data.success) {
        // Refresh status
        const newStatus = action === 'in' ? 'in' : 'completed';
        setStatus(newStatus);
        if (action === 'in') {
            setTimes(prev => ({ ...prev, in: response.data.data.timeIn }));
        } else {
            setTimes(prev => ({ ...prev, out: response.data.data.timeOut }));
        }
        if (onStatusChange) onStatusChange();
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
    <div className="bg-white rounded-lg shadow-md p-6 mb-6 flex items-center justify-between border-l-4 border-[#274b46]">
      <div>
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <Clock className="w-6 h-6 text-[#274b46]" />
          {currentTime.toLocaleTimeString()}
        </h2>
        <p className="text-gray-500 text-sm mt-1">
          {currentTime.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
        <div className="flex gap-4 mt-2 text-sm text-gray-600">
            <span>Time In: <span className="font-medium">{formatTime(times.in)}</span></span>
            <span>Time Out: <span className="font-medium">{formatTime(times.out)}</span></span>
        </div>
        {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
      </div>

      <div>
        {status === 'loading' ? (
           <div className="animate-pulse bg-gray-200 h-10 w-32 rounded"></div>
        ) : status === 'out' ? (
          <button
            onClick={() => handleClockAction('in')}
            disabled={isLoading}
            className="flex items-center gap-2 glass-button glass-button-primary text-white px-6 py-3 rounded-lg font-medium disabled:opacity-50"
          >
            <LogIn className="w-5 h-5" />
            {isLoading ? 'Clocking In...' : 'Clock In'}
          </button>
        ) : status === 'in' ? (
          <button
            onClick={() => handleClockAction('out')}
            disabled={isLoading}
            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-medium transition-all disabled:opacity-50"
          >
            <LogOut className="w-5 h-5" />
            {isLoading ? 'Clocking Out...' : 'Clock Out'}
          </button>
        ) : (
          <div className="flex items-center gap-2 bg-green-100 text-green-800 px-6 py-3 rounded-lg font-medium border border-green-200">
            <Clock className="w-5 h-5" />
            <span>Shift Completed</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClockInWidget;
