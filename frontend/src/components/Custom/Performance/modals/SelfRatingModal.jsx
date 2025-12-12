/**
 * SelfRatingModal Component
 * Modal for employees to submit their self-rating
 */

import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import RatingLegend from '../RatingLegend';
import { CSC_RATING_SCALE } from '../constants/performanceConstants';

const SelfRatingModal = ({
  isOpen,
  onClose,
  selectedReview,
  selfRatingItems,
  selfRemarks,
  saving,
  onUpdateScore,
  onUpdateAccomplishments,
  onSelfRemarksChange,
  onSubmit
}) => {
  if (!isOpen || !selectedReview) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl"
        >
          {/* Header */}
          <div className="sticky top-0 bg-gray-800 text-white px-6 py-4 flex justify-between items-center z-10">
            <div>
              <h2 className="text-xl font-bold">Self-Rating Form</h2>
              <p className="text-gray-300 text-sm">Rate your own performance honestly and accurately</p>
            </div>
            <button 
              onClick={onClose} 
              className="p-2 hover:bg-gray-700 rounded-full transition-colors"
            >
              <X size={20} />
            </button>
          </div>
          
          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Rating Legend */}
            <RatingLegend compact />

            {/* Criteria List */}
            <div className="space-y-4">
              {selfRatingItems.map((item, idx) => (
                <div key={item.id || idx} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <div className="flex justify-between items-start gap-4 mb-3">
                    <div>
                      <p className="font-bold text-gray-800">{item.criteria_title}</p>
                      <p className="text-sm text-gray-500">{item.criteria_description}</p>
                    </div>
                    <select
                      value={item.self_score || 0}
                      onChange={(e) => onUpdateScore(idx, e.target.value)}
                      className="px-4 py-2 border border-gray-300 rounded-lg font-bold bg-white focus:ring-2 focus:ring-gray-200 outline-none"
                    >
                      <option value="0" disabled>Rate</option>
                      {CSC_RATING_SCALE.map(rating => (
                        <option key={rating.value} value={rating.value}>
                          {rating.value} - {rating.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <textarea
                    value={item.actual_accomplishments || ''}
                    onChange={(e) => onUpdateAccomplishments(idx, e.target.value)}
                    placeholder="Describe your actual accomplishments for this criteria..."
                    className="w-full p-3 text-sm border border-gray-200 rounded-lg resize-none h-20 focus:ring-2 focus:ring-gray-200 outline-none"
                  />
                </div>
              ))}
            </div>

            {/* Employee Remarks */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Additional Remarks (Optional)
              </label>
              <textarea
                value={selfRemarks}
                onChange={(e) => onSelfRemarksChange(e.target.value)}
                placeholder="Any additional comments about your performance..."
                className="w-full p-3 border border-gray-200 rounded-lg h-24 focus:ring-2 focus:ring-gray-200 outline-none"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 bg-white border-t px-6 py-4 flex justify-end gap-3">
            <button 
              onClick={onClose} 
              className="px-4 py-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onSubmit}
              disabled={saving}
              className="px-6 py-2 bg-gray-800 text-white rounded-lg font-medium hover:bg-gray-700 disabled:opacity-50 shadow-md transition-colors"
            >
              {saving ? 'Submitting...' : 'Submit Self-Rating'}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default SelfRatingModal;
