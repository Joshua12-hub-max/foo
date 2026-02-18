
import { db } from '../db/index.js';
import { qualificationStandards, authentication, plantillaPositions } from '../db/schema.js';
import { eq } from 'drizzle-orm';

export interface ValidationResult {
  qualified: boolean;
  score: number;
  missingRequirements: string[];
  employeeDetails: {
    id: number;
    name: string;
    employee_id: string;
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
    // 1. Get Employee Details
    const [employee] = await db.select({
        id: authentication.id,
        firstName: authentication.firstName,
        lastName: authentication.lastName,
        employee_id: authentication.employeeId,
        eligibilityType: authentication.eligibilityType,
        highestEducation: authentication.highestEducation,
        yearsOfExperience: authentication.yearsOfExperience
    })
    .from(authentication)
    .where(eq(authentication.id, employeeId))
    .limit(1);

    if (!employee) {
        throw new Error('Employee not found');
    }

    // 2. Get Position & QS
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
                employee_id: employee.employee_id,
                education: employee.highestEducation,
                experienceYears: employee.yearsOfExperience || 0,
                eligibility: employee.eligibilityType
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

    // 3. Validation Logic
    const missingRequirements: string[] = [];
    let score = 0;
    const maxScore = 4; // Education, Experience, Training, Eligibility

    // Education (25%)
    if (employee.highestEducation) {
        score += 1;
    } else {
        missingRequirements.push(`Education: ${qs.educationRequirement}`);
    }

    // Experience (25%)
    const empExp = employee.yearsOfExperience || 0;
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
    if (employee.eligibilityType) {
        const employeeElig = employee.eligibilityType.toLowerCase();
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
            missingRequirements.push(`Eligibility: ${qs.eligibilityRequired} (has ${employee.eligibilityType})`);
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
            employee_id: employee.employee_id,
            education: employee.highestEducation,
            experienceYears: empExp,
            eligibility: employee.eligibilityType
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
