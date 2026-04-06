import { z } from 'zod';
export const PdsQuestionsSchema = z.object({
  relatedThirdDegree: z.boolean().optional().nullable(),
  relatedFourthDegree: z.boolean().optional().nullable(),
  relatedFourthDetails: z.string().optional().nullable(),

  foundGuiltyAdmin: z.boolean().optional().nullable(),
  foundGuiltyDetails: z.string().optional().nullable(),

  criminallyCharged: z.boolean().optional().nullable(),
  dateFiled: z.string().optional().nullable(),
  statusOfCase: z.string().optional().nullable(),

  convictedCrime: z.boolean().optional().nullable(),
  convictedDetails: z.string().optional().nullable(),

  separatedFromService: z.boolean().optional().nullable(),
  separatedDetails: z.string().optional().nullable(),

  electionCandidate: z.boolean().optional().nullable(),
  electionDetails: z.string().optional().nullable(),

  resignedToPromote: z.boolean().optional().nullable(),
  resignedDetails: z.string().optional().nullable(),

  immigrantStatus: z.boolean().optional().nullable(),
  immigrantDetails: z.string().optional().nullable(),

  indigenousMember: z.boolean().optional().nullable(),
  indigenousDetails: z.string().optional().nullable(),

  personWithDisability: z.boolean().optional().nullable(),
  disabilityIdNo: z.string().optional().nullable(),

  soloParent: z.boolean().optional().nullable(),
  soloParentIdNo: z.string().optional().nullable(),
});

export type PdsQuestions = z.infer<typeof PdsQuestionsSchema>;
