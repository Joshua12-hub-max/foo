/**
 * ReviewDetailsModal Component
 * Modal for viewing review details, acknowledging, and disagreeing
 */

import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, AlertCircle, Clock, ThumbsDown, AlertTriangle } from 'lucide-react';
import { getAdjectivalRating, getScoreColor } from '../constants/performanceConstants';

const ReviewDetailsModal = ({
  isOpen,
  onClose,
  selectedReview,
  onAcknowledge,
  onOpenDisagree
}) => {
  if (!isOpen || !selectedReview) return null;

  const selfRatingInfo = selectedReview.self_rating_score 
    ? getAdjectivalRating(selectedReview.self_rating_score) 
    : null;
  const supervisorRatingInfo = selectedReview.total_score 
    ? getAdjectivalRating(selectedReview.total_score) 
    : null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col"
        >
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex justify-between items-center z-10">
            <h2 className="text-xl font-bold text-gray-800">Evaluation Details</h2>
            <button 
              onClick={onClose} 
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X size={20} className="text-gray-500" />
            </button>
          </div>
          
          {/* Content */}
          <div className="p-6 space-y-6 overflow-y-auto flex-1">
            {/* Score Comparison */}
            <div className="grid grid-cols-2 gap-4">
              {selectedReview.self_rating_score && (
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 text-center">
                  <p className="text-xs font-bold text-gray-500 uppercase mb-1">Your Self-Rating</p>
                  <p className="text-3xl font-bold text-gray-800">{selectedReview.self_rating_score}</p>
                  <p className={`text-sm ${selfRatingInfo?.color || 'text-gray-600'}`}>
                    {selfRatingInfo?.rating}
                  </p>
                </div>
              )}
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 text-center">
                <p className="text-xs font-bold text-gray-500 uppercase mb-1">Supervisor Rating</p>
                <p className="text-3xl font-bold text-gray-800">{selectedReview.total_score || '-'}</p>
                {selectedReview.total_score && (
                  <p className={`text-sm ${supervisorRatingInfo?.color || 'text-gray-600'}`}>
                    {supervisorRatingInfo?.rating}
                  </p>
                )}
              </div>
            </div>

            {/* Disagreement Warning */}
            {selectedReview.disagreed && (
              <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg flex items-start gap-3">
                <AlertTriangle className="text-yellow-600 flex-shrink-0" size={20} />
                <div>
                  <p className="font-bold text-yellow-800">You have disagreed with this rating</p>
                  <p className="text-sm text-yellow-700">{selectedReview.disagree_remarks}</p>
                </div>
              </div>
            )}

            {/* Criteria Ratings */}
            <div>
              <h3 className="font-bold text-gray-800 mb-4 border-b pb-2">Criteria Ratings</h3>
              <div className="space-y-3">
                {selectedReview.items && selectedReview.items.map((item, idx) => (
                  <div key={idx} className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex-1">
                        <p className="font-bold text-gray-800 text-sm">{item.criteria_title}</p>
                        <p className="text-xs text-gray-500 mt-1">{item.criteria_description}</p>
                      </div>
                      <div className="flex gap-2">
                        {item.self_score && (
                          <div 
                            className="w-9 h-9 rounded-lg flex items-center justify-center font-bold text-sm border bg-gray-200 text-gray-700 border-gray-300" 
                            title="Your Self-Rating"
                          >
                            {item.self_score}
                          </div>
                        )}
                        <div 
                          className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-sm shadow-sm border ${getScoreColor(item.score)}`} 
                          title="Supervisor Rating"
                        >
                          {item.score}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Qualitative Feedback */}
            <div className="space-y-4">
              <h3 className="font-bold text-gray-800 border-b pb-2">Supervisor Feedback</h3>
              
              {selectedReview.strengths && (
                <div>
                  <h4 className="text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                    <CheckCircle size={16} className="text-green-600"/> Strengths
                  </h4>
                  <p className="text-gray-600 text-sm bg-gray-50 p-4 rounded-lg border">
                    {selectedReview.strengths}
                  </p>
                </div>
              )}
              
              {selectedReview.improvements && (
                <div>
                  <h4 className="text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                    <AlertCircle size={16} className="text-orange-500"/> Areas for Improvement
                  </h4>
                  <p className="text-gray-600 text-sm bg-gray-50 p-4 rounded-lg border">
                    {selectedReview.improvements}
                  </p>
                </div>
              )}

              {selectedReview.goals && (
                <div>
                  <h4 className="text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                    <Clock size={16} className="text-blue-500"/> Future Goals
                  </h4>
                  <p className="text-gray-600 text-sm bg-gray-50 p-4 rounded-lg border">
                    {selectedReview.goals}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 bg-white border-t border-gray-100 px-6 py-4 flex justify-between items-center rounded-b-xl">
            <div>
              {selectedReview.status === 'Submitted' && !selectedReview.disagreed && (
                <button 
                  onClick={onOpenDisagree}
                  className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg font-medium text-sm transition-colors"
                >
                  <ThumbsDown size={16} />
                  Disagree
                </button>
              )}
            </div>
            <div className="flex gap-3">
              <button 
                onClick={onClose}
                className="px-4 py-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 font-medium transition-colors"
              >
                Close
              </button>
              {selectedReview.status === 'Submitted' && (
                <button 
                  onClick={onAcknowledge}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 shadow-md font-medium transition-colors"
                >
                  <CheckCircle size={18} />
                  Acknowledge Review
                </button>
              )}
              {selectedReview.status === 'Acknowledged' && (
                <span className="px-4 py-2 bg-green-100 text-green-800 rounded-lg font-bold text-sm flex items-center gap-2 border border-green-200">
                  <CheckCircle size={16} />
                  Acknowledged
                </span>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default ReviewDetailsModal;
