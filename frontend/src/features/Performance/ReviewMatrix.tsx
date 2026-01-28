import React, { useState } from 'react';
import { MessageSquare, Plus, SquarePen, Trash2, TrendingUp, AlertCircle, Info, Star } from 'lucide-react';
import EditCriteriaModal from './Admin/Modals/EditCriteriaModal';
import DeleteConfirmationModal from './Admin/Modals/DeleteConfirmationModal';
import { motion, AnimatePresence } from 'framer-motion';
import { PerformanceItem } from './types';

// --- Sub-components for better organization ---

interface CustomSelectProps {
  value: number | string | undefined;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  label: string;
  disabled?: boolean;
}

const CustomSelect: React.FC<CustomSelectProps> = ({ value, onChange, label, disabled }) => (
  <div className="flex flex-col gap-1 flex-1 p-1 rounded border border-transparent hover:border-gray-200 transition-colors">
    <label className="text-[10px] font-medium text-gray-500 text-center">{label}</label>
    <div className="relative">
        <select
        value={value || 0}
        onChange={onChange}
        disabled={disabled}
        className={`w-full py-0.5 text-center font-bold text-xs bg-transparent border-b border-gray-200 focus:border-gray-800 outline-none transition-all cursor-pointer appearance-none ${disabled ? 'text-gray-300 cursor-not-allowed' : 'text-gray-900 hover:bg-gray-50'}`}
        style={{ textAlignLast: 'center' }}
        >
        <option value="0">-</option>
        {[5, 4, 3, 2, 1].map(num => (
            <option key={num} value={num}>{num}</option>
        ))}
        </select>
    </div>
  </div>
);

// Individual Item Component
interface ReviewItemProps {
  item: PerformanceItem;
  onScoreChange?: (id: string | number, score: number) => void;
  onCommentChange?: (id: string | number, comment: string) => void;
  onSelfScoreChange?: (id: string | number, score: number) => void;
  onAccomplishmentChange?: (id: string | number, text: string) => void;
  onQETChange?: (id: string | number, field: string, value: string | number) => void;
  readOnly?: boolean;
  showSelfRating?: boolean;
  isSelfRatingMode?: boolean;
}

