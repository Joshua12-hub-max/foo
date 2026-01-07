import { memo } from 'react';
import { User } from 'lucide-react';

const DragOverlayCard = memo(({ applicant }) => (
  <div className="bg-white rounded-lg shadow-2xl border-2 border-blue-400 p-4 w-[280px] rotate-2 scale-105">
    <div className="flex items-center gap-2">
      <div className="bg-blue-100 p-1.5 rounded-full">
        <User size={14} className="text-blue-600" />
      </div>
      <h4 className="font-semibold text-gray-900 truncate">
        {applicant.first_name} {applicant.last_name}
      </h4>
    </div>
    <div className="mt-2 text-xs text-gray-500">
      {applicant.job_title || 'General Application'}
    </div>
  </div>
));
DragOverlayCard.displayName = 'DragOverlayCard';

export default DragOverlayCard;
