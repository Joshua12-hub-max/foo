import { X, Upload, Calendar, FileText } from "lucide-react";
import { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import { leaveApi } from "../../../../../../api/leaveApi";

export const SubmitLeaveRequestModal = ({ isOpen, onSubmit, onClose }) => {
  const outletContext = useOutletContext?.() || {};
  const { employeeInfo } = outletContext;

  const [formData, setFormData] = useState({
    employeeName: employeeInfo?.name || "",
    department: employeeInfo?.department || "",
    leaveType: "",
    isPaid: true,
    startDate: "",
    endDate: "",
    duration: 0,
    description: "",
    attachment: null // Single file
  });

  const [errors, setErrors] = useState({});
  const [fileError, setFileError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Update form when employee info changes
  useEffect(() => {
    if (employeeInfo) {
      setFormData(prev => ({
        ...prev,
        employeeName: employeeInfo.name || "",
        department: employeeInfo.department || ""
      }));
    }
  }, [employeeInfo]);

  // Calculate duration when dates change
  useEffect(() => {
    if (formData.startDate && formData.endDate) {
      const start = new Date(formData.startDate);
      const end = new Date(formData.endDate);
      const diffTime = end - start;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // inclusive
      setFormData(prev => ({ ...prev, duration: diffDays > 0 ? diffDays : 0 }));
    } else {
      setFormData(prev => ({ ...prev, duration: 0 }));
    }
  }, [formData.startDate, formData.endDate]);

  if (!isOpen) return null;

  const leaveTypes = [
    "Sick Leave",
    "Vacation Leave",
    "Personal Leave",
    "Emergency Leave",
    "Bereavement Leave",
    "Maternity Leave",
    "Paternity Leave",
    "Other"
  ];

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }));
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }));
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setFileError("");

    if (!file) return;

    // Validate file
    const maxSize = 5 * 1024 * 1024; // 5MB
    const allowedTypes = ["application/pdf", "image/jpeg", "image/png", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
    
    if (file.size > maxSize) {
      setFileError(`File ${file.name} exceeds 5MB limit`);
      return;
    }
    if (!allowedTypes.includes(file.type)) {
      setFileError(`File ${file.name} has invalid type. Only PDF, JPG, PNG, DOCX allowed`);
      return;
    }

    setFormData(prev => ({
      ...prev,
      attachment: file
    }));
  };

  const removeFile = () => {
    setFormData(prev => ({
      ...prev,
      attachment: null
    }));
  };

  const validate = () => {
    const newErrors = {};
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (!formData.leaveType) newErrors.leaveType = "Leave type is required";
    if (!formData.startDate) newErrors.startDate = "Start date is required";
    if (!formData.endDate) newErrors.endDate = "End date is required";
    
    if (formData.startDate) {
      const startDate = new Date(formData.startDate);
      if (startDate < today) {
        newErrors.startDate = "Start date cannot be in the past";
      }
    }

    if (formData.startDate && formData.endDate) {
      const start = new Date(formData.startDate);
      const end = new Date(formData.endDate);
      if (end < start) {
        newErrors.endDate = "End date must be on or after start date";
      }
    }

    if (!formData.description.trim()) {
      newErrors.description = "Description is required";
    } else if (formData.description.trim().length < 10) {
      newErrors.description = "Description must be at least 10 characters";
    }

    if (!formData.attachment) {
      newErrors.attachment = "Supporting document is required";
    }

    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = validate();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      const data = new FormData();
      data.append('employeeId', employeeInfo?.employee_id || employeeInfo?.id); // Ensure correct ID field
      data.append('leaveType', formData.leaveType);
      data.append('startDate', formData.startDate);
      data.append('endDate', formData.endDate);
      data.append('reason', formData.description);
      data.append('withPay', formData.isPaid);
      
      if (formData.attachment) {
        data.append('attachment', formData.attachment);
      }

      await leaveApi.applyLeave(data);
      
      // Notify parent
      if (onSubmit) onSubmit();
      
      handleClose();
    } catch (error) {
      console.error("Error applying for leave:", error);
      setErrors({ submit: error.response?.data?.message || "Failed to submit leave request" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setFormData({
      employeeName: employeeInfo?.name || "",
      department: employeeInfo?.department || "",
      leaveType: "",
      isPaid: true,
      startDate: "",
      endDate: "",
      duration: 0,
      description: "",
      attachment: null
    });
    setErrors({});
    setFileError("");
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-6 h-6 text-[#274b46]" />
            <h3 className="text-xl font-bold text-gray-800">Submit Leave Request</h3>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {errors.submit && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
              <span className="block sm:inline">{errors.submit}</span>
            </div>
            )}
          {/* Employee Name - Auto-filled, Read-only */}
          <div>
            <label htmlFor="employeeName" className="block text-sm font-semibold text-gray-700 mb-2">
              Employee Name *
            </label>
            <input
              type="text"
              id="employeeName"
              name="employeeName"
              value={formData.employeeName}
              readOnly
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed"
            />
          </div>

          {/* Department - Auto-filled, Read-only */}
          <div>
            <label htmlFor="department" className="block text-sm font-semibold text-gray-700 mb-2">
              Department *
            </label>
            <input
              type="text"
              id="department"
              name="department"
              value={formData.department}
              readOnly
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed"
            />
          </div>

          {/* Leave Type */}
          <div>
            <label htmlFor="leaveType" className="block text-sm font-semibold text-gray-700 mb-2">
              Leave Type *
            </label>
            <select
              id="leaveType"
              name="leaveType"
              value={formData.leaveType}
              onChange={handleChange}
              className={`w-full px-3 py-2 border ${errors.leaveType ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-[#274b46] focus:border-[#274b46]`}
              required
            >
              <option value="">Select leave type...</option>
              {leaveTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
            {errors.leaveType && <p className="text-red-500 text-xs mt-1">{errors.leaveType}</p>}
          </div>

          {/* Paid Leave Toggle */}
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <label htmlFor="isPaid" className="text-sm font-semibold text-gray-700 flex-1">
              Paid Leave
            </label>
            <div className="flex items-center gap-2">
              <span className={`text-sm ${!formData.isPaid ? 'font-semibold text-gray-800' : 'text-gray-500'}`}>No</span>
              <label className="relative inline-block w-12 h-6 cursor-pointer">
                <input
                  type="checkbox"
                  id="isPaid"
                  name="isPaid"
                  checked={formData.isPaid}
                  onChange={handleChange}
                  className="sr-only peer"
                />
                <div className="w-12 h-6 bg-gray-300 rounded-full peer peer-checked:bg-[#274b46] transition-colors"></div>
                <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-6"></div>
              </label>
              <span className={`text-sm ${formData.isPaid ? 'font-semibold text-gray-800' : 'text-gray-500'}`}>Yes</span>
            </div>
          </div>

          {/* Start Date */}
          <div>
            <label htmlFor="startDate" className="block text-sm font-semibold text-gray-700 mb-2">
              Start Date *
            </label>
            <div className="relative">
              <Calendar className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <input
                type="date"
                id="startDate"
                name="startDate"
                value={formData.startDate}
                onChange={handleChange}
                className={`w-full pl-10 pr-3 py-2 border ${errors.startDate ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-[#274b46] focus:border-[#274b46]`}
                required
              />
            </div>
            {errors.startDate && <p className="text-red-500 text-xs mt-1">{errors.startDate}</p>}
          </div>

          {/* End Date */}
          <div>
            <label htmlFor="endDate" className="block text-sm font-semibold text-gray-700 mb-2">
              End Date *
            </label>
            <div className="relative">
              <Calendar className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <input
                type="date"
                id="endDate"
                name="endDate"
                value={formData.endDate}
                onChange={handleChange}
                className={`w-full pl-10 pr-3 py-2 border ${errors.endDate ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-[#274b46] focus:border-[#274b46]`}
                required
              />
            </div>
            {errors.endDate && <p className="text-red-500 text-xs mt-1">{errors.endDate}</p>}
          </div>

          {/* Duration - Auto-calculated */}
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <span className="font-semibold">Duration:</span> {formData.duration} {formData.duration === 1 ? 'day' : 'days'}
            </p>
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-semibold text-gray-700 mb-2">
              Description/Reason *
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Please provide a detailed reason for your leave request..."
              className={`w-full px-3 py-2 border ${errors.description ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-[#274b46] focus:border-[#274b46] resize-none`}
              rows={4}
              required
            />
            <div className="flex justify-between mt-1">
              {errors.description && <p className="text-red-500 text-xs">{errors.description}</p>}
              <p className="text-gray-500 text-xs ml-auto">{formData.description.length} characters</p>
            </div>
          </div>

          {/* File Attachments */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Attach Supporting Documents *
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-[#274b46] transition-colors">
              <input
                type="file"
                id="fileUpload"
                onChange={handleFileChange}
                accept=".pdf,.jpg,.jpeg,.png,.docx"
                className="hidden"
              />
              <label htmlFor="fileUpload" className="cursor-pointer">
                <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                <p className="text-sm text-gray-600">
                  Click to upload or drag and drop
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  PDF, JPG, PNG, DOCX (max 5MB)
                </p>
              </label>
            </div>
            {fileError && <p className="text-red-500 text-xs mt-1">{fileError}</p>}
            {errors.attachment && <p className="text-red-500 text-xs mt-1">{errors.attachment}</p>}
            
            {/* File List */}
            {formData.attachment && (
              <div className="mt-3 space-y-2">
                <div className="flex items-center justify-between p-2 bg-gray-50 rounded border border-gray-200">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <FileText className="w-4 h-4 text-gray-500 flex-shrink-0" />
                    <span className="text-sm text-gray-700 truncate">{formData.attachment.name}</span>
                    <span className="text-xs text-gray-500 flex-shrink-0">
                      ({(formData.attachment.size / 1024).toFixed(1)} KB)
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={removeFile}
                    className="text-red-500 hover:text-red-700 p-1"
                    aria-label="Remove file"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 bg-[#274b46] text-white rounded-lg hover:bg-[#1f3d39] transition-colors font-medium disabled:opacity-50"
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
