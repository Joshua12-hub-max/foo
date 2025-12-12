import { useState } from 'react';
import { Search, Plus, SquarePen, Trash2, Megaphone, CalendarDays, Users } from 'lucide-react';

const AdminAgendaView = ({ events = [], announcements = [], schedules = [], onAddEvent, onEditEvent, onDeleteEvent, onAddAnnouncement, onEditAnnouncement, onDeleteAnnouncement, onAddSchedule, onEditSchedule, onDeleteSchedule }) => {
  const [activeTab, setActiveTab] = useState('announcements');
  const [searchQuery, setSearchQuery] = useState('');

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatTime = (time) => {
    if (!time && time !== 0) return 'N/A';
    if (typeof time === 'string' && time.includes(':')) return time;
    const hour = parseInt(time);
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    return `${displayHour}:00 ${period}`;
  };

  // Filter items based on search query
  const filterItems = (items, fields) => {
    if (!searchQuery) return items;
    const query = searchQuery.toLowerCase();
    return items.filter(item => 
      fields.some(field => {
        const value = item[field];
        return value && value.toString().toLowerCase().includes(query);
      })
    );
  };

  const filteredAnnouncements = filterItems(announcements, ['title', 'content']);
  const filteredEvents = filterItems(events, ['title', 'description']);
  const filteredSchedules = filterItems(schedules, ['employee_name', 'scheduleName', 'schedule_title', 'title', 'description']);

  const tabs = [
    { id: 'announcements', label: 'Announcements', icon: Megaphone, count: filteredAnnouncements.length },
    { id: 'events', label: 'Events', icon: CalendarDays, count: filteredEvents.length },
    { id: 'schedules', label: 'Schedules', icon: Users, count: filteredSchedules.length }
  ];

  const getAddHandler = () => {
    switch (activeTab) {
      case 'announcements': return onAddAnnouncement;
      case 'events': return onAddEvent;
      case 'schedules': return onAddSchedule;
      default: return null;
    }
  };

  const getAddLabel = () => {
    switch (activeTab) {
      case 'announcements': return 'New Announcement';
      case 'events': return 'New Event';
      case 'schedules': return 'New Schedule';
      default: return 'Add New';
    }
  };

  // Empty State Component
  const EmptyState = ({ message }) => (
    <tr>
      <td colSpan="100%" className="px-6 py-12 text-center text-gray-500">
        <Search className="w-10 h-10 mx-auto mb-3 opacity-40" />
        <p className="text-lg">{message}</p>
      </td>
    </tr>
  );

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header with Tabs */}
      <div className="bg-[#F8F9FA] border-b border-gray-200 py-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          {/* Tabs */}
          <div className="flex gap-2">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center rounded-lg gap-2 px-4 py-2 font-medium text-sm transition-all ${
                  activeTab === tab.id
                    ? 'bg-gray-200 text-gray-600 shadow-md'
                    : 'bg-gray-200 text-gray-600 hover:bg-gray-200 border border-gray-300'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
                <span className={`px-2 py-0.5 rounded-lg text-xs ${
                  activeTab === tab.id ? 'bg-gray-200 text-gray-600' : 'bg-gray-200 text-gray-600'
                }`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Search and Add */}
          <div className="flex gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search..."
                className="pl-10 pr-4 py-2 bg-white border border-gray-300 rounded-lg shadow-md w-full text-sm focus:outline-none focus:ring-2 focus:ring-gray-200 focus:border-gray-200 transition-all disabled:opacity-50"
              />
            </div>
            <button
              onClick={getAddHandler()}
              className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium shadow-md"
            >
              <Plus className="w-4 h-4" />
              {getAddLabel()}
            </button>
          </div>
        </div>
      </div>

      {/* Table Content */}
      <div className="flex-1 overflow-auto">
        <div className="bg-gray-200 shadow-md overflow-hidden">
          {/* Announcements Table */}
          {activeTab === 'announcements' && (
            <table className="w-full">
              <thead className="bg-gray-200 text-gray-700">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-bold">Title</th>
                  <th className="px-6 py-4 text-left text-sm font-bold">Content</th>
                  <th className="px-6 py-4 text-left text-sm font-bold">Start Date</th>
                  <th className="px-6 py-4 text-left text-sm font-bold">End Date</th>
                  <th className="px-6 py-4 text-left text-sm font-bold">Created</th>
                  <th className="px-6 py-4 text-left text-sm font-bold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {filteredAnnouncements.length > 0 ? (
                  filteredAnnouncements.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{item.title}</td>
                      <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate" title={item.content}>
                        {item.content}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{formatDate(item.start_date)}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{formatDate(item.end_date)}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{formatDate(item.created_at)}</td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => onEditAnnouncement(item)}
                            className="p-1.5 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors"
                            title="Edit"
                          >
                            <SquarePen className="w-4 h-4 text-blue-800" />
                          </button>
                          <button
                            onClick={() => onDeleteAnnouncement(item)}
                            className="p-1.5 bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <EmptyState message="No announcements found" />
                )}
              </tbody>
            </table>
          )}

          {/* Events Table */}
          {activeTab === 'events' && (
            <table className="w-full">
              <thead className="bg-gray-200 shadow-md text-gray-700">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-bold">Title</th>
                  <th className="px-6 py-4 text-left text-sm font-bold">Description</th>
                  <th className="px-6 py-4 text-left text-sm font-bold">Date</th>
                  <th className="px-6 py-4 text-left text-sm font-bold">Time</th>
                  <th className="px-6 py-4 text-left text-sm font-bold">Recurring</th>
                  <th className="px-6 py-4 text-left text-sm font-bold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {filteredEvents.length > 0 ? (
                  filteredEvents.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{item.title}</td>
                      <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate" title={item.description}>
                        {item.description || '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{formatDate(item.date)}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{formatTime(item.time)}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          item.recurring_pattern && item.recurring_pattern !== 'none'
                            ? 'bg-purple-100 text-purple-700'
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          {item.recurring_pattern && item.recurring_pattern !== 'none' 
                            ? item.recurring_pattern 
                            : 'None'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => onEditEvent(item)}
                            className="p-1.5 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors"
                            title="Edit"
                          >
                            <SquarePen className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onDeleteEvent(item)}
                            className="p-1.5 bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <EmptyState message="No events found" />
                )}
              </tbody>
            </table>
          )}

          {/* Schedules Table */}
          {activeTab === 'schedules' && (
            <table className="w-full">
              <thead className="bg-gray-200 shadow-md text-gray-700">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-bold">Employee</th>
                  <th className="px-6 py-4 text-left text-sm font-bold">Title</th>
                  <th className="px-6 py-4 text-left text-sm font-bold">Start Date</th>
                  <th className="px-6 py-4 text-left text-sm font-bold">End Date</th>
                  <th className="px-6 py-4 text-left text-sm font-bold">Time</th>
                  <th className="px-6 py-4 text-left text-sm font-bold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {filteredSchedules.length > 0 ? (
                  filteredSchedules.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        {item.employeeName || item.employee_name || item.employee_id || 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{item.scheduleName || item.schedule_title || item.title || '-'}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{formatDate(item.start_date)}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{formatDate(item.end_date)}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {item.start_time || 'N/A'} - {item.end_time || 'N/A'}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => onEditSchedule(item)}
                            className="p-1.5 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors"
                            title="Edit"
                          >
                            <SquarePen className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onDeleteSchedule(item)}
                            className="p-1.5 bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <EmptyState message="No schedules found" />
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminAgendaView;