const ReviewItem: React.FC<ReviewItemProps> = ({ item, onScoreChange, onCommentChange, onSelfScoreChange, onAccomplishmentChange, onQETChange, readOnly, showSelfRating, isSelfRatingMode }) => {
  const diff = Math.abs((item.self_score || 0) - (item.score || 0));
  const hasDiscrepancy = showSelfRating && diff >= 2 && (item.score || 0) > 0;
  const id = item.criteria_id || item.id || 0; // fallback ID

  return (
    <motion.div 
      layout
      className={`group relative bg-white rounded-lg border transition-all duration-300 overflow-hidden ${hasDiscrepancy ? 'border-gray-300 ring-1 ring-gray-100' : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'}`}
    >

      <div className="flex flex-col md:flex-row">
        
        {/* Left: Content & Inputs */}
        <div className="flex-1 p-4 pl-6 space-y-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-medium text-gray-500 border border-gray-200 px-1.5 py-0.5 rounded">
                 {Math.round(Number(item.weight || 0))}% Weight
              </span>
              {hasDiscrepancy && (
                <span className="flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">
                  <AlertCircle size={10} /> Discrepancy
                </span>
              )}
            </div>
            <h4 className="text-sm font-bold text-gray-900 leading-tight">{item.criteria_title || item.title}</h4>
            <p className="text-[11px] text-gray-500 mt-1 leading-relaxed line-clamp-2 hover:line-clamp-none transition-all">{item.criteria_description || item.description}</p>
          </div>

          <div className="pt-1">
             <label className="flex items-center gap-1.5 text-xs font-medium text-gray-500 mb-1">
                <MessageSquare size={10} />
                {isSelfRatingMode ? "Your Accomplishments" : "Remarks"}
             </label>
             
             {isSelfRatingMode ? (
                <textarea
                  value={item.actual_accomplishments || ''}
                  onChange={(e) => onAccomplishmentChange?.(id, e.target.value)}
                  placeholder="Describe your specific accomplishments..."
                  className="w-full p-2 bg-gray-50 hover:bg-gray-50/80 focus:bg-white border border-gray-100 hover:border-gray-200 focus:border-gray-300 rounded text-xs transition-all outline-none min-h-[60px] resize-none focus:ring-1 focus:ring-gray-100 placeholder:text-gray-300 text-gray-700"
                />
             ) : !readOnly ? (
                <textarea
                  value={item.comment || ''}
                  onChange={(e) => onCommentChange?.(id, e.target.value)}
                  placeholder="Enter remarks..."
                  className="w-full p-2 bg-gray-50 hover:bg-gray-50/80 focus:bg-white border border-gray-100 hover:border-gray-200 focus:border-gray-300 rounded text-xs transition-all outline-none min-h-[60px] resize-none focus:ring-1 focus:ring-gray-100 placeholder:text-gray-300 text-gray-700"
                />
             ) : (
                <div className="p-2 bg-gray-50/50 rounded text-xs text-gray-600 italic border border-gray-100 min-h-[40px]">
                   {item.actual_accomplishments || item.comment || <span className="text-gray-400 not-italic">No remarks.</span>}
                </div>
             )}
          </div>
        </div>

        {/* Right: Rating Panel */}
        <div className="md:w-[260px] bg-gray-50/30 border-t md:border-t-0 md:border-l border-gray-100 p-4 flex flex-col justify-center space-y-4">
            
            {showSelfRating && (
              <div className="bg-white p-2 rounded border border-gray-100 shadow-sm flex items-center gap-3">
                 <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-gray-500">Self Rating</span>
                        {isSelfRatingMode && <span className="text-[10px] font-bold text-white bg-gray-900 px-1 py-px rounded-[2px]">REQ</span>}
                    </div>
                    {isSelfRatingMode ? (
                        <div className="relative">
                           <select 
                             value={item.self_score || 0}
                             onChange={(e) => onSelfScoreChange?.(id, parseInt(e.target.value))}
                             className="w-full py-1 pl-2 font-bold text-gray-700 bg-gray-50 border border-gray-200 rounded focus:border-gray-400 outline-none appearance-none cursor-pointer text-xs"
                           >
                              <option value="0">Rate...</option>
                              {[5,4,3,2,1].map(n => <option key={n} value={n}>{n} - {n===5?'Outstanding':n===4?'Very Sat':n===3?'Satisfactory':n===2?'Unsatisfactory':'Poor'}</option>)}
                           </select>
                        </div>
                      ) : (
                         <div className="text-[10px] text-gray-400 italic">Rated:</div>
                      )}
                 </div>
                 <div className="w-8 h-8 flex items-center justify-center rounded font-bold text-sm border border-gray-200 bg-gray-50 text-gray-700">
                    {item.self_score || '-'}
                 </div>
              </div>
            )}

            <div>
               <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-gray-500 flex items-center gap-1"><Star size={10} className="text-gray-400" /> Supervisor</span>
               </div>
               
               {(!readOnly && !isSelfRatingMode) ? (
                  <div className="flex gap-1.5 mb-3">
                     <CustomSelect label="Q" value={item.q_score} onChange={(e) => onQETChange?.(id, 'q_score', e.target.value)} />
                     <CustomSelect label="E" value={item.e_score} onChange={(e) => onQETChange?.(id, 'e_score', e.target.value)} />
                     <CustomSelect 
                        label="T" 
                        value={item.t_score} 
                        onChange={(e) => onQETChange?.(id, 't_score', e.target.value)} 
                        disabled={(item.criteria_title || item.title || '').toLowerCase().includes('attendance') || (item.criteria_title || item.title || '').toLowerCase().includes('punctuality')}
                     />
                  </div>
               ) : (
                 <div className="grid grid-cols-3 gap-1.5 mb-3">
                    {[
                        { l:'Q', v: item.q_score },
                        { l:'E', v: item.e_score },
                        { l:'T', v: item.t_score }
                    ].map(metric => (
                        <div key={metric.l} className="bg-white py-1 px-1 rounded border border-gray-100 text-center shadow-sm">
                            <span className="block text-[8px] font-bold text-gray-400">{metric.l}</span>
                            <span className="block font-bold text-gray-700 text-xs">{metric.v || '-'}</span>
                        </div>
                    ))}
                 </div>
               )}
               
               {/* Final Score Display */}
               <div className="flex items-center justify-between bg-white py-1.5 px-3 rounded border border-gray-200">
                   <span className="text-xs font-bold text-gray-500">Avg</span>
                   <span className="text-lg font-black text-gray-900">
                       {Number(item.score).toFixed(2)}
                   </span>
               </div>
            </div>

        </div>
      </div>
    </motion.div>
  );
};


