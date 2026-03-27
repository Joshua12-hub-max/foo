import { z } from 'zod';

export const ID_REGEX = {
  // GSIS: 11 digit BP number, 12 digit CRN, or testing format XX-XXXXXXX-X
  GSIS: /^(\d{11}|\d{12}|\d{2}-\d{7}-\d{1}|\d{4}-\d{7}-\d{1})$/,
  // Pag-IBIG: 12 digits (format: XXXX-XXXX-XXXX or XXXXXXXXXXXX)
  PAGIBIG: /^(\d{12}|\d{4}-\d{4}-\d{4})$/,
  // PhilHealth: 12 digits (format: XX-XXXXXXXXX-X or XXXXXXXXXXXX)
  PHILHEALTH: /^(\d{12}|\d{2}-\d{9}-\d{1})$/,
  // UMID: 12 digits (format: XXXX-XXXXXXX-X or XXXXXXXXXXXX)
  UMID: /^(\d{10}|\d{12}|\d{2}-\d{7}-\d{1}|\d{4}-\d{7}-\d{1})$/,
  // PhilSys: 16 digits (format: XXXX-XXXX-XXXX-XXXX or XXXXXXXXXXXXXXXX)
  PHILSYS: /^(\d{16}|\d{4}-\d{4}-\d{4}-\d{4})$/,
  // TIN: 9 or 12 digits (format: XXX-XXX-XXX or XXX-XXX-XXX-XXX or continuous)
  TIN: /^(\d{9}|\d{12}|\d{3}-\d{3}-\d{3}|\d{3}-\d{3}-\d{3}-\d{3})$/
};

export const createIdValidator = (regex: RegExp, name: string) => {
  return z.string().optional().nullable().refine(
    (val) => {
      if (!val) return true;
      const cleaned = val.replace(/\s+/g, '');
      const ok = regex.test(cleaned);
      if (!ok) console.log(`[DEBUG] ID Validation FAILED (Optional): name="${name}" val="${val}" cleaned="${cleaned}" regex=${regex}`);
      return ok;
    },
    { message: `Invalid ${name} format` }
  );
};

export const createStrictIdValidator = (regex: RegExp, name: string) => {
  return z.string().min(1, `${name} is required`).refine(
    (val) => {
      const cleaned = val.replace(/\s+/g, '');
      const ok = regex.test(cleaned);
      if (!ok) console.log(`[DEBUG] ID Validation FAILED (Strict): name="${name}" val="${val}" cleaned="${cleaned}" regex=${regex}`);
      return ok;
    },
    { message: `Invalid ${name} format` }
  );
};
