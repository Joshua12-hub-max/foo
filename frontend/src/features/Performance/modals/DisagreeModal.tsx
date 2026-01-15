import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ThumbsDown, X, AlertCircle } from 'lucide-react';

interface DisagreeModalProps {
  isOpen: boolean;
  onClose: () => void;
  disagreeRemarks: string;
  saving: boolean;
  onRemarksChange: (value: string) => void;
  onSubmit: () => void;
}

const DisagreeModal: React.FC<DisagreeModalProps> = ({
  isOpen,
  onClose,
  disagreeRemarks,
  saving,
  onRemarksChange,
  onSubmit
}) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 transition-all">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-xl w-full max-w-md border border-gray-100 overflow-hidden shadow-2xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 shrink-0">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <div className="bg-red-50 p-2 rounded-lg">
                <ThumbsDown className="w-5 h-5 text-red-600" />
              </div>
              Disagree with Rating
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100"
            >
               <X className="w-5 h-5" />
            </button>
          </div>
          
          {/* Content */}
          <div className="p-6 pt-0">
            <p className="text-gray-500 text-sm mb-4">
              Please explain why you disagree with this evaluation.
            </p>
            <textarea
              value={disagreeRemarks}
              onChange={(e) => onRemarksChange(e.target.value)}
              placeholder="Provide specific reasons for your disagreement..."
              className="w-full p-4 border border-gray-200 rounded-xl h-32 resize-none focus:outline-none focus:border-red-500 focus:ring-4 focus:ring-red-500/10 transition-all text-sm"
            />
            <div className="flex items-start gap-2 mt-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
               <AlertCircle className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
               <p className="text-xs text-gray-500">
                Your feedback will be reviewed by HR. This action cannot be undone.
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex gap-3">
            <button 
              onClick={onClose} 
              className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:text-gray-900 transition-colors shadow-sm"
            >
              Cancel
            </button>
            <button
              onClick={onSubmit}
              disabled={saving || !disagreeRemarks.trim()}
              className="flex-1 px-4 py-2.5 text-sm font-medium bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all shadow-lg shadow-red-900/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Submitting...' : 'Submit Disagreement'}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default DisagreeModal;
