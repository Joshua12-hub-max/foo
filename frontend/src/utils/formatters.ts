/**
 * Formats a raw employee ID into the display format (EMP-XXX).
 * @param id The raw employee ID (string or number).
 * @returns The formatted employee ID string.
 */
export const formatEmployeeId = (id: string | number | null | undefined): string => {
  if (!id) return '';
  
  const idStr = String(id);
  
  // If it already has EMP- prefix, return as is (strict safety)
  if (idStr.toUpperCase().startsWith('EMP-')) {
    return idStr;
  }
  
  // Check if it's a valid number
  const num = parseInt(idStr, 10);
  if (isNaN(num)) {
      return idStr; // Return original if not a number
  }

  return `EMP-${idStr.padStart(3, '0')}`;
};
