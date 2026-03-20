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
