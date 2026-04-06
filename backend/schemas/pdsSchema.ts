import { z } from 'zod';
export const PdsQuestionsSchema = z.object({
  relatedThirdDegree: z.boolean().default(false),
  relatedThirdDetails: z.string().optional().nullable(),
  relatedFourthDegree: z.boolean().default(false),
  relatedFourthDetails: z.string().optional().nullable(),

  foundGuiltyAdmin: z.boolean().default(false),
  foundGuiltyDetails: z.string().optional().nullable(),

  criminallyCharged: z.boolean().default(false),
  dateFiled: z.string().optional().nullable(),
  statusOfCase: z.string().optional().nullable(),

  convictedCrime: z.boolean().default(false),
  convictedDetails: z.string().optional().nullable(),

  separatedFromService: z.boolean().default(false),
  separatedDetails: z.string().optional().nullable(),

  electionCandidate: z.boolean().default(false),
  electionDetails: z.string().optional().nullable(),

  resignedToPromote: z.boolean().default(false),
  resignedDetails: z.string().optional().nullable(),

  immigrantStatus: z.boolean().default(false),
  immigrantDetails: z.string().optional().nullable(),

  indigenousMember: z.boolean().default(false),
  indigenousDetails: z.string().optional().nullable(),

  personWithDisability: z.boolean().default(false),
  disabilityIdNo: z.string().optional().nullable(),

  soloParent: z.boolean().default(false),
  soloParentIdNo: z.string().optional().nullable(),
});

export type PdsQuestions = z.infer<typeof PdsQuestionsSchema>;
