import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Edit, Trash2, Search, RefreshCw, Plus, AlertTriangle, FileText, Calendar, User, ChevronLeft, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { fetchReviews, deleteReview } from '../../api/performanceApi';

const ITEMS_PER_PAGE = 12;

const DraftReviews = () => {
  const navigate = useNavigate();
  const [drafts, setDrafts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedDraft, setSelectedDraft] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const loadDrafts = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetchReviews({ status: 'Draft' });
      if (response.success) {
        // Filter only Draft status reviews
        const draftReviews = response.reviews.filter(r => r.status === 'Draft');
        setDrafts(draftReviews);
      }
    } catch (err) {
      console.error('Failed to load drafts:', err);
      setError('Failed to load draft reviews. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDrafts();
  }, []);

  // Reset to first page when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const handleEdit = (draft) => {
    navigate(`/admin-dashboard/performance/reviews/${draft.id}`);
  };

  const handleDeleteClick = (draft) => {
    setSelectedDraft(draft);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedDraft) return;
    
    try {
      setDeleting(true);
      const response = await deleteReview(selectedDraft.id);
      if (response.success) {
        setDrafts(prev => prev.filter(d => d.id !== selectedDraft.id));
        setDeleteModalOpen(false);
        setSelectedDraft(null);
      }
    } catch (err) {
      console.error('Failed to delete draft:', err);
      alert(err.response?.data?.message || 'Failed to delete draft');
    } finally {
      setDeleting(false);
    }
  };

  const filteredDrafts = drafts.filter(draft => {
    const employeeName = `${draft.emp_first_name} ${draft.emp_last_name}`.toLowerCase();
    return employeeName.includes(searchTerm.toLowerCase());
  });

  // Pagination calculations
  const totalPages = Math.ceil(filteredDrafts.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedDrafts = filteredDrafts.slice(startIndex, endIndex);

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Generate page numbers to display
  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
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
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-neutral-100 to-stone-50 rounded-xl shadow-xl p-7 w-full overflow-hidden text-gray-800">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
            Draft Evaluations
          </h1>
          <p className="text-sm text-gray-800 mt-1">Manage incomplete performance reviews</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={loadDrafts}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
            title="Refresh"
          >
            <RefreshCw size={18} />
          </button>
          <button
            onClick={() => navigate('/admin-dashboard/performance/reviews/new')}
            className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-800 border border-gray-200 font-medium rounded-lg shadow-md hover:bg-gray-300 transition-colors"
          >
            <Plus size={18} />
            <span>New Evaluation</span>
          </button>
        </div>
      </div>

      <hr className="mb-6 border-[1px] border-[#274b46]" />

      {/* Search with Stats */}
      <div className="bg-[#F8F9FA] p-4 rounded-lg shadow-md mb-6">
        <div className="flex items-center gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search by employee name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-200 focus:border-gray-200 outline-none text-sm transition-all shadow-sm"
            />
          </div>
          {/* Total Drafts Badge */}
          <div className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg shadow-sm text-gray-800">
            <p className="text-xs font-bold uppercase tracking-wide text-gray-500">Total Drafts</p>
            <p className="text-lg font-bold">{drafts.length}</p>
          </div>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-center gap-3 shadow-sm">
          <AlertTriangle className="text-red-500" size={20} />
          <span className="text-red-700 font-medium">{error}</span>
        </div>
      )}

      {/* Loading State */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gray-800"></div>
        </div>
      ) : filteredDrafts.length === 0 ? (
        /* Empty State */
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <h3 className="text-xl font-bold text-gray-800 mb-2">No Draft Evaluations</h3>
          <p className="text-gray-500 mb-6">
            {searchTerm ? 'No draft evaluations match your search.' : 'You have no saved draft evaluations yet.'}
          </p>
          <button
            onClick={() => navigate('/admin-dashboard/performance/reviews/new')}
            className="inline-flex items-center gap-2 px-6 py-2 bg-gray-200 text-gray-800 rounded-lg shadow-md hover:bg-gray-300 transition-colors font-medium"
          >
            <Plus size={18} />
            Create New Evaluation
          </button>
        </div>
      ) : (
        /* Drafts Table */
        <div className="bg-gray-50 rounded-lg scrollbar-bg-white shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-200 shadow-md text-gray-700">
              <tr>
                <th className="px-6 py-4 text-left font-bold text-sm tracking-wide">Employee</th>
                <th className="px-6 py-4 text-left font-bold text-sm tracking-wide">Created</th>
                <th className="px-6 py-4 text-left font-bold text-sm tracking-wide">Last Modified</th>
                <th className="px-6 py-4 text-left font-bold text-sm tracking-wide">Reviewer</th>
                <th className="px-6 py-4 text-left font-bold text-sm tracking-wide">Status</th>
                <th className="px-6 py-4 text-center font-bold text-sm tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginatedDrafts.map((draft, index) => (
                <motion.tr
                  key={draft.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="hover:bg-[#F8F9FA] hover:shadow-xl transition-colors"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center shadow-inner">
                        <User className="text-gray-600" size={20} />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-800">
                          {draft.emp_first_name} {draft.emp_last_name}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <Calendar size={14} className="text-gray-400" />
                      {formatDate(draft.created_at)}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <Calendar size={14} className="text-gray-400" />
                      {formatDate(draft.updated_at)}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {draft.reviewer_first_name} {draft.reviewer_last_name}
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-3 py-1 bg-gray-200 text-gray-700 rounded-full text-xs font-bold uppercase tracking-wide border border-gray-300">
                      Draft
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => handleEdit(draft)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-200 text-gray-700 text-xs font-medium rounded-lg shadow-md hover:bg-gray-300 hover:text-blue-800 transition-colors"
                      >
                        <Edit size={14} />
                        Continue
                      </button>
                      <button
                        onClick={() => handleDeleteClick(draft)}
                        className="p-2 text-gray-400 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between bg-white">
              <p className="text-sm text-gray-600">
                Showing <span className="font-bold text-gray-800">{startIndex + 1}</span> to <span className="font-bold text-gray-800">{Math.min(endIndex, filteredDrafts.length)}</span> of <span className="font-bold text-gray-800">{filteredDrafts.length}</span> drafts
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft size={18} />
                </button>
                
                {getPageNumbers().map((page, index) => (
                  page === '...' ? (
                    <span key={`ellipsis-${index}`} className="px-2 text-gray-400">...</span>
                  ) : (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                        currentPage === page
                          ? 'bg-gray-200 text-gray-800 shadow-md'
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      {page}
                    </button>
                  )
                ))}
                
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg shadow-2xl p-6 max-w-md w-full mx-4 overflow-hidden"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="text-red-600" size={24} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-800">Delete Draft?</h3>
                <p className="text-sm text-gray-500">This action cannot be undone.</p>
              </div>
            </div>
            
            <p className="text-gray-600 mb-6 bg-gray-50 p-3 rounded-lg border border-gray-100 text-sm">
              Are you sure you want to delete the draft evaluation for{' '}
              <strong className="text-gray-800">{selectedDraft?.emp_first_name} {selectedDraft?.emp_last_name}</strong>?
            </p>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setDeleteModalOpen(false);
                  setSelectedDraft(null);
                }}
                disabled={deleting}
                className="px-4 py-2 bg-[#F8F9FA] text-gray-700 font-medium rounded-lg shadow-md hover:bg-gray-100 hover:text-red-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={deleting}
                className="px-4 py-2 bg-[#F8F9FA] text-gray-700 font-medium rounded-lg shadow-md border-2 border-transparent hover:text-red-800 transition-colors disabled:opacity-50"
              >
                {deleting ? 'Deleting...' : 'Delete Draft'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default DraftReviews;

