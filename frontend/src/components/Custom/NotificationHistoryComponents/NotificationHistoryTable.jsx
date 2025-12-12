import { Search } from 'lucide-react';

export const NotificationHistoryTable = ({ notifications, isLoading, isAdmin = true }) => {
  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleString();
  };

  const getStatusBadge = (status) => {
    const styles = {
      unread: 'bg-blue-100 text-blue-800',
      read: 'bg-gray-100 text-gray-600'
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status] || styles.unread}`}>
        {status || 'unread'}
      </span>
    );
  };

  const getTypeBadge = (type) => {
    const typeColors = {
      announcement_created: 'bg-purple-100 text-purple-800',
      event_created: 'bg-green-100 text-green-800',
      schedule_assigned: 'bg-blue-100 text-blue-800',
      schedule_updated: 'bg-yellow-100 text-yellow-800',
      schedule_created: 'bg-teal-100 text-teal-800',
      leave_approved: 'bg-emerald-100 text-emerald-800',
      leave_rejected: 'bg-red-100 text-red-800',
      default: 'bg-gray-100 text-gray-800'
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${typeColors[type] || typeColors.default}`}>
        {type ? type.replace(/_/g, ' ') : '-'}
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
        <div className="animate-spin w-8 h-8 border-2 border-teal-600 border-t-transparent rounded-full mx-auto mb-4"></div>
        <p className="text-gray-500">Loading notifications...</p>
      </div>
    );
  }

  if (!notifications || notifications.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
        <Search className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500">No records found</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Date</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Title</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Message</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Type</th>
              {isAdmin && (
                <>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Recipient</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Department</th>
                </>
              )}
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {notifications.map((notification) => (
              <tr key={notification.notification_id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">
                  {formatDate(notification.created_at)}
                </td>
                <td className="px-4 py-3 text-sm text-gray-800 font-medium max-w-[200px] truncate">
                  {notification.title || '-'}
                </td>
                <td className="px-4 py-3 text-sm text-gray-600 max-w-[300px] truncate">
                  {notification.message || '-'}
                </td>
                <td className="px-4 py-3">
                  {getTypeBadge(notification.type)}
                </td>
                {isAdmin && (
                  <>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {notification.recipient_name || '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {notification.recipient_department || '-'}
                    </td>
                  </>
                )}
                <td className="px-4 py-3">
                  {getStatusBadge(notification.status)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
