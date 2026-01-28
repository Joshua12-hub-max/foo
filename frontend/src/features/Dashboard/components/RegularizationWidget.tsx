import React, { useEffect, useState } from 'react';
import { UserCheck, Calendar } from 'lucide-react';
import { differenceInDays, parseISO, format } from 'date-fns';
import api from '@api/axios';

interface Employee {
  id: number;
  first_name: string;
  last_name: string;
  regularization_date: string;
  department: string;
}

const RegularizationWidget: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRegularization = async () => {
      try {
        const response = await api.get('/employees');
        if (response.data.success) {
            const allEmployees: Employee[] = response.data.employees;
            const now = new Date();
            const due = allEmployees.filter(emp => {
                if (!emp.regularization_date) return false;
                const regDate = parseISO(emp.regularization_date);
                const daysLeft = differenceInDays(regDate, now);
                return daysLeft <= 30 && daysLeft >= -30; // Upcoming in 30 days or overdue by 30 days
            });
            setEmployees(due);
        }
      } catch (error) {
        console.error('Failed to fetch regularization list', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRegularization();
  }, []);

  if (loading) return <div className="p-4 bg-white rounded-xl shadow-sm h-40 animate-pulse bg-gray-100" />;

  if (employees.length === 0) return null;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-blue-100 overflow-hidden">
      <div className="bg-blue-50 px-4 py-3 border-b border-blue-100 flex items-center gap-2">
        <UserCheck className="text-blue-500" size={18} />
        <h3 className="font-semibold text-blue-900">Due for Regularization ({employees.length})</h3>
      </div>
      <div className="p-2 max-h-60 overflow-y-auto">
        {employees.map(emp => (
          <div key={emp.id} className="p-3 hover:bg-blue-50/50 rounded-lg transition-colors flex justify-between items-center group">
             <div>
                <p className="font-medium text-gray-900">{emp.first_name} {emp.last_name}</p>
                <p className="text-xs text-gray-500">{emp.department}</p>
             </div>
             <div className="text-right">
                <p className="text-xs text-gray-500 flex items-center gap-1 justify-end">
                    <Calendar size={12} />
                    {format(parseISO(emp.regularization_date), 'MMM d, yyyy')}
                </p>
             </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RegularizationWidget;
