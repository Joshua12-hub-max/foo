import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Search, SquarePen, Trash2, Sliders, CheckCircle, ListChecks } from 'lucide-react';
import { fetchCriteria, addCriteria, updateCriteria, deleteCriteria } from '@/api/performanceApi';
import EditCriteriaModal from '../Modals/EditCriteriaModal';
import DeleteConfirmationModal from '../Modals/DeleteConfirmationModal';
import { PerformanceItem } from '../../types';
import { PerformanceCriteriaSchema } from '@/schemas/performanceSchema';

interface CriteriaResponse {
  success: boolean;
  criteria: PerformanceItem[];
}

const PerformanceCriteriaContent: React.FC = () => {
  const [criteriaList, setCriteriaList] = useState<PerformanceItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  
  // Modal States
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
  const [selectedCriteria, setSelectedCriteria] = useState<PerformanceItem | null>(null);

  const loadCriteria = async () => {
    try {
      setLoading(true);
      const data = (await fetchCriteria()) as unknown as CriteriaResponse;
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
    setSelectedCriteria(null);
    setIsEditModalOpen(true);
  };

  const handleEdit = (item: PerformanceItem) => {
    setSelectedCriteria(item);
    setIsEditModalOpen(true);
  };

  const handleDeleteClick = (item: PerformanceItem) => {
    setSelectedCriteria(item);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (selectedCriteria && selectedCriteria.id) {
      try {
        await deleteCriteria(selectedCriteria.id);
        setIsDeleteModalOpen(false);
        loadCriteria();
      } catch (err) {
        console.error("Failed to delete criteria", err);
      }
    }
  };

  const handleSave = async (formData: PerformanceCriteriaSchema) => {
    try {
      if (selectedCriteria && selectedCriteria.id) {
        await updateCriteria(selectedCriteria.id, formData);
      } else {
        await addCriteria(formData);
      }
      setIsEditModalOpen(false);
      loadCriteria();
    } catch (err) {
      console.error("Failed to save criteria", err);
    }
  };

  const filteredCriteria = criteriaList.filter(item => 
    (item.title || item.criteria_title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.category || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-6">
      {/* Header Actions */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-[#F8F9FA] p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="p-2 bg-white rounded-lg shadow-sm border border-gray-200 text-gray-500">
                <ListChecks size={20} />
            </div>
            <div>
                <h3 className="text-lg font-bold text-gray-800">Performance Criteria</h3>
                <p className="text-xs text-gray-500">Manage MFOs and success indicators</p>
            </div>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input
                type="text"
                placeholder="Search criteria..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-gray-200 shadow-sm transition-all"
                />
            </div>
            <button
                onClick={handleAdd}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-all font-bold shadow-md text-sm whitespace-nowrap"
            >
                <Plus size={16} />
                <span>Add Criteria</span>
            </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-800"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCriteria.map((item) => {
            const borderColors: Record<string, string> = {
              'Strategic Priorities': 'border-l-blue-500',
              'Core Functions': 'border-l-green-500',
              'Support Functions': 'border-l-amber-500',
              'General': 'border-l-purple-500'
            };
            const borderColor = (item.category && borderColors[item.category]) ? borderColors[item.category] : 'border-l-gray-300';

            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`bg-white p-6 rounded-xl border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all group border-l-4 ${borderColor}`}
              >
                <div className="flex justify-between items-start mb-3">
                  <span className="px-2.5 py-1 bg-gray-50 text-gray-600 rounded-full text-[10px] font-bold uppercase tracking-wider border border-gray-100">
                    {item.category}
                  </span>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => handleEdit(item)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                      <SquarePen size={16} />
                    </button>
                    <button onClick={() => handleDeleteClick(item)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                <h3 className="text-lg font-bold text-gray-800 mb-2 leading-tight">{item.title || item.criteria_title}</h3>
                <p className="text-gray-500 text-xs mb-4 line-clamp-3 leading-relaxed min-h-[3em]">{item.description || item.criteria_description}</p>

                <div className="flex items-center justify-between pt-4 border-t border-gray-50 text-xs">
                  <div className="flex items-center gap-1.5 text-gray-500">
                    <Sliders size={14} className="text-gray-400" />
                    <span>Weight: <span className="font-bold text-gray-700">{item.weight}%</span></span>
                  </div>
                  <div className="flex items-center gap-1.5 text-gray-500">
                    <CheckCircle size={14} className="text-gray-400" />
                    <span>Max: <span className="font-bold text-gray-700">{item.maxScore}</span></span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Edit/Add Modal */}
      <EditCriteriaModal 
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSubmit={handleSave}
        initialData={selectedCriteria}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
        itemName={selectedCriteria?.title || selectedCriteria?.criteria_title}
      />
    </div>
  );
};

export default PerformanceCriteriaContent;
