// ProcessModal.jsx for Undertime (in ../../components/Modal UI/UndertimeFormAdminModal/Process)
import { useState } from "react";
import { X, FileText, User, Clock, MessageSquare, Building } from "lucide-react";

export default function ProcessModal({ isOpen, onClose, onProcess }) {
  const [formData, setFormData] = useState({
    employeeName: "",
    date: "",
    timeOut: "",
    reason: "",
    formFile: null,
  });

  const [errors, setErrors] = useState({});
  const [fileName, setFileName] = useState("");

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ""
      }));
    }
  };

  // Handle file upload
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      const validTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
      if (!validTypes.includes(file.type)) {
        setErrors(prev => ({
          ...prev,
          formFile: "Only PDF and image files are allowed"
        }));
        return;
      }

      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        setErrors(prev => ({
          ...prev,
          formFile: "File size must be less than 5MB"
        }));
        return;
      }

      setFileName(file.name);
      setFormData(prev => ({
        ...prev,
        formFile: file
      }));
      
      // Clear file error
      if (errors.formFile) {
        setErrors(prev => ({
          ...prev,
          formFile: ""
        }));
      }
    }
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};

    if (!formData.employeeName.trim()) {
      newErrors.employeeName = "Employee name is required";
    }

    if (!formData.date) {
      newErrors.date = "Date is required";
    }

    if (!formData.timeOut) {
      newErrors.timeOut = "Time out is required";
    }

    if (!formData.reason.trim()) {
      newErrors.reason = "Reason is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = () => {
    if (validateForm()) {
      const id = `EMP${Date.now().toString().slice(-3)}`;

      const newUndertime = {
        id,
        employeeName: formData.employeeName,
        date: formData.date,
        timeOut: formData.timeOut,
        status: "Pending Send",
        sentDate: "",
        reviewRequest: "Pending",
        process: "Pending",
        sentForm: "Pending",
        receivedForm: "Pending",
        reason: formData.reason,
        formFile: formData.formFile ? URL.createObjectURL(formData.formFile) : null,
        fileName: formData.formFile ? formData.formFile.name : null,
        submittedDate: new Date().toLocaleDateString("en-US"),
        receivedDate: "",
      };

      onProcess(newUndertime);
      
      // Reset form and close
      resetForm();
      onClose();
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      employeeName: "",
      date: "",
      timeOut: "",
      reason: "",
      formFile: null,
    });
    setFileName("");
    setErrors({});
  };

  // Handle close with confirmation
  const handleClose = () => {
    const hasData = formData.employeeName || formData.date || formData.timeOut || formData.reason;
    
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div 
        className="bg-white rounded-lg shadow-xl max-w-md w-full overflow-hidden flex flex-col" 
        style={{ height: 'auto', maxHeight: '90vh' }}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-950 to-green-700 flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <FileText className="text-white" size={24} />
            <h2 className="text-xl font-bold text-white">Process New Undertime Request</h2>
          </div>
          <button 
            onClick={handleClose} 
            className="text-white hover:text-gray-200 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto flex-1">
          <div className="bg-white border-2 border-gray-200 rounded-xl p-4 shadow-md hover:shadow-lg transition-shadow">
            <div className="space-y-3">
              {/* Employee Name - Full Width */}
              <div>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                  <input
                    type="text"
                    name="employeeName"
                    value={formData.employeeName}
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

              {/* Date - Full Width */}
              <div>
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleInputChange}
                  className={`w-full pl-3 pr-3 py-2 text-sm border-2 ${errors.date ? 'border-red-400' : 'border-gray-300'} rounded-lg bg-white focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100`}
                />
                <label className="block mt-1 text-xs font-semibold text-gray-700">
                  Date
                </label>
                {errors.date && (
                  <p className="text-xs text-red-500 mt-1">{errors.date}</p>
                )}
              </div>

              {/* Time Out - Full Width */}
              <div>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                  <input
                    type="time"
                    name="timeOut"
                    value={formData.timeOut}
                    onChange={handleInputChange}
                    className={`w-full pl-10 pr-3 py-2 text-sm border-2 ${errors.timeOut ? 'border-red-400' : 'border-gray-300'} rounded-lg bg-white focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100`}
                  />
                </div>
                <label className="block mt-1 text-xs font-semibold text-gray-700">
                  Time Out
                </label>
                {errors.timeOut && (
                  <p className="text-xs text-red-500 mt-1">{errors.timeOut}</p>
                )}
              </div>

              {/* File Upload */}
              <div>
                <label 
                  htmlFor="file-upload"
                  className={`w-full px-3 py-2 text-sm border-2 ${errors.formFile ? 'border-red-400 bg-red-50' : fileName ? 'border-blue-400 bg-blue-50' : 'border-gray-300 bg-gray-50'} rounded-lg cursor-pointer flex items-center justify-between transition-all hover:bg-opacity-80`}
                >
                  <div className="flex items-center gap-2">
                    {fileName ? (
                      <span className="text-blue-700 font-medium truncate">{fileName}</span>
                    ) : (
                      <span className="text-gray-600">Upload undertime form (Optional)</span>
                    )}
                  </div>
                </label>
                <input
                  id="file-upload"
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <label className="block mt-1 text-xs font-semibold text-gray-700">
                  Supporting Document
                </label>
                {errors.formFile && (
                  <p className="text-xs text-red-500 mt-1">{errors.formFile}</p>
                )}
                <p className="text-xs text-gray-500 mt-1">PDF, JPG, PNG (Max 5MB)</p>
              </div>

              {/* Reason - Text Area */}
              <div>
                <div className="relative">
                  <MessageSquare className="absolute left-3 top-3 text-gray-400" size={16} />
                  <textarea
                    name="reason"
                    value={formData.reason}
                    onChange={handleInputChange}
                    rows="4"
                    placeholder=""
                    className={`w-full pl-10 pr-3 py-2 text-sm border-2 ${errors.reason ? 'border-red-400' : 'border-gray-300'} rounded-lg bg-white resize-none focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100`}
                  />
                </div>
                <label className="block mt-1 text-xs font-semibold text-gray-700">
                  Reason
                </label>
                {errors.reason && (
                  <p className="text-xs text-red-500 mt-1">{errors.reason}</p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2 text-sm border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 active:scale-95 transition-all shadow-sm"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  className="px-4 py-2 text-sm border-2 border-green-600 text-green-700 rounded-lg font-semibold hover:bg-green-50 active:scale-95 transition-all shadow-sm"
                >
                  Create Request
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}