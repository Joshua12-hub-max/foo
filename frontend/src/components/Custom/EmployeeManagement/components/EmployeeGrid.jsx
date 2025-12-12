import EmployeeCard from './EmployeeCard';

/**
 * Employee Grid Component
 * Renders a responsive grid of employee cards with loading state
 */
const EmployeeGrid = ({
  employees,
  loading,
  onEmployeeClick,
  onEditEmployee,
  onDeleteEmployee
}) => {
  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-600"></div>
      </div>
    );
  }

  if (employees.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No employees found</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {employees.map((employee) => (
        <EmployeeCard
          key={employee.id}
          employee={employee}
          onClick={onEmployeeClick}
          onEdit={onEditEmployee}
          onDelete={onDeleteEmployee}
        />
      ))}
    </div>
  );
};

export default EmployeeGrid;
