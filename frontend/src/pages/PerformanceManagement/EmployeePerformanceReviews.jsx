/**
 * EmployeePerformanceReviews Page
 * Simple CRUD table view - matching timekeeping design (no borders, subtle shadows)
 */

import { useState, useEffect } from 'react';
import { Eye, Edit3, FileText, RefreshCw, X, Check, AlertTriangle, Search } from 'lucide-react';
import axios from '../../api/axios';
import { useAuth } from '../../hooks/useAuth';

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

const EmployeePerformanceReviews = () => {
  const { user } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedReview, setSelectedReview] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filter, setFilter] = useState('all');

  const fetchReviews = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get('/performance/my-reviews');
      if (response.data.success) {
        setReviews(response.data.reviews || []);
      }
    } catch (err) {
      setError('Failed to load reviews');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const handleView = (review) => {
    setSelectedReview(review);
    setIsModalOpen(true);
  };

  const handleAcknowledge = async (reviewId) => {
    try {
      await axios.put(`/performance/reviews/${reviewId}/acknowledge`);
      fetchReviews();
      setIsModalOpen(false);
    } catch (err) {
      setError('Failed to acknowledge review');
    }
  };

  const filteredReviews = filter === 'all' 
    ? reviews 
    : reviews.filter(r => {
        if (filter === 'pending') return r.status?.includes('pending');
        if (filter === 'completed') return r.status === 'acknowledged' || r.status === 'disputed';
        return true;
      });

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-neutral-100 to-stone-50 rounded-xl shadow-xl p-7 w-full overflow-hidden text-gray-800">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">My Performance Reviews</h1>
          <p className="text-sm text-gray-800 mt-1">View and manage your performance evaluations</p>
        </div>
        <button
          onClick={fetchReviews}
          className="p-2 bg-gray-200 text-gray-800 border border-gray-200 rounded-lg shadow-md hover:bg-gray-300 transition-all"
          title="Refresh"
        >
          <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      <hr className="mb-6 border-[1px] border-[#274b46]" />

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6">
        {['all', 'pending', 'completed'].map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors capitalize shadow-sm border ${
              filter === tab 
                ? 'bg-gray-800 text-white border-gray-800' 
                : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
            }`}
          >
            {tab} {tab !== 'all' && `(${reviews.filter(r => {
              if (tab === 'pending') return r.status?.includes('pending');
              if (tab === 'completed') return r.status === 'acknowledged' || r.status === 'disputed';
              return false;
            }).length})`}
          </button>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg mb-6 flex items-center gap-2 border border-red-100 shadow-sm">
          <AlertTriangle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Table */}
      <div className="bg-gray-50 rounded-lg scrollbar-bg-white shadow-sm border border-gray-100 overflow-hidden flex-1">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <RefreshCw className="w-8 h-8 text-gray-400 animate-spin" />
          </div>
        ) : filteredReviews.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-400 bg-white">
            <Search size={48} className="mb-3 text-gray-300" />
            <p className="text-gray-600 font-medium">No records found</p>
            <p className="text-sm text-gray-400">Try adjusting your filters or search terms</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-200 shadow-md text-gray-700">
                <tr className="text-xs uppercase tracking-wide">
                  <th className="px-6 py-4 text-left font-bold text-gray-700">Status</th>
                  <th className="px-6 py-4 text-left font-bold text-gray-700">Review Period</th>
                  <th className="px-6 py-4 text-left font-bold text-gray-700">Reviewer</th>
                  <th className="px-6 py-4 text-left font-bold text-gray-700">Score</th>
                  <th className="px-6 py-4 text-left font-bold text-gray-700">Date</th>
                  <th className="px-6 py-4 text-center font-bold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredReviews.map((review) => (
                  <tr key={review.id} className="hover:bg-[#F8F9FA] hover:shadow-xl transition-colors">
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusBadge(review.status)}`}>
                        {formatStatus(review.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-800 font-medium">
                      {review.review_period || review.cycle_name || 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {review.reviewer_name || 'Not assigned'}
                    </td>
                    <td className="px-6 py-4">
                      {review.final_score ? (
                        <span className="text-sm font-bold text-gray-800">
                          {parseFloat(review.final_score).toFixed(2)}
                        </span>
                      ) : (
                        <span className="text-sm text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {formatDate(review.created_at)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleView(review)}
                          className="p-2 bg-gray-200 text-gray-700 rounded-lg shadow-md hover:bg-gray-300 hover:text-blue-800 transition-all"
                          title="View"
                        >
                          <Eye size={16} />
                        </button>
                        {review.status === 'pending_self_rating' && (
                          <button
                            onClick={() => handleView(review)}
                            className="p-2 bg-gray-200 text-gray-700 rounded-lg shadow-md hover:bg-gray-300 hover:text-green-800 transition-all"
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
        )}
      </div>

      {/* Simple Details Modal */}
      {isModalOpen && selectedReview && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-lg shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-gray-200 shadow-md flex items-center justify-between border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-800">Review Details</h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-1 hover:text-red-800 transition-colors text-gray-500"
              >
                <X size={20} />
              </button>
            </div>
            
            {/* Modal Body */}
            <div className="p-6 space-y-4">
              <div className="bg-gray-50 border border-gray-200 rounded-lg shadow-md p-4 grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-500 font-bold uppercase">Status</label>
                  <p className="text-sm font-medium text-gray-800">{formatStatus(selectedReview.status)}</p>
                </div>
                <div>
                  <label className="text-xs text-gray-500 font-bold uppercase">Review Period</label>
                  <p className="text-sm font-medium text-gray-800">{selectedReview.review_period || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-xs text-gray-500 font-bold uppercase">Reviewer</label>
                  <p className="text-sm font-medium text-gray-800">{selectedReview.reviewer_name || 'Not assigned'}</p>
                </div>
                <div>
                  <label className="text-xs text-gray-500 font-bold uppercase">Final Score</label>
                  <p className="text-sm font-medium text-gray-800">
                    {selectedReview.final_score ? parseFloat(selectedReview.final_score).toFixed(2) : '—'}
                  </p>
                </div>
                <div className="col-span-2">
                  <label className="text-xs text-gray-500 font-bold uppercase">Remarks</label>
                  <p className="text-sm text-gray-700 bg-white p-2 rounded border border-gray-200 mt-1">{selectedReview.remarks || 'No remarks'}</p>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 flex gap-3 border-t border-gray-100">
              <button
                onClick={() => setIsModalOpen(false)}
                className="flex-1 px-4 py-2 bg-[#F8F9FA] text-gray-700 font-medium rounded-lg shadow-md hover:bg-gray-100 hover:text-red-800 transition-colors"
              >
                Close
              </button>
              {selectedReview.status === 'pending_acknowledgment' && (
                <button
                  onClick={() => handleAcknowledge(selectedReview.id)}
                  className="flex-1 px-4 py-2 bg-[#F8F9FA] text-gray-700 font-medium rounded-lg shadow-md hover:bg-gray-100 hover:text-green-800 transition-colors flex items-center justify-center gap-2"
                >
                  <Check size={16} />
                  Acknowledge
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeePerformanceReviews;