/**
 * ReviewList Component
 * Displays a CRUD table of reviews instead of cards
 */

import { FileText, Eye, Edit3 } from 'lucide-react';

// Status badge styles
const getStatusBadge = (status) => {
  const styles = {
    pending_self_rating: 'bg-yellow-100 text-yellow-700',
    pending_acknowledgment: 'bg-blue-100 text-blue-700',
    acknowledged: 'bg-green-100 text-green-700',
    disputed: 'bg-red-100 text-red-700',
    draft: 'bg-gray-100 text-gray-600',
  };
  return styles[status] || 'bg-gray-100 text-gray-600';
};

const formatStatus = (status) => {
  const labels = {
    pending_self_rating: 'Needs Self-Rating',
    pending_acknowledgment: 'Pending Acknowledgment',
    acknowledged: 'Acknowledged',
    disputed: 'Disputed',
    draft: 'Draft',
  };
  return labels[status] || status;
};

const formatDate = (dateStr) => {
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

const ReviewList = ({
  reviews,
  activeTab,
  onViewDetails,
  onStartSelfRating
}) => {
  if (reviews.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-100">
        <FileText className="mx-auto h-12 w-12 text-gray-300" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">
          {activeTab === 'pending' ? 'No pending reviews' : 'No completed reviews'}
        </h3>
        <p className="mt-1 text-sm text-gray-500">
          {activeTab === 'pending' 
            ? 'You have no evaluations requiring action.' 
            : "You haven't completed any evaluations yet."}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-200 text-gray-600 text-xs uppercase tracking-wide shadow-sm">
              <th className="px-6 py-3 text-left font-semibold">Status</th>
              <th className="px-6 py-3 text-left font-semibold">Review Period</th>
              <th className="px-6 py-3 text-left font-semibold">Reviewer</th>
              <th className="px-6 py-3 text-left font-semibold">Type</th>
              <th className="px-6 py-3 text-left font-semibold">Score</th>
              <th className="px-6 py-3 text-left font-semibold">Date</th>
              <th className="px-6 py-3 text-center font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {reviews.map((review) => (
              <tr key={review.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${getStatusBadge(review.status)}`}>
                    {formatStatus(review.status)}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm text-gray-800 font-medium">
                    {review.review_period || review.cycle_name || 'N/A'}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm text-gray-600">
                    {review.reviewer_name || 'Not assigned'}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm text-gray-600 capitalize">
                    {review.review_type || 'Annual'}
                  </span>
                </td>
                <td className="px-6 py-4">
                  {review.final_score ? (
                    <span className="text-sm font-semibold text-gray-800">
                      {parseFloat(review.final_score).toFixed(2)}
                    </span>
                  ) : (
                    <span className="text-sm text-gray-400">—</span>
                  )}
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm text-gray-500">
                    {formatDate(review.created_at)}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={() => onViewDetails(review)}
                      className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                      title="View Details"
                    >
                      <Eye size={16} />
                    </button>
                    {review.status === 'pending_self_rating' && (
                      <button
                        onClick={() => onStartSelfRating(review)}
                        className="p-2 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Self-Rate"
                      >
                        <Edit3 size={16} />
                      </button>
                    )}
                  </div>
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
