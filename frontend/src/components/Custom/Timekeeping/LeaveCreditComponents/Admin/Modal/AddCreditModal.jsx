import { useState, useEffect, useRef } from "react";
import { X, ChevronDown } from "lucide-react";

// Philippine Government Leave Types with CSC (Civil Service Commission) policies
const GOVERNMENT_LEAVE_TYPES = [
  { type: 'Vacation Leave', code: 'VL', description: 'Personal reasons, rest, recreation', defaultCredits: 15 },
  { type: 'Sick Leave', code: 'SL', description: 'Illness, medical consultations', defaultCredits: 15 },
  { type: 'Maternity Leave', code: 'ML', description: '105 days (RA 11210)', defaultCredits: 105 },
  { type: 'Paternity Leave', code: 'PL', description: '7 days (RA 8187)', defaultCredits: 7 },
  { type: 'Solo Parent Leave', code: 'SPL', description: '7 days per year (RA 8972)', defaultCredits: 7 },
  { type: 'Special Leave Benefits for Women', code: 'SLBW', description: '2 months (RA 9710)', defaultCredits: 60 },
  { type: 'Special Emergency Leave', code: 'SEL', description: '5 days for calamities', defaultCredits: 5 },
  { type: 'Rehabilitation Leave', code: 'RL', description: 'Work-related injuries (6 months)', defaultCredits: 180 },
  { type: 'Study Leave', code: 'STL', description: 'Up to 6 months educational', defaultCredits: 180 },
  { type: 'VAWC Leave', code: 'VAWC', description: '10 days (RA 9262)', defaultCredits: 10 },
  { type: 'Special Privilege Leave', code: 'SPLV', description: '3 days per year', defaultCredits: 3 },
  { type: 'Forced/Mandatory Leave', code: 'FL', description: '5 days (from VL)', defaultCredits: 5 }
];

