import React from "react";
import { X, FileText, Download } from "lucide-react";

export default function ReceiveFormModal({
  isOpen,
  onClose,
  formTitle = "Leave Request Form",
  fileName = "",
  fileUrl = "",
  senderName,
  sentDate,
  instructions = "",
}) {
  if (!isOpen) return null;

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) onClose?.();
  };

  const formattedDate =
    sentDate &&
    new Date(sentDate).toLocaleDateString(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

  const handleDownload = () => {
    if (fileUrl) {
      const link = document.createElement("a");
      link.href = fileUrl;
      link.download = fileName || "form.pdf";
      link.click();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-950 to-green-700 flex items-center justify-between px-5 py-4">
          <h2 className="text-white text-base font-semibold flex items-center gap-2">
            <FileText size={18} className="text-white" />
            Fillable Form from Admin
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-white hover:text-gray-200 transition-colors"
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Wrapped Content */}
        <div className="p-5 bg-gray-50">
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5">
            {/* Info Banner */}
            <div className="bg-blue-50 text-blue-800 text-sm border border-blue-200 rounded-lg p-3 mb-4">
              <p>
                This form was sent to you by an admin. Review any provided
                instructions and download the file if available.
              </p>
            </div>

            {/* Form Section */}
            <div className="border border-gray-200 bg-gray-50 rounded-xl mb-4 p-4">
              <div className="flex items-center gap-2 mb-3 border-b pb-2">
                <FileText className="text-green-700" size={16} />
                <h4 className="text-sm font-semibold text-gray-800">
                  {formTitle}
                </h4>
              </div>

              {/* File Section */}
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-5 mb-4 flex flex-col items-center justify-center text-center bg-white">
                {fileName ? (
                  <>
                    <FileText className="text-green-700 mb-2" size={28} />
                    <p className="text-sm font-medium text-gray-900">
                      {fileName}
                    </p>
                    <p className="text-xs text-gray-500 mb-2">
                      Fillable PDF Form
                    </p>
                    <button
                      type="button"
                      onClick={handleDownload}
                      className="text-sm flex items-center gap-2 text-green-700 font-medium hover:underline"
                    >
                      <Download size={14} />
                      Download Form
                    </button>
                  </>
                ) : (
                  <>
                    <FileText className="text-gray-400 mb-2" size={28} />
                    <p className="text-sm text-gray-400 italic">
                      No file received
                    </p>
                  </>
                )}
              </div>

              {/* Instructions Section */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-2">
                <p className="text-xs font-semibold text-gray-700 mb-1">
                  Instructions from Admin:
                </p>
                <div className="min-h-[60px] flex items-center justify-center bg-white border border-dashed border-gray-300 rounded-md p-2 text-xs text-gray-500 italic">
                  {instructions
                    ? instructions
                    : "No instructions provided by the sender."}
                </div>
              </div>

              {/* Sender Info */}
              {senderName || sentDate ? (
                <div className="flex items-center justify-between text-xs text-gray-500 mt-2">
                  {senderName && (
                    <span>
                      Sent by:{" "}
                      <span className="font-medium">{senderName}</span>
                    </span>
                  )}
                  {formattedDate && <span>{formattedDate}</span>}
                </div>
              ) : null}
            </div>

            {/* Footer Buttons */}
            <div className="flex mt-4">
              <button
                onClick={onClose}
                className="w-full py-2.5 border border-gray-300 rounded-lg text-gray-700 text-sm font-semibold hover:bg-gray-100 active:scale-95 transition-all shadow-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
