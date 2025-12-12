import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Edit2, Trash2, Sliders, CheckCircle } from 'lucide-react';
import { fetchCriteria, addCriteria, updateCriteria, deleteCriteria } from '../../api/performanceApi';
import { UI_COLORS, SLATE_BLUE, STATUS_GREEN, STATUS_RED } from '../../utils/colorPalette';

const PerformanceCriteria = () => {
  const [criteriaList, setCriteriaList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCriteria, setEditingCriteria] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'Core Functions',
    weight: 1.0,
    max_score: 5
  });

  const loadCriteria = async () => {
    try {
      setLoading(true);
      const data = await fetchCriteria();
      if (data.success) {
        setCriteriaList(data.criteria);
      }
    } catch (err) {
      console.error("Failed to load criteria", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCriteria();
  }, []);

  const handleAdd = () => {
    setEditingCriteria(null);
    setFormData({ title: '', description: '', category: 'Core Functions', weight: 1.0, max_score: 5 });
    setIsModalOpen(true);
  };

  const handleEdit = (item) => {
    setEditingCriteria(item);
    setFormData({
      title: item.title,
      description: item.description,
      category: item.category,
      weight: item.weight,
      max_score: item.max_score
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Delete this criteria?")) {
      try {
        await deleteCriteria(id);
        loadCriteria();
      } catch (err) {
        console.error("Failed to delete criteria", err);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingCriteria) {
        await updateCriteria(editingCriteria.id, formData);
      } else {
        await addCriteria(formData);
      }
      setIsModalOpen(false);
      loadCriteria();
    } catch (err) {
      console.error("Failed to save criteria", err);
    }
  };

  const filteredCriteria = criteriaList.filter(item => 
    item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-neutral-100 to-stone-50 rounded-xl shadow-xl p-7 w-full overflow-hidden text-gray-800">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Evaluation Criteria</h1>
          <p className="text-sm text-gray-800 mt-1">(SPMS Standards)</p>
        </div>
        <button
          onClick={handleAdd}
          className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-800 border border-gray-200 rounded-lg shadow-md hover:bg-gray-300 transition-all font-medium"
        >
          <Plus size={18} />
          <span>Add Criteria</span>
        </button>
      </div>

      <hr className="mb-6 border-[1px] border-[#274b46]" />

      <div className="bg-[#F8F9FA] p-4 rounded-lg shadow-md mb-6">
        <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-lg border border-gray-200 shadow-sm focus-within:ring-2 focus-within:ring-gray-200 focus-within:border-gray-200 transition-all">
          <Search className="text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search criteria..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 bg-transparent outline-none text-sm text-gray-700 placeholder-gray-400"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-800"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCriteria.map((item) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-xl transition-shadow group"
            >
              <div className="flex justify-between items-start mb-3">
                <span className="px-3 py-1 bg-gray-50 text-gray-700 rounded-full text-xs font-bold uppercase tracking-wide border border-gray-100">
                  {item.category}
                </span>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => handleEdit(item)} className="text-gray-400 hover:text-blue-600 p-1">
                    <Edit2 size={16} />
                  </button>
                  <button onClick={() => handleDelete(item.id)} className="text-gray-400 hover:text-red-600 p-1">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <h3 className="text-lg font-bold text-gray-800 mb-2">{item.title}</h3>
              <p className="text-gray-500 text-sm mb-4 line-clamp-2">{item.description}</p>

              <div className="flex items-center justify-between pt-4 border-t border-gray-50 text-sm">
                <div className="flex items-center gap-2 text-gray-600">
                  <Sliders size={16} className="text-gray-400" />
                  <span>Weight: <span className="font-bold text-gray-800">{item.weight}</span></span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <CheckCircle size={16} className="text-gray-400" />
                  <span>Max Score: <span className="font-bold text-gray-800">{item.max_score}</span></span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Modal */}
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
                  {editingCriteria ? 'Edit Criteria' : 'Add Criteria'}
                </h2>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div className="bg-gray-50 border border-gray-200 rounded-lg shadow-md p-4 space-y-3">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Title (MFO / PAP)</label>
                    <input
                      type="text"
                      required
                      value={formData.title}
                      onChange={(e) => setFormData({...formData, title: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-200 focus:border-transparent outline-none transition-all"
                      placeholder="e.g. Strategic Planning"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Category</label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({...formData, category: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-200 focus:border-transparent outline-none bg-white transition-all"
                    >
                      <option value="Strategic Priorities">Strategic Priorities</option>
                      <option value="Core Functions">Core Functions</option>
                      <option value="Support Functions">Support Functions</option>
                      <option value="General">General</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Success Indicators</label>
                    <textarea
                      rows="3"
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-200 focus:border-transparent outline-none resize-none transition-all"
                      placeholder="e.g. 100% of plans submitted on time..."
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Weight (%)</label>
                      <input
                        type="number"
                        step="1"
                        min="1"
                        max="100"
                        value={formData.weight}
                        onChange={(e) => setFormData({...formData, weight: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-200 focus:border-transparent outline-none transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Max Score</label>
                      <input
                        type="number"
                        min="1"
                        max="5"
                        value={formData.max_score}
                        onChange={(e) => setFormData({...formData, max_score: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-200 focus:border-transparent outline-none transition-all"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 px-3 py-1.5 bg-[#F8F9FA] text-gray-700 font-medium rounded-lg shadow-md hover:bg-gray-100 hover:text-red-800 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-3 py-1.5 bg-[#F8F9FA] text-gray-700 font-medium rounded-lg shadow-md border-2 border-transparent hover:text-green-800 transition-all"
                  >
                    Save Criteria
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

export default PerformanceCriteria;
