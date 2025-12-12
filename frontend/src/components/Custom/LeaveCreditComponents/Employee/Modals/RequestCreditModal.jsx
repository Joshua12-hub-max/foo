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
    <div className="fixed inset-0 bg-black/30 flex items-start justify-center z-50 p-4">
      <div className="bg-white rounded-lg border border-gray-200 w-full max-w-md shadow-xl mt-16 relative">
        
        {/* Header */}
        <div className="bg-gray-200 px-4 py-3.5 flex items-center justify-between">
          <h2 className="text-base font-bold text-gray-800">Request Leave Credit</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-5 h-5 text-red-800" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={onSubmit} className="p-4 space-y-3">
          {/* Leave Type - Custom Dropdown */}
          <div ref={dropdownRef} className="relative">
            <label className="block text-sm font-normal text-gray-700 mb-1">Leave Type *</label>
            <button
              type="button"
              onClick={() => setIsLeaveDropdownOpen(!isLeaveDropdownOpen)}
              className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:outline-none text-sm text-left flex justify-between items-center bg-white"
            >
              <span className={formData.creditType ? 'text-gray-800' : 'text-gray-400'}>
                {formData.creditType ? `${formData.creditType} (${LEAVE_TYPE_INFO[formData.creditType]?.code || ''})` : 'Select leave type...'}
              </span>
              <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isLeaveDropdownOpen ? 'rotate-180' : ''}`} />
            </button>
            
            {/* Dropdown Options */}
            {isLeaveDropdownOpen && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border-2 border-gray-200 rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto">
                {LEAVE_TYPES.map(type => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => handleSelectLeaveType(type)}
                    className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-100 ${formData.creditType === type ? 'bg-gray-100 font-medium' : ''}`}
                  >
                    {type} {LEAVE_TYPE_INFO[type] ? `(${LEAVE_TYPE_INFO[type].code})` : ''}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Leave Info */}
          {selectedLeaveInfo && (
            <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded-lg">
              <p>{selectedLeaveInfo.description}</p>
            </div>
          )}

          {/* Days Requested */}
          <div>
            <label className="block text-sm font-normal text-gray-700 mb-1">Days Requested *</label>
            <input 
              type="number" 
              value={formData.requestedAmount} 
              onChange={(e) => onFormChange('requestedAmount', e.target.value)} 
              min="1" 
              step="0.5"
              placeholder="Enter number of days"
              className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-gray-200 text-sm" 
              required 
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-normal text-gray-700 mb-1">Description *</label>
            <textarea 
              value={formData.reason} 
              onChange={(e) => onFormChange('reason', e.target.value)} 
              rows="4"
              placeholder="Enter your reason for requesting leave credit..."
              className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-gray-200 text-sm resize-none" 
              required 
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 mt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-lg shadow-md hover:text-red-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-lg shadow-md hover:text-green-800 disabled:opacity-50"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
