import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertTriangle } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
}

const ConfirmDialog = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message, 
  confirmText = "Confirm", 
  cancelText = "Cancel", 
  isDestructive = false 
}: ConfirmDialogProps) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/60 backdrop-blur-[2px]">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden border border-gray-100 animate-in fade-in zoom-in duration-200"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-50">
            <h2 className="text-xl font-bold text-gray-900">{title}</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100"
            >
              <X size={20} />
            </button>
          </div>
          
          {/* Content */}
          <div className="p-6">
            <div className={`${isDestructive ? 'bg-red-50 border-red-100' : 'bg-amber-50 border-amber-100'} border rounded-lg p-4 mb-4`}>
              <div className="flex gap-3">
                <div className={`${isDestructive ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'} p-2 rounded-full h-fit`}>
                  <AlertTriangle size={20} />
                </div>
                <div>
                  <h4 className={`text-sm font-bold ${isDestructive ? 'text-red-800' : 'text-amber-800'} mb-1`}>
                    {isDestructive ? 'Warning' : 'Attention Required'}
                  </h4>
                  <p className={`text-sm ${isDestructive ? 'text-red-700' : 'text-amber-700'}`}>
                    {message}
                  </p>
                </div>
              </div>
            </div>
            <p className="text-sm text-gray-500 pl-1">This action cannot be undone.</p>
          </div>
          
          {/* Footer */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-50 hover:text-gray-900 transition-all shadow-sm"
            >
              {cancelText}
            </button>
            <button
              onClick={() => {
                onConfirm();
                onClose();
              }}
              className={`flex-1 px-4 py-2 ${
                isDestructive 
                  ? 'bg-red-600 hover:bg-red-700 text-white' 
                  : 'bg-slate-900 hover:bg-slate-800 text-white'
              } rounded-lg text-sm font-semibold transition-all shadow-md flex items-center justify-center gap-2`}
            >
              {confirmText}
            </button>
          </div>
        </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ConfirmDialog;
