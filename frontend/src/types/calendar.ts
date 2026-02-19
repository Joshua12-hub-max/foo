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

export type CalendarItemType = 'event' | 'announcement';

export type CalendarItem = CalendarEvent | Announcement;
