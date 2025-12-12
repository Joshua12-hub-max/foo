import { useState, useEffect } from 'react';
import { Plus, Target, X } from 'lucide-react';
import {fetchDevelopmentPlans, createDevelopmentPlan, updateDevelopmentPlan, approveDevelopmentPlan, completeDevelopmentPlan, updateDevelopmentPlanProgress,fetchDevelopmentPlanStats,fetchEmployeesNeedingPDP,PROFICIENCY_LEVELS} from '../../api/spmsApi';
import { fetchEmployees } from '../../api/employeeApi';

const DevelopmentPlan = () => {
  const [plans, setPlans] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [employeesNeedingPDP, setEmployeesNeedingPDP] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [filters, setFilters] = useState({ status: '', department: '' });

  const [formData, setFormData] = useState({employee_id: '',cycle_id: 1,competency_gap: '',current_proficiency_level: 'Developing',target_proficiency_level: 'Proficient',development_objective: '',development_activities: '',resources_needed: '',start_date: '',target_completion_date: ''});

  const [progressData, setProgressData] = useState({progress_percentage: 0,progress_notes: ''});

  useEffect(() => {loadData();}, [filters]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [plansRes, employeesRes, statsRes, needingPDPRes] = await Promise.all([
        fetchDevelopmentPlans(filters),
        fetchEmployees(),
        fetchDevelopmentPlanStats(filters),
        fetchEmployeesNeedingPDP()
      ]);
      setPlans(plansRes.developmentPlans || []);
      setEmployees(employeesRes.employees || []);
      setStats(statsRes.stats || null);
      setEmployeesNeedingPDP(needingPDPRes.employees || []);
    } catch (error) {
      console.error('Error loading development plans:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (selectedPlan) {
        await updateDevelopmentPlan(selectedPlan.id, formData);
      } else {
        await createDevelopmentPlan(formData);
      }
      setShowModal(false);
      resetForm();
      loadData();
    } catch (error) {
      console.error('Error saving development plan:', error);
    }
  };

  const handleProgressUpdate = async (e) => {
    e.preventDefault();
    try {
      await updateDevelopmentPlanProgress(selectedPlan.id, progressData);
      setShowProgressModal(false);
      setProgressData({ progress_percentage: 0, progress_notes: '' });
      loadData();
    } catch (error) {
      console.error('Error updating progress:', error);
    }
  };

  const handleApprove = async (id) => {
    try {
      await approveDevelopmentPlan(id);
      loadData();
    } catch (error) {
      console.error('Error approving plan:', error);
    }
  };

  const handleComplete = async (id) => {
    if (window.confirm('Mark this development plan as completed?')) {
      try {
        await completeDevelopmentPlan(id, {});
        loadData();
      } catch (error) {
        console.error('Error completing plan:', error);
      }
    }
  };

  const resetForm = () => {setFormData({employee_id: '',cycle_id: 1,competency_gap: '',current_proficiency_level: 'Developing',target_proficiency_level: 'Proficient',development_objective: '',development_activities: '',resources_needed: '',start_date: '',target_completion_date: ''});setSelectedPlan(null);};

  const openEditModal = (plan) => {
    setSelectedPlan(plan);
    setFormData({
      employee_id: plan.employee_id,
      cycle_id: plan.cycle_id,
      competency_gap: plan.competency_gap,
      current_proficiency_level: plan.current_proficiency_level,
      target_proficiency_level: plan.target_proficiency_level,
      development_objective: plan.development_objective,
      development_activities: plan.development_activities || '',
      resources_needed: plan.resources_needed || '',
      start_date: plan.start_date?.split('T')[0] || '',
      target_completion_date: plan.target_completion_date?.split('T')[0] || ''
    });
    setShowModal(true);
  };

  const openProgressModal = (plan) => {
    setSelectedPlan(plan);
    setProgressData({
      progress_percentage: plan.progress_percentage || 0,
      progress_notes: ''
    });
    setShowProgressModal(true);
  };

  const getStatusBadge = (status) => {
    const colors = {
      'Draft': 'bg-gray-100 text-gray-800',
      'Pending Approval': 'bg-yellow-100 text-yellow-800',
      'Active': 'bg-blue-100 text-blue-800',
      'Completed': 'bg-green-100 text-green-800',
      'On Hold': 'bg-orange-100 text-orange-800',
      'Extended': 'bg-purple-100 text-purple-800',
      'Cancelled': 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-neutral-100 to-stone-50 rounded-xl shadow-xl p-7 w-full overflow-hidden text-gray-800">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Professional Development Plans</h1>
          <p className="text-sm text-gray-800 mt-1">Manage employee competency development and training</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowModal(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg shadow-md hover:bg-gray-300 transition-all font-medium"
        >
          <Plus size={18} /> Create Plan
        </button>
      </div>

      <hr className="mb-6 border-[1px] border-[#274b46]" />

      {/* Filters */}
      <div className="bg-[#F8F9FA] p-4 rounded-lg shadow-md mb-6">
        <div className="flex items-center gap-4">
          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className="bg-white border border-gray-200 rounded-lg shadow-sm px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-200 focus:border-gray-200 transition-all cursor-pointer"
          >
            <option value="">All Status</option>
            <option value="Draft">Draft</option>
            <option value="Active">Active</option>
            <option value="Completed">Completed</option>
            <option value="On Hold">On Hold</option>
          </select>
        </div>
      </div>

      {/* Plans List */}
      <div className="space-y-4">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading...</div>
        ) : plans.length === 0 ? (
          <div className="p-8 text-center text-gray-500 bg-white rounded-xl border border-gray-100 shadow-sm">No development plans found</div>
        ) : (
          plans.map(plan => (
            <div key={plan.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
              <div className="p-4 border-b border-gray-100 flex justify-between items-start">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                    <Target className="text-blue-600 text-xl" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-800">
                        {plan.employee_first_name} {plan.employee_last_name}
                      </h3>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${getStatusBadge(plan.status)}`}>
                        {plan.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500">{plan.employee_department} • {plan.cycle_title}</p>
                    <p className="text-gray-700 mt-1 text-sm">{plan.competency_gap}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {plan.status === 'Draft' && (
                    <button
                      onClick={() => handleApprove(plan.id)}
                      className="px-3 py-1.5 bg-green-100 text-green-700 rounded-lg text-sm font-medium hover:bg-green-200 transition-colors"
                    >
                      Approve
                    </button>
                  )}
                  {plan.status === 'Active' && (
                    <>
                      <button
                        onClick={() => openProgressModal(plan)}
                        className="px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
                      >
                        Update Progress
                      </button>
                      <button
                        onClick={() => handleComplete(plan.id)}
                        className="px-3 py-1.5 bg-green-100 text-green-700 rounded-lg text-sm font-medium hover:bg-green-200 transition-colors"
                      >
                        Complete
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => openEditModal(plan)}
                    className="px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
                  >
                    Edit
                  </button>
                </div>
              </div>
              <div className="p-4 bg-[#F8F9FA]">
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
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all"
                      style={{ width: `${plan.progress_percentage || 0}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg border-2 border-gray-200 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="bg-gray-200 shadow-md px-6 py-4 flex items-center justify-between rounded-t-xl border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-800">
                {selectedPlan ? 'Edit Development Plan' : 'Create Development Plan'}
              </h2>
              <button 
                onClick={() => setShowModal(false)} 
                className="text-gray-500 hover:text-red-800 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Form Content */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Employee</label>
                <select
                  value={formData.employee_id}
                  onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-200 transition-all"
                  required
                >
                  <option value="">Select Employee</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.first_name} {emp.last_name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Competency Gap / Performance Issue</label>
                <textarea
                  value={formData.competency_gap}
                  onChange={(e) => setFormData({ ...formData, competency_gap: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-200 transition-all resize-none"
                  rows={2}
                  placeholder=""
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Current Level</label>
                  <select
                    value={formData.current_proficiency_level}
                    onChange={(e) => setFormData({ ...formData, current_proficiency_level: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-200 transition-all"
                  >
                    {PROFICIENCY_LEVELS.map(level => (
                      <option key={level.value} value={level.value}>{level.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Target Level</label>
                  <select
                    value={formData.target_proficiency_level}
                    onChange={(e) => setFormData({ ...formData, target_proficiency_level: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-200 transition-all"
                  >
                    {PROFICIENCY_LEVELS.map(level => (
                      <option key={level.value} value={level.value}>{level.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Development Objective</label>
                <textarea
                  value={formData.development_objective}
                  onChange={(e) => setFormData({ ...formData, development_objective: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-200 transition-all resize-none"
                  rows={2}
                  placeholder=""
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Development Activities</label>
                <textarea
                  value={formData.development_activities}
                  onChange={(e) => setFormData({ ...formData, development_activities: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-200 transition-all resize-none"
                  rows={2}
                  placeholder=""
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-200 transition-all"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Target Completion</label>
                  <input
                    type="date"
                    value={formData.target_completion_date}
                    onChange={(e) => setFormData({ ...formData, target_completion_date: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-200 transition-all"
                    required
                  />
                </div>
              </div>

              {/* Footer Buttons */}
              <div className="flex gap-3 pt-4">
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)} 
                  className="flex-1 px-4 py-2 bg-[#F8F9FA] text-gray-700 font-medium rounded-lg shadow-md hover:text-red-800 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="flex-1 px-4 py-2 bg-[#F8F9FA] text-gray-700 font-medium rounded-lg shadow-md hover:text-green-800 transition-colors"
                >
                  {selectedPlan ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Progress Update Modal */}
      {showProgressModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md border-2 border-gray-200">
            {/* Header */}
            <div className="bg-gray-200 shadow-md px-6 py-4 flex items-center justify-between rounded-t-xl border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-800">Update Progress</h2>
              <button 
                onClick={() => setShowProgressModal(false)} 
                className="text-gray-500 hover:text-red-800 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Form Content */}
            <form onSubmit={handleProgressUpdate} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Progress: {progressData.progress_percentage}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={progressData.progress_percentage}
                  onChange={(e) => setProgressData({ ...progressData, progress_percentage: parseInt(e.target.value) })}
                  className="w-full accent-blue-600"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Progress Notes</label>
                <textarea
                  value={progressData.progress_notes}
                  onChange={(e) => setProgressData({ ...progressData, progress_notes: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-200 transition-all resize-none"
                  rows={3}
                  placeholder=""
                />
              </div>

              {/* Footer Buttons */}
              <div className="flex gap-3 pt-4">
                <button 
                  type="button" 
                  onClick={() => setShowProgressModal(false)} 
                  className="flex-1 px-4 py-2 bg-[#F8F9FA] text-gray-700 font-medium rounded-lg shadow-md hover:text-red-800 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="flex-1 px-4 py-2 bg-[#F8F9FA] text-gray-700 font-medium rounded-lg shadow-md hover:text-green-800 transition-colors"
                >
                  Update
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DevelopmentPlan;
