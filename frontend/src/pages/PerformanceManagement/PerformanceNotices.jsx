import { useState, useEffect } from 'react';
import { 
  AlertTriangle, Bell, FileWarning, UserX, Search, Filter, 
  RefreshCw, Eye, Send, CheckCircle, Clock
} from 'lucide-react';
import { fetchPerformanceNotices, fetchNoticesSummary, issueNotice, acknowledgeNotice } from '../../api/noticesApi';

const noticeTypeColors = {
  'Warning': 'bg-amber-100 text-amber-700',
  'Development Required': 'bg-blue-100 text-blue-700',
  'Show Cause': 'bg-orange-100 text-orange-700',
  'Separation Recommendation': 'bg-red-100 text-red-700'
};

const statusColors = {
  'Draft': 'bg-gray-100 text-gray-600',
  'Issued': 'bg-blue-100 text-blue-700',
  'Acknowledged': 'bg-green-100 text-green-700',
  'Complied': 'bg-emerald-100 text-emerald-700',
  'Escalated': 'bg-red-100 text-red-700'
};

const PerformanceNotices = () => {
  const [notices, setNotices] = useState([]);
  const [summary, setSummary] = useState([]);
  const [employeesAtRisk, setEmployeesAtRisk] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedNotice, setSelectedNotice] = useState(null);
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    loadData();
  }, [filterType, filterStatus]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [noticesRes, summaryRes] = await Promise.all([
        fetchPerformanceNotices({ notice_type: filterType, status: filterStatus }),
        fetchNoticesSummary()
      ]);
      if (noticesRes.success) setNotices(noticesRes.notices);
      if (summaryRes.success) {
        setSummary(summaryRes.summary);
        setEmployeesAtRisk(summaryRes.employeesAtRisk);
      }
    } catch (error) {
      // Handle error
    } finally {
      setLoading(false);
    }
  };

  const handleIssue = async (id) => {
    try {
      setIsProcessing(true);
      const result = await issueNotice(id);
      if (result.success) loadData();
    } catch (error) {
      // Handle error
    } finally {
      setIsProcessing(false);
    }
  };

  const filteredNotices = notices.filter(n =>
    `${n.first_name} ${n.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    n.department?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = {
    total: notices.length,
    warnings: notices.filter(n => n.notice_type === 'Warning').length,
    devRequired: notices.filter(n => n.notice_type === 'Development Required').length,
    showCause: notices.filter(n => n.notice_type === 'Show Cause').length,
    separation: notices.filter(n => n.notice_type === 'Separation Recommendation').length
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-neutral-100 to-stone-50 rounded-xl shadow-xl p-7 w-full overflow-hidden text-gray-800">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <FileWarning className="text-red-600" />
          Performance Notices
        </h1>
        <p className="text-sm text-gray-800 mt-1">Track warnings and interventions for underperformers</p>
      </div>

      <hr className="mb-6 border-[1px] border-[#274b46]" />

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <p className="text-2xl font-bold text-gray-800">{stats.total}</p>
          <p className="text-sm text-gray-500">Total Notices</p>
        </div>
        <div className="bg-amber-50 rounded-xl border border-amber-100 p-4">
          <p className="text-2xl font-bold text-amber-700">{stats.warnings}</p>
          <p className="text-sm text-amber-600">Warnings</p>
        </div>
        <div className="bg-blue-50 rounded-xl border border-blue-100 p-4">
          <p className="text-2xl font-bold text-blue-700">{stats.devRequired}</p>
          <p className="text-sm text-blue-600">Dev Required</p>
        </div>
        <div className="bg-orange-50 rounded-xl border border-orange-100 p-4">
          <p className="text-2xl font-bold text-orange-700">{stats.showCause}</p>
          <p className="text-sm text-orange-600">Show Cause</p>
        </div>
        <div className="bg-red-50 rounded-xl border border-red-100 p-4">
          <p className="text-2xl font-bold text-red-700">{stats.separation}</p>
          <p className="text-sm text-red-600">Separation</p>
        </div>
      </div>

      {/* Employees at Risk */}
      {employeesAtRisk.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="text-red-600" size={20} />
            <h3 className="font-semibold text-red-800">Employees at Risk of Separation</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {employeesAtRisk.map(emp => (
              <div key={emp.id} className="bg-white px-3 py-2 rounded-lg flex items-center gap-2 shadow-sm border border-red-100">
                <UserX size={16} className="text-red-500" />
                <span className="text-sm font-medium text-gray-800">{emp.first_name} {emp.last_name}</span>
                <span className="text-xs text-gray-500">({emp.department})</span>
                {emp.consecutive_poor >= 1 && (
                  <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded text-xs font-bold">Poor</span>
                )}
                {emp.consecutive_unsatisfactory >= 2 && (
                  <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded text-xs font-bold">2x Unsat</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-[#F8F9FA] p-4 rounded-lg shadow-md mb-6">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border border-gray-200 shadow-sm focus-within:ring-2 focus-within:ring-gray-200 focus-within:border-gray-200 transition-all">
              <Search size={18} className="text-gray-400" />
              <input
                type="text"
                placeholder="Search by employee..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 bg-transparent border-none outline-none text-sm text-gray-700 placeholder-gray-400"
              />
            </div>
          </div>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-2 bg-white border border-gray-200 rounded-lg shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-gray-200 focus:border-gray-200 transition-all cursor-pointer"
          >
            <option value="">All Types</option>
            <option value="Warning">Warning</option>
            <option value="Development Required">Development Required</option>
            <option value="Show Cause">Show Cause</option>
            <option value="Separation Recommendation">Separation</option>
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 bg-white border border-gray-200 rounded-lg shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-gray-200 focus:border-gray-200 transition-all cursor-pointer"
          >
            <option value="">All Statuses</option>
            <option value="Draft">Draft</option>
            <option value="Issued">Issued</option>
            <option value="Acknowledged">Acknowledged</option>
            <option value="Complied">Complied</option>
            <option value="Escalated">Escalated</option>
          </select>
          <button onClick={loadData} className="p-2 bg-gray-200 text-gray-600 rounded-lg hover:bg-gray-300 shadow-sm transition-all">
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Notices Table */}
      <div className="bg-gray-50 rounded-lg scrollbar-bg-white shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-200 shadow-md text-gray-700">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-bold tracking-wide text-gray-700">Status</th>
              <th className="px-6 py-4 text-left text-sm font-bold tracking-wide text-gray-700">Notice Type</th>
              <th className="px-6 py-4 text-left text-sm font-bold tracking-wide text-gray-700">Employee</th>
              <th className="px-6 py-4 text-left text-sm font-bold tracking-wide text-gray-700">Department</th>
              <th className="px-6 py-4 text-left text-sm font-bold tracking-wide text-gray-700">Rating</th>
              <th className="px-6 py-4 text-left text-sm font-bold tracking-wide text-gray-700">Notice Date</th>
              <th className="px-6 py-4 text-left text-sm font-bold tracking-wide text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr><td colSpan="7" className="px-6 py-12 text-center text-gray-500">Loading...</td></tr>
            ) : filteredNotices.length === 0 ? (
              <tr><td colSpan="7" className="px-6 py-12 text-center text-gray-500">No notices found</td></tr>
            ) : (
              filteredNotices.map(notice => (
                <tr key={notice.id} className="hover:bg-[#F8F9FA] hover:shadow-xl transition-colors">
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[notice.status]}`}>
                      {notice.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${noticeTypeColors[notice.notice_type]}`}>
                      {notice.notice_type}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-medium text-gray-800">{notice.first_name} {notice.last_name}</p>
                    <p className="text-xs text-gray-500">{notice.employee_code}</p>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{notice.department}</td>
                  <td className="px-6 py-4">
                    <p className="font-medium text-gray-800">{notice.rating_value}</p>
                    <p className="text-xs text-gray-500">{notice.adjectival_rating}</p>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {new Date(notice.notice_date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      {notice.status === 'Draft' && (
                        <button
                          onClick={() => handleIssue(notice.id)}
                          disabled={isProcessing}
                          className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
                        >
                          <Send size={12} /> Issue
                        </button>
                      )}
                      <button
                        onClick={() => setSelectedNotice(notice)}
                        className="px-3 py-1.5 bg-gray-200 text-gray-700 rounded-lg text-xs font-medium hover:bg-gray-300 hover:text-blue-800 transition-colors"
                      >
                        <Eye size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* View Notice Modal */}
      {selectedNotice && (
        <ViewNoticeModal
          notice={selectedNotice}
          onClose={() => setSelectedNotice(null)}
        />
      )}
    </div>
  );
};

// View Notice Modal
const ViewNoticeModal = ({ notice, onClose }) => (
  <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
    <div className="bg-white rounded-xl w-full max-w-lg shadow-2xl overflow-hidden">
      <div className={`px-6 py-4 rounded-t-xl flex items-center gap-2 ${
        notice.notice_type === 'Warning' ? 'bg-amber-500' :
        notice.notice_type === 'Development Required' ? 'bg-blue-500' :
        notice.notice_type === 'Show Cause' ? 'bg-orange-500' : 'bg-red-500'
      }`}>
        <FileWarning size={20} className="text-white" />
        <h2 className="text-lg font-semibold text-white">{notice.notice_type}</h2>
      </div>
      <div className="p-6 space-y-4">
        <div className="flex justify-between">
          <div>
            <p className="text-sm text-gray-500">Notice Number</p>
            <p className="font-medium text-gray-800">{notice.notice_number || 'N/A'}</p>
          </div>
          <span className={`px-3 py-1 h-fit rounded-full text-xs font-medium ${statusColors[notice.status]}`}>
            {notice.status}
          </span>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500">Employee</p>
            <p className="font-medium text-gray-800">{notice.first_name} {notice.last_name}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Department</p>
            <p className="font-medium text-gray-800">{notice.department}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Rating Period</p>
            <p className="font-medium text-gray-800">{notice.rating_period || 'N/A'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Performance Rating</p>
            <p className="font-medium text-gray-800">{notice.rating_value} ({notice.adjectival_rating})</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Notice Date</p>
            <p className="font-medium text-gray-800">{new Date(notice.notice_date).toLocaleDateString()}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Deadline</p>
            <p className="font-medium text-gray-800">
              {notice.deadline_date ? new Date(notice.deadline_date).toLocaleDateString() : 'N/A'}
            </p>
          </div>
        </div>

        {notice.hr_remarks && (
          <div>
            <p className="text-sm text-gray-500">HR Remarks</p>
            <p className="text-gray-700 bg-gray-50 p-3 rounded-lg text-sm border border-gray-100">{notice.hr_remarks}</p>
          </div>
        )}

        {notice.employee_response && (
          <div>
            <p className="text-sm text-gray-500">Employee Response</p>
            <p className="text-gray-700 bg-gray-50 p-3 rounded-lg text-sm border border-gray-100">{notice.employee_response}</p>
          </div>
        )}

        <button
          onClick={onClose}
          className="w-full px-4 py-2 bg-[#F8F9FA] text-gray-700 font-medium rounded-lg shadow-md hover:bg-gray-100 hover:text-red-800 mt-4 transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  </div>
);

export default PerformanceNotices;
