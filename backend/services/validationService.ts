import { db } from '../db/index.js';
import { authentication } from '../db/tables/auth.js';
import { pdsPersonalInformation } from '../db/tables/pds.js';
import { recruitmentApplicants } from '../db/tables/recruitment.js';
import { eq, or } from 'drizzle-orm';

export interface CheckUniquenessParams {
  email?: string | null;
  umidNumber?: string | null;
  philsysId?: string | null;
  philhealthNumber?: string | null;
  pagibigNumber?: string | null;
  tinNumber?: string | null;
  gsisNumber?: string | null;
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
  
  if (params.email && !params.umidNumber && !params.philsysId && !params.philhealthNumber && !params.pagibigNumber && !params.tinNumber && !params.gsisNumber) {
    return errors;
  }

  // Check Authentication Table (Email)
  if (params.email) {
    const existingAuths = await db.query.authentication.findMany({
      where: eq(authentication.email, params.email)
    });
    for (const auth of existingAuths) {
      if (params.excludeAuthId && auth.id === params.excludeAuthId) continue;
      if (auth.email === params.email) errors.email = `Email '${params.email}' is already registered to an employee.`;
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

  if (pdsConditions.length > 0) {
    const existingPdsRecords = await db.query.pdsPersonalInformation.findMany({
      where: or(...pdsConditions)
    });

    for (const record of existingPdsRecords) {
      if (params.excludeAuthId && record.employeeId === params.excludeAuthId) continue;
      
      if (params.umidNumber && record.umidNumber === params.umidNumber) errors.umidNumber = `UMID '${params.umidNumber}' is already registered to an employee.`;
      if (params.philsysId && record.philsysId === params.philsysId) errors.philsysId = `PhilSys ID '${params.philsysId}' is already registered to an employee.`;
      if (params.philhealthNumber && record.philhealthNumber === params.philhealthNumber) errors.philhealthNumber = `PhilHealth Number '${params.philhealthNumber}' is already registered to an employee.`;
      if (params.pagibigNumber && record.pagibigNumber === params.pagibigNumber) errors.pagibigNumber = `Pag-IBIG Number '${params.pagibigNumber}' is already registered to an employee.`;
      if (params.tinNumber && record.tinNumber === params.tinNumber) errors.tinNumber = `TIN '${params.tinNumber}' is already registered to an employee.`;
      if (params.gsisNumber && record.gsisNumber === params.gsisNumber) errors.gsisNumber = `GSIS Number '${params.gsisNumber}' is already registered to an employee.`;
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
    const existingApps = await db.query.recruitmentApplicants.findMany({
      where: or(...appConditions)
    });

    for (const app of existingApps) {
      if (params.excludeApplicantId && app.id === params.excludeApplicantId) continue;
      
      if (params.email && app.email === params.email) errors.email = `Email '${params.email}' is already used by an applicant.`;
      if (params.umidNumber && app.umidNumber === params.umidNumber) errors.umidNumber = `UMID '${params.umidNumber}' is already used by an applicant.`;
      if (params.philsysId && app.philsysId === params.philsysId) errors.philsysId = `PhilSys ID '${params.philsysId}' is already used by an applicant.`;
      if (params.philhealthNumber && app.philhealthNumber === params.philhealthNumber) errors.philhealthNumber = `PhilHealth Number '${params.philhealthNumber}' is already used by an applicant.`;
      if (params.pagibigNumber && app.pagibigNumber === params.pagibigNumber) errors.pagibigNumber = `Pag-IBIG Number '${params.pagibigNumber}' is already used by an applicant.`;
      if (params.tinNumber && app.tinNumber === params.tinNumber) errors.tinNumber = `TIN '${params.tinNumber}' is already used by an applicant.`;
      if (params.gsisNumber && app.gsisNumber === params.gsisNumber) errors.gsisNumber = `GSIS Number '${params.gsisNumber}' is already used by an applicant.`;
    }
  }

  return errors;
}

