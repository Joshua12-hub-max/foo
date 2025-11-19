import { useState } from "react";
import { X, Plus, User, Building, Hash, Calendar } from "lucide-react";

export default function AddCreditModal({ isOpen, onClose, onSave, formData, onChange }) {
  const [errors, setErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  // Validate form
  const validateForm = () => {
    const newErrors = {};

    if (!formData.employeeName?.trim()) {
      newErrors.employeeName = "Employee name is required";
    }

    if (!formData.department?.trim()) {
      newErrors.department = "Department is required";
    }

    if (!formData.credits || parseInt(formData.credits, 10) <= 0) {
      newErrors.credits = "Leave credits must be a positive number";
    }

    if (!formData.date) {
      newErrors.date = "Date is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    onChange(e);

    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ""
      }));
    }
  };

  // Handle save click - show confirmation
  const handleSaveClick = () => {
    if (validateForm()) {
      setShowConfirmation(true);
    }
  };

  // Confirm save
  const confirmSave = () => {
    setIsSaving(true);

    // Simulate saving delay
    setTimeout(() => {
      if (onSave) {
        onSave(formData);
      }

      setIsSaving(false);
      setShowConfirmation(false);
      onClose();
    }, 1000);
  };

  // Reset form (handled by parent, but clear errors)
  const resetForm = () => {
    setErrors({});
  };

  // Handle close with confirmation
  const handleClose = () => {
    const hasData = formData.employeeName || formData.department || formData.credits || formData.date;
    
    if (hasData) {
      if (window.confirm("You have unsaved changes. Are you sure you want to close?")) {
        resetForm();
        onClose();
      }
    } else {
      resetForm();
      onClose();
    }
  };

  // Backdrop click handler
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Main Modal */}
      <div 
        className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4 z-50"
        onClick={handleBackdropClick}
      >
        <div 
          className="bg-white rounded-lg shadow-xl max-w-md w-full overflow-hidden flex flex-col" 
          style={{ height: 'auto', maxHeight: '90vh' }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-slate-950 to-green-700 flex items-center justify-between p-4 border-b relative">
            <div className="flex items-center gap-2 z-10">
              <Plus className="text-white" size={24} />
              <h2 className="text-xl font-bold text-white">Add Leave Credit</h2>
            </div>
            <button
              type="button"
              onClick={handleClose}
              className="text-white hover:text-gray-200 transition-colors absolute top-4 right-4 z-20"
              aria-label="Close modal"
            >
              <X size={20} />
            </button>
          </div>

          {/* Content */}
          <div className="p-4 overflow-y-auto flex-1">
            <div className="bg-white border-2 border-gray-200 rounded-xl p-4 shadow-md hover:shadow-lg transition-shadow">
              <div className="space-y-3">
                {/* Employee Name */}
                <div>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                    <input
                      type="text"
                      name="employeeName"
                      value={formData.employeeName || ""}
                      onChange={handleInputChange}
                      placeholder="Enter employee name"
                      className={`w-full pl-10 pr-3 py-2 text-sm border-2 ${errors.employeeName ? 'border-red-400' : 'border-gray-300'} rounded-lg bg-white focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100`}
                    />
                  </div>
                  <label className="block mt-1 text-xs font-semibold text-gray-700">
                    Employee Name
                  </label>
                  {errors.employeeName && (
                    <p className="text-xs text-red-500 mt-1">{errors.employeeName}</p>
                  )}
                </div>

                {/* Department */}
                <div>
                  <div className="relative">
                    <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                    <input
                      type="text"
                      name="department"
                      value={formData.department || ""}
                      onChange={handleInputChange}
                      placeholder="e.g., IT"
                      className={`w-full pl-10 pr-3 py-2 text-sm border-2 ${errors.department ? 'border-red-400' : 'border-gray-300'} rounded-lg bg-white focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100`}
                    />
                  </div>
                  <label className="block mt-1 text-xs font-semibold text-gray-700">
                    Department
                  </label>
                  {errors.department && (
                    <p className="text-xs text-red-500 mt-1">{errors.department}</p>
                  )}
                </div>

                {/* Credits */}
                <div>
                  <div className="relative">
                    <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                    <input
                      type="number"
                      name="credits"
                      value={formData.credits || ""}
                      onChange={handleInputChange}
                      placeholder="Enter number of leave credits"
                      min="0"
                      step="1"
                      className={`w-full pl-10 pr-3 py-2 text-sm border-2 ${errors.credits ? 'border-red-400' : 'border-gray-300'} rounded-lg bg-white focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100`}
                    />
                  </div>
                  <label className="block mt-1 text-xs font-semibold text-gray-700">
                    Leave Credits
                  </label>
                  {errors.credits && (
                    <p className="text-xs text-red-500 mt-1">{errors.credits}</p>
                  )}
                </div>

                {/* Date */}
                <div>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                    <input
                      type="date"
                      name="date"
                      value={formData.date || ""}
                      onChange={handleInputChange}
                      className={`w-full pl-10 pr-3 py-2 text-sm border-2 ${errors.date ? 'border-red-400' : 'border-gray-300'} rounded-lg bg-white focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100`}
                    />
                  </div>
                  <label className="block mt-1 text-xs font-semibold text-gray-700">
                    Date
                  </label>
                  {errors.date && (
                    <p className="text-xs text-red-500 mt-1">{errors.date}</p>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleClose}
                    disabled={isSaving}
                    className="px-4 py-2 text-sm border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 active:scale-95 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveClick}
                    disabled={isSaving}
                    className="px-4 py-2 text-sm border-2 border-green-600 text-green-700 rounded-lg font-semibold hover:bg-green-50 active:scale-95 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Save
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmation && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-[60]"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              handleClose();
            }
          }}
        >
          <div 
            className="bg-white rounded-lg shadow-2xl max-w-sm w-full p-6 animate-in fade-in zoom-in duration-200 relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button for confirmation */}
            <button
              type="button"
              onClick={() => setShowConfirmation(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors z-10"
              aria-label="Close confirmation"
            >
              <X size={20} />
            </button>

            {isSaving ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  Saving Credit...
                </h3>
                <p className="text-sm text-gray-600">
                  Please wait while we add the leave credit
                </p>
              </div>
            ) : (
              <>
                <div className="text-center pt-4">
                  <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                    <Plus className="h-6 w-6 text-green-600" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">
                    Confirm Add Credit
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Are you sure you want to add leave credit for this employee?
                  </p>
                  <div className="bg-gray-50 rounded-lg p-3 text-left space-y-1">
                    <p className="text-xs text-gray-600">
                      <span className="font-semibold">Employee:</span> {formData.employeeName}
                    </p>
                    <p className="text-xs text-gray-600">
                      <span className="font-semibold">Department:</span> {formData.department}
                    </p>
                    <p className="text-xs text-gray-600">
                      <span className="font-semibold">Credits:</span> {formData.credits} day{parseInt(formData.credits, 10) > 1 ? 's' : ''}
                    </p>
                    <p className="text-xs text-gray-600">
                      <span className="font-semibold">Date:</span> {formatDate(formData.date)}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowConfirmation(false)}
                    className="px-4 py-2 text-sm border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-all"
                  >
                    Go Back
                  </button>
                  <button
                    type="button"
                    onClick={confirmSave}
                    className="px-4 py-2 text-sm border-2 border-green-600 text-green-700 rounded-lg font-semibold hover:bg-green-50 transition-all flex items-center justify-center gap-2"
                  >
                    <Plus size={16} />
                    Confirm
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}