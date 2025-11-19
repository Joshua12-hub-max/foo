import { Eye, X, Loader2, Check } from "lucide-react";
import { useState } from "react";

export function ViewModal({ isOpen, onClose, record, handleApprove, handleReject }) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null); // "approve" | "reject"

  if (!isOpen || !record) return null;

  const startConfirmation = (action) => {
    setConfirmAction(action);
  };

  const executeAction = async () => {
    if (!confirmAction) return;

    setIsProcessing(true);

    const actionFn = confirmAction === "approve" ? handleApprove : handleReject;
    const success = await actionFn(record.id);

    setIsProcessing(false);
    setConfirmAction(null);

    if (success !== false) {
      onClose(); // only close modal if success
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-[#F8F9FA] rounded-xl shadow-2xl w-full max-w-md overflow-hidden relative">

        {/* HEADER */}
        <div className="relative bg-[#274b46] px-5 py-5 text-[#F8F9FA]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 flex items-center justify-center ">
               <Eye className="w-4 h-4" />
            </div>
           
              <div>
                <h3 className="font-bold text-sm">EmployeeCorrection</h3>
                <p className="text-xs text-white">View Employee Request</p>
              </div>
          </div>
            <button
              type="button"
              onClick={onClose}
              className="text-[#F8F9FA] hover:text-[#38080B] transition-colors absolute top-5 right-5 z-20"
              aria-label="Close modal"
            >
              <X size={20} />
            </button>
        </div>

        {/* CONTENT */}
        <div className="p-4">
          <div className="bg-[#F8F9FA] p-4 rounded-lg shadow-md border border-gray-300 space-y-3">

            {/* Employee Name */}
            <div>
              <label className="text-sm font-semibold text-gray-800">Employee Name</label>
              <div className="bg-[#F8F9FA] h-9 mt-1 border border-gray-300 rounded-md shadow-md px-3 flex items-center text-sm">
                {record.employeeName || "N/A"}
              </div>
            </div>
            {/* Date */}
            <div>
              <label className="text-sm font-semibold text-gray-800">Date</label>
              <div className="bg-[#F8F9FA] h-9 mt-1 border border-gray-300 rounded-md shadow-md px-3 flex items-center text-sm">
                {record.date}
              </div>
            </div>
            {/* Time In / Time Out */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-semibold text-gray-800">Time In</label>
                <div className="bg-green-100 h-9 mt-1 rounded-md shadow-md px-3 flex items-center text-sm border border-green-300 text-green-800">
                  {record.timeIn}
                </div>
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-800">Time Out</label>
                <div className="bg-red-100 h-9 mt-1 rounded-md shadow-md px-3 flex items-center text-sm border border-red-300 text-red-800">
                  {record.timeOut}
                </div>
              </div>
            </div>

            {/* Corrected Time */}
            <div>
              <label className="text-sm font-semibold text-gray-800">Corrected Time</label>
              <div className="bg-[#F8F9FA] h-9 mt-1 rounded-md border border-gray-300 shadow-md px-3 flex items-center text-sm">
                {record.correctedTime || "None"}
              </div>
            </div>
            {/* Reasons */}
            <div>
              <label className="text-sm font-semibold text-gray-800">Reasons</label>
              <div className="bg-[#F8F9FA] h-20 mt-1 rounded-md shadow-md border border-gray-300 p-2 text-sm overflow-auto">
                {record.reason}
              </div>
            </div>

            {/* Status */}
            <div>
              <label className="text-sm font-semibold text-gray-800">Status</label>
              <div
                className={`inline-block mt-1 px-2 py-1 rounded-full shadow-md text-xs[10px] font-bold ${
                  record.status === "Approved"
                    ? "bg-green-100 text-green-800"
                    : record.status === "Pending"
                    ? "bg-yellow-100 text-yellow-800"
                    : "bg-red-100 text-red-800"
                }`}
              >
                ● {record.status}
              </div>
            </div>

          </div>
        </div>

        {/* FOOTER BUTTONS */}
        <div className="p-4 pt-0 grid grid-cols-2 gap-3">
          {/* Reject */}
          <button
            onClick={() => startConfirmation("reject")}
            disabled={isProcessing}
            className={`text-sm font-semibold py-2.5 rounded-lg shadow-md border border-gray-300
              ${isProcessing ? "bg-[#F2F2F2] text-gray-800 cursor-not-allowed" : "bg-[#F2F2F2] hover:bg-[#F8F9FA]  text-gray-800"}`}
          >
            {isProcessing && confirmAction === "reject" ? (
              <span className="flex items-center justify-center gap-1">
                <Loader2 className="w-3 h-3 animate-spin" /> Processing...
              </span>
            ) : (
              "Reject"
            )}
          </button>

          {/* Approve */}
          <button
            onClick={() => startConfirmation("approve")}
            disabled={isProcessing}
            className={`text-sm font-semibold py-2.5 rounded-lg border-2 border-green-600 text-green-700 hover:bg-green-50 active:scale-95 transition-all]
              ${isProcessing ? "bg-[#F2F2F2] text-gray-800 cursor-not-allowed" : "bg-[#F2F2F2] hover:bg-[#F8F9FA]  text-gray-800"}`}
          >
            {isProcessing && confirmAction === "approve" ? (
              <span className="flex items-center justify-center gap-1">
                <Loader2 className="w-3 h-3 animate-spin" /> Processing...
              </span>
          
            ) : (
              "Approve"
            )}
          </button>
        </div>

        {/* CONFIRMATION POPUP */}
        {confirmAction && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <div className="bg-[#F8F9FA] p-5 rounded-lg shadow-xl text-center w-64 space-y-4">
              <h3 className="text-sm font-bold text-gray-800">Are you sure?</h3>
              <p className="text-xs text-gray-600">
                This action cannot be undone.
              </p>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  onClick={() => setConfirmAction(null)}
                  className="text-sm py-2 bg-[#F2F2F2] hover:bg-[#F8F9FA] rounded-lg shadow-md border border-gray-300"
                >
                  Cancel
                </button>

                <button
                  onClick={executeAction}
                  className="text-xs py-2 bg-[#274b46] hover:bg-[#34645c] text-white rounded-lg"
                >
                  Yes, Continue
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
