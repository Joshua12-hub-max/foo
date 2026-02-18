import { getStatusColor } from '../constants/performanceConstants';
import { Clock, AlertTriangle, Calendar, TrendingDown, Info } from 'lucide-react';
import { AttendanceDetails, ReviewCycle } from '@/types/performance';
import { Employee } from '@/types';

interface PerformanceFormData {
  employee_id?: string | number;
  review_cycle_id?: string | number;
  status?: string;
  employee_first_name?: string;
  employee_last_name?: string;
  employee_job_title?: string;
  employee_position_title?: string;
  employee_department?: string;
  attendance_details?: AttendanceDetails | null;
  violation_count?: number;
}

interface EmployeeInfoCardProps {
  formData: PerformanceFormData;
  employees: Employee[];
  cycles: ReviewCycle[];
  isNew: boolean;
  onEmployeeChange: (employeeId: string) => void;
  onCycleChange: (cycleId: string) => void;
}

const EmployeeInfoCard: React.FC<EmployeeInfoCardProps> = ({
  formData,
  employees,
  cycles,
  isNew,
  onEmployeeChange,
  onCycleChange
}) => {
  const selectedEmployee = employees.find(e => e.id == formData.employee_id);
  const selectedCycle = cycles.find(c => c.id == formData.review_cycle_id);

  return (
    <div className="bg-white rounded-sm shadow-sm border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-3 bg-[#F8F9FA] border-b border-gray-200 flex justify-between items-center">
        <h3 className="font-bold text-gray-800 text-sm">Employee Information</h3>
        <span className={`px-3 py-1 rounded-sm text-xs font-bold ${getStatusColor(formData.status || 'Draft')}`}>
          {formData.status || 'Draft'}
        </span>
      </div>

      {/* Content */}
      <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Employee Name */}
        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-500">Employee Name</label>
          {isNew ? (
            <select
              value={formData.employee_id}
              onChange={(e) => onEmployeeChange(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded bg-white focus:ring-2 focus:ring-gray-300 outline-none text-sm"
            >
              <option value="">-- Select Employee --</option>
              {employees.map(emp => (
                <option key={emp.id} value={emp.id}>
                  {emp.first_name} {emp.last_name}
                </option>
              ))}
            </select>
          ) : (
            <div className="font-bold text-gray-800 text-lg">
              {formData.employee_first_name} {formData.employee_last_name}
            </div>
          )}
        </div>

        {/* Position */}
        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-500">Position / Title</label>
          <div className="font-medium text-gray-700">
            {formData.employee_position_title || formData.employee_job_title || selectedEmployee?.position_title || selectedEmployee?.job_title || 'N/A'}
          </div>
        </div>

        {/* Department */}
        <div className="space-y-1 overflow-hidden">
          <label className="text-sm font-medium text-gray-500">Department / Office</label>
          <div 
            className="font-medium text-gray-700 whitespace-nowrap overflow-hidden text-ellipsis"
            title={formData.employee_department || selectedEmployee?.department || 'N/A'}
          >
            {formData.employee_department || selectedEmployee?.department || 'N/A'}
          </div>
        </div>

        {/* Review Period */}
        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-500">Review Period</label>
          {isNew ? (
            <select
              value={formData.review_cycle_id}
              onChange={(e) => onCycleChange(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded bg-white focus:ring-2 focus:ring-gray-300 outline-none text-sm"
            >
              <option value="">-- Select Cycle --</option>
              {cycles.map(c => (
                <option key={c.id} value={c.id}>{c.title}</option>
              ))}
            </select>
          ) : (
            <div className="font-medium text-gray-700">
              {selectedCycle?.title || 'Standard Cycle'}
            </div>
          )}
        </div>
      </div>

      {/* Metrics Dashboard (Only show if not new) */}
      {!isNew && (
        <div className="px-6 pb-6 pt-0">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-sm border border-gray-100">
            <div className="flex flex-col">
              <div className="flex items-center gap-2 text-gray-500 mb-1">
                <Clock size={14} />
                <span className="text-xs font-bold uppercase tracking-wider">Attendance Rate</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-black text-gray-800">
                  {formData.attendance_details?.ratingDescription || 'Pending'}
                </span>
              </div>
            </div>

            <div className="flex flex-col border-l border-gray-200 pl-4">
              <div className="flex items-center gap-2 text-gray-500 mb-1">
                <TrendingDown size={14} />
                <span className="text-xs font-bold uppercase tracking-wider">Tardiness</span>
              </div>
              <div className="text-sm font-bold text-gray-700">
                {formData.attendance_details?.totalLates || 0} Instances 
                <span className="text-gray-400 font-normal ml-1">
                  ({formData.attendance_details?.totalLateMinutes || 0} mins)
                </span>
              </div>
            </div>

            <div className="flex flex-col border-l border-gray-200 pl-4">
              <div className="flex items-center gap-2 text-gray-500 mb-1">
                <Calendar size={14} />
                <span className="text-xs font-bold uppercase tracking-wider">Absences</span>
              </div>
              <div className="text-sm font-bold text-gray-700">
                {formData.attendance_details?.totalAbsences || 0} Unexplained
              </div>
            </div>

            <div className="flex flex-col border-l border-gray-200 pl-4">
              <div className="flex items-center gap-2 text-red-500 mb-1">
                <AlertTriangle size={14} />
                <span className="text-xs font-bold uppercase tracking-wider">Policy Violations</span>
              </div>
              <div className={`text-sm font-bold ${formData.violation_count && formData.violation_count > 0 ? 'text-red-600' : 'text-green-600'}`}>
                {formData.violation_count || 0} Active Violations
              </div>
            </div>
          </div>
          
          <div className="mt-3 flex items-center gap-2 text-[10px] text-gray-400 italic">
            <Info size={10} />
            <span>Metrics are automatically synchronized with Biometric Logs and Policy Enforcement service.</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeInfoCard;
