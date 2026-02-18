import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, AlertCircle, Clock, ThumbsDown, AlertTriangle, TrendingDown, Info } from 'lucide-react';
import { getAdjectivalRating, getScoreColor } from '../constants/performanceConstants';

interface ReviewItem {
  criteria_title: string;
  criteria_description?: string;
  self_score?: number | string;
  score: number | string;
  [key: string]: unknown;
}

interface ReviewType {
  self_rating_score?: number | string;
  total_score?: number | string;
  disagreed?: boolean;
  disagree_remarks?: string;
  items?: ReviewItem[];
  strengths?: string;
  improvements?: string;
  goals?: string;
  status?: string;
  attendance_details?: {
    totalLates: number;
    totalUndertime: number;
    totalAbsences: number;
    totalLateMinutes: number;
    ratingDescription: string;
  } | null;
  violation_count?: number;
  [key: string]: unknown;
}

interface ReviewDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedReview: ReviewType | null;
  onAcknowledge: () => void;
  onOpenDisagree: () => void;
}

const ReviewDetailsModal: React.FC<ReviewDetailsModalProps> = ({
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
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 transition-all">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-xl w-full max-w-md max-h-[90vh] overflow-hidden shadow-2xl flex flex-col border border-gray-100"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 shrink-0 bg-white border-b border-gray-100">
            <h2 className="text-xl font-bold text-gray-900">Evaluation Details</h2>
            <button 
              onClick={onClose} 
              className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          {/* Content */}
          <div className="p-6 space-y-6 overflow-y-auto flex-1 bg-white">
            {/* Score Comparison */}
            <div className="grid grid-cols-2 gap-4">
              {selectedReview.self_rating_score && (
                <div className="bg-gray-50 p-5 rounded-xl border border-gray-100 text-center">
                  <p className="text-xs font-bold text-gray-500 uppercase mb-2 tracking-wider">Your Self-Rating</p>
                  <p className="text-4xl font-extrabold text-gray-900 mb-1">{selectedReview.self_rating_score}</p>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${selfRatingInfo?.color ? selfRatingInfo.color.replace('text-', 'bg-').replace('600', '100').replace('700', '100') + ' ' + selfRatingInfo.color : 'bg-gray-100 text-gray-800'}`}>
                    {selfRatingInfo?.rating}
                  </span>
                </div>
              )}
              <div className="bg-gray-50 p-5 rounded-xl border border-gray-100 text-center">
                <p className="text-xs font-bold text-gray-500 uppercase mb-2 tracking-wider">Supervisor Rating</p>
                <p className="text-4xl font-extrabold text-gray-900 mb-1">{selectedReview.total_score ? `${((parseFloat(String(selectedReview.total_score)) / 5) * 100).toFixed(0)}%` : '-'}</p>
                {selectedReview.total_score && (
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${supervisorRatingInfo?.color ? supervisorRatingInfo.color.replace('text-', 'bg-').replace('600', '100').replace('700', '100') + ' ' + supervisorRatingInfo.color : 'bg-gray-100 text-gray-800'}`}>
                    {supervisorRatingInfo?.rating}
                  </span>
                )}
              </div>
            </div>

            {/* Disagreement Warning */}
            {selectedReview.disagreed && (
              <div className="bg-orange-50 border border-orange-100 p-4 rounded-xl flex items-start gap-3">
                <AlertTriangle className="text-orange-500 flex-shrink-0 mt-0.5" size={20} />
                <div>
                  <p className="font-bold text-orange-800 text-sm">You have disagreed with this rating</p>
                  <p className="text-sm text-orange-700 mt-1">{selectedReview.disagree_remarks}</p>
                </div>
              </div>
            )}

            {/* Metrics Breakdown (Automated) */}
            <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 overflow-hidden">
                <div className="flex items-center gap-2 mb-3">
                    <Clock size={16} className="text-gray-400" />
                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Automated Attendance Summary</h4>
                </div>
                
                <div className="grid grid-cols-2 gap-y-4 gap-x-2">
                    <div className="flex flex-col">
                        <span className="text-[10px] text-gray-400 font-bold uppercase">Tardiness</span>
                        <span className="text-sm font-bold text-gray-800">
                             {selectedReview.attendance_details?.totalLates || 0}x 
                             <span className="text-gray-500 font-normal ml-1">({selectedReview.attendance_details?.totalLateMinutes || 0}m)</span>
                        </span>
                    </div>
                    <div className="flex flex-col border-l border-gray-200 pl-3">
                        <span className="text-[10px] text-gray-400 font-bold uppercase">Absences</span>
                        <span className="text-sm font-bold text-gray-800">
                            {selectedReview.attendance_details?.totalAbsences || 0} Unexplained
                        </span>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[10px] text-gray-400 font-bold uppercase">Rate</span>
                        <span className="text-sm font-bold text-gray-800">
                            {selectedReview.attendance_details?.ratingDescription || 'N/A'}
                        </span>
                    </div>
                    <div className="flex flex-col border-l border-gray-200 pl-3">
                        <span className="text-[10px] text-red-400 font-bold uppercase">Violations</span>
                        <span className={`text-sm font-bold ${selectedReview.violation_count ? 'text-red-600' : 'text-green-600'}`}>
                            {selectedReview.violation_count || 0} Active
                        </span>
                    </div>
                </div>
            </div>

            {/* Criteria Ratings */}
            <div>
              <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2 text-sm uppercase tracking-wide">
                Criteria Ratings
              </h3>
              <div className="space-y-3">
                {selectedReview.items && selectedReview.items.map((item: ReviewItem, idx: number) => (
                  <div key={idx} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900 text-sm mb-1">{item.criteria_title}</p>
                        <p className="text-xs text-gray-500 leading-relaxed">{item.criteria_description}</p>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        {item.self_score && (
                          <div 
                            className="w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm border bg-gray-50 text-gray-400 border-gray-200" 
                            title="Your Self-Rating"
                          >
                            {item.self_score}
                          </div>
                        )}
                        <div 
                          className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm shadow-sm border ${getScoreColor(item.score)}`} 
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
            <div className="space-y-4 pt-2">
              <h3 className="font-bold text-gray-900 mb-4 border-b border-gray-100 pb-2 text-sm uppercase tracking-wide">
                Supervisor Feedback
              </h3>
              
              <div className="grid gap-4">
                {selectedReview.strengths && (
                  <div className="bg-green-50/50 p-4 rounded-xl border border-green-100">
                    <h4 className="text-sm font-bold text-green-800 mb-2 flex items-center gap-2">
                      <CheckCircle size={16} className="text-green-600"/> Strengths
                    </h4>
                    <p className="text-gray-700 text-sm leading-relaxed">
                      {selectedReview.strengths}
                    </p>
                  </div>
                )}
                
                {selectedReview.improvements && (
                  <div className="bg-orange-50/50 p-4 rounded-xl border border-orange-100">
                    <h4 className="text-sm font-bold text-orange-800 mb-2 flex items-center gap-2">
                      <AlertCircle size={16} className="text-orange-600"/> Areas for Improvement
                    </h4>
                    <p className="text-gray-700 text-sm leading-relaxed">
                      {selectedReview.improvements}
                    </p>
                  </div>
                )}
  
                {selectedReview.goals && (
                  <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                    <h4 className="text-sm font-bold text-blue-800 mb-2 flex items-center gap-2">
                      <Clock size={16} className="text-blue-600"/> Future Goals
                    </h4>
                    <p className="text-gray-700 text-sm leading-relaxed">
                      {selectedReview.goals}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 border-t border-gray-100 px-6 py-4 flex justify-between items-center shrink-0">
            <div>
              {selectedReview.status === 'Submitted' && !selectedReview.disagreed && (
                <button 
                  onClick={onOpenDisagree}
                  className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-white hover:shadow-sm border border-transparent hover:border-gray-200 rounded-lg font-medium text-sm transition-all"
                >
                  <ThumbsDown size={16} />
                  Disagree
                </button>
              )}
            </div>
            <div className="flex gap-3">
              <button 
                onClick={onClose}
                className="px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 hover:text-gray-900 font-medium text-sm transition-colors shadow-sm"
              >
                Close
              </button>
              {selectedReview.status === 'Submitted' && (
                <button 
                  onClick={onAcknowledge}
                  className="px-6 py-2.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 flex items-center gap-2 font-medium text-sm transition-all shadow-lg shadow-gray-900/20"
                >
                  <CheckCircle size={18} />
                  Acknowledge Review
                </button>
              )}
              {selectedReview.status === 'Acknowledged' && (
                <span className="px-4 py-2 bg-green-50 text-green-700 rounded-lg font-bold text-sm flex items-center gap-2 border border-green-200">
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
