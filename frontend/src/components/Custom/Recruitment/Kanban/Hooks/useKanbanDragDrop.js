import { useState, useMemo } from 'react';
import { 
  useSensor, 
  useSensors, 
  PointerSensor, 
  KeyboardSensor,
  TouchSensor
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { recruitmentApi } from '@api/recruitmentApi';

const COLUMNS = [
  { id: 'Applied', title: 'Applicants', color: 'bg-blue-700' },
  { id: 'Screening', title: 'Under Review', color: 'bg-slate-700' },
  { id: 'Initial Interview', title: 'Initial Interview (Online)', color: 'bg-slate-800' },
  { id: 'Final Interview', title: 'Final Interview', color: 'bg-zinc-800' },
  { id: 'Offer', title: 'Offer Extended', color: 'bg-neutral-800' },
  { id: 'Hired', title: 'Hired', color: 'bg-emerald-900' },
  { id: 'Rejected', title: 'Rejected', color: 'bg-rose-900' },
];

const useKanbanDragDrop = (applicants, setApplicants, fetchApplicants, showNotification) => {
  const [activeId, setActiveId] = useState(null);

  // Optimized sensors for smooth drag experience
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { 
        distance: 5, // Reduced for faster activation
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 200, // Short delay to distinguish from scroll
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Get the active applicant for DragOverlay
  const activeApplicant = useMemo(() => 
    activeId ? applicants.find(a => a.id.toString() === activeId) : null,
    [activeId, applicants]
  );

  // Handle drag start
  const handleDragStart = (event) => {
    setActiveId(event.active.id);
  };

  // Handle drag end
  const handleDragEnd = async (event) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const applicantId = parseInt(active.id);
    
    // Determine target column: either dropped on a column or on another applicant
    let targetColumnId = over.id;
    
    // Check if dropped on a column directly
    let column = COLUMNS.find(c => c.id === targetColumnId);
    
    // If not dropped on column, find which column the target applicant belongs to
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

    // Optimistic update
    setApplicants(prev => 
      prev.map(a => a.id === applicantId ? { ...a, stage: targetColumnId } : a)
    );

    try {
      await recruitmentApi.updateStage(applicantId, { stage: targetColumnId });
      showNotification(`Moved to ${column.title}`, 'success');
    } catch (err) {
      // Revert on error
      fetchApplicants();
      showNotification('Failed to update stage', 'error');
    }
  };

  // Handle drag over (for dropping into empty columns)
  const handleDragOver = (event) => {
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
