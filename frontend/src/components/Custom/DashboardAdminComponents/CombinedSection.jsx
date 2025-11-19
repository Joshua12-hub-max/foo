import { useState, useCallback, useMemo, memo } from 'react';
import { BarChart3, Bell } from 'lucide-react';
import { AttendanceChart, PerformancePieChart, AnnouncementsList, EventsList } from "../../CustomUI";

// Memoized Tab Button Component-------ito yung Tabbutton ko or toggle button
const TabButton = memo(({ tab, isActive, isLoading, onClick }) => {
  const Icon = tab.icon;
  return (
    <button
      onClick={onClick}
      disabled={isLoading}
      className={`flex items-center gap-2 px-4 py-2.5 rounded-md text-sm font-semibold transition-all duration-300 ${
        isActive
          ? 'bg-[#F8F9FA] text-Gray-800 shadow-md'
          : 'text-[#274b46] hover:text-[#34645c]'
      } ${isLoading ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
    >
      <Icon className="w-4 h-4" />
      {tab.label}
    </button>
  );
});

TabButton.displayName = 'TabButton';

// Memoized Chart Card Component
const ChartCard = memo(({ title, children }) => (
  <div className="bg-[#F8F9FA] rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-lg transition-shadow">
    <h4 className="text-lg font-semibold text-slate-800 mb-4">{title}</h4>
    {children}
  </div>
));

ChartCard.displayName = 'ChartCard';

// Memoized Loading Overlay
const LoadingOverlay = memo(() => (
  <div className="absolute inset-0 flex items-center justify-center bg-[#F8F9FA] bg-opacity-40 rounded-2xl z-10">
    <div className="flex flex-col items-center gap-3">
      <div className="animate-spin rounded-full h-10 w-10 border-3 border-gray-200 border-t-blue-600"></div>
      <p className="text-sm font-medium text-gray-600">Loading...</p>
    </div>
  </div>
));

LoadingOverlay.displayName = 'LoadingOverlay';

export default function CombinedSection() {
  const [activeTab, setActiveTab] = useState('charts');
  const [isLoading, setIsLoading] = useState(false);

  // Memoized static data
  const attendanceData = useMemo(() => [
    { label: "Present", value: 85, color: "#79B791" }, // bg-green-700
    { label: "Absent", value: 10, color: "#7A0000" }, // bg-red-700
    { label: "Late", value: 3, color: "#CF9033" }, // bg-amber-600
    { label: "On Leave", value: 2, color: "#2C49" }, // bg-blue-700
  ], []);

  // Fixed: Updated to match PerformancePieChart expected structure
  const performanceData = useMemo(() => [
    {
      outstanding: 5,
      exceedsExpectations: 25,
      meetsExpectations: 50,
      needsImprovement: 15,
      poorPerformance: 5,
    }
  ], []);

  const announcements = useMemo(() => [
    { id: 1, title: 'Company Meeting', date: '2024-10-20', priority: 'high' },
    { id: 2, title: 'New Policy Update', date: '2024-10-18', priority: 'medium' },
    { id: 3, title: 'Holiday Notice', date: '2024-10-15', priority: 'low' },
  ], []);

  const events = useMemo(() => [
    { id: 1, title: 'Christmas Party', date: '2024-12-20', type: 'event' },
    { id: 2, title: 'New Year Holiday', date: '2024-12-31', type: 'holiday' },
    { id: 3, title: 'Team Building', date: '2024-11-15', type: 'event' },
  ], []);

  const tabs = useMemo(() => [
    { id: 'charts', label: 'Charts & Analytics', icon: BarChart3 },
    { id: 'announcements', label: 'Announcements & Events', icon: Bell },
  ], []);

  // Memoized tab change handler
  const handleTabChange = useCallback((tab) => {
    if (tab === activeTab) return;
    setIsLoading(true);

    // Use requestAnimationFrame for smoother transitions
    requestAnimationFrame(() => {
      setTimeout(() => {
        setActiveTab(tab);
        setIsLoading(false);
      }, 300);
    });
  }, [activeTab]);

  // Memoized content rendering
  const chartContent = useMemo(() => (
    <>
       <ChartCard title="Attendance Distribution">
        <AttendanceChart data={attendanceData} />
      </ChartCard>
      <ChartCard title="Employee Performance Evaluation">
        <PerformancePieChart reportData={performanceData} />
      </ChartCard>
    </>
  ), [attendanceData, performanceData]);

  const announcementContent = useMemo(() => (
    <>
      <ChartCard title="">
        <AnnouncementsList announcements={announcements} />
      </ChartCard>
      <ChartCard title="">
        <EventsList events={events} />
      </ChartCard>
    </>
  ), [announcements, events]);

  return (
    <div className="bg-[#F8F9FA] to-gray-50 rounded-2xl shadow-lg border border-gray-200 p-8 relative">
      {/* Header Section */}
      <div className="mb-8">
        <h3 className="text-2xl font-bold text-gray-800">Dashboard Overview</h3>
        <p className="text-sm text-gray-800 mt-1">Real-time metrics and important updates</p>
      </div>

      {/* Enhanced Tabs */}
      <div className="mb-8">
        <div className="flex space-x-2 bg-gray-100 rounded-lg p-1 w-fit">
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
      <div className={`transition-opacity duration-300 ${isLoading ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {activeTab === 'charts' ? chartContent : announcementContent}
        </div>
      </div>

      {/* Loading Overlay */}
      {isLoading && <LoadingOverlay />}
    </div>
  );
}