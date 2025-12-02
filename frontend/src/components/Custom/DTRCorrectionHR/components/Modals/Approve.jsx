import React from "react";
import { X, CheckCircle } from "lucide-react";
import { dtrCorrectionApi } from "../../../../../api/dtrCorrectionApi";

const AdminDTRCorrectionApprove = ({ isOpen, correction, remarks, onRemarksChange, onConfirm, onCancel }) => {
  if (!isOpen) return null;

  const handleApprove = async () => {
    try {
      // Backend takes (id) and auto-updates DTR. Remarks are not persisted in DB for approval currently.
      await dtrCorrectionApi.approveCorrection(correction?.id);
      if (onConfirm) {
        onConfirm();
      }
    } catch (error) {
      console.error("Error approving DTR correction:", error);
      alert(error.response?.data?.message || "Failed to approve DTR correction");
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-950 to-green-700 px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-6 h-6 text-white" />
            <div>
              <h2 className="text-lg font-bold text-white">Approve DTR Correction</h2>
              <p className="text-green-100 text-sm">Review and approve time correction</p>
            </div>
          </div>
          <button onClick={onCancel} className="text-green-100 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
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
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Status</span>
                  <span className="text-sm font-medium px-2 py-1 bg-yellow-100 text-yellow-700 rounded">
                    {correction.status}
                  </span>
                </div>
              </div>
            </div>
          )}

          <div className="border-t border-gray-200"></div>

          {/* Remarks (Optional/Read-only or just hidden since backend ignores it, keeping hidden for now to avoid confusion) */}
          {/* 
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-2">
              Approval Comments / Remarks
            </label>
            <textarea ... />
          </div>
          */}
          <p className="text-sm text-gray-600">
            Approving this request will automatically update the employee's Daily Time Record with the corrected times.
          </p>

          {/* Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={onCancel}
              className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-lg shadow-md hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleApprove}
              className="flex-1 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors"
            >
              Approve Request
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDTRCorrectionApprove;
