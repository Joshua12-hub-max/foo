// ApplyLeaveModal.jsx
import { useState } from 'react';
import { X, Calendar, AlertCircle, Upload, CheckCircle2, FileText } from 'lucide-react';

export default function ApplyLeaveModal({ isOpen, onClose }) {
  const [formData, setFormData] = useState({
    leaveType: '',
    reason: '',
    pdfFile: null
  });
  const [errors, setErrors] = useState({});
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const leaveTypes = [
    'Sick Leave',
    'Casual Leave',
    'Annual Leave',
    'Personal Leave',
    'Maternity/Paternity Leave',
    'Emergency Leave'
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type === 'application/pdf') {
      setFormData(prev => ({
        ...prev,
        pdfFile: file
      }));
      if (errors.pdfFile) {
        setErrors(prev => ({ ...prev, pdfFile: '' }));
      }
    } else if (file) {
      setErrors(prev => ({ ...prev, pdfFile: 'Please upload a PDF file only' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.leaveType) newErrors.leaveType = 'Please select a leave type';
    if (!formData.reason.trim()) newErrors.reason = 'Please provide a reason';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmitClick = () => {
    if (validateForm()) {
      setShowConfirmation(true);
    }
  };

  const confirmSubmit = () => {
    setIsSubmitting(true);

    setTimeout(() => {
      console.log('Leave application submitted:', formData);
      setIsSubmitting(false);
      setShowConfirmation(false);
      onClose();
      alert('Leave application submitted successfully!');
    }, 1000);
  };

  const handleXButtonClick = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    const hasData = formData.leaveType || formData.reason.trim() || formData.pdfFile;

    if (hasData) {
      if (window.confirm("You have unsaved changes. Are you sure you want to close?")) {
        onClose();
      }
    } else {
      onClose();
    }
  };

  const handleCancel = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    const hasData = formData.leaveType || formData.reason.trim() || formData.pdfFile;

    if (hasData) {
      if (window.confirm("You have unsaved changes. Are you sure you want to cancel?")) {
        onClose();
      }
    } else {
      onClose();
    }
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      handleXButtonClick(e);
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <>
      {/* Main Modal */}
      <div 
        className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4"
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
              <Calendar className="text-white" size={24} />
              <h2 className="text-xl font-bold text-white">Apply for Leave</h2>
            </div>
            <button
              type="button"
              onClick={handleXButtonClick}
              className="text-white hover:text-gray-200 transition-colors absolute top-4 right-4 z-20"
              aria-label="Close modal"
            >
              <X size={20} />
            </button>
          </div>

          {/* Content */}
          <div className="p-4">
            <div className="bg-white border-2 border-gray-200 rounded-xl p-4 shadow-md hover:shadow-lg transition-shadow">
              
              {/* Leave Type */}
              <div className="mb-5">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Type of Leave <span className="text-red-500">*</span>
                </label>
                <select
                  name="leaveType"
                  value={formData.leaveType}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 text-sm border-2 rounded-lg bg-white focus:outline-none transition-all ${
                    errors.leaveType ? 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-100' : 'border-gray-300 focus:border-green-500 focus:ring-2 focus:ring-green-100'
                  }`}
                >
                  <option value="">Select leave type</option>
                  {leaveTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
                {errors.leaveType && (
                  <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.leaveType}
                  </p>
                )}
              </div>

              {/* Upload PDF */}
              <div className="mb-5">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Upload Supporting Document{" "}
                  <span className="text-gray-400 font-normal">(Optional)</span>
                </label>
                
                {formData.pdfFile ? (
                  <div className="border-2 border-green-200 rounded-xl p-4 bg-gradient-to-br from-green-50 to-white shadow-sm">
                    <div className="bg-white rounded-lg p-3 border-2 border-green-300">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="bg-green-100 p-2 rounded-lg">
                            <FileText className="text-green-600" size={20} />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-gray-900">
                              {formData.pdfFile.name}
                            </p>
                            <p className="text-xs text-gray-500">
                              {(formData.pdfFile.size / 1024).toFixed(1)} KB
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, pdfFile: null }))}
                          className="text-red-500 hover:text-red-700 transition-colors"
                          title="Remove file"
                        >
                          <X size={20} />
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="relative">
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={handleFileChange}
                      className="hidden"
                      id="pdfUpload"
                    />
                    <label
                      htmlFor="pdfUpload"
                      className={`flex flex-col items-center justify-center gap-2 w-full px-4 py-6 border-2 border-dashed rounded-lg cursor-pointer transition-all ${
                        errors.pdfFile ? 'border-red-500 bg-red-50' : 'border-gray-300 hover:border-green-400 hover:bg-green-50'
                      }`}
                    >
                      <Upload className="w-8 h-8 text-gray-400" />
                      <span className="text-sm text-gray-600 font-medium">
                        Click to upload PDF file
                      </span>
                      <span className="text-xs text-gray-400">
                        PDF files only
                      </span>
                    </label>
                  </div>
                )}
                
                {errors.pdfFile && (
                  <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.pdfFile}
                  </p>
                )}
              </div>

              {/* Reason */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Reason <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <textarea
                    name="reason"
                    value={formData.reason}
                    onChange={handleChange}
                    maxLength={500}
                    rows="4"
                    placeholder="Please provide a reason for your leave..."
                    className={`w-full px-4 py-2 text-sm border-2 rounded-lg bg-white resize-none focus:outline-none transition-all ${
                      errors.reason ? 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-100' : 'border-gray-300 focus:border-green-500 focus:ring-2 focus:ring-green-100'
                    }`}
                  />
                </div>
                <div className="flex items-center justify-between mt-1">
                  {errors.reason ? (
                    <p className="text-xs text-red-500 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.reason}
                    </p>
                  ) : (
                    <span></span>
                  )}
                  <p className="text-xs text-gray-500">
                    {formData.reason.length}/500 characters
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={isSubmitting}
                  className="flex-1 px-3 py-2 text-sm border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 active:scale-95 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSubmitClick}
                  disabled={isSubmitting}
                  className="flex-1 px-3 py-2 text-sm border-2 border-green-600 text-green-700 rounded-lg font-semibold hover:bg-green-50 active:scale-95 transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Calendar size={16} />
                  Submit Application
                </button>
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
              setShowConfirmation(false);
            }
          }}
        >
          <div 
            className="bg-white rounded-lg shadow-2xl max-w-sm w-full p-6 animate-in fade-in zoom-in duration-200 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setShowConfirmation(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors z-10"
              aria-label="Close confirmation"
            >
              <X size={20} />
            </button>

            {isSubmitting ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  Submitting Application...
                </h3>
                <p className="text-sm text-gray-600">
                  Please wait while we process your request
                </p>
              </div>
            ) : (
              <>
                <div className="text-center pt-4">
                  <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                    <Calendar className="h-6 w-6 text-green-600" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">
                    Confirm Submission
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Are you sure you want to submit this leave application?
                  </p>
                  
                  {/* Summary */}
                  <div className="bg-gray-50 rounded-lg p-3 text-left mb-4">
                    <div className="text-xs space-y-1">
                      <p><span className="font-semibold">Leave Type:</span> {formData.leaveType}</p>
                      {formData.pdfFile && (
                        <p><span className="font-semibold">Document:</span> {formData.pdfFile.name}</p>
                      )}
                      {formData.reason && (
                        <p className="pt-1 border-t border-gray-200 mt-2">
                          <span className="font-semibold">Reason:</span>{" "}
                          {formData.reason.substring(0, 60)}
                          {formData.reason.length > 60 ? "..." : ""}
                        </p>
                      )}
                    </div>
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
                    onClick={confirmSubmit}
                    className="px-4 py-2 text-sm border-2 border-green-600 text-green-700 rounded-lg font-semibold hover:bg-green-50 transition-all flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 size={16} />
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
