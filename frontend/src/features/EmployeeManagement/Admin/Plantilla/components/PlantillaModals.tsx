// Imports corrected
import React, { memo, ChangeEvent } from 'react';
import { X, FileText } from 'lucide-react';
import { Position } from '@/api/plantillaApi';

interface Employee {
  id: number;
  first_name: string;
  last_name: string;
  employee_id: string;
}

interface HistoryRecord {
  id: number;
  employee_name: string;
  start_date: string;
  end_date?: string;
  reason?: string;
}

interface AssignModalProps {
  isOpen: boolean;
  onClose: () => void;
  position: Position | null;
  availableEmployees: Employee[];
  selectedEmployee: string;
  setSelectedEmployee: (val: string) => void;
  onAssign: () => void;
}

export const AssignModal: React.FC<AssignModalProps> = memo(({ 
    isOpen, 
    onClose, 
    position, 
    availableEmployees, 
    selectedEmployee, 
    setSelectedEmployee, 
    onAssign
}) => {
    if (!isOpen) return null;

    const handleAssignClick = () => {
        if (!selectedEmployee) return;
        onAssign();
    };

    return (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl border-2 border-gray-200 w-full max-w-md shadow-xl p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-gray-800">Assign Employee</h2>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-4">
                Assign an employee to: <strong>{position?.position_title}</strong>
              </p>
              <div className="mb-4">
                <label className="block text-xs font-semibold text-gray-700 mb-1">Select Employee</label>
                <select 
                  className="w-full px-3 py-2 bg-[#F8F9FA] border-2 border-gray-200 rounded-md shadow-md text-sm focus:outline-none focus:border-gray-200"
                  value={selectedEmployee}
                  onChange={(e: ChangeEvent<HTMLSelectElement>) => setSelectedEmployee(e.target.value)}
                >
                  <option value="">-- Select Employee --</option>
                  {availableEmployees.map(emp => (
                    <option key={emp.id} value={emp.id}>
                      {emp.first_name} {emp.last_name} ({emp.employee_id})
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex gap-3">
                <button 
                  onClick={onClose}
                  className="flex-1 px-4 py-2 bg-gray-200 text-sm font-semibold text-gray-700 border-2 border-gray-200 rounded-lg shadow-md hover:text-red-700"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleAssignClick}
                  disabled={!selectedEmployee}
                  className="flex-1 px-4 py-2 text-sm font-semibold text-white bg-gray-900 rounded-lg shadow-md hover:bg-gray-800 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  Confirm Assign
                </button>
              </div>
            </div>
          </div>
        </div>
    );
});

AssignModal.displayName = 'AssignModal';

interface VacateModalProps {
  isOpen: boolean;
  onClose: () => void;
  position: Position | null;
  vacateReason: string;
  setVacateReason: (val: string) => void;
  onVacate: () => void;
}

export const VacateModal: React.FC<VacateModalProps> = memo(({ 
    isOpen, 
    onClose, 
    position, 
    vacateReason, 
    setVacateReason, 
    onVacate
}) => {
    if (!isOpen) return null;

    const handleVacateClick = () => {
        onVacate();
    };

    return (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl border-2 border-gray-200 w-full max-w-md shadow-xl p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-gray-800">Vacate Position</h2>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-4">
                Vacating: <strong>{position?.position_title}</strong><br/>
                Current Incumbent: <strong>{position?.incumbent_name}</strong>
              </p>
              <div className="mb-4">
                <label className="block text-xs font-semibold text-gray-700 mb-1">Reason (Optional)</label>
                <input 
                  type="text"
                  placeholder="e.g., Resigned, Transferred, Retired"
                  className="w-full px-3 py-2 bg-[#F8F9FA] border-2 border-gray-200 rounded-md shadow-md text-sm focus:outline-none focus:border-gray-200"
                  value={vacateReason}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setVacateReason(e.target.value)}
                />
              </div>
              <div className="flex gap-3">
                <button 
                  onClick={onClose}
                  className="flex-1 px-4 py-2 bg-gray-200 text-sm font-semibold text-gray-700 border-2 border-gray-200 rounded-lg shadow-md hover:text-red-700"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleVacateClick}
                  className="flex-1 px-4 py-2 text-sm font-semibold text-white bg-amber-600 rounded-lg shadow-md hover:bg-amber-700 flex items-center justify-center gap-2] disabled:opacity-50"
                >
                  Confirm Vacate
                </button>
              </div>
            </div>
          </div>
        </div>
    );
});

