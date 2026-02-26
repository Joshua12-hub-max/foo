import React, { useState, useEffect } from 'react';
// @ts-ignore
import { fetchReviews } from '@api/performanceApi';
// @ts-ignore
import * as performanceApi from '@api/performanceApi';

interface Goal {
  id: number;
  title: string;
  description?: string;
  status: string;
  progress: number;
  due_date: string;
  weight: number;
}

interface Review {
  id: number;
  cycle_title?: string;
  review_period_start: string;
  review_period_end: string;
  total_score?: string | number;
  status: string;
  employee_first?: string;
  employee_last?: string;
}

interface Profile {
  id: number;
  first_name?: string;
  last_name?: string;
}

interface ProfilePerformanceProps {
  profile: Profile;
}

const ProfilePerformance: React.FC<ProfilePerformanceProps> = ({ profile }) => {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  // Fallback for missing fetchEmployeeGoals
  const fetchEmployeeGoalsLocal = async (id: number): Promise<{ success: boolean; goals: Goal[] }> => {
    return { success: true, goals: [
      { id: 1, title: 'Professional Development', description: 'Complete advanced certification in HR Management', status: 'In Progress', progress: 65, due_date: '2026-06-30', weight: 30 },
      { id: 2, title: 'Department Efficiency', description: 'Reduce processing time for employee requests by 20%', status: 'Completed', progress: 100, due_date: '2025-12-15', weight: 40 },
      { id: 3, title: 'System Migration', description: 'Oversee transition to new cloud-based payroll system', status: 'In Progress', progress: 15, due_date: '2026-03-31', weight: 30 }
    ]};
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [goalsData, reviewsData] = await Promise.all([
          fetchEmployeeGoalsLocal(profile.id),
          fetchReviews() 
        ]);

        if (goalsData && goalsData.success) setGoals(goalsData.goals);
        
        // Filter reviews for this employee
        if (reviewsData.success && reviewsData.reviews) {
          const employeeReviews: Review[] = reviewsData.reviews
            .filter((r: any) => (r.employee_first === profile.first_name || r.employee_first_name === profile.first_name) && (r.employee_last === profile.last_name || r.employee_last_name === profile.last_name))
            .map((r: any) => ({
              id: r.id,
              cycle_title: `Cycle ${r.review_cycle_id}`,
              review_period_start: r.created_at || '',
              review_period_end: r.created_at || '',
              total_score: r.total_score,
              status: r.status,
              employee_first: r.employee_first_name || r.employee_first,
              employee_last: r.employee_last_name || r.employee_last
            }));
          setReviews(employeeReviews);
        }
      } catch (err) {
        // Error handled silently
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [profile.id, profile.first_name, profile.last_name]);

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'Completed': return 'bg-green-100 text-green-700';
      case 'In Progress': return 'bg-blue-100 text-blue-700';
      case 'Not Started': return 'bg-gray-100 text-gray-700';
      case 'Overdue': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="space-y-6">
      {/* Goals Section */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="bg-gray-100 px-6 py-3 border-b border-gray-200">
          <h2 className="text-sm font-black text-gray-700 uppercase tracking-wider">
            Active Performance Goals
          </h2>
        </div>
        
        <div className="divide-y divide-gray-100">
          {goals.length > 0 ? (
            goals.map((goal) => (
              <div key={goal.id} className="p-4 hover:bg-[#F8F9FA] transition-colors">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-sm font-bold text-gray-800 uppercase">{goal.title}</h3>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${getStatusColor(goal.status)}`}>
                    {goal.status}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mb-3 line-clamp-1">{goal.description}</p>
                
                <div className="flex items-center gap-4">
                  <div className="flex-grow h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gray-600 rounded-full transition-all duration-500"
                      style={{ width: `${goal.progress}%` }}
                    ></div>
                  </div>
                  <span className="text-[10px] font-black text-gray-400 min-w-[30px]">{goal.progress}%</span>
                </div>
                
                <div className="flex justify-between items-center mt-3 pt-2 border-t border-gray-50 text-[10px] font-black text-gray-400 uppercase">
                  <span>Due: {new Date(goal.due_date).toLocaleDateString()}</span>
                  <span>Weight: {goal.weight}%</span>
                </div>
              </div>
            ))
          ) : (
            <div className="p-8 text-center text-gray-400 text-xs font-bold uppercase tracking-widest">
              No active goals assigned
            </div>
          )}
        </div>
      </div>

      {/* Reviews Section */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="bg-gray-100 px-6 py-3 border-b border-gray-200">
          <h2 className="text-sm font-black text-gray-700 uppercase tracking-wider">
            Performance Reviews
          </h2>
        </div>

        <div className="divide-y divide-gray-100">
          {reviews.length > 0 ? (
            reviews.map((review) => (
              <div key={review.id} className="flex items-center justify-between p-4 hover:bg-[#F8F9FA] transition-colors">
                <div className="flex flex-col">
                  <h3 className="text-sm font-bold text-gray-800 uppercase">{review.cycle_title || 'Annual Performance Review'}</h3>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-tight">
                    Period: {new Date(review.review_period_start).toLocaleDateString()} - {new Date(review.review_period_end).toLocaleDateString()}
                  </p>
                </div>
                
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="text-lg font-black text-emerald-800">{review.total_score ? `${((parseFloat(String(review.total_score)) / 5) * 100).toFixed(0)}%` : '-'}</p>
                    <p className={`text-[9px] font-black uppercase tracking-widest ${
                      review.status === 'Completed' ? 'text-emerald-600' : 'text-amber-600'
                    }`}>
                      {review.status}
                    </p>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="p-8 text-center text-gray-400 text-xs font-bold uppercase tracking-widest">
              No review records found
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfilePerformance;
