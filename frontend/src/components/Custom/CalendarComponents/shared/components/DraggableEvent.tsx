import React, { ReactNode } from 'react';
import { useDrag } from 'react-dnd';
import { GridItem } from './CalendarGrid';

interface DraggableEventProps {
  event: GridItem;
  children: ReactNode;
  onDragEnd?: () => void;
}

/**
 * Draggable Event Component
 * Wraps event items to enable drag functionality
 */
const DraggableEvent: React.FC<DraggableEventProps> = ({ event, children, onDragEnd }) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'EVENT',
    item: { event },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
    end: (item, monitor) => {
      // @ts-ignore
      if (monitor.didDrop() && onDragEnd) {
        onDragEnd();
      }
    }
  }), [event]);

  return (
    <div
      // @ts-ignore
      ref={drag}
      style={{
        opacity: isDragging ? 0.5 : 1,
        cursor: 'move'
      }}
    >
      {children}
    </div>
  );
};

export default DraggableEvent;
