import { useState, useEffect } from 'react';
import { Target, FileText, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { fetchEmployeeGoals, fetchReviews } from '../../../../api/performanceApi';

const ProfilePerformance = ({ profile }) => {
  const [goals, setGoals] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [goalsData, reviewsData] = await Promise.all([
          fetchEmployeeGoals(profile.id),
          fetchReviews() // In a real app, we'd filter by employee ID on the backend or here
        ]);

        if (goalsData.success) setGoals(goalsData.goals);
        
        // Filter reviews for this employee
        if (reviewsData.success) {
          const employeeReviews = reviewsData.reviews.filter(r => r.employee_first === profile.first_name && r.employee_last === profile.last_name);
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

  const getStatusColor = (status) => {
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
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
          <Target size={20} className="text-green-600" />
          Active Goals
        </h2>
        
        <div className="space-y-4">
          {goals.length > 0 ? (
            goals.map((goal) => (
              <div key={goal.id} className="p-4 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-gray-800">{goal.title}</h3>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(goal.status)}`}>
                    {goal.status}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-3">{goal.description}</p>
                
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Progress</span>
                    <span>{goal.progress}%</span>
                  </div>
                  <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-green-500 rounded-full transition-all duration-500"
                      style={{ width: `${goal.progress}%` }}
                    ></div>
                  </div>
                </div>
                
                <div className="flex justify-between items-center mt-3 text-xs text-gray-400">
                  <span className="flex items-center gap-1">
                    <Clock size={12} />
                    Due: {new Date(goal.due_date).toLocaleDateString()}
                  </span>
                  <span>Weight: {goal.weight}%</span>
                </div>
              </div>
            ))
          ) : (
            <p className="text-gray-500 text-center py-4">No active goals assigned.</p>
          )}
        </div>
      </div>

      {/* Reviews Section */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
          <FileText size={20} className="text-green-600" />
          Performance Reviews
        </h2>

        <div className="space-y-4">
          {reviews.length > 0 ? (
            reviews.map((review) => (
              <div key={review.id} className="flex items-center justify-between p-4 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-lg ${
                    review.status === 'Completed' ? 'bg-green-50 text-green-600' : 'bg-yellow-50 text-yellow-600'
                  }`}>
                    {review.status === 'Completed' ? <CheckCircle size={24} /> : <Clock size={24} />}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-800">{review.cycle_title || 'Performance Review'}</h3>
                    <p className="text-sm text-gray-500">
                      {new Date(review.review_period_start).toLocaleDateString()} - {new Date(review.review_period_end).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                
                <div className="text-right">
                  <p className="text-2xl font-bold text-gray-800">{review.total_score || '-'}<span className="text-sm text-gray-400 font-normal">/5</span></p>
                  <p className={`text-xs font-medium ${
                    review.status === 'Completed' ? 'text-green-600' : 'text-yellow-600'
                  }`}>
                    {review.status}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <p className="text-gray-500 text-center py-4">No performance reviews found.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfilePerformance;
