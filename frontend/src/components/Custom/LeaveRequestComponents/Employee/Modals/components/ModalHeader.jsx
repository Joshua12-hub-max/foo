import { X, FileText } from 'lucide-react';

export const ModalHeader = ({ onClose }) => {
  return (
    <div className="sticky top-0 bg-gray-200 shadow-md px-6 py-4 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <FileText className="w-6 h-6 text-[#274b46]" />
        <h3 className="text-xl font-bold text-gray-800">Submit Leave Request</h3>
      </div>
      <button
        onClick={onClose}
        className="text-gray-400 hover:text-gray-600 transition-colors"
        aria-label="Close modal"
      >
        <X className="w-6 h-6" />
      </button>
    </div>
  );
};

export default ModalHeader;
