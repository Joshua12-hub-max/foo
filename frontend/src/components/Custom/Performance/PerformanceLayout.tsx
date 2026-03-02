import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useUIStore } from '@/stores';

interface PerformanceLayoutProps {
  children?: React.ReactNode;
  title?: string;
  subtitle?: string;
}

const PerformanceLayout: React.FC<PerformanceLayoutProps> = ({ children, title, subtitle }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const sidebarOpen = useUIStore((state) => state.sidebarOpen);

  const tabs = [
    { 
      id: 'evaluations', 
      label: 'Evaluations', 
      path: '/admin-dashboard/performance-reviews' 
    },
    { 
      id: 'criteria', 
      label: 'Criteria', 
      path: '/admin-dashboard/performance-criteria' 
    },
    { 
      id: 'cycles', 
      label: 'Cycles', 
      path: '/admin-dashboard/performance/cycles' 
    },
    { 
      id: 'history', 
      label: 'Evaluation History', 
      path: '/admin-dashboard/performance/history' 
    }
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className={`min-h-screen flex flex-col bg-gradient-to-br from-neutral-100 to-stone-50 rounded-xl shadow-xl p-7 w-full overflow-hidden text-gray-800 transition-all duration-300 ${sidebarOpen ? 'max-w-[1400px] xl:max-w-[77vw]' : 'max-w-[1600px] xl:max-w-[88vw]'}`}>
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
            <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
                Performance Management
            </h1>
            <p className="text-sm text-gray-800 mt-1">Monitor employee performance evaluations and status</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 mb-6 border-b border-gray-200 overflow-x-auto pb-1">
        {tabs.map((tab) => {
          const active = isActive(tab.path);
          return (
            <button
              key={tab.id}
              onClick={() => navigate(tab.path)}
              className={`flex items-center gap-2 px-4 py-2 rounded-t-lg font-medium text-sm transition-all whitespace-nowrap
                ${active 
                  ? 'bg-white border-x border-t border-gray-200 text-slate-900 shadow-sm relative top-[1px] font-black' 
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                }`}
            >
              {tab.label}
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

export default PerformanceLayout;
