import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Calendar, SquarePen, CheckCircle, Trash2, X, Clock, AlertCircle } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { reviewCycleSchema, ReviewCycleSchema } from '@/schemas/performanceSchema';
import { fetchReviewCycles, createReviewCycle, updateReviewCycle, deleteReviewCycle } from '@/api/performanceApi';
import { ReviewCycle, ReviewCyclesApiResponse } from '@/types/performance';
import { useToastStore } from '@/stores';
import { AxiosError } from 'axios';

interface ApiErrorResponse {
  message?: string;
}

const ReviewCyclesContent: React.FC = () => {
  const [cycles, setCycles] = useState<ReviewCycle[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingCycle, setEditingCycle] = useState<ReviewCycle | null>(null); 
  
  const showToast = useToastStore((state) => state.showToast);
  const showNotification = (message: string, type: 'success' | 'error') => showToast(message, type);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ReviewCycleSchema>({
    resolver: zodResolver(reviewCycleSchema),
    defaultValues: {
      title: '',
      description: '',
      startDate: '',
      endDate: '',
    },
  });

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

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingCycle(null);
    reset({ title: '', description: '', startDate: '', endDate: '' });
  };

  const handleNewCycle = () => {
    setEditingCycle(null);
    reset({ title: '', description: '', startDate: '', endDate: '' });
    setIsModalOpen(true);
  };

  const handleEditCycle = (cycle: ReviewCycle) => {
    setEditingCycle(cycle);
    reset({
      title: cycle.title || '',
      description: cycle.description || '',
      startDate: cycle.startDate ? cycle.startDate.split('T')[0] : '',
      endDate: cycle.endDate ? cycle.endDate.split('T')[0] : ''
    });
    setIsModalOpen(true);
  };

  const onFormSubmit = async (data: ReviewCycleSchema) => {
    try {
      if (editingCycle) {
        await updateReviewCycle(editingCycle.id, data);
      } else {
        await createReviewCycle(data);
      }
      closeModal();
      loadCycles();
    } catch (err) {
      const axiosErr = err as AxiosError<ApiErrorResponse>;
      console.error("Failed to save cycle", err);
      showNotification(axiosErr.response?.data?.message || "Failed to save cycle", "error");
    }
  };

  const handleDeleteCycle = async (cycleId: string | number) => {
    if (!window.confirm("Are you sure you want to delete this review cycle?")) {
      return;
    }
    try {
      await deleteReviewCycle(cycleId);
      loadCycles();
    } catch (err) {
      const axiosErr = err as AxiosError<ApiErrorResponse>;
      console.error("Failed to delete cycle", err);
      showNotification(axiosErr.response?.data?.message || "Failed to delete cycle", "error");
    }
  };

  const getStatus = (start: string, end: string) => {
    const now = new Date();
    const startDate = new Date(start);
    const endDate = new Date(end);

    if (now < startDate) return { label: 'Upcoming', color: 'bg-blue-50 text-blue-700 border-blue-100', icon: Clock };
    if (now > endDate) return { label: 'Completed', color: 'bg-green-50 text-green-700 border-green-100', icon: CheckCircle };
    return { label: 'Active', color: 'bg-emerald-50 text-emerald-700 border-emerald-100', icon: AlertCircle };
  };

  return (
    <div className="flex flex-col gap-8">
      {/* Header Actions */}
      <div className="flex justify-between items-end">
        <div>
            <h3 className="text-2xl font-bold text-gray-900 tracking-tight">Cycle Management</h3>
            <p className="text-sm text-gray-500 mt-1">Create and manage evaluation periods for your organization</p>
        </div>
        <button
          onClick={handleNewCycle}
          className="group flex items-center gap-2 px-5 py-2.5 bg-gray-900 text-white rounded-xl hover:bg-black transition-all duration-200 font-medium shadow-sm hover:shadow-md active:scale-95"
        >
          <Plus size={18} className="group-hover:rotate-90 transition-transform duration-300" />
          <span>New Cycle</span>
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-gray-900 border-t-transparent"></div>
        </div>
      ) : cycles.length === 0 ? (
        <div className="text-center py-20 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
          <div className="bg-white p-4 rounded-full shadow-sm inline-block mb-4">
             <Calendar className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">No Review Cycles Found</h3>
          <p className="text-gray-500 mt-2 max-w-sm mx-auto">Get started by creating a new performance review cycle for your employees.</p>
          <button 
            onClick={handleNewCycle}
            className="mt-6 text-sm font-medium text-gray-900 hover:underline underline-offset-4"
          >
            Create your first cycle
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
                className="group relative bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden"
              >
                <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-gray-200 via-gray-300 to-gray-100 group-hover:from-gray-800 group-hover:to-gray-600 transition-colors duration-500"></div>
                
                <div className="p-6 pl-8">
                  <div className="flex justify-between items-start mb-5">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${status.color}`}>
                        <StatusIcon size={12} />
                        {status.label}
                    </span>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <button 
                        onClick={() => handleEditCycle(cycle)}
                        className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <SquarePen size={16} />
                      </button>
                      <button 
                        onClick={() => handleDeleteCycle(cycle.id)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  <h3 className="text-xl font-bold text-gray-900 mb-2 leading-tight">{cycle.title}</h3>
                  <p className="text-gray-500 text-sm mb-6 h-10 line-clamp-2 leading-relaxed">{cycle.description || 'No description provided.'}</p>

                  <div className="space-y-3 pt-5 border-t border-gray-100">
                    <div className="flex items-center justify-between text-sm group/date">
                      <span className="text-gray-500 flex items-center gap-2 group-hover/date:text-gray-700 transition-colors">
                          <Calendar size={15} className="text-gray-400 group-hover/date:text-gray-600" /> Start Date
                      </span>
                      <span className="font-semibold text-gray-900">{new Date(cycle.startDate).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm group/date">
                      <span className="text-gray-500 flex items-center gap-2 group-hover/date:text-gray-700 transition-colors">
                          <CheckCircle size={15} className="text-gray-400 group-hover/date:text-gray-600" /> End Date
                      </span>
                      <span className="font-semibold text-gray-900">{new Date(cycle.endDate).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-gray-100"
            >
              <div className="px-8 py-6 flex justify-between items-center bg-white border-b border-gray-100">
                <div>
                    <h2 className="text-xl font-bold text-gray-900">
                    {editingCycle ? 'Edit Cycle' : 'Create New Cycle'}
                    </h2>
                    <p className="text-sm text-gray-500 mt-0.5">Define the period for performance evaluations</p>
                </div>
                <button 
                    onClick={closeModal} 
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-gray-600"
                >
                  <X size={20} />
                </button>
              </div>
              
              <form onSubmit={handleSubmit(onFormSubmit)} className="p-8 space-y-6">
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Cycle Title</label>
                        <input
                        type="text"
                        {...register('title')}
                        className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none transition-all placeholder:text-gray-400"
                        placeholder={`e.g. Annual Review ${new Date().getFullYear()}`}
                        />
                        {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title.message}</p>}
                    </div>
                    
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
                        <textarea
                        rows={3}
                        {...register('description')}
                        className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none resize-none transition-all placeholder:text-gray-400"
                        placeholder="Briefly describe the purpose of this review cycle..."
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-5">
                        <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Start Date</label>
                        <input
                            type="date"
                            {...register('startDate')}
                            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none transition-all text-gray-600"
                        />
                        {errors.startDate && <p className="text-red-500 text-xs mt-1">{errors.startDate.message}</p>}
                        </div>
                        <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">End Date</label>
                        <input
                            type="date"
                            {...register('endDate')}
                            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none transition-all text-gray-600"
                        />
                        {errors.endDate && <p className="text-red-500 text-xs mt-1">{errors.endDate.message}</p>}
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-3 pt-6 border-t border-gray-100 mt-2">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-5 py-2.5 bg-white text-gray-700 font-medium rounded-xl hover:bg-gray-50 border border-gray-200 text-sm transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-gray-900 text-white font-semibold rounded-xl hover:bg-black shadow-lg hover:shadow-xl transform active:scale-95 text-sm transition-all duration-200"
                  >
                    {editingCycle ? 'Save Changes' : 'Create Cycle'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ReviewCyclesContent;
