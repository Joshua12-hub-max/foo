import React, { useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import ApplicantCard from './ApplicantCard';
import { KanbanApplicant } from '../Hooks/useKanbanData';
import { KanbanColumn as KanbanColumnType } from '../Hooks/useKanbanDragDrop';

const ITEMS_PER_PAGE = 5;

interface KanbanColumnProps {
  column: KanbanColumnType;
  applicants: KanbanApplicant[];
  activeId: string | null;
  onViewRequirements: (applicant: KanbanApplicant) => void;
}

const KanbanColumn: React.FC<KanbanColumnProps> = ({ column, applicants, activeId, onViewRequirements }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const { setNodeRef, isOver } = useDroppable({ id: column.id });
  const totalPages = Math.max(1, Math.ceil(applicants.length / ITEMS_PER_PAGE));
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const visibleApplicants = applicants.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  const goToPage = (page: number) => setCurrentPage(Math.max(1, Math.min(page, totalPages)));

  return (
    <div ref={setNodeRef} className={`flex-1 min-w-[280px] max-w-[320px] bg-gray-50 rounded-xl p-4 transition-colors ${isOver ? 'ring-2 ring-blue-400 bg-blue-50' : ''}`}>
     
      <div className={`${column.color} text-white px-3 py-2 rounded-lg mb-4 flex justify-between items-center`}>
        <h3 className="font-semibold text-sm">{column.title}</h3>
        <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs">{applicants.length}</span>
      </div>
     
      <SortableContext items={visibleApplicants.map(a => a.id.toString())} strategy={verticalListSortingStrategy}>
        <div className="min-h-[400px] space-y-3">
          {visibleApplicants.map((applicant) => <ApplicantCard key={applicant.id} applicant={applicant} isDragging={activeId === applicant.id.toString()} onViewRequirements={onViewRequirements} />)}
          {applicants.length === 0 && <div className="text-center py-8 text-gray-400 text-sm">Drop applicants here</div>}
        </div>
      </SortableContext>
      
      {totalPages > 1 && <div className="mt-3 flex items-center justify-center gap-1">
          <button onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1}
            className="p-1.5 rounded-lg text-gray-500 hover:bg-white hover:text-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => <button key={page} onClick={() => goToPage(page)} className={`w-7 h-7 rounded-lg text-xs font-medium transition-colors ${currentPage === page ? 'bg-gray-800 text-white' : 'text-gray-600 hover:bg-white'}`}>{page}</button>)}
         
          <button onClick={() => goToPage(currentPage + 1)} disabled={currentPage === totalPages} className="p-1.5 rounded-lg text-gray-500 hover:bg-white hover:text-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      }
    </div>
  );
};

export default KanbanColumn;
