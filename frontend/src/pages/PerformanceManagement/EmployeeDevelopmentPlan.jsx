import { useState, useEffect } from 'react';
import { Target, TrendingUp, Clock, CheckCircle, AlertCircle, Calendar } from 'lucide-react';
import { fetchMyDevelopmentPlans, PROFICIENCY_LEVELS } from '../../api/spmsApi';
import { useOutletContext } from 'react-router-dom';

const EmployeeDevelopmentPlan = () => {
  const outletContext = useOutletContext?.() || { sidebarOpen: true };
  const { sidebarOpen = true } = outletContext;
  
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState(null);

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetchMyDevelopmentPlans();
      setPlans(response.developmentPlans || []);
    } catch (err) {
      console.error('Error loading development plans:', err);
      setError('Failed to load development plans');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      'Draft': 'bg-gray-100 text-gray-800',
      'Pending Approval': 'bg-yellow-100 text-yellow-800',
      'Active': 'bg-blue-100 text-blue-800',
      'Completed': 'bg-green-100 text-green-800',
      'On Hold': 'bg-orange-100 text-orange-800',
      'Extended': 'bg-purple-100 text-purple-800',
      'Cancelled': 'bg-red-100 text-red-800'
    };
    return styles[status] || 'bg-gray-100 text-gray-800';
  };

  const getProgressColor = (percentage) => {
    if (percentage >= 75) return 'bg-green-500';
    if (percentage >= 50) return 'bg-blue-500';
    if (percentage >= 25) return 'bg-yellow-500';
    return 'bg-gray-400';
  };

  const activePlans = plans.filter(p => p.status === 'Active');
  const completedPlans = plans.filter(p => p.status === 'Completed');
  const avgProgress = plans.length > 0 
    ? Math.round(plans.reduce((sum, p) => sum + (p.progress_percentage || 0), 0) / plans.length) 
    : 0;

  const today = new Date().toLocaleDateString('en-US', { 
    year: 'numeric', month: 'long', day: 'numeric' 
  });

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-neutral-100 to-stone-50 rounded-xl shadow-xl p-7 w-full overflow-hidden text-gray-800">
      
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">My Development Plans</h1>
          <p className="text-sm text-gray-800 mt-1">Track your professional development and improvement progress</p>
        </div>
        <span className="text-sm text-gray-800 bg-white px-4 py-2 rounded-lg border border-gray-200 shadow-sm">
          Date today: <span className="font-semibold">{today}</span>
        </span>
      </div>

      <hr className="mb-6 border-[1px] border-[#274b46]" />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div>
            <p className="text-gray-500 text-sm font-medium uppercase">Total Plans</p>
            <p className="text-2xl font-bold text-gray-800">{plans.length}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div>
            <p className="text-gray-500 text-sm font-medium uppercase">Active Plans</p>
            <p className="text-2xl font-bold text-blue-600">{activePlans.length}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div>
            <p className="text-gray-500 text-sm font-medium uppercase">Completed</p>
            <p className="text-2xl font-bold text-green-600">{completedPlans.length}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div>
            <p className="text-gray-500 text-sm font-medium uppercase">Avg Progress</p>
            <p className="text-2xl font-bold text-gray-800">{avgProgress}%</p>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 rounded-lg text-red-700 flex items-center gap-2 border border-red-100 shadow-sm">
          <AlertCircle className="w-5 h-5" />
          <span>{error}</span>
        </div>
      )}

      {/* Plans List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-800"></div>
        </div>
      ) : plans.length === 0 ? (
        <div className="bg-white p-12 rounded-xl shadow-sm border border-gray-100 text-center">
          <Target className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-800 font-medium">No development plans found</p>
          <p className="text-sm text-gray-500 mt-1">Your supervisor will create development plans when needed</p>
        </div>
      ) : (
        <div className="space-y-4">
          {plans.map(plan => (
            <div key={plan.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow cursor-pointer" onClick={() => setSelectedPlan(plan)}>
              <div className="p-4">
                <div className="flex justify-between items-start">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                      <Target className="text-blue-600 w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-800">{plan.competency_gap}</h3>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${getStatusBadge(plan.status)}`}>
                          {plan.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">{plan.cycle_title}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500 uppercase font-semibold">Target Date</p>
                    <p className="text-sm font-medium text-gray-800">{plan.target_completion_date ? new Date(plan.target_completion_date).toLocaleDateString() : 'TBD'}</p>
                  </div>
                </div>
              </div>
              <div className="p-4 bg-[#F8F9FA] border-t border-gray-100">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-semibold">Objective</p>
                    <p className="text-sm text-gray-700">{plan.development_objective}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-semibold">Proficiency Target</p>
                    <p className="text-sm text-gray-700">{plan.current_proficiency_level} → {plan.target_proficiency_level}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-semibold">Timeline</p>
                    <p className="text-sm text-gray-700">
                      {plan.start_date && new Date(plan.start_date).toLocaleDateString()} - {plan.target_completion_date && new Date(plan.target_completion_date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                {/* Progress Bar */}
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600 font-medium">Progress</span>
                    <span className="font-bold text-gray-800">{plan.progress_percentage || 0}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className={`${getProgressColor(plan.progress_percentage || 0)} h-3 rounded-full transition-all`}
                      style={{ width: `${plan.progress_percentage || 0}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Plan Details Modal */}
      {selectedPlan && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setSelectedPlan(null)}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border-2 border-gray-200" onClick={e => e.stopPropagation()}>
            <div className="p-4 bg-gray-200 shadow-md flex justify-between items-center rounded-t-xl border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-800">Development Plan Details</h2>
              <button onClick={() => setSelectedPlan(null)} className="text-gray-500 hover:text-red-800 transition-colors text-xl">&times;</button>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusBadge(selectedPlan.status)}`}>
                  {selectedPlan.status}
                </span>
                <span className="text-sm text-gray-500 font-medium">{selectedPlan.cycle_title}</span>
              </div>

              <div>
                <p className="text-xs text-gray-500 uppercase font-bold mb-1">Competency Gap / Performance Issue</p>
                <p className="text-gray-700 bg-gray-50 p-3 rounded-lg border border-gray-100">{selectedPlan.competency_gap}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 uppercase font-bold">Current Level</p>
                  <p className="font-medium text-gray-800">{selectedPlan.current_proficiency_level}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase font-bold">Target Level</p>
                  <p className="font-medium text-green-600">{selectedPlan.target_proficiency_level}</p>
                </div>
              </div>

              <div>
                <p className="text-xs text-gray-500 uppercase font-bold mb-1">Development Objective</p>
                <p className="text-gray-700 bg-gray-50 p-3 rounded-lg border border-gray-100">{selectedPlan.development_objective}</p>
              </div>

              {selectedPlan.development_activities && (
                <div>
                  <p className="text-xs text-gray-500 uppercase font-bold mb-1">Development Activities</p>
                  <p className="text-gray-700 bg-gray-50 p-3 rounded-lg border border-gray-100">{selectedPlan.development_activities}</p>
                </div>
              )}

              {selectedPlan.resources_needed && (
                <div>
                  <p className="text-xs text-gray-500 uppercase font-bold mb-1">Resources Needed</p>
                  <p className="text-gray-700 bg-gray-50 p-3 rounded-lg border border-gray-100">{selectedPlan.resources_needed}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 uppercase font-bold">Start Date</p>
                  <p className="font-medium text-gray-800">{selectedPlan.start_date ? new Date(selectedPlan.start_date).toLocaleDateString() : 'TBD'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase font-bold">Target Completion</p>
                  <p className="font-medium text-gray-800">{selectedPlan.target_completion_date ? new Date(selectedPlan.target_completion_date).toLocaleDateString() : 'TBD'}</p>
                </div>
              </div>

              {/* Progress */}
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600 font-medium">Progress</span>
                  <span className="font-bold text-gray-800">{selectedPlan.progress_percentage || 0}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-4">
                  <div
                    className={`${getProgressColor(selectedPlan.progress_percentage || 0)} h-4 rounded-full transition-all`}
                    style={{ width: `${selectedPlan.progress_percentage || 0}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeDevelopmentPlan;
