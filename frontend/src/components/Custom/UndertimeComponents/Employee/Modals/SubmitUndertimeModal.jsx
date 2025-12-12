import { useState, useEffect } from 'react';
import { X, Calendar, Clock, XCircle, Upload, FileText } from 'lucide-react';
import { useAuth } from '../../../../../hooks/useAuth';

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
    <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gray-200 border-b border-gray-200 px-4 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-xl font-bold text-gray-800">Submit Undertime</h3>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-6 h-6 text-red-800" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-3">
          {/* Error Alert */}
          {errors.submit && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm">
              <XCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errors.submit}</span>
            </div>
          )}

          {/* Employee Name & Department (Read-only) - Grid Layout */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Employee Name
              </label>
              <input
                type="text"
                value={user?.name || `${user?.first_name || ''} ${user?.last_name || ''}`.trim() || 'Loading...'}
                readOnly
                placeholder="Your name"
                className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-lg shadow-md bg-gray-50 text-gray-700 font-medium cursor-not-allowed focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Department
              </label>
              <input
                type="text"
                value={userDepartment || user?.department || 'Loading...'}
                readOnly
                placeholder="Your department"
                className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-lg shadow-md bg-gray-50 text-gray-700 font-medium cursor-not-allowed focus:outline-none"
              />
            </div>
          </div>

          {/* Date & Time Out - Grid Layout */}
          <div className="grid grid-cols-2 gap-3">
            {/* Date Field */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Date
              </label>
              <div className="relative">
                <Calendar className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                <input
                  type="date"
                  value={formData.date}
                  onChange={handleChange('date')}
                  className={`w-full pl-9 pr-2.5 py-1.5 text-sm border ${
                    errors.date ? 'border-red-500' : 'border-gray-300'
                  } rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-gray-200 focus:border-gray-200`}
                  required
                />
              </div>
              {errors.date && <p className="text-red-500 text-xs mt-1">{errors.date}</p>}
            </div>

            {/* Time Out Field */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Time Out
              </label>
              <div className="relative">
                <Clock className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                <input
                  type="time"
                  value={formData.timeOut}
                  onChange={handleChange('timeOut')}
                  className={`w-full pl-9 pr-2.5 py-1.5 text-sm border ${
                    errors.timeOut ? 'border-red-500' : 'border-gray-300'
                  } rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-gray-200 focus:border-gray-200`}
                  required
                />
              </div>
              {errors.timeOut && <p className="text-red-500 text-xs mt-1">{errors.timeOut}</p>}
            </div>
          </div>

          {/* Info Banner */}
          <div className="p-2 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-xs text-blue-800">
              <span className="font-semibold">Note:</span> Undertime requests must be approved by your Administrator.
              Please ensure you have a valid reason for leaving early.
            </p>
          </div>

          {/* Reason Field */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
              Description/Reason
            </label>
            <textarea
              value={formData.reason}
              onChange={handleChange('reason')}
              placeholder="Please provide a detailed reason for your undertime request..."
              className={`w-full px-2.5 py-1.5 text-sm border ${
                errors.reason ? 'border-red-500' : 'border-gray-300'
              } rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-gray-200 focus:border-gray-200 resize-none`}
              rows={4}
              required
            />
            <p className="text-gray-500 text-xs mt-1 text-right">
              {formData.reason.length} characters
            </p>
            {errors.reason && <p className="text-red-500 text-xs mt-1">{errors.reason}</p>}
          </div>

          {/* File Upload */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
              Attach Supporting Documents
            </label>
            
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-3 hover:border-[#274b46] transition-colors">
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
                    <Upload className="w-6 h-6 mx-auto text-gray-400 mb-1.5" />
                    <p className="text-xs text-gray-600">Click to upload or drag and drop</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      <span className="text-red-500 font-medium">PDF</span> only (max 5MB)
                    </p>
                  </label>
                </div>
              ) : (
                /* File Preview - show when file is uploaded */
                <div className="flex items-center justify-between p-2 bg-white rounded border border-gray-200">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <FileText className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
                    <span className="text-xs text-gray-700 truncate">{formData.attachment.name}</span>
                    <span className="text-xs text-gray-500 flex-shrink-0">
                      ({(formData.attachment.size / 1024).toFixed(1)} KB)
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleRemoveFile}
                    className="text-red-500 hover:text-red-700 p-1"
                    aria-label="Remove file"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>

            {fileError && <p className="text-red-500 text-xs mt-1">{fileError}</p>}
          </div>

          {/* Action Buttons - Compact */}
          <div className="flex gap-2 pt-3 border-t border-gray-200">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="flex-1 px-3 py-2 text-sm bg-gray-200 text-gray-700 rounded-lg hover:text-red-800 transition-colors font-medium disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-3 py-2 text-sm bg-gray-200 text-gray-700 rounded-lg hover:text-green-800 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SubmitUndertimeModal;
