import React from 'react';
import { ShieldAlert, Clock, AlertCircle, Info, TrendingUp } from 'lucide-react';

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
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="bg-gradient-to-r from-gray-50 to-white px-6 py-5 border-b border-gray-100 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="bg-white p-2 rounded-xl shadow-sm border border-gray-100">
            <ShieldAlert className="text-gray-400" size={20} />
          </div>
          <h2 className="text-lg font-bold text-gray-800 tracking-tight">Compliance & metrics summary</h2>
        </div>
        {employeeInfo && (
          <div className="flex items-center gap-3">
             <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${
               employeeInfo.dutyType === 'Standard' ? 'bg-blue-50 text-blue-700' : 'bg-purple-50 text-purple-700'
             }`}>
               {employeeInfo.dutyType} duty
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
            <h3 className="text-xs font-bold text-gray-400 flex items-center gap-2 mb-2">
              <Clock size={14} />
              Attendance performance
            </h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="p-5 bg-gradient-to-br from-white to-gray-50 rounded-2xl border border-gray-100 flex flex-col shadow-sm hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-[10px] text-gray-500 font-bold">Total lates</span>
                  <span className="text-[10px] font-black text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full border border-orange-100">
                    -{(attendance.totalLateCount + attendance.totalUndertimeCount * 0.01).toFixed(2)} pts
                  </span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className={`text-3xl font-black ${attendance.totalLateCount > 0 ? 'text-orange-600' : 'text-emerald-600'}`}>
                    {attendance.totalLateCount}
                  </span>
                  <span className="text-xs font-bold text-gray-400">instances</span>
                </div>
                <span className="text-[10px] text-gray-400 mt-2 italic font-medium">Deduction: 0.01 per instance</span>
              </div>

              <div className="p-5 bg-gradient-to-br from-white to-gray-50 rounded-2xl border border-gray-100 flex flex-col shadow-sm hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-[10px] text-gray-500 font-bold">Total absences</span>
                  <span className="text-[10px] font-black text-red-600 bg-red-50 px-2 py-0.5 rounded-full border border-red-100">
                    -{(attendance.totalAbsenceCount * 0.05).toFixed(2)} pts
                  </span>
                </div>
                <div className="flex items-baseline gap-2">
                   <span className={`text-3xl font-black ${attendance.totalAbsenceCount > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                    {attendance.totalAbsenceCount}
                  </span>
                  <span className="text-xs font-bold text-gray-400">days</span>
                </div>
                <span className="text-[10px] text-gray-400 mt-2 italic font-medium">Deduction: 0.05 per day</span>
              </div>

              <div className="col-span-2 p-5 bg-gradient-to-r from-indigo-50/50 to-white rounded-2xl border border-indigo-100 flex items-center justify-between shadow-sm hover:shadow-md transition-shadow">
                 <div className="space-y-1">
                    <span className="text-[10px] text-indigo-700 font-bold">Reportable deduction equivalent</span>
                    <p className="text-xs text-gray-500 font-medium">Calculated based on {employeeInfo?.dailyTargetHours || 8}h duty</p>
                 </div>
                 <div className="text-right">
                    <span className="text-3xl font-black text-indigo-700">{attendance.daysEquivalent}</span>
                    <span className="text-[10px] text-indigo-500 block font-bold">days</span>
                 </div>
              </div>
            </div>
          </div>

          {/* Violations Section */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-gray-400 flex items-center gap-2 mb-2">
              <AlertCircle size={14} />
              Policy violation history
            </h3>

            {violations.length > 0 ? (
              <div className="space-y-3">
                {violations.map((v) => (
                  <div key={v.id} className="p-4 bg-white border border-gray-100 rounded-xl flex justify-between items-center shadow-sm hover:shadow-md transition-all hover:translate-x-1">
                    <div className="flex flex-col gap-1">
                      <span className="text-xs font-bold text-gray-800 tracking-tight">{v.policyTitle}</span>
                      <span className="text-[10px] text-gray-400 font-medium">{new Date(v.violationDate).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] px-2.5 py-1 bg-red-50 text-red-700 font-bold rounded-lg border border-red-100 shadow-sm">
                        {v.penalty ?? 'n/a'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-[212px] flex flex-col items-center justify-center bg-gray-50/50 border border-dashed border-gray-200 rounded-2xl">
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 mb-3">
                  <TrendingUp className="text-emerald-500" size={32} />
                </div>
                <p className="text-xs font-bold text-gray-500">Excellent status</p>
                <p className="text-[10px] text-gray-400 font-medium">No active policy violations recorded.</p>
              </div>
            )}
          </div>
        </div>
        
        <div className="mt-8 pt-5 border-t border-gray-100 flex items-start gap-3 text-[10px] text-gray-400 italic font-medium leading-relaxed">
          <div className="bg-gray-50 p-1.5 rounded-lg border border-gray-100 mt-0.5">
            <Info size={12} className="text-gray-400" />
          </div>
          <span>These metrics are automatically fetched from the <b>Office Order 158-2025 compliance engine</b>. Results are finalized based on biometric data and approved leave entries.</span>
        </div>
      </div>
    </div>
  );
};

export default MetricsSummary;
