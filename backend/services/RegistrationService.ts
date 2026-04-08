import crypto from 'node:crypto';
import { db } from '../db/index.js';
import { authentication, bioEnrolledUsers, pdsHrDetails, departments, plantillaPositions } from '../db/schema.js';
import {
  pdsPersonalInformation,
  pdsFamily,
  pdsEducation,
  pdsEligibility,
  pdsWorkExperience,
  pdsVoluntaryWork,
  pdsLearningDevelopment,
  pdsOtherInfo,
  pdsReferences,
  pdsDeclarations,
} from '../db/tables/pds.js';
import { eq, or, and, sql, ne } from 'drizzle-orm';
import { RegisterSchema } from '../schemas/authSchema.js';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { normalizeIdSql } from '../utils/idUtils.js';
import { generateOTP } from '../utils/emailUtils.js';
import { UserRole } from '../types/index.js';

/**
 * Converts empty strings to null, useful for optional fields and date fields
 */
function emptyToNull<T>(value: T | string | null | undefined): T | null {
  if (value === '' || value === undefined) return null;
  return value as T;
}

/**
 * Extracts year from a date string or returns null for empty values
 * Handles formats like "2022-07-14" -> "2022" or "2022" -> "2022"
 */
function extractYear(dateValue: string | null | undefined): string | null {
  if (!dateValue || dateValue === '') return null;
  // If it's already just a year (4 digits), return it
  if (/^\d{4}$/.test(dateValue)) return dateValue;
  // Extract year from date format like "2022-07-14"
  const match = dateValue.match(/^(\d{4})/);
  return match ? match[1] : null;
}

/**
 * Checks if a value is a placeholder text that should be treated as null/empty
 */
function isPlaceholder(value: string | null | undefined): boolean {
  if (!value) return true;
  const trimmed = value.trim();
  if (!trimmed) return true;

  const placeholders = [
    '(Continue on separate sheet if necessary)',
    'N/A',
    'n/a',
    'NA',
    'na',
    'NONE',
    'none',
    'None'
  ];

  return placeholders.includes(trimmed);
}

/**
 * Sanitizes an object by converting all empty string values and placeholder text to null
 */
function sanitizeObject<T extends Record<string, any>>(obj: T): T {
  const result = { ...obj };
  for (const key in result) {
    const value = result[key];
    if (typeof value === 'string' && (value === '' || isPlaceholder(value))) {
      result[key] = null as any;
    }
  }
  return result;
}

