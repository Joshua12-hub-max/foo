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
    <div className="fixed inset-0 bg-black/30 flex items-start justify-center z-50 p-4">
      <div className="bg-white rounded-lg border border-gray-200 w-full max-w-md shadow-xl mt-16 relative">
        
        {/* Header */}
        <div className="bg-gray-200 px-4 py-4 flex items-center justify-between shadow-md">
          <h2 className="text-base font-bold text-gray-800">
            {currentBalance !== null ? 'Update' : 'Add'} Leave Credit
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-5 h-5 text-red-800" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-3 max-h-[70vh] overflow-y-auto">
          {/* Employee */}
          <div>
            <label className="block text-sm font-normal text-gray-700 mb-1">Employee</label>
            <select
              name="employeeId"
              value={formData.employeeId}
              onChange={onChange}
              className="w-full pl-10 bg-white border border-gray-200 rounded-lg shadow-sm px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-200 focus:border-gray-200 hover:border-gray-200 transition-all disabled:opacity-50 appearance-none cursor-pointer"
            >
              <option value="">Select employee...</option>
              {employees.map(emp => (
                <option key={emp.id} value={emp.employee_id}>
                  {emp.first_name} {emp.last_name} ({emp.employee_id})
                </option>
              ))}
            </select>
            {errors.employeeId && <p className="text-xs text-red-500 mt-1">{errors.employeeId}</p>}
          </div>

          {/* Department */}
          <div>
            <label className="block text-sm font-normal text-gray-700 mb-1">Department</label>
            <input
              type="text"
              value={formData.department || 'Select an employee first'}
              readOnly
              className="w-full pl-10 bg-white border border-gray-200 rounded-lg shadow-sm px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-200 focus:border-gray-200 hover:border-gray-200 transition-all disabled:opacity-50 appearance-none cursor-pointer"
            />
          </div>

          {/* Leave Type - Custom Dropdown */}
          <div ref={dropdownRef} className="relative">
            <label className="block text-sm font-normal text-gray-700 mb-1">Leave Type</label>
            <button
              type="button"
              onClick={() => setIsLeaveDropdownOpen(!isLeaveDropdownOpen)}
              className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg shadow-sm focus:outline-none text-sm text-left flex justify-between items-center bg-white"
            >
              <span className={formData.creditType ? 'text-gray-800' : 'text-gray-400'}>
                {formData.creditType ? `${formData.creditType} (${GOVERNMENT_LEAVE_TYPES.find(l => l.type === formData.creditType)?.code || ''})` : 'Select leave type...'}
              </span>
              <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isLeaveDropdownOpen ? 'rotate-180' : ''}`} />
            </button>
            
            {/* Dropdown Options */}
            {isLeaveDropdownOpen && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border-2 border-gray-200 rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto">
                {GOVERNMENT_LEAVE_TYPES.map(leave => (
                  <button
                    key={leave.code}
                    type="button"
                    onClick={() => handleSelectLeaveType(leave)}
                    className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-100 ${formData.creditType === leave.type ? 'bg-gray-100 font-medium' : ''}`}
                  >
                    {leave.type} ({leave.code})
                  </button>
                ))}
              </div>
            )}
            {errors.creditType && <p className="text-xs text-red-500 mt-1">{errors.creditType}</p>}
          </div>

          {/* Leave Info */}
          {selectedLeaveInfo && (
            <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded-lg">
              <p>{selectedLeaveInfo.description}</p>
              <p className="mt-1">Default: <strong>{selectedLeaveInfo.defaultCredits} days</strong></p>
            </div>
          )}

          {/* Current Balance Alert */}
          {currentBalance !== null && (
            <div className="text-xs text-amber-700 bg-amber-50 p-2 rounded-lg border border-amber-200">
              <strong>Current Balance:</strong> {currentBalance} days - Setting new value will replace it.
            </div>
          )}

          {/* Credits Input */}
          <div>
            <label className="block text-sm font-normal text-gray-700 mb-1">New Balance (days)</label>
            <div className="flex gap-2">
              <input
                type="number"
                name="credits"
                value={formData.credits}
                onChange={onChange}
                placeholder="Enter credit balance"
                step="0.5"
                min="0"
                className="w-full pl-10 bg-white border border-gray-200 rounded-lg shadow-sm px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-200 focus:border-gray-200 hover:border-gray-200 transition-all disabled:opacity-50 appearance-none cursor-pointer"
              />
              {selectedLeaveInfo && (
                <button
                  type="button"
                  onClick={handleSetDefault}
                  className="px-3 py-2 bg-gray-200 text-gray-700 text-xs font-medium rounded-lg shadow-md hover:bg-gray-300"
                >
                  Default
                </button>
              )}
            </div>
            {errors.credits && <p className="text-xs text-red-500 mt-1">{errors.credits}</p>}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 mt-4">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-lg shadow-md hover:text-red-800"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveClick}
              disabled={isSaving}
              className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-lg shadow-md hover:text-green-800 disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : (currentBalance !== null ? 'Update Credit' : 'Add Credit')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export { GOVERNMENT_LEAVE_TYPES };