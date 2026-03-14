import React from 'react';
import { X, FileText } from 'lucide-react';

interface ModalHeaderProps {
  onClose: () => void;
}

export const ModalHeader: React.FC<ModalHeaderProps> = ({ onClose }) => {
  return (
    <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-white z-10">
      <h2 className="text-xl font-bold text-gray-800">
        Submit Leave Request
      </h2>
      <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100">
        <X size={20} />
      </button>
    </div>
  );
};

export default ModalHeader;
