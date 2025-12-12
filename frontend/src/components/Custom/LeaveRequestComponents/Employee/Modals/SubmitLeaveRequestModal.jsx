import { useState, useMemo } from 'react';
import { leaveApi } from '../../../../../api/leaveApi';
import { useLeaveRequestForm } from './hooks/useLeaveRequestForm';
import { LEAVE_TYPES } from './constants/modalConstants';
import ModalHeader from './components/ModalHeader';
import FormInput from './components/FormInput';
import DateInput from './components/DateInput';
import FileUpload from './components/FileUpload';
import { AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

// Map leave types to credit types (matches government leave types)
const LEAVE_TYPE_TO_CREDIT = {
  'Vacation Leave': 'Vacation Leave',
  'Sick Leave': 'Sick Leave',
  'Maternity Leave': 'Maternity Leave',
  'Paternity Leave': 'Paternity Leave',
  'Solo Parent Leave': 'Solo Parent Leave',
  'Special Leave Benefits for Women': 'Special Leave Benefits for Women',
  'Special Emergency Leave': 'Special Emergency Leave',
  'Rehabilitation Leave': 'Rehabilitation Leave',
  'Study Leave': 'Study Leave',
  'VAWC Leave': 'VAWC Leave',
  'Special Privilege Leave': 'Special Privilege Leave',
  'Forced/Mandatory Leave': 'Vacation Leave', // Deducted from VL
  'Official Business': null, // No credit deduction
  'Other': null // No credit deduction
};

export const SubmitLeaveRequestModal = ({ isOpen, onSubmit, onClose, credits = [] }) => {
  const {
    formData,
    duration,
    isSubmitting,
    errors,
    user,
    userDepartment,
    handleChange,
    handleFileChange,
    validate,
    resetForm,
    setIsSubmitting,
    setErrors
  } = useLeaveRequestForm();

  const [fileError, setFileError] = useState('');
  const [creditWarning, setCreditWarning] = useState(null);

  // Get available credit for selected leave type
  const getAvailableCredit = (leaveType) => {
    const creditType = LEAVE_TYPE_TO_CREDIT[leaveType];
    if (!creditType) return null; // No credit requirement
    
    // Find credit with exact match first, then partial match
    let credit = credits.find(c => c.credit_type === creditType);
    
    // If no exact match, try partial matching (e.g., "Vacation" matches "Vacation Leave")
    if (!credit) {
      credit = credits.find(c => 
        c.credit_type.toLowerCase().includes(creditType.toLowerCase().replace(' leave', '')) ||
        creditType.toLowerCase().includes(c.credit_type.toLowerCase())
      );
    }
    
    return credit ? parseFloat(credit.balance) : 0;
  };

  const availableCredit = useMemo(() => {
    return getAvailableCredit(formData.leaveType);
  }, [formData.leaveType, credits]);

  // Check if sufficient credits
  const hasSufficientCredits = useMemo(() => {
    if (availableCredit === null) return true; // No credit required for this leave type
    if (!formData.isPaid) return true; // Unpaid leave doesn't use credits
    return availableCredit >= duration;
  }, [availableCredit, duration, formData.isPaid]);

  // Calculate remaining credits after this request
  const remainingCredits = useMemo(() => {
    if (availableCredit === null || !formData.isPaid) return null;
    return Math.max(0, availableCredit - duration);
  }, [availableCredit, duration, formData.isPaid]);

  // Return null AFTER all hooks are called
  if (!isOpen) return null;

  const handleFormChange = (field) => (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    handleChange(field, value);
    
    // Clear credit warning when changing leave type or paid status
    if (field === 'leaveType' || field === 'isPaid') {
      setCreditWarning(null);
    }
  };

  const onFileChange = (file) => {
    setFileError('');
    const result = handleFileChange(file);
    if (result?.error) {
      setFileError(result.error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    // Credit verification for paid leave
    if (formData.isPaid && !hasSufficientCredits) {
      setErrors({ 
        submit: `Insufficient leave credits. You have ${availableCredit || 0} days but need ${duration} days.` 
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const data = new FormData();
      data.append('employeeId', user?.employee_id || user?.employeeId || user?.id);
      data.append('leaveType', formData.leaveType);
      data.append('startDate', formData.startDate);
      data.append('endDate', formData.endDate);
      data.append('reason', formData.description);
      data.append('withPay', formData.isPaid);
      data.append('duration', duration); // Send duration for backend to deduct

      if (formData.attachment) {
        data.append('attachment', formData.attachment);
      }

      await leaveApi.applyLeave(data);

      if (onSubmit) onSubmit();
      handleClose();
    } catch (error) {
      console.error('Error applying for leave:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to submit leave request';
      setErrors({ 
        submit: errorMessage
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    resetForm();
    setFileError('');
    setCreditWarning(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        <ModalHeader onClose={handleClose} />

        <form onSubmit={handleSubmit} className="p-4 space-y-3">
          {/* Error Alert */}
          {errors.submit && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm">
              <XCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errors.submit}</span>
            </div>
          )}

          {/* Credit Info Banner */}
          {formData.leaveType && availableCredit !== null && (
            <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${
              hasSufficientCredits 
                ? 'bg-emerald-50 border border-emerald-200 text-emerald-700'
                : 'bg-amber-50 border border-amber-200 text-amber-700'
            }`}>
              {hasSufficientCredits ? (
                <CheckCircle className="w-4 h-4 flex-shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              )}
              <div className="flex-1">
                <span className="font-medium">{LEAVE_TYPE_TO_CREDIT[formData.leaveType]} Credits: </span>
                <span className="font-bold">{availableCredit} days</span>
                {formData.isPaid && duration > 0 && (
                  <span className="text-xs ml-2">
                    (After request: {remainingCredits} days remaining)
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Warning for insufficient credits */}
          {formData.isPaid && !hasSufficientCredits && duration > 0 && (
            <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm">
              <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">Insufficient Credits</p>
                <p className="text-xs mt-0.5">
                  You need {duration} days but only have {availableCredit || 0} days available.
                  Consider requesting unpaid leave or reducing the duration.
                </p>
              </div>
            </div>
          )}

          {/* Employee Name & Department (Read-only) - Grid Layout */}
          <div className="grid grid-cols-2 gap-3">
            <FormInput label="Employee Name" required>
              <input
                type="text"
                value={user?.name || 'Loading...'}
                readOnly
                placeholder="Your name"
                className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-lg bg-gray-50 text-gray-700 font-medium cursor-not-allowed focus:outline-none"
              />
            </FormInput>

            <FormInput label="Department" required>
              <input
                type="text"
                value={userDepartment || user?.department || 'Loading...'}
                readOnly
                placeholder="Your department"
                className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-lg bg-gray-50 text-gray-700 font-medium cursor-not-allowed focus:outline-none"
              />
            </FormInput>
          </div>

          {/* Leave Type & Paid Leave - Grid Layout */}
          <div className="grid grid-cols-2 gap-3">
            <FormInput label="Leave Type" error={errors.leaveType} required>
              <select
                value={formData.leaveType}
                onChange={handleFormChange('leaveType')}
                className={`w-full px-2.5 py-1.5 text-sm border ${
                  errors.leaveType ? 'border-red-500' : 'border-gray-300'
                } rounded-lg focus:ring-2 focus:ring-[#274b46] focus:border-[#274b46]`}
                required
              >
                <option value="">Select leave type...</option>
                {LEAVE_TYPES.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </FormInput>

            {/* Paid Leave Toggle - Compact */}
            <div className="flex flex-col">
              <label className="text-xs font-semibold text-gray-700 mb-1.5">Paid Leave</label>
              <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg h-[34px]">
                <span className={`text-xs ${!formData.isPaid ? 'font-semibold text-gray-800' : 'text-gray-500'}`}>
                  No
                </span>
                <label className="relative inline-block w-10 h-5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isPaid}
                    onChange={handleFormChange('isPaid')}
                    className="sr-only peer"
                  />
                  <div className="w-10 h-5 bg-gray-300 rounded-full peer peer-checked:bg-[#274b46] transition-colors"></div>
                  <div className="absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-5"></div>
                </label>
                <span className={`text-xs ${formData.isPaid ? 'font-semibold text-gray-800' : 'text-gray-500'}`}>
                  Yes
                </span>
              </div>
            </div>
          </div>

          {/* Start & End Date - Grid Layout */}
          <div className="grid grid-cols-2 gap-3">
            <DateInput
              label="Start Date"
              value={formData.startDate}
              onChange={handleFormChange('startDate')}
              error={errors.startDate}
              required
            />

            <DateInput
              label="End Date"
              value={formData.endDate}
              onChange={handleFormChange('endDate')}
              error={errors.endDate}
              required
            />
          </div>

          {/* Duration Display - Compact */}
          <div className="p-2 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-xs text-blue-800">
              <span className="font-semibold">Duration:</span> {duration} {duration === 1 ? 'day' : 'days'}
              {formData.isPaid && availableCredit !== null && (
                <span className="ml-2">
                  • <span className="font-semibold">Available Credits:</span> {availableCredit} days
                </span>
              )}
            </p>
          </div>

          {/* Description - Compact */}
          <FormInput label="Description/Reason" error={errors.description} required>
            <textarea
              value={formData.description}
              onChange={handleFormChange('description')}
              placeholder="Please provide a detailed reason for your leave request..."
              className={`w-full px-2.5 py-1.5 text-sm border ${
                errors.description ? 'border-red-500' : 'border-gray-300'
              } rounded-lg focus:ring-2 focus:ring-[#274b46] focus:border-[#274b46] resize-none`}
              rows={3}
              required
            />
            <p className="text-gray-500 text-xs mt-1 text-right">
              {formData.description.length} characters
            </p>
          </FormInput>

          {/* File Upload */}
          <FileUpload
            file={formData.attachment}
            onFileChange={onFileChange}
            onRemove={() => handleChange('attachment', null)}
            error={fileError || errors.attachment}
          />

          {/* Action Buttons - Compact */}
          <div className="flex gap-2 pt-3 border-t border-gray-200">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="flex-1 px-3 py-1.5 text-sm bg-gray-200 text-gray-700 rounded-lg shadow-md hover:bg-gray-300 transition-colors font-medium disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || (formData.isPaid && !hasSufficientCredits && duration > 0)}
              className="flex-1 px-3 py-1.5 text-sm bg-gray-200 text-gray-700 rounded-lg shadow-md hover:bg-gray-300 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SubmitLeaveRequestModal;
