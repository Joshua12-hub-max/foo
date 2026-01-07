import React from 'react';
import { X } from 'lucide-react';

const PlantillaFormModal = ({ isOpen, onClose, mode, formData, setFormData, departments, onSubmit }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 transition-all">
          <div className="bg-white rounded-xl w-full max-w-md shadow-2xl border border-gray-100 overflow-hidden animate-in fade-in zoom-in duration-200">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4">
              <h2 className="text-xl font-bold text-gray-900">
                {mode === 'create' ? 'Add New Position' : 'Edit Position'}
              </h2>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100">
                <X size={20} />
              </button>
            </div>
            
            {/* Form */}
            <form onSubmit={onSubmit}>
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Item Number*</label>
                    <input 
                      type="text" required
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-100 transition-all"
                      value={formData.item_number}
                      onChange={e => setFormData({...formData, item_number: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Salary Grade (1-33)*</label>
                    <input 
                      type="number" required min="1" max="33"
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-100 transition-all"
                      value={formData.salary_grade}
                      onChange={e => setFormData({...formData, salary_grade: e.target.value})}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Position Title*</label>
                  <input 
                    type="text" required
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-100 transition-all"
                    value={formData.position_title}
                    onChange={e => setFormData({...formData, position_title: e.target.value})}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Step Increment</label>
                    <input 
                      type="number" min="1" max="8"
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-100 transition-all"
                      value={formData.step_increment}
                      onChange={e => setFormData({...formData, step_increment: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Monthly Salary</label>
                    <input 
                      type="number" step="0.01"
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-100 transition-all"
                      value={formData.monthly_salary}
                      onChange={e => setFormData({...formData, monthly_salary: e.target.value})}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Department</label>
                  <select 
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-100 transition-all"
                    value={formData.department}
                    onChange={e => setFormData({...formData, department: e.target.value})}
                  >
                    <option value="">Select Department</option>
                    {departments.map(dept => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Footer */}
              <div className="flex gap-3 px-6 py-4 bg-gray-50 border-t border-gray-100">
                <button 
                  type="button" 
                  onClick={onClose}
                  className="flex-1 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-all shadow-sm"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="flex-1 px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white rounded-lg text-sm font-bold transition-all shadow-md"
                >
                  {mode === 'create' ? 'Create Position' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
    );
};

export default React.memo(PlantillaFormModal);
