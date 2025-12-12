import { UserRoundCheck , X } from "lucide-react";

export const ApproveModal = ({ isOpen, request, onApprove, onClose }) => {
  if (!isOpen || !request) return null;

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md border-2 border-gray-200">
        {/* header */}
        <div className="bg-gray-200 shadow-md px-6 py-3 flex items-center justify-between rounded-t-xl">
          <div className="flex items-center gap-2">
            <UserRoundCheck className="w-6 h-6 text-green-600" />
            <h3 className="text-xl font-bold text-gray-800">Approve Request</h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            aria-label="Close modal"
          >
            <X size={20} className="text-red-800" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="bg-gray-50 border border-gray-200 p-4 rounded-xl shadow-md">
            <p className="text-sm text-gray-600 mb-2">
              <span className="font-semibold">Employee:</span> {request.employeeName}
            </p>
            <p className="text-sm text-gray-600 mb-2">
              <span className="font-semibold">Date:</span> {request.date}
            </p>
            <p className="text-sm text-gray-600 mb-2">
              <span className="font-semibold">Time Out:</span> {request.timeOut}
            </p>
            <p className="text-sm text-gray-600">
              <span className="font-semibold">Reason:</span> {request.reason}
            </p>
          </div>

          <p className="text-sm text-gray-700">
            Are you sure you want to approve this undertime request?
          </p>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-1.5 bg-gray-200 text-gray-700 rounded-lg shadow-md hover:text-red-800 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onApprove}
              className="flex-1 px-4 py-1.5 bg-gray-200 text-gray-700 rounded-lg shadow-md hover:text-green-800 transition-colors"
            >
              Approve
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
