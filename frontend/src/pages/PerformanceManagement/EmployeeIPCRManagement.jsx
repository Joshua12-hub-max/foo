import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, FileText, CheckCircle, Clock, Send, 
  Eye, RefreshCw, Search, Briefcase, UserCheck
} from 'lucide-react';
import { fetchIPCRs, createIPCR, fetchCycles, fetchEmployees } from '../../api/spmsApi';
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

const EmployeeIPCRManagement = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [ipcrs, setIpcrs] = useState([]);
  const [cycles, setCycles] = useState([]);
  const [employees, setEmployees] = useState([]); // Needed for selecting rater/approver
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedCycle, setSelectedCycle] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    loadData();
  }, [selectedCycle]);

  const loadData = async () => {
    try {
      setLoading(true);
      const filters = { employee_id: user.id }; // Explicitly filter for current user
      if (selectedCycle) filters.cycle_id = selectedCycle;

      const [ipcrRes, cyclesRes, empRes] = await Promise.all([
        fetchIPCRs(filters),
        fetchCycles(),
        fetchEmployees() 
      ]);

      if (ipcrRes.success) setIpcrs(ipcrRes.ipcrs);
      if (cyclesRes.success) setCycles(cyclesRes.cycles);
      if (empRes.success) setEmployees(empRes.employees);
      
    } catch (error) {
      console.error("Failed to load data", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (data) => {
    try {
      setIsProcessing(true);
      // As an employee, I am the 'employee_id'
      const payload = {
          ...data,
          employee_id: user.id
      };
      
      const result = await createIPCR(payload);
      if (result.success) {
        setShowCreateModal(false);
        loadData();
        // Optional: Navigate to detail to start adding targets immediately
        // navigate(`/employee-dashboard/ipcr/${result.ipcrId}`);
      } else {
        alert(result.message || 'Failed to create IPCR');
      }
    } catch (error) {
      alert('Error creating IPCR');
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Draft': return <FileText size={14} />;
      case 'Committed': return <CheckCircle size={14} />;
      case 'For Rating': return <Send size={14} />;
      case 'Rated': return <Clock size={14} />;
      case 'Acknowledged': return <UserCheck size={14} />;
      case 'Approved': case 'Final': return <CheckCircle size={14} />;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-neutral-100 to-stone-50 rounded-xl shadow-xl p-7 w-full overflow-hidden text-gray-800">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">My IPCRs</h1>
          <p className="text-sm text-gray-800 mt-1">Individual Performance Commitment & Review</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-800 border border-gray-200 rounded-lg shadow-md hover:bg-gray-300 transition-all font-medium"
        >
          <Plus size={18} />
          Create New IPCR
        </button>
      </div>

      <hr className="mb-6 border-[1px] border-[#274b46]" />

      {/* Filters */}
      <div className="bg-[#F8F9FA] p-4 rounded-lg shadow-md mb-6">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
             <span className="text-sm text-gray-600 font-medium">Filter Cycle:</span>
             <select
                value={selectedCycle}
                onChange={(e) => setSelectedCycle(e.target.value)}
                className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-200 focus:border-gray-200 transition-all cursor-pointer"
              >
                <option value="">All Cycles</option>
                {cycles.map(c => (
                  <option key={c.id} value={c.id}>{c.title} ({c.year})</option>
                ))}
              </select>
          </div>
          
          <button onClick={loadData} className="p-2 bg-gray-200 text-gray-600 rounded-lg hover:bg-gray-300 shadow-sm transition-all ml-auto">
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* IPCR List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full text-center py-12 flex flex-col items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-800 mb-3"></div>
            <span className="text-gray-500">Loading your IPCRs...</span>
          </div>
        ) : ipcrs.length === 0 ? (
          <div className="col-span-full bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
             <FileText size={48} className="mx-auto text-gray-300 mb-4"/>
             <h3 className="text-lg font-bold text-gray-800">No IPCRs Found</h3>
             <p className="text-gray-500 mb-6">You haven't created any performance commitments yet.</p>
             <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg shadow-md hover:bg-gray-300 transition-all font-medium"
            >
              Get Started
            </button>
          </div>
        ) : (
          ipcrs.map(ipcr => (
            <div key={ipcr.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-xl transition-shadow flex flex-col h-full">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                   <div className="p-2 bg-indigo-50 rounded-lg border border-indigo-100">
                      <FileText size={24} className="text-indigo-600"/>
                   </div>
                   <div>
                      <h3 className="font-semibold text-gray-800">{ipcr.cycle_title}</h3>
                      <p className="text-xs text-gray-500">{ipcr.cycle_year}</p>
                   </div>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 border ${statusColors[ipcr.status] || 'bg-gray-100'}`}>
                  {getStatusIcon(ipcr.status)}
                  {ipcr.status}
                </span>
              </div>

              <div className="space-y-3 mb-4 flex-grow">
                 <div className="flex flex-col gap-1 text-sm bg-gray-50 p-3 rounded-lg border border-gray-100">
                    <span className="text-xs text-gray-500 uppercase font-semibold">Rater (Supervisor)</span>
                    <div className="flex items-center gap-2">
                       <div className="w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600">
                          {ipcr.rater_first_name?.[0]}
                       </div>
                       <span className="font-medium text-gray-800">{ipcr.rater_first_name} {ipcr.rater_last_name}</span>
                    </div>
                 </div>
                 
                 {ipcr.final_average_rating && (
                   <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-lg text-center">
                     <span className="text-xs text-emerald-600 font-semibold uppercase block mb-1">Final Rating</span>
                     <span className="text-2xl font-bold text-emerald-800">{ipcr.final_average_rating}</span>
                     <span className="text-xs text-emerald-700 block mt-1 font-medium">{ipcr.adjectival_rating}</span>
                   </div>
                 )}
              </div>

              <div className="mt-auto pt-3 border-t border-gray-50">
                <button
                  onClick={() => navigate(`/employee-dashboard/ipcr/${ipcr.id}`)}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-300 hover:text-indigo-800 shadow-sm transition-all"
                >
                  <Eye size={16} /> 
                  {ipcr.status === 'Draft' ? 'Manage Targets' : 'View Details'}
                </button>
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
          user={user}
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreate}
          isProcessing={isProcessing}
        />
      )}
    </div>
  );
};

// Create IPCR Modal for Employee
const CreateIPCRModal = ({ cycles, employees, user, onClose, onSubmit, isProcessing }) => {
  const [formData, setFormData] = useState({
    cycle_id: '',
    rater_id: '',
    approver_id: ''
  });

  // Filter employees for potential raters/approvers (usually exclude self, though sometimes allowed)
  const potentialSignatories = employees.filter(e => e.id !== user.id).sort((a,b) => a.last_name.localeCompare(b.last_name));

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-md shadow-2xl overflow-hidden">
        <div className="bg-gray-200 shadow-md px-6 py-3 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-800">New Performance Commitment</h2>
          <p className="text-xs text-gray-600">Initialize your IPCR for a specific cycle.</p>
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
                  <option key={c.id} value={c.id}>{c.title} ({c.year})</option>
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
                <option value="">Select Supervisor</option>
                {potentialSignatories.map(e => (
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
                <option value="">Select Head of Office</option>
                {potentialSignatories.map(e => (
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

export default EmployeeIPCRManagement;
