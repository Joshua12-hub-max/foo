import React, { useState } from 'react';
import { X, Search, UserPlus, Check, Loader } from 'lucide-react';
// @ts-ignore
import { fetchAvailableEmployees, assignEmployeeToDepartment } from '@/api/departmentApi';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToastStore } from '@/stores';

interface Department {
  id: number;
  name: string;
}

import { Employee } from '@/types';

interface AddEmployeeToDepartmentProps {
  isOpen: boolean;
  onClose: () => void;
  department?: Department;
  onSuccess?: () => void;
}

/**
 * Add Employee to Department Modal
 * Allows admin to search and assign employees to a department
 */
const AddEmployeeToDepartment: React.FC<AddEmployeeToDepartmentProps> = ({ isOpen, onClose, department, onSuccess }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const queryClient = useQueryClient();
  const showToast = useToastStore((state) => state.showToast);

  // Fetch available employees
  const { data: employees = [], isLoading } = useQuery({
    queryKey: ['available-employees', department?.id, searchTerm],
    queryFn: async () => {
      if (!department?.id) return [];
      const result = await fetchAvailableEmployees(department.id, searchTerm);
      return result.success ? result.employees : [];
    },
    enabled: !!isOpen && !!department?.id,
    placeholderData: (previousData) => previousData // Keep previous data while fetching new search results
  });

  // Assign employee mutation
  const assignMutation = useMutation({
    mutationFn: async (employeeId: number) => {
      if (!department?.id) throw new Error('No department selected');
      await assignEmployeeToDepartment(department.id, employeeId);
      return employeeId; 
    },
    onSuccess: (employeeId) => {
        showToast('Employee assigned successfully', 'success');
        // Invalidate department employees and available employees
        queryClient.invalidateQueries({ queryKey: ['department-employees', department?.id] });
        queryClient.invalidateQueries({ queryKey: ['available-employees', department?.id] });
        if (onSuccess) onSuccess();
    },
    onError: (error: Error) => {
        console.error('Failed to assign employee', error);
        showToast(error.message || 'Failed to assign employee', 'error');
    }
  });

  const handleAssign = (employeeId: number) => {
    assignMutation.mutate(employeeId);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 p-4 bg-black/50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[80vh] overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200">
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

        {/* Employee List */}
        <div className="flex-1 overflow-y-auto p-3">
          {isLoading ? (
            <div className="flex justify-center items-center py-6">
                <Loader className="animate-spin text-gray-400" size={24} />
            </div>
          ) : employees.length === 0 ? (
            <div className="text-center py-6 text-gray-400 text-sm">
              {searchTerm ? 'No employees found' : 'All eligible employees are already in this department'}
            </div>
          ) : (
            <div className="space-y-1.5">
              {employees.map((emp: Employee) => (
                <div 
                  key={emp.id} 
                  className="flex items-center justify-between p-2 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden flex items-center justify-center text-xs font-medium text-gray-500">
                      {emp.avatarUrl ? (
                        <img src={emp.avatarUrl} alt="" className="w-full h-full object-cover" />
                      ) : (
                        `${emp.firstName?.[0] || ''}${emp.lastName?.[0] || ''}`
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-gray-800 text-sm">{emp.firstName} {emp.lastName}</p>
                      <p className="text-xs text-gray-500">{emp.employeeId || emp.email}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleAssign(emp.id)}
                    disabled={assignMutation.isPending && assignMutation.variables === emp.id}
                    className="flex items-center gap-1 px-2 py-1 bg-gray-200 text-gray-700 text-xs rounded-lg hover:text-green-800 disabled:opacity-50 transition-colors font-medium"
                  >
                    {(assignMutation.isPending && assignMutation.variables === emp.id) ? <Loader size={14} className="animate-spin" /> : <UserPlus size={14} />}
                    {(assignMutation.isPending && assignMutation.variables === emp.id) ? 'Adding...' : 'Add'}
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
