import { useState, useEffect, useRef } from 'react';
import { X, ChevronDown } from 'lucide-react';
import { LEAVE_TYPES } from '../Constants/employeeLeaveCredit.constants';

// Leave type info for display
const LEAVE_TYPE_INFO = {
  'Vacation Leave': { code: 'VL', description: 'Personal reasons, rest, recreation' },
  'Sick Leave': { code: 'SL', description: 'Illness, medical consultations' },
  'Maternity Leave': { code: 'ML', description: '105 days (RA 11210)' },
  'Paternity Leave': { code: 'PL', description: '7 days (RA 8187)' },
  'Solo Parent Leave': { code: 'SPL', description: '7 days per year (RA 8972)' },
  'Special Emergency Leave': { code: 'SEL', description: '5 days for calamities' }
};

export const RequestCreditModal = ({ isOpen, onClose, formData, onFormChange, onSubmit, isSubmitting }) => {
  const [isLeaveDropdownOpen, setIsLeaveDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsLeaveDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectLeaveType = (type) => {
    onFormChange('creditType', type);
    setIsLeaveDropdownOpen(false);
  };

  const selectedLeaveInfo = formData.creditType ? LEAVE_TYPE_INFO[formData.creditType] : null;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 transition-all">
      <div className="bg-white rounded-xl w-full max-w-md shadow-2xl border border-gray-100 overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-4 flex items-center justify-between shrink-0">
          <h2 className="text-xl font-bold text-gray-900">Request Leave Credit</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto">
          <form onSubmit={onSubmit} id="credit-request-form" className="space-y-4">
            {/* Leave Type - Custom Dropdown */}
            <div ref={dropdownRef} className="relative">
              <label className="block text-sm font-semibold text-gray-700 mb-1">Leave Type *</label>
              <button
                type="button"
                onClick={() => setIsLeaveDropdownOpen(!isLeaveDropdownOpen)}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none text-sm text-left flex justify-between items-center bg-white hover:border-gray-300 transition-colors"
                style={{ borderWidth: '1px' }}
              >
                <span className={formData.creditType ? 'text-gray-900' : 'text-gray-500'}>
                  {formData.creditType ? `${formData.creditType} (${LEAVE_TYPE_INFO[formData.creditType]?.code || ''})` : 'Select leave type...'}
                </span>
                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isLeaveDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              
              {/* Dropdown Options */}
              {isLeaveDropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-xl z-20 max-h-48 overflow-y-auto">
                  {LEAVE_TYPES.map(type => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => handleSelectLeaveType(type)}
                      className={`w-full px-4 py-2.5 text-left text-sm hover:bg-gray-50 transition-colors ${formData.creditType === type ? 'bg-gray-50 font-medium text-gray-900' : 'text-gray-700'}`}
                    >
                      {type} {LEAVE_TYPE_INFO[type] ? `(${LEAVE_TYPE_INFO[type].code})` : ''}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Leave Info */}
            {selectedLeaveInfo && (
              <div className="text-xs text-blue-700 bg-blue-50 p-3 rounded-lg border border-blue-100 flex gap-2 items-start">
                <span className="font-semibold shrink-0">Info:</span>
                <p>{selectedLeaveInfo.description}</p>
              </div>
            )}

            {/* Days Requested */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Days Requested *</label>
              <input 
                type="number" 
                value={formData.requestedAmount} 
                onChange={(e) => onFormChange('requestedAmount', e.target.value)} 
                min="1" 
                step="0.5"
                placeholder="Enter number of days"
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-gray-300 focus:ring-4 focus:ring-gray-100 transition-all text-sm" 
                required 
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Description *</label>
              <textarea 
                value={formData.reason} 
                onChange={(e) => onFormChange('reason', e.target.value)} 
                rows="4"
                placeholder="Enter your reason for requesting leave credit..."
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-gray-300 focus:ring-4 focus:ring-gray-100 transition-all text-sm resize-none" 
                required 
              />
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:text-gray-900 transition-colors shadow-sm"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="credit-request-form"
            disabled={isSubmitting}
            className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800 disabled:opacity-50 transition-all shadow-lg shadow-gray-900/20"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Request'}
          </button>
        </div>
      </div>
    </div>
  );
};
