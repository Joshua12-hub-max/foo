import React, { useState } from "react";
import { X, FileEdit } from "lucide-react";
import { dtrCorrectionApi } from "../../../../../api/dtrCorrectionApi";

const DTRCorrectionRequestModal = ({ isOpen, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    date_time: "",
    in_time: "",
    out_time: "",
    corrected_time: "",
    reason: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async () => {
    // Validate required fields
    if (!formData.date_time || !formData.corrected_time || !formData.reason) {
      setError("Please fill in all required fields");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await dtrCorrectionApi.submitEmployeeCorrection(formData);
      
      // Show success message and close modal
      if (onSuccess) {
        onSuccess(res.data);
      }
      
      // Reset form
      setFormData({
        date_time: "",
        in_time: "",
        out_time: "",
        corrected_time: "",
        reason: "",
      });
      
      onClose();
    } catch (err) {
      console.error("Error submitting DTR correction:", err);
      setError(err.response?.data?.message || "Failed to submit DTR correction");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="bg-gray-200 shadow-md p-6 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-800">DTR Correction Request</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Date Time */}
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-2">
              Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              name="date_time"
              value={formData.date_time}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-green-200 focus:border-transparent focus:outline-none"
              required
            />
          </div>

          {/* In Time */}
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-2">
              Original In Time (if applicable)
            </label>
            <input
              type="time"
              name="in_time"
              value={formData.in_time}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-green-200 focus:border-transparent focus:outline-none"
            />
          </div>

          {/* Out Time */}
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-2">
              Original Out Time (if applicable)
            </label>
            <input
              type="time"
              name="out_time"
              value={formData.out_time}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-green-200 focus:border-transparent focus:outline-none"
            />
          </div>

          {/* Corrected Time */}
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-2">
              Corrected Time <span className="text-red-500">*</span>
            </label>
            <input
              type="time"
              name="corrected_time"
              value={formData.corrected_time}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-green-200 focus:border-transparent focus:outline-none"
              required
            />
          </div>

          {/* Reason */}
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-2">
              Reason for Correction <span className="text-red-500">*</span>
            </label>
            <textarea
              name="reason"
              value={formData.reason}
              onChange={handleChange}
              placeholder="Explain why you need this DTR correction..."
              className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-green-200 focus:border-transparent focus:outline-none resize-none"
              rows="3"
              required
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-4 py-2.5 bg-gray-200 text-gray-700 font-medium rounded-lg shadow-md hover:bg-gray-300 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="flex-1 px-4 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium rounded-lg shadow-md transition-colors disabled:opacity-50"
            >
              {loading ? "Submitting..." : "Submit Request"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DTRCorrectionRequestModal;
