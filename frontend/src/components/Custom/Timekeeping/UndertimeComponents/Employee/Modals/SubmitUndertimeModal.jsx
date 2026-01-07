import { useState, useEffect } from 'react';
import { X, Calendar, Clock, XCircle, Upload, FileText } from 'lucide-react';
import { useAuth } from '@hooks/useAuth';

// File configuration
const FILE_CONFIG = {
  maxSize: 5 * 1024 * 1024, // 5MB
  allowedExtensions: '.pdf'
};

export const SubmitUndertimeModal = ({ isOpen, onSubmit, onClose }) => {
  const { user, department: userDepartment } = useAuth();
  const [formData, setFormData] = useState({ date: '', timeOut: '', reason: '', attachment: null });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fileError, setFileError] = useState('');

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setFormData({ date: '', timeOut: '', reason: '', attachment: null });
      setErrors({});
      setIsSubmitting(false);
      setFileError('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleChange = (field) => (e) => {
    const value = e.target.value;
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setFileError('');
    
    if (!file) return;

    // Validate file size
    if (file.size > FILE_CONFIG.maxSize) {
      setFileError('File size must be less than 5MB');
      return;
    }

    // Validate file type
    const allowedTypes = ['application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      setFileError('Only PDF files are allowed');
      return;
    }

    setFormData(prev => ({ ...prev, attachment: file }));
  };

  const handleRemoveFile = () => {
    setFormData(prev => ({ ...prev, attachment: null }));
    setFileError('');
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.date) newErrors.date = 'Date is required';
    if (!formData.timeOut) newErrors.timeOut = 'Time out is required';
    if (!formData.reason.trim()) newErrors.reason = 'Reason is required';
    if (formData.reason.trim().length < 10) {
      newErrors.reason = 'Reason must be at least 10 characters';
    }
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
      handleClose();
    } catch (error) {
      console.error('Error submitting undertime request:', error);
      setErrors({ 
        submit: error.response?.data?.message || error.message || 'Failed to submit undertime request' 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setFormData({ date: '', timeOut: '', reason: '', attachment: null });
    setErrors({});
    setFileError('');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 transition-all">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md border border-gray-100 overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 shrink-0">
          <div className="flex items-center gap-2">
            <h3 className="text-xl font-bold text-gray-900">Submit Undertime</h3>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto p-6 space-y-4">
          <form onSubmit={handleSubmit} id="undertime-form" className="space-y-4">
            {/* Error Alert */}
            {errors.submit && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm">
                <XCircle className="w-4 h-4 flex-shrink-0" />
                <span>{errors.submit}</span>
              </div>
            )}

            {/* Employee Name & Department (Read-only) - Grid Layout */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Employee Name
                </label>
                <input
                  type="text"
                  value={user?.name || `${user?.first_name || ''} ${user?.last_name || ''}`.trim() || 'Loading...'}
                  readOnly
                  placeholder="Your name"
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 text-gray-500 font-medium cursor-not-allowed focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Department
                </label>
                <input
                  type="text"
                  value={userDepartment || user?.department || 'Loading...'}
                  readOnly
                  placeholder="Your department"
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 text-gray-500 font-medium cursor-not-allowed focus:outline-none"
                />
              </div>
            </div>

            {/* Date & Time Out - Grid Layout */}
            <div className="grid grid-cols-2 gap-4">
              {/* Date Field */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Date
                </label>
                <div className="relative">
                  <Calendar className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  <input
                    type="date"
                    value={formData.date}
                    onChange={handleChange('date')}
                    className={`w-full pl-10 pr-3 py-2 text-sm border ${
                      errors.date ? 'border-red-500' : 'border-gray-200'
                    } rounded-lg focus:outline-none focus:border-gray-300 focus:ring-4 focus:ring-gray-100 transition-all`}
                    required
                  />
                </div>
                {errors.date && <p className="text-red-500 text-xs mt-1">{errors.date}</p>}
              </div>

              {/* Time Out Field */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Time Out
                </label>
                <div className="relative">
                  <Clock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  <input
                    type="time"
                    value={formData.timeOut}
                    onChange={handleChange('timeOut')}
                    className={`w-full pl-10 pr-3 py-2 text-sm border ${
                      errors.timeOut ? 'border-red-500' : 'border-gray-200'
                    } rounded-lg focus:outline-none focus:border-gray-300 focus:ring-4 focus:ring-gray-100 transition-all`}
                    required
                  />
                </div>
                {errors.timeOut && <p className="text-red-500 text-xs mt-1">{errors.timeOut}</p>}
              </div>
            </div>

            {/* Info Banner */}
            <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg">
              <p className="text-sm text-blue-800">
                <span className="font-semibold">Note:</span> Undertime requests must be approved by your Administrator.
                Please ensure you have a valid reason for leaving early.
              </p>
            </div>

            {/* Reason Field */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Description/Reason
              </label>
              <textarea
                value={formData.reason}
                onChange={handleChange('reason')}
                placeholder="Please provide a detailed reason for your undertime request..."
                className={`w-full px-3 py-2 text-sm border ${
                  errors.reason ? 'border-red-500' : 'border-gray-200'
                } rounded-lg focus:outline-none focus:border-gray-300 focus:ring-4 focus:ring-gray-100 transition-all resize-none`}
                rows={4}
                required
              />
              <p className="text-gray-400 text-xs mt-1 text-right">
                {formData.reason.length} characters
              </p>
              {errors.reason && <p className="text-red-500 text-xs mt-1">{errors.reason}</p>}
            </div>

            {/* File Upload */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Attach Supporting Documents
              </label>
              
              <div className="border border-dashed border-gray-300 rounded-lg p-4 hover:border-gray-400 transition-colors bg-gray-50/50">
                {!formData.attachment ? (
                  /* Upload Area - show when no file is uploaded */
                  <div className="text-center">
                    <input
                      type="file"
                      id="undertimeFileUpload"
                      onChange={handleFileChange}
                      accept={FILE_CONFIG.allowedExtensions}
                      className="hidden"
                    />
                    <label htmlFor="undertimeFileUpload" className="cursor-pointer">
                      <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                      <p className="text-sm text-gray-600 font-medium">Click to upload or drag and drop</p>
                      <p className="text-xs text-gray-500 mt-1">
                        <span className="text-red-500 font-medium">PDF</span> only (max 5MB)
                      </p>
                    </label>
                  </div>
                ) : (
                  /* File Preview - show when file is uploaded */
                  <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200 shadow-sm">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="p-2 bg-red-50 rounded text-red-500">
                        <FileText className="w-5 h-5 flex-shrink-0" />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-sm font-medium text-gray-900 truncate">{formData.attachment.name}</span>
                        <span className="text-xs text-gray-500">
                          {(formData.attachment.size / 1024).toFixed(1)} KB
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleRemoveFile}
                      className="text-gray-400 hover:text-red-500 p-1.5 hover:bg-red-50 rounded-full transition-colors"
                      aria-label="Remove file"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              {fileError && <p className="text-red-500 text-xs mt-1">{fileError}</p>}
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex gap-3 shrink-0">
          <button
            type="button"
            onClick={handleClose}
            disabled={isSubmitting}
            className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:text-gray-900 transition-colors shadow-sm disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="undertime-form"
            disabled={isSubmitting}
            className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800 transition-all shadow-lg shadow-gray-900/20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Request'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SubmitUndertimeModal;
