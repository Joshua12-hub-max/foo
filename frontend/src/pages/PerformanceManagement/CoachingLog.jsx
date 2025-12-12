import { useState, useEffect } from 'react';
import { Plus, Calendar, User, Edit2, Check, X } from 'lucide-react';
import { fetchCoachingLogs, createCoachingLog, updateCoachingLog, completeCoachingSession, deleteCoachingLog, fetchCoachingStats, COACHING_TYPES } from '../../api/spmsApi';
import { fetchEmployees } from '../../api/employeeApi';

const CoachingLog = () => {
  const [coachingLogs, setCoachingLogs] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [selectedLog, setSelectedLog] = useState(null);
  const [filters, setFilters] = useState({ status: '', employee_id: '' });

  const [formData, setFormData] = useState({
    employee_id: '',
    coaching_date: '',
    coaching_type: 'Monthly Check-in',
    discussion_topics: '',
    agreed_actions: '',
    follow_up_date: '',
    supervisor_notes: ''
  });

  useEffect(() => {
    loadData();
  }, [filters]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [logsRes, employeesRes, statsRes] = await Promise.all([
        fetchCoachingLogs(filters),
        fetchEmployees(),
        fetchCoachingStats(filters)
      ]);
      setCoachingLogs(logsRes.coachingLogs || []);
      setEmployees(employeesRes.employees || []);
      setStats(statsRes.stats || null);
    } catch (error) {
      console.error('Error loading coaching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (selectedLog) {
        await updateCoachingLog(selectedLog.id, formData);
      } else {
        await createCoachingLog(formData);
      }
      setShowModal(false);
      resetForm();
      loadData();
    } catch (error) {
      console.error('Error saving coaching log:', error);
    }
  };

  const handleComplete = async (e) => {
    e.preventDefault();
    try {
      await completeCoachingSession(selectedLog.id, {
        discussion_topics: formData.discussion_topics,
        agreed_actions: formData.agreed_actions,
        supervisor_notes: formData.supervisor_notes
      });
      setShowCompleteModal(false);
      resetForm();
      loadData();
    } catch (error) {
      console.error('Error completing session:', error);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this coaching session?')) {
      try {
        await deleteCoachingLog(id);
        loadData();
      } catch (error) {
        console.error('Error deleting coaching log:', error);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      employee_id: '',
      coaching_date: '',
      coaching_type: 'Monthly Check-in',
      discussion_topics: '',
      agreed_actions: '',
      follow_up_date: '',
      supervisor_notes: ''
    });
    setSelectedLog(null);
  };

  const openEditModal = (log) => {
    setSelectedLog(log);
    setFormData({
      employee_id: log.employee_id,
      coaching_date: log.coaching_date?.split('T')[0] || '',
      coaching_type: log.coaching_type,
      discussion_topics: log.discussion_topics || '',
      agreed_actions: log.agreed_actions || '',
      follow_up_date: log.follow_up_date?.split('T')[0] || '',
      supervisor_notes: log.supervisor_notes || ''
    });
    setShowModal(true);
  };

  const openCompleteModal = (log) => {
    setSelectedLog(log);
    setFormData({
      ...formData,
      discussion_topics: log.discussion_topics || '',
      agreed_actions: log.agreed_actions || '',
      supervisor_notes: log.supervisor_notes || ''
    });
    setShowCompleteModal(true);
  };

  const getStatusBadge = (status) => {
    const colors = {
      'Scheduled': 'bg-blue-100 text-blue-800',
      'Completed': 'bg-green-100 text-green-800',
      'Rescheduled': 'bg-yellow-100 text-yellow-800',
      'Cancelled': 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-neutral-100 to-stone-50 rounded-xl shadow-xl p-7 w-full overflow-hidden text-gray-800">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Coaching Log</h1>
          <p className="text-sm text-gray-800 mt-1">Track employee coaching and mentoring sessions</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowModal(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg shadow-md hover:bg-gray-300 transition-all font-medium"
        >
          <Plus size={18} /> Schedule Session
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
            <option value="Scheduled">Scheduled</option>
            <option value="Completed">Completed</option>
            <option value="Cancelled">Cancelled</option>
          </select>
          <select
            value={filters.employee_id}
            onChange={(e) => setFilters({ ...filters, employee_id: e.target.value })}
            className="bg-white border border-gray-200 rounded-lg shadow-sm px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-200 focus:border-gray-200 transition-all cursor-pointer"
          >
            <option value="">All Employees</option>
            {employees.map(emp => (
              <option key={emp.id} value={emp.id}>{emp.first_name} {emp.last_name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-gray-50 rounded-lg scrollbar-bg-white shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-200 shadow-md text-gray-700">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-bold tracking-wide text-gray-700">Employee</th>
              <th className="px-6 py-4 text-left text-sm font-bold tracking-wide text-gray-700">Date</th>
              <th className="px-6 py-4 text-left text-sm font-bold tracking-wide text-gray-700">Type</th>
              <th className="px-6 py-4 text-left text-sm font-bold tracking-wide text-gray-700">Status</th>
              <th className="px-6 py-4 text-left text-sm font-bold tracking-wide text-gray-700">Supervisor</th>
              <th className="px-6 py-4 text-center text-sm font-bold tracking-wide text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr><td colSpan={6} className="px-6 py-12 text-center text-gray-500">Loading...</td></tr>
            ) : coachingLogs.length === 0 ? (
              <tr><td colSpan={6} className="px-6 py-12 text-center text-gray-500">No coaching sessions found</td></tr>
            ) : (
              coachingLogs.map(log => (
                <tr key={log.id} className="hover:bg-[#F8F9FA] hover:shadow-xl transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-gray-200 rounded-full text-gray-600">
                        <User size={16} />
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">{log.employee_first_name} {log.employee_last_name}</p>
                        <p className="text-xs text-gray-500">{log.employee_department}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <Calendar size={14} className="text-gray-400" />
                      {new Date(log.coaching_date).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{log.coaching_type}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusBadge(log.status)}`}>
                      {log.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{log.supervisor_first_name} {log.supervisor_last_name}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center gap-2">
                      {log.status === 'Scheduled' && (
                        <>
                          <button onClick={() => openCompleteModal(log)} className="p-1.5 bg-green-100 text-green-700 hover:bg-green-200 rounded-lg shadow-sm transition-all" title="Complete">
                            <Check size={16} />
                          </button>
                          <button onClick={() => openEditModal(log)} className="p-1.5 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded-lg shadow-sm transition-all" title="Edit">
                            <Edit2 size={16} />
                          </button>
                          <button onClick={() => handleDelete(log.id)} className="p-1.5 bg-red-100 text-red-700 hover:bg-red-200 rounded-lg shadow-sm transition-all" title="Delete">
                            <X size={16} />
                          </button>
                        </>
                      )}
                      {log.status === 'Completed' && (
                        <button onClick={() => openEditModal(log)} className="p-1.5 bg-gray-100 text-gray-600 hover:bg-gray-200 rounded-lg shadow-sm transition-all" title="View">
                          <Edit2 size={16} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
            {/* Header */}
            <div className="bg-gray-200 shadow-md px-6 py-3 flex items-center justify-between border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-800">
                {selectedLog ? 'Edit Coaching Session' : 'Schedule Coaching Session'}
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
              <div className="bg-gray-50 border border-gray-200 rounded-lg shadow-md p-4 space-y-3">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Employee</label>
                  <select
                    value={formData.employee_id}
                    onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-200 focus:border-transparent transition-all"
                    required
                  >
                    <option value="">Select Employee</option>
                    {employees.map(emp => (
                      <option key={emp.id} value={emp.id}>{emp.first_name} {emp.last_name}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Coaching Date</label>
                    <input
                      type="date"
                      value={formData.coaching_date}
                      onChange={(e) => setFormData({ ...formData, coaching_date: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-200 focus:border-transparent transition-all"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Type</label>
                    <select
                      value={formData.coaching_type}
                      onChange={(e) => setFormData({ ...formData, coaching_type: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-200 focus:border-transparent transition-all"
                      required
                    >
                      {COACHING_TYPES.map(type => (
                        <option key={type.value} value={type.value}>{type.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Discussion Topics</label>
                  <textarea
                    value={formData.discussion_topics}
                    onChange={(e) => setFormData({ ...formData, discussion_topics: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-200 focus:border-transparent transition-all resize-none"
                    rows={2}
                    placeholder="Topics to discuss during the session..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Follow-up Date</label>
                  <input
                    type="date"
                    value={formData.follow_up_date}
                    onChange={(e) => setFormData({ ...formData, follow_up_date: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-200 focus:border-transparent transition-all"
                  />
                </div>
              </div>

              {/* Footer Buttons */}
              <div className="flex gap-3 pt-2">
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)} 
                  className="flex-1 px-4 py-2 bg-[#F8F9FA] text-gray-700 font-medium rounded-lg shadow-md hover:bg-gray-100 hover:text-red-800 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="flex-1 px-4 py-2 bg-[#F8F9FA] text-gray-700 font-medium rounded-lg shadow-md border-2 border-transparent hover:text-green-800 transition-colors"
                >
                  {selectedLog ? 'Update' : 'Schedule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Complete Session Modal */}
      {showCompleteModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
            {/* Header */}
            <div className="bg-gray-200 shadow-md px-6 py-3 flex items-center justify-between border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-800">Complete Coaching Session</h2>
              <button 
                onClick={() => setShowCompleteModal(false)} 
                className="text-gray-500 hover:text-red-800 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Form Content */}
            <form onSubmit={handleComplete} className="p-6 space-y-4">
              <div className="bg-gray-50 border border-gray-200 rounded-lg shadow-md p-4 space-y-3">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Discussion Topics</label>
                  <textarea
                    value={formData.discussion_topics}
                    onChange={(e) => setFormData({ ...formData, discussion_topics: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-200 focus:border-transparent transition-all resize-none"
                    rows={2}
                    placeholder="What was discussed during the session..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Agreed Actions</label>
                  <textarea
                    value={formData.agreed_actions}
                    onChange={(e) => setFormData({ ...formData, agreed_actions: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-200 focus:border-transparent transition-all resize-none"
                    rows={2}
                    placeholder="Action items agreed upon..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Supervisor Notes</label>
                  <textarea
                    value={formData.supervisor_notes}
                    onChange={(e) => setFormData({ ...formData, supervisor_notes: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-200 focus:border-transparent transition-all resize-none"
                    rows={2}
                    placeholder="Additional observations and recommendations..."
                  />
                </div>
              </div>

              {/* Footer Buttons */}
              <div className="flex gap-3 pt-2">
                <button 
                  type="button" 
                  onClick={() => setShowCompleteModal(false)} 
                  className="flex-1 px-4 py-2 bg-[#F8F9FA] text-gray-700 font-medium rounded-lg shadow-md hover:bg-gray-100 hover:text-red-800 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="flex-1 px-4 py-2 bg-[#F8F9FA] text-gray-700 font-medium rounded-lg shadow-md border-2 border-transparent hover:text-green-800 transition-colors"
                >
                  Complete Session
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CoachingLog;
