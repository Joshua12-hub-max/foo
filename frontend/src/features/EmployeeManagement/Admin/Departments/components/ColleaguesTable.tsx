import React, { memo, useMemo } from 'react';
import { Users, Briefcase, Mail } from 'lucide-react';

interface Colleague {
  id: number;
  firstName?: string;
  lastName?: string;
  employeeId?: string;
  positionTitle?: string;
  jobTitle?: string;
  email?: string;
}

interface ColleagueRowProps {
  colleague: Colleague;
}

// Memoized table row component
const ColleagueRow: React.FC<ColleagueRowProps> = memo(({ colleague }) => {
  return (
    <tr className="hover:bg-gray-50 transition-colors">
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 font-medium text-sm">
            {colleague.firstName?.[0]}{colleague.lastName?.[0]}
          </div>
          <div>
            <p className="font-medium text-gray-800 text-sm">
              {colleague.firstName} {colleague.lastName}
            </p>
            <p className="text-xs text-gray-400">{colleague.employeeId}</p>
          </div>
        </div>
      </td>
      <td className="px-6 py-4">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Briefcase className="w-4 h-4 text-gray-400" />
          {colleague.positionTitle || colleague.jobTitle || 'N/A'}
        </div>
      </td>
      <td className="px-6 py-4">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Mail className="w-4 h-4 text-gray-400" />
          {colleague.email}
        </div>
      </td>
    </tr>
  );
});

ColleagueRow.displayName = 'ColleagueRow';

interface ColleaguesTableProps {
  colleagues: Colleague[];
}

const ColleaguesTable: React.FC<ColleaguesTableProps> = memo(({ colleagues }) => {
  // Memoize the rows rendering
  const tableRows = useMemo(() => {
    return colleagues.map((colleague) => (
      <ColleagueRow key={colleague.id} colleague={colleague} />
    ));
  }, [colleagues]);

  if (colleagues.length === 0) {
    return (
      <div className="p-8 text-center text-gray-400">
        <Users className="w-10 h-10 mx-auto mb-2 text-gray-300" />
        <p>No colleagues found in your department</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="bg-gray-200 text-gray-600 text-xs uppercase tracking-wide shadow-sm">
            <th className="px-6 py-3 text-left font-semibold">Employee</th>
            <th className="px-6 py-3 text-left font-semibold">Position</th>
            <th className="px-6 py-3 text-left font-semibold">Email</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {tableRows}
        </tbody>
      </table>
    </div>
  );
});

ColleaguesTable.displayName = 'ColleaguesTable';

export default ColleaguesTable;
