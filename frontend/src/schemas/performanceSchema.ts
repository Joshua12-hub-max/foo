import { z } from 'zod';

// Performance Criteria Schema
export const performanceCriteriaSchema = z.object({
  section: z.enum(['Performance', 'Competency']).optional(),
  category: z.enum(['Strategic Priorities', 'Core Functions', 'Support Functions', 'General']).optional(),
  criteriaType: z.enum(['core_function', 'support_function', 'core_competency', 'organizational_competency']).optional(),
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  weight: z.number().min(0, 'Weight is required').max(100),
  maxScore: z.number().min(1).max(5),
  ratingDefinition5: z.string().optional(),
  ratingDefinition4: z.string().optional(),
  ratingDefinition3: z.string().optional(),
  ratingDefinition2: z.string().optional(),
  ratingDefinition1: z.string().optional(),
  evidenceRequirements: z.string().optional(),
});

export type PerformanceCriteriaSchema = z.infer<typeof performanceCriteriaSchema>;

// ... (other schemas)

// Review Cycle Schema
export const reviewCycleSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  ratingPeriod: z.enum(['1st_sem', '2nd_sem', 'annual']).optional()
});

export type ReviewCycleSchema = z.infer<typeof reviewCycleSchema>;