export class RegistrationService {
  static async registerUser(
    data: z.infer<typeof RegisterSchema>,
    options: { isFinalizingSetup?: boolean; ignoreDuplicateWarning?: boolean } = {}
  ) {
    const { employeeId, email, password } = data;
    const inputEmployeeId = String(employeeId || '');

    // 1. Biometric enrollment check
    const [enrolled] = await db.select().from(bioEnrolledUsers).where(
      and(
        sql`${normalizeIdSql(bioEnrolledUsers.employeeId)} = ${normalizeIdSql(inputEmployeeId)}`,
        eq(bioEnrolledUsers.userStatus, 'active')
      )
    ).limit(1);

    if (!enrolled) {
      console.warn(`[RegistrationService] Biometric record not found for: ${inputEmployeeId}`);
    }

    const actualEmployeeId = enrolled?.employeeId || inputEmployeeId;
    const finalEmail = email || `${actualEmployeeId}@chrmo.local`;

    // 2. Check for existing account
    const existingUser = await db.query.authentication.findFirst({
      where: or(
        eq(authentication.employeeId, actualEmployeeId),
        eq(authentication.email, finalEmail)
      ),
      with: { hrDetails: true }
    });

    const effectiveFinalizingSetup = options.isFinalizingSetup || (existingUser?.hrDetails?.profileStatus === 'Initial');

    if (existingUser) {
      if (!effectiveFinalizingSetup) {
        if (existingUser.email === finalEmail) {
          throw new Error('Email already exists');
        }
        throw new Error('This Employee ID is already registered');
      }
    }

    // 3. Homonym (Duplicate Name) detection
    if (!options.ignoreDuplicateWarning) {
      const nameMatch = await db.query.authentication.findFirst({
        where: (auth, { eq: eqFn, or: orFn, and: andFn }) => andFn(
          eqFn(auth.firstName, data.firstName || ''),
          eqFn(auth.lastName, data.lastName || ''),
          data.middleName
            ? eqFn(auth.middleName, data.middleName)
            : orFn(eqFn(auth.middleName, ''), sql`${auth.middleName} IS NULL`),
          data.suffix
            ? eqFn(auth.suffix, data.suffix)
            : orFn(eqFn(auth.suffix, ''), sql`${auth.suffix} IS NULL`),
          effectiveFinalizingSetup && existingUser ? ne(auth.id, existingUser.id) : undefined
        )
      });
      if (nameMatch) {
        const err = new Error('DUPLICATE_NAME');
        (err as NodeJS.ErrnoException).code = 'DUPLICATE_NAME';
        throw err;
      }
    }

    // 4. Password logic — no hardcoded defaults
    let hashedPassword = existingUser?.passwordHash || '';
    const isDummyPassword = password === '********' || password === '••••••••';
    const shouldUpdatePassword = password && !isDummyPassword && password.length >= 8;

    if (shouldUpdatePassword) {
      const salt = await bcrypt.genSalt(10);
      hashedPassword = await bcrypt.hash(password, salt);
    } else if (!effectiveFinalizingSetup && !existingUser) {
      // Generate a secure random temporary password — never hardcoded
      const tempPassword = crypto.randomBytes(12).toString('base64url');
      const salt = await bcrypt.genSalt(10);
      hashedPassword = await bcrypt.hash(tempPassword, salt);
    }

    const verificationOTP = generateOTP();

    // 5. Determine role
    let assignedRole: UserRole = 'Employee';
    const anyData = data as typeof data & { position?: string; department?: string };
    const rawPos = anyData.position || '';
    const posMatch = rawPos.match(/^(.*)\s\((.*)\)$/);
    const positionTitle = posMatch ? posMatch[1].trim() : rawPos;
    const itemNumber = posMatch ? posMatch[2].trim() : null;

    const posTitleLower = positionTitle.toLowerCase();
    const department = anyData.department || enrolled?.department || 'Unassigned';
    const deptLower = (department || '').toLowerCase();

    if (deptLower.includes('human resource') && posTitleLower.includes('department head')) {
      assignedRole = 'Human Resource';
    } else if (posTitleLower.includes('administrative officer')) {
      assignedRole = 'Administrator';
    }

    if (effectiveFinalizingSetup && existingUser) {
      const currentRole = existingUser.role as UserRole;
      if ((currentRole === 'Administrator' || currentRole === 'Human Resource') && assignedRole === 'Employee') {
        assignedRole = currentRole;
      }
    }

    // 6. Resolve department and position IDs
    let departmentId: number | null = null;
    if (department && department !== 'Unassigned') {
      const existingDept = await db.query.departments.findFirst({
        where: eq(departments.name, department)
      });
      if (existingDept) departmentId = existingDept.id;
    }

    let positionId: number | null = null;
    if (itemNumber) {
      const pos = await db.query.plantillaPositions.findFirst({
        where: eq(plantillaPositions.itemNumber, itemNumber)
      });
      if (pos) positionId = pos.id;
    }

    if (effectiveFinalizingSetup && !departmentId && existingUser?.hrDetails?.departmentId) {
      departmentId = existingUser.hrDetails.departmentId;
    }

    const preserveVerification = effectiveFinalizingSetup && existingUser?.isVerified;
    const isHRAdmin = assignedRole === 'Administrator' || assignedRole === 'Human Resource';
    const finalIsVerified = (preserveVerification || isHRAdmin) ? true : false;

    let newUserId = existingUser?.id;

    // 7. UPSERT Transaction
    await db.transaction(async (tx) => {
      // AUTHENTICATION
      const authData = {
        employeeId: actualEmployeeId,
        email: finalEmail,
        passwordHash: hashedPassword,
        firstName: data.firstName || '',
        lastName: data.lastName || '',
        middleName: data.middleName || null,
        suffix: data.suffix || null,
        role: assignedRole,
        isVerified: finalIsVerified,
        verificationOtp: verificationOTP,
        otpExpiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
        onboardingStep: 'Dashboard'
      };

      if (existingUser) {
        await tx.update(authentication).set(authData).where(eq(authentication.id, existingUser.id));
      } else {
        const [insertedAuth] = await tx.insert(authentication).values(authData);
        newUserId = Number(insertedAuth.insertId);
      }

      if (!newUserId) throw new Error('Failed to get auth user ID');

      // HR DETAILS
      const hrData = {
        employeeId: newUserId,
        departmentId,
        positionId,
        jobTitle: positionTitle,
        employmentStatus: 'Active' as const,
        isMeycauayan: true,
        profileStatus: 'Complete' as const,
        dateHired: new Date().toISOString().split('T')[0],
      };

      if (existingUser?.hrDetails) {
        const { employeeId: _eid, ...hrUpdate } = hrData;
        await tx.update(pdsHrDetails).set(hrUpdate).where(eq(pdsHrDetails.id, existingUser.hrDetails.id));
      } else {
        await tx.insert(pdsHrDetails).values(hrData);
      }

      // PDS PERSONAL INFORMATION (upsert)
      const personalData = {
        employeeId: newUserId,
        birthDate: emptyToNull(data.birthDate),
        placeOfBirth: emptyToNull(data.placeOfBirth),
        gender: emptyToNull(data.gender),
        civilStatus: emptyToNull(data.civilStatus),
        heightM: emptyToNull(data.heightM?.toString()),
        weightKg: emptyToNull(data.weightKg?.toString()),
        bloodType: emptyToNull(data.bloodType),
        citizenship: data.citizenship || 'Filipino',
        citizenshipType: emptyToNull(data.citizenshipType),
        dualCountry: emptyToNull(data.dualCountry),
        telephoneNo: emptyToNull(data.telephoneNo),
        mobileNo: emptyToNull(data.mobileNo),
        gsisNumber: emptyToNull(data.gsisNumber),
        pagibigNumber: emptyToNull(data.pagibigNumber),
        philhealthNumber: emptyToNull(data.philhealthNumber),
        tinNumber: emptyToNull(data.tinNumber),
        umidNumber: emptyToNull(data.umidNumber),
        philsysId: emptyToNull(data.philsysId),
        agencyEmployeeNo: emptyToNull(data.agencyEmployeeNo),
        resHouseBlockLot: emptyToNull(data.resHouseBlockLot),
        resStreet: emptyToNull(data.resStreet),
        resSubdivision: emptyToNull(data.resSubdivision),
        resBarangay: emptyToNull(data.resBarangay),
        resCity: emptyToNull(data.resCity),
        resProvince: emptyToNull(data.resProvince),
        resRegion: emptyToNull(data.resRegion),
        residentialZipCode: emptyToNull(data.residentialZipCode),
        permHouseBlockLot: emptyToNull(data.permHouseBlockLot),
        permStreet: emptyToNull(data.permStreet),
        permSubdivision: emptyToNull(data.permSubdivision),
        permBarangay: emptyToNull(data.permBarangay),
        permCity: emptyToNull(data.permCity),
        permProvince: emptyToNull(data.permProvince),
        permRegion: emptyToNull(data.permRegion),
        permanentZipCode: emptyToNull(data.permanentZipCode),
      };
      await tx.insert(pdsPersonalInformation)
        .values(personalData)
        .onDuplicateKeyUpdate({ set: personalData });

      // PDS EDUCATION (delete + insert)
      if (data.educations && data.educations.length > 0) {
        // Filter out placeholder records
        const validEducations = data.educations.filter(edu => !isPlaceholder(edu.schoolName));

        if (validEducations.length > 0) {
          await tx.delete(pdsEducation).where(eq(pdsEducation.employeeId, newUserId));
          await tx.insert(pdsEducation).values(
            validEducations.map(edu => {
              const sanitized = sanitizeObject({ employeeId: newUserId!, ...edu });
              // Extract year from date fields (education table stores year only as VARCHAR(4))
              return {
                ...sanitized,
                dateFrom: extractYear(sanitized.dateFrom as any),
                dateTo: extractYear(sanitized.dateTo as any)
              };
            })
          );
        }
      }

      // PDS ELIGIBILITIES (delete + insert)
      if (data.eligibilities && data.eligibilities.length > 0) {
        // Filter out placeholder records
        const validEligibilities = data.eligibilities.filter(elig => !isPlaceholder(elig.eligibilityName));

        if (validEligibilities.length > 0) {
          await tx.delete(pdsEligibility).where(eq(pdsEligibility.employeeId, newUserId));
          await tx.insert(pdsEligibility).values(
            validEligibilities.map(elig => sanitizeObject({ employeeId: newUserId!, ...elig })) as any[]
          );
        }
      }

      // PDS WORK EXPERIENCE (delete + insert)
      if (data.workExperiences && data.workExperiences.length > 0) {
        // Filter out placeholder records
        const validWorkExperiences = data.workExperiences.filter(work =>
          !isPlaceholder(work.companyName) && !isPlaceholder(work.positionTitle)
        );

        if (validWorkExperiences.length > 0) {
          await tx.delete(pdsWorkExperience).where(eq(pdsWorkExperience.employeeId, newUserId));
          await tx.insert(pdsWorkExperience).values(
            validWorkExperiences.map(work => sanitizeObject({
              employeeId: newUserId!,
              ...work,
              monthlySalary: work.monthlySalary != null ? String(work.monthlySalary) : null,
            })) as any[]
          );
        }
      }

      // PDS FAMILY (delete + insert)
      if (data.familyBackground && data.familyBackground.length > 0) {
        // Filter out records without valid names (at least firstName or lastName should be present)
        const validFamilyBackground = data.familyBackground.filter(fam =>
          !isPlaceholder(fam.firstName) || !isPlaceholder(fam.lastName)
        );

        if (validFamilyBackground.length > 0) {
          await tx.delete(pdsFamily).where(eq(pdsFamily.employeeId, newUserId));
          await tx.insert(pdsFamily).values(
            validFamilyBackground.map(fam => sanitizeObject({ employeeId: newUserId!, ...fam }))
          );
        }
      }

      // PDS VOLUNTARY WORK (delete + insert)
      if (data.voluntaryWorks && data.voluntaryWorks.length > 0) {
        // Filter out placeholder records
        const validVoluntaryWorks = data.voluntaryWorks.filter(vol => !isPlaceholder(vol.organizationName));

        if (validVoluntaryWorks.length > 0) {
          await tx.delete(pdsVoluntaryWork).where(eq(pdsVoluntaryWork.employeeId, newUserId));
          await tx.insert(pdsVoluntaryWork).values(
            validVoluntaryWorks.map(vol => sanitizeObject({ employeeId: newUserId!, ...vol }))
          );
        }
      }

      // PDS LEARNING DEVELOPMENT (delete + insert) — canonical name
      if (data.learningDevelopments && data.learningDevelopments.length > 0) {
        // Filter out placeholder records
        const validLearningDevelopments = data.learningDevelopments.filter(t => !isPlaceholder(t.title));

        if (validLearningDevelopments.length > 0) {
          await tx.delete(pdsLearningDevelopment).where(eq(pdsLearningDevelopment.employeeId, newUserId));
          await tx.insert(pdsLearningDevelopment).values(
            validLearningDevelopments.map(t => sanitizeObject({ employeeId: newUserId!, ...t }))
          );
        }
      }

      // PDS REFERENCES (delete + insert)
      if (data.references && data.references.length > 0) {
        // Filter out placeholder records
        const validReferences = data.references.filter(r => !isPlaceholder(r.name));

        if (validReferences.length > 0) {
          await tx.delete(pdsReferences).where(eq(pdsReferences.employeeId, newUserId));
          await tx.insert(pdsReferences).values(
            validReferences.map(r => sanitizeObject({ employeeId: newUserId!, ...r }))
          );
        }
      }

      // PDS DECLARATIONS (delete + insert)
      if (data.declarations) {
        await tx.delete(pdsDeclarations).where(eq(pdsDeclarations.employeeId, newUserId));
        await tx.insert(pdsDeclarations).values(sanitizeObject({ employeeId: newUserId!, ...data.declarations }));
      }

      // PDS OTHER INFO (delete + insert)
      if (data.otherInfo && data.otherInfo.length > 0) {
        // Filter out records with empty descriptions (description is required)
        const validOtherInfo = data.otherInfo.filter(o => !isPlaceholder(o.description));

        if (validOtherInfo.length > 0) {
          await tx.delete(pdsOtherInfo).where(eq(pdsOtherInfo.employeeId, newUserId));
          await tx.insert(pdsOtherInfo).values(
            validOtherInfo.map(o => sanitizeObject({ employeeId: newUserId!, type: o.type, description: o.description }))
          );
        }
      }
    });

    return {
      userId: newUserId,
      actualEmployeeId,
      finalEmail,
      verificationOTP,
      isVerified: finalIsVerified,
    };
  }
}
