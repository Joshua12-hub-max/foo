import { useState, useMemo, Dispatch, SetStateAction } from 'react';
import type { CalendarDisplayItem } from '@/types/calendar';

interface CalendarState {
  today: Date;
  currentDate: Date;
  setCurrentDate: Dispatch<SetStateAction<Date>>;
  isDrawerOpen: boolean;
  setIsDrawerOpen: Dispatch<SetStateAction<boolean>>;
  showHolidays: boolean;
  setShowHolidays: Dispatch<SetStateAction<boolean>>;
  showEventDetails: CalendarDisplayItem | null;
  setShowEventDetails: Dispatch<SetStateAction<CalendarDisplayItem | null>>;
}

/**
 * Custom hook for managing calendar state
 * @returns {Object} Calendar state and setters
 */
export const useCalendarState = (): CalendarState => {
  const today = useMemo(() => new Date(), []);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [showHolidays, setShowHolidays] = useState(false);
  const [showEventDetails, setShowEventDetails] = useState<CalendarDisplayItem | null>(null);

  return {
    today,
    currentDate,
    setCurrentDate,
    isDrawerOpen,
    setIsDrawerOpen,
    showHolidays,
    setShowHolidays,
    showEventDetails,
    setShowEventDetails
  };
};
