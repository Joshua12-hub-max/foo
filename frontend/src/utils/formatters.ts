/**
 * Formats a raw employee ID into the display format 'Emp-XXX'.
 * Handles numeric strings, numbers, and null values.
 * @param id The raw employee ID (string or number).
 * @returns The formatted ID (e.g., "001" -> "Emp-001", 2 -> "Emp-002")
 */
export const formatEmployeeId = (id: string | number | null | undefined): string => {
  if (!id) return 'N/A';
  
  // Extract only numbers
  const numericStr = String(id).replace(/\D/g, '');
  if (!numericStr) return String(id); // Fallback if no numbers (e.g. string role)
  
  // Pad the numeric part to at least 3 digits and prefix with 'Emp-'
  const padded = numericStr.padStart(3, '0');
  return `Emp-${padded}`;
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
