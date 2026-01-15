import React, { memo, useMemo } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { User, Mail, Phone, ClipboardList, Calendar, GripVertical } from 'lucide-react';
import { KanbanApplicant } from '../Hooks/useKanbanData';

interface ApplicantCardProps {
  applicant: KanbanApplicant & { phone_number?: string };
  isDragging?: boolean;
  onViewRequirements?: (applicant: KanbanApplicant) => void;
}

const ApplicantCard: React.FC<ApplicantCardProps> = memo(({ applicant, isDragging, onViewRequirements }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ 
    id: applicant.id.toString(),
    transition: {
      duration: 200,
      easing: 'cubic-bezier(0.25, 1, 0.5, 1)',
    }
  });

  const style = useMemo(() => ({
    transform: CSS.Transform.toString(transform),
    transition: transition || 'transform 200ms cubic-bezier(0.25, 1, 0.5, 1)',
    opacity: isSortableDragging ? 0.4 : 1,
    willChange: isSortableDragging ? 'transform' : 'auto',
  }), [transform, transition, isSortableDragging]);

  if (isSortableDragging) {
    return (
      <div 
        ref={setNodeRef} 
        style={style}
        className="bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 p-4 mb-3 h-[100px]"
      />
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-3 cursor-grab active:cursor-grabbing hover:shadow-md hover:border-gray-300 transition-shadow duration-150"
    >
      <div className="flex items-start gap-3">
        <div
          {...attributes}
          {...listeners}
          className="mt-1 text-gray-400 hover:text-gray-600 touch-none"
        >
          <GripVertical size={16} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <div className="bg-gray-100 p-1.5 rounded-full">
              <User size={14} className="text-gray-500" />
            </div>
            <h4 className="font-semibold text-gray-900 truncate text-sm">
              {applicant.first_name} {applicant.last_name}
            </h4>
          </div>
          <div className="mt-2 space-y-1 text-xs text-gray-500">
            <div className="flex items-center gap-1.5">
              <Mail size={11} />
              <span className="truncate">{applicant.email}</span>
            </div>
            {applicant.phone_number && (
              <div className="flex items-center gap-1.5">
                <Phone size={11} />
                <span>{applicant.phone_number}</span>
              </div>
            )}
            <div className="flex items-center gap-1.5">
              <Calendar size={11} />
              <span>{applicant.job_title || 'General Application'}</span>
            </div>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onViewRequirements && onViewRequirements(applicant);
            }}
            className="inline-flex items-center gap-1.5 mt-2 px-2.5 py-1 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors"
          >
            <ClipboardList size={11} />
            Requirements
          </button>
        </div>
      </div>
    </div>
  );
});

ApplicantCard.displayName = 'ApplicantCard';

export default ApplicantCard;
