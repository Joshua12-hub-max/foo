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

// Review Cycle Schema
export const reviewCycleSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  ratingPeriod: z.enum(['1st_sem', '2nd_sem', 'annual']).optional()
});

export type ReviewCycleSchema = z.infer<typeof reviewCycleSchema>;

// Assessment Schema (used for Strengths/Improvements sections)
export const assessmentSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
});

export type AssessmentSchema = z.infer<typeof assessmentSchema>;

// Self Rating Item Schema
export const reviewItemSchema = z.object({
  id: z.union([z.number(), z.string()]).optional(),
  criteriaId: z.number().optional(),
  score: z.union([z.number(), z.string()]).optional(),
  selfScore: z.union([z.number(), z.string()]).optional(),
  weight: z.union([z.number(), z.string()]).optional(),
  maxScore: z.number().optional(),
  qScore: z.union([z.number(), z.string()]).optional(),
  eScore: z.union([z.number(), z.string()]).optional(),
  tScore: z.union([z.number(), z.string()]).optional(),
  comment: z.string().optional(),
  criteriaTitle: z.string().optional(),
  criteriaDescription: z.string().optional(),
  category: z.string().optional(),
  actualAccomplishments: z.string().optional(),
  evidenceFilePath: z.string().optional(),
  evidenceDescription: z.string().optional()
});

export type ReviewItemSchema = z.infer<typeof reviewItemSchema>;

// Submit Self Rating Schema
export const submitSelfRatingSchema = z.object({
  items: z.array(reviewItemSchema),
  employeeRemarks: z.string().optional(),
  isDraft: z.boolean().optional()
});

export type SubmitSelfRatingSchema = z.infer<typeof submitSelfRatingSchema>;

// Submit Reviewer Rating Schema
export const submitReviewerRatingSchema = z.object({
  items: z.array(reviewItemSchema),
  reviewerRemarks: z.string().optional(),
  overallFeedback: z.string().optional()
});

export type SubmitReviewerRatingSchema = z.infer<typeof submitReviewerRatingSchema>;
