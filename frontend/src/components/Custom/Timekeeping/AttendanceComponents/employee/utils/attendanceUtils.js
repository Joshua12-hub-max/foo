export const formatDate = (dateString) => {
  if (!dateString) return '-';
  const options = { year: 'numeric', month: 'short', day: 'numeric' };
  return new Date(dateString).toLocaleDateString('en-US', options);
};

export const formatTime = (timeString) => {
  if (!timeString) return '-';
  // Check if it's already formatted like "08:00 AM"
  if (timeString.match(/\d{1,2}:\d{2}\s[AP]M/)) return timeString;
  
  // Try to parse as date/time
  const date = new Date(timeString);
  if (isNaN(date.getTime())) return timeString; // Return as is if invalid date

  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
};

export const getStatusColor = (status) => {
  const styles = {
    Present: 'bg-green-100 text-green-700',
    Absent: 'bg-red-100 text-red-700',
    Late: 'bg-orange-100 text-orange-700',
    Leave: 'bg-blue-100 text-blue-700',
    Rest: 'bg-gray-100 text-gray-700',
  };
  return styles[status] || 'bg-gray-100 text-gray-700';
};
