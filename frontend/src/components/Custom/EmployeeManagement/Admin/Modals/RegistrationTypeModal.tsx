import React from 'react';
import { X } from 'lucide-react';

interface RegistrationTypeModalProps {
  isOpen: boolean;
  onClose: () => void;
  departmentName: string;
  onSelectType: (isOld: boolean, duties: string) => void;
}

const RegistrationTypeModal: React.FC<RegistrationTypeModalProps> = ({ isOpen, onClose, departmentName, onSelectType }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 min-h-screen bg-black/40 flex items-center justify-center p-4 z-[999] animate-in fade-in duration-200">
      <div className="bg-white border border-gray-100 rounded-2xl w-full max-w-2xl shadow-xl flex flex-col max-h-[90vh] overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 bg-white border-b border-gray-200">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              Employee Registration
            </h2>
            <p className="text-sm text-gray-500 mt-1">Select registration type for <span className="font-semibold text-gray-900">{departmentName}</span></p>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 hover:bg-gray-50 border border-gray-200 p-2 rounded-lg transition-colors shadow-sm focus:outline-none"
          >
            <X size={20} strokeWidth={2.5} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 md:p-8 overflow-y-auto bg-gray-50/30">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            
            {/* Newly Hired - Standard */}
            <button 
              onClick={() => onSelectType(false, 'Standard')}
              className="group relative bg-white border border-gray-200 hover:border-gray-900 hover:shadow-md p-6 rounded-xl text-left transition-all duration-300 active:scale-[0.98]"
            >
              <div className="mb-3">
                <h3 className="font-bold text-gray-900 text-lg group-hover:underline decoration-2 underline-offset-4">
                  Newly Hired<br/>
                  <span className="text-sm text-gray-600 font-medium">Standard Duty</span>
                </h3>
              </div>
              <p className="text-sm text-gray-500 leading-relaxed font-normal">
                Register an employee who passed the recruitment process. Permanent, Full-time, Temporary, or Probationary.
              </p>
            </button>

            {/* Newly Hired - Irregular */}
            <button 
              onClick={() => onSelectType(false, 'Irregular Duties')}
              className="group relative bg-white border border-gray-200 hover:border-gray-900 hover:shadow-md p-6 rounded-xl text-left transition-all duration-300 active:scale-[0.98]"
            >
              <div className="mb-3">
                <h3 className="font-bold text-gray-900 text-lg group-hover:underline decoration-2 underline-offset-4">
                  Newly Hired<br/>
                  <span className="text-sm text-gray-600 font-medium">Irregular Duties</span>
                </h3>
              </div>
              <p className="text-sm text-gray-500 leading-relaxed font-normal">
                Register an employee with flexible scheduling. Job Order, Contractual, Casual, or Coterminous.
              </p>
            </button>

            {/* Old Employee - Standard */}
            <button 
              onClick={() => onSelectType(true, 'Standard')}
              className="group relative bg-white border border-gray-200 hover:border-gray-900 hover:shadow-md p-6 rounded-xl text-left transition-all duration-300 active:scale-[0.98]"
            >
              <div className="mb-3">
                <h3 className="font-bold text-gray-900 text-lg group-hover:underline decoration-2 underline-offset-4">
                  Old Employee<br/>
                  <span className="text-sm text-gray-600 font-medium">Standard Duty</span>
                </h3>
              </div>
              <p className="text-sm text-gray-500 leading-relaxed font-normal">
                Encode an existing employee into the system. Skip recruitment linking. Standard working hours.
              </p>
            </button>

             {/* Old Employee - Irregular */}
             <button 
              onClick={() => onSelectType(true, 'Irregular Duties')}
              className="group relative bg-white border border-gray-200 hover:border-gray-900 hover:shadow-md p-6 rounded-xl text-left transition-all duration-300 active:scale-[0.98]"
            >
              <div className="mb-3">
                <h3 className="font-bold text-gray-900 text-lg group-hover:underline decoration-2 underline-offset-4">
                  Old Employee<br/>
                  <span className="text-sm text-gray-600 font-medium">Irregular Duties</span>
                </h3>
              </div>
              <p className="text-sm text-gray-500 leading-relaxed font-normal">
                Encode an existing employee into the system. Skip recruitment linking. Flexible working hours.
              </p>
            </button>

          </div>
        </div>

      </div>
    </div>
  );
};

export default RegistrationTypeModal;
