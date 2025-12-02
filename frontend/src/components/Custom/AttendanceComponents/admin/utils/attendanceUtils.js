/**
 * Format a date string to a readable format (e.g., "Oct 24, 2023")
 */
export const formatDate = (dateString) => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
};

/**
 * Format a time string (e.g., "08:00:00" -> "08:00 AM")
 */
export const formatTime = (timeString) => {
  if (!timeString) return '-';
  // If it's already in AM/PM format, return as is
  if (timeString.includes('AM') || timeString.includes('PM')) return timeString;
  
  const [hours, minutes] = timeString.split(':');
  const h = parseInt(hours, 10);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const formattedHour = h % 12 || 12;
  return `${formattedHour}:${minutes} ${ampm}`;
};

/**
 * Get status color class based on status string
 */
export const getStatusColor = (status, statusStyles) => {
  return statusStyles[status] || 'bg-gray-100 text-gray-800';
};

/**
 * Calculate total hours between time in and time out
 * This is a placeholder; real calculation would depend on date objects
 */
export const calculateHours = (timeIn, timeOut) => {
  if (!timeIn || !timeOut) return 0;
  // Simplified logic for display purposes
  return 8; 
};
