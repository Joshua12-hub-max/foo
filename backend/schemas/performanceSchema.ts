import { z } from 'zod';

export const createCriteriaSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  category: z.string().optional(),
  criteriaType: z.enum(['core_function', 'support_function', 'core_competency', 'organizational_competency']).optional(),
  weight: z.number().or(z.string()).optional(),
  maxScore: z.number().int().optional(),
  ratingDefinition5: z.string().optional(),
  ratingDefinition4: z.string().optional(),
  ratingDefinition3: z.string().optional(),
  ratingDefinition2: z.string().optional(),
  ratingDefinition1: z.string().optional(),
  evidenceRequirements: z.string().optional(),
});

export const updateCriteriaSchema = createCriteriaSchema.partial();

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

export const submitSelfRatingSchema = z.object({
  items: z.array(reviewItemSchema),
  employeeRemarks: z.string().optional(),
  isDraft: z.boolean().optional()
});

export const submitReviewerRatingSchema = z.object({
  items: z.array(reviewItemSchema),
  reviewerRemarks: z.string().optional(),
  overallFeedback: z.string().optional()
});

export const createReviewCycleSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  ratingPeriod: z.enum(['1st_sem', '2nd_sem', 'annual']).optional()
});

export const updateReviewCycleSchema = createReviewCycleSchema.partial();

export const createReviewSchema = z.object({
  employeeId: z.number(),
  reviewerId: z.number(),
  reviewCycleId: z.number().optional(),
  reviewPeriodStart: z.string().optional(),
  reviewPeriodEnd: z.string().optional(),
  evaluationMode: z.enum(['CSC', 'IPCR', 'Senior']).optional()
});

export const updateReviewSchema = z.object({
  items: z.array(reviewItemSchema).optional(),
  overallFeedback: z.string().optional(),
  strengths: z.string().optional(),
  improvements: z.string().optional(),
  additionalComments: z.string().optional()
});
