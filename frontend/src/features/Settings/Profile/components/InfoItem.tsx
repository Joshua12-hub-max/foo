import React from 'react';
import { Pencil, LucideIcon } from 'lucide-react';

interface InfoItemProps {
  icon?: LucideIcon;
  label: string;
  value?: string | number | null;
  editable?: boolean;
  setIsEditing?: (isEditing: boolean) => void;
  className?: string;
}

const InfoItem: React.FC<InfoItemProps> = ({ 
  label, 
  value, 
  editable = false, 
  setIsEditing, 
  className = '' 
}) => (
  <div className={`flex items-center justify-between py-3 border-b border-gray-100 last:border-0 group ${className}`}>
    <div className="min-w-0">
      <p className="text-[10px] font-semibold text-gray-400">{label}</p>
      <p className="text-sm text-gray-800 font-medium mt-0.5">{value || <span className="text-gray-300">—</span>}</p>
    </div>
    {editable && setIsEditing && (
      <button 
        onClick={() => setIsEditing(true)}
        className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-gray-100 transition-all text-gray-300 hover:text-gray-500"
      >
        <Pencil size={12} />
      </button>
    )}
  </div>
);

export default InfoItem;
