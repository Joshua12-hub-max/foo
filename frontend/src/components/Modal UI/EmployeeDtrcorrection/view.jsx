import { X, Eye, CheckCircle, XCircle, AlertCircle, } from "lucide-react";

const ViewDailyTimeRecordsModal = ({ isOpen, onClose, correctionData }) => {
  if (!isOpen || !correctionData) return null;

  const getStatusColor = (status) => {
    switch (status) {
      case "Approved":
        return "text-green-600 bg-green-50";
      case "Rejected":
        return "text-red-600 bg-red-50";
      case "Pending":
        return "text-yellow-600 bg-yellow-50";
      default:
        return "text-gray-600 bg-gray-50";
    }
  };

  const getStatusIcon = (status) => {
    const iconMap = {
      "Approved": <CheckCircle className="w-5 h-5" />,
      "Rejected": <XCircle className="w-5 h-5" />,
      "Pending": <AlertCircle className="w-5 h-5" />,
    };

    return iconMap[status] || null;
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 p-4" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full overflow-hidden flex flex-col" style={{ height: 'auto', maxHeight: '90vh' }}>
        
        {/* HEADER */}
        <div className="bg-[#274b46] flex items-center justify-between p-4 border-b relative">
            <div className="flex items-center gap-2 z-10">
                <div className="w-8 h-8 flex items-center justify-center">
                  <Eye className="w-4 h-4"  />
                </div>
                  <div>
                    <h2 className="text-sm font-semibold text-white">DTR Correction Request</h2>
                    <p className="text-xs text-white mt-1">View your request</p>
                  </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="text-white hover:text-gray-200 transition-colors absolute top-5 right-5 z-20"
                  aria-label="Close modal"
                >
              <X size={20} />
              </button>
            </div>
        </div>

        {/* CONTENT */}
        <div className="p-4">
          <div className="bg-white border-2 border-gray-200 rounded-xl p-4 shadow-md">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Status
                </label>
                <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full ${getStatusColor(correctionData.status)}`}>
                  {getStatusIcon(correctionData.status)}
                  <span className="font-semibold">{correctionData.status}</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Corrected Time In
                </label>
                <p className="w-full px-6 py-4 text-sm border-2 rounded-lg bg-gray-50 border-gray-300">
                  {correctionData.correctedTimeIn}
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Corrected Time Out
                </label>
                <p className="w-full px-6 py-4 text-sm border-2 rounded-lg bg-gray-50 border-gray-300">
                  {correctionData.correctedTimeOut}
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Reason
                </label>
                <div className="w-full px-4 py-2 text-sm border-2 rounded-lg bg-gray-50 border-gray-300 min-h-[100px]">
                  {correctionData.reason}
                </div>
              </div>
            </div>

            {/* FOOTER BUTTONS */}
            <div className="flex gap-2 mt-4">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2 text-sm border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 active:scale-95 transition-all shadow-md"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewDailyTimeRecordsModal;
