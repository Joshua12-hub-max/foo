import { useState, useEffect } from 'react';
import { Search, Plus, SquarePen, Trash2, Megaphone, CalendarDays, Building2, Clock, User, Loader2 } from 'lucide-react';

import { CalendarEvent, Announcement } from '@/types/calendar';
import { scheduleApi } from '@/api/scheduleApi';

interface AdminAgendaViewProps {
  events?: CalendarEvent[];
  announcements?: Announcement[];
  onAddEvent?: () => void;
  onEditEvent?: (event: CalendarEvent) => void;
  onDeleteEvent?: (event: CalendarEvent) => void;
  onAddAnnouncement?: () => void;
  onEditAnnouncement?: (announcement: Announcement) => void;
  onDeleteAnnouncement?: (announcement: Announcement) => void;
}

interface DeptSchedule {
    id: number;
    departmentName: string;
    employeeId: string;
    employeeName: string;
    startTime: string;
    endTime: string;
}

const AdminAgendaView = ({ events = [], announcements = [], onAddEvent, onEditEvent, onDeleteEvent, onAddAnnouncement, onEditAnnouncement, onDeleteAnnouncement }: AdminAgendaViewProps) => {
  const [activeTab, setActiveTab] = useState('announcements');
  const [searchQuery, setSearchQuery] = useState('');
  const [deptSchedules, setDeptSchedules] = useState<DeptSchedule[]>([]);
  const [loadingDept, setLoadingDept] = useState(false);

  useEffect(() => {
      if (activeTab === 'dept-schedules') {
          fetchDeptSchedules();
      }
  }, [activeTab]);

  const fetchDeptSchedules = async () => {
      setLoadingDept(true);
      try {
          const res = await scheduleApi.getDepartmentSchedules();
          if (res.success) {
              setDeptSchedules(res.schedules || []);
          }
      } catch (err) {
          console.error('Failed to fetch dept schedules:', err);
      } finally {
          setLoadingDept(false);
      }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatTime = (time: string | number | null) => {
    if (time === null || (typeof time === 'undefined')) return 'N/A';
    if (typeof time === 'string' && time.includes(':')) {
        // Handle HH:mm:ss format
        const [h, m] = time.split(':');
        let hour = parseInt(h);
        const period = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
        return `${displayHour}:${m} ${period}`;
    }
    const hour = typeof time === 'string' ? parseInt(time) : time;
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    return `${displayHour}:00 ${period}`;
  };

  // Filter items based on search query
  const filterItems = <T extends Record<string, any>>(items: T[], fields: (keyof T)[]) => {
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
  const filteredDeptSchedules = filterItems(deptSchedules, ['departmentName', 'employeeName', 'employeeId']);

  const tabs = [
    { id: 'announcements', label: 'Announcements', icon: Megaphone, count: filteredAnnouncements.length },
    { id: 'events', label: 'Events', icon: CalendarDays, count: filteredEvents.length },
    { id: 'dept-schedules', label: 'Dept Schedules', icon: Building2, count: filteredDeptSchedules.length }
  ];

  const getAddHandler = () => {
    switch (activeTab) {
      case 'announcements': return onAddAnnouncement;
      case 'events': return onAddEvent;
      default: return undefined;
    }
  };

  const getAddLabel = () => {
    switch (activeTab) {
      case 'announcements': return 'New Announcement';
      case 'events': return 'New Event';
      default: return 'Add New';
    }
  };

  // Empty State Component
  const EmptyState = ({ message }: { message: string }) => (
    <tr>
      <td colSpan={100} className="px-6 py-12 text-center text-gray-500">
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
          <div className="flex gap-2 flex-wrap">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center rounded-lg gap-2 px-4 py-2 font-medium text-sm transition-all ${
                  activeTab === tab.id
                    ? 'bg-blue-100 text-blue-700 shadow-sm border border-blue-200'
                    : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
                <span className={`px-2 py-0.5 rounded-lg text-xs ${
                  activeTab === tab.id ? 'bg-blue-200 text-blue-800' : 'bg-gray-100 text-gray-500'
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
                className="pl-10 pr-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all disabled:opacity-50"
              />
            </div>
            {activeTab !== 'dept-schedules' && (
                <button
                onClick={getAddHandler()}
                className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors text-sm font-medium shadow-md active:scale-95"
                >
                <Plus className="w-4 h-4" />
                {getAddLabel()}
                </button>
            )}
          </div>
        </div>
      </div>

      {/* Table Content */}
      <div className="flex-1 overflow-auto">
        <div className="overflow-hidden">
          {/* Announcements Table */}
          {activeTab === 'announcements' && (
            <table className="w-full">
              <thead className="bg-gray-50 text-gray-700 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">Title</th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">Content</th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">Start Date</th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">End Date</th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">Created</th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">Actions</th>
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
                      <td className="px-6 py-4 text-sm text-gray-600">{formatDate(item.startDate)}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{formatDate(item.endDate)}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{formatDate(item.createdAt)}</td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              onEditAnnouncement?.(item);
                            }}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit Announcement"
                          >
                            <SquarePen className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onDeleteAnnouncement && onDeleteAnnouncement(item)}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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
              <thead className="bg-gray-50 text-gray-700 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">Title</th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">Description</th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">Date</th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">Time</th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">Recurring</th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {filteredEvents.length > 0 ? (
                  filteredEvents.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{item.title}</td>
                      <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate" title={item.description || undefined}>
                        {item.description || '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{formatDate(item.date)}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{formatTime(item.time)}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 text-[10px] font-bold uppercase rounded ${
                          item.recurringPattern && item.recurringPattern !== 'none'
                            ? 'bg-purple-100 text-purple-700'
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          {item.recurringPattern && item.recurringPattern !== 'none' 
                            ? item.recurringPattern 
                            : 'None'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => onEditEvent && onEditEvent(item)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <SquarePen className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onDeleteEvent && onDeleteEvent(item)}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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

          {/* Department Schedules Table */}
          {activeTab === 'dept-schedules' && (
            <div className="relative">
                {loadingDept && (
                    <div className="absolute inset-0 bg-white/60 flex items-center justify-center z-10">
                        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                    </div>
                )}
                <table className="w-full">
                <thead className="bg-blue-50 text-blue-900 border-b border-blue-100">
                    <tr>
                    <th className="px-6 py-4 text-left text-xs font-black uppercase tracking-wider">Department</th>
                    <th className="px-6 py-4 text-left text-xs font-black uppercase tracking-wider">Employee</th>
                    <th className="px-6 py-4 text-left text-xs font-black uppercase tracking-wider">Default Shift</th>
                    <th className="px-6 py-4 text-left text-xs font-black uppercase tracking-wider">Status</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                    {filteredDeptSchedules.length > 0 ? (
                    filteredDeptSchedules.map((item, idx) => (
                        <tr key={idx} className="hover:bg-blue-50/30 transition-colors group">
                        <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                                <Building2 size={14} className="text-blue-400" />
                                <span className="text-sm font-bold text-gray-900">{item.departmentName}</span>
                            </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex flex-col">
                                <span className="text-sm font-semibold text-gray-800">{item.employeeName}</span>
                                <span className="text-[10px] text-gray-400 font-mono">{item.employeeId}</span>
                            </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100 w-fit group-hover:border-blue-200 transition-colors">
                                <Clock size={14} className="text-blue-500" />
                                <span className="text-sm font-mono font-bold text-blue-700">
                                    {formatTime(item.startTime)} — {formatTime(item.endTime)}
                                </span>
                            </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-green-100 text-green-700">
                                <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                                Active Shift
                            </span>
                        </td>
                        </tr>
                    ))
                    ) : (
                    <EmptyState message={loadingDept ? "Fetching schedules..." : "No department schedules found"} />
                    )}
                </tbody>
                </table>
            </div>
          )}


        </div>
      </div>
    </div>
  );
};

export default AdminAgendaView;
