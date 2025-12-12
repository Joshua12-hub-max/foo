import React, { useState } from "react";
import { X, XCircle } from "lucide-react";
import { dtrCorrectionApi } from "../../../../../api/dtrCorrectionApi";

const AdminDTRCorrectionReject = ({ isOpen, correction, onConfirm, onCancel }) => {
  const [rejectionReason, setRejectionReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      setError("Rejection reason is required");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await dtrCorrectionApi.rejectCorrection(correction?.id, rejectionReason);
      
      setRejectionReason("");
      if (onConfirm) {
        onConfirm();
      }
    } catch (err) {
      console.error("Error rejecting DTR correction:", err);
      setError(err.response?.data?.message || "Failed to reject DTR correction");
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
          <h2 className="text-xl font-bold text-gray-800">Reject DTR Correction</h2>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600 transition-colors">
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

          {correction && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg shadow-md p-4 space-y-3">
              <h3 className="text-sm font-semibold text-gray-700">Correction Details</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Date</span>
                  <span className="text-sm font-medium text-gray-700">{correction.date_time}</span>
                </div>
                {correction.in_time && (
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Original In Time</span>
                    <span className="text-sm font-medium text-gray-700">{correction.in_time}</span>
                  </div>
                )}
                {correction.out_time && (
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Original Out Time</span>
                    <span className="text-sm font-medium text-gray-700">{correction.out_time}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Corrected Time</span>
                  <span className="text-sm font-medium text-green-700">{correction.corrected_time}</span>
                </div>
                <div className="pt-2 border-t border-gray-200">
                  <span className="text-sm text-gray-600 block mb-1">Reason</span>
                  <p className="text-sm text-gray-700">{correction.reason}</p>
                </div>
              </div>
            </div>
          )}

          <div className="border-t border-gray-200"></div>

          {/* Rejection Reason */}
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-2">
              Rejection Reason <span className="text-red-500">*</span>
            </label>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Explain why this correction is being rejected..."
              className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-red-200 focus:border-transparent focus:outline-none resize-none transition-all"
              rows="4"
              required
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={onCancel}
              disabled={loading}
              className="flex-1 px-4 py-2.5 bg-[#F8F9FA] text-gray-700 font-medium rounded-lg shadow-md hover:bg-gray-100 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleReject}
              disabled={loading}
              className="flex-1 px-4 py-2.5 bg-[#F8F9FA] text-gray-700 font-medium rounded-lg shadow-md hover:bg-gray-100 transition-colors disabled:opacity-50"
            >
              {loading ? "Rejecting..." : "Reject Request"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDTRCorrectionReject;
