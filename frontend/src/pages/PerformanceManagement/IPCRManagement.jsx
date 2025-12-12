import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  User, Plus, FileText, CheckCircle, Clock, Send, 
  Eye, Trash2, RefreshCw, Search, Briefcase
} from 'lucide-react';
import { fetchIPCRs, createIPCR, deleteIPCR, commitIPCR, submitIPCRForRating, approveIPCR, finalizeIPCR, fetchCycles } from '../../api/spmsApi';
import { fetchEmployees } from '../../api/employeeApi';
import { useAuth } from '../../hooks/useAuth';

const statusColors = {
  'Draft': 'bg-gray-100 text-gray-700',
  'Committed': 'bg-blue-100 text-blue-700',
  'For Rating': 'bg-amber-100 text-amber-700',
  'Rated': 'bg-purple-100 text-purple-700',
  'Acknowledged': 'bg-indigo-100 text-indigo-700',
  'Approved': 'bg-green-100 text-green-700',
  'Final': 'bg-emerald-100 text-emerald-800'
};

const IPCRManagement = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [ipcrs, setIpcrs] = useState([]);
  const [cycles, setCycles] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedCycle, setSelectedCycle] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Filter states
  const [filterStatus, setFilterStatus] = useState('');

  useEffect(() => {
    loadData();
  }, [selectedCycle, filterStatus]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      const filters = {};
      if (selectedCycle) filters.cycle_id = selectedCycle;
      if (filterStatus) filters.status = filterStatus;

      const [ipcrRes, cyclesRes, empRes] = await Promise.all([
        fetchIPCRs(filters),
        fetchCycles(),
        fetchEmployees()
      ]);

      if (ipcrRes.success) setIpcrs(ipcrRes.ipcrs);
      if (cyclesRes.success) setCycles(cyclesRes.cycles);
      if (empRes.success) setEmployees(empRes.employees);
      
    } catch (error) {
      console.error("Failed to load IPCR data", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (data) => {
    try {
      setIsProcessing(true);
      // If admin, they can create for others. If employee, typically for themselves.
      // But verifyAdmin on backend might require admin intervention.
      // We will assume data contains { employee_id, cycle_id, rater_id, approver_id }
      const result = await createIPCR(data);
      if (result.success) {
        setShowCreateModal(false);
        loadData();
        // Optionally navigate to edit view immediately
        // navigate(`/admin-dashboard/ipcr/${result.ipcrId}`);
      } else {
        alert(result.message || 'Failed to create IPCR');
      }
    } catch (error) {
      alert('Error creating IPCR');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleWorkflowAction = async (id, action) => {
    try {
      setIsProcessing(true);
      let result;
      switch (action) {
        case 'commit': result = await commitIPCR(id); break;
        case 'submit': result = await submitIPCRForRating(id); break;
        case 'approve': result = await approveIPCR(id, { approver_remarks: 'Approved via Dashboard' }); break;
        case 'finalize': result = await finalizeIPCR(id); break;
        default: break;
      }
      if (result?.success) {
        loadData();
      } else {
        alert(result?.message || 'Action failed');
      }
    } catch (error) {
      console.error(error);
      alert('Workflow action error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this IPCR? This cannot be undone.')) return;
    try {
      const result = await deleteIPCR(id);
      if (result.success) loadData();
      else alert(result.message);
    } catch (error) {
      alert('Delete failed');
    }
  };

  const filteredIPCRs = ipcrs.filter(i => {
    const searchLower = searchTerm.toLowerCase();
    return (
      i.employee_first_name?.toLowerCase().includes(searchLower) ||
      i.employee_last_name?.toLowerCase().includes(searchLower) ||
      i.cycle_title?.toLowerCase().includes(searchLower) ||
      i.employee_department?.toLowerCase().includes(searchLower)
    );
  });

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Draft': return <FileText size={14} />;
      case 'Committed': return <CheckCircle size={14} />;
      case 'For Rating': return <Send size={14} />;
      case 'Rated': return <Clock size={14} />;
      case 'Acknowledged': return <CheckCircle size={14} />;
      case 'Approved': case 'Final': return <CheckCircle size={14} />;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-neutral-100 to-stone-50 rounded-xl shadow-xl p-7 w-full overflow-hidden text-gray-800">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">IPCR Management</h1>
          <p className="text-sm text-gray-800 mt-1">Individual Performance Commitment & Review</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-800 border border-gray-200 rounded-lg shadow-md hover:bg-gray-300 transition-all font-medium"
        >
          <Plus size={18} />
          Create IPCR
        </button>
      </div>

      <hr className="mb-6 border-[1px] border-[#274b46]" />

      {/* Filters */}
      <div className="bg-[#F8F9FA] p-4 rounded-lg shadow-md mb-6">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border border-gray-200 shadow-sm focus-within:ring-2 focus-within:ring-gray-200 focus-within:border-gray-200 transition-all">
              <Search size={18} className="text-gray-400" />
              <input
                type="text"
                placeholder="Search employee, department..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 bg-transparent border-none outline-none text-sm text-gray-700 placeholder-gray-400"
              />
            </div>
          </div>
          <select
            value={selectedCycle}
            onChange={(e) => setSelectedCycle(e.target.value)}
            className="px-3 py-2 bg-white border border-gray-200 rounded-lg shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-gray-200 focus:border-gray-200 hover:border-gray-200 transition-all cursor-pointer"
          >
            <option value="">All Cycles</option>
            {cycles.map(c => (
              <option key={c.id} value={c.id}>{c.title} ({c.year})</option>
            ))}
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 bg-white border border-gray-200 rounded-lg shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-gray-200 focus:border-gray-200 hover:border-gray-200 transition-all cursor-pointer"
          >
            <option value="">All Statuses</option>
            {Object.keys(statusColors).map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <button onClick={loadData} className="p-2 bg-gray-200 text-gray-600 rounded-lg hover:bg-gray-300 shadow-sm transition-all">
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* IPCR List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full text-center py-12 flex flex-col items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-800 mb-3"></div>
            <span className="text-gray-500">Loading...</span>
          </div>
        ) : filteredIPCRs.length === 0 ? (
          <div className="col-span-full text-center py-12 text-gray-500 bg-white rounded-xl border border-gray-100 shadow-sm">
            No IPCRs found.
          </div>
        ) : (
          filteredIPCRs.map(ipcr => (
            <div key={ipcr.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-xl transition-shadow flex flex-col h-full">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-sm shadow-inner">
                    {ipcr.employee_first_name?.[0]}{ipcr.employee_last_name?.[0]}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800">{ipcr.employee_first_name} {ipcr.employee_last_name}</h3>
                    <p className="text-xs text-gray-500">{ipcr.employee_job_title || 'Employee'}</p>
                  </div>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 border ${statusColors[ipcr.status] || 'bg-gray-100'}`}>
                  {getStatusIcon(ipcr.status)}
                  {ipcr.status}
                </span>
              </div>

              <div className="space-y-2 mb-4 flex-grow">
                 <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Briefcase size={14} className="text-gray-400"/>
                    <span className="truncate">{ipcr.employee_department}</span>
                 </div>
                 <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Clock size={14} className="text-gray-400"/>
                    <span>{ipcr.cycle_title} ({ipcr.cycle_year})</span>
                 </div>
                 {ipcr.final_average_rating && (
                   <div className="mt-2 p-2 bg-gray-50 rounded-lg border border-gray-100 text-center">
                     <span className="text-lg font-bold text-gray-800">{ipcr.final_average_rating}</span>
                     <span className="text-xs text-gray-500 block">{ipcr.adjectival_rating}</span>
                   </div>
                 )}
              </div>

              <div className="flex gap-2 mt-auto pt-3 border-t border-gray-50">
                <button
                  onClick={() => navigate(`/admin-dashboard/ipcr/${ipcr.id}`)}
                  className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium shadow-md hover:bg-gray-300 hover:text-blue-800 transition-all"
                >
                  <Eye size={14} /> View
                </button>
                
                {ipcr.status === 'Draft' && (
                  <>
                     <button
                      onClick={() => handleDelete(ipcr.id)}
                      className="p-2 text-gray-600 bg-gray-200 hover:bg-gray-300 hover:text-red-800 rounded-lg shadow-md transition-all"
                    >
                      <Trash2 size={14} />
                    </button>
                  </>
                )}
                 {ipcr.status === 'Approved' && (
                  <button
                    onClick={() => handleWorkflowAction(ipcr.id, 'finalize')}
                    disabled={isProcessing}
                    className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium shadow-md hover:bg-gray-300 hover:text-purple-800 transition-all"
                  >
                    Finalize
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <CreateIPCRModal
          cycles={cycles}
          employees={employees}
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreate}
          isProcessing={isProcessing}
        />
      )}
    </div>
  );
};

// Create IPCR Modal
const CreateIPCRModal = ({ cycles, employees, onClose, onSubmit, isProcessing }) => {
  const [formData, setFormData] = useState({
    employee_id: '',
    rater_id: '',
    approver_id: '',
    cycle_id: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  // Filter out admins/hr if needed, or just show all
  const employeeOptions = employees.sort((a,b) => a.last_name.localeCompare(b.last_name));

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-lg shadow-2xl overflow-hidden">
        <div className="bg-gray-200 shadow-md px-6 py-3 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-800">Initialize New IPCR</h2>
          <p className="text-xs text-gray-600">Create a blank IPCR for an employee.</p>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="bg-gray-50 border border-gray-200 rounded-lg shadow-md p-4 space-y-3">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Performance Cycle *</label>
              <select
                required
                value={formData.cycle_id}
                onChange={(e) => setFormData({ ...formData, cycle_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-200 focus:border-transparent outline-none transition-all"
              >
                <option value="">Select Cycle</option>
                {cycles.map(c => (
                  <option key={c.id} value={c.id}>{c.title} - {c.year}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Employee (Ratee) *</label>
              <select
                required
                value={formData.employee_id}
                onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-200 focus:border-transparent outline-none transition-all"
              >
                <option value="">Select Employee</option>
                {employeeOptions.map(e => (
                  <option key={e.id} value={e.id}>{e.last_name}, {e.first_name} ({e.department})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Immediate Supervisor (Rater) *</label>
              <select
                required
                value={formData.rater_id}
                onChange={(e) => setFormData({ ...formData, rater_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-200 focus:border-transparent outline-none transition-all"
              >
                <option value="">Select Rater</option>
                {employeeOptions.map(e => (
                  <option key={e.id} value={e.id}>{e.last_name}, {e.first_name} ({e.job_title})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Head of Office (Approver) *</label>
              <select
                required
                value={formData.approver_id}
                onChange={(e) => setFormData({ ...formData, approver_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-200 focus:border-transparent outline-none transition-all"
              >
                <option value="">Select Approver</option>
                {employeeOptions.map(e => (
                  <option key={e.id} value={e.id}>{e.last_name}, {e.first_name} ({e.department})</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-[#F8F9FA] text-gray-700 font-medium rounded-lg shadow-md hover:bg-gray-100 hover:text-red-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isProcessing}
              className="flex-1 px-4 py-2 bg-[#F8F9FA] text-gray-700 font-medium rounded-lg shadow-md border-2 border-transparent hover:text-green-800 disabled:opacity-50 transition-colors"
            >
              {isProcessing ? 'Creating...' : 'Create IPCR'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default IPCRManagement;
