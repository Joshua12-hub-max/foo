import { useDrag } from 'react-dnd';

/**
 * Draggable Event Component
 * Wraps event items to enable drag functionality
 */
const DraggableEvent = ({ event, children, onDragEnd }) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'EVENT',
    item: { event },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
    end: (item, monitor) => {
      if (monitor.didDrop() && onDragEnd) {
        onDragEnd();
      }
    }
  }), [event]);

  return (
    <div
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
