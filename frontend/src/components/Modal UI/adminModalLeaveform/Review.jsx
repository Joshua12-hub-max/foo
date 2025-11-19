import { useState } from "react";
import { X, FileText, CheckCircle, XCircle, Clock, Download, User, Calendar, FileType, MessageSquare, AlertCircle } from "lucide-react";

export default function ReviewModal({ isOpen, leaveForms, handleApprove, handleReject, onClose }) {

  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [setConfirmationAction] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [processingId, setProcessingId] = useState(null);

  const pendingRequests = leaveForms?.filter(
    (form) => form.reviewRequest === "Pending"
  ) || [];

  // Handle approve with confirmation
  const handleApproveClick = (form) => {
    setSelectedRequest(form);
    setConfirmationAction("approve");
    setShowConfirmation(true);
  };

  // Handle reject - show rejection reason modal
  const handleRejectClick = (form) => {
    setSelectedRequest(form);
    setShowRejectionModal(true);
  };

  // Confirm approval
  const confirmApprove = () => {
    if (selectedRequest) {
      setProcessingId(selectedRequest.id);
      
      setTimeout(() => {
        handleApprove(selectedRequest.id);
        
        setProcessingId(null);
        setShowConfirmation(false);
        setSelectedRequest(null);
      }, 500);
    }
  };

  // Confirm rejection with reason
  const confirmReject = () => {
    if (!rejectionReason.trim()) {
      alert("Please provide a reason for rejection");
      return;
    }

    if (selectedRequest) {
      setProcessingId(selectedRequest.id);
      
      setTimeout(() => {
        handleReject(selectedRequest.id, rejectionReason);
        
        setProcessingId(null);
        setShowRejectionModal(false);
        setRejectionReason("");
        setSelectedRequest(null);
      }, 500);
    }
  };

  // Cancel confirmation
  const cancelConfirmation = () => {
    setShowConfirmation(false);
    setShowRejectionModal(false);
    setRejectionReason("");
    setSelectedRequest(null);
  };

  // Format date to readable format
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4 z-50">
        <div 
          className="bg-white rounded-lg shadow-xl max-w-md w-full overflow-hidden flex flex-col" 
          style={{ height: 'auto', maxHeight: '90vh' }}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-slate-950 to-green-700 flex items-center justify-between p-4 border-b">
            <div className="flex items-center gap-2">
              <FileText className="text-white" size={24} />
              <h2 className="text-xl font-bold text-white">Review Leave Requests</h2>
            </div>
            <button 
              onClick={onClose} 
              className="text-white hover:text-gray-200 transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Content */}
          <div className="p-4 overflow-y-auto flex-1">
            {pendingRequests.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-500 opacity-50" />
                <p className="text-lg font-medium">No pending requests</p>
                <p className="text-sm mt-1">All leave requests have been reviewed</p>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingRequests.map((form) => (
                  <div 
                    key={form.id} 
                    className="bg-white border-2 border-gray-200 rounded-xl p-4 shadow-md hover:shadow-lg transition-shadow relative"
                  >
                    {/* Processing Overlay */}
                    {processingId === form.id && (
                      <div className="absolute inset-0 bg-white/80 backdrop-blur-sm rounded-xl flex items-center justify-center z-10">
                        <div className="text-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-2"></div>
                          <p className="text-sm text-gray-600 font-medium">Processing...</p>
                        </div>
                      </div>
                    )}

                    {/* Request Header Info */}
                    <div className="flex items-center justify-between mb-3 pb-3 border-b border-gray-200">
                      <div className="flex items-center gap-2">
                        <Clock className="text-yellow-500" size={16} />
                        <span className="text-xs font-semibold text-yellow-600 bg-yellow-50 px-2 py-1 rounded">
                          PENDING REVIEW
                        </span>
                      </div>
                      <span className="text-xs text-gray-500">
                        Submitted: {formatDate(form.submittedDate)}
                      </span>
                    </div>

                    <div className="space-y-3">
                      {/* Employee Name - Full Width */}
                      <div>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                          <input
                            type="text"
                            value={form.name}
                            readOnly
                            className="w-full pl-10 pr-3 py-2 text-sm border-2 border-gray-300 rounded-lg bg-gray-50 cursor-default focus:outline-none font-medium"
                          />
                        </div>
                        <label className="block mt-1 text-xs font-semibold text-gray-700">
                          Employee Name
                        </label>
                      </div>

                      {/* Leave Type and Date Range - Two Columns */}
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <div className="relative">
                            <FileType className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                            <input
                              type="text"
                              value={form.leaveType}
                              readOnly
                              className="w-full pl-10 pr-3 py-2 text-sm border-2 border-gray-300 rounded-lg bg-gray-50 cursor-default focus:outline-none"
                            />
                          </div>
                          <label className="block mt-1 text-xs font-semibold text-gray-700">
                            Leave Type
                          </label>
                        </div>
                        <div>
                          <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                            <input
                              type="text"
                              value={`${form.days} day${form.days > 1 ? 's' : ''}`}
                              readOnly
                              className="w-full pl-10 pr-3 py-2 text-sm border-2 border-gray-300 rounded-lg bg-gray-50 cursor-default focus:outline-none font-semibold text-green-700"
                            />
                          </div>
                          <label className="block mt-1 text-xs font-semibold text-gray-700">
                            Duration
                          </label>
                        </div>
                      </div>

                      {/* Date Range - Full Width */}
                      <div>
                        <div className="relative">
                          <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                          <input
                            type="text"
                            value={`${formatDate(form.fromDate)} → ${formatDate(form.toDate)}`}
                            readOnly
                            className="w-full pl-10 pr-3 py-2 text-sm border-2 border-gray-300 rounded-lg bg-gray-50 cursor-default focus:outline-none"
                          />
                        </div>
                        <label className="block mt-1 text-xs font-semibold text-gray-700">
                          Date Range
                        </label>
                      </div>

                      {/* Review Request Form - Downloadable */}
                      <div>
                        {form.formFile ? (
                          <a
                            href={form.formFile}
                            download={form.fileName || "Leave_Request_Form.pdf"}
                            className="w-full px-3 py-2 text-sm border-2 border-blue-400 rounded-lg bg-blue-50 hover:bg-blue-100 cursor-pointer flex items-center justify-between transition-all group"
                          >
                            <div className="flex items-center gap-2">
                              <FileText size={18} className="text-blue-600" />
                              <span className="text-blue-700 font-medium">{form.fileName || "Leave Request Form.pdf"}</span>
                            </div>
                            <Download size={16} className="text-blue-600 group-hover:animate-bounce" />
                          </a>
                        ) : (
                          <div className="w-full px-3 py-2 text-sm border-2 border-gray-300 rounded-lg bg-gray-50 text-gray-500 text-center flex items-center justify-center gap-2">
                            <AlertCircle size={16} />
                            <span>No form attached</span>
                          </div>
                        )}
                        <label className="block mt-1 text-xs font-semibold text-gray-700">
                          Supporting Document
                        </label>
                      </div>

                      {/* Descriptions - Text Area */}
                      <div>
                        <div className="relative">
                          <MessageSquare className="absolute left-3 top-3 text-gray-400" size={16} />
                          <textarea
                            value={form.reason || ''}
                            readOnly
                            rows="4"
                            placeholder="No reason provided"
                            className="w-full pl-10 pr-3 py-2 text-sm border-2 border-gray-300 rounded-lg bg-gray-50 resize-none cursor-default focus:outline-none"
                          />
                        </div>
                        <label className="block mt-1 text-xs font-semibold text-gray-700">
                          Reason for Leave
                        </label>
                      </div>

                      {/* Action Buttons */}
                      <div className="grid grid-cols-2 gap-3 pt-2">
                        <button
                          onClick={() => handleRejectClick(form)}
                          disabled={processingId === form.id}
                          className="px-4 py-2 text-sm border-2 border-red-500 text-red-600 rounded-lg font-semibold hover:bg-red-50 active:scale-95 transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <XCircle size={16} />
                          Reject
                        </button>
                        <button
                          onClick={() => handleApproveClick(form)}
                          disabled={processingId === form.id}
                          className="px-4 py-2 text-sm border-2 border-green-600 text-green-700 rounded-lg font-semibold hover:bg-green-50 active:scale-95 transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <CheckCircle size={16} />
                          Approve
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Approval Confirmation Modal */}
      {showConfirmation && selectedRequest && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-[60]">
          <div className="bg-white rounded-lg shadow-2xl max-w-sm w-full p-6 animate-in fade-in zoom-in duration-200">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                Approve Leave Request?
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                You are about to approve <span className="font-semibold">{selectedRequest.name}'s</span> leave request for <span className="font-semibold">{selectedRequest.days} day(s)</span>.
              </p>
              <div className="bg-gray-50 rounded-lg p-3 mb-4 text-left">
                <p className="text-xs text-gray-600">
                  <span className="font-semibold">Type:</span> {selectedRequest.leaveType}
                </p>
                <p className="text-xs text-gray-600">
                  <span className="font-semibold">Dates:</span> {formatDate(selectedRequest.fromDate)} - {formatDate(selectedRequest.toDate)}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={cancelConfirmation}
                className="px-4 py-2 text-sm border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={confirmApprove}
                className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-all"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rejection Reason Modal */}
      {showRejectionModal && selectedRequest && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-[60]">
          <div className="bg-white rounded-lg shadow-2xl max-w-sm w-full p-6 animate-in fade-in zoom-in duration-200">
            <div className="text-center mb-4">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                <XCircle className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                Reject Leave Request
              </h3>
              <p className="text-sm text-gray-600">
                Please provide a reason for rejecting <span className="font-semibold">{selectedRequest.name}'s</span> request.
              </p>
            </div>
            <div className="mb-4">
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows="4"
                placeholder="Enter rejection reason..."
                className="w-full px-3 py-2 text-sm border-2 border-gray-300 rounded-lg bg-white resize-none focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={cancelConfirmation}
                className="px-4 py-2 text-sm border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={confirmReject}
                className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-all"
              >
                Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}