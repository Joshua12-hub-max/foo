import { z } from 'zod';

// Performance Criteria Schema
export const performanceCriteriaSchema = z.object({
  section: z.enum(['Performance', 'Competency']),
  category: z.enum(['Strategic Priorities', 'Core Functions', 'Support Functions', 'General']),
  title: z.string().min(1, 'Title is required'),
  description: z.string(),
  weight: z.number().min(1, 'Weight is required').max(100),
  maxScore: z.number().min(1).max(5),
  ratingDefinition5: z.string().optional(),
  ratingDefinition4: z.string().optional(),
  ratingDefinition3: z.string().optional(),
  ratingDefinition2: z.string().optional(),
  ratingDefinition1: z.string().optional(),
  evidenceRequirements: z.string().optional(),
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
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
});

export type ReviewCycleSchema = z.infer<typeof reviewCycleSchema>;

