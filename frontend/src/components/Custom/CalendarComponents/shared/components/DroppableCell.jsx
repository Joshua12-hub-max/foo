import { useDrop } from 'react-dnd';

/**
 * Droppable Cell Component
 * Wraps calendar date cells to accept dropped events
 */
const DroppableCell = ({ date, onDrop, children }) => {
  const [{ isOver, canDrop }, drop] = useDrop(() => ({
    accept: 'EVENT',
    drop: (item) => {
      if (onDrop) {
        onDrop(item.event, date);
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  }), [date, onDrop]);

  const getBackgroundColor = () => {
    if (isOver && canDrop) return 'rgba(39, 75, 70, 0.1)'; // Light green highlight
    if (canDrop) return 'transparent';
    return 'transparent';
  };

  return (
    <div
      ref={drop}
      style={{
        backgroundColor: getBackgroundColor(),
        transition: 'background-color 0.2s ease',
        height: '100%',
        minHeight: '120px'
      }}
    >
      {children}
    </div>
  );
};

export default DroppableCell;