VacateModal.displayName = 'VacateModal';

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  position: Position | null;
  history: HistoryRecord[];
  onPreviewForm33?: (id: number) => void;
}

export const HistoryModal: React.FC<HistoryModalProps> = memo(({ isOpen, onClose, position, history, onPreviewForm33 }) => {
    if (!isOpen) return null;

    const formatDate = (date: string | null | undefined): string => {
        if (!date) return '-';
        return new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    };

    return (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl border-2 border-gray-200 w-full max-w-md shadow-xl p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-gray-800">Position History</h2>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            <div className="max-h-96 overflow-y-auto text-gray-800">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="text-sm text-gray-600 font-bold uppercase tracking-wider">{position?.item_number}</p>
                  <p className="text-sm font-black text-gray-900 leading-tight">{position?.position_title}</p>
                </div>
                {position && !position.is_vacant && onPreviewForm33 && (
                    <button 
                        onClick={() => position && onPreviewForm33(position.id)}
                        className="bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-lg text-[10px] font-black hover:bg-indigo-100 transition-colors flex items-center gap-1.5 shadow-sm border border-indigo-100"
                    >
                        <FileText size={14} /> VIEW CS FORM 33
                    </button>
                )}
              </div>

              {history.length > 0 ? (
                <div className="space-y-3">
                  {history.map((h) => (
                    <div key={h.id} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                      <p className="font-medium text-gray-800">{h.employee_name}</p>
                      <p className="text-sm text-gray-600">
                        {formatDate(h.start_date)} - {h.end_date ? formatDate(h.end_date) : 'Present'}
                      </p>
                      {h.reason && <p className="text-xs text-gray-500 mt-1">Reason: {h.reason}</p>}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">No history records found.</p>
              )}
            </div>
          </div>
        </div>
    );
});

HistoryModal.displayName = 'HistoryModal';

interface GuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GuideModal: React.FC<GuideModalProps> = memo(({ isOpen, onClose }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl border-2 border-gray-200 w-full max-w-md shadow-xl max-h-[85vh] flex flex-col p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-gray-800">Real-Life Plantilla Guide</h2>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            <div className="overflow-y-auto text-gray-800 space-y-6">
              <section>
                <h3 className="font-bold text-blue-700 text-lg mb-2">1. The "Empty Chair" Concept</h3>
                <p className="text-sm leading-relaxed">A Plantilla is a blueprint of authorized positions. Each chair has a unique <strong>Item Number</strong> and is tied to a <strong>Salary Grade (SG)</strong>. These exist independently of the person currently holding them.</p>
              </section>
              <section>
                <h3 className="font-bold text-blue-700 text-lg mb-2">2. Data Synchronization</h3>
                <p className="text-sm leading-relaxed">In this system, when you <strong>Assign</strong> an employee to a position, their profile is automatically updated to match. This ensures 100% data integrity between the "Chair" and the "Person".</p>
              </section>
              <section>
                <h3 className="font-bold text-blue-700 text-lg mb-2">3. Automated Salary (SSL)</h3>
                <p className="text-sm leading-relaxed">Salaries are pulled from the <strong>Salary Standardization Law (SSL)</strong> schedule. When creating a position, selecting an SG and Step auto-populates the monthly pay based on government standards.</p>
              </section>
              <section className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                <h3 className="font-bold text-blue-800 text-sm mb-1 uppercase tracking-wider">HRM Best Practice</h3>
                <p className="text-xs text-blue-700 italic">"Ensure every Item Number corresponds exactly to the DBM PSIPOP report for audit-ready compliance."</p>
              </section>
            </div>
            <div className="p-4 border-t border-gray-100 flex justify-end">
                <button onClick={onClose} className="bg-gray-200 px-6 py-2 rounded-lg text-sm font-bold text-gray-700 hover:bg-gray-300">Close Guide</button>
            </div>
          </div>
        </div>
    );
});

GuideModal.displayName = 'GuideModal';
