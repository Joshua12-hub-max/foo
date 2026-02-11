import React from 'react';
import { SquarePen, LucideIcon } from 'lucide-react';

interface InfoItemProps {
  icon: LucideIcon;
  label: string;
  value?: string | number | null;
  editable?: boolean;
  setIsEditing?: (isEditing: boolean) => void;
  className?: string;
}

const InfoItem: React.FC<InfoItemProps> = ({ 
  icon: Icon, 
  label, 
  value, 
  editable = false, 
  setIsEditing, 
  className = '' 
}) => (
  <div className={`flex items-start gap-3 group ${className}`}>
    <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
      <Icon size={18} className="text-gray-500" />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-xs text-gray-500 font-medium">{label}</p>
      <p className="text-sm text-gray-900 font-medium truncate">{value || 'Not set'}</p>
    </div>
    {editable && setIsEditing && (
      <button 
        onClick={() => setIsEditing(true)}
        className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-gray-100 border border-transparent hover:border-gray-200 transition-all shadow-sm text-gray-400 hover:text-gray-700"
        title="Edit"
      >
        <SquarePen size={14} />
      </button>
    )}
  </div>
);

export default InfoItem;
