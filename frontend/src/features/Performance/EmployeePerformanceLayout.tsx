import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useUIStore } from '@/stores';

interface EmployeePerformanceLayoutProps {
  children?: React.ReactNode;
}

const EmployeePerformanceLayout: React.FC<EmployeePerformanceLayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const sidebarOpen = useUIStore((state) => state.sidebarOpen);

  const tabs = [
    { name: 'Reviews', path: '/employee-dashboard/performance' },
  ];

  const isActive = (path: string) => {
    // Handle exact match for root path and sub-paths correctly
    if (path === '/employee-dashboard/performance') {
        return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className={`min-h-screen flex flex-col bg-gradient-to-br from-neutral-100 to-stone-50 rounded-xl shadow-xl p-7 w-full overflow-hidden text-gray-800 transition-all duration-300 ${sidebarOpen ? 'max-w-[1400px] xl:max-w-[77vw]' : 'max-w-[1600px] xl:max-w-[88vw]'}`}>
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
            <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
                Performance
            </h1>
            <p className="text-sm text-gray-800 mt-1">View and manage your performance evaluations</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 mb-6 border-b border-gray-200 overflow-x-auto pb-1">
        {tabs.map((tab) => {
          const active = isActive(tab.path);
          return (
            <button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              className={`flex items-center gap-2 px-4 py-2 rounded-t-lg font-medium text-sm transition-all whitespace-nowrap
                ${active 
                  ? 'bg-white border-x border-t border-gray-200 text-gray-900 font-bold shadow-sm relative top-[1px]' 
                  : 'text-gray-400 hover:text-gray-800 hover:bg-gray-50'
                }`}
            >
              {tab.name}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className="flex-1">
        {children}
      </div>
    </div>
  );
};

export default EmployeePerformanceLayout;
