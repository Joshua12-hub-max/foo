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
            
            const statusColors: Record<string, string> = {
              'Upcoming': 'border-l-slate-300 bg-slate-50 text-slate-500',
              'Active': 'border-l-slate-800 bg-slate-900 text-white',
              'Completed': 'border-l-slate-500 bg-slate-100 text-slate-600'
            };

            const borderLColor: Record<string, string> = {
              'Upcoming': 'border-l-slate-200',
              'Active': 'border-l-slate-800',
              'Completed': 'border-l-slate-400'
            };

            return (
              <motion.div
                key={cycle.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`bg-white p-6 rounded-2xl border border-gray-100 hover:border-gray-200 hover:shadow-lg transition-all group border-l-4 ${borderLColor[status.label] || 'border-l-slate-300'} shadow-sm flex flex-col h-full`}
              >
                <div className="flex justify-between items-start mb-4">
                  <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black tracking-widest border border-gray-100 ${statusColors[status.label] || 'bg-gray-50 text-gray-500'}`}>
                    {status.label}
                  </span>
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                    <button 
                      onClick={() => handleEditCycle(cycle)}
                      className="p-2 text-gray-400 hover:text-gray-900 bg-gray-50 rounded-xl transition-all border border-gray-100 hover:shadow-sm"
                      title="Edit Cycle"
                    >
                      <SquarePen size={14} />
                    </button>
                    <button 
                      onClick={() => handleDeleteCycle(cycle.id)}
                      className="p-2 text-gray-400 hover:text-red-600 bg-gray-50 rounded-xl transition-all border border-gray-100 hover:shadow-sm"
                      title="Delete Cycle"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                <h3 className="text-base font-bold text-gray-900 mb-2 tracking-tight group-hover:text-blue-900 transition-colors leading-tight">{cycle.title}</h3>
                <p className="text-gray-500 text-xs mb-6 line-clamp-2 min-h-[2.5em] leading-relaxed flex-1">{cycle.description || 'No description provided.'}</p>

                <div className="flex items-center justify-between pt-5 border-t border-gray-50 mt-auto">
                  <div className="flex items-center gap-2.5 text-gray-500 font-medium">
                    <div className="p-2 bg-gray-50 rounded-xl border border-gray-100 group-hover:bg-blue-50 group-hover:border-blue-100 transition-colors">
                      <Calendar size={14} className="text-gray-400 group-hover:text-blue-600 transition-colors" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold text-gray-400 tracking-tighter leading-none mb-1">Start Date</span>
                      <span className="font-black text-gray-900 text-[11px] leading-none">{new Date(cycle.startDate).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5 text-gray-500 font-medium text-right items-end justify-end">
                    <div className="p-2 bg-gray-50 rounded-xl border border-gray-100 group-hover:bg-purple-50 group-hover:border-purple-100 transition-colors">
                      <StatusIcon size={14} className="text-gray-400 group-hover:text-purple-600 transition-colors" />
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-[10px] font-bold text-gray-400 tracking-tighter leading-none mb-1">End Date</span>
                      <span className="font-black text-gray-900 text-[11px] leading-none">{new Date(cycle.endDate).toLocaleDateString()}</span>
                    </div>
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
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-gray-100"
            >
              <div className="px-6 py-4 flex justify-between items-center border-b border-gray-50">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">
                    {editingCycle ? 'Edit Review Cycle' : 'Create Review Cycle'}
                  </h2>
                  <p className="text-[10px] text-gray-400 font-bold mt-0.5">Performance Management</p>
                </div>
                <button onClick={closeModal} className="p-2 hover:bg-red-50 hover:text-red-600 rounded-xl transition-all text-gray-400 border border-transparent hover:border-red-100">
                  <X size={18} />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 tracking-widest mb-1.5 ml-1">Cycle Title</label>
                    <input
                      type="text"
                      required
                      value={formData.title}
                      onChange={(e) => setFormData({...formData, title: e.target.value})}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-gray-100 focus:border-gray-300 outline-none transition-all text-gray-900 font-medium placeholder-gray-400"
                      placeholder="e.g. 2nd Semester 2025"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 tracking-widest mb-1.5 ml-1">Description</label>
                    <textarea
                      rows={3}
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-gray-100 focus:border-gray-300 outline-none resize-none transition-all text-gray-900 font-medium placeholder-gray-400"
                      placeholder="Evaluation period for July to December 2025"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 tracking-widest mb-1.5 ml-1">Start Date</label>
                      <input
                        type="date"
                        required
                        value={formData.startDate}
                        onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-gray-100 focus:border-gray-300 outline-none transition-all text-gray-900 font-medium"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 tracking-widest mb-1.5 ml-1">End Date</label>
                      <input
                        type="date"
                        required
                        value={formData.endDate}
                        onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-gray-100 focus:border-gray-300 outline-none transition-all text-gray-900 font-medium"
                      />
                    </div>
                  </div>
                </div>
                <div className="flex justify-end gap-3 pt-6">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="flex-1 px-4 py-2.5 bg-white text-gray-500 font-bold rounded-xl hover:bg-gray-50 hover:text-gray-900 transition-all border border-gray-200 text-xs tracking-widest"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2.5 bg-gray-900 text-white font-bold rounded-xl hover:bg-gray-800 transition-all shadow-md shadow-gray-200 text-xs tracking-widest"
                  >
                    {editingCycle ? 'Update Cycle' : 'Create Cycle'}
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
