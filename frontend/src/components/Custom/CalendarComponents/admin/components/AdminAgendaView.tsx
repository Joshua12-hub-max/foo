import { Loader2, SquarePen, Trash2, Search, Plus } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

import { CalendarEvent, Announcement, Schedule } from '@/types/calendar';
import { scheduleApi } from '@/api/scheduleApi';
import { useState } from 'react';

interface AdminAgendaViewProps {
  events?: CalendarEvent[];
  announcements?: Announcement[];
  schedules?: Schedule[];
  onAddEvent?: () => void;
  onEditEvent?: (event: CalendarEvent) => void;
  onDeleteEvent?: (event: CalendarEvent) => void;
  onAddAnnouncement?: () => void;
  onEditAnnouncement?: (announcement: Announcement) => void;
  onDeleteAnnouncement?: (announcement: Announcement) => void;
}

interface Shift {
    startTime: string | null;
    endTime: string | null;
    isStandard: boolean;
    personnelCount: number;
}

interface DeptSchedule {
    id: number;
    departmentName: string;
    shifts: Shift[];
    totalStrength: number;
}

interface NextCutOffSchedule {
    id: number;
    employeeId: string;
    employeeName: string;
    departmentName: string;
    scheduleTitle: string;
    startDate: string;
    endDate: string;
    startTime: string;
    endTime: string;
    dayOfWeek: string;
}

