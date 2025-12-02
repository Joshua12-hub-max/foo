import { PlusCircle, X } from "lucide-react";
import { useState } from "react";

export const SubmitUndertimeModal = ({ isOpen, onSubmit, onClose }) => {
  const [formData, setFormData] = useState({ date: "", timeOut: "", reason: "" });
  const [errors, setErrors] = useState({});

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.date) newErrors.date = "Date is required";
    if (!formData.timeOut) newErrors.timeOut = "Time out is required";
    if (!formData.reason.trim()) newErrors.reason = "Reason is required";
    return newErrors;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = validate();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    onSubmit(formData);
    // Reset form
    setFormData({ date: "", timeOut: "", reason: "" });
    setErrors({});
  };

  const handleClose = () => {
    setFormData({ date: "", timeOut: "", reason: "" });
    setErrors({});
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <PlusCircle className="w-6 h-6 text-[#274b46]" />
            <h3 className="text-xl font-bold text-gray-800">Submit Undertime Request</h3>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600"
            aria-label="Close modal"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Date Field */}
          <div className="mb-4">
            <label htmlFor="date" className="block text-sm font-semibold text-gray-700 mb-2">
              Date *
            </label>
            <input
              type="date"
              id="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              className={`w-full px-3 py-2 border ${errors.date ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-[#274b46] focus:border-[#274b46]`}
              required
            />
            {errors.date && <p className="text-red-500 text-xs mt-1">{errors.date}</p>}
          </div>

          {/* Time Out Field */}
          <div className="mb-4">
            <label htmlFor="timeOut" className="block text-sm font-semibold text-gray-700 mb-2">
              Time Out *
            </label>
            <input
              type="time"
              id="timeOut"
              name="timeOut"
              value={formData.timeOut}
              onChange={handleChange}
              className={`w-full px-3 py-2 border ${errors.timeOut ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-[#274b46] focus:border-[#274b46]`}
              required
            />
            {errors.timeOut && <p className="text-red-500 text-xs mt-1">{errors.timeOut}</p>}
          </div>

          {/* Reason Field */}
          <div className="mb-6">
            <label htmlFor="reason" className="block text-sm font-semibold text-gray-700 mb-2">
              Reason *
            </label>
            <textarea
              id="reason"
              name="reason"
              value={formData.reason}
              onChange={handleChange}
              placeholder="Enter reason for undertime request..."
              className={`w-full px-3 py-2 border ${errors.reason ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-[#274b46] focus:border-[#274b46] resize-none`}
              rows={4}
              required
            />
            {errors.reason && <p className="text-red-500 text-xs mt-1">{errors.reason}</p>}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-[#274b46] text-white rounded-lg hover:bg-[#1f3d39] transition-colors"
            >
              Submit Request
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
