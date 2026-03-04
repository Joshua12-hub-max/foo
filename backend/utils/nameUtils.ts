export const formatFullName = (
  lastName?: string | null,
  firstName?: string | null,
  middleName?: string | null,
  suffix?: string | null
): string => {
  if (!lastName && !firstName) return 'Unknown';
  
  const parts = [];
  
  if (lastName) {
    if (firstName) {
      // Append a comma after the last name if first name exists
      parts.push(`${lastName}, ${firstName}`);
    } else {
      parts.push(lastName);
    }
  } else if (firstName) {
    parts.push(firstName);
  }
  
  // If we have a middle name or an initial
  if (middleName) {
    parts.push(middleName);
  }
  
  // If we have a suffix like Jr., Sr., III
  if (suffix) {
    parts.push(suffix);
  }
  
  return parts.join(' ').trim();
};

// End of nameUtils.ts
