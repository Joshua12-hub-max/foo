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
