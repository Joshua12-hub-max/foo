import { z } from 'zod';

export const creditUpdateSchema = z.object({
  creditType: z.string().min(1, "Credit type is required"),
  balance: z.number()
    .min(0, "Balance is required")
    .refine((val) => val !== undefined && val !== null, {message: "Balance must be a multiple of 0.25"}),
});

export const addCreditSchema = creditUpdateSchema.extend({
  employee_id: z.string().min(1, "Employee is required"),
});

export type CreditUpdateInput = z.infer<typeof creditUpdateSchema>;
export type AddCreditInput = z.infer<typeof addCreditSchema>;

export const CREDIT_TYPES = [
  'Vacation Leave',
  'Sick Leave',
  'Special Privilege Leave',
  'Maternity Leave',
  'Paternity Leave',
  'Solo Parent Leave',
];
