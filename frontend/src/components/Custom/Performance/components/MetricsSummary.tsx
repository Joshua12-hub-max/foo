import React from 'react';
import { ShieldAlert, Clock, Calendar, AlertCircle, Info, TrendingUp, TrendingDown } from 'lucide-react';

interface MetricsSummaryProps {
  metrics: {
    attendance: {
      totalLateMinutes: number;
      totalUndertimeMinutes: number;
      totalLateCount: number;
      totalUndertimeCount: number;
      totalAbsenceCount: number;
      daysEquivalent: string;
    };
    violations: Array<{
      id: number;
      violationDate: string;
      penalty: string | number | null;
      status: string;
      policyTitle: string;
    }>;
  };
  employeeInfo?: {
    dutyType: string;
    dailyTargetHours: number;
    salaryBasis: string;
  };
}

const MetricsSummary: React.FC<MetricsSummaryProps> = ({ metrics, employeeInfo }) => {
  const { attendance, violations } = metrics;
  
  return (
    <div className="bg-white rounded-sm shadow-sm border border-gray-200 overflow-hidden">
      <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <ShieldAlert className="text-gray-400" size={20} />
          <h2 className="text-lg font-bold text-gray-800">Compliance & Metrics Summary</h2>
        </div>
        {employeeInfo && (
          <div className="flex items-center gap-3">
             <span className={`px-2 py-1 rounded-sm text-[10px] font-bold uppercase ${
               employeeInfo.dutyType === 'Standard' ? 'bg-blue-50 text-blue-700' : 'bg-purple-50 text-purple-700'
             }`}>
               {employeeInfo.dutyType} Duty
             </span>
             <span className="text-xs text-gray-500 font-medium italic">
                {employeeInfo.dailyTargetHours}h daily target
             </span>
          </div>
        )}
      </div>

      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Attendance Section */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
              <Clock size={14} />
              Attendance Performance
            </h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 rounded-sm border border-gray-100 flex flex-col">
                <span className="text-[10px] text-gray-500 font-bold uppercase">Total Lates</span>
                <div className="flex items-baseline gap-2">
                  <span className={`text-2xl font-black ${attendance.totalLateCount > 0 ? 'text-orange-600' : 'text-emerald-600'}`}>
                    {attendance.totalLateCount}
                  </span>
                  <span className="text-xs text-gray-400">instances</span>
                </div>
                <span className="text-[10px] text-gray-400 mt-1 italic">Total: {attendance.totalLateMinutes} mins</span>
              </div>

              <div className="p-4 bg-gray-50 rounded-sm border border-gray-100 flex flex-col">
                <span className="text-[10px] text-gray-500 font-bold uppercase">Total Absences</span>
                <div className="flex items-baseline gap-2">
                   <span className={`text-2xl font-black ${attendance.totalAbsenceCount > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                    {attendance.totalAbsenceCount}
                  </span>
                  <span className="text-xs text-gray-400">days</span>
                </div>
              </div>

              <div className="col-span-2 p-4 bg-indigo-50/30 rounded-sm border border-indigo-100 flex items-center justify-between">
                 <div>
                    <span className="text-[10px] text-indigo-700 font-bold uppercase">Reportable Deduction Equivalent</span>
                    <p className="text-sm text-gray-600">Calculated based on {employeeInfo?.dailyTargetHours || 8}h duty</p>
                 </div>
                 <div className="text-right">
                    <span className="text-2xl font-black text-indigo-700">{attendance.daysEquivalent}</span>
                    <span className="text-[10px] text-indigo-500 block uppercase font-bold">Days</span>
                 </div>
              </div>
            </div>
          </div>

          {/* Violations Section */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
              <AlertCircle size={14} />
              Policy Violation History
            </h3>

            {violations.length > 0 ? (
              <div className="space-y-2">
                {violations.map((v) => (
                  <div key={v.id} className="p-3 bg-white border border-gray-100 rounded-sm flex justify-between items-center hover:bg-gray-50 transition-colors">
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-gray-800">{v.policyTitle}</span>
                      <span className="text-[10px] text-gray-500">{new Date(v.violationDate).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] px-2 py-0.5 bg-red-50 text-red-700 font-bold uppercase border border-red-100">
                        {v.penalty ?? 'N/A'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-40 flex flex-col items-center justify-center bg-gray-50 border border-dashed border-gray-200 rounded-sm">
                <TrendingUp className="text-emerald-500 mb-2" size={32} />
                <p className="text-xs font-bold text-gray-500 uppercase">Excellent Status</p>
                <p className="text-[10px] text-gray-400">No active policy violations recorded.</p>
              </div>
            )}
          </div>
        </div>
        
        <div className="mt-8 pt-4 border-t border-gray-100 flex items-center gap-2 text-[10px] text-gray-400 italic">
          <Info size={12} />
          <span>These metrics are automatically fetched from the <b>Office Order 158-2025 Compliance Engine</b>. Results are finalized based on biometric data and approved leave entries.</span>
        </div>
      </div>
    </div>
  );
};

export default MetricsSummary;
