import { useState, useMemo } from 'react';
import { 
  useSensor, 
  useSensors, 
  PointerSensor, 
  KeyboardSensor,
  TouchSensor,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { recruitmentApi } from '@/api/recruitmentApi';
import { KanbanApplicant } from './useKanbanData';

export interface KanbanColumn {
  id: string;
  title: string;
  color: string;
}

export const COLUMNS: KanbanColumn[] = [
  { id: 'Applied', title: 'Applicants', color: 'bg-blue-700' },
  { id: 'Screening', title: 'Under Review', color: 'bg-slate-700' },
  { id: 'Initial Interview', title: 'Initial Interview (Online)', color: 'bg-slate-800' },
  { id: 'Final Interview', title: 'Final Interview', color: 'bg-zinc-800' },
  { id: 'Offer', title: 'Offer Extended', color: 'bg-neutral-800' },
  { id: 'Hired', title: 'Hired', color: 'bg-emerald-900' },
  { id: 'Rejected', title: 'Rejected', color: 'bg-rose-900' },
];

const useKanbanDragDrop = (
  applicants: KanbanApplicant[], 
  setApplicants: React.Dispatch<React.SetStateAction<KanbanApplicant[]>>, 
  fetchApplicants: () => void, 
  showNotification: (message: string, type: 'success' | 'error') => void
) => {
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { 
        distance: 5,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 200,
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const activeApplicant = useMemo(() => 
    activeId ? applicants.find(a => a.id.toString() === activeId) : null,
    [activeId, applicants]
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const applicantId = parseInt(active.id as string);
    
    let targetColumnId = over.id as string;
    let column = COLUMNS.find(c => c.id === targetColumnId);
    
    if (!column) {
      const targetApplicant = applicants.find(a => a.id.toString() === over.id);
      if (targetApplicant) {
        targetColumnId = targetApplicant.stage;
        column = COLUMNS.find(c => c.id === targetColumnId);
      }
    }
    
    if (!column) return;

    const applicant = applicants.find(a => a.id === applicantId);
    if (!applicant || applicant.stage === targetColumnId) return;

    setApplicants(prev => 
      prev.map(a => a.id === applicantId ? { ...a, stage: targetColumnId } : a)
    );

    try {
      await recruitmentApi.updateStage(applicantId, { stage: targetColumnId });
      showNotification(`Moved to ${column.title}`, 'success');
    } catch (err) {
      fetchApplicants();
      showNotification('Failed to update stage', 'error');
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { over } = event;
    if (over && COLUMNS.find(c => c.id === over.id)) {
      // Allow drop
    }
  };

  return {
    sensors,
    activeId,
    activeApplicant,
    handleDragStart,
    handleDragEnd,
    handleDragOver,
    COLUMNS
  };
};

export default useKanbanDragDrop;
