import React from 'react';
import { FileText, Edit3, ArrowRight } from 'lucide-react';

interface ReviewItem {
  id: string | number;
  status: string;
  review_period?: string;
  cycle_name?: string;
  created_at?: string;
  reviewer_name?: string;
  final_score?: number | string;
  [key: string]: any;
}

interface ReviewListProps {
  reviews: ReviewItem[];
  activeTab: string;
  onViewDetails: (review: ReviewItem) => void;
  onStartSelfRating: (review: ReviewItem) => void;
}

// Minimalist status styling
const getStatusBadge = (status: string) => {
  const styles: Record<string, string> = {
    pending_self_rating: 'bg-black text-white border border-black',
    pending_acknowledgment: 'bg-gray-900 text-white border border-gray-900',
    acknowledged: 'bg-white text-gray-800 border border-gray-300',
    disputed: 'bg-white text-gray-800 border border-gray-300 dashed',
    draft: 'bg-gray-50 text-gray-400 border border-gray-100',
  };
  return styles[status] || 'bg-gray-50 text-gray-500 border border-gray-100';
};

const formatStatus = (status: string) => {
  const labels: Record<string, string> = {
    pending_self_rating: 'Self Rating Required',
    pending_acknowledgment: 'Acknowledgment Pending',
    acknowledged: 'Completed',
    disputed: 'Under Review',
    draft: 'Draft',
  };
  return labels[status] || status.replace(/_/g, ' ');
};

const formatDate = (dateStr?: string) => {
  if (!dateStr) return '—';
  try {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch {
    return dateStr;
  }
};

const ReviewList: React.FC<ReviewListProps> = ({
  reviews,
  activeTab,
  onViewDetails,
  onStartSelfRating
}) => {
  if (reviews.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 bg-gray-50/50 rounded-xl border-2 border-dashed border-gray-200 text-center">
        <h3 className="text-gray-900 font-bold text-lg tracking-tight mb-1">
          {activeTab === 'pending' ? 'All Caught Up' : 'No History Yet'}
        </h3>
        <p className="text-sm text-gray-500 max-w-sm mx-auto">
          {activeTab === 'pending' 
            ? 'You have no pending performance evaluations.' 
            : "You haven't completed any evaluations yet."}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/50">
              <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-gray-400">Status</th>
              <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-gray-400">Period</th>
              <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-gray-400">Reviewer</th>
              <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-gray-400">Score</th>
              <th className="px-6 py-4 text-right text-[10px] font-black uppercase tracking-widest text-gray-400">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {reviews.map((review) => (
              <tr 
                key={review.id} 
                className="group hover:bg-gray-50 transition-all cursor-pointer"
                onClick={() => onViewDetails(review)}
              >
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center px-2.5 py-1 rounded text-[10px] uppercase font-bold tracking-wider ${getStatusBadge(review.status)}`}>
                    {formatStatus(review.status)}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div>
                      <span className="block text-sm font-bold text-gray-900">
                        {review.review_period || review.cycle_name || 'Annual Review'}
                      </span>
                      <span className="text-xs text-gray-400 font-medium">{formatDate(review.created_at)}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm font-medium text-gray-600">
                    {review.reviewer_name || '—'}
                  </span>
                </td>
                <td className="px-6 py-4">
                  {review.final_score ? (
                    <div className="flex items-center gap-2">
                        <span className="text-lg font-black text-gray-900">{parseFloat(review.final_score.toString()).toFixed(2)}</span>
                    </div>
                  ) : (
                    <span className="text-xs text-gray-400 font-medium italic">Pending</span>
                  )}
                </td>
                <td className="px-6 py-4 text-right">
                    {review.status === 'pending_self_rating' ? (
                      <button
                        onClick={(e) => { e.stopPropagation(); onStartSelfRating(review); }}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-black text-white text-xs font-bold uppercase tracking-wider rounded-lg hover:bg-gray-800 transition-all shadow-lg shadow-gray-200"
                      >
                        <Edit3 size={14} /> Start Rating
                      </button>
                    ) : (
                      <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-white border border-gray-200 text-gray-300 group-hover:border-gray-300 group-hover:text-gray-900 transition-all">
                        <ArrowRight size={16} />
                      </div>
                    )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ReviewList;
