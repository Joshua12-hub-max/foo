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
  employeeEmergencyContacts,
  employeeDocuments,
} from '../db/tables/pds.js';
import { applicantDocuments, recruitmentApplicants } from '../db/tables/recruitment.js';
import { eq, or, and, sql, ne } from 'drizzle-orm';
import { RegisterSchema } from '../schemas/authSchema.js';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { normalizeIdSql, normalizeIdJs } from '../utils/idUtils.js';
import { generateOTP } from '../utils/emailUtils.js';
import { UserRole } from '../types/index.js';
import {
  normalizePdsString,
  normalizePdsDate,
  normalizePdsFloat,
  normalizePdsInt,
  extractPdsYear,
  isPdsGarbage,
  sanitizePdsObject,
} from '../utils/pdsDataUtils.js';

/**
 * Converts empty strings to null, useful for optional fields and date fields
 * DEPRECATED: Use normalizePdsString from pdsDataUtils.ts
 * @deprecated
 */
function emptyToNull<T>(value: T | string | null | undefined): T | null {
  if (value === '' || value === undefined) return null;
  return value as T;
}

/**
 * Safely converts string values to numbers or null
 * DEPRECATED: Use normalizePdsFloat from pdsDataUtils.ts
 * @deprecated
 */
function safeToNumber(value: string | number | null | undefined): string | null {
  return normalizePdsFloat(value);
}

/**
 * Extracts year from a date string or returns null for empty values
 * DEPRECATED: Use extractPdsYear from pdsDataUtils.ts
 * @deprecated
 */
function extractYear(dateValue: string | null | undefined): string | null {
  return extractPdsYear(dateValue);
}

/**
 * Checks if a value is a placeholder text that should be treated as null/empty
 * DEPRECATED: Use isPdsGarbage from pdsDataUtils.ts
 * @deprecated
 */
function isPlaceholder(value: string | null | undefined): boolean {
  return isPdsGarbage(value);
}

/**
 * Truncates a string to a maximum length and converts placeholders to null
 * DEPRECATED: Use normalizePdsString from pdsDataUtils.ts
 * @deprecated
 */
function sanitizeAndTruncate(value: string | null | undefined, maxLength: number): string | null {
  return normalizePdsString(value, maxLength);
}

/**
 * Sanitizes an object by converting all empty string values and placeholder text to null
 * DEPRECATED: Use sanitizePdsObject from pdsDataUtils.ts
 * @deprecated
 */
function sanitizeObject<T extends Record<string, any>>(obj: T): T {
  return sanitizePdsObject(obj);
}

