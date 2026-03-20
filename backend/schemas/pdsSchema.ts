import { z } from 'zod';

export const PdsQuestionsSchema = z.object({
  q34a: z.boolean().default(false),
  q34b: z.boolean().default(false),
  q34Details: z.string().optional().nullable(),
  
  q35a: z.boolean().default(false),
  q35aDetails: z.string().optional().nullable(),
  q35b: z.boolean().default(false),
  q35bDetails: z.string().optional().nullable(),
  q35bDateFiled: z.string().optional().nullable(),
  q35bStatus: z.string().optional().nullable(),
  
  q36: z.boolean().default(false),
  q36Details: z.string().optional().nullable(),
  
  q37: z.boolean().default(false),
  q37Details: z.string().optional().nullable(),
  
  q38a: z.boolean().default(false),
  q38aDetails: z.string().optional().nullable(),
  q38b: z.boolean().default(false),
  q38bDetails: z.string().optional().nullable(),
  
  q39: z.boolean().default(false),
  q39Details: z.string().optional().nullable(),
  
  q40a: z.boolean().default(false),
  q40aDetails: z.string().optional().nullable(),
  q40b: z.boolean().default(false),
  q40bDetails: z.string().optional().nullable(),
  q40c: z.boolean().default(false),
  q40cDetails: z.string().optional().nullable(),
});

export type PdsQuestions = z.infer<typeof PdsQuestionsSchema>;
