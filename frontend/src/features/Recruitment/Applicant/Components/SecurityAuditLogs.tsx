import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { recruitmentApi, SecurityLog } from '@/api/recruitmentApi';
import { 
  ShieldAlert, Search, Loader2, AlertTriangle, 
  Bot, Mail, Globe, Clock, User, Wifi
} from 'lucide-react';

type ViolationType = 'Spam Bot' | 'Disposable Email' | 'Automated Script' | 'Invalid Email Domain';

const VIOLATION_CONFIG: Record<ViolationType, { color: string; icon: typeof Bot; label: string }> = {
  'Spam Bot':             { color: 'bg-red-100 text-red-700 border-red-200',       icon: Bot,           label: 'Spam Bot' },
  'Disposable Email':     { color: 'bg-orange-100 text-orange-700 border-orange-200', icon: Mail,       label: 'Disposable Email' },
  'Automated Script':     { color: 'bg-purple-100 text-purple-700 border-purple-200', icon: AlertTriangle, label: 'Automated Script' },
  'Invalid Email Domain': { color: 'bg-amber-100 text-amber-700 border-amber-200',   icon: Globe,      label: 'Invalid Domain' },
};

const getViolationConfig = (type: string) => {
  return VIOLATION_CONFIG[type as ViolationType] || { 
    color: 'bg-slate-100 text-slate-700 border-slate-200', 
    icon: ShieldAlert, 
    label: type 
  };
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

  const violationTypes = ['All', ...Object.keys(VIOLATION_CONFIG)];

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
          <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <ShieldAlert size={20} className="text-red-500" />
            Security Audit Logs
          </h2>
          <p className="text-xs font-medium text-slate-500 mt-1">
            Blocked threats detected during job applications · Auto-refreshes every 30s
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-black flex items-center gap-2">
            <ShieldAlert size={12} />
            {statCounts.total} Total
          </div>
          <div className="px-4 py-2 bg-red-600 text-white rounded-xl text-xs font-black flex items-center gap-2">
            <Clock size={12} />
            {statCounts.today} Today
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            type="text"
            placeholder="Search by name, email, IP address, or details..."
            className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-slate-500/10 outline-none font-bold text-sm shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-1 bg-white p-1 rounded-2xl border border-slate-200 shadow-sm overflow-x-auto">
          {violationTypes.map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-3 py-1.5 rounded-xl text-[10px] font-black whitespace-nowrap transition-all ${
                filterType === type
                  ? 'bg-slate-900 text-white shadow-lg'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              {type === 'All' ? 'All' : getViolationConfig(type).label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="p-16 flex flex-col items-center gap-3">
              <Loader2 className="animate-spin text-slate-400" size={28} />
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Scanning security logs...</p>
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="p-16 flex flex-col items-center text-center gap-3">
              <div className="p-4 bg-emerald-50 rounded-full text-emerald-400">
                <ShieldAlert size={36} />
              </div>
              <p className="text-sm font-bold text-slate-500">
                {logs.length === 0 ? 'No violations recorded yet — the system is clean.' : 'No results match your search.'}
              </p>
              {logs.length > 0 && (
                <button 
                  onClick={() => { setSearchTerm(''); setFilterType('All'); }}
                  className="text-xs font-black text-slate-900 underline underline-offset-4 hover:text-slate-600"
                >
                  Clear filters
                </button>
              )}
            </div>
          ) : (
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Timestamp</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Applicant</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Violation</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Details</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Job</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">IP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredLogs.map((log) => {
                  const config = getViolationConfig(log.violationType);
                  const ViolationIcon = config.icon;
                  return (
                    <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Clock size={12} className="text-slate-300" />
                          <div>
                            <p className="text-xs font-bold text-slate-700">
                              {log.createdAt ? new Date(log.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                            </p>
                            <p className="text-[10px] font-bold text-slate-400">
                              {log.createdAt ? new Date(log.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : ''}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                            <User size={14} className="text-slate-400" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-black text-slate-900 truncate">{log.firstName} {log.lastName}</p>
                            <p className="text-[10px] font-bold text-slate-400 truncate">{log.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase border ${config.color}`}>
                          <ViolationIcon size={11} />
                          {config.label}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-xs font-medium text-slate-600 max-w-[200px] truncate" title={log.details || ''}>
                          {log.details || '—'}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-xs font-bold text-slate-700 max-w-[150px] truncate">
                          {log.jobTitle || 'N/A'}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5">
                          <Wifi size={10} className="text-slate-300" />
                          <span className="text-[11px] font-mono font-bold text-slate-500">{log.ipAddress || '—'}</span>
                        </div>
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
          <div className="px-6 py-3 bg-slate-50/50 border-t border-slate-100 flex justify-between items-center">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              Showing {filteredLogs.length} of {logs.length} entries
            </p>
            <p className="text-[10px] font-bold text-slate-400">
              Last 100 records · Auto-logged by system
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SecurityAuditLogs;
