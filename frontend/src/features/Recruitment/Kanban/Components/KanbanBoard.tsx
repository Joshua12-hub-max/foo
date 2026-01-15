import React from 'react';
import { 
  DndContext, 
  closestCenter, 
  DragOverlay, 
  MeasuringStrategy, 
  SensorDescriptor, 
  SensorOptions,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent
} from '@dnd-kit/core';
import KanbanColumn from './KanbanColumn';
import DragOverlayCard from './DragOverlayCard';
import { KanbanApplicant } from '../Hooks/useKanbanData';
import { KanbanColumn as KanbanColumnType } from '../Hooks/useKanbanDragDrop';

interface KanbanBoardProps {
  applicants: KanbanApplicant[];
  COLUMNS: KanbanColumnType[];
  sensors: SensorDescriptor<SensorOptions>[];
  activeId: string | null;
  activeApplicant: KanbanApplicant | null | undefined;
  handleDragStart: (event: DragStartEvent) => void;
  handleDragEnd: (event: DragEndEvent) => Promise<void>;
  handleDragOver: (event: DragOverEvent) => void;
  handleViewRequirements: (applicant: KanbanApplicant) => void;
}

const KanbanBoard: React.FC<KanbanBoardProps> = ({ 
  applicants, 
  COLUMNS, 
  sensors, 
  activeId, 
  activeApplicant, 
  handleDragStart, 
  handleDragEnd, 
  handleDragOver, 
  handleViewRequirements 
}) => {
  const getApplicantsByStage = (stage: string) => {
    return applicants.filter(a => a.stage === stage);
  };

  return (
    <>
      <DndContext 
        sensors={sensors} 
        collisionDetection={closestCenter} 
        onDragStart={handleDragStart} 
        onDragEnd={handleDragEnd} 
        onDragOver={handleDragOver} 
        measuring={{ droppable: { strategy: MeasuringStrategy.Always } }}
      >
        <div className="flex gap-4 overflow-x-auto pb-4">
          {COLUMNS.map((column) => (
            <KanbanColumn 
              key={column.id} 
              column={column} 
              applicants={getApplicantsByStage(column.id)} 
              activeId={activeId} 
              onViewRequirements={handleViewRequirements} 
            />
          ))}
        </div>
        
        <DragOverlay dropAnimation={{ duration: 200, easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)' }}>
          {activeApplicant ? <DragOverlayCard applicant={activeApplicant} /> : null}
        </DragOverlay>
      </DndContext>

      <div className="mt-6 pt-4 border-t border-gray-200">
        <p className="text-xs text-gray-500">
          <strong>Final Interview</strong> = Face-to-Face Interview | Drag applicants between columns to update their status
        </p>
      </div>
    </>
  );
};

export default KanbanBoard;
