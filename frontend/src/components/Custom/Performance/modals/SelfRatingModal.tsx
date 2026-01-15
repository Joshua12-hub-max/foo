import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import RatingLegend from '../RatingLegend';
import { CSC_RATING_SCALE } from '../constants/performanceConstants';

interface SelfRatingItem {
  id?: string | number;
  criteria_title: string;
  criteria_description?: string;
  self_score?: number | string;
  actual_accomplishments?: string;
  [key: string]: any;
}

interface SelfRatingModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedReview: any; // Using any as the structure is complex and validated elsewhere
  selfRatingItems: SelfRatingItem[];
  selfRemarks: string;
  saving: boolean;
  onUpdateScore: (index: number, value: string) => void;
  onUpdateAccomplishments: (index: number, value: string) => void;
  onSelfRemarksChange: (value: string) => void;
  onSubmit: () => void;
}

const SelfRatingModal: React.FC<SelfRatingModalProps> = ({
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
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 transition-all">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-xl w-full max-w-md max-h-[90vh] overflow-hidden shadow-2xl flex flex-col border border-gray-100"
        >
          {/* Header - White */}
          <div className="flex items-center justify-between px-6 py-4 shrink-0 bg-white border-b border-gray-100">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Self-Rating Form</h2>
              <p className="text-gray-500 text-sm mt-0.5">Rate your own performance honestly and accurately</p>
            </div>
            <button 
              onClick={onClose} 
              className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          {/* Content */}
          <div className="p-6 space-y-6 overflow-y-auto flex-1 bg-white">
            {/* Rating Legend */}
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
              <RatingLegend compact />
            </div>

            {/* Criteria List */}
            <div className="space-y-4">
              {selfRatingItems.map((item, idx) => (
                <div key={item.id || idx} className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all">
                  <div className="flex flex-col md:flex-row md:items-start gap-4 mb-4">
                    <div className="flex-1">
                      <p className="font-bold text-gray-900 text-lg mb-1">{item.criteria_title}</p>
                      <p className="text-sm text-gray-500 leading-relaxed">{item.criteria_description}</p>
                    </div>
                    <div className="min-w-[200px]">
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5 ml-1">
                        Your Rating
                      </label>
                      <select
                        value={item.self_score || 0}
                        onChange={(e) => onUpdateScore(idx, e.target.value)}
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-lg font-semibold text-gray-900 bg-gray-50 focus:ring-4 focus:ring-gray-100 focus:border-gray-300 outline-none transition-all cursor-pointer hover:bg-gray-100"
                      >
                        <option value="0" disabled>Select Rating</option>
                        {CSC_RATING_SCALE.map(rating => (
                          <option key={rating.value} value={rating.value}>
                            {rating.value} - {rating.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5 ml-1">
                      Actual Accomplishments
                    </label>
                    <textarea
                      value={item.actual_accomplishments || ''}
                      onChange={(e) => onUpdateAccomplishments(idx, e.target.value)}
                      placeholder="Describe your specific accomplishments and evidence for this rating..."
                      className="w-full p-4 text-sm border border-gray-200 rounded-xl resize-none h-24 focus:ring-4 focus:ring-gray-100 focus:border-gray-300 outline-none transition-all placeholder:text-gray-400"
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Employee Remarks */}
            <div className="bg-gray-50 p-6 rounded-xl border border-gray-100">
              <label className="block text-sm font-bold text-gray-900 mb-2">
                Additional Remarks (Optional)
              </label>
              <textarea
                value={selfRemarks}
                onChange={(e) => onSelfRemarksChange(e.target.value)}
                placeholder="Any additional comments, context, or feedback about your performance period..."
                className="w-full p-4 border border-gray-200 rounded-xl h-28 focus:ring-4 focus:ring-gray-200 focus:border-gray-300 outline-none transition-all bg-white"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="bg-white border-t border-gray-100 px-6 py-4 flex justify-end gap-3 shrink-0 z-10">
            <button 
              onClick={onClose} 
              className="px-6 py-2.5 border border-gray-200 rounded-lg text-gray-700 font-medium hover:bg-gray-50 hover:text-gray-900 transition-colors shadow-sm"
            >
              Cancel
            </button>
            <button
              onClick={onSubmit}
              disabled={saving}
              className="px-6 py-2.5 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 disabled:opacity-50 transition-all shadow-lg shadow-gray-900/20"
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
