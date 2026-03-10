import { useState, useCallback, useMemo, memo, useEffect } from 'react';
import { BarChart3, Bell, LayoutDashboard, LucideIcon } from 'lucide-react';
import { PerformancePieChart, AnnouncementsList, EventsList, HolidaysList } from "../../CustomUI";
import { holidays, Holiday as HolidayData } from "../../../utils/holidays";
import { announcementApi } from '../../../api/announcementApi';
import { eventApi } from '../../../api/eventApi';
import { fetchRatingDistribution } from '../../../api/performanceApi';

interface ReportData {
  outstanding?: number;
  exceedsExpectations?: number;
  meetsExpectations?: number;
  needsImprovement?: number;
  poorPerformance?: number;
}

interface Tab {
  id: string;
  label: string;
  icon: LucideIcon;
}

interface TabButtonProps {
  tab: Tab;
  isActive: boolean;
  isLoading: boolean;
  onClick: () => void;
}

// Memoized Tab Button Component
const TabButton = memo(({ tab, isActive, isLoading, onClick }: TabButtonProps) => {
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

// Memoized Loading Overlay
const LoadingOverlay = memo(() => (
  <div className="absolute inset-0 flex items-center justify-center bg-white/60 rounded-2xl z-20 transition-all duration-300">
    <div className="flex flex-col items-center gap-3 bg-white p-6 rounded-2xl shadow-xl border border-gray-100">
      <div className="animate-spin rounded-full h-8 w-8 border-3 border-gray-100 border-t-blue-600"></div>
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Loading Data...</p>
    </div>
  </div>
));

LoadingOverlay.displayName = 'LoadingOverlay';

interface Announcement {
  id: number | string;
  title: string;
  content: string;
  priority: 'high' | 'medium' | 'low';
  date: string;
  startDate?: string;
  createdAt?: string;
}

interface Event {
  id: number | string;
  title: string;
  date: string;
  type: string;
  startDate?: string;
  description?: string | null;
}

export default function CombinedSection() {
  const [activeTab, setActiveTab] = useState('charts');
  const [isLoading, setIsLoading] = useState(false);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [upcomingHolidays, setUpcomingHolidays] = useState<Array<{ id: string; title: string; date: string; type: string; isHoliday: boolean }>>([]);
  
  // Performance evaluation state - real data from API
  const [performanceData, setPerformanceData] = useState<ReportData | null>(null);
  const [performanceLoading, setPerformanceLoading] = useState(true);

  useEffect(() => {
    const parseSafeDate = (d?: string | null) => {
      if (!d) return new Date(0);
      const date = new Date(d);
      return isNaN(date.getTime()) ? new Date(0) : date;
    };

    const fetchData = async () => {
      try {
        // Fetch Announcements
        const annResponse = await announcementApi.getAnnouncements();
        if (annResponse.data && annResponse.data.success) {
            const rawAnnouncements = annResponse.data.announcements as Announcement[];
            const formattedAnnouncements = rawAnnouncements.map((a) => {
                const baseDate = a.startDate || a.createdAt;
                const d = baseDate ? new Date(baseDate) : new Date();
                const validDate = isNaN(d.getTime()) ? new Date() : d;
                return {
                  ...a,
                  date: validDate.toISOString().split('T')[0]
                };
            });
            setAnnouncements(formattedAnnouncements);
        }

        // Fetch Events (API events only, not holidays)
        const eventResponse = await eventApi.getEvents();
        const apiEvents = (eventResponse.data && eventResponse.data.success) ? (eventResponse.data.events as Event[]) : [];
        
        // Get current year holidays separately
        const currentYear = new Date().getFullYear();
        const holidayEvents = holidays.map((h: HolidayData) => ({
            id: `holiday-${h.id}-${currentYear}`,
            title: h.title,
            date: new Date(currentYear, h.month, h.day).toISOString().split('T')[0],
            type: h.type,
            isHoliday: true
        }));

        // Filter for upcoming dates
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        // Filter and set events (only API events)
        const upcomingApiEvents = apiEvents
          .filter((e) => {
             const d = parseSafeDate(e.date || e.startDate);
             return d >= today;
          })
          .sort((a, b) => parseSafeDate(a.date || a.startDate).getTime() - parseSafeDate(b.date || b.startDate).getTime());
        setEvents(upcomingApiEvents.slice(0, 10));

        // Filter and set holidays
        const upcomingHolidayList = holidayEvents
          .filter(h => new Date(h.date) >= today)
          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        setUpcomingHolidays(upcomingHolidayList.slice(0, 10));

      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
      }
    };

    // Fetch performance rating distribution
    const fetchPerformanceData = async () => {
      try {
        setPerformanceLoading(true);
        const response = await fetchRatingDistribution();
        const data = response.data as Record<string, unknown>;
        if (data && 'distribution' in data) {
          setPerformanceData(data.distribution as ReportData);
        }
      } catch (error) {
        console.error("Failed to fetch performance data:", error);
        setPerformanceData(null);
      } finally {
        setPerformanceLoading(false);
      }
    };

    fetchData();
    fetchPerformanceData();
  }, []);

  const tabs: Tab[] = useMemo(() => [
    { id: 'charts', label: 'Analytics Overview', icon: BarChart3 },
    { id: 'announcements', label: 'Announcements & Events', icon: Bell },
  ], []);

  // Memoized tab change handler
  const handleTabChange = useCallback((tab: string) => {
    if (tab === activeTab) return;
    setIsLoading(true);
    requestAnimationFrame(() => {
      setTimeout(() => {
        setActiveTab(tab);
        setIsLoading(false);
      }, 400);
    });
  }, [activeTab]);

  // Memoized content rendering - No card wrappers, just content directly
  const chartContent = useMemo(() => (
    <>
      <div className="mb-6">
        <PerformancePieChart reportData={performanceData ?? undefined} isLoading={performanceLoading} />
      </div>
      <div className="mb-6">
        <HolidaysList holidays={upcomingHolidays} />
      </div>
    </>
  ), [performanceData, performanceLoading, upcomingHolidays]);

  // Announcements and Events together - No card wrappers
  const announcementContent = useMemo(() => (
    <>
      <div className="mb-6">
        <AnnouncementsList announcements={announcements} />
      </div>
      <div className="mb-6">
        <EventsList events={events} />
      </div>
    </>
  ), [announcements, events]);

  return (
    <div className="bg-gray-50/50 rounded-3xl p-8 relative transition-all duration-500">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
        <div>
          <div className="flex items-center gap-2 text-xl text-gray-900 mb-2">
            <LayoutDashboard className="w-5 h-5 text-gray-700 text-3xl font-bold" />
            <span className="text-xl font-bold tracking-wider">Dashboard Overview</span>
          </div>
          <p className="text-gray-800 mt-2 font-medium">Real-time metrics and updates</p>
        </div>

        {/* Enhanced Tabs */}
        <div className="bg-gray-200/50 p-1.5 rounded-2xl flex gap-2">
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
          {activeTab === 'charts' ? chartContent : announcementContent}
        </div>
      </div>
    </div>
  );
}
