import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Calendar, Edit2, CheckCircle, Clock, AlertCircle, Trash2, X } from 'lucide-react';
import { fetchReviewCycles, createReviewCycle, updateReviewCycle, deleteReviewCycle } from '../../api/performanceApi';

const ReviewCycles = () => {
  const [cycles, setCycles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCycle, setEditingCycle] = useState(null); // Track which cycle is being edited
  const [formData, setFormData] = useState({title: '', description: '', start_date: '', end_date: ''});

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
    setFormData({ title: '', description: '', start_date: '', end_date: '' });
  };

  // Open modal for creating new cycle
  const handleNewCycle = () => {
    setEditingCycle(null);
    setFormData({ title: '', description: '', start_date: '', end_date: '' });
    setIsModalOpen(true);
  };

  // Open modal for editing existing cycle
  const handleEditCycle = (cycle) => {
    setEditingCycle(cycle);
    setFormData({
      title: cycle.title || '',
      description: cycle.description || '',
      start_date: cycle.start_date ? cycle.start_date.split('T')[0] : '',
      end_date: cycle.end_date ? cycle.end_date.split('T')[0] : ''
    });
    setIsModalOpen(true);
  };

  // Handle form submit (create or update)
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingCycle) {
        // Update existing cycle
        await updateReviewCycle(editingCycle.id, formData);
        alert("Cycle updated successfully!");
      } else {
        // Create new cycle
        await createReviewCycle(formData);
        alert("Cycle created successfully!");
      }
      closeModal();
      loadCycles();
    } catch (err) {
      console.error("Failed to save cycle", err);
      alert(err.response?.data?.message || "Failed to save cycle");
    }
  };

  // Handle delete cycle
  const handleDeleteCycle = async (cycleId) => {
    if (!window.confirm("Are you sure you want to delete this review cycle? This action cannot be undone.")) {
      return;
    }
    try {
      await deleteReviewCycle(cycleId);
      alert("Cycle deleted successfully!");
      loadCycles();
    } catch (err) {
      console.error("Failed to delete cycle", err);
      alert(err.response?.data?.message || "Failed to delete cycle");
    }
  };

  const getStatus = (start, end) => {
    const now = new Date();
    const startDate = new Date(start);
    const endDate = new Date(end);

    if (now < startDate) return { label: 'Upcoming', color: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: Clock };
    if (now > endDate) return { label: 'Completed', color: 'bg-gray-100 text-gray-600 border-gray-200', icon: CheckCircle };
    return { label: 'Active', color: 'bg-green-100 text-green-800 border-green-200', icon: AlertCircle };
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-neutral-100 to-stone-50 rounded-xl shadow-xl p-7 w-full overflow-hidden text-gray-800">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Review Cycles</h1>
          <p className="text-sm text-gray-800 mt-1">Manage performance evaluation periods</p>
        </div>
        <button
          onClick={handleNewCycle}
          className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-800 border border-gray-200 rounded-lg shadow-md hover:bg-gray-300 transition-all font-medium"
        >
          <Plus size={18} />
          <span>New Cycle</span>
        </button>
      </div>

      <hr className="mb-6 border-[1px] border-[#274b46]" />

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
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg shadow-md hover:bg-gray-300"
          >
            <Plus size={18} />
            Create First Cycle
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cycles.map((cycle) => {
            const status = getStatus(cycle.start_date, cycle.end_date);
            const StatusIcon = status.icon;
            
            return (
              <motion.div
                key={cycle.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-xl transition-shadow"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide flex items-center gap-1 border ${status.color}`}>
                    <StatusIcon size={12} />
                    {status.label}
                  </div>
                  <div className="flex gap-1">
                    <button 
                      onClick={() => handleEditCycle(cycle)}
                      className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Edit Cycle"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button 
                      onClick={() => handleDeleteCycle(cycle.id)}
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete Cycle"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                <h3 className="text-lg font-bold text-gray-800 mb-2">{cycle.title}</h3>
                <p className="text-gray-500 text-sm mb-6 line-clamp-2 min-h-[2.5rem]">{cycle.description || 'No description'}</p>

                <div className="space-y-3 pt-4 border-t border-gray-50">
                  <div className="flex items-center gap-3 text-sm text-gray-600">
                    <Calendar size={16} className="text-blue-900/50" />
                    <div className="flex flex-col">
                      <span className="text-xs text-gray-400 uppercase font-bold">Start Date</span>
                      <span className="font-medium">{new Date(cycle.start_date).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-gray-600">
                    <Calendar size={16} className="text-blue-900/50" />
                    <div className="flex flex-col">
                      <span className="text-xs text-gray-400 uppercase font-bold">End Date</span>
                      <span className="font-medium">{new Date(cycle.end_date).toLocaleDateString()}</span>
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
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden"
            >
              <div className="bg-gray-200 shadow-md px-6 py-3 flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-800">
                  {editingCycle ? 'Edit Review Cycle' : 'Create Review Cycle'}
                </h2>
                <button onClick={closeModal} className="p-1 hover:text-red-800 rounded-lg transition-colors text-gray-500">
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div className="bg-gray-50 border border-gray-200 rounded-lg shadow-md p-4 space-y-3">
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
                      rows="3"
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
                        value={formData.start_date}
                        onChange={(e) => setFormData({...formData, start_date: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-200 focus:border-transparent outline-none transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">End Date *</label>
                      <input
                        type="date"
                        required
                        value={formData.end_date}
                        onChange={(e) => setFormData({...formData, end_date: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-200 focus:border-transparent outline-none transition-all"
                      />
                    </div>
                  </div>
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 mt-4">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="flex-1 px-3 py-1.5 bg-[#F8F9FA] text-gray-700 font-medium rounded-lg shadow-md hover:bg-gray-100 hover:text-red-800 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-3 py-1.5 bg-[#F8F9FA] text-gray-700 font-medium rounded-lg shadow-md border-2 border-transparent hover:text-green-800 transition-all"
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

export default ReviewCycles;