const AdminAgendaView = ({ 
  events = [], 
  announcements = [], 
  schedules = [],
  onAddEvent, 
  onEditEvent, 
  onDeleteEvent, 
  onAddAnnouncement, 
  onEditAnnouncement, 
  onDeleteAnnouncement 
}: AdminAgendaViewProps) => {
  const [activeTab, setActiveTab] = useState('schedules');
  const [searchQuery, setSearchQuery] = useState('');


  const { data: summaryData, isLoading: loadingSummary } = useQuery({
      queryKey: ['department-schedules-summary'],
      queryFn: async () => {
          const res = await scheduleApi.getDepartmentSchedulesSummary();
          return res.data || [];
      },
      enabled: activeTab === 'schedules'
  });

  const { data: nextCutOffData, isLoading: loadingNext } = useQuery({
      queryKey: ['next-cutoff-schedules'],
      queryFn: async () => {
          const res = await scheduleApi.getNextCutOffSchedules();
          return {
              schedules: res.schedules || [],
              period: res.period || null
          };
      },
      enabled: activeTab === 'next-cutoff'
  });

  const deptSummary = summaryData || [];
  const nextCutOffSchedules = nextCutOffData?.schedules || [];
  const cutOffPeriod = nextCutOffData?.period || null;

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatTime = (time: string | number | null) => {
    if (time === null || (typeof time === 'undefined')) return 'N/A';
    if (typeof time === 'string' && time.includes(':')) {
        // Handle HH:mm:ss format
        const [h, m] = time.split(':');
        const hour = parseInt(h);
        const period = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
        return `${displayHour}:${m} ${period}`;
    }
    const hour = typeof time === 'string' ? parseInt(time) : time;
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    return `${displayHour}:00 ${period}`;
  };

  // Filter items based on search query (Zero Type Erasure compliant)
  const filterItems = <T,>(items: T[], fields: (keyof T)[]) => {
    if (!searchQuery) return items;
    const query = searchQuery.toLowerCase();
    return items.filter(item => 
      fields.some(field => {
        const value = (item as Record<string, unknown>)[field as string];
        return value !== null && typeof value !== 'undefined' && String(value).toLowerCase().includes(query);
      })
    );
  };

  const filteredAnnouncements = filterItems(announcements, ['title', 'content']);
  const filteredEvents = filterItems(events, ['title', 'description']);
  const filteredSchedules = filterItems(schedules, ['employeeName', 'employeeId', 'scheduleTitle', 'department']);
  const filteredNextCutOffSchedules = filterItems(nextCutOffSchedules, ['departmentName', 'employeeName', 'scheduleTitle']);
  const filteredDeptSummary = filterItems(deptSummary as DeptSchedule[], ['departmentName']);

  // Grouped data for better organization (Nested: Dept -> Shift -> Items)
  const groupedSchedules = (filteredSchedules as Schedule[]).reduce((acc: Record<string, Record<string, Schedule[]>>, item) => {
    const dept = item.department || 'Unassigned';
    const startTime = (item as any).startTime ?? null;
    const endTime = (item as any).endTime ?? null;
    const shift = `${formatTime(startTime)} - ${formatTime(endTime)}`;
    if (!acc[dept]) acc[dept] = {};
    if (!acc[dept][shift]) acc[dept][shift] = [];
    acc[dept][shift].push(item);
    return acc;
  }, {});

  const groupedNextCutOff = (filteredNextCutOffSchedules as NextCutOffSchedule[]).reduce((acc: Record<string, Record<string, NextCutOffSchedule[]>>, item) => {
    const dept = item.departmentName || 'Unassigned';
    const shift = `${formatTime(item.startTime)} - ${formatTime(item.endTime)}`;
    if (!acc[dept]) acc[dept] = {};
    if (!acc[dept][shift]) acc[dept][shift] = [];
    acc[dept][shift].push(item);
    return acc;
  }, {});

  // Count unique employees for Next Cut-off badge (not inflated row count)
  const uniqueNextCutOffEmployees = new Set((filteredNextCutOffSchedules as NextCutOffSchedule[]).map(s => s.employeeId)).size;

  const tabs = [
    { id: 'schedules', label: 'Current Shift', count: filteredDeptSummary.length },
    { id: 'announcements', label: 'Announcements', count: filteredAnnouncements.length },
    { id: 'events', label: 'Events', count: filteredEvents.length },
    { id: 'next-cutoff', label: 'Next Cut-off Table', count: uniqueNextCutOffEmployees }
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
      default: return undefined;
    }
  };

  // Empty State Component
  const EmptyState = ({ message }: { message: string }) => (
    <tr>
      <td colSpan={100} className="px-6 py-12 text-center text-gray-500">
        <p className="text-lg font-semibold">{message}</p>
      </td>
    </tr>
  );

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header with Tabs */}
      <div className="bg-[#F8F9FA] border-b border-gray-200 py-4">
        <div className="flex flex-col gap-4">
          {/* Tabs */}
          <div className="flex gap-2 overflow-x-auto px-4 scrollbar-hide flex-nowrap min-w-0">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center rounded-lg gap-2 px-4 py-2 font-semibold text-sm transition-all flex-shrink-0 ${
                  activeTab === tab.id
                    ? 'bg-gray-200 text-gray-900 shadow-sm border border-gray-300'
                    : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                }`}
              >
                {tab.label}
                <span className={`px-2 py-0.5 rounded-lg text-xs ${
                  activeTab === tab.id ? 'bg-gray-300 text-gray-900' : 'bg-gray-100 text-gray-500'
                }`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

            {/* Search and Add */}
            <div className="flex flex-row items-center justify-between gap-4 px-4">
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search assignments..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/5 font-semibold text-gray-700 shadow-sm focus:border-gray-300 transition-all"
                />
              </div>
              
              {getAddHandler() && (
                <button
                  onClick={getAddHandler()}
                  className="px-6 py-2.5 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-all flex items-center justify-center gap-2.5 text-sm font-bold shadow-lg shadow-gray-200 active:scale-95 whitespace-nowrap"
                >
                  <Plus className="w-4 h-4 stroke-[3px]" />
                  {getAddLabel()}
                </button>
              )}
            </div>
        </div>
      </div>

      {/* Table Content */}
      <div className="flex-1 overflow-auto">
        <div className="overflow-hidden">
          {/* Active Schedules - Department Level Summary Table */}
          {activeTab === 'schedules' && (
            <div className="p-4">
              <div className="overflow-x-auto bg-gray-50 rounded-lg shadow-sm border border-gray-100">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-gray-200 shadow-md text-gray-700">
                    <tr>
                      <th className="px-6 py-4 text-sm font-semibold tracking-wide whitespace-nowrap">Department Unit</th>
                      <th className="px-6 py-4 text-sm font-semibold tracking-wide whitespace-nowrap text-center">Duty Window</th>
                      <th className="px-6 py-4 text-sm font-semibold tracking-wide whitespace-nowrap text-right">Total Strength</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {loadingSummary ? (
                       <tr>
                         <td colSpan={3} className="py-20 text-center">
                            <Loader2 className="w-8 h-8 animate-spin mx-auto text-gray-400" />
                            <p className="mt-2 text-sm text-gray-500 font-medium">Loading Department Summary...</p>
                         </td>
                       </tr>
                    ) : filteredDeptSummary.length > 0 ? (
                       filteredDeptSummary.map((item) => (
                        <tr key={item.id} className="hover:bg-[#F8F9FA] hover:shadow-xl transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-3">
                              <span className="text-sm font-semibold text-gray-900 uppercase tracking-tight">{item.departmentName}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-wrap gap-3 justify-center">
                              {item.shifts.map((shift, idx) => (
                                <div 
                                  key={`${item.id}-${idx}`} 
                                  className={`flex flex-col items-center px-4 py-2 rounded-lg border shadow-sm transition-all ${
                                    shift.isStandard 
                                      ? 'bg-emerald-50 border-emerald-100 text-emerald-900 ring-2 ring-emerald-500/20' 
                                      : 'bg-blue-50/50 border-blue-100/50 text-blue-900'
                                  }`}
                                >
                                  <div className="flex items-center gap-1.5 mb-0.5">
                                    <span className={`text-[10px] font-black uppercase tracking-tight ${shift.isStandard ? 'text-emerald-700' : 'text-blue-600'}`}>
                                      {formatTime(shift.startTime)} - {formatTime(shift.endTime)}
                                    </span>
                                    {shift.isStandard && (
                                      <span className="bg-emerald-600 text-white text-[8px] font-black px-1.5 py-0.5 rounded uppercase leading-none">Standard</span>
                                    )}
                                  </div>
                                  <span className="text-[11px] font-bold">{shift.personnelCount} Personnel</span>
                                </div>
                              ))}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right whitespace-nowrap">
                            <span className="text-sm font-semibold text-gray-900">
                              {item.totalStrength} Total Active
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <EmptyState message="No departments found" />
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Announcements Table */}
          {activeTab === 'announcements' && (
            <table className="w-full">
              <thead className="bg-gray-200 shadow-md text-gray-700">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold tracking-wide whitespace-nowrap">Title</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold tracking-wide whitespace-nowrap">Content</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold tracking-wide whitespace-nowrap">Start Date</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold tracking-wide whitespace-nowrap">End Date</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold tracking-wide whitespace-nowrap">Created</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold tracking-wide whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {filteredAnnouncements.length > 0 ? (
                  filteredAnnouncements.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4 text-sm font-semibold text-gray-900">{item.title}</td>
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
                            className="p-1 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors flex items-center gap-1.5 text-xs font-semibold border border-gray-200"
                            title="Edit"
                          >
                            <SquarePen className="w-3.5 h-3.5" />
                            Edit
                          </button>
                          <button
                            onClick={() => onDeleteAnnouncement && onDeleteAnnouncement(item)}
                            className="p-1 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors flex items-center gap-1.5 text-xs font-semibold border border-gray-200"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            Delete
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
                  <th className="px-6 py-4 text-left text-sm font-semibold tracking-wide whitespace-nowrap">Title</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold tracking-wide whitespace-nowrap">Description</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold tracking-wide whitespace-nowrap">Date</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold tracking-wide whitespace-nowrap">Time</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold tracking-wide whitespace-nowrap">Recurring</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold tracking-wide whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {filteredEvents.length > 0 ? (
                  filteredEvents.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4 text-sm font-semibold text-gray-900">{item.title}</td>
                      <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate" title={item.description || undefined}>
                        {item.description || '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{formatDate(item.date)}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{formatTime(item.time)}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 text-[10px] font-semibold uppercase rounded ${
                          item.recurringPattern && item.recurringPattern !== 'none'
                            ? 'bg-blue-100 text-blue-700'
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
                            className="p-1 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors flex items-center gap-1.5 text-xs font-semibold border border-gray-200"
                            title="Edit"
                          >
                            <SquarePen className="w-3.5 h-3.5" />
                            Edit
                          </button>
                          <button
                            onClick={() => onDeleteEvent && onDeleteEvent(item)}
                            className="p-1 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors flex items-center gap-1.5 text-xs font-semibold border border-gray-200"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            Delete
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
           {/* Incoming Schedules - Department Level Planning Table */}
          {activeTab === 'next-cutoff' && (
            <div className="flex flex-col p-4 space-y-6 relative">
                {loadingNext && (
                    <div className="absolute inset-0 bg-white/60 flex items-center justify-center z-50 rounded-2xl">
                        <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
                    </div>
                )}
                
                {cutOffPeriod && (
                    <div className="bg-gradient-to-r from-slate-800 to-slate-700 rounded-xl p-5 text-white shadow-lg shadow-gray-200/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center backdrop-blur-md">
                              <SquarePen className="w-5 h-5 text-white" />
                            </div>
                            <div className="flex flex-col">
                              <span className="text-[10px] font-bold text-slate-100 uppercase tracking-widest mb-0.5">Incoming Cycle</span>
                              <h3 className="text-lg font-black">{formatDate(cutOffPeriod.start)} — {formatDate(cutOffPeriod.end)}</h3>
                            </div>
                        </div>
                        <div className="bg-white/10 px-4 py-2 rounded-lg border border-white/20 backdrop-blur-sm shadow-inner transition-all hover:bg-white/20">
                           <span className="text-[10px] font-bold text-slate-100/80 uppercase tracking-widest block mb-0.5 opacity-80">Planning Cycle Status</span>
                           <span className="text-sm font-black uppercase tracking-tight drop-shadow-sm">Next Cut-off Assignments</span>
                        </div>
                    </div>
                )}

                <div className="overflow-x-auto bg-gray-50 rounded-lg shadow-sm border border-gray-100">
                   <table className="w-full text-left border-collapse">
                    <thead className="bg-gray-200 shadow-md text-gray-700">
                      <tr>
                        <th className="px-6 py-4 text-sm font-semibold tracking-wide whitespace-nowrap">Department Unit</th>
                        <th className="px-6 py-4 text-sm font-semibold tracking-wide whitespace-nowrap text-center">New Shift Assignments</th>
                        <th className="px-6 py-4 text-sm font-semibold tracking-wide whitespace-nowrap text-right">Incoming Strength</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {Object.keys(groupedNextCutOff).length > 0 ? (
                        Object.entries(groupedNextCutOff).sort(([a], [b]) => a.localeCompare(b)).map(([dept, shifts]) => (
                          <tr key={dept} className="hover:bg-[#F8F9FA] hover:shadow-xl transition-colors">
                             <td className="px-6 py-4 whitespace-nowrap">
                              <span className="text-sm font-semibold text-gray-900 uppercase tracking-tight">{dept}</span>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex flex-wrap gap-3 justify-center">
                                {Object.entries(shifts).map(([shiftTime, items]) => {
                                  const uniqueCount = new Set(items.map((i: NextCutOffSchedule) => i.employeeId)).size;
                                  return (
                                  <div 
                                    key={shiftTime} 
                                    className="flex flex-col items-center px-4 py-2 rounded-lg border shadow-sm transition-all bg-blue-50/50 border-blue-100/50 text-blue-900"
                                  >
                                    <span className="text-[10px] font-black uppercase tracking-tight text-blue-600">
                                      {shiftTime}
                                    </span>
                                    <span className="text-[11px] font-bold">{uniqueCount} Personnel</span>
                                  </div>
                                  );
                                })}
                              </div>
                            </td>
                            <td className="px-6 py-4 text-right whitespace-nowrap">
                               <span className="text-sm font-semibold text-gray-900">
                                  {new Set(Object.values(shifts).flat().map((i: NextCutOffSchedule) => i.employeeId)).size} Total New
                               </span>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <EmptyState message={loadingNext ? "Loading incoming cycles..." : "No incoming schedules found"} />
                      )}
                    </tbody>
                   </table>
                </div>
            </div>
          )}


        </div>
      </div>
    </div>
  );
};

export default AdminAgendaView;

