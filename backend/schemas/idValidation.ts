import { z } from 'zod';

export const ID_REGEX = {
  // GSIS: 11 digit BP number, 12 digit CRN, or testing format XX-XXXXXXX-X (Allows spaces/hyphens)
  GSIS: /^(\d{11,12}|[\d\s-]{12,15})$/,
  // Pag-IBIG: 12 digits (format: XXXX-XXXX-XXXX or XXXXXXXXXXXX)
  PAGIBIG: /^(\d{12}|[\d\s-]{14,15})$/,
  // PhilHealth: 12 digits (format: XX-XXXXXXXXX-X or XXXXXXXXXXXX)
  PHILHEALTH: /^(\d{12}|[\d\s-]{14,15})$/,
  // UMID: 10 or 12 digits (format: XXXX-XXXXXXX-X or XXXXXXXXXXXX)
  UMID: /^(\d{10,12}|[\d\s-]{12,15})$/,
  // PhilSys: 16 digits (format: XXXX-XXXX-XXXX-XXXX or XXXXXXXXXXXXXXXX)
  PHILSYS: /^(\d{16}|[\d\s-]{19})$/,
  // TIN: 9 or 12 digits (format: XXX-XXX-XXX or XXX-XXX-XXX-XXX or continuous)
  TIN: /^(\d{9,12}|[\d\s-]{11,15})$/
};

export const createIdValidator = (regex: RegExp, name: string) => {
  return z
    .string()
    .optional()
    .nullable()
    .refine((val) => !val || regex.test(val), {
      message: `Invalid ${name} format`,
    });
};

export const createStrictIdValidator = (regex: RegExp, name: string) => {
  return z
    .string()
    .min(1, `${name} is required`)
    .nullable()
    .refine((val) => !!val && regex.test(val), {
      message: `Invalid ${name} format`,
    });
};

