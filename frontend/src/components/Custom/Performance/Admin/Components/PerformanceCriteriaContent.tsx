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
    (item.title || item.criteriaTitle || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
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
              'Strategic Priorities': 'border-l-slate-800',
              'Core Functions': 'border-l-slate-600',
              'Support Functions': 'border-l-slate-400',
              'General': 'border-l-slate-200'
            };
            const borderColor = (item.category && borderColors[item.category]) ? borderColors[item.category] : 'border-l-gray-300';

            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`bg-white p-6 rounded-2xl border border-gray-100 hover:border-gray-200 hover:shadow-lg transition-all group border-l-4 ${borderColor} flex flex-col h-full shadow-sm`}
              >
                <div className="flex justify-between items-start mb-4">
                  <span className="px-3 py-1 bg-gray-50 text-gray-500 rounded-lg text-[9px] font-black uppercase tracking-widest border border-gray-100">
                    {String(item.category || '')}
                  </span>
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                    <button onClick={() => handleEdit(item)} className="p-2 text-gray-400 hover:text-gray-900 bg-gray-50 rounded-xl transition-all border border-gray-100 hover:shadow-sm">
                      <SquarePen size={14} />
                    </button>
                    <button onClick={() => handleDeleteClick(item)} className="p-2 text-gray-400 hover:text-red-600 bg-gray-50 rounded-xl transition-all border border-gray-100 hover:shadow-sm">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                <h3 className="text-base font-bold text-gray-900 mb-2 tracking-tight group-hover:text-blue-900 transition-colors leading-tight">{item.title || item.criteriaTitle}</h3>
                <p className="text-gray-500 text-xs mb-6 line-clamp-3 leading-relaxed min-h-[3em] flex-1">{item.description || item.criteriaDescription}</p>

                <div className="flex items-center justify-between pt-5 border-t border-gray-50 text-xs mt-auto">
                  <div className="flex items-center gap-2.5 text-gray-500 font-medium">
                    <div className="p-2 bg-gray-50 rounded-xl border border-gray-100 group-hover:bg-blue-50 group-hover:border-blue-100 transition-colors">
                      <Sliders size={14} className="text-gray-400 group-hover:text-blue-600 transition-colors" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter leading-none mb-1">Weight</span>
                      <span className="font-black text-gray-900 text-sm leading-none">{item.weight}%</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5 text-gray-500 font-medium text-right items-end justify-end">
                    <div className="p-2 bg-gray-50 rounded-xl border border-gray-100 group-hover:bg-purple-50 group-hover:border-purple-100 transition-colors">
                      <CheckCircle size={14} className="text-gray-400 group-hover:text-purple-600 transition-colors" />
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter leading-none mb-1">Max Score</span>
                      <span className="font-black text-gray-900 text-sm leading-none">{String(item.maxScore || '0')}</span>
                    </div>
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
        itemName={String(selectedCriteria?.title || selectedCriteria?.criteriaTitle || '')}
      />
    </div>
  );
};

export default PerformanceCriteriaContent;
