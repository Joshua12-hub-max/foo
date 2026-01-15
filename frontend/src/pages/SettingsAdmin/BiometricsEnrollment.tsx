import React from 'react';
import { useUIStore } from '@/stores';
import { CheckCircle, XCircle } from 'lucide-react';
import { useEnrollment, AddEmployeeModal } from '@settings/Biometrics/Enrollment';

const BiometricsEnrollment = () => {
  const sidebarOpen = useUIStore((state) => state.sidebarOpen);
  
  const { employees, selectedEmployee, isEnrolled, isLoading, error, statusMessage, showAddModal,
    setSelectedEmployee, setShowAddModal, setError, setStatusMessage, handleEnrollClick, loadEmployees } = useEnrollment();

  return (
    <div className={`p-4 flex flex-col items-center justify-center min-h-[80vh] transition-all duration-300 ${!sidebarOpen ? 'max-w-[1600px] xl:max-w-[88vw]' : 'max-w-[1400px] xl:max-w-[77vw]'}`}>
      
      {/* Compact Enrollment Card */}
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden animate-in fade-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="bg-gray-50 px-6 py-5 border-b border-gray-100 flex justify-between items-center">
          <div>
            <h1 className="text-lg font-bold text-gray-900">Fingerprint Enrollment</h1>
            <p className="text-xs text-gray-500 font-medium">Register employee biometrics</p>
          </div>
          <button 
            onClick={() => setShowAddModal(true)}
            className="text-[11px] font-bold text-gray-700 hover:text-gray-900 bg-white border border-gray-200 px-3.5 py-2 rounded-xl shadow-sm hover:shadow-md transition-all active:scale-95"
          >
            + New Employee
          </button>
        </div>

        <div className="p-7 space-y-6">
          {/* Main Selection */}
          <div className="space-y-2">
            <label htmlFor="employee-select" className="block text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">
              Select Employee to Enroll
            </label>
            <div className="relative">
              <select
                id="employee-select"
                value={selectedEmployee}
                onChange={(e) => setSelectedEmployee(e.target.value)}
                className="block w-full px-5 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl text-gray-800 text-sm font-bold focus:outline-none focus:border-gray-300 focus:bg-white transition-all appearance-none shadow-inner"
                disabled={isLoading}
              >
                <option value="">-- Choose an employee --</option>
                {employees.map(emp => (
                  <option key={emp.id} value={(emp as any).employee_id}>
                    {emp.last_name}, {emp.first_name} ({(emp as any).employee_id})
                  </option>
                ))}
              </select>
              <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
              </div>
            </div>
          </div>

          {/* Status Indicator Banner */}
          <div className={`rounded-2xl p-5 border transition-all duration-300 ${
            !selectedEmployee ? 'bg-gray-50/50 border-gray-100 text-gray-400' :
            isEnrolled ? 'bg-green-50/50 border-green-100' :
            'bg-gray-50 border-gray-200'
          }`}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Current Status</span>
              {selectedEmployee ? (
                isEnrolled ? (
                  <span className="flex items-center gap-1.5 text-green-700 font-bold text-xs bg-green-100/80 px-3 py-1.5 rounded-xl shadow-sm">
                      <CheckCircle className="w-3.5 h-3.5" /> Enrolled
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 text-gray-600 font-bold text-xs bg-gray-200/80 px-3 py-1.5 rounded-xl shadow-sm">
                      <XCircle className="w-3.5 h-3.5" /> Not Enrolled
                  </span>
                )
              ) : (
                <span className="text-xs font-medium text-gray-400">No selection</span>
              )}
            </div>
          </div>

          {/* Main Action Button */}
          <button
            onClick={handleEnrollClick}
            disabled={isLoading || !selectedEmployee}
            className="w-full py-4 bg-gray-900 text-white text-sm font-bold rounded-2xl shadow-xl hover:bg-gray-800 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:hover:scale-100 mt-2"
          >
            {isLoading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Processing Mapper...</span>
              </div>
            ) : (isEnrolled ? 'Re-Enroll Fingerprint' : 'Start Enrollment')}
          </button>

          {/* Feedback Messages */}
          {error && (
            <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3.5 rounded-xl text-[11px] font-bold text-center animate-in fade-in slide-in-from-top-2">
              {error}
            </div>
          )}
          {statusMessage && (
            <div className="bg-blue-50 border border-blue-100 text-blue-700 px-4 py-3.5 rounded-xl text-[11px] font-bold text-center animate-in fade-in slide-in-from-top-2">
              {statusMessage}
            </div>
          )}
        </div>
      </div>

      <AddEmployeeModal 
        isOpen={showAddModal} 
        onClose={() => setShowAddModal(false)}
        onSuccess={() => {
            loadEmployees();
            setStatusMessage('Employee created successfully! Select them from the list to enroll.');
        }}
      />

    </div>
  );
};

export default BiometricsEnrollment;
