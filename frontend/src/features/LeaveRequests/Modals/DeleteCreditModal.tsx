import React from 'react';
import { X, Trash2, AlertTriangle, Loader2 } from 'lucide-react';

interface DeleteCreditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  isDeleting: boolean;
  credit: {
    firstName: string;
    lastName: string;
    employeeId: string;
    creditType: string;
    balance: number;
  } | null;
}

const DeleteCreditModal: React.FC<DeleteCreditModalProps> = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  isDeleting, 
  credit 
}) => {
  if (!isOpen || !credit) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 transition-all duration-300" onClick={onClose}>
      <div 
        className="bg-white rounded-xl shadow-xl w-full max-w-md border border-gray-100 overflow-hidden animate-in fade-in zoom-in duration-300 flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-white z-10">
          <h2 className="text-xl font-bold text-gray-800">Delete Leave Credit</h2>
          <button 
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Warning Icon & Context */}
          <div className="flex flex-col items-center text-center space-y-3 pb-2">
            <div className="h-16 w-16 bg-red-50 rounded-full flex items-center justify-center text-red-600 ring-8 ring-red-50/50 mb-2">
              <Trash2 className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-gray-900">Confirm Permanent Deletion</h3>
              <p className="text-sm text-gray-500 max-w-[280px] mx-auto">
                You are about to remove this leave credit record. This action cannot be undone.
              </p>
            </div>
          </div>

          {/* Static Info Card (The Balance) */}
          <div className="bg-red-50/30 p-4 rounded-xl border border-red-100/50 space-y-4">
            {/* Employee Info */}
            <div className="border-b border-red-100/30 pb-3">
              <p className="text-[10px] text-red-700 font-bold uppercase tracking-wider mb-1">Selected Employee</p>
              <p className="text-sm text-gray-800 font-bold">
                {credit.firstName} {credit.lastName}
              </p>
              <p className="text-xs text-gray-500 font-medium">{credit.employeeId}</p>
            </div>

            {/* Credit Details */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-0.5">Type</p>
                <p className="text-sm font-semibold text-gray-700">{credit.creditType}</p>
              </div>
              <div>
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-0.5">Current Balance</p>
                <p className="text-sm font-semibold text-gray-700">{credit.balance} Days</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-amber-50 rounded-lg border border-amber-100">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
            <p className="text-[11px] text-amber-800 font-medium leading-tight">
              Deleting this record will remove all associated balance history for this specific leave type.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="px-4 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-all shadow-sm disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isDeleting}
            className="px-6 py-2 text-sm font-bold text-white bg-red-600 rounded-lg hover:bg-red-700 transition-all shadow-md shadow-red-200 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isDeleting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white/50" />
                Deleting...
              </>
            ) : 'Delete Record'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteCreditModal;
