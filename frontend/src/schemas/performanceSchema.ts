import { z } from 'zod';

// Performance Criteria Schema
export const performanceCriteriaSchema = z.object({
  section: z.enum(['Performance', 'Competency']),
  category: z.enum(['Strategic Priorities', 'Core Functions', 'Support Functions', 'General']),
  title: z.string().min(1, 'Title is required'),
  description: z.string(),
  weight: z.number().min(1, 'Weight is required').max(100),
  max_score: z.number().min(1).max(5),
});

export type PerformanceCriteriaSchema = z.infer<typeof performanceCriteriaSchema>;

// Assessment Score Schema (for rating)
export const assessmentScoreSchema = z.object({
  score: z.number().min(0).max(5),
  remarks: z.string().optional(),
  achieved: z.string().optional(),
});

export type AssessmentScoreSchema = z.infer<typeof assessmentScoreSchema>;

// Edit Assessment Modal Schema (for creating/editing assessments)
export const assessmentSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string(),
});

export type AssessmentSchema = z.infer<typeof assessmentSchema>;

// Review Cycle Schema
export const reviewCycleSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  start_date: z.string().min(1, 'Start date is required'),
  end_date: z.string().min(1, 'End date is required'),
});

export type ReviewCycleSchema = z.infer<typeof reviewCycleSchema>;