export default function AddCreditModal({ isOpen, onClose, onSave, formData, onChange, employees = [], existingCredits = [] }) {
  const [errors, setErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [selectedLeaveInfo, setSelectedLeaveInfo] = useState(null);
  const [currentBalance, setCurrentBalance] = useState(null);
  const [isLeaveDropdownOpen, setIsLeaveDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsLeaveDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (formData.employeeId && formData.creditType) {
      const existing = existingCredits.find(c => c.employee_id === formData.employeeId && c.credit_type === formData.creditType);
      setCurrentBalance(existing ? existing.balance : null);
    } else {
      setCurrentBalance(null);
    }
  }, [formData.employeeId, formData.creditType, existingCredits]);

  useEffect(() => {
    const info = GOVERNMENT_LEAVE_TYPES.find(l => l.type === formData.creditType);
    setSelectedLeaveInfo(info || null);
  }, [formData.creditType]);

  const validateForm = () => {
    const newErrors = {};
    if (!formData.employeeId) newErrors.employeeId = "Please select an employee";
    if (!formData.creditType) newErrors.creditType = "Please select a leave type";
    const creditsValue = parseFloat(formData.credits);
    if (isNaN(creditsValue) || creditsValue < 0) newErrors.credits = "Credits must be a non-negative number";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSaveClick = async () => {
    if (validateForm()) {
      setIsSaving(true);
      try {
        await onSave();
      } finally {
        setIsSaving(false);
      }
    }
  };

  const handleSetDefault = () => {
    if (selectedLeaveInfo) {
      onChange({ target: { name: 'credits', value: selectedLeaveInfo.defaultCredits.toString() } });
    }
  };

  const handleSelectLeaveType = (leave) => {
    onChange({ target: { name: 'creditType', value: leave.type } });
    setIsLeaveDropdownOpen(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 transition-all">
      <div className="bg-white rounded-xl w-full max-w-md shadow-2xl border border-gray-100 overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 shrink-0 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900">
            {currentBalance !== null ? 'Update' : 'Add'} Leave Credit
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto">
          <div className="space-y-4">
            {/* Employee */}
            <div>
              <label className="block text-sm font-bold text-gray-900 mb-1.5">Employee</label>
              <select
                name="employeeId"
                value={formData.employeeId}
                onChange={onChange}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-gray-300 focus:ring-4 focus:ring-gray-100 transition-all text-sm bg-white"
              >
                <option value="">Select employee...</option>
                {employees.map(emp => (
                  <option key={emp.id} value={emp.employee_id}>
                    {emp.first_name} {emp.last_name} ({emp.employee_id})
                  </option>
                ))}
              </select>
              {errors.employeeId && <p className="text-xs text-red-500 mt-1 font-medium">{errors.employeeId}</p>}
            </div>

            {/* Department */}
            <div>
              <label className="block text-sm font-bold text-gray-900 mb-1.5">Department</label>
              <input
                type="text"
                value={formData.department || 'Select an employee first'}
                readOnly
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-gray-50 text-gray-500 text-sm focus:outline-none cursor-not-allowed font-medium"
              />
            </div>

            {/* Leave Type - Custom Dropdown */}
            <div ref={dropdownRef} className="relative">
              <label className="block text-sm font-bold text-gray-900 mb-1.5">Leave Type</label>
              <button
                type="button"
                onClick={() => setIsLeaveDropdownOpen(!isLeaveDropdownOpen)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none text-sm text-left flex justify-between items-center bg-white hover:border-gray-300 transition-all focus:ring-4 focus:ring-gray-100"
                style={{ borderWidth: '1px' }}
              >
                <span className={formData.creditType ? 'text-gray-900 font-medium' : 'text-gray-500'}>
                  {formData.creditType ? `${formData.creditType} (${GOVERNMENT_LEAVE_TYPES.find(l => l.type === formData.creditType)?.code || ''})` : 'Select leave type...'}
                </span>
                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isLeaveDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              
              {/* Dropdown Options */}
              {isLeaveDropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-100 rounded-xl shadow-2xl z-20 max-h-60 overflow-y-auto animate-in fade-in zoom-in duration-100">
                  {GOVERNMENT_LEAVE_TYPES.map(leave => (
                    <button
                      key={leave.code}
                      type="button"
                      onClick={() => handleSelectLeaveType(leave)}
                      className={`w-full px-4 py-3 text-left text-sm hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0 ${formData.creditType === leave.type ? 'bg-blue-50 font-semibold text-blue-900' : 'text-gray-700'}`}
                    >
                      {leave.type} <span className="text-gray-400 font-normal ml-1">({leave.code})</span>
                    </button>
                  ))}
                </div>
              )}
              {errors.creditType && <p className="text-xs text-red-500 mt-1 font-medium">{errors.creditType}</p>}
            </div>

            {/* Leave Info */}
            {selectedLeaveInfo && (
              <div className="text-xs text-blue-700 bg-blue-50 p-4 rounded-xl border border-blue-100 leading-relaxed">
                <p className="font-semibold mb-1">{selectedLeaveInfo.description}</p>
                <p>Default Allocation: <strong>{selectedLeaveInfo.defaultCredits} days</strong></p>
              </div>
            )}

            {/* Current Balance Alert */}
            {currentBalance !== null && (
              <div className="text-xs text-amber-700 bg-amber-50 p-4 rounded-xl border border-amber-200 flex items-start gap-2">
                <div className="mt-0.5 shrink-0 w-1.5 h-1.5 rounded-full bg-amber-500"></div>
                <div>
                  <strong className="block mb-0.5">Current Balance: {currentBalance} days</strong>
                  <span>Setting a new value will replace the existing balance.</span>
                </div>
              </div>
            )}

            {/* Credits Input */}
            <div>
              <label className="block text-sm font-bold text-gray-900 mb-1.5">New Balance (days)</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  name="credits"
                  value={formData.credits}
                  onChange={onChange}
                  placeholder="Enter credit balance"
                  step="0.5"
                  min="0"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-gray-300 focus:ring-4 focus:ring-gray-100 transition-all text-sm font-medium"
                />
                {selectedLeaveInfo && (
                  <button
                    type="button"
                    onClick={handleSetDefault}
                    className="px-4 py-2 bg-gray-100 text-gray-600 text-xs font-bold rounded-xl hover:bg-gray-200 transition-colors border border-gray-200 uppercase tracking-wide"
                  >
                    Default
                  </button>
                )}
              </div>
              {errors.credits && <p className="text-xs text-red-500 mt-1 font-medium">{errors.credits}</p>}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex gap-3 shrink-0">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:text-gray-900 transition-colors shadow-sm"
          >
            Cancel
          </button>
          <button
            onClick={handleSaveClick}
            disabled={isSaving}
            className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800 disabled:opacity-50 transition-all shadow-lg shadow-gray-900/20"
          >
            {isSaving ? 'Saving...' : (currentBalance !== null ? 'Update Credit' : 'Add Credit')}
          </button>
        </div>
      </div>
    </div>
  );
}

export { GOVERNMENT_LEAVE_TYPES };