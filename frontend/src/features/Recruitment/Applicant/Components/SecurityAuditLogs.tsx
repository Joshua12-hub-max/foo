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
    <div className="space-y-8 animate-in fade-in duration-500 relative z-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div>
          <h2 className="text-2xl font-black text-[var(--zed-text-dark)] tracking-tight uppercase">
            Security Intelligence
          </h2>
          <p className="text-sm font-medium text-[var(--zed-text-muted)] mt-2">
            Automated threat detection and blocked applicant protocols · Real-time monitoring active
          </p>
        </div>
        <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest text-[var(--zed-text-muted)]">
          <span className="bg-[var(--zed-bg-surface)] px-3 py-1 rounded border border-[var(--zed-border-light)]">{statCounts.total} archived</span>
          <span className="bg-[var(--zed-success)]/10 text-[var(--zed-success)] px-3 py-1 rounded border border-[var(--zed-success)]/20">{statCounts.today} today</span>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--zed-text-muted)]" size={18} />
          <input
            type="text"
            placeholder="Search by name, email, IP address, or details..."
            className="w-full pl-12 pr-4 py-3 bg-white border border-[var(--zed-border-light)] rounded-[var(--radius-lg)] focus:outline-none focus:ring-4 focus:ring-[var(--zed-primary)]/10 focus:border-[var(--zed-primary)] text-sm font-medium transition-all shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-1 bg-white border border-[var(--zed-border-light)] rounded-[var(--radius-lg)] p-1.5 shadow-sm overflow-x-auto">
          {violationTypes.map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-4 py-2 rounded-[var(--radius-sm)] text-[10px] font-black tracking-widest uppercase transition-all whitespace-nowrap ${
                filterType === type
                  ? 'bg-[var(--zed-primary)] text-white shadow-md'
                  : 'text-[var(--zed-text-muted)] hover:text-[var(--zed-primary)] hover:bg-[var(--zed-bg-surface)]'
              }`}
            >
              {type === 'All' ? 'All Types' : getViolationLabel(type)}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-[var(--zed-border-light)] rounded-[var(--radius-lg)] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="p-24 flex flex-col items-center gap-4">
              <Loader2 className="animate-spin text-[var(--zed-primary)]" size={32} />
              <p className="text-[10px] font-black text-[var(--zed-text-muted)] uppercase tracking-[0.2em]">Executing deep scan...</p>
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="p-24 flex flex-col items-center text-center gap-4">
              <p className="text-xs font-black text-[var(--zed-text-muted)] uppercase tracking-[0.2em]">
                {logs.length === 0 ? 'Firewall status: Clean. No violations recorded.' : 'Zero matches found in database.'}
              </p>
              {logs.length > 0 && (
                <button 
                  onClick={() => { setSearchTerm(''); setFilterType('All'); }}
                  className="text-[10px] font-black text-[var(--zed-primary)] uppercase tracking-widest underline underline-offset-8 hover:brightness-110 transition-all"
                >
                  Reset Protocol
                </button>
              )}
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[var(--zed-border-light)] bg-[var(--zed-bg-surface)]">
                  <th className="px-8 py-5 text-[10px] font-black text-[var(--zed-text-dark)] tracking-[0.2em] uppercase">Log Timestamp</th>
                  <th className="px-8 py-5 text-[10px] font-black text-[var(--zed-text-dark)] tracking-[0.2em] uppercase">Target Entity</th>
                  <th className="px-8 py-5 text-[10px] font-black text-[var(--zed-text-dark)] tracking-[0.2em] uppercase whitespace-nowrap">Classification</th>
                  <th className="px-8 py-5 text-[10px] font-black text-[var(--zed-text-dark)] tracking-[0.2em] uppercase">Detection Data</th>
                  <th className="px-8 py-5 text-[10px] font-black text-[var(--zed-text-dark)] tracking-[0.2em] uppercase">Reference Job</th>
                  <th className="px-8 py-5 text-[10px] font-black text-[var(--zed-text-dark)] tracking-[0.2em] uppercase text-center">Origin Address</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--zed-border-light)]/30">
                {filteredLogs.map((log) => {
                  return (
                    <tr key={log.id} className="hover:bg-[var(--zed-bg-surface)]/50 transition-colors">
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-3 text-[var(--zed-text-dark)]">
                          <Clock size={14} className="opacity-40" />
                          <div>
                            <p className="text-xs font-black uppercase tracking-tight">
                              {log.createdAt ? new Date(log.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                            </p>
                            <p className="text-[10px] font-bold text-[var(--zed-text-muted)] tracking-widest uppercase mt-1">
                              {log.createdAt ? new Date(log.createdAt).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }) : ''}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-[var(--zed-bg-surface)] border border-[var(--zed-border-light)] flex items-center justify-center shrink-0">
                            <User size={18} className="text-[var(--zed-primary)]" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-black text-[var(--zed-text-dark)] uppercase tracking-tight truncate">{log.firstName} {log.lastName}</p>
                            <p className="text-[10px] font-bold text-[var(--zed-text-muted)] tracking-wide truncate mt-1 lowercase">{log.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <span className="inline-flex items-center px-3 py-1 rounded-[var(--radius-sm)] text-[9px] font-black bg-[var(--zed-error)]/10 text-[var(--zed-error)] border border-[var(--zed-error)]/20 tracking-widest uppercase">
                          {getViolationLabel(log.violationType)}
                        </span>
                      </td>
                      <td className="px-8 py-6">
                        <p className="text-xs font-medium text-[var(--zed-text-dark)] max-w-[200px] truncate uppercase tracking-tight" title={log.details || ''}>
                          {log.details || '—'}
                        </p>
                      </td>
                      <td className="px-8 py-6">
                        <p className="text-xs font-black text-[var(--zed-text-dark)] max-w-[150px] truncate uppercase tracking-widest">
                          {log.jobTitle || 'N/A'}
                        </p>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex justify-center">
                          <span className="text-[10px] font-black text-[var(--zed-text-muted)] bg-[var(--zed-bg-surface)] px-3 py-1 rounded border border-[var(--zed-border-light)] uppercase tracking-tighter">{log.ipAddress || '0.0.0.0'}</span>
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
          <div className="px-8 py-4 bg-[var(--zed-bg-surface)] border-t border-[var(--zed-border-light)] flex justify-between items-center relative">
            <p className="text-[9px] font-black text-[var(--zed-text-muted)] uppercase tracking-widest">
              Report Analysis: {filteredLogs.length} of {logs.length} detected threats
            </p>
            <p className="text-[9px] font-black text-[var(--zed-text-muted)] uppercase tracking-widest opacity-40">
              System Audit Protocol · Last 100 entries
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SecurityAuditLogs;
