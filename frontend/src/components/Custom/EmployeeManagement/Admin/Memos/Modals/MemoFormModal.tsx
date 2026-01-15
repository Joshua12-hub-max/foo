/**
 * MemoFormModal Component
 * Create/Edit modal for Admin Employee Memos
 */

import React, { memo, FormEvent } from 'react';
import { X } from 'lucide-react';
// @ts-ignore
import { MEMO_TYPES, MEMO_PRIORITIES, MEMO_STATUSES } from '../Constants/memoConstants';

interface Employee {
  id: number;
  first_name: string;
  last_name: string;
}

interface FormData {
  employee_id: string;
  memo_type: string;
  priority: string;
  subject: string;
  content: string;
  effective_date: string;
  status: string;
  acknowledgment_required: boolean;
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
}) => {
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
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Employee</label>
              <select
                required
                value={formData.employee_id}
                onChange={(e) => onFormChange('employee_id', e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-100 transition-all"
              >
                <option value="">Select Employee</option>
                {employees.map(emp => (
                  <option key={emp.id} value={emp.id}>
                    {emp.first_name} {emp.last_name}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Type</label>
                <select
                  required
                  value={formData.memo_type}
                  onChange={(e) => onFormChange('memo_type', e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-100 transition-all"
                >
                  {MEMO_TYPES.map((t: { value: string; label: string }) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Priority</label>
                <select
                  value={formData.priority}
                  onChange={(e) => onFormChange('priority', e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-100 transition-all"
                >
                  {MEMO_PRIORITIES.map((p: { value: string; label: string }) => (
                    <option key={p.value} value={p.value}>{p.label}</option>
                  ))}
                </select>
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
                  value={formData.effective_date}
                  onChange={(e) => onFormChange('effective_date', e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-100 transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => onFormChange('status', e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-100 transition-all"
                >
                  {MEMO_STATUSES.map((s: { value: string; label: string }) => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg border border-gray-100">
              <input
                type="checkbox"
                id="ack_required"
                checked={formData.acknowledgment_required}
                onChange={(e) => onFormChange('acknowledgment_required', e.target.checked)}
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
