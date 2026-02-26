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
                'Strategic Priorities': 'border-blue-500',
                'Core Functions': 'border-green-500',
                'Support Functions': 'border-amber-500',
                'General': 'border-purple-500'
              };
              const borderColor = borderColors[item.category] || 'border-gray-300';
              
              return (
                <div
                  key={item.id}
                  className={`bg-white p-6 rounded-xl border border-gray-200 hover:border-gray-300 transition-all group border-l-4 ${borderColor} animate-in fade-in zoom-in duration-300`}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex flex-col gap-1">
                        <span className="px-3 py-1 w-fit bg-gray-50 text-gray-700 rounded-full text-xs font-bold uppercase tracking-wide border border-gray-100">
                        {item.category}
                        </span>
                        {item.section && (
                            <span className="text-[10px] items-start text-gray-400 font-semibold uppercase tracking-wider ml-1">
                                {item.section}
                            </span>
                        )}
                    </div>
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => handleEdit(item)} className="text-gray-400 hover:text-blue-600 p-1">
                        <SquarePen size={16} />
                      </button>
                      <button onClick={() => handleDeleteClick(item)} className="text-gray-400 hover:text-red-600 p-1">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  <h3 className="text-lg font-bold text-gray-800 mb-2">{item.title}</h3>
                  <p className="text-gray-500 text-sm mb-4 line-clamp-2 min-h-[2.5em]">{item.description}</p>

                  <div className="flex items-center justify-between pt-4 border-t border-gray-50 text-sm">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Sliders size={16} className="text-gray-400" />
                      <span>Weight: <span className="font-bold text-gray-800">{item.weight}%</span></span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <CheckCircle size={16} className="text-gray-400" />
                      <span>Max Score: <span className="font-bold text-gray-800">{item.maxScore}</span></span>
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
