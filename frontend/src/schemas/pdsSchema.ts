import { z } from 'zod';

export const PdsQuestionsSchema = z.object({
  q34a: z.boolean(),
  q34b: z.boolean(),
  q34Details: z.string().optional().nullable(),
  
  q35a: z.boolean(),
  q35aDetails: z.string().optional().nullable(),
  q35b: z.boolean(),
  q35bDetails: z.string().optional().nullable(),
  q35bDateFiled: z.string().optional().nullable(),
  q35bStatus: z.string().optional().nullable(),
  
  q36: z.boolean(),
  q36Details: z.string().optional().nullable(),
  
  q37: z.boolean(),
  q37Details: z.string().optional().nullable(),
  
  q38a: z.boolean(),
  q38aDetails: z.string().optional().nullable(),
  q38b: z.boolean(),
  q38bDetails: z.string().optional().nullable(),
  
  q39: z.boolean(),
  q39Details: z.string().optional().nullable(),
  
  q40a: z.boolean(),
  q40aDetails: z.string().optional().nullable(),
  q40b: z.boolean(),
  q40bDetails: z.string().optional().nullable(),
  q40c: z.boolean(),
  q40cDetails: z.string().optional().nullable(),
});

export type PdsQuestions = z.infer<typeof PdsQuestionsSchema>;
