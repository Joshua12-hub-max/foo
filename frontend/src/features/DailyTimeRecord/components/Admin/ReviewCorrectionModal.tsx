import React, { useState } from 'react';
import { X, Check, Clock, AlertCircle, FileText } from 'lucide-react';
import { DTRRecord } from '../../Utils/adminDTRUtils';

interface ReviewCorrectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: DTRRecord | null;
  onApprove: (id: number) => Promise<void>;
  onReject: (id: number, reason: string) => Promise<void>;
}

const formatDisplayTime = (val: string | null | undefined): string => {
  if (!val || val === '--:--' || val === '-' || val === 'N/A') return '--:--';
  try {
    const date = new Date(val);
    if (isNaN(date.getTime())) return val;
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  } catch {
    return val;
  }
};

export const ReviewCorrectionModal: React.FC<ReviewCorrectionModalProps> = ({
  isOpen,
  onClose,
  record,
  onApprove,
  onReject
}) => {
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen || !record) return null;

  const handleApprove = async () => {
    if (!record.correctionId) return;
    setIsProcessing(true);
    try {
      await onApprove(record.correctionId);
      onClose();
    } catch {
      // Error handled by parent
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!record.correctionId) return;
    if (!rejectionReason.trim()) return;
    setIsProcessing(true);
    try {
      await onReject(record.correctionId, rejectionReason);
      setShowRejectInput(false);
      setRejectionReason('');
      onClose();
    } catch {
      // Error handled by parent
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    setShowRejectInput(false);
    setRejectionReason('');
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 transition-all duration-300" 
      onClick={handleClose}
    >
      <div 
        className="bg-white rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] w-full max-w-md border border-white/20 overflow-hidden animate-in fade-in zoom-in duration-300"
        onClick={(e) => e.stopPropagation()}
      >

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 shrink-0 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg">
              <FileText className="w-5 h-5 text-gray-400" />
            </div>
            <h2 className="text-xl font-bold text-gray-800">Review Correction</h2>
          </div>
          <button 
            type="button"
            onClick={handleClose} 
            className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 pb-6 space-y-5">

          {/* Context Info */}
          <div className="text-sm text-gray-800 mt-4">
            Correction Request from <span className="font-semibold text-gray-800">{record.name}</span> on <span className="font-semibold text-gray-800">{record.date}</span>
          </div>

          {/* Time Comparison */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Original Time In</label>
              <div className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-800 text-sm font-mono font-medium">
                {record.timeIn || '--:--'}
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Original Time Out</label>
              <div className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-800 text-sm font-mono font-medium">
                {record.timeOut || '--:--'}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Corrected Time In</label>
              <div className="w-full px-3 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-800 text-sm font-mono font-bold">
                {formatDisplayTime(record.correctionTimeIn)}
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Corrected Time Out</label>
              <div className="w-full px-3 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-800 text-sm font-mono font-bold">
                {formatDisplayTime(record.correctionTimeOut)}
              </div>
            </div>
          </div>

          {/* Reason */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Reason</label>
            <div className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-800 text-sm min-h-[60px] font-medium">
              {record.correctionReason || 'No reason provided.'}
            </div>
          </div>

          {/* Reject Reason Input */}
          {showRejectInput && (
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Rejection Reason</label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="w-full px-3 py-2.5 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 text-gray-800 text-sm resize-none font-medium"
                rows={3}
                placeholder="Explain why this request is being rejected..."
                autoFocus
              />
            </div>
          )}

          {/* Alert */}
          <div className="flex items-start gap-3 p-3 bg-gray-50 text-gray-800 rounded-lg text-sm border border-gray-200">
            <AlertCircle size={18} className="shrink-0 mt-0.5 text-gray-400" />
            <p className="font-medium">Approving will update the employee's time record automatically.</p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 flex gap-3">
          {showRejectInput ? (
            <>
              <button
                type="button"
                onClick={() => setShowRejectInput(false)}
                className="flex-1 px-4 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleReject}
                disabled={isProcessing || !rejectionReason.trim()}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors shadow-lg shadow-gray-200 disabled:opacity-70 flex items-center justify-center gap-2"
              >
                {isProcessing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Rejecting...
                  </>
                ) : (
                  'Confirm Reject'
                )}
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setShowRejectInput(true)}
                className="flex-1 px-4 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
              >
                Reject
              </button>
              <button
                type="button"
                onClick={handleApprove}
                disabled={isProcessing}
                className="flex-1 px-4 py-2.5 bg-slate-900 text-white rounded-lg font-medium hover:bg-slate-800 transition-colors shadow-lg shadow-gray-200 disabled:opacity-70 flex items-center justify-center gap-2"
              >
                {isProcessing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Approving...
                  </>
                ) : (
                  'Approve'
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
