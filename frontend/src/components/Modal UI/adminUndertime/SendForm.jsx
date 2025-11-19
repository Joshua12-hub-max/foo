import { useState } from "react";
import { X, Send, FileText, AlertCircle, CheckCircle2, Download, MessageSquare } from "lucide-react";

const SendFormModal = ({ isOpen, form, remarks, onRemarksChange, onSend, onCancel }) => {
  const [isSending, setIsSending] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  // Handle send click - show confirmation
  const handleSendClick = () => {
    setShowConfirmation(true);
  };

  // Confirm send
  const confirmSend = () => {
    setIsSending(true);

    // Simulate sending delay
    setTimeout(() => {
      if (onSend) {
        onSend();
      }

      setIsSending(false);
      setShowConfirmation(false);

      // Reset and close
      if (onCancel) onCancel();
    }, 1000);
  };

  // Handle X button click - always asks for confirmation if there's data
  const handleXButtonClick = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    const hasData = remarks?.trim();

    if (hasData) {
      if (window.confirm("You have unsaved changes. Are you sure you want to close?")) {
        if (onCancel) onCancel();
      }
    } else {
      if (onCancel) onCancel();
    }
  };

  // Handle Cancel button click - always asks for confirmation if there's data
  const handleCancel = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    const hasData = remarks?.trim();

    if (hasData) {
      if (window.confirm("You have unsaved changes. Are you sure you want to cancel?")) {
        if (onCancel) onCancel();
      }
    } else {
      if (onCancel) onCancel();
    }
  };

  // Backdrop click handler (closes only if clicking the overlay itself)
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      handleXButtonClick(e);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Main Modal */}
      <div 
        className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        onClick={handleBackdropClick}
      >
        <div 
          className="bg-white rounded-lg shadow-xl max-w-md w-full overflow-hidden flex flex-col" 
          style={{ height: 'auto', maxHeight: '90vh' }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-slate-950 to-green-700 flex items-center justify-between p-4 border-b relative">
            <div className="flex items-center gap-2 z-10">
              <Send className="text-white" size={24} />
              <h2 className="text-xl font-bold text-white">Send Undertime Form</h2>
            </div>
            <button
              type="button"
              onClick={handleXButtonClick}
              className="text-white hover:text-gray-200 transition-colors absolute top-4 right-4 z-20"
              aria-label="Close modal"
            >
              <X size={20} />
            </button>
          </div>

          {/* Content */}
          <div className="p-4 overflow-y-auto flex-1">
            <div className="bg-white border-2 border-gray-200 rounded-xl p-4 shadow-md hover:shadow-lg transition-shadow">
              {/* Form File Preview */}
              {form?.formFile ? (
                <div className="mb-5 border-2 border-green-200 rounded-xl p-4 bg-gradient-to-br from-green-50 to-white shadow-sm">
                  <div className="flex items-center gap-2 mb-3 pb-3 border-b border-green-200">
                    <FileText className="text-green-600" size={18} />
                    <h4 className="text-sm font-bold text-green-900 uppercase tracking-wide">
                      Undertime Request Form
                    </h4>
                  </div>

                  <div className="bg-white rounded-lg p-4 border-2 border-green-300">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="bg-green-100 p-3 rounded-lg">
                          <FileText className="text-green-600" size={24} />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900">
                            Undertime_Request_Form.pdf
                          </p>
                          <p className="text-xs text-gray-500">
                            Fillable PDF Form
                          </p>
                        </div>
                      </div>
                      <a
                        href={form.formFile}
                        download="Undertime_Request_Form.pdf"
                        className="text-green-600 hover:text-green-700 transition-colors"
                        title="Download preview"
                      >
                        <Download size={20} />
                      </a>
                    </div>
                  </div>

                  <p className="text-xs text-green-700 mt-3 bg-green-100 p-2 rounded flex items-start gap-2">
                    <AlertCircle size={14} className="mt-0.5 flex-shrink-0" />
                    <span>
                      This form will be sent to the employee to fill out and
                      submit back
                    </span>
                  </p>
                </div>
              ) : (
                <div className="mb-5 border-2 border-gray-200 rounded-xl p-4 bg-gray-50">
                  <div className="flex items-center justify-center gap-2 text-gray-500 py-4">
                    <AlertCircle size={20} />
                    <p className="text-sm">No form file attached</p>
                  </div>
                </div>
              )}

              {/* Employee Information */}
              {form && (
                <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <p className="text-xs text-gray-600 mb-1">
                    Requesting Employee
                  </p>
                  <p className="text-sm font-semibold text-gray-900">
                    {form.employeeName}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {form.date} • {form.timeOut}
                  </p>
                </div>
              )}

              {/* Instructions */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Remarks{" "}
                  <span className="text-gray-400 font-normal">(Optional)</span>
                </label>
                <div className="relative">
                  <MessageSquare className="absolute left-3 top-3 text-gray-400" size={16} />
                  <textarea
                    value={remarks || ""}
                    onChange={onRemarksChange}
                    maxLength={500}
                    className="w-full pl-10 pr-3 py-2 text-sm border-2 border-gray-300 rounded-lg bg-white resize-none focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100"
                    rows="3"
                    placeholder="Enter detailed instructions..."
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {(remarks || "").length}/500 characters
                </p>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={isSending}
                  className="px-4 py-2.5 text-sm border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 active:scale-95 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSendClick}
                  disabled={isSending || !form}
                  className="px-4 py-2.5 text-sm border-2 border-green-600 text-green-700 rounded-lg font-semibold hover:bg-green-50 active:scale-95 transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send size={16} />
                  Send Form
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmation && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-[60]"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              handleXButtonClick(e);
            }
          }}
        >
          <div 
            className="bg-white rounded-lg shadow-2xl max-w-sm w-full p-6 animate-in fade-in zoom-in duration-200 relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button for confirmation */}
            <button
              type="button"
              onClick={handleXButtonClick}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors z-10"
              aria-label="Close confirmation"
            >
              <X size={20} />
            </button>

            {isSending ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  Sending Form...
                </h3>
                <p className="text-sm text-gray-600">
                  Please wait while we send the form
                </p>
              </div>
            ) : (
              <>
                <div className="text-center pt-4">
                  <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                    <Send className="h-6 w-6 text-green-600" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">
                    Confirm Send
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Are you sure you want to send this undertime form?
                  </p>
                  {remarks && (
                    <p className="text-xs text-gray-600 mt-2 pt-2 border-t border-green-200 text-left">
                      <span className="font-semibold">Note:</span>{" "}
                      {remarks.substring(0, 60)}
                      {remarks.length > 60 ? "..." : ""}
                    </p>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowConfirmation(false)}
                    className="px-4 py-2 text-sm border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-all"
                  >
                    Go Back
                  </button>
                  <button
                    type="button"
                    onClick={confirmSend}
                    className="px-4 py-2 text-sm border-2 border-green-600 text-green-700 rounded-lg font-semibold hover:bg-green-50 transition-all flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 size={16} />
                    Confirm
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default SendFormModal;