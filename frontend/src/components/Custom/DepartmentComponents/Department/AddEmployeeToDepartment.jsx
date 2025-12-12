import { useState, useEffect, useCallback } from 'react';
import { X, Search, UserPlus, Check } from 'lucide-react';
import { fetchAvailableEmployees, assignEmployeeToDepartment } from '../../../../api/departmentApi';

/**
 * Add Employee to Department Modal
 * Allows admin to search and assign employees to a department
 */
const AddEmployeeToDepartment = ({ isOpen, onClose, department, onSuccess }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [assigning, setAssigning] = useState(null);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Fetch available employees when department changes or search term changes
  const loadEmployees = useCallback(async () => {
    if (!department?.id) return;
    
    setLoading(true);
    try {
      const result = await fetchAvailableEmployees(department.id, searchTerm);
      if (result.success) {
        setEmployees(result.employees);
      }
    } catch (error) {
      // Handle error silently
    } finally {
      setLoading(false);
    }
  }, [department?.id, searchTerm]);

  useEffect(() => {
    if (isOpen && department) {
      loadEmployees();
    }
  }, [isOpen, department, loadEmployees]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (isOpen && department) {
        loadEmployees();
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const handleAssign = async (employeeId, employeeName) => {
    setAssigning(employeeId);
    setMessage({ type: '', text: '' });
    
    try {
      const result = await assignEmployeeToDepartment(department.id, employeeId);
      if (result.success) {
        setMessage({ type: 'success', text: `${employeeName} has been added to ${department.name}` });
        // Remove from list
        setEmployees(prev => prev.filter(e => e.id !== employeeId));
        // Notify parent to refresh
        if (onSuccess) onSuccess();
      } else {
        setMessage({ type: 'error', text: result.message });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to assign employee' });
    } finally {
      setAssigning(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-lg shadow-xl border border-gray-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-800">
            Add Employee to {department?.name}
          </h3>
          <button onClick={onClose} className="text-red-500 hover:text-red-600">
            <X size={20} />
          </button>
        </div>
        
        {/* Search */}
        <div className="p-4 border-b border-gray-100">
          <div className="relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search employees by name, ID, or email..."
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-gray-300"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Message */}
        {message.text && (
          <div className={`mx-4 mt-3 px-3 py-2 rounded-lg text-sm ${
            message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
          }`}>
            {message.text}
          </div>
        )}

        {/* Employee List */}
        <div className="max-h-72 overflow-y-auto p-4">
          {loading ? (
            <div className="text-center py-8 text-gray-400">Loading employees...</div>
          ) : employees.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              {searchTerm ? 'No employees found matching your search' : 'All employees are already in this department'}
            </div>
          ) : (
            <div className="space-y-2">
              {employees.map(emp => (
                <div 
                  key={emp.id} 
                  className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden flex items-center justify-center">
                      {emp.avatar_url ? (
                        <img src={emp.avatar_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-gray-500 font-medium text-sm">
                          {emp.first_name?.[0]}{emp.last_name?.[0]}
                        </span>
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">
                        {emp.first_name} {emp.last_name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {emp.employee_id} • {emp.department || 'No Department'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleAssign(emp.id, `${emp.first_name} ${emp.last_name}`)}
                    disabled={assigning === emp.id}
                    className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                  >
                    {assigning === emp.id ? (
                      <Check size={16} />
                    ) : (
                      <UserPlus size={16} />
                    )}
                    {assigning === emp.id ? 'Adding...' : 'Add'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 flex justify-end">
          <button 
            onClick={onClose} 
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddEmployeeToDepartment;