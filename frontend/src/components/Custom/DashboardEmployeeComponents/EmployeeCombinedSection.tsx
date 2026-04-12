import { useState, useCallback, useMemo, memo, useEffect } from 'react';
import { Calendar, Bell, LayoutDashboard, BarChart3, LucideIcon } from 'lucide-react';

import EventsAndHolidays from './EventsAndHolidays';
import AnnouncementSection from './AnnouncementSection';
import { PerformancePieChart } from '../../CustomUI';
import { fetchReviews, InternalReviewListResponse } from '../../../api/performanceApi';
import { InternalReview } from '../../../types/performance';
import { useAuth } from '../../../hooks/useAuth';

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
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Loading...</p>
    </div>
  </div>
));

LoadingOverlay.displayName = 'LoadingOverlay';

export default function EmployeeCombinedSection({ searchQuery = "" }: { searchQuery?: string }) {
  const [activeTab, setActiveTab] = useState('analytics');
  const [isLoading, setIsLoading] = useState(false);
  // @ts-ignore
  const { user } = useAuth();
  
  // Performance evaluation state - real data from API
  const [performanceData, setPerformanceData] = useState<InternalReview[] | null>(null);
  const [performanceLoading, setPerformanceLoading] = useState(true);

  // Fetch employee's own performance reviews
  useEffect(() => {
    const fetchMyPerformance = async () => {
      if (!user?.id) return;
      
      try {
        setPerformanceLoading(true);
        const response: InternalReviewListResponse = await fetchReviews({ employeeId: String(user.id) });
        
        if (response.success && response.reviews) {
            setPerformanceData(response.reviews);
        }
      } catch (error) {
        console.error("Failed to fetch my performance data:", error);
        setPerformanceData([]);
      } finally {
        setPerformanceLoading(false);
      }
    };

    fetchMyPerformance();
  }, [user?.id]);

  // Calculate distribution from reviews
  const distribution = useMemo(() => {
      if (!performanceData || !Array.isArray(performanceData)) return undefined;

      const dist: { outstanding: number; exceedsExpectations: number; meetsExpectations: number; needsImprovement: number; poorPerformance: number; totalRating: number } = {
        outstanding: 0,
        exceedsExpectations: 0,
        meetsExpectations: 0,
        needsImprovement: 0,
        poorPerformance: 0,
        totalRating: performanceData.length // Adding missing field
      };

      (performanceData as InternalReview[]).forEach((review: InternalReview) => {
        // Prioritize total_score, then fallbacks
        const score = review.totalScore !== undefined ? review.totalScore : 
                      (review.reviewerRatingScore !== undefined ? review.reviewerRatingScore : review.selfRatingScore);
        
        if (score !== null && score !== undefined) {
             const numericScore = Number(score);
             // Standard rounding for adjectival rating
             if (numericScore >= 4.5) dist.outstanding++;
             else if (numericScore >= 3.5) dist.exceedsExpectations++;
             else if (numericScore >= 2.5) dist.meetsExpectations++;
             else if (numericScore >= 1.5) dist.needsImprovement++;
             else dist.poorPerformance++;
        }
      });
      
      return dist;
  }, [performanceData]);

  const tabs: Tab[] = useMemo(() => [
    { id: 'analytics', label: 'Analytics & Updates', icon: BarChart3 },
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



  const analyticsContent = useMemo(() => (
    <>
      <div className="mb-6">
        <PerformancePieChart reportData={distribution} isLoading={performanceLoading} />
      </div>
      <div className="mb-6">
        <AnnouncementSection searchQuery={searchQuery} />
      </div>
    </>
  ), [distribution, performanceLoading, searchQuery]);

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
          {analyticsContent}
        </div>
      </div>
    </div>
  );
}
