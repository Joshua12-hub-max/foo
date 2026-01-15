import { z } from 'zod';

export const LoginSchema = z.object({
  identifier: z.string().min(1, "Employee ID or Email is required"),
  password: z.string().min(1, "Password is required")
});

export const RegisterSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email format"),
  department: z.string().min(1, "Department is required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.enum(['admin', 'hr', 'employee']).optional()
});

export const VerifyOTPSchema = z.object({
  identifier: z.string().min(1, "Identifier is required"),
  otp: z.string().length(6, "OTP must be exactly 6 digits")
});

export const EmailVerifySchema = z.object({
  email: z.string().email("Invalid email format"),
  otp: z.string().length(6, "OTP must be exactly 6 digits")
});

export const ResendOTPSchema = z.object({
  identifier: z.string().min(1, "Identifier is required")
});

export const ForgotPasswordSchema = z.object({
  email: z.string().email("Invalid email format")
});

export const ResetPasswordSchema = z.object({
  token: z.string().min(1, "Token is required"),
  newPassword: z.string().min(8, "Password must be at least 8 characters")
});

// Types inferred from schema
export type LoginInput = z.infer<typeof LoginSchema>;
export type RegisterInput = z.infer<typeof RegisterSchema>;
export type VerifyOTPInput = z.infer<typeof VerifyOTPSchema>;
export type EmailVerifyInput = z.infer<typeof EmailVerifySchema>;
export type ResendOTPInput = z.infer<typeof ResendOTPSchema>;
export type ForgotPasswordInput = z.infer<typeof ForgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof ResetPasswordSchema>;
