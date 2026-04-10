import { db } from '../db/index.js';
import { authentication } from '../db/tables/auth.js';
import { pdsPersonalInformation } from '../db/tables/pds.js';
import { recruitmentApplicants } from '../db/tables/recruitment.js';
import { eq, or, sql } from 'drizzle-orm';

export interface CheckUniquenessParams {
  email?: string | null;
  umidNumber?: string | null;
  philsysId?: string | null;
  philhealthNumber?: string | null;
  pagibigNumber?: string | null;
  tinNumber?: string | null;
  gsisNumber?: string | null;
  employeeId?: string | null;
  agencyEmployeeNo?: string | null;
  excludeAuthId?: number; // Don't flag the user's own record when updating
  excludeApplicantId?: number; // Don't flag the applicant's own record
}

/**
 * Checks across both `authentication` and `recruitment_applicants` 
 * to ensure that the provided email and government IDs are completely unique system-wide.
 * Returns an object mapping field names to their specific error messages if duplicates are found.
 */
export async function checkSystemWideUniqueness(params: CheckUniquenessParams): Promise<Record<string, string>> {
  const errors: Record<string, string> = {};

  // Skip validation only if absolutely nothing is provided
  if (!params.email && !params.umidNumber && !params.philsysId && !params.philhealthNumber && !params.pagibigNumber && !params.tinNumber && !params.gsisNumber && !params.employeeId && !params.agencyEmployeeNo) {
    return errors;
  }

  // Check Authentication Table (Email)
  if (params.email && params.email.trim() !== '') {
    const trimmedEmail = params.email.trim().toLowerCase();
    const existingAuths = await db.query.authentication.findMany({
      where: sql`LOWER(${authentication.email}) = ${trimmedEmail}`
    });
    for (const auth of existingAuths) {
      if (params.excludeAuthId && auth.id === params.excludeAuthId) continue;
      errors.email = `Email '${params.email}' is already registered to an employee.`;
    }
  }

  // Check Authentication Table (Employee ID)
  if (params.employeeId && params.employeeId.trim() !== '') {
      const trimmedId = params.employeeId.trim();
      const existingAuths = await db.query.authentication.findMany({
          where: sql`LOWER(${authentication.employeeId}) = LOWER(${trimmedId})`
      });
      for (const auth of existingAuths) {
          if (params.excludeAuthId && auth.id === params.excludeAuthId) continue;
          errors.employeeId = `Employee ID '${params.employeeId}' is already in use.`;
      }
  }

  // Check PDS Personal Information Table (Govt IDs)
  const pdsConditions = [];
  if (params.umidNumber) pdsConditions.push(eq(pdsPersonalInformation.umidNumber, params.umidNumber));
  if (params.philsysId) pdsConditions.push(eq(pdsPersonalInformation.philsysId, params.philsysId));
  if (params.philhealthNumber) pdsConditions.push(eq(pdsPersonalInformation.philhealthNumber, params.philhealthNumber));
  if (params.pagibigNumber) pdsConditions.push(eq(pdsPersonalInformation.pagibigNumber, params.pagibigNumber));
  if (params.tinNumber) pdsConditions.push(eq(pdsPersonalInformation.tinNumber, params.tinNumber));
  if (params.gsisNumber) pdsConditions.push(eq(pdsPersonalInformation.gsisNumber, params.gsisNumber));
  if (params.agencyEmployeeNo) pdsConditions.push(eq(pdsPersonalInformation.agencyEmployeeNo, params.agencyEmployeeNo));

  if (pdsConditions.length > 0) {
    const existingPdsRecords = await db.query.pdsPersonalInformation.findMany({
      where: or(...pdsConditions)
    });

    for (const record of existingPdsRecords) {
      if (params.excludeAuthId && record.employeeId === params.excludeAuthId) continue;
      
      const checkMatch = (val: string | null | undefined, target: string | null | undefined) => 
        target && target.trim() !== '' && val === target.trim();

      if (checkMatch(record.umidNumber, params.umidNumber)) errors.umidNumber = `UMID '${params.umidNumber}' is already registered to an employee.`;
      if (checkMatch(record.philsysId, params.philsysId)) errors.philsysId = `PhilSys ID '${params.philsysId}' is already registered to an employee.`;
      if (checkMatch(record.philhealthNumber, params.philhealthNumber)) errors.philhealthNumber = `PhilHealth Number '${params.philhealthNumber}' is already registered to an employee.`;
      if (checkMatch(record.pagibigNumber, params.pagibigNumber)) errors.pagibigNumber = `Pag-IBIG Number '${params.pagibigNumber}' is already registered to an employee.`;
      if (checkMatch(record.tinNumber, params.tinNumber)) errors.tinNumber = `TIN '${params.tinNumber}' is already registered to an employee.`;
      if (checkMatch(record.gsisNumber, params.gsisNumber)) errors.gsisNumber = `GSIS Number '${params.gsisNumber}' is already registered to an employee.`;
      if (checkMatch(record.agencyEmployeeNo, params.agencyEmployeeNo)) errors.agencyEmployeeNo = `Agency No. '${params.agencyEmployeeNo}' is already registered.`;
    }
  }

  // Check Recruitment Applicants Table
  const appConditions = [];
  if (params.email) appConditions.push(eq(recruitmentApplicants.email, params.email));
  if (params.umidNumber) appConditions.push(eq(recruitmentApplicants.umidNumber, params.umidNumber));
  if (params.philsysId) appConditions.push(eq(recruitmentApplicants.philsysId, params.philsysId));
  if (params.philhealthNumber) appConditions.push(eq(recruitmentApplicants.philhealthNumber, params.philhealthNumber));
  if (params.pagibigNumber) appConditions.push(eq(recruitmentApplicants.pagibigNumber, params.pagibigNumber));
  if (params.tinNumber) appConditions.push(eq(recruitmentApplicants.tinNumber, params.tinNumber));
  if (params.gsisNumber) appConditions.push(eq(recruitmentApplicants.gsisNumber, params.gsisNumber));

  if (appConditions.length > 0) {
    const existingApps = await db.select({
      id: recruitmentApplicants.id,
      email: recruitmentApplicants.email,
      umidNumber: recruitmentApplicants.umidNumber,
      philsysId: recruitmentApplicants.philsysId,
      philhealthNumber: recruitmentApplicants.philhealthNumber,
      pagibigNumber: recruitmentApplicants.pagibigNumber,
      tinNumber: recruitmentApplicants.tinNumber,
      gsisNumber: recruitmentApplicants.gsisNumber
    })
    .from(recruitmentApplicants)
    .where(or(...appConditions));

    for (const app of existingApps) {
      const appId = Number(app.id);
      const excludeAppId = params.excludeApplicantId ? Number(params.excludeApplicantId) : null;
      
      console.log(`[DEBUG] Duplicate check - ID: ${appId}, Exclude: ${excludeAppId}, Match: ${appId === excludeAppId}`);
      
      if (excludeAppId && appId === excludeAppId) {
        console.log(`[DEBUG] Successfully excluded applicant ${appId}`);
        continue;
      }
      
      const checkMatch = (val: string | null | undefined, target: string | null | undefined) => 
        target && target.trim() !== '' && val === target.trim();
      
      const checkEmailMatch = (val: string | null | undefined, target: string | null | undefined) =>
        target && target.trim() !== '' && val?.toLowerCase() === target.trim().toLowerCase();

      if (checkEmailMatch(app.email, params.email)) errors.email = `Email '${params.email}' is already used by an applicant.`;
      if (checkMatch(app.umidNumber, params.umidNumber)) errors.umidNumber = `UMID '${params.umidNumber}' is already used by an applicant.`;
      if (checkMatch(app.philsysId, params.philsysId)) errors.philsysId = `PhilSys ID '${params.philsysId}' is already used by an applicant.`;
      if (checkMatch(app.philhealthNumber, params.philhealthNumber)) errors.philhealthNumber = `PhilHealth Number '${params.philhealthNumber}' is already used by an applicant.`;
      if (checkMatch(app.pagibigNumber, params.pagibigNumber)) errors.pagibigNumber = `Pag-IBIG Number '${params.pagibigNumber}' is already used by an applicant.`;
      if (checkMatch(app.tinNumber, params.tinNumber)) errors.tinNumber = `TIN '${params.tinNumber}' is already used by an applicant.`;
      if (checkMatch(app.gsisNumber, params.gsisNumber)) errors.gsisNumber = `GSIS Number '${params.gsisNumber}' is already used by an applicant.`;
    }
  }

  return errors;
}
