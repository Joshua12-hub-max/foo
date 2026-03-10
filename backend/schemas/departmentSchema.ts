import { z } from 'zod';

export const CreateDepartmentSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Department name is required'),
    description: z.string().optional(),
    headOfDepartment: z.string().optional(),
  }),
});

export const UpdateDepartmentSchema = z.object({
  params: z.object({
    id: z.string(),
  }),
  body: z.object({
    name: z.string().optional(),
    description: z.string().optional(),
    headOfDepartment: z.string().optional(),
  }),
});

export const AssignEmployeeSchema = z.object({
  params: z.object({
    id: z.string(),
  }),
  body: z.object({
    employeeId: z.number().positive('Employee ID is required'),
  }),
});

export const DepartmentIdParams = z.object({
  params: z.object({
    id: z.string(),
  }),
});

export type CreateDepartmentInput = z.infer<typeof CreateDepartmentSchema>['body'];
export type UpdateDepartmentInput = z.infer<typeof UpdateDepartmentSchema>['body'];
export type AssignEmployeeInput = z.infer<typeof AssignEmployeeSchema>['body'];
