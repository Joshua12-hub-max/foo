// Imports corrected
import React, { memo, ChangeEvent } from 'react';
import { X, FileText } from 'lucide-react';
import Combobox from '@/components/Custom/Combobox';
import { Position } from '@/api/plantillaApi';

interface Employee {
  id: number;
  firstName: string;
  lastName: string;
  employeeId: string;
}

interface HistoryRecord {
  id: number;
  employeeName: string;
  startDate: string;
  endDate?: string;
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
                Assign an employee to: <strong>{position?.positionTitle}</strong>
              </p>
              <div className="mb-4 relative z-[60]">
                <label className="block text-xs font-semibold text-gray-700 mb-1">Select Employee</label>
                <Combobox
                  options={[
                    { value: '', label: '-- Select Employee --' },
                    ...availableEmployees.map(emp => ({
                      value: String(emp.id),
                      label: `${emp.firstName} ${emp.lastName} (${emp.employeeId})`
                    }))
                  ]}
                  value={selectedEmployee}
                  onChange={(val) => setSelectedEmployee(val)}
                  placeholder="Search Employee..."
                  buttonClassName="w-full px-3 py-2 bg-[#F8F9FA] border-2 border-gray-200 rounded-md shadow-md text-sm focus:outline-none focus:border-gray-200 font-bold h-[40px]"
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
                Vacating: <strong>{position?.positionTitle}</strong><br/>
                Current Incumbent: <strong>{position?.incumbentName}</strong>
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
          <div className="bg-white rounded-xl border-2 border-gray-200 w-full max-w-4xl shadow-xl p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-gray-800">Position History</h2>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            <div className="max-h-[70vh] overflow-y-auto text-gray-800">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="text-sm text-gray-600 font-bold uppercase tracking-wider">{position?.itemNumber}</p>
                  <p className="text-xl font-black text-gray-900 leading-tight">{position?.positionTitle}</p>
                </div>
                {position && !position.isVacant && onPreviewForm33 && (
                    <button 
                        onClick={() => position && onPreviewForm33(position.id)}
                        className="bg-indigo-50 text-indigo-700 px-4 py-2 rounded-lg text-xs font-black hover:bg-indigo-100 transition-colors flex items-center gap-2 shadow-sm border border-indigo-100"
                    >
                        <FileText size={16} /> VIEW CS FORM 33
                    </button>
                )}
              </div>

              {history.length > 0 ? (
                <div className="overflow-x-auto bg-gray-50 rounded-lg border border-gray-100 mt-4">
                  <table className="w-full min-w-[700px]">
                    <thead className="bg-gray-200 shadow-md text-gray-700">
                      <tr>
                        <th className="px-6 py-4 text-left text-sm font-bold tracking-wide whitespace-nowrap uppercase">Employee Name</th>
                        <th className="px-6 py-4 text-left text-sm font-bold tracking-wide whitespace-nowrap uppercase">Start Date</th>
                        <th className="px-6 py-4 text-left text-sm font-bold tracking-wide whitespace-nowrap uppercase">End Date</th>
                        <th className="px-6 py-4 text-left text-sm font-bold tracking-wide whitespace-nowrap uppercase">Reason</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {history.map((h) => (
                        <tr key={h.id} className="hover:bg-[#F8F9FA] hover:shadow-xl transition-colors bg-white group">
                          <td className="px-6 py-4 text-sm font-bold text-gray-800">{h.employeeName}</td>
                          <td className="px-6 py-4 text-sm font-medium text-gray-600">{formatDate(h.startDate)}</td>
                          <td className="px-6 py-4 text-sm font-medium text-gray-600">
                            {h.endDate ? formatDate(h.endDate) : <span className="px-2.5 py-1 bg-green-50 text-green-700 rounded-full text-[11px] font-bold tracking-wider border border-green-100">PRESENT</span>}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500 italic">{h.reason || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-12 text-center text-gray-400 font-bold uppercase tracking-widest text-sm bg-gray-50 rounded-xl border border-gray-100 mt-4">
                  No history records found for this position.
                </div>
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
