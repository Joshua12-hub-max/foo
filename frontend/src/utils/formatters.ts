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
