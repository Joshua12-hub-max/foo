import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { recruitmentApi, SecurityLog } from '@/api/recruitmentApi';
import { Search, Loader2, User, Clock } from 'lucide-react';

type ViolationType = 'Spam Bot' | 'Disposable Email' | 'Automated Script' | 'Invalid Email Domain';

const VIOLATION_LABELS: Record<ViolationType, string> = {
  'Spam Bot':             'Spam Bot',
  'Disposable Email':     'Disposable Email',
  'Automated Script':     'Automated Script',
  'Invalid Email Domain': 'Invalid Domain',
};

const getViolationLabel = (type: string): string => {
  return VIOLATION_LABELS[type as ViolationType] || type;
};

const SecurityAuditLogs = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('All');

  const { data, isLoading } = useQuery({
    queryKey: ['security-logs'],
    queryFn: () => recruitmentApi.getSecurityLogs(),
    refetchInterval: 30000,
  });

  const logs: SecurityLog[] = data?.data.logs || [];

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      `${log.firstName} ${log.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.details || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.ipAddress || '').includes(searchTerm);

    const matchesFilter = filterType === 'All' || log.violationType === filterType;
    return matchesSearch && matchesFilter;
  });

  const violationTypes = ['All', ...Object.keys(VIOLATION_LABELS)];

  // Stats
  const statCounts = {
    total: logs.length,
    today: logs.filter(l => {
      if (!l.createdAt) return false;
      const d = new Date(l.createdAt);
      const now = new Date();
      return d.toDateString() === now.toDateString();
    }).length,
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 tracking-tight">
            Security Audit Logs
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Blocked threats detected during job applications · Auto-refreshes every 30s
          </p>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <span className="text-slate-500">{statCounts.total} total</span>
          <span className="text-slate-400">·</span>
          <span className="text-slate-500">{statCounts.today} today</span>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            type="text"
            placeholder="Search by name, email, IP address, or details..."
            className="w-full pl-11 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-300 outline-none text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg p-1 overflow-x-auto">
          {violationTypes.map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-all ${
                filterType === type
                  ? 'bg-slate-100 text-slate-800'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              {type === 'All' ? 'All' : getViolationLabel(type)}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="p-16 flex flex-col items-center gap-3">
              <Loader2 className="animate-spin text-slate-400" size={24} />
              <p className="text-xs text-slate-400 tracking-wider">Scanning security logs...</p>
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="p-16 flex flex-col items-center text-center gap-2">
              <p className="text-sm text-slate-500">
                {logs.length === 0 ? 'No violations recorded yet — the system is clean.' : 'No results match your search.'}
              </p>
              {logs.length > 0 && (
                <button 
                  onClick={() => { setSearchTerm(''); setFilterType('All'); }}
                  className="text-xs text-slate-600 underline underline-offset-4 hover:text-slate-800"
                >
                  Clear filters
                </button>
              )}
            </div>
          ) : (
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="px-6 py-3 text-[11px] font-semibold text-slate-500 tracking-wider">Timestamp</th>
                  <th className="px-6 py-3 text-[11px] font-semibold text-slate-500 tracking-wider">Applicant</th>
                  <th className="px-6 py-3 text-[11px] font-semibold text-slate-500 tracking-wider">Violation</th>
                  <th className="px-6 py-3 text-[11px] font-semibold text-slate-500 tracking-wider">Details</th>
                  <th className="px-6 py-3 text-[11px] font-semibold text-slate-500 tracking-wider">Job</th>
                  <th className="px-6 py-3 text-[11px] font-semibold text-slate-500 tracking-wider">IP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLogs.map((log) => {
                  return (
                    <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Clock size={12} className="text-slate-300" />
                          <div>
                            <p className="text-xs font-medium text-slate-700">
                              {log.createdAt ? new Date(log.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                            </p>
                            <p className="text-[10px] text-slate-400">
                              {log.createdAt ? new Date(log.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : ''}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                            <User size={14} className="text-slate-400" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-slate-800 truncate">{log.firstName} {log.lastName}</p>
                            <p className="text-xs text-slate-400 truncate">{log.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-1 rounded text-[11px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                          {getViolationLabel(log.violationType)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-xs text-slate-600 max-w-[200px] truncate" title={log.details || ''}>
                          {log.details || '—'}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-xs font-medium text-slate-700 max-w-[150px] truncate">
                          {log.jobTitle || 'N/A'}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs font-mono text-slate-500">{log.ipAddress || '—'}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer */}
        {filteredLogs.length > 0 && (
          <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-between items-center">
            <p className="text-xs text-slate-400">
              Showing {filteredLogs.length} of {logs.length} entries
            </p>
            <p className="text-xs text-slate-400">
              Last 100 records · Auto-logged by system
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SecurityAuditLogs;
