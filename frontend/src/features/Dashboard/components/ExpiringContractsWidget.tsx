import React, { useEffect, useState } from 'react';
import { Clock, AlertTriangle } from 'lucide-react';
import { differenceInDays, parseISO } from 'date-fns';
import api from '@api/axios';

interface Employee {
  id: number;
  first_name: string;
  last_name: string;
  contract_end_date: string;
  department: string;
}

const ExpiringContractsWidget: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchExpiring = async () => {
      try {
        // Since we don't have a specific endpoint yet, we might need to fetch all and filter client-side
        // OR ideally use the new endpoint '/api/employees/alerts/expiring-contracts' if we implemented it.
        // For now, let's assume we can fetch employees and filter.
        const response = await api.get('/employees');
        if (response.data.success) {
            const allEmployees: Employee[] = response.data.employees;
            const now = new Date();
            const expiring = allEmployees.filter(emp => {
                if (!emp.contract_end_date) return false;
                const endDate = parseISO(emp.contract_end_date);
                const daysLeft = differenceInDays(endDate, now);
                return daysLeft >= 0 && daysLeft <= 30;
            });
            setEmployees(expiring);
        }
      } catch (error) {
        console.error('Failed to fetch expiring contracts', error);
      } finally {
        setLoading(false);
      }
    };

    fetchExpiring();
  }, []);

  if (loading) return <div className="p-4 bg-white rounded-xl shadow-sm h-40 animate-pulse bg-gray-100" />;

  if (employees.length === 0) return null;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-orange-100 overflow-hidden">
      <div className="bg-orange-50 px-4 py-3 border-b border-orange-100 flex items-center gap-2">
        <AlertTriangle className="text-orange-500" size={18} />
        <h3 className="font-semibold text-orange-900">Expiring Contracts ({employees.length})</h3>
      </div>
      <div className="p-2 max-h-60 overflow-y-auto">
        {employees.map(emp => (
          <div key={emp.id} className="p-3 hover:bg-orange-50/50 rounded-lg transition-colors flex justify-between items-center group">
             <div>
                <p className="font-medium text-gray-900">{emp.first_name} {emp.last_name}</p>
                <p className="text-xs text-gray-500">{emp.department}</p>
             </div>
             <div className="text-right">
                <span className="text-xs font-bold text-orange-600 bg-orange-100 px-2 py-1 rounded-full">
                    {differenceInDays(parseISO(emp.contract_end_date), new Date())} days left
                </span>
             </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ExpiringContractsWidget;
