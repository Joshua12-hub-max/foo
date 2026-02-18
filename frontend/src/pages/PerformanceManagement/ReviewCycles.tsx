import React from 'react';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Calendar, SquarePen, CheckCircle, Clock, AlertCircle, Trash2, X } from 'lucide-react';
import { fetchReviewCycles, createReviewCycle, updateReviewCycle, deleteReviewCycle } from '@api';
import PerformanceLayout from '@components/Custom/Performance/PerformanceLayout';
import { useToastStore } from '@/stores';
import { ReviewCycle } from '@/types/performance';
import { AxiosError } from 'axios';

const ReviewCycles = () => {
  const [cycles, setCycles] = useState<ReviewCycle[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCycle, setEditingCycle] = useState<ReviewCycle | null>(null);
  const [formData, setFormData] = useState({title: '', description: '', startDate: '', endDate: ''});
  
  // Toast notification hook
  const showToast = useToastStore((state) => state.showToast);
  const showNotification = (message: string, type: 'success' | 'error') => showToast(message, type);

  const loadCycles = async () => {
    try {
      setLoading(true);
      const data = await fetchReviewCycles();
      if (data.success) {
        setCycles(data.cycles);
      }
    } catch (err) {
      console.error("Failed to load cycles", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCycles();
  }, []);

  // Reset form when modal closes
  const closeModal = () => {
    setIsModalOpen(false);
    setEditingCycle(null);
    setFormData({ title: '', description: '', startDate: '', endDate: '' });
  };

  // Open modal for creating new cycle
  const handleNewCycle = () => {
    setEditingCycle(null);
    setFormData({ title: '', description: '', startDate: '', endDate: '' });
    setIsModalOpen(true);
  };

  // Open modal for editing existing cycle
  const handleEditCycle = (cycle: ReviewCycle) => {
    setEditingCycle(cycle);
    setFormData({
      title: cycle.title || '',
      description: cycle.description || '',
      startDate: cycle.startDate ? cycle.startDate.split('T')[0] : '',
      endDate: cycle.endDate ? cycle.endDate.split('T')[0] : ''
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingCycle) {
        await updateReviewCycle(editingCycle.id, formData);
        showNotification("Cycle updated successfully!", "success");
      } else {
        await createReviewCycle(formData);
        showNotification("Cycle created successfully!", "success");
      }
      closeModal();
      loadCycles();
    } catch (err) {
      const axiosErr = err as AxiosError<{ message?: string }>;
      console.error("Failed to save cycle", err);
      showNotification(axiosErr.response?.data?.message || "Failed to save cycle", "error");
    }
  };

  const handleDeleteCycle = async (cycleId: string | number) => {
    if (!window.confirm("Are you sure you want to delete this review cycle? This action cannot be undone.")) {
      return;
    }
    try {
      await deleteReviewCycle(cycleId);
      showNotification("Cycle deleted successfully!", "success");
      loadCycles();
    } catch (err) {
      const axiosErr = err as AxiosError<{ message?: string }>;
      console.error("Failed to delete cycle", err);
      showNotification(axiosErr.response?.data?.message || "Failed to delete cycle", "error");
    }
  };

  const getStatus = (start: string, end: string) => {
    const now = new Date();
    const startDate = new Date(start);
    const endDate = new Date(end);

    if (now < startDate) return { label: 'Upcoming', icon: Clock };
    if (now > endDate) return { label: 'Completed', icon: CheckCircle };
    return { label: 'Active', icon: AlertCircle };
  };

  return (
    <PerformanceLayout>
      {/* Toast Notification */}

      
      <div className="flex justify-end mb-6">
        <button
          onClick={handleNewCycle}
          className="bg-white hover:bg-gray-50 text-gray-900 border border-gray-300 px-5 py-2.5 rounded-lg flex items-center gap-2 shadow-sm transition-all active:scale-95 text-sm font-bold"
        >
          <Plus size={18} />
          <span className="hidden md:inline">New Cycle</span>
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-800"></div>
        </div>
      ) : cycles.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-100 shadow-sm">
          <Calendar className="mx-auto h-12 w-12 text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900">No Review Cycles</h3>
          <p className="text-gray-500 mt-1">Get started by creating a new review cycle.</p>
          <button
            onClick={handleNewCycle}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-[#F8F9FA] text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-100 hover:border-gray-300"
          >
            <span>Create First Cycle</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cycles.map((cycle) => {
            const status = getStatus(cycle.startDate, cycle.endDate);
            const StatusIcon = status.icon;
            
            return (
              <motion.div
                key={cycle.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white p-6 rounded-xl border border-gray-200 hover:border-gray-300 transition-all group border-l-4 border-gray-300"
              >
                <div className="flex justify-between items-start mb-3">
                  <span className="px-3 py-1 bg-gray-50 text-gray-700 rounded-full text-xs font-bold uppercase tracking-wide border border-gray-100">
                    {status.label}
                  </span>
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => handleEditCycle(cycle)}
                      className="text-gray-400 hover:text-blue-600 p-1"
                      title="Edit Cycle"
                    >
                      <SquarePen size={16} />
                    </button>
                    <button 
                      onClick={() => handleDeleteCycle(cycle.id)}
                      className="text-gray-400 hover:text-red-600 p-1"
                      title="Delete Cycle"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                <h3 className="text-lg font-bold text-gray-800 mb-2">{cycle.title}</h3>
                <p className="text-gray-500 text-sm mb-4 line-clamp-2">{cycle.description || 'No description provided.'}</p>

                <div className="flex items-center justify-between pt-4 border-t border-gray-50 text-sm">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Calendar size={16} className="text-gray-400" />
                    <span>Start: <span className="font-bold text-gray-800">{new Date(cycle.startDate).toLocaleDateString()}</span></span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <CheckCircle size={16} className="text-gray-400" />
                    <span>End: <span className="font-bold text-gray-800">{new Date(cycle.endDate).toLocaleDateString()}</span></span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Create/Edit Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden"
            >
              <div className="bg-gray-200 px-6 py-3 flex justify-between items-center border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-800">
                  {editingCycle ? 'Edit Review Cycle' : 'Create Review Cycle'}
                </h2>
                <button onClick={closeModal} className="p-1 hover:text-red-800 rounded-lg transition-colors text-gray-500">
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-3">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Title *</label>
                    <input
                      type="text"
                      required
                      value={formData.title}
                      onChange={(e) => setFormData({...formData, title: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-200 focus:border-transparent outline-none transition-all"
                      placeholder="e.g. 2nd Semester 2025"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Description</label>
                    <textarea
                      rows={3}
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-200 focus:border-transparent outline-none resize-none transition-all"
                      placeholder="Evaluation period for July to December 2025"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Start Date *</label>
                      <input
                        type="date"
                        required
                        value={formData.startDate}
                        onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-200 focus:border-transparent outline-none transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">End Date *</label>
                      <input
                        type="date"
                        required
                        value={formData.endDate}
                        onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-200 focus:border-transparent outline-none transition-all"
                      />
                    </div>
                  </div>
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 mt-4">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="flex-1 px-3 py-1.5 bg-[#F8F9FA] text-gray-700 font-medium rounded-lg hover:bg-gray-100 hover:text-red-800 transition-colors border border-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-3 py-1.5 bg-[#F8F9FA] text-gray-700 font-medium rounded-lg border border-gray-200 hover:text-green-800 transition-all"
                  >
                    {editingCycle ? 'Save Changes' : 'Create Cycle'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </PerformanceLayout>
  );
};

export default ReviewCycles;
