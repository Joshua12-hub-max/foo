import { X, FileText } from 'lucide-react';

export const ModalHeader = ({ onClose }) => {
  return (
    <div className="flex items-center justify-between px-6 py-4 shrink-0 border-b border-gray-100">
      <div className="flex items-center gap-2">
        <div className="bg-gray-50 p-2 rounded-lg">
           <FileText className="w-5 h-5 text-gray-700" />
        </div>
        <h3 className="text-xl font-bold text-gray-900">Submit Leave Request</h3>
      </div>
      <button
        onClick={onClose}
        className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100"
        aria-label="Close modal"
      >
        <X className="w-5 h-5" />
      </button>
    </div>
  );
};

export default ModalHeader;
