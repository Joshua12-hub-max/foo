import React from 'react';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { SquarePen, Eye, Search, RefreshCw, Plus, AlertTriangle, FileText, Calendar, User, ChevronLeft, ChevronRight, Filter, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { fetchReviews, deleteReview } from '@api';
import { InternalReview } from '@/types/performance';
import { useFilterOptions } from '@/hooks/useFilterOptions';
import PerformanceLayout from '@components/Custom/Performance/PerformanceLayout';

import { useToastStore } from '@/stores';

const ITEMS_PER_PAGE = 12;



const EvaluationHistory = () => {
  const navigate = useNavigate();
  const { data: filterOptions, isLoading: loadingFilters } = useFilterOptions();
  const departments = filterOptions.departments;

  const [reviews, setReviews] = useState<InternalReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedReview, setSelectedReview] = useState<InternalReview | null>(null);
  const [deleting, setDeleting] = useState(false);
  
  const showToast = useToastStore((state) => state.showToast);
  const showNotification = (message: string, type: 'success' | 'error') => showToast(message, type);

  const loadData = useCallback(async () => {

    try {
      setLoading(true);
      setError(null);
      
      const reviewsRes = await fetchReviews();

      if (reviewsRes.success) {
        setReviews(reviewsRes.reviews);
      }
    } catch (err) {
      console.error('Failed to load evaluation history:', err);
      setError('Failed to load evaluation history. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);


  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedDepartment]);

  const handleAction = useCallback((review: InternalReview) => {
    navigate(`/admin-dashboard/performance/reviews/${review.id}`);
  }, [navigate]);

  const handleDeleteClick = useCallback((review: InternalReview) => {
    setSelectedReview(review);
    setDeleteModalOpen(true);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (!selectedReview) return;
    
    try {
      setDeleting(true);
      const response = await deleteReview(selectedReview.id);
      if (response.success) {
        setReviews(prev => prev.filter(r => r.id !== selectedReview.id));
        setDeleteModalOpen(false);
        setSelectedReview(null);
        showNotification('Evaluation deleted successfully', 'success');
      }
    } catch (err: unknown) {
      console.error('Failed to delete evaluation:', err);
      showNotification(err instanceof Error ? err.message : 'Failed to delete evaluation', 'error');
    } finally {
      setDeleting(false);
    }
  }, [selectedReview, showNotification]);

  const filteredReviews = useMemo(() => {
    return reviews.filter(review => {
      const firstName = review.employee_first_name || review.employee_first || '';
      const lastName = review.employee_last_name || review.employee_last || '';
      const employeeName = `${firstName} ${lastName}`.toLowerCase();
      const matchesSearch = employeeName.includes(searchTerm.toLowerCase());
      const matchesDept = selectedDepartment === 'All' || review.employee_department === selectedDepartment;
      return matchesSearch && matchesDept;
    });
  }, [reviews, searchTerm, selectedDepartment]);

  const totalPages = useMemo(() => 
    Math.ceil(filteredReviews.length / ITEMS_PER_PAGE), 
  [filteredReviews.length]);

  const paginatedReviews = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredReviews.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredReviews, currentPage]);

  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + paginatedReviews.length;

  const handlePageChange = useCallback((page: number) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  }, [totalPages]);

  const formatDate = useCallback((dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }, []);

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'Draft': return 'bg-gray-100 text-gray-600 border-gray-200';
      case 'Submitted': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'Finalized': return 'bg-green-100 text-green-700 border-green-200';
      case 'Acknowledged': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'Approved': return 'bg-purple-100 text-purple-700 border-purple-200';
      default: return 'bg-gray-100 text-gray-500 border-gray-200';
    }
  };

  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      }
    }
    return pages;
  };

  return (
    <PerformanceLayout>

      
      <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-800">Evaluation History</h2>
          <div className="flex gap-3">
              <button
                onClick={loadData}
                className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 rounded-lg shadow-sm transition-all"
                title="Refresh"
              >
                <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
              </button>
              <button
                onClick={() => navigate('/admin-dashboard/performance/reviews/new')}
                className="bg-white hover:bg-gray-50 text-gray-900 border border-gray-300 px-5 py-2.5 rounded-lg flex items-center gap-2 shadow-sm transition-all active:scale-95 text-sm font-bold"
              >
                <Plus size={18} />
                <span>New Evaluation</span>
              </button>
          </div>
      </div>

      <div className="bg-white p-4 rounded-xl border border-gray-200 mb-6 shadow-sm">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search by employee name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-200 outline-none text-sm transition-all"
            />
          </div>
          
          <div className="flex items-center gap-2 min-w-[240px]">
            <Filter size={18} className="text-gray-400" />
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-200 outline-none text-sm transition-all appearance-none"
            >
              <option value="All">All Departments</option>
              {departments.map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}

            </select>
          </div>

          <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-100 rounded-lg text-blue-800">
            <p className="text-xs font-bold uppercase tracking-wide opacity-70">Filtered Total</p>
            <p className="text-lg font-bold">{filteredReviews.length}</p>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-center gap-3">
          <AlertTriangle className="text-red-500" size={20} />
          <span className="text-red-700 font-medium">{error}</span>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-800"></div>
        </div>
      ) : filteredReviews.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-16 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText className="text-gray-400" size={32} />
          </div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">No Evaluations Found</h3>
          <p className="text-gray-500 mb-6 max-w-md mx-auto">
            {searchTerm || selectedDepartment !== 'All' 
              ? 'Try adjusting your filters to find what you are looking for.' 
              : 'There are no performance evaluations recorded in the system yet.'}
          </p>
          {(searchTerm || selectedDepartment !== 'All') && (
            <button
              onClick={() => {setSearchTerm(''); setSelectedDepartment('All');}}
              className="text-gray-800 font-semibold hover:underline"
            >
              Clear all filters
            </button>
          )}
        </div>
      ) : (
        <div className="bg-[#F8F9FA] rounded-xl shadow-sm border border-gray-100 overflow-hidden p-1">
          <div className="overflow-x-auto bg-gray-50 rounded-lg">
            <table className="w-full text-left min-w-[1200px]">
              <thead className="bg-gray-200 shadow-md text-gray-700">
                <tr>
                  <th className="px-6 py-4 font-bold text-sm tracking-wide whitespace-nowrap">Employee</th>
                  <th className="px-6 py-4 font-bold text-sm tracking-wide whitespace-nowrap">Department</th>
                  <th className="px-6 py-4 font-bold text-sm tracking-wide whitespace-nowrap">Cycle / Period</th>
                  <th className="px-6 py-4 font-bold text-sm tracking-wide whitespace-nowrap text-center">Score</th>
                  <th className="px-6 py-4 font-bold text-sm tracking-wide whitespace-nowrap">Status</th>
                  <th className="px-6 py-4 font-bold text-sm tracking-wide whitespace-nowrap text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedReviews.map((review, index) => (
                  <motion.tr
                    key={review.id}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
                    className="hover:bg-[#F8F9FA] hover:shadow-xl transition-colors group"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-gray-200 rounded-full flex items-center justify-center shadow-inner group-hover:bg-white transition-colors">
                          <User className="text-gray-600" size={16} />
                        </div>
                        <div>
                          <p className="font-bold text-gray-800 text-sm">
                            {review.employee_first_name || review.employee_first} {review.employee_last_name || review.employee_last}
                          </p>
                          <p className="text-[10px] text-gray-500 font-mono">{formatDate(review.created_at)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-800">
                        {review.employee_department || 'N/A'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-gray-700">{review.cycle_title || 'Direct Evaluation'}</p>
                      <p className="text-xs text-gray-400">
                        {formatDate(review.review_period_start ?? null)} - {formatDate(review.review_period_end ?? null)}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="inline-block py-1 px-3 bg-white rounded-lg border border-gray-100 shadow-sm font-bold text-gray-800 text-sm">
                        {review.total_score ? `${((parseFloat(review.total_score) / 5) * 100).toFixed(0)}%` : '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${getStatusStyle(review.status)}`}>
                        {review.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 text-sm">
                        <button
                          onClick={() => handleAction(review)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white text-gray-700 border border-gray-200 text-xs font-medium rounded-lg hover:bg-gray-100 hover:border-gray-300 transition-all shadow-sm"
                        >
                          {review.status === 'Draft' ? <SquarePen size={14} /> : <Eye size={14} />}
                          {review.status === 'Draft' ? 'Continue' : 'Details'}
                        </button>
                        {review.status === 'Draft' && (
                          <button
                            onClick={() => handleDeleteClick(review)}
                            className="p-1.5 text-gray-400 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100"
                            title="Delete Draft"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex justify-between items-center mt-6 p-6 border-t border-gray-100 bg-white">
              <div className="text-sm text-gray-800">
                Showing <span className="font-semibold text-gray-800">{startIndex + 1}–{Math.min(endIndex, filteredReviews.length)}</span> of <span className="font-semibold text-gray-800">{filteredReviews.length}</span> records
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-all text-sm font-bold text-gray-700"
                >
                  Previous
                </button>
                <span className="text-sm px-4 py-2 bg-gray-50 text-gray-800 rounded-lg font-semibold">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-6 py-2 bg-white border border-gray-300 rounded-lg shadow-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-all text-sm font-bold text-gray-700"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full mx-4"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center text-red-600">
                <AlertTriangle size={24} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Delete Evaluation?</h3>
                <p className="text-sm text-gray-500">This action cannot be undone and will permanently remove this record.</p>
              </div>
            </div>
            
            <p className="text-sm text-gray-600 mb-6 bg-gray-50 p-4 rounded-lg border border-gray-100">
              Are you sure you want to delete the evaluation for{' '}
              <strong className="text-gray-900">{selectedReview?.employee_first_name || selectedReview?.employee_first} {selectedReview?.employee_last_name || selectedReview?.employee_last}</strong>?
            </p>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setDeleteModalOpen(false);
                  setSelectedReview(null);
                }}
                disabled={deleting}
                className="px-4 py-2 text-gray-600 font-bold hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={deleting}
                className="px-4 py-2 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 transition-colors shadow-sm disabled:opacity-50"
              >
                {deleting ? 'Deleting...' : 'Delete Permanently'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </PerformanceLayout>
  );
};

export default EvaluationHistory;
