import React, { memo, FormEvent } from 'react';
import { X } from 'lucide-react';
// @ts-ignore
import { MEMO_TYPES, MEMO_PRIORITIES, MEMO_STATUSES } from '../Constants/memoConstants';
import Combobox from '@/components/Custom/Combobox';

interface Employee {
  id: number;
  firstName: string;
  lastName: string;
}

interface FormData {
  employeeId: string;
  memoType: string;
  priority: string;
  subject: string;
  content: string;
  effectiveDate: string;
  status: string;
  acknowledgmentRequired: boolean;
}

interface SelectedMemo {
  id: number;
}

interface MemoFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: FormEvent) => void;
  formData: FormData;
  onFormChange: (key: string, value: string | boolean) => void;
  employees: Employee[];
  selectedMemo?: SelectedMemo;
  saving: boolean;
}

const MemoFormModal: React.FC<MemoFormModalProps> = memo(({
  isOpen,
  onClose,
  onSubmit,
  formData,
  onFormChange,
  employees,
  selectedMemo,
  saving
}: MemoFormModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 transition-all">
      <div className="bg-white rounded-xl w-full max-w-md shadow-2xl border border-gray-100 overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 shrink-0">
          <h2 className="text-xl font-bold text-gray-900">
            {selectedMemo ? 'Edit Memo' : 'New Memo'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Content */}
        <div className="p-6 overflow-y-auto">
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="z-[60] relative">
              <label className="block text-xs font-bold text-gray-700 mb-1">Employee</label>
              <Combobox
                options={employees.map(emp => ({ 
                  value: String(emp.id), 
                  label: `${emp.firstName} ${emp.lastName}` 
                }))}
                value={formData.employeeId}
                onChange={(val) => onFormChange('employeeId', val)}
                placeholder="Select Employee"
                buttonClassName="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="z-[50] relative">
                <label className="block text-xs font-bold text-gray-700 mb-1">Type</label>
                <Combobox
                  options={MEMO_TYPES}
                  value={formData.memoType}
                  onChange={(val) => onFormChange('memoType', val)}
                  placeholder="Select Type"
                  buttonClassName="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm"
                />
              </div>
              <div className="z-[50] relative">
                <label className="block text-xs font-bold text-gray-700 mb-1">Priority</label>
                <Combobox
                  options={MEMO_PRIORITIES}
                  value={formData.priority}
                  onChange={(val) => onFormChange('priority', val)}
                  placeholder="Select Priority"
                  buttonClassName="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Subject</label>
              <input
                type="text"
                required
                value={formData.subject}
                onChange={(e) => onFormChange('subject', e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-100 transition-all"
                placeholder="Enter subject"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Content</label>
              <textarea
                required
                rows={4}
                value={formData.content}
                onChange={(e) => onFormChange('content', e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-100 resize-none transition-all"
                placeholder="Enter memo content"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Effective Date</label>
                <input
                  type="date"
                  value={formData.effectiveDate}
                  onChange={(e) => onFormChange('effectiveDate', e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-100 transition-all"
                />
              </div>
              <div className="z-[40] relative">
                <label className="block text-xs font-bold text-gray-700 mb-1">Status</label>
                <Combobox
                  options={MEMO_STATUSES}
                  value={formData.status}
                  onChange={(val) => onFormChange('status', val)}
                  placeholder="Select Status"
                  buttonClassName="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg border border-gray-100">
              <input
                type="checkbox"
                id="ack_required"
                checked={formData.acknowledgmentRequired}
                onChange={(e) => onFormChange('acknowledgmentRequired', e.target.checked)}
                className="rounded text-gray-900 focus:ring-gray-900"
              />
              <label htmlFor="ack_required" className="text-sm font-medium text-gray-700 select-none cursor-pointer">
                Acknowledgment Required
              </label>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-all shadow-sm"
          >
            Cancel
          </button>
          <button
            type="submit"
            onClick={onSubmit}
            disabled={saving}
            className="flex-1 px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white rounded-lg text-sm font-bold transition-all shadow-md disabled:opacity-50"
          >
            {saving ? 'Saving...' : selectedMemo ? 'Update Memo' : 'Create Memo'}
          </button>
        </div>

      </div>
    </div>
  );
});

MemoFormModal.displayName = 'MemoFormModal';

export default MemoFormModal;
