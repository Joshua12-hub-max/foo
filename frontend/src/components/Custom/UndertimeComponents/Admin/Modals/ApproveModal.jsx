import { CheckCircle, X } from "lucide-react";

export const ApproveModal = ({ isOpen, request, onApprove, onClose }) => {
  if (!isOpen || !request) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-6 h-6 text-green-600" />
            <h3 className="text-xl font-bold text-gray-800">Approve Request</h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            aria-label="Close modal"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="mb-6 bg-gray-50 p-4 rounded-lg">
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

        <p className="text-sm text-gray-700 mb-6">
          Are you sure you want to approve this undertime request?
        </p>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onApprove}
            className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            Approve
          </button>
        </div>
      </div>
    </div>
  );
};
