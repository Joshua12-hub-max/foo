import { useState, useEffect } from 'react';
import { Plus, BookOpen, Check, X, Calendar, Award, Clock } from 'lucide-react';
import {fetchTrainingNeeds, createTrainingNeed, updateTrainingNeed, approveTrainingNeed, scheduleTraining, completeTraining, deleteTrainingNeed, fetchTrainingStats, TRAINING_TYPES, PRIORITY_LEVELS} from '../../api/spmsApi';
import { fetchEmployees } from '../../api/employeeApi';

const TrainingNeeds = () => {
  const [trainings, setTrainings] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [stats, setStats] = useState(null);
  const [byType, setByType] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [selectedTraining, setSelectedTraining] = useState(null);
  const [filters, setFilters] = useState({ status: '', training_type: '', priority: '' });

  const [formData, setFormData] = useState({
    employee_id: '',
    training_type: 'Technical',
    training_title: '',
    training_description: '',
    training_provider: '',
    priority: 'Medium',
    is_mandatory: false,
    remarks: ''
  });

  const [scheduleData, setScheduleData] = useState({
    scheduled_date: '',
    training_provider: ''
  });

  const [completeData, setCompleteData] = useState({
    completion_date: '',
    post_training_assessment: '',
    effectiveness_rating: ''
  });

  useEffect(() => {
    loadData();
  }, [filters]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [trainingsRes, employeesRes, statsRes] = await Promise.all([
        fetchTrainingNeeds(filters),
        fetchEmployees(),
        fetchTrainingStats(filters)
      ]);
      setTrainings(trainingsRes.trainingNeeds || []);
      setEmployees(employeesRes.employees || []);
      setStats(statsRes.stats || null);
      setByType(statsRes.byType || []);
    } catch (error) {
      console.error('Error loading training needs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (selectedTraining) {
        await updateTrainingNeed(selectedTraining.id, formData);
      } else {
        await createTrainingNeed(formData);
      }
      setShowModal(false);
      resetForm();
      loadData();
    } catch (error) {
      console.error('Error saving training need:', error);
    }
  };

  const handleSchedule = async (e) => {
    e.preventDefault();
    try {
      await scheduleTraining(selectedTraining.id, scheduleData);
      setShowScheduleModal(false);
      setScheduleData({ scheduled_date: '', training_provider: '' });
      loadData();
    } catch (error) {
      console.error('Error scheduling training:', error);
    }
  };

  const handleComplete = async (e) => {
    e.preventDefault();
    try {
      await completeTraining(selectedTraining.id, completeData);
      setShowCompleteModal(false);
      setCompleteData({ completion_date: '', post_training_assessment: '', effectiveness_rating: '' });
      loadData();
    } catch (error) {
      console.error('Error completing training:', error);
    }
  };

  const handleApprove = async (id) => {
    try {
      await approveTrainingNeed(id);
      loadData();
    } catch (error) {
      console.error('Error approving training:', error);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this training recommendation?')) {
      try {
        await deleteTrainingNeed(id);
        loadData();
      } catch (error) {
        console.error('Error deleting training:', error);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      employee_id: '',
      training_type: 'Technical',
      training_title: '',
      training_description: '',
      training_provider: '',
      priority: 'Medium',
      is_mandatory: false,
      remarks: ''
    });
    setSelectedTraining(null);
  };

  const getStatusBadge = (status) => {
    const colors = {
      'Recommended': 'bg-yellow-100 text-yellow-800',
      'Approved': 'bg-blue-100 text-blue-800',
      'Scheduled': 'bg-purple-100 text-purple-800',
      'In Progress': 'bg-indigo-100 text-indigo-800',
      'Completed': 'bg-green-100 text-green-800',
      'Cancelled': 'bg-red-100 text-red-800',
      'Deferred': 'bg-gray-100 text-gray-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getPriorityBadge = (priority) => {
    const level = PRIORITY_LEVELS.find(p => p.value === priority);
    return level ? level.color : 'text-gray-600 bg-gray-100';
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-neutral-100 to-stone-50 rounded-xl shadow-xl p-7 w-full overflow-hidden text-gray-800">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Training & Development</h1>
          <p className="text-sm text-gray-800 mt-1">Manage employee training needs and interventions</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowModal(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg shadow-md hover:bg-gray-300 transition-all font-medium"
        >
          <Plus size={18} /> Add Training
        </button>
      </div>

      <hr className="mb-6 border-[1px] border-[#274b46]" />

      {/* Filters */}
      <div className="bg-[#F8F9FA] p-4 rounded-lg shadow-md mb-6">
        <div className="flex items-center gap-4 flex-wrap">
          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className="bg-white border border-gray-200 rounded-lg shadow-sm px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-200 focus:border-gray-200 transition-all cursor-pointer"
          >
            <option value="">All Status</option>
            <option value="Recommended">Recommended</option>
            <option value="Approved">Approved</option>
            <option value="Scheduled">Scheduled</option>
            <option value="Completed">Completed</option>
          </select>
          <select
            value={filters.training_type}
            onChange={(e) => setFilters({ ...filters, training_type: e.target.value })}
            className="bg-white border border-gray-200 rounded-lg shadow-sm px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-200 focus:border-gray-200 transition-all cursor-pointer"
          > 
            <option value="">All Types</option>
            {TRAINING_TYPES.map(type => (
              <option key={type.value} value={type.value}>{type.label}</option>
            ))}
          </select>
          <select
            value={filters.priority}
            onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
            className="bg-white border border-gray-200 rounded-lg shadow-sm px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-200 focus:border-gray-200 transition-all cursor-pointer"
          >
            <option value="">All Priority</option>
            {PRIORITY_LEVELS.map(level => (
              <option key={level.value} value={level.value}>{level.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Training Table */}
      <div className="bg-gray-50 rounded-lg scrollbar-bg-white shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-200 shadow-md text-gray-700">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-bold tracking-wide">Employee</th>
              <th className="px-6 py-4 text-left text-sm font-bold tracking-wide">Training</th>
              <th className="px-6 py-4 text-left text-sm font-bold tracking-wide">Type</th>
              <th className="px-6 py-4 text-left text-sm font-bold tracking-wide">Priority</th>
              <th className="px-6 py-4 text-left text-sm font-bold tracking-wide">Status</th>
              <th className="px-6 py-4 text-left text-sm font-bold tracking-wide">Scheduled</th>
              <th className="px-6 py-4 text-center text-sm font-bold tracking-wide">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr><td colSpan={7} className="px-6 py-12 text-center text-gray-500">Loading...</td></tr>
            ) : trainings.length === 0 ? (
              <tr><td colSpan={7} className="px-6 py-12 text-center text-gray-500">No training needs found</td></tr>
            ) : (
              trainings.map(training => (
                <tr key={training.id} className="hover:bg-[#F8F9FA] hover:shadow-xl transition-colors">
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-medium text-gray-800">{training.employee_first_name} {training.employee_last_name}</p>
                      <p className="text-xs text-gray-500">{training.employee_department}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <BookOpen className="text-gray-400" size={16} />
                      <div>
                        <p className="font-medium text-gray-800">{training.training_title}</p>
                        {training.training_provider && (
                          <p className="text-xs text-gray-500">{training.training_provider}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-medium border border-gray-200">{training.training_type}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getPriorityBadge(training.priority)}`}>
                      {training.priority}
                      {training.is_mandatory && ' (Mandatory)'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusBadge(training.status)}`}>
                      {training.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {training.scheduled_date ? (
                      <div className="flex items-center gap-1">
                        <Calendar className="text-gray-400" size={14} />
                        {new Date(training.scheduled_date).toLocaleDateString()}
                      </div>
                    ) : '-'}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center gap-2">
                      {training.status === 'Recommended' && (
                        <>
                          <button onClick={() => handleApprove(training.id)} className="p-1.5 bg-green-100 text-green-700 hover:bg-green-200 rounded-lg shadow-sm transition-all" title="Approve">
                            <Check size={16} />
                          </button>
                          <button onClick={() => handleDelete(training.id)} className="p-1.5 bg-red-100 text-red-700 hover:bg-red-200 rounded-lg shadow-sm transition-all" title="Delete">
                            <X size={16} />
                          </button>
                        </>
                      )}
                      {training.status === 'Approved' && (
                        <button onClick={() => { setSelectedTraining(training); setShowScheduleModal(true); }} className="px-3 py-1 text-xs border border-gray-300 rounded hover:bg-gray-50 transition-colors">
                          Schedule
                        </button>
                      )}
                      {(training.status === 'Scheduled' || training.status === 'In Progress') && (
                        <button onClick={() => { setSelectedTraining(training); setShowCompleteModal(true); }} className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition-colors">
                          Complete
                        </button>
                      )}
                      {training.status === 'Completed' && (
                        <div className="flex items-center gap-1 text-green-600 font-medium">
                          <Award size={16} />
                          {training.effectiveness_rating && <span className="text-sm">{training.effectiveness_rating}/5</span>}
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Create Training Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg border-2 border-gray-200 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="bg-gray-200 shadow-md px-6 py-4 flex items-center justify-between rounded-t-xl border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-800">Add Training Recommendation</h2>
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Training Title</label>
                <input
                  type="text"
                  value={formData.training_title}
                  onChange={(e) => setFormData({ ...formData, training_title: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-200 transition-all"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <select
                    value={formData.training_type}
                    onChange={(e) => setFormData({ ...formData, training_type: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-200 transition-all"
                  >
                    {TRAINING_TYPES.map(type => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-200 transition-all"
                  >
                    {PRIORITY_LEVELS.map(level => (
                      <option key={level.value} value={level.value}>{level.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={formData.training_description}
                  onChange={(e) => setFormData({ ...formData, training_description: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-200 transition-all resize-none"
                  rows={2}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Training Provider</label>
                <input
                  type="text"
                  value={formData.training_provider}
                  onChange={(e) => setFormData({ ...formData, training_provider: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-200 transition-all"
                />
              </div>

              <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
                <input
                  type="checkbox"
                  id="mandatory"
                  checked={formData.is_mandatory}
                  onChange={(e) => setFormData({ ...formData, is_mandatory: e.target.checked })}
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="mandatory" className="text-sm font-medium text-gray-700 select-none cursor-pointer">Mandatory Training</label>
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
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Schedule Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md border-2 border-gray-200">
            {/* Header */}
            <div className="bg-gray-200 shadow-md px-6 py-4 flex items-center justify-between rounded-t-xl border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-800">Schedule Training</h2>
              <button 
                onClick={() => setShowScheduleModal(false)} 
                className="text-gray-500 hover:text-red-800 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Form Content */}
            <form onSubmit={handleSchedule} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Scheduled Date</label>
                <input
                  type="date"
                  value={scheduleData.scheduled_date}
                  onChange={(e) => setScheduleData({ ...scheduleData, scheduled_date: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-200 transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Training Provider</label>
                <input
                  type="text"
                  value={scheduleData.training_provider}
                  onChange={(e) => setScheduleData({ ...scheduleData, training_provider: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-200 transition-all"
                />
              </div>

              {/* Footer Buttons */}
              <div className="flex gap-3 pt-4">
                <button 
                  type="button" 
                  onClick={() => setShowScheduleModal(false)} 
                  className="flex-1 px-4 py-2 bg-[#F8F9FA] text-gray-700 font-medium rounded-lg shadow-md hover:text-red-800 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="flex-1 px-4 py-2 bg-[#F8F9FA] text-gray-700 font-medium rounded-lg shadow-md hover:text-green-800 transition-colors"
                >
                  Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Complete Modal */}
      {showCompleteModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md border-2 border-gray-200">
            {/* Header */}
            <div className="bg-gray-200 shadow-md px-6 py-4 flex items-center justify-between rounded-t-xl border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-800">Complete Training</h2>
              <button 
                onClick={() => setShowCompleteModal(false)} 
                className="text-gray-500 hover:text-red-800 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Form Content */}
            <form onSubmit={handleComplete} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Completion Date</label>
                <input
                  type="date"
                  value={completeData.completion_date}
                  onChange={(e) => setCompleteData({ ...completeData, completion_date: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-200 transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Post-Training Assessment</label>
                <textarea
                  value={completeData.post_training_assessment}
                  onChange={(e) => setCompleteData({ ...completeData, post_training_assessment: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-200 transition-all resize-none"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Effectiveness Rating (1-5)</label>
                <select
                  value={completeData.effectiveness_rating}
                  onChange={(e) => setCompleteData({ ...completeData, effectiveness_rating: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-200 transition-all"
                >
                  <option value="">Select Rating</option>
                  <option value="5">5 - Excellent</option>
                  <option value="4">4 - Very Good</option>
                  <option value="3">3 - Good</option>
                  <option value="2">2 - Fair</option>
                  <option value="1">1 - Poor</option>
                </select>
              </div>

              {/* Footer Buttons */}
              <div className="flex gap-3 pt-4">
                <button 
                  type="button" 
                  onClick={() => setShowCompleteModal(false)} 
                  className="flex-1 px-4 py-2 bg-[#F8F9FA] text-gray-700 font-medium rounded-lg shadow-md hover:text-red-800 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="flex-1 px-4 py-2 bg-[#F8F9FA] text-gray-700 font-medium rounded-lg shadow-md hover:text-green-800 transition-colors"
                >
                  Complete
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TrainingNeeds;
