import React from 'react';

type StatusType = 'Present' | 'Late' | 'Absent' | 'Pending';

interface StatusBadgeProps {
  status: StatusType | string;
}

const styles: Record<string, string> = {
  Present: 'bg-green-100 text-green-700 border-green-200',
  Late: 'bg-amber-100 text-amber-700 border-amber-200',
  Absent: 'bg-red-100 text-red-700 border-red-200',
  Pending: 'bg-blue-100 text-blue-700 border-blue-200',
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  return (
    <span className={`px-2.5 py-1 text-[10px] font-black tracking-wider rounded-lg border ${styles[status] || 'bg-gray-100 text-gray-600 border-gray-200'}`}>
      {status}
    </span>
  );
};

export default StatusBadge;
