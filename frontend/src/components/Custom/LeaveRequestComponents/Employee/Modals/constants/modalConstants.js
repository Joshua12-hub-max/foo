// Philippine Government Leave Types (CSC Guidelines)
export const LEAVE_TYPES = [
  'Vacation Leave',
  'Sick Leave',
  'Maternity Leave',
  'Paternity Leave',
  'Solo Parent Leave',
  'Special Leave Benefits for Women',
  'Special Emergency Leave',
  'Rehabilitation Leave',
  'Study Leave',
  'VAWC Leave',
  'Special Privilege Leave',
  'Forced/Mandatory Leave',
  'Official Business',
  'Other'
];

export const FILE_CONFIG = {
  maxSize: 5 * 1024 * 1024, // 5MB
  allowedTypes: [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ],
  allowedExtensions: '.pdf'
};
