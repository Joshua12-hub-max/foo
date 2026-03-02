import React from 'react';
import { useState, useEffect } from 'react';
import { Plus, Search, SquarePen, Trash2, Sliders, CheckCircle } from 'lucide-react';
import { fetchCriteria, addCriteria, updateCriteria, deleteCriteria } from '@api';
import PerformanceLayout from '@components/Custom/Performance/PerformanceLayout';
import EditCriteriaModal from '@components/Custom/Performance/Admin/Modals/EditCriteriaModal';
import DeleteConfirmationModal from '@components/Custom/Performance/Admin/Modals/DeleteConfirmationModal';
import { PerformanceCriteria as IPerformanceCriteria } from '@/types/performance';

const PerformanceCriteria = () => {
  const [criteriaList, setCriteriaList] = useState<IPerformanceCriteria[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal States
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedCriteria, setSelectedCriteria] = useState<IPerformanceCriteria | null>(null);

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
    setSelectedCriteria(null);
    setIsEditModalOpen(true);
  };

  const handleEdit = (item: IPerformanceCriteria) => {
    setSelectedCriteria(item);
    setIsEditModalOpen(true);
  };

  const handleDeleteClick = (item: IPerformanceCriteria) => {
    setSelectedCriteria(item);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (selectedCriteria) {
      try {
        await deleteCriteria(selectedCriteria.id);
        setIsDeleteModalOpen(false);
        loadCriteria();
      } catch (err) {
        console.error("Failed to delete criteria", err);
      }
    }
  };

  const handleSave = async (formData: Partial<IPerformanceCriteria>) => {
    try {
      if (selectedCriteria) {
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
    item.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <PerformanceLayout>
      <div className="flex flex-col gap-6">
        {/* Header with Add Button */}
        <div className="flex justify-end">
          <button
            onClick={handleAdd}
            className="bg-white hover:bg-gray-50 text-gray-900 border border-gray-300 px-5 py-2.5 rounded-lg flex items-center gap-2 shadow-sm transition-all active:scale-95 text-sm font-bold"
          >
            <Plus size={18} />
            <span>Add Criteria</span>
          </button>
        </div>

        {/* Search */}
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center gap-3 bg-[#F8F9FA] px-4 py-2 rounded-lg border border-gray-200 focus-within:ring-2 focus-within:ring-gray-200 transition-all">
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
            {filteredCriteria.map((item) => {
              const borderColors: Record<string, string> = {
                'Strategic Priorities': 'border-l-slate-800',
                'Core Functions': 'border-l-slate-600',
                'Support Functions': 'border-l-slate-400',
                'General': 'border-l-slate-200'
              };
              const borderColor = borderColors[item.category] || 'border-gray-300';
              
              return (
                <div
                  key={item.id}
                  className={`bg-white p-6 rounded-2xl border border-gray-100 hover:border-gray-200 hover:shadow-lg transition-all group border-l-4 ${borderColor} animate-in fade-in zoom-in duration-300 shadow-sm flex flex-col h-full`}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex flex-col gap-1.5">
                        <span className="px-3 py-1 w-fit bg-gray-50 text-gray-500 rounded-lg text-[9px] font-black uppercase tracking-widest border border-gray-100">
                        {item.category}
                        </span>
                        {item.section && (
                            <span className="text-[9px] items-start text-gray-400 font-bold uppercase tracking-widest ml-1">
                                {item.section}
                            </span>
                        )}
                    </div>
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                      <button onClick={() => handleEdit(item)} className="text-gray-400 hover:text-gray-900 p-2 bg-gray-50 rounded-xl transition-all border border-gray-100 hover:shadow-sm">
                        <SquarePen size={14} />
                      </button>
                      <button onClick={() => handleDeleteClick(item)} className="text-gray-400 hover:text-red-600 p-2 bg-gray-50 rounded-xl transition-all border border-gray-100 hover:shadow-sm">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  <h3 className="text-base font-bold text-gray-900 mb-2 tracking-tight group-hover:text-blue-900 transition-colors">{item.title}</h3>
                  <p className="text-gray-500 text-xs mb-6 line-clamp-2 min-h-[2.5em] leading-relaxed flex-1">{item.description}</p>

                  <div className="flex items-center justify-between pt-5 border-t border-gray-50 mt-auto">
                    <div className="flex items-center gap-2.5 text-gray-500">
                      <div className="p-2 bg-gray-50 rounded-xl border border-gray-100 group-hover:bg-blue-50 group-hover:border-blue-100 transition-colors">
                        <Sliders size={14} className="text-gray-400 group-hover:text-blue-600 transition-colors" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Weight</span>
                        <span className="font-black text-gray-900 text-sm">{item.weight}%</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2.5 text-gray-500">
                      <div className="p-2 bg-gray-50 rounded-xl border border-gray-100 group-hover:bg-purple-50 group-hover:border-purple-100 transition-colors">
                        <CheckCircle size={14} className="text-gray-400 group-hover:text-purple-600 transition-colors" />
                      </div>
                      <div className="flex flex-col items-end text-right">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Max Score</span>
                        <span className="font-black text-gray-900 text-sm">{item.maxScore}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Edit/Add Modal */}
      <EditCriteriaModal 
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSubmit={handleSave}
        initialData={selectedCriteria as unknown as import('@components/Custom/Performance/types').PerformanceItem | null}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
        itemName={selectedCriteria?.title}
      />
    </PerformanceLayout>
  );
};

export default PerformanceCriteria;
