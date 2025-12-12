import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Building, Plus, FileText, CheckCircle, Clock, Send, 
  Eye, Trash2, RefreshCw, AlertTriangle, Search
} from 'lucide-react';
import { fetchOPCRs, createOPCR, deleteOPCR, submitOPCR, reviewOPCR, approveOPCR, finalizeOPCR } from '../../api/opcrApi';
import { fetchDepartments } from '../../api/departmentApi';

const statusColors = {
  'Draft': 'bg-gray-100 text-gray-700',
  'Submitted': 'bg-blue-100 text-blue-700',
  'PMT Review': 'bg-amber-100 text-amber-700',
  'Approved': 'bg-green-100 text-green-700',
  'Finalized': 'bg-purple-100 text-purple-700'
};

const OPCRManagement = () => {
  const navigate = useNavigate();
  const [opcrs, setOpcrs] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedCycle, setSelectedCycle] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [cycles, setCycles] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    loadData();
  }, [selectedCycle, selectedDepartment]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [opcrRes, deptRes] = await Promise.all([
        fetchOPCRs({ cycle_id: selectedCycle, department: selectedDepartment }),
        fetchDepartments()
      ]);
      if (opcrRes.success) setOpcrs(opcrRes.opcrs);
      if (deptRes.success) setDepartments(deptRes.departments);
      
      // Extract unique cycles from OPCRs
      if (opcrRes.success && opcrRes.opcrs.length > 0) {
        const uniqueCycles = [...new Map(opcrRes.opcrs.map(o => [o.cycle_id, { id: o.cycle_id, title: o.cycle_title, year: o.cycle_year }])).values()];
        setCycles(uniqueCycles);
      }
    } catch (error) {
      // Handle error
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (data) => {
    try {
      setIsProcessing(true);
      const result = await createOPCR(data);
      if (result.success) {
        setShowCreateModal(false);
        loadData();
      }
    } catch (error) {
      // Handle error
    } finally {
      setIsProcessing(false);
    }
  };

  const handleWorkflowAction = async (id, action) => {
    try {
      setIsProcessing(true);
      let result;
      switch (action) {
        case 'submit': result = await submitOPCR(id); break;
        case 'review': result = await reviewOPCR(id, 'Reviewed by PMT'); break;
        case 'approve': result = await approveOPCR(id, 'Approved'); break;
        case 'finalize': result = await finalizeOPCR(id); break;
        default: break;
      }
      if (result?.success) loadData();
    } catch (error) {
      // Handle error
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this OPCR?')) return;
    try {
      const result = await deleteOPCR(id);
      if (result.success) loadData();
    } catch (error) {
      // Handle error
    }
  };

  const filteredOPCRs = opcrs.filter(o => 
    o.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.cycle_title?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Draft': return <FileText size={14} />;
      case 'Submitted': return <Send size={14} />;
      case 'PMT Review': return <Clock size={14} />;
      case 'Approved': case 'Finalized': return <CheckCircle size={14} />;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-neutral-100 to-stone-50 rounded-xl shadow-xl p-7 w-full overflow-hidden text-gray-800">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">OPCR Management</h1>
          <p className="text-sm text-gray-800 mt-1">Office Performance Commitment & Review</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-800 border border-gray-200 rounded-lg shadow-md hover:bg-gray-300 transition-all font-medium"
        >
          <Plus size={18} />
          Create OPCR
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
                placeholder="Search by department..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 bg-transparent border-none outline-none text-sm text-gray-700 placeholder-gray-400"
              />
            </div>
          </div>
          <select
            value={selectedDepartment}
            onChange={(e) => setSelectedDepartment(e.target.value)}
            className="px-3 py-2 bg-white border border-gray-200 rounded-lg shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-gray-200 focus:border-gray-200 hover:border-gray-200 transition-all cursor-pointer"
          >
            <option value="">All Departments</option>
            {departments.map(d => (
              <option key={d.id} value={d.name}>{d.name}</option>
            ))}
          </select>
          <button onClick={loadData} className="p-2 bg-gray-200 text-gray-600 rounded-lg hover:bg-gray-300 shadow-sm transition-all">
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* OPCR Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full text-center py-12 flex flex-col items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-800 mb-3"></div>
            <span className="text-gray-500">Loading...</span>
          </div>
        ) : filteredOPCRs.length === 0 ? (
          <div className="col-span-full text-center py-12 text-gray-500 bg-white rounded-xl border border-gray-100 shadow-sm">
            No OPCRs found. Create one to get started.
          </div>
        ) : (
          filteredOPCRs.map(opcr => (
            <div key={opcr.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-xl transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-50 rounded-lg border border-blue-100">
                    <Building size={20} className="text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800">{opcr.department}</h3>
                    <p className="text-xs text-gray-500">{opcr.cycle_title} - {opcr.cycle_year}</p>
                  </div>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 border ${statusColors[opcr.status]}`}>
                  {getStatusIcon(opcr.status)}
                  {opcr.status}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
                <div className="bg-gray-50 p-2 rounded-lg border border-gray-100">
                  <p className="text-gray-500 text-xs font-semibold uppercase">Items</p>
                  <p className="font-bold text-gray-800">{opcr.item_count || 0}</p>
                </div>
                <div className="bg-gray-50 p-2 rounded-lg border border-gray-100">
                  <p className="text-gray-500 text-xs font-semibold uppercase">Linked IPCRs</p>
                  <p className="font-bold text-gray-800">{opcr.linked_ipcr_count || 0}</p>
                </div>
                {opcr.final_rating && (
                  <>
                    <div className="bg-gray-50 p-2 rounded-lg border border-gray-100">
                      <p className="text-gray-500 text-xs font-semibold uppercase">Rating</p>
                      <p className="font-bold text-gray-800">{opcr.final_rating}</p>
                    </div>
                    <div className="bg-gray-50 p-2 rounded-lg border border-gray-100">
                      <p className="text-gray-500 text-xs font-semibold uppercase">Adjectival</p>
                      <p className="font-bold text-gray-800">{opcr.adjectival_rating}</p>
                    </div>
                  </>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => navigate(`/admin-dashboard/opcr/${opcr.id}`)}
                  className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium shadow-md hover:bg-gray-300 hover:text-blue-800 transition-all"
                >
                  <Eye size={14} /> View
                </button>
                {opcr.status === 'Draft' && (
                  <>
                    <button
                      onClick={() => handleWorkflowAction(opcr.id, 'submit')}
                      disabled={isProcessing}
                      className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium shadow-md hover:bg-gray-300 hover:text-green-800 disabled:opacity-50 transition-all"
                    >
                      <Send size={14} /> Submit
                    </button>
                    <button
                      onClick={() => handleDelete(opcr.id)}
                      className="p-2 text-gray-600 bg-gray-200 hover:bg-gray-300 hover:text-red-800 rounded-lg shadow-md transition-all"
                    >
                      <Trash2 size={14} />
                    </button>
                  </>
                )}
                {opcr.status === 'Submitted' && (
                  <button
                    onClick={() => handleWorkflowAction(opcr.id, 'review')}
                    disabled={isProcessing}
                    className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium shadow-md hover:bg-gray-300 hover:text-amber-800 disabled:opacity-50 transition-all"
                  >
                    <Clock size={14} /> Review
                  </button>
                )}
                {opcr.status === 'PMT Review' && (
                  <button
                    onClick={() => handleWorkflowAction(opcr.id, 'approve')}
                    disabled={isProcessing}
                    className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium shadow-md hover:bg-gray-300 hover:text-green-800 disabled:opacity-50 transition-all"
                  >
                    <CheckCircle size={14} /> Approve
                  </button>
                )}
                {opcr.status === 'Approved' && (
                  <button
                    onClick={() => handleWorkflowAction(opcr.id, 'finalize')}
                    disabled={isProcessing}
                    className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium shadow-md hover:bg-gray-300 hover:text-purple-800 disabled:opacity-50 transition-all"
                  >
                    <CheckCircle size={14} /> Finalize
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <CreateOPCRModal
          departments={departments}
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreate}
          isProcessing={isProcessing}
        />
      )}
    </div>
  );
};

// Create OPCR Modal
const CreateOPCRModal = ({ departments, onClose, onSubmit, isProcessing }) => {
  const [formData, setFormData] = useState({
    department: '',
    cycle_id: '',
    total_budget: ''
  });
  const [cycles, setCycles] = useState([]);

  useEffect(() => {
    // Fetch cycles
    const fetchCycles = async () => {
      try {
        const response = await fetch('/api/spms/cycles', {
          credentials: 'include'
        });
        const data = await response.json();
        if (data.success) setCycles(data.cycles || []);
      } catch (error) {
        // Handle error
      }
    };
    fetchCycles();
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-md shadow-2xl overflow-hidden">
        <div className="bg-gray-200 shadow-md px-6 py-3 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-800">Create New OPCR</h2>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="bg-gray-50 border border-gray-200 rounded-lg shadow-md p-4 space-y-3">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Department *</label>
              <select
                required
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-200 focus:border-transparent outline-none transition-all"
              >
                <option value="">Select Department</option>
                {departments.map(d => (
                  <option key={d.id} value={d.name}>{d.name}</option>
                ))}
              </select>
            </div>
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
              <label className="block text-sm font-semibold text-gray-700 mb-1">Total Budget (₱)</label>
              <input
                type="number"
                value={formData.total_budget}
                onChange={(e) => setFormData({ ...formData, total_budget: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-200 focus:border-transparent outline-none transition-all"
                placeholder="0.00"
              />
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
              {isProcessing ? 'Creating...' : 'Create OPCR'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default OPCRManagement;
