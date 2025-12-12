import { motion } from 'framer-motion';
import { Mail, Users, Edit, Trash2 } from 'lucide-react';
import { getStatusBadgeClass } from '../constants/employeeConstants';

/**
 * Employee Card Component
 * Displays individual employee information in a card format
 * with hover actions for edit and delete
 */
const EmployeeCard = ({
  employee,
  onClick,
  onEdit,
  onDelete
}) => {
  const handleEditClick = (e) => {
    e.stopPropagation();
    onEdit(employee);
  };

  const handleDeleteClick = (e) => {
    e.stopPropagation();
    onDelete(employee);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden cursor-pointer group relative"
      onClick={() => onClick(employee)}
    >
      {/* Action Buttons */}
      <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
        <button 
          onClick={handleEditClick} 
          className="p-1.5 bg-gray-200 rounded-lg shadow-md hover:bg-gray-300" 
          title="Edit"
        >
          <Edit size={14} className="text-gray-700" />
        </button>
        <button 
          onClick={handleDeleteClick} 
          className="p-1.5 bg-gray-200 rounded-lg shadow-md hover:bg-red-100" 
          title="Delete"
        >
          <Trash2 size={14} className="text-gray-700 hover:text-red-700" />
        </button>
      </div>

      {/* Card Content */}
      <div className="p-6 flex flex-col items-center text-center">
        {/* Avatar */}
        <div className="w-20 h-20 rounded-full bg-gray-200 mb-4 overflow-hidden border-4 border-white shadow-sm">
          {employee.avatar_url ? (
            <img 
              src={employee.avatar_url} 
              alt={employee.first_name} 
              className="w-full h-full object-cover" 
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-600 text-xl font-bold">
              {employee.first_name[0]}{employee.last_name[0]}
            </div>
          )}
        </div>

        {/* Name & Title */}
        <h3 className="font-bold text-gray-800 group-hover:text-gray-600 transition-colors">
          {employee.first_name} {employee.last_name}
        </h3>
        <span className="text-xs font-medium px-2 py-1 bg-gray-100 text-gray-600 rounded-full mt-2">
          {employee.job_title || 'Employee'}
        </span>

        {/* Contact Info */}
        <div className="w-full mt-6 space-y-3">
          <div className="flex items-center gap-3 text-sm text-gray-500">
            <Mail size={16} className="text-gray-400" />
            <span className="truncate">{employee.email}</span>
          </div>
          <div className="flex items-center gap-3 text-sm text-gray-500">
            <Users size={16} className="text-gray-400" />
            <span>{employee.department}</span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-gray-50 px-6 py-3 flex justify-between items-center border-t border-gray-100 text-xs text-gray-500">
        <span>ID: {employee.employee_id}</span>
        <span className={`px-2 py-0.5 rounded-full ${getStatusBadgeClass(employee.employment_status)}`}>
          {employee.employment_status || 'Active'}
        </span>
      </div>
    </motion.div>
  );
};

export default EmployeeCard;
