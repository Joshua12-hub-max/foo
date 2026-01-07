import React, { useState } from "react";
import { X } from "lucide-react";
import { dtrCorrectionApi } from "@api";

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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 transition-all">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md border border-gray-100 overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 shrink-0">
          <h2 className="text-xl font-bold text-gray-900">DTR Correction Request</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Date Time */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              name="date_time"
              value={formData.date_time}
              onChange={handleChange}
              className="w-full px-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-gray-300 focus:ring-4 focus:ring-gray-100 transition-all font-medium text-gray-700"
              required
            />
          </div>

          {/* Original In/Out Time - Grid */}
          <div className="grid grid-cols-2 gap-4">
            {/* In Time */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Original In Time
              </label>
              <input
                type="time"
                name="in_time"
                value={formData.in_time}
                onChange={handleChange}
                className="w-full px-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-gray-300 focus:ring-4 focus:ring-gray-100 transition-all text-gray-700"
              />
            </div>

            {/* Out Time */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Original Out Time
              </label>
              <input
                type="time"
                name="out_time"
                value={formData.out_time}
                onChange={handleChange}
                className="w-full px-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-gray-300 focus:ring-4 focus:ring-gray-100 transition-all text-gray-700"
              />
            </div>
          </div>

          {/* Corrected Time */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Corrected Time <span className="text-red-500">*</span>
            </label>
            <input
              type="time"
              name="corrected_time"
              value={formData.corrected_time}
              onChange={handleChange}
              className="w-full px-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-gray-300 focus:ring-4 focus:ring-gray-100 transition-all font-medium text-gray-800"
              required
            />
          </div>

          {/* Reason */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Reason for Correction <span className="text-red-500">*</span>
            </label>
            <textarea
              name="reason"
              value={formData.reason}
              onChange={handleChange}
              placeholder="Explain why you need this DTR correction..."
              className="w-full px-4 py-3 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-gray-300 focus:ring-4 focus:ring-gray-100 transition-all resize-none font-medium text-gray-700"
              rows="3"
              required
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex gap-3 shrink-0">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:text-gray-900 transition-colors shadow-sm disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 px-4 py-2.5 text-sm font-medium bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-all shadow-lg shadow-gray-900/20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Submitting..." : "Submit Request"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DTRCorrectionRequestModal;
