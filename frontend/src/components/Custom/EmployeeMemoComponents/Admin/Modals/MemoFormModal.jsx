/**
 * MemoFormModal Component
 * Create/Edit modal for Admin Employee Memos
 */

import React, { memo } from 'react';
import { X } from 'lucide-react';
import { MEMO_TYPES, MEMO_PRIORITIES, MEMO_STATUSES } from '../../Constants/memoConstants';

const MemoFormModal = memo(({
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
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-lg shadow-xl overflow-hidden max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 bg-gray-200 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-700">
            {selectedMemo ? 'Edit Memo' : 'New Memo'}
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-300 rounded transition-colors text-gray-600"
          >
            <X size={20} />
          </button>
        </div>
        <form onSubmit={onSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Employee</label>
            <select
              required
              value={formData.employee_id}
              onChange={(e) => onFormChange('employee_id', e.target.value)}
              className="w-full px-4 py-2 bg-gray-50 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-200"
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select
                required
                value={formData.memo_type}
                onChange={(e) => onFormChange('memo_type', e.target.value)}
                className="w-full px-4 py-2 bg-gray-50 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-200"
              >
                {MEMO_TYPES.map(t => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
              <select
                value={formData.priority}
                onChange={(e) => onFormChange('priority', e.target.value)}
                className="w-full px-4 py-2 bg-gray-50 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-200"
              >
                {MEMO_PRIORITIES.map(p => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
            <input
              type="text"
              required
              value={formData.subject}
              onChange={(e) => onFormChange('subject', e.target.value)}
              className="w-full px-4 py-2 bg-gray-50 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-200"
              placeholder="Enter subject"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
            <textarea
              required
              rows={4}
              value={formData.content}
              onChange={(e) => onFormChange('content', e.target.value)}
              className="w-full px-4 py-2 bg-gray-50 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-200 resize-none"
              placeholder="Enter memo content"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Effective Date</label>
              <input
                type="date"
                value={formData.effective_date}
                onChange={(e) => onFormChange('effective_date', e.target.value)}
                className="w-full px-4 py-2 bg-gray-50 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-200"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={formData.status}
                onChange={(e) => onFormChange('status', e.target.value)}
                className="w-full px-4 py-2 bg-gray-50 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-200"
              >
                {MEMO_STATUSES.map(s => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="ack_required"
              checked={formData.acknowledgment_required}
              onChange={(e) => onFormChange('acknowledgment_required', e.target.checked)}
              className="rounded"
            />
            <label htmlFor="ack_required" className="text-sm text-gray-700">
              Acknowledgment Required
            </label>
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg text-sm font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg text-sm font-medium transition-colors"
            >
              {saving ? 'Saving...' : selectedMemo ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
});

MemoFormModal.displayName = 'MemoFormModal';

export default MemoFormModal;
