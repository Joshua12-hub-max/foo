
const convertTo24Hour = (timeStr: string | undefined): string | null => {
  if (!timeStr) return null;
  
  const [time, modifier] = timeStr.trim().split(' ');
  if (!modifier) return timeStr; // Assume already correct if no AM/PM

  let [hours, minutes] = time.split(':');
  let h = parseInt(hours, 10);

  if (modifier === 'PM' && h < 12) h += 12;
  if (modifier === 'AM' && h === 12) h = 0;

  return `${h.toString().padStart(2, '0')}:${minutes}:00`;
};

console.log('9:00 AM ->', convertTo24Hour('9:00 AM'));
console.log('12:00 PM ->', convertTo24Hour('12:00 PM'));
console.log('12:00 AM ->', convertTo24Hour('12:00 AM'));
console.log('5:30 PM ->', convertTo24Hour('5:30 PM'));
console.log('14:00 ->', convertTo24Hour('14:00'));
