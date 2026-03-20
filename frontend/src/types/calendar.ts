export interface CalendarEvent {
  id: number;
  title: string;
  description: string | null;
  date: string;
  startDate: string;
  endDate: string;
  time: string | number | null;
  recurringPattern: 'none' | 'daily' | 'weekly' | 'monthly' | null;
  recurringEndDate?: string | null;
  department: string | null;
  color?: string;
  isHoliday?: boolean;
  isAnnouncement?: boolean;
}

export interface Announcement {
  id: number | string;
  title: string;
  content: string;
  priority: 'normal' | 'high' | 'urgent';
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  createdAt: string;
  updatedAt?: string;
}

export type EventFormData = {
  title: string;
  date: string;
  startDate: string;
  endDate: string;
  time?: string | null;
  description?: string | null;
  department?: string | null;
  recurringPattern: 'none' | 'daily' | 'weekly' | 'monthly';
  recurringEndDate?: string | null;
};

export type AnnouncementFormData = {
  title: string;
  content: string;
  priority: 'normal' | 'high' | 'urgent';
  startDate?: string | null;
  endDate?: string | null;
  startTime?: string | null;
  endTime?: string | null;
};

export type CalendarItemType = 'event' | 'announcement' | 'holiday' | 'schedule';

export type CalendarItem = CalendarEvent | Announcement | Schedule;

/** Holiday data from API (month/day based, rendered per year) */
export interface Holiday {
  id: number | string;
  name: string;
  title?: string;
  month: number;
  day: number;
  type?: string;
  date?: string;
}

/** Employee schedule entry from API */
export interface ScheduleEntry {
  id: number | string;
  scheduleTitle?: string;
  title?: string;
  duties?: string;
  scheduleName?: string;
  startDate?: string;
  endDate?: string;
  startTime?: string;
  endTime?: string;
  dayOfWeek?: string;
  days?: string;
}

export interface Schedule extends ScheduleEntry {
  employeeName?: string;
  employeeId?: string;
  department?: string;
}

/** Unified display item for the calendar grid */
export interface CalendarDisplayItem {
  id: string | number;
  title: string;
  type?: string;
  date?: string;
  time?: string | number | null;
  endTime?: string;
  description?: string | null;
  department?: string | null;
  priority?: string;
  isHoliday?: boolean;
  isAnnouncement?: boolean;
  isSchedule?: boolean;
  startDate?: string;
  endDate?: string;
  createdAt?: string;
  originalSchedule?: ScheduleEntry;
  name?: string;
  color?: string;
  content?: string;
}
