import React, { useState } from 'react';
import { MessageSquare, Zap, Target, PlusCircle, BookOpen, ClipboardList, SquarePen, Trash2, Plus } from 'lucide-react';
import DeleteConfirmationModal from '../Admin/Modals/DeleteConfirmationModal';
import EditAssessmentModal from '../Admin/Modals/EditAssessmentModal';
import { motion } from 'framer-motion';

const ICON_MAP: Record<string, React.ReactNode> = {
  'Zap': <Zap size={16} />,
  'Target': <Target size={16} />,
  'PlusCircle': <PlusCircle size={16} />,
  'BookOpen': <BookOpen size={16} />,
  'ClipboardList': <ClipboardList size={16} />,
  'MessageSquare': <MessageSquare size={16} />
};

import { Assessment } from '@/types/performance';

interface QualitativeAssessmentProps {
  assessments?: Assessment[];
  canEdit?: boolean;
  onAdd?: (data: Partial<Assessment>) => void;
  onEdit?: (data: Assessment) => void;
  onDelete?: (id: string | number) => void;
  onChangeValue?: (id: string | number, value: string) => void;
  className?: string;
  gridClassName?: string;
}

const QualitativeAssessment: React.FC<QualitativeAssessmentProps> = ({
  assessments = [], 
  canEdit,
  onAdd,
  onEdit,
  onDelete,
  onChangeValue,
  className = "lg:col-span-3",
  gridClassName = "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
}) => {
  const [showEditModal, setShowEditModal] = useState<boolean>(false);
  const [editingAssessment, setEditingAssessment] = useState<Assessment | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [deletingAssessment, setDeletingAssessment] = useState<Assessment | null>(null);

  const handleOpenAdd = () => { setEditingAssessment(null); setShowEditModal(true); };
  const handleOpenEdit = (assessment: Assessment) => {
    setEditingAssessment({ ...assessment, title: assessment.title, description: assessment.description });
    setShowEditModal(true);
  };

  const handleSaveModal = (formData: { title: string; description: string }) => {
     const savedData: Partial<Assessment> = {
         title: formData.title,
         description: formData.description,
         // Default to generic gray badge
         badge: editingAssessment?.badge || 'ASSESSMENT',
         badgeColor: editingAssessment?.badgeColor || 'bg-gray-100 text-gray-600',
         iconName: editingAssessment?.iconName || 'MessageSquare'
     };

     if (editingAssessment?.id) { 
        if (onEdit) onEdit({ ...editingAssessment, ...savedData } as Assessment); 
     } else { 
        if (onAdd) onAdd(savedData); 
     }
     
     setShowEditModal(false);
     setEditingAssessment(null);
  };

  const handleDeleteClick = (item: Assessment) => { setDeletingAssessment(item); setShowDeleteModal(true); };
  const handleDeleteConfirm = () => {
    if (onDelete && deletingAssessment) onDelete(deletingAssessment.id);
    setShowDeleteModal(false);
    setDeletingAssessment(null);
  };

  return (
    <div className={`${className} space-y-4 max-w-5xl mx-auto pt-4 border-t border-dashed border-gray-200`}>
      <div className="flex items-center gap-2 mb-1">
        <div className="p-1.5 bg-gray-100 rounded text-gray-600">
           <MessageSquare size={16} />
        </div>
        <div>
            <h3 className="font-bold text-gray-900 text-sm">
            Qualitative Assessment
            </h3>
            <p className="text-xs font-medium text-gray-500">Feedback & Development</p>
        </div>
      </div>

      <div className={`grid ${gridClassName} gap-4`}>
        {assessments.map((assessment) => (
          <motion.div 
            initial={{ opacity: 0, scale: 0.98 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            key={assessment.id}
            className="group relative bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col overflow-hidden"
          >
            {/* Minimal Header */}
            <div className="px-4 py-3 flex justify-between items-start border-b border-gray-50 bg-white">
               <div className="flex items-center gap-2">
                  <div className={`p-1.5 rounded bg-gray-50 border border-gray-100 text-gray-400 group-hover:text-gray-900 transition-all`}>
                      {ICON_MAP[assessment.iconName || 'MessageSquare'] || ICON_MAP['MessageSquare']}
                  </div>
                  <div>
                     <span className="block text-xs font-medium text-gray-500 mb-px">{assessment.badge || 'Field'}</span>
                     <h4 className="font-bold text-gray-800 text-sm leading-tight">{assessment.title}</h4>
                  </div>
               </div>
               
               {canEdit && (
                 <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => handleOpenEdit(assessment)} className="p-1 text-gray-400 hover:text-gray-900 rounded hover:bg-gray-100 transition-colors">
                      <SquarePen size={12} />
                    </button>
                    <button onClick={() => handleDeleteClick(assessment)} className="p-1 text-gray-400 hover:text-red-700 rounded hover:bg-red-50 transition-colors">
                      <Trash2 size={12} />
                    </button>
                 </div>
               )}
            </div>

            <div className="p-4 pt-3 flex-1 flex flex-col gap-2 bg-white">
              <p className="text-[10px] text-gray-500 font-medium leading-relaxed italic border-l-2 border-gray-100 pl-2">
                 "{assessment.description || 'Provide feedback...'}"
              </p>

              <textarea
                  value={assessment.value || ''}
                  onChange={(e) => onChangeValue && onChangeValue(assessment.id, e.target.value)}
                  readOnly={!canEdit}
                  placeholder="Enter feedback..."
                  className={`w-full p-3 text-xs bg-gray-50/30 hover:bg-gray-50 focus:bg-white border border-gray-100 hover:border-gray-200 focus:border-gray-300 rounded-lg focus:ring-1 focus:ring-gray-200 outline-none flex-1 min-h-[100px] resize-none transition-all placeholder:text-gray-300 text-gray-700 leading-relaxed ${!canEdit ? 'cursor-default bg-gray-50' : ''}`}
                />
            </div>
            
            <div className="h-0.5 w-full bg-gray-50 group-hover:bg-gray-200 transition-all"></div>
          </motion.div>
        ))}
        
        {canEdit && onAdd && (
          <button
            onClick={handleOpenAdd}
            className="group flex flex-col items-center justify-center p-4 border-2 border-dashed border-gray-200 hover:border-gray-400 bg-gray-50/20 hover:bg-gray-50 rounded-xl min-h-[180px] transition-all gap-2 text-gray-300 hover:text-gray-600"
          >
             <div className="p-2 bg-white rounded-full shadow-sm group-hover:scale-110 group-hover:shadow-md transition-all border border-gray-100 text-gray-300 group-hover:text-gray-900">
                <Plus size={20} />
             </div>
             <span className="font-medium text-sm text-gray-500">Add New Assessment</span>
          </button>
        )}
      </div>

      <EditAssessmentModal 
        isOpen={showEditModal} 
        onClose={() => setShowEditModal(false)}
        onSubmit={handleSaveModal}
        initialData={editingAssessment ? {title: editingAssessment.title || '', description: editingAssessment.description || ''} : null}
        title={editingAssessment ? "Edit Assessment" : "Add Assessment"}
      />
      
      <DeleteConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteConfirm}
        itemName={deletingAssessment?.title}
      />
    </div>
  );
};

export default QualitativeAssessment;