// --- Main ReviewMatrix Component ---

interface ReviewMatrixProps {
  items: PerformanceItem[];
  onScoreChange?: (id: string | number, score: number) => void;
  onCommentChange?: (id: string | number, comment: string) => void;
  onSelfScoreChange?: (id: string | number, score: number) => void;
  onAccomplishmentChange?: (id: string | number, text: string) => void;
  readOnly?: boolean;
  showSelfRating?: boolean;
  isSelfRatingMode?: boolean;
  finalScore?: number | null;
  onAddItem?: (item: PerformanceItem) => void;
  onEditItem?: (item: PerformanceItem) => void;
  onDeleteItem?: (id: string | number) => void;
  onQETChange?: (id: string | number, field: string, value: string | number) => void;
}

const ReviewMatrix: React.FC<ReviewMatrixProps> = ({ 
  items, 
  onScoreChange, 
  onCommentChange, 
  onSelfScoreChange, 
  onAccomplishmentChange, 
  readOnly = false, 
  showSelfRating = false, 
  isSelfRatingMode = false, 
  finalScore = null, 
  onAddItem, 
  onEditItem, 
  onDeleteItem, 
  onQETChange 
}) => {
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingItem, setEditingItem] = useState<PerformanceItem | null>(null);
  const [deletingItem, setDeletingItem] = useState<PerformanceItem | null>(null);

  // Constants
  const categoryOrder = ['Strategic Priorities', 'Core Functions', 'Support Functions', 'Core Competencies', 'Leadership Competencies', 'Functional Competencies', 'General'];

  // Handlers
  const openAddModal = () => { setEditingItem(null); setShowModal(true); };
  const openEditModal = (item: PerformanceItem) => {
    setEditingItem({ ...item, title: item.criteria_title, description: item.criteria_description });
    setShowModal(true);
  };

  const handleSaveModal = (formData: any) => {
    const processedData = { ...formData, criteria_title: formData.title, criteria_description: formData.description };
    if (editingItem && onEditItem) {
      onEditItem({ ...editingItem, ...processedData });
    } else if (onAddItem) {
      onAddItem({ ...processedData, id: Date.now(), score: 0, self_score: 0 });
    }
    setShowModal(false);
    setEditingItem(null);
  };

  const handleDeleteClick = (item: PerformanceItem) => { setDeletingItem(item); setShowDeleteModal(true); };
  const handleDeleteConfirm = () => {
    if (deletingItem && onDeleteItem) {
      onDeleteItem(deletingItem.id || deletingItem.criteria_id || 0);
      setShowDeleteModal(false);
      setDeletingItem(null);
    }
  };
  
  // Data Processing
  const groupedItems = items.reduce((acc, item) => {
    const cat = item.category || 'General';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {} as Record<string, PerformanceItem[]>);

  const sortedCategories = Object.keys(groupedItems).sort((a, b) => {
    const idxA = categoryOrder.indexOf(a);
    const idxB = categoryOrder.indexOf(b);
    if (idxA !== -1 && idxB !== -1) return idxA - idxB;
    if (idxA !== -1) return -1;
    if (idxB !== -1) return 1;
    return a.localeCompare(b);
  });

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-10 border-2 border-dashed border-gray-200 rounded-lg bg-gray-50/20 text-center space-y-3">
         <div className="p-3 bg-gray-50 rounded-full text-gray-400"><Info size={24} /></div>
         <div>
            <h3 className="font-bold text-gray-800 text-sm">No Rating Criteria</h3>
            <p className="text-xs text-gray-500">There are no performance items to evaluate yet.</p>
         </div>
         {!readOnly && onAddItem && (
            <button onClick={openAddModal} className="mt-2 px-4 py-2 bg-gray-900 text-white rounded font-bold text-xs shadow hover:bg-gray-800 transition-all flex items-center gap-2">
                <Plus size={14} /> Add First Criteria
            </button>
         )}
         <EditCriteriaModal isOpen={showModal} onClose={() => setShowModal(false)} onSubmit={handleSaveModal} initialData={editingItem} />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {sortedCategories.map(category => (
        <div key={category} className="space-y-4">
          {/* Category Header */}
          <div className="flex items-end justify-between border-b border-gray-200 pb-2">
             <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-gray-900">{category}</h3>
                <span className="px-1.5 py-0.5 rounded-full bg-gray-100 text-xs font-medium text-gray-500 border border-gray-200">{groupedItems[category].length}</span>
             </div>
             <div className="bg-white px-2 py-0.5 rounded border border-gray-200 shadow-sm">
                <span className="text-xs font-medium text-gray-500">Weight: </span>
                <span className="text-xs font-bold text-gray-800">{groupedItems[category].reduce((sum, item) => sum + parseFloat((item.weight || 0).toString()), 0).toFixed(0)}%</span>
             </div>
          </div>
          
          <div className="space-y-3">
            <AnimatePresence>
            {groupedItems[category].map((item, idx) => (
               <ReviewItem 
                 key={item.id || item.criteria_id || idx}
                 item={item}
                 onAccomplishmentChange={onAccomplishmentChange}
                 onCommentChange={onCommentChange}
                 onSelfScoreChange={onSelfScoreChange}
                 onQETChange={onQETChange}
                 readOnly={readOnly}
                 showSelfRating={showSelfRating}
                 isSelfRatingMode={isSelfRatingMode}
                 onScoreChange={onScoreChange}
               />
            ))}
            </AnimatePresence>
          </div>
        </div>
      ))}

      {finalScore !== null && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="mt-10 pt-6 border-t border-gray-100">
             <div className="rounded-xl bg-gray-900 text-white shadow-lg p-6 flex flex-col sm:flex-row items-center justify-between gap-6">
                 <div className="text-center sm:text-left">
                     <h2 className="text-lg font-bold text-white mb-0.5">Overall Performance</h2>
                     <p className="text-xs text-gray-400">Weighted average score</p>
                 </div>
                 
                 <div className="flex items-center gap-6 bg-gray-800 p-2 pr-6 rounded-lg border border-gray-700">
                     <div className="bg-white text-gray-900 px-4 py-2 rounded-md shadow-sm min-w-[80px] text-center">
                         <span className="block text-2xl font-black leading-none">{Number(finalScore).toFixed(2)}</span>
                     </div>
                     <div>
                          <span className="block text-xs font-medium text-gray-500 mb-0.5">Rating</span>
                          <span className="text-lg font-bold text-white">
                              {Number(finalScore) >= 4.5 ? "Outstanding" : Number(finalScore) >= 3.5 ? "Very Satisfactory" : Number(finalScore) >= 2.5 ? "Satisfactory" : Number(finalScore) >= 1.5 ? "Unsatisfactory" : "Poor"}
                          </span>
                     </div>
                 </div>
             </div>
          </motion.div>
      )}
    </div>
  );
};

export default ReviewMatrix;
