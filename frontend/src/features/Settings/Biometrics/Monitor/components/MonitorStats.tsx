import React from 'react';
import { CheckCircle, AlertTriangle, RefreshCw } from 'lucide-react';

import { BiometricsLog } from '@/types';

interface MonitorStatsProps {
  logs: BiometricsLog[];
}

const MonitorStats: React.FC<MonitorStatsProps> = ({ logs }) => {
  const onTimeCount = logs.filter(l => l.status === 'Present').length;
  const lateCount = logs.filter(l => l.status === 'Late').length;
  const totalScans = logs.length;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="bg-white px-5 py-4 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-500 font-bold tracking-wider mb-1">On Time</p>
          <h3 className="text-2xl font-black text-gray-800 leading-none">
            {onTimeCount}
          </h3>
        </div>
        <div className="p-2 bg-green-50 rounded-lg">
           <CheckCircle className="w-5 h-5 text-green-600" />
        </div>
      </div>
      
      <div className="bg-white px-5 py-4 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-500 font-bold tracking-wider mb-1">Late</p>
          <h3 className="text-2xl font-black text-gray-800 leading-none">
            {lateCount}
          </h3>
        </div>
        <div className="p-2 bg-amber-50 rounded-lg">
           <AlertTriangle className="w-5 h-5 text-amber-600" />
        </div>
      </div>

      <div className="bg-white px-5 py-4 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
        <div>
           <p className="text-xs text-gray-500 font-bold tracking-wider mb-1">Scans</p>
           <h3 className="text-2xl font-black text-gray-800 leading-none">{totalScans}</h3>
        </div>
        <div className="p-2 bg-blue-50 rounded-lg">
           <RefreshCw className="w-5 h-5 text-blue-600" />
        </div>
      </div>
    </div>
  );
};

export default MonitorStats;
