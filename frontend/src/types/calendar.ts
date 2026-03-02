export interface CalendarEvent {
  id: number;
  title: string;
  description: string | null;
  date: string;
  start_date: string;
  end_date: string;
  time: string | number | null;
  recurring_pattern: 'none' | 'daily' | 'weekly' | 'monthly' | null;
  recurring_end_date?: string | null;
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
  start_date: string;
  end_date: string;
  start_time: string;
  end_time: string;
  created_at: string;
  updated_at?: string;
}

export type EventFormData = {
  title: string;
  date: string;
  start_date: string;
  end_date: string;
  time?: string | null;
  description?: string | null;
  department?: string | null;
  recurring_pattern?: 'none' | 'daily' | 'weekly' | 'monthly' | null;
  recurring_end_date?: string | null;
};

export type AnnouncementFormData = {
  title: string;
  content: string;
  priority: 'normal' | 'high' | 'urgent';
  start_date?: string | null;
  end_date?: string | null;
  start_time?: string | null;
  end_time?: string | null;
};

export type CalendarItemType = 'event' | 'announcement' | 'holiday' | 'schedule';

export type CalendarItem = CalendarEvent | Announcement;

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
  duties?: string;
  scheduleName?: string;
  start_date?: string;
  startDate?: string;
  end_date?: string;
  endDate?: string;
  start_time?: string;
  startTime?: string;
  end_time?: string;
  endTime?: string;
  days?: string;
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
  start_date?: string;
  end_date?: string;
  created_at?: string;
  originalSchedule?: ScheduleEntry;
  name?: string;
  color?: string;
  content?: string;
}
