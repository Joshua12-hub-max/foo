import { db } from '../db/index.js';
import { authentication } from '../db/tables/auth.js';
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
  eligibilityNumber?: string | null;
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
  
  if (!params.email && !params.umidNumber && !params.philsysId && !params.philhealthNumber && !params.pagibigNumber && !params.tinNumber && !params.gsisNumber && !params.eligibilityNumber) {
    return errors;
  }

  // Check Authentication Table
  const authConditions = [];
  if (params.email) authConditions.push(eq(authentication.email, params.email));
  if (params.umidNumber) authConditions.push(eq(authentication.umidNumber, params.umidNumber));
  if (params.philsysId) authConditions.push(eq(authentication.philsysId, params.philsysId));
  if (params.philhealthNumber) authConditions.push(eq(authentication.philhealthNumber, params.philhealthNumber));
  if (params.pagibigNumber) authConditions.push(eq(authentication.pagibigNumber, params.pagibigNumber));
  if (params.tinNumber) authConditions.push(eq(authentication.tinNumber, params.tinNumber));
  if (params.gsisNumber) authConditions.push(eq(authentication.gsisNumber, params.gsisNumber));
  if (params.eligibilityNumber) authConditions.push(eq(authentication.eligibilityNumber, params.eligibilityNumber));

  if (authConditions.length > 0) {
    const existingAuths = await db.query.authentication.findMany({
      where: or(...authConditions)
    });

    for (const auth of existingAuths) {
      if (params.excludeAuthId && auth.id === params.excludeAuthId) continue;
      
      if (params.email && auth.email === params.email) errors.email = `Email '${params.email}' is already registered to an employee.`;
      if (params.umidNumber && auth.umidNumber === params.umidNumber) errors.umidNumber = `UMID '${params.umidNumber}' is already registered to an employee.`;
      if (params.philsysId && auth.philsysId === params.philsysId) errors.philsysId = `PhilSys ID '${params.philsysId}' is already registered to an employee.`;
      if (params.philhealthNumber && auth.philhealthNumber === params.philhealthNumber) errors.philhealthNumber = `PhilHealth Number '${params.philhealthNumber}' is already registered to an employee.`;
      if (params.pagibigNumber && auth.pagibigNumber === params.pagibigNumber) errors.pagibigNumber = `Pag-IBIG Number '${params.pagibigNumber}' is already registered to an employee.`;
      if (params.tinNumber && auth.tinNumber === params.tinNumber) errors.tinNumber = `TIN '${params.tinNumber}' is already registered to an employee.`;
      if (params.gsisNumber && auth.gsisNumber === params.gsisNumber) errors.gsisNumber = `GSIS Number '${params.gsisNumber}' is already registered to an employee.`;
      if (params.eligibilityNumber && auth.eligibilityNumber === params.eligibilityNumber) errors.eligibilityNumber = `License/Eligibility Number '${params.eligibilityNumber}' is already registered to an employee.`;
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
  if (params.eligibilityNumber) appConditions.push(eq(recruitmentApplicants.licenseNo, params.eligibilityNumber));

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
      if (params.eligibilityNumber && app.licenseNo === params.eligibilityNumber) errors.eligibilityNumber = `License/Eligibility Number '${params.eligibilityNumber}' is already used by an applicant.`;
    }
  }

  return errors;
}

