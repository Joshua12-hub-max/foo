import React from 'react';

interface MonitorHeaderProps {
  lastUpdated: Date;
}

const MonitorHeader: React.FC<MonitorHeaderProps> = ({ lastUpdated }) => {
  return (
    <div className="flex flex-col md:flex-row justify-between items-center bg-white px-5 py-4 rounded-xl shadow-sm border border-gray-100">
      <div>
        <h1 className="text-xl font-bold text-gray-900 leading-tight">Biometrics Monitoring</h1>
        <p className="text-xs text-gray-500 font-medium">Live attendance feed</p>
      </div>
      <div className="flex items-center gap-4">


        <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
          </span>
          <span className="text-xs font-bold text-gray-600 uppercase tracking-wider">Live</span>
        </div>
        <span className="text-xs text-gray-400 font-mono">
          {lastUpdated.toLocaleTimeString()}
        </span>
      </div>
    </div>
  );
};

export default MonitorHeader;
