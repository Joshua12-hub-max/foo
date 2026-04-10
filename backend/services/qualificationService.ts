
import { db } from '../db/index.js';
import { 
    qualificationStandards, 
    authentication, 
    plantillaPositions, 
    pdsEducation, 
    pdsWorkExperience, 
    pdsEligibility,
    pdsLearningDevelopment
} from '../db/schema.js';
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
    trainingHours: number;
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

const EDUCATION_RANK: Record<string, number> = {
    'None': 0,
    'Elementary': 1,
    'Secondary': 2,
    'Vocational': 3,
    'College': 4,
    'Graduate Studies': 5
};

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
    
    // Education
    const educations = await db.select().from(pdsEducation).where(eq(pdsEducation.employeeId, employeeId));
    let highestRank = 0;
    let highestEduLabel = 'None';
    
    for (const edu of educations) {
        const rank = EDUCATION_RANK[edu.level] || 0;
        if (rank > highestRank) {
            highestRank = rank;
            highestEduLabel = edu.degreeCourse || edu.level;
        }
    }

    // Experience
    const experiences = await db.select().from(pdsWorkExperience).where(eq(pdsWorkExperience.employeeId, employeeId));
    let totalExperienceYears = 0;
    for (const exp of experiences) {
        if (exp.dateFrom) {
            const start = new Date(exp.dateFrom);
            const end = (exp.dateTo && exp.dateTo.toLowerCase() !== 'present') 
                ? new Date(exp.dateTo) 
                : new Date();
            
            if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
                const years = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
                totalExperienceYears += Math.max(0, years);
            }
        }
    }
    const empExpYears = Math.floor(totalExperienceYears * 10) / 10; // 1 decimal place

    // Training
    const trainings = await db.select().from(pdsLearningDevelopment).where(eq(pdsLearningDevelopment.employeeId, employeeId));
    const totalTrainingHours = trainings.reduce((sum, t) => sum + (t.hoursNumber || 0), 0);

    // Eligibility
    const eligibilities = await db.select().from(pdsEligibility).where(eq(pdsEligibility.employeeId, employeeId));
    const eligibilityNames = eligibilities.map(e => e.eligibilityName);

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

    const defaultRequirements = {
        education: 'None',
        experienceYears: 0,
        trainingHours: 0,
        eligibility: 'None'
    };

    if (!position.qualificationStandardsId) {
        return {
            qualified: true,
            score: 100,
            missingRequirements: [],
            employeeDetails: {
                id: employee.id,
                name: `${employee.lastName}, ${employee.firstName}`,
                employeeId: employee.employeeId || '',
                education: highestEduLabel,
                experienceYears: empExpYears,
                trainingHours: totalTrainingHours,
                eligibility: eligibilityNames.join(', ') || 'None'
            },
            positionDetails: {
                id: position.id,
                title: position.positionTitle,
                salaryGrade: position.salaryGrade
            },
            requirements: defaultRequirements
        };
    }

    const [qs] = await db.select()
        .from(qualificationStandards)
        .where(eq(qualificationStandards.id, position.qualificationStandardsId))
        .limit(1);

    if (!qs) {
        throw new Error('Qualification Standard not found');
    }

    // 4. Strict Validation Logic
    const missingRequirements: string[] = [];
    let passedCount = 0;
    const totalCriteria = 4;

    // A. Education Validation
    const reqEdu = qs.educationRequirement.toLowerCase();
    let eduPassed = false;
    
    // Check rank-based progression
    if (reqEdu.includes('graduate studies') || reqEdu.includes('master')) {
        eduPassed = highestRank >= 5;
    } else if (reqEdu.includes('college') || reqEdu.includes('bachelor')) {
        eduPassed = highestRank >= 4;
    } else if (reqEdu.includes('vocational')) {
        eduPassed = highestRank >= 3;
    } else if (reqEdu.includes('secondary') || reqEdu.includes('high school')) {
        eduPassed = highestRank >= 2;
    } else if (reqEdu.includes('elementary')) {
        eduPassed = highestRank >= 1;
    } else {
        // If "None" or unrecognizable, pass it
        eduPassed = true;
    }

    if (eduPassed) {
        passedCount++;
    } else {
        missingRequirements.push(`Education: Requires ${qs.educationRequirement} (Current: ${highestEduLabel})`);
    }

    // B. Experience Validation
    const reqExp = qs.experienceYears || 0;
    if (empExpYears >= reqExp) {
        passedCount++;
    } else {
        missingRequirements.push(`Experience: Requires ${reqExp} years (Current: ${empExpYears} years)`);
    }

    // C. Training Validation
    const reqTraining = qs.trainingHours || 0;
    if (totalTrainingHours >= reqTraining) {
        passedCount++;
    } else {
        missingRequirements.push(`Training: Requires ${reqTraining} hours (Current: ${totalTrainingHours} hours)`);
    }

    // D. Eligibility Validation
    const reqElig = (qs.eligibilityRequired || '').toLowerCase();
    let eligPassed = reqElig === '' || reqElig === 'none' || reqElig === 'n/a';
    
    if (!eligPassed) {
        for (const empElig of eligibilityNames) {
            const lowEmpElig = empElig.toLowerCase();
            if (lowEmpElig.includes(reqElig) || reqElig.includes(lowEmpElig)) {
                eligPassed = true;
                break;
            }
            // Broad categories
            if (reqElig.includes('career service') && (lowEmpElig.includes('professional') || lowEmpElig.includes('subprofessional'))) {
                eligPassed = true; break;
            }
            if ((reqElig.includes('ra 1080') || reqElig.includes('board') || reqElig.includes('bar')) && 
                (lowEmpElig.includes('board') || lowEmpElig.includes('bar') || lowEmpElig.includes('professional'))) {
                eligPassed = true; break;
            }
        }
    }

    if (eligPassed) {
        passedCount++;
    } else {
        missingRequirements.push(`Eligibility: Requires ${qs.eligibilityRequired} (Current: ${eligibilityNames.join(', ') || 'None'})`);
    }

    const score = Math.round((passedCount / totalCriteria) * 100);
    const qualified = passedCount === totalCriteria;

    return {
        qualified,
        score,
        missingRequirements,
        employeeDetails: {
            id: employee.id,
            name: `${employee.lastName}, ${employee.firstName}`,
            employeeId: employee.employeeId || '',
            education: highestEduLabel,
            experienceYears: empExpYears,
            trainingHours: totalTrainingHours,
            eligibility: eligibilityNames.join(', ') || 'None'
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
