/**
 * DisagreeModal Component
 * Modal for employees to submit disagreement with their rating
 */

import { motion, AnimatePresence } from 'framer-motion';
import { ThumbsDown } from 'lucide-react';

const DisagreeModal = ({
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
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-xl w-full max-w-md shadow-2xl"
        >
          {/* Header */}
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-xl font-bold text-red-700 flex items-center gap-2">
              <ThumbsDown size={24} />
              Disagree with Rating
            </h2>
            <p className="text-gray-500 text-sm mt-1">
              Please explain why you disagree with this evaluation.
            </p>
          </div>
          
          {/* Content */}
          <div className="p-6">
            <textarea
              value={disagreeRemarks}
              onChange={(e) => onRemarksChange(e.target.value)}
              placeholder="Provide specific reasons for your disagreement..."
              className="w-full p-3 border border-gray-200 rounded-lg h-32 resize-none focus:ring-2 focus:ring-red-500 outline-none"
            />
            <p className="text-xs text-gray-400 mt-2">
              Your feedback will be reviewed by HR. This action cannot be undone.
            </p>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-gray-50 rounded-b-xl flex justify-end gap-3">
            <button 
              onClick={onClose} 
              className="px-4 py-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onSubmit}
              disabled={saving || !disagreeRemarks.trim()}
              className="px-6 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 disabled:opacity-50 transition-colors"
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
