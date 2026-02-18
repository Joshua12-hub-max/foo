import { z } from 'zod';

export const createCriteriaSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  category: z.string().optional(),
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
