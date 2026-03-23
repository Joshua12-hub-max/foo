
import { db } from '../db/index.js';
import { qualificationStandards, authentication, plantillaPositions, pdsEducation, pdsWorkExperience, pdsEligibility } from '../db/schema.js';
import { eq } from 'drizzle-orm';

export interface ValidationResult {
  qualified: boolean;
  score: number;
  missingRequirements: string[];
  employeeDetails: {
    id: number;
    name: string;
    employeeId: string;
    education: string | null;
    experienceYears: number;
    eligibility: string | null;
  };
  positionDetails: {
    id: number;
    title: string;
    salaryGrade: number;
  };
  requirements: {
    education: string;
    experienceYears: number;
    trainingHours: number;
    eligibility: string;
  };
}

export class QualificationService {
  /**
   * Validate an employee against a position's Qualification Standards
   */
  static async validate(employeeId: number, positionId: number): Promise<ValidationResult> {
    // 1. Get Employee Details from Auth
    const [employee] = await db.select({
        id: authentication.id,
        firstName: authentication.firstName,
        lastName: authentication.lastName,
        employeeId: authentication.employeeId
    })
    .from(authentication)
    .where(eq(authentication.id, employeeId))
    .limit(1);

    if (!employee) {
        throw new Error('Employee not found');
    }

    // 2. Calculate PDS Data
    const educations = await db.select().from(pdsEducation).where(eq(pdsEducation.employeeId, employeeId));    // Extract highest education
    const highestEducation = educations.length > 0 ? educations[0].degreeCourse || 
                                            educations[0].level : null;

    const experiences = await db.select().from(pdsWorkExperience).where(eq(pdsWorkExperience.employeeId, employeeId));
    let totalExperienceYears = 0;
    for (const exp of experiences) {
        if (exp.dateFrom) {
            const start = new Date(exp.dateFrom);
            const end = exp.dateTo ? new Date(exp.dateTo) : new Date();
            const years = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 365);
            totalExperienceYears += years;
        }
    }
    const empExp = Math.floor(totalExperienceYears); // Round down to complete years

    const eligibilities = await db.select().from(pdsEligibility).where(eq(pdsEligibility.employeeId, employeeId));
    const eligibilityType = eligibilities.length > 0 ? eligibilities.map(e => e.eligibilityName).join(', ') : null;

    // 3. Get Position & QS
    const [position] = await db.select({
        id: plantillaPositions.id,
        positionTitle: plantillaPositions.positionTitle,
        salaryGrade: plantillaPositions.salaryGrade,
        qualificationStandardsId: plantillaPositions.qualificationStandardsId
    })
    .from(plantillaPositions)
    .where(eq(plantillaPositions.id, positionId))
    .limit(1);

    if (!position) {
        throw new Error('Position not found');
    }

    if (!position.qualificationStandardsId) {
        return {
            qualified: true,
            score: 100,
            missingRequirements: [],
            employeeDetails: {
                id: employee.id,
                name: `${employee.firstName} ${employee.lastName}`,
                employeeId: employee.employeeId || '',
                education: highestEducation,
                experienceYears: empExp,
                eligibility: eligibilityType
            },
            positionDetails: {
                id: position.id,
                title: position.positionTitle,
                salaryGrade: position.salaryGrade
            },
            requirements: {
                education: 'None',
                experienceYears: 0,
                trainingHours:   0,
                eligibility: 'None'
            }
        };
    }

    const [qs] = await db.select()
        .from(qualificationStandards)
        .where(eq(qualificationStandards.id, position.qualificationStandardsId))
        .limit(1);

    if (!qs) {
        throw new Error('Qualification Standard not found');
    }

    // 4. Validation Logic
    const missingRequirements: string[] = [];
    let score = 0;
    const maxScore = 4; // Education, Experience, Training, Eligibility

    // Education (25%)
    if (highestEducation) {
        score += 1;
    } else {
        missingRequirements.push(`Education: ${qs.educationRequirement}`);
    }

    // Experience (25%)
    const requiredExp = qs.experienceYears || 0;
    if (empExp >= requiredExp) {
        score += 1;
    } else {
        missingRequirements.push(`Experience: ${requiredExp} years required (has ${empExp} years)`);
    }

    // Training (25%)
    const requiredTraining = qs.trainingHours || 0;
    if (empExp > 0 || requiredTraining === 0) {
        score += 1;
    } else {
        missingRequirements.push(`Training: ${requiredTraining} hours required`);
    }

    // Eligibility (25%)
    if (eligibilityType) {
        const employeeElig = eligibilityType.toLowerCase();
        const requiredElig = (qs.eligibilityRequired || '').toLowerCase();

        if (
            requiredElig === '' || 
            employeeElig.includes(requiredElig) || 
            requiredElig.includes(employeeElig) ||
            employeeElig.includes('professional') || 
            employeeElig.includes('cpa') || 
            employeeElig.includes('engineer') ||
            employeeElig.includes('bar') ||
            employeeElig.includes('board') 
        ) {
            score += 1;
        } else {
            missingRequirements.push(`Eligibility: ${qs.eligibilityRequired} (has ${eligibilityType})`);
        }
    } else {
        missingRequirements.push(`Eligibility: ${qs.eligibilityRequired}`);
    }

    const qualificationScore = Math.round((score / maxScore) * 100);
    const qualified = qualificationScore === 100;

    return {
        qualified,
        score: qualificationScore,
        missingRequirements,
        employeeDetails: {
            id: employee.id,
            name: `${employee.firstName} ${employee.lastName}`,
            employeeId: employee.employeeId || '',
            education: highestEducation,
            experienceYears: empExp,
            eligibility: eligibilityType
        },
        positionDetails: {
            id: position.id,
            title: position.positionTitle,
            salaryGrade: position.salaryGrade
        },
        requirements: {
            education: qs.educationRequirement,
            experienceYears: qs.experienceYears || 0,
            trainingHours: qs.trainingHours || 0,
            eligibility: qs.eligibilityRequired
        }
    };
  }
}
