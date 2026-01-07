import { useState, useEffect, useCallback } from 'react';
import { X, Search, UserPlus, Check } from 'lucide-react';
import { fetchAvailableEmployees, assignEmployeeToDepartment } from '@/api/departmentApi';

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
        setMessage({ type: 'success', text: `${employeeName} added successfully` });
        setEmployees(prev => prev.filter(e => e.id !== employeeId));
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
    <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[80vh] overflow-hidden flex flex-col">
        {/* Header - bg-gray-200 */}
        <div className="sticky top-0 bg-gray-200 border-b border-gray-200 px-4 py-3.5 flex items-center justify-between">
          <h3 className="text-xl font-bold text-gray-800">Add Employee to {department?.name}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-6 h-6 text-red-800" />
          </button>
        </div>
        
        {/* Search */}
        <div className="p-3 border-b border-gray-200">
          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search employees by name, ID, or email..."
              className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-300 rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-gray-200"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Message */}
        {message.text && (
          <div className={`mx-3 mt-2 px-2 py-1.5 rounded-lg text-xs ${
            message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
          }`}>
            {message.text}
          </div>
        )}

        {/* Employee List */}
        <div className="flex-1 overflow-y-auto p-3">
          {loading ? (
            <div className="text-center py-6 text-gray-400 text-sm">Loading...</div>
          ) : employees.length === 0 ? (
            <div className="text-center py-6 text-gray-400 text-sm">
              {searchTerm ? 'No employees found' : 'All employees are already in this department'}
            </div>
          ) : (
            <div className="space-y-1.5">
              {employees.map(emp => (
                <div 
                  key={emp.id} 
                  className="flex items-center justify-between p-2 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden flex items-center justify-center text-xs font-medium text-gray-500">
                      {emp.avatar_url ? (
                        <img src={emp.avatar_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        `${emp.first_name?.[0]}${emp.last_name?.[0]}`
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-gray-800 text-sm">{emp.first_name} {emp.last_name}</p>
                      <p className="text-xs text-gray-500">{emp.employee_id || emp.email}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleAssign(emp.id, `${emp.first_name} ${emp.last_name}`)}
                    disabled={assigning === emp.id}
                    className="flex items-center gap-1 px-2 py-1 bg-gray-200 text-gray-700 text-xs rounded-lg hover:text-green-800 disabled:opacity-50 transition-colors font-medium"
                  >
                    {assigning === emp.id ? <Check size={14} /> : <UserPlus size={14} />}
                    {assigning === emp.id ? 'Adding...' : 'Add'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-gray-200">
          <button 
            onClick={onClose} 
            className="w-full px-3 py-2 text-sm bg-gray-200 text-gray-700 rounded-lg hover:text-red-800 transition-colors font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddEmployeeToDepartment;