import { useState } from "react";
import { X, Plus, User, Building, Hash } from "lucide-react";

export default function AddCreditModal({ isOpen, onClose, onSave, formData, onChange, employees = [] }) {
  const [errors, setErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);

  // Validate form
  const validateForm = () => {
    const newErrors = {};

    if (!formData.employeeId) {
      newErrors.employeeId = "Please select an employee";
    }

    if (!formData.credits || parseInt(formData.credits, 10) < 0) {
      newErrors.credits = "Leave credits must be a non-negative number";
    }
    
    if (!formData.creditType) {
        newErrors.creditType = "Please select a credit type";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle save click
  const handleSaveClick = () => {
    if (validateForm()) {
      setIsSaving(true);
      // Simulate saving delay
      setTimeout(() => {
        if (onSave) {
          onSave();
        }
        setIsSaving(false);
      }, 500);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full overflow-hidden flex flex-col">
          {/* Header */}
          <div className="bg-gradient-to-r from-slate-950 to-green-700 flex items-center justify-between p-4 border-b">
            <div className="flex items-center gap-2">
              <Plus className="text-white" size={24} />
              <h2 className="text-xl font-bold text-white">Add/Update Credit</h2>
            </div>
            <button onClick={onClose} className="text-white hover:text-gray-200">
              <X size={20} />
            </button>
          </div>

          {/* Content */}
          <div className="p-4 space-y-4">
              {/* Employee Select */}
              <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Employee</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                    <select
                      name="employeeId"
                      value={formData.employeeId}
                      onChange={onChange}
                      className="w-full pl-10 pr-3 py-2 text-sm border-2 border-gray-300 rounded-lg focus:outline-none focus:border-green-500"
                    >
                        <option value="">Select Employee</option>
                        {employees.map(emp => (
                            <option key={emp.id} value={emp.employee_id}>
                                {emp.first_name} {emp.last_name} ({emp.employee_id})
                            </option>
                        ))}
                    </select>
                  </div>
                  {errors.employeeId && <p className="text-xs text-red-500 mt-1">{errors.employeeId}</p>}
              </div>

              {/* Department (Read Only) */}
              <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Department</label>
                  <div className="relative">
                    <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                    <input
                      type="text"
                      value={formData.department || ''}
                      readOnly
                      className="w-full pl-10 pr-3 py-2 text-sm border-2 border-gray-200 bg-gray-50 rounded-lg text-gray-500"
                    />
                  </div>
              </div>

              {/* Credit Type */}
              <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Credit Type</label>
                  <select
                      name="creditType"
                      value={formData.creditType}
                      onChange={onChange}
                      className="w-full px-3 py-2 text-sm border-2 border-gray-300 rounded-lg focus:outline-none focus:border-green-500"
                  >
                      <option value="Vacation">Vacation Leave</option>
                      <option value="Sick">Sick Leave</option>
                      <option value="Emergency">Emergency Leave</option>
                      <option value="Service Incentive">Service Incentive Leave</option>
                  </select>
              </div>

              {/* Credits Balance */}
              <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">New Balance</label>
                  <div className="relative">
                    <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                    <input
                      type="number"
                      name="credits"
                      value={formData.credits}
                      onChange={onChange}
                      placeholder="Enter total balance"
                      className="w-full pl-10 pr-3 py-2 text-sm border-2 border-gray-300 rounded-lg focus:outline-none focus:border-green-500"
                    />
                  </div>
                  {errors.credits && <p className="text-xs text-red-500 mt-1">{errors.credits}</p>}
              </div>

              <div className="flex justify-end gap-3 pt-4">
                  <button onClick={onClose} className="px-4 py-2 border rounded-lg">Cancel</button>
                  <button 
                    onClick={handleSaveClick} 
                    disabled={isSaving}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                  >
                    {isSaving ? 'Saving...' : 'Save Credit'}
                  </button>
              </div>
          </div>
        </div>
    </div>
  );
}