import { useState, useEffect } from 'react';
import { 
  Scale, FileText, Clock, CheckCircle, XCircle, AlertTriangle,
  Search, Filter, RefreshCw, MessageSquare, ChevronDown
} from 'lucide-react';
import { fetchAppeals, reviewAppeal, decideAppeal } from '../../api/appealsApi';

const statusColors = {
  'Filed': 'bg-blue-100 text-blue-700',
  'Under Review': 'bg-amber-100 text-amber-700',
  'Scheduled': 'bg-purple-100 text-purple-700',
  'Decided': 'bg-green-100 text-green-700',
  'Withdrawn': 'bg-gray-100 text-gray-500'
};

const decisionColors = {
  'Upheld': 'bg-gray-100 text-gray-700',
  'Modified': 'bg-amber-100 text-amber-700',
  'Reversed': 'bg-green-100 text-green-700'
};

const Appeals = () => {
  const [appeals, setAppeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAppeal, setSelectedAppeal] = useState(null);
  const [showDecideModal, setShowDecideModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    loadAppeals();
  }, [filterStatus]);

  const loadAppeals = async () => {
    try {
      setLoading(true);
      const result = await fetchAppeals({ status: filterStatus });
      if (result.success) setAppeals(result.appeals);
    } catch (error) {
      // Handle error
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async (appeal) => {
    try {
      setIsProcessing(true);
      const result = await reviewAppeal(appeal.id, { hearing_date: null });
      if (result.success) loadAppeals();
    } catch (error) {
      // Handle error
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDecide = async (data) => {
    try {
      setIsProcessing(true);
      const result = await decideAppeal(selectedAppeal.id, data);
      if (result.success) {
        setShowDecideModal(false);
        setSelectedAppeal(null);
        loadAppeals();
      }
    } catch (error) {
      // Handle error
    } finally {
      setIsProcessing(false);
    }
  };

  const filteredAppeals = appeals.filter(a =>
    `${a.employee_first} ${a.employee_last}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.department?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = {
    total: appeals.length,
    filed: appeals.filter(a => a.status === 'Filed').length,
    underReview: appeals.filter(a => a.status === 'Under Review').length,
    decided: appeals.filter(a => a.status === 'Decided').length
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-neutral-100 to-stone-50 rounded-xl shadow-xl p-7 w-full overflow-hidden text-gray-800">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <Scale className="text-gray-800" />
          Performance Rating Appeals
        </h1>
        <p className="text-sm text-gray-800 mt-1">Manage employee appeals per CSC MC 6-2012</p>
      </div>

      <hr className="mb-6 border-[1px] border-[#274b46]" />

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <p className="text-sm text-gray-500 font-medium">Total Appeals</p>
          <p className="text-2xl font-bold text-gray-800">{stats.total}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <p className="text-sm text-blue-600 font-medium">Filed</p>
          <p className="text-2xl font-bold text-blue-700">{stats.filed}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <p className="text-sm text-amber-600 font-medium">Under Review</p>
          <p className="text-2xl font-bold text-amber-700">{stats.underReview}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <p className="text-sm text-green-600 font-medium">Decided</p>
          <p className="text-2xl font-bold text-green-700">{stats.decided}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-[#F8F9FA] p-4 rounded-lg shadow-md mb-6">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border border-gray-200 shadow-sm focus-within:ring-2 focus-within:ring-gray-200 focus-within:border-gray-200 transition-all">
              <Search size={18} className="text-gray-400" />
              <input
                type="text"
                placeholder="Search by employee name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 bg-transparent border-none outline-none text-sm text-gray-700 placeholder-gray-400"
              />
            </div>
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 bg-white border border-gray-200 rounded-lg shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-gray-200 focus:border-gray-200 hover:border-gray-200 transition-all cursor-pointer"
          >
            <option value="">All Statuses</option>
            <option value="Filed">Filed</option>
            <option value="Under Review">Under Review</option>
            <option value="Scheduled">Scheduled</option>
            <option value="Decided">Decided</option>
          </select>
          <button onClick={loadAppeals} className="p-2 bg-gray-200 text-gray-600 rounded-lg hover:bg-gray-300 shadow-sm transition-all">
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Appeals Table */}
      <div className="bg-gray-50 rounded-lg scrollbar-bg-white shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-200 shadow-md text-gray-700">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-bold tracking-wide">Status</th>
              <th className="px-6 py-4 text-left text-sm font-bold tracking-wide">Employee</th>
              <th className="px-6 py-4 text-left text-sm font-bold tracking-wide">Department</th>
              <th className="px-6 py-4 text-left text-sm font-bold tracking-wide">Original Rating</th>
              <th className="px-6 py-4 text-left text-sm font-bold tracking-wide">Appeal Date</th>
              <th className="px-6 py-4 text-left text-sm font-bold tracking-wide">Decision</th>
              <th className="px-6 py-4 text-left text-sm font-bold tracking-wide">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr><td colSpan="7" className="px-6 py-12 text-center text-gray-500">Loading...</td></tr>
            ) : filteredAppeals.length === 0 ? (
              <tr><td colSpan="7" className="px-6 py-12 text-center text-gray-500">No appeals found</td></tr>
            ) : (
              filteredAppeals.map(appeal => (
                <tr key={appeal.id} className="hover:bg-[#F8F9FA] hover:shadow-xl transition-colors">
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[appeal.status]}`}>
                      {appeal.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-medium text-gray-800">{appeal.employee_first} {appeal.employee_last}</p>
                    <p className="text-xs text-gray-500">{appeal.employee_code}</p>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-800">{appeal.department}</td>
                  <td className="px-6 py-4">
                    <p className="font-medium text-gray-800">{appeal.original_rating}</p>
                    <p className="text-xs text-gray-500">{appeal.original_adjectival}</p>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-800">
                    {new Date(appeal.appeal_date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                    {appeal.pmt_decision ? (
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${decisionColors[appeal.pmt_decision]}`}>
                        {appeal.pmt_decision}
                        {appeal.new_rating && ` → ${appeal.new_rating}`}
                      </span>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      {appeal.status === 'Filed' && (
                        <button
                          onClick={() => handleReview(appeal)}
                          disabled={isProcessing}
                          className="px-3 py-1.5 bg-amber-100 text-amber-800 rounded-lg text-xs font-medium hover:bg-amber-200 disabled:opacity-50"
                        >
                          Review
                        </button>
                      )}
                      {(appeal.status === 'Under Review' || appeal.status === 'Scheduled') && (
                        <button
                          onClick={() => { setSelectedAppeal(appeal); setShowDecideModal(true); }}
                          className="px-3 py-1.5 bg-green-100 text-green-800 rounded-lg text-xs font-medium hover:bg-green-200"
                        >
                          Decide
                        </button>
                      )}
                      <button
                        onClick={() => setSelectedAppeal(appeal)}
                        className="px-3 py-1.5 bg-gray-200 text-gray-700 rounded-lg text-xs font-medium hover:bg-gray-300"
                      >
                        View
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Decide Modal */}
      {showDecideModal && selectedAppeal && (
        <DecideAppealModal
          appeal={selectedAppeal}
          onClose={() => { setShowDecideModal(false); setSelectedAppeal(null); }}
          onSubmit={handleDecide}
          isProcessing={isProcessing}
        />
      )}
    </div>
  );
};

// Decide Appeal Modal
const DecideAppealModal = ({ appeal, onClose, onSubmit, isProcessing }) => {
  const [decision, setDecision] = useState('');
  const [newRating, setNewRating] = useState('');
  const [remarks, setRemarks] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      decision,
      new_rating: decision === 'Modified' || decision === 'Reversed' ? parseFloat(newRating) : null,
      decision_remarks: remarks
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-lg shadow-2xl overflow-hidden">
        <div className="bg-gray-200 shadow-md px-6 py-3 border-b border-gray-100 flex items-center gap-2">
          <Scale size={20} className="text-gray-800" />
          <h2 className="text-lg font-bold text-gray-800">Appeal Decision</h2>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="bg-gray-50 border border-gray-200 rounded-lg shadow-md p-4 space-y-3">
            <div className="flex justify-between">
              <div>
                <p className="text-xs text-gray-500 font-semibold uppercase">Employee</p>
                <p className="font-bold text-gray-800">{appeal.employee_first} {appeal.employee_last}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500 font-semibold uppercase">Original Rating</p>
                <p className="font-bold text-gray-800">{appeal.original_rating} ({appeal.original_adjectival})</p>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">PMT Decision *</label>
              <div className="flex gap-2">
                {['Upheld', 'Modified', 'Reversed'].map(d => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDecision(d)}
                    className={`flex-1 px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${
                      decision === d 
                        ? d === 'Upheld' ? 'bg-gray-800 text-white border-gray-800'
                          : d === 'Modified' ? 'bg-amber-500 text-white border-amber-500'
                          : 'bg-green-600 text-white border-green-600'
                        : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>

            {(decision === 'Modified' || decision === 'Reversed') && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">New Rating *</label>
                <input
                  type="number"
                  step="0.01"
                  min="1"
                  max="5"
                  required
                  value={newRating}
                  onChange={(e) => setNewRating(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-200 focus:border-transparent outline-none transition-all"
                  placeholder="e.g., 3.50"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Decision Remarks *</label>
              <textarea
                required
                rows={3}
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-200 focus:border-transparent outline-none resize-none transition-all"
                placeholder="Explain the basis for this decision..."
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
              disabled={isProcessing || !decision}
              className="flex-1 px-4 py-2 bg-[#F8F9FA] text-gray-700 font-medium rounded-lg shadow-md border-2 border-transparent hover:text-green-800 disabled:opacity-50 transition-colors"
            >
              {isProcessing ? 'Processing...' : 'Submit Decision'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Appeals;
