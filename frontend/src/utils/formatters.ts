/**
 * Formats a raw employee ID into the display format.
 * NOW CHANGED: Returns the raw ID as a string since we moved to strictly numeric IDs.
 * @param id The raw employee ID (string or number).
 * @returns The raw numeric ID string.
 */
export const formatEmployeeId = (id: string | number | null | undefined): string => {
  if (!id) return '';
  return String(id);
};

/**
 * Formats minutes into a readable duration string.
 * Example: 520 => "8h 40m", 40 => "40m"
 */
export const formatDuration = (totalMinutes: number | string | null | undefined): string => {
  const mins = typeof totalMinutes === 'string' ? parseInt(totalMinutes, 10) : Number(totalMinutes || 0);
  if (isNaN(mins) || mins <= 0) return '-';
  
  const hours = Math.floor(mins / 60);
  const remainingMinutes = mins % 60;
  
  if (hours > 0) {
    return `${hours}h${remainingMinutes > 0 ? ` ${remainingMinutes}m` : ''}`;
  }
  return `${remainingMinutes}m`;
};
