import { useState, useEffect, useMemo } from 'react';
import { Clock, LogIn, LogOut, CheckCircle } from 'lucide-react';
import { attendanceApi } from '../../../api/attendanceApi';
import { useAuth } from '../../../hooks/useAuth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface ClockInWidgetProps {
  onStatusChange?: () => void;
}

interface Times {
  in: string | null;
  out: string | null;
}

const ClockInWidget = ({ onStatusChange }: ClockInWidgetProps) => {
  const { user } = useAuth();
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const { data: statusData, isLoading: isStatusLoading } = useQuery({
    queryKey: ['todayStatus', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const response = await attendanceApi.getTodayStatus(user.id.toString());
      return response.data;
    },
    enabled: !!user,
  });

  const times = useMemo(() => ({
    in: statusData?.data?.timeIn || null,
    out: statusData?.data?.timeOut || null
  }), [statusData]);

  const status = useMemo(() => {
    if (isStatusLoading) return 'loading';
    if (times.in && times.out) return 'completed';
    if (times.in) return 'in';
    return 'out';
  }, [isStatusLoading, times]);

  const formatTime = (dateString: string | null) => {
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
      </div>

      <div>
        {status === 'loading' ? (
          <div className="animate-pulse bg-gray-200 h-8 w-20 rounded-lg"></div>
        ) : status === 'in' ? (
          <div className="flex items-center gap-1.5 bg-blue-50 text-blue-700 px-3 py-2 rounded-lg text-sm font-semibold">
            <LogIn className="w-4 h-4" />
            <span>Clocked In</span>
          </div>
        ) : status === 'completed' ? (
          <div className="flex items-center gap-1.5 bg-green-50 text-green-700 px-3 py-2 rounded-lg text-sm font-semibold">
            <CheckCircle className="w-4 h-4" />
            <span>Duty Completed</span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 bg-gray-50 text-gray-500 px-3 py-2 rounded-lg text-sm font-semibold italic">
             Waiting for biometric scan...
          </div>
        )}
      </div>
    </div>
  );
};

export default ClockInWidget;
