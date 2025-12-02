import { useState, useCallback, useMemo, memo } from 'react';
import { Calendar, Bell, LayoutDashboard, BarChart3 } from 'lucide-react';
import ScheduleSection from '../DashboardEmployeeComponents/ScheduleSection';
import EventsAndHolidays from '../DashboardEmployeeComponents/EventsAndHolidays';
import AnnouncementSection from '../DashboardEmployeeComponents/AnnouncementSection';
import { PerformancePieChart } from '../../CustomUI';

// Memoized Tab Button Component
const TabButton = memo(({ tab, isActive, isLoading, onClick }) => {
  const Icon = tab.icon;
  return (
    <button
      onClick={onClick}
      disabled={isLoading}
      className={`relative flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 outline-none focus:ring-2 focus:ring-blue-100 ${
        isActive
          ? 'bg-white text-gray-800 shadow-sm ring-1 ring-gray-100'
          : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
      } ${isLoading ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'}`}
    >
      <Icon className={`w-4 h-4 transition-colors ${isActive ? 'text-gray-800' : 'text-gray-400'}`} />
      {tab.label}
      {isActive && (
        <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1/2 h-0.5 bg-gray-800 rounded-full mb-1.5 opacity-0" />
      )}
    </button>
  );
});

TabButton.displayName = 'TabButton';

// Memoized Card Component
const Card = memo(({ title, children, className = "" }) => (
  <div className={`bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300 ${className}`}>
     {title && (
      <h4 className="text-lg font-semibold text-gray-800 mb-6 flex items-center gap-2">
        <div className="w-1 h-6 bg-gray-700 rounded-full"></div>
        {title}
      </h4>
    )}
    {children}
  </div>
));

Card.displayName = 'Card';

// Memoized Loading Overlay
const LoadingOverlay = memo(() => (
  <div className="absolute inset-0 flex items-center justify-center bg-white/60 backdrop-blur-[2px] rounded-2xl z-20 transition-all duration-300">
    <div className="flex flex-col items-center gap-3 bg-white p-6 rounded-2xl shadow-xl border border-gray-100">
      <div className="animate-spin rounded-full h-8 w-8 border-3 border-gray-100 border-t-blue-600"></div>
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Loading...</p>
    </div>
  </div>
));

LoadingOverlay.displayName = 'LoadingOverlay';

export default function EmployeeCombinedSection() {
  const [activeTab, setActiveTab] = useState('analytics');
  const [isLoading, setIsLoading] = useState(false);

  const tabs = useMemo(() => [
    { id: 'analytics', label: 'Analytics & Updates', icon: BarChart3 },
    { id: 'schedule', label: 'Schedule & Events', icon: Calendar },
  ], []);

  // Mock performance data for the employee
  const performanceData = useMemo(() => [
    {
      outstanding: 2,
      exceedsExpectations: 5,
      meetsExpectations: 8,
      needsImprovement: 1,
      poorPerformance: 0,
    }
  ], []);

  // Memoized tab change handler
  const handleTabChange = useCallback((tab) => {
    if (tab === activeTab) return;
    setIsLoading(true);
    requestAnimationFrame(() => {
      setTimeout(() => {
        setActiveTab(tab);
        setIsLoading(false);
      }, 400);
    });
  }, [activeTab]);

  // Memoized content rendering
  const scheduleContent = useMemo(() => (
    <>
      <ScheduleSection />
      <EventsAndHolidays />
    </>
  ), []);

  const analyticsContent = useMemo(() => (
    <>
      <Card title="My Performance Evaluation">
        <PerformancePieChart reportData={performanceData} />
      </Card>
      <AnnouncementSection />
    </>
  ), [performanceData]);

  return (
    <div className="bg-gray-50/50 rounded-3xl p-8 relative transition-all duration-500">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
        <div>
          <div className="flex items-center gap-2 text-xl text-gray-900 mb-2">
            <LayoutDashboard className="w-5 h-5 text-gray-700 text-3xl font-bold" />
            <span className="text-xl font-bold tracking-wider">Dashboard Overview</span>
          </div>
          <p className="text-gray-800 mt-2 font-medium">Manage your time and stay updated</p>
        </div>

        {/* Enhanced Tabs */}
        <div className="bg-gray-200/50 p-1.5 rounded-2xl flex gap-2 backdrop-blur-sm">
          {tabs.map((tab) => (
            <TabButton
              key={tab.id}
              tab={tab}
              isActive={activeTab === tab.id}
              isLoading={isLoading}
              onClick={() => handleTabChange(tab.id)}
            />
          ))}
        </div>
      </div>

      {/* Content Section */}
      <div className="relative min-h-[400px]">
        {isLoading && <LoadingOverlay />}
        <div
          className={`grid grid-cols-1 lg:grid-cols-2 gap-6 transition-all duration-500 ease-out ${
            isLoading ? 'opacity-0 scale-[0.98] translate-y-4' : 'opacity-100 scale-100 translate-y-0'
          }`}
        >
          {activeTab === 'schedule' && scheduleContent}
          {activeTab === 'analytics' && analyticsContent}
        </div>
      </div>
    </div>
  );
}
