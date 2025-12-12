import { Clock, CheckCircle, XCircle } from 'lucide-react';

export const StatusBadge = ({ status }) => {
  const styles = {
    Pending: 'bg-amber-100 text-amber-700 border-amber-200',
    Approved: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    Rejected: 'bg-red-100 text-red-700 border-red-200'
  };
  const icons = {
    Pending: <Clock className="w-3 h-3" />,
    Approved: <CheckCircle className="w-3 h-3" />,
    Rejected: <XCircle className="w-3 h-3" />
  };
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${styles[status] || styles.Pending}`}>
      {icons[status]}{status}
    </span>
  );
};
