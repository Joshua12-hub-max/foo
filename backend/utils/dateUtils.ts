export const formatToManilaDateTime = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Manila',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });

  const parts = formatter.formatToParts(d);
  const getPart = (type: string) => parts.find(p => p.type === type)?.value || '';

  return `${getPart('year')}-${getPart('month')}-${getPart('day')} ${getPart('hour')}:${getPart('minute')}:${getPart('second')}`;
};

export const currentManilaDateTime = (): string => {
  return formatToManilaDateTime(new Date());
};

export const currentManilaDateOnly = (): string => {
  return formatToManilaDateTime(new Date()).split(' ')[0];
};

/**
 * Format minutes into a readable duration string (e.g. "8h 40m")
 */
export const formatDuration = (totalMinutes: number): string => {
  if (!totalMinutes || totalMinutes <= 0) return '0';
  const hours = Math.floor(totalMinutes / 60);
  const remainingMinutes = totalMinutes % 60;
  
  if (hours > 0) {
    return `${hours}h${remainingMinutes > 0 ? ` ${remainingMinutes}m` : ''}`;
  }
  return `${remainingMinutes}m`;
};

/**
 * Format date for MySQL DATETIME column (YYYY-MM-DD HH:mm:ss)
 * Uses UTC by default as toISOString() does.
 */
export const formatToMysqlDateTime = (date: Date): string => {
  return date.toISOString().slice(0, 19).replace('T', ' ');
};

/**
 * Get the next cut-off period (1-15 or 16-end of month)
 */
export const getNextCutOff = (date: Date = new Date()): { start: Date; end: Date } => {
  const day = date.getDate();
  const year = date.getFullYear();
  const month = date.getMonth();

  if (day <= 15) {
    // Current is 1-15, next is 16-end of current month
    const start = new Date(year, month, 16);
    const end = new Date(year, month + 1, 0); // Last day of current month
    return { start, end };
  } else {
    // Current is 16-end, next is 1-15 of next month
    const start = new Date(year, month + 1, 1);
    const end = new Date(year, month + 1, 15);
    return { start, end };
  }
};

/**
 * Converts 12-hour AM/PM time (e.g. "08:00 AM") to 24-hour HH:mm:ss
 */
export const convertTo24Hour = (time12h: string): string => {
  if (!time12h) return '00:00:00';
  const [time, modifier] = time12h.split(' ');
  if (!time || !modifier) {
      // Check if it's already in 24h format but might be HH:mm
      if (time12h.includes(':') && !time12h.includes(' ')) {
          return time12h.length === 5 ? `${time12h}:00` : time12h;
      }
      return time12h;
  }
  const [hoursStr, minutes] = time.split(':');
  let hours = parseInt(hoursStr, 10);
  if (hours === 12) hours = 0;
  if (modifier.toUpperCase() === 'PM') hours += 12;
  return `${String(hours).padStart(2, '0')}:${minutes}:00`;
};

/**
 * Normalize any date value to ISO date format (YYYY-MM-DD)
 * Handles Date objects, date strings, and various date formats
 * Returns null for invalid dates
 */
export const normalizeToIsoDate = (value: string | Date | null | undefined): string | null => {
  if (!value) return null;

  if (value instanceof Date) {
    if (isNaN(value.getTime())) return null;
    return value.toISOString().split('T')[0];
  }

  // Explicitly handle MM-DD-YYYY or M-D-YYYY
  const mdiyMatch = value.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
  if (mdiyMatch) {
    const [_, month, day, year] = mdiyMatch;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }

  // Explicitly handle DD-MM-YYYY if needed, but the user example 04-01-2025 looks like MM-DD-YYYY or YYYY-MM-DD
  // HTML5 date inputs use YYYY-MM-DD which new Date() handles fine.

  const date = new Date(value);
  if (isNaN(date.getTime())) return null;

  return date.toISOString().split('T')[0];
};

/**
 * Check if a string is in ISO date format (YYYY-MM-DD)
 */
export const isIsoDateFormat = (value: string): boolean => {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
};

/**
 * Convert Excel serial date to ISO date format (YYYY-MM-DD)
 * Excel stores dates as numbers (days since 1900-01-01, with some quirks)
 * Returns null for invalid serial numbers
 */
export const excelSerialToIsoDate = (serial: number): string | null => {
  if (serial < 1 || serial > 60000) return null;

  // Excel's date system: 1 = 1900-01-01, but Excel incorrectly treats 1900 as a leap year
  // Subtract 25569 to get Unix epoch days, then convert to milliseconds
  const date = new Date((serial - 25569) * 86400 * 1000);

  if (isNaN(date.getTime())) return null;

  return date.toISOString().split('T')[0];
};
