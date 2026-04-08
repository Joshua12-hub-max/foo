export const validateGibberish = (val: string): boolean => {
  if (/(.)\1{7,}/.test(val)) return false; // 8+ repeated chars
  if (/[bcdfghjklmnpqrstvwxz]{15,}/i.test(val)) return false; // 15+ consonants
  if (/[!@#$%^&*()_+={}[\]:;"'<>,.?/\\|`~]{4,}/.test(val)) return false; // 4+ symbols
  return true;
};

export const formatPhoneNumber = (val: string): string => {
  return val.replace(/\D/g, '').slice(0, 11);
};

export const formatGSIS = (val: string): string => {
  const digits = val.replace(/\D/g, '');
  return digits.slice(0, 11);
};

export const formatPagIBIG = (val: string): string => {
  const digits = val.replace(/\D/g, '');
  return digits.slice(0, 12);
};

export const formatPhilHealth = (val: string): string => {
  const digits = val.replace(/\D/g, '');
  if (digits.length <= 2) return digits;
  if (digits.length <= 11) return `${digits.slice(0, 2)}-${digits.slice(2)}`;
  return `${digits.slice(0, 2)}-${digits.slice(2, 11)}-${digits.slice(11, 12)}`;
};

export const formatUMID = (val: string): string => {
  const digits = val.replace(/\D/g, '');
  if (digits.length <= 4) return digits;
  if (digits.length <= 11) return `${digits.slice(0, 4)}-${digits.slice(4)}`;
  return `${digits.slice(0, 4)}-${digits.slice(4, 11)}-${digits.slice(11, 12)}`;
};

export const formatPhilSys = (val: string): string => {
  const digits = val.replace(/\D/g, '');
  if (digits.length <= 4) return digits;
  if (digits.length <= 8) return `${digits.slice(0, 4)}-${digits.slice(4)}`;
  if (digits.length <= 12) return `${digits.slice(0, 4)}-${digits.slice(4, 8)}-${digits.slice(8)}`;
  return `${digits.slice(0, 4)}-${digits.slice(4, 8)}-${digits.slice(8, 12)}-${digits.slice(12, 16)}`;
};

export const formatTIN = (val: string): string => {
  const digits = val.replace(/\D/g, '');
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  if (digits.length <= 9) return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6, 9)}-${digits.slice(9, 12)}`;
};

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePhoneNumber = (phone: string): boolean => {
  const phoneRegex = /^(09|\+639)\d{9}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
};