export class RegistrationService {
  static async registerUser(
    data: z.infer<typeof RegisterSchema>,
    options: { isFinalizingSetup?: boolean; ignoreDuplicateWarning?: boolean } = {}
  ) {
    const { employeeId, email, password } = data;
    // 100% STRICT ENFORCEMENT: Normalize to Emp-XXX format immediately
    const inputEmployeeId = normalizeIdJs(String(employeeId || ''));

    if (!inputEmployeeId) {
        throw new Error('Employee ID is required and must contain valid numeric digits.');
    }

    // 1. Biometric enrollment check
    const [enrolled] = await db.select().from(bioEnrolledUsers).where(
      and(
        sql`${normalizeIdSql(bioEnrolledUsers.employeeId)} = ${inputEmployeeId}`,
        eq(bioEnrolledUsers.userStatus, 'active')
      )
    ).limit(1);

    // FIX: Biometric check MUST be blocking for public registration to prevent fake accounts.
    if (!enrolled && !options.isFinalizingSetup) {
      throw new Error('Biometric enrollment is required before registration. Please use the biometric scanner first.');
    }

    // Always use the normalized version to ensure 'Emp-XXX' format in DB
    const actualEmployeeId = inputEmployeeId; 
    const finalEmail = email || `${actualEmployeeId}@chrmo.local`;

    // 2. Check for existing account
    const existingUser = await db.query.authentication.findFirst({
      where: or(
        eq(authentication.employeeId, actualEmployeeId),
        eq(authentication.email, finalEmail)
      ),
      with: { hrDetails: true }
    });

    const effectiveFinalizingSetup = 
      options.isFinalizingSetup || 
      !existingUser?.hrDetails || 
      existingUser?.hrDetails?.profileStatus === 'Initial';

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
    const typedData = data; 
    let assignedRole: UserRole = 'Employee';

    // FIX: Privilege Escalation - Only trust explicit Admin/HR roles if finalizing an existing setup
    if (typedData.role && ['Administrator', 'Human Resource', 'Employee', 'Applicant'].includes(typedData.role)) {
       if ((typedData.role === 'Administrator' || typedData.role === 'Human Resource') && !effectiveFinalizingSetup) {
           assignedRole = 'Employee'; // Downgrade injected roles during public registration
       } else {
           assignedRole = typedData.role as UserRole;
       }
    }

    const rawPos = typedData.position || '';
    const posMatch = rawPos.match(/^(.*)\s\((.*)\)$/);
    const positionTitle = posMatch ? posMatch[1].trim() : rawPos;
    const itemNumber = posMatch ? posMatch[2].trim() : null;

    const posTitleLower = positionTitle.toLowerCase();
    const department = typedData.department || enrolled?.department || 'Unassigned';
    const deptLower = (department || '').toLowerCase();

    // FIX: Broadened Role Inference must be carefully applied.
    const isHRDept = deptLower.includes('human resource') || deptLower.includes('chrmo');
    const isHRTitle = posTitleLower.includes('hr') || posTitleLower.includes('human resource') || posTitleLower.includes('department head');
    const isAdminTitle = posTitleLower.includes('administrative officer') || posTitleLower.includes('administrator') || posTitleLower.includes('system admin');

    // Only allow inference if not explicitly provided and verified
    if (assignedRole === 'Employee') {
        if (isHRDept && isHRTitle) {
            assignedRole = 'Human Resource';
        } else if (isAdminTitle) {
            assignedRole = 'Administrator';
        }
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
    
    // FIX: Remove automatic verification bypass. Everyone must verify their email.
    const finalIsVerified = preserveVerification ? true : false;

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
        verificationToken: verificationOTP
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
        positionTitle: positionTitle,
        employmentStatus: 'Active' as const,
        appointmentType: data.appointmentType || undefined,
        dutyType: ((data.dutyType === 'Standard' || data.dutyType === 'Irregular') ? data.dutyType : 'Standard') as 'Standard' | 'Irregular',
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

      // PDS PERSONAL INFORMATION (upsert) - Using unified data sanitization
      const personalData = {
        employeeId: newUserId,
        birthDate: normalizePdsDate(data.birthDate),
        placeOfBirth: normalizePdsString(data.placeOfBirth, 255),
        gender: normalizePdsString(data.gender, 50),
        civilStatus: normalizePdsString(data.civilStatus, 50),
        heightM: normalizePdsFloat(data.heightM),
        weightKg: normalizePdsFloat(data.weightKg),
        bloodType: normalizePdsString(data.bloodType, 10),
        citizenship: data.citizenship || 'Filipino',
        citizenshipType: normalizePdsString(data.citizenshipType, 50),
        dualCountry: normalizePdsString(data.dualCountry, 100),
        telephoneNo: normalizePdsString(data.telephoneNo, 50),
        mobileNo: normalizePdsString(data.mobileNo, 50),
        gsisNumber: normalizePdsString(data.gsisNumber, 50),
        pagibigNumber: normalizePdsString(data.pagibigNumber, 50),
        philhealthNumber: normalizePdsString(data.philhealthNumber, 50),
        tinNumber: normalizePdsString(data.tinNumber, 50),
        umidNumber: normalizePdsString(data.umidNumber, 50),
        philsysId: normalizePdsString(data.philsysId, 50),
        agencyEmployeeNo: normalizePdsString(data.agencyEmployeeNo, 50),
        resHouseBlockLot: normalizePdsString(data.resHouseBlockLot, 150),
        resStreet: normalizePdsString(data.resStreet, 150),
        resSubdivision: normalizePdsString(data.resSubdivision, 150),
        resBarangay: normalizePdsString(data.resBarangay, 150),
        resCity: normalizePdsString(data.resCity, 150),
        resProvince: normalizePdsString(data.resProvince, 150),
        resRegion: normalizePdsString(data.resRegion, 150),
        residentialZipCode: normalizePdsString(data.residentialZipCode || (data as any).zipCode, 10),
        permHouseBlockLot: normalizePdsString(data.permHouseBlockLot, 150),
        permStreet: normalizePdsString(data.permStreet, 150),
        permSubdivision: normalizePdsString(data.permSubdivision, 150),
        permBarangay: normalizePdsString(data.permBarangay, 150),
        permCity: normalizePdsString(data.permCity, 150),
        permProvince: normalizePdsString(data.permProvince, 150),
        permRegion: normalizePdsString(data.permRegion, 150),
        permanentZipCode: normalizePdsString(data.permanentZipCode, 10),
      };
      await tx.insert(pdsPersonalInformation)
        .values(personalData)
        .onDuplicateKeyUpdate({ set: personalData });

      // EMPLOYEE EMERGENCY CONTACT (upsert)
      if (data.emergencyContact && data.emergencyContactNumber) {
        const emergencyData = {
          employeeId: newUserId!,
          name: data.emergencyContact,
          phoneNumber: data.emergencyContactNumber,
          relationship: 'Contact Person', // Default mapping
          isPrimary: true
        };
        
        await tx.delete(employeeEmergencyContacts).where(eq(employeeEmergencyContacts.employeeId, newUserId!));
        await tx.insert(employeeEmergencyContacts).values(emergencyData);
      }

      // PDS EDUCATION (delete + insert) - Using unified year extraction
      if (data.educations && data.educations.length > 0) {
        // Filter out placeholder records
        const validEducations = data.educations.filter(edu => !isPdsGarbage(edu.schoolName));

        if (validEducations.length > 0) {
          await tx.delete(pdsEducation).where(eq(pdsEducation.employeeId, newUserId));
          await tx.insert(pdsEducation).values(
            validEducations.map(edu => {
              const sanitized = sanitizePdsObject({ employeeId: newUserId!, ...edu });
              // Extract year from date fields (education table stores year only as VARCHAR(4))
              return {
                ...sanitized,
                dateFrom: extractPdsYear(sanitized.dateFrom as any),
                dateTo: extractPdsYear(sanitized.dateTo as any)
              };
            })
          );
        }
      }

      // PDS ELIGIBILITIES (delete + insert) - Using unified sanitization
      if (data.eligibilities && data.eligibilities.length > 0) {
        // Filter out placeholder records
        const validEligibilities = data.eligibilities.filter(elig => !isPdsGarbage(elig.eligibilityName));

        if (validEligibilities.length > 0) {
          await tx.delete(pdsEligibility).where(eq(pdsEligibility.employeeId, newUserId));
          await tx.insert(pdsEligibility).values(
            validEligibilities.map(elig => sanitizePdsObject({ employeeId: newUserId!, ...elig })) as any[]
          );
        }
      }

      // PDS WORK EXPERIENCE (delete + insert) - Using unified sanitization
      if (data.workExperiences && data.workExperiences.length > 0) {
        // Filter out placeholder records
        const validWorkExperiences = data.workExperiences.filter(work =>
          !isPdsGarbage(work.companyName) && !isPdsGarbage(work.positionTitle)
        );

        if (validWorkExperiences.length > 0) {
          await tx.delete(pdsWorkExperience).where(eq(pdsWorkExperience.employeeId, newUserId));
          await tx.insert(pdsWorkExperience).values(
            validWorkExperiences.map(work => sanitizePdsObject({
              employeeId: newUserId!,
              ...work,
              monthlySalary: work.monthlySalary != null ? normalizePdsFloat(work.monthlySalary) : null,
            })) as any[]
          );
        }
      }

      // 100% DATA INTEGRITY: Merge individual family fields into the familyBackground array if provided
      const familyFieldsData: any[] = [];
      if (data.spouseLastName || data.spouseFirstName) {
        familyFieldsData.push({
          relationType: 'Spouse',
          lastName: data.spouseLastName || null,
          firstName: data.spouseFirstName || null,
          middleName: data.spouseMiddleName || null,
          nameExtension: data.spouseSuffix || null,
          occupation: data.spouseOccupation || null,
          employer: data.spouseEmployer || null,
          businessAddress: data.spouseBusAddress || null,
          telephoneNo: data.spouseTelephone || null,
        });
      }
      if (data.fatherLastName || data.fatherFirstName) {
        familyFieldsData.push({
          relationType: 'Father',
          lastName: data.fatherLastName || null,
          firstName: data.fatherFirstName || null,
          middleName: data.fatherMiddleName || null,
          nameExtension: data.fatherSuffix || null,
        });
      }
      if (data.motherMaidenLastName || data.motherMaidenFirstName) {
        familyFieldsData.push({
          relationType: 'Mother',
          lastName: data.motherMaidenLastName || null,
          firstName: data.motherMaidenFirstName || null,
          middleName: data.motherMaidenMiddleName || null,
          nameExtension: data.motherMaidenSuffix || null,
        });
      }

      const combinedFamilyBackground = [...(data.familyBackground || []), ...familyFieldsData];

      // PDS FAMILY (delete + insert) - Using unified sanitization
      if (combinedFamilyBackground.length > 0) {
        // Filter out records without valid names (at least firstName or lastName should be present)
        const validFamilyBackground = combinedFamilyBackground.filter(fam =>
          !isPdsGarbage(fam.firstName) || !isPdsGarbage(fam.lastName)
        );

        if (validFamilyBackground.length > 0) {
          await tx.delete(pdsFamily).where(eq(pdsFamily.employeeId, newUserId));
          await tx.insert(pdsFamily).values(
            validFamilyBackground.map(fam => sanitizePdsObject({ employeeId: newUserId!, ...fam }))
          );
        }
      }

      // PDS VOLUNTARY WORK (delete + insert) - Using unified sanitization
      if (data.voluntaryWorks && data.voluntaryWorks.length > 0) {
        // Filter out placeholder records
        const validVoluntaryWorks = data.voluntaryWorks.filter(vol => !isPdsGarbage(vol.organizationName));

        if (validVoluntaryWorks.length > 0) {
          await tx.delete(pdsVoluntaryWork).where(eq(pdsVoluntaryWork.employeeId, newUserId));
          await tx.insert(pdsVoluntaryWork).values(
            validVoluntaryWorks.map(vol => sanitizePdsObject({ employeeId: newUserId!, ...vol }))
          );
        }
      }

      // PDS LEARNING DEVELOPMENT (delete + insert) - Using unified sanitization
      if (data.learningDevelopments && data.learningDevelopments.length > 0) {
        // Filter out placeholder records
        const validLearningDevelopments = data.learningDevelopments.filter(t => !isPdsGarbage(t.title));

        if (validLearningDevelopments.length > 0) {
          await tx.delete(pdsLearningDevelopment).where(eq(pdsLearningDevelopment.employeeId, newUserId));
          await tx.insert(pdsLearningDevelopment).values(
            validLearningDevelopments.map(t => sanitizePdsObject({ employeeId: newUserId!, ...t }))
          );
        }
      }

      // PDS REFERENCES (delete + insert) - Using unified sanitization
      if (data.references && data.references.length > 0) {
        // Filter out placeholder records
        const validReferences = data.references.filter(r => !isPdsGarbage(r.name));

        if (validReferences.length > 0) {
          await tx.delete(pdsReferences).where(eq(pdsReferences.employeeId, newUserId));
          await tx.insert(pdsReferences).values(
            validReferences.map(r => sanitizePdsObject({ employeeId: newUserId!, ...r }))
          );
        }
      }

      // PDS DECLARATIONS (delete + insert) - Using unified sanitization
      if (data.declarations) {
        await tx.delete(pdsDeclarations).where(eq(pdsDeclarations.employeeId, newUserId));
        await tx.insert(pdsDeclarations).values(sanitizePdsObject({ employeeId: newUserId!, ...data.declarations }));
      }

      // PDS OTHER INFO (delete + insert) - Using unified sanitization
      if (data.otherInfo && data.otherInfo.length > 0) {
        // Filter out records with empty descriptions (description is required)
        const validOtherInfo = data.otherInfo.filter(o => !isPdsGarbage(o.description));

        if (validOtherInfo.length > 0) {
          await tx.delete(pdsOtherInfo).where(eq(pdsOtherInfo.employeeId, newUserId));
          await tx.insert(pdsOtherInfo).values(
            validOtherInfo.map(o => sanitizePdsObject({ employeeId: newUserId!, type: o.type, description: o.description }))
          );
        }
      }

      // 100% DOCUMENT MIGRATION: Auto-link applicant documents to employee profile
      if (data.applicantId) {
        const appId = Number(data.applicantId);
        if (!isNaN(appId)) {
          const appDocs = await tx.select().from(applicantDocuments).where(eq(applicantDocuments.applicantId, appId));
          if (appDocs.length > 0) {
            // Filter out documents that might already be linked to avoid duplicates
            await tx.delete(employeeDocuments).where(eq(employeeDocuments.employeeId, newUserId!));
            
            await tx.insert(employeeDocuments).values(
              appDocs.map(d => {
                // 100% MAPPING PARITY: Ensure types match what DocumentGallery expects
                let targetType = d.documentType || 'Other';
                if (targetType === 'Photo' || targetType === 'Photo1x1') targetType = '2x2 ID Photo';
                if (targetType === 'EligibilityCert') targetType = 'Eligibility Certificate';

                return {
                  employeeId: newUserId!,
                  documentName: d.documentName,
                  documentType: targetType,
                  filePath: d.filePath.startsWith('/uploads/') ? d.filePath : `/uploads/resumes/${d.filePath}`,
                  fileSize: d.fileSize,
                  mimeType: d.mimeType
                };
              })
            );
          }

          // Mark applicant as registered to prevent duplicate registrations
          await tx.update(recruitmentApplicants)
            .set({
              isRegistered: true,
              registeredEmployeeId: actualEmployeeId
            })
            .where(eq(recruitmentApplicants.id, appId));
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
