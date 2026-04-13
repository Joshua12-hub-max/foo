import { db } from '../db/index.js';
import {
  authentication,
  pdsFamily,
  pdsEducation,
  pdsEligibility,
  pdsWorkExperience,
  pdsVoluntaryWork,
  pdsLearningDevelopment,
  pdsOtherInfo,
  pdsReferences,
  employeeEmergencyContacts,
} from '../db/schema.js';
import { pdsPersonalInformation, pdsDeclarations } from '../db/tables/pds.js';
import { eq } from 'drizzle-orm';
import type {
  PdsEducation,
  PdsEligibility,
  PdsWorkExperience,
  PdsLearningDevelopment,
  PdsFamily,
  PdsOtherInfo,
  PdsReference,
  PdsVoluntaryWork,
  PdsDeclarations,
  PdsPersonalInfo,
} from '../types/pds.js';
import {
  normalizePdsInt,
  normalizePdsFloat,
  normalizePdsString,
  normalizePdsDate,
  extractPdsYear,
  isPdsGarbageRow,
} from '../utils/pdsDataUtils.js';

// Canonical data shape accepted by saveFullPdsData — no synonyms
export interface PdsSaveData {
  // Optional name/auth fields — updated if provided
  firstName?: string | null;
  lastName?: string | null;
  middleName?: string | null;
  suffix?: string | null;
  email?: string | null;

  // Nested personal info (from parser output)
  personal?: PdsPersonalInfo;

  // PDS Arrays — canonical field names only
  educations?: PdsEducation[];
  eligibilities?: PdsEligibility[];
  workExperiences?: PdsWorkExperience[];
  learningDevelopments?: PdsLearningDevelopment[];
  voluntaryWorks?: PdsVoluntaryWork[];
  references?: PdsReference[];
  familyBackground?: PdsFamily[];
  otherInfo?: PdsOtherInfo[];
  declarations?: Partial<PdsDeclarations>;
}

type PDSSectionRow = Record<string, unknown>;

export class PDSService {
  /**
   * DEPRECATED: Use normalizePdsInt from pdsDataUtils.ts
   * @deprecated
   */
  static safeInt(val: unknown, defaultVal: number | null = 0): number | null {
    return normalizePdsInt(val, defaultVal);
  }

  /**
   * DEPRECATED: Use normalizePdsString from pdsDataUtils.ts
   * @deprecated
   */
  static safeStr(val: unknown, maxLen?: number): string | null {
    return normalizePdsString(val, maxLen);
  }

  /**
   * DEPRECATED: Use normalizePdsDate from pdsDataUtils.ts
   * @deprecated
   */
  static safeDate(val: unknown): string | null {
    return normalizePdsDate(val);
  }

  /**
   * DEPRECATED: Use normalizePdsFloat from pdsDataUtils.ts
   * @deprecated
   */
  static safeFloat(val: unknown): string | null {
    return normalizePdsFloat(val);
  }

  /**
   * DEPRECATED: Use isPdsGarbageRow from pdsDataUtils.ts
   * @deprecated
   */
  static isGarbageRow(row: PDSSectionRow, keyFields: string[]): boolean {
    return isPdsGarbageRow(row, keyFields);
  }

  static async saveFullPdsData(
    employeeId: number,
    data: PdsSaveData,
    avatar?: string | null,
    externalTx?: unknown
  ): Promise<void> {
    const tx = (externalTx || db) as typeof db;

    // Update authentication table if name/email/avatar fields are provided
    const authSet: Record<string, unknown> = {};
    if (data.lastName != null) authSet['lastName'] = this.safeStr(data.lastName, 100);
    if (data.firstName != null) authSet['firstName'] = this.safeStr(data.firstName, 100);
    if (data.middleName != null) authSet['middleName'] = this.safeStr(data.middleName, 100);
    if (data.suffix != null) authSet['suffix'] = this.safeStr(data.suffix, 100);
    if (data.email != null) authSet['email'] = this.safeStr(data.email, 255);
    if (avatar) authSet['avatarUrl'] = avatar;
    if (Object.keys(authSet).length > 0) {
      await (tx as typeof db).update(authentication).set(authSet as Partial<typeof authentication.$inferInsert>).where(eq(authentication.id, employeeId));
    }

    // Personal Information — upsert if personal block provided
    if (data.personal) {
      const p = data.personal;
      const personalRow = {
        employeeId,
        birthDate: this.safeDate(p.birthDate),
        placeOfBirth: this.safeStr(p.placeOfBirth, 255),
        gender: this.safeStr(p.gender, 50),
        civilStatus: this.safeStr(p.civilStatus, 50),
        heightM: this.safeFloat(p.heightM),
        weightKg: this.safeFloat(p.weightKg),
        bloodType: this.safeStr(p.bloodType, 10),
        citizenship: this.safeStr(p.citizenship, 50) ?? 'Filipino',
        citizenshipType: this.safeStr(p.citizenshipType, 50),
        dualCountry: this.safeStr(p.dualCountry, 100),
        telephoneNo: this.safeStr(p.telephoneNo, 50),
        mobileNo: this.safeStr(p.mobileNo, 50),
        gsisNumber: this.safeStr(p.gsisNumber, 50),
        pagibigNumber: this.safeStr(p.pagibigNumber, 50),
        philhealthNumber: this.safeStr(p.philhealthNumber, 50),
        tinNumber: this.safeStr(p.tinNumber, 50),
        umidNumber: this.safeStr(p.umidNumber, 50),
        philsysId: this.safeStr(p.philsysId, 50),
        agencyEmployeeNo: this.safeStr(p.agencyEmployeeNo, 50),
        resHouseBlockLot: this.safeStr(p.resHouseBlockLot, 150),
        resStreet: this.safeStr(p.resStreet, 150),
        resSubdivision: this.safeStr(p.resSubdivision, 150),
        resBarangay: this.safeStr(p.resBarangay, 150),
        resCity: this.safeStr(p.resCity, 150),
        resProvince: this.safeStr(p.resProvince, 150),
        resRegion: this.safeStr(p.resRegion, 150),
        residentialZipCode: this.safeStr(p.residentialZipCode, 10),
        permHouseBlockLot: this.safeStr(p.permHouseBlockLot, 150),
        permStreet: this.safeStr(p.permStreet, 150),
        permSubdivision: this.safeStr(p.permSubdivision, 150),
        permBarangay: this.safeStr(p.permBarangay, 150),
        permCity: this.safeStr(p.permCity, 150),
        permProvince: this.safeStr(p.permProvince, 150),
        permRegion: this.safeStr(p.permRegion, 150),
        permanentZipCode: this.safeStr(p.permanentZipCode, 10),
      };
      await (tx as typeof db).delete(pdsPersonalInformation).where(eq(pdsPersonalInformation.employeeId, employeeId));
      await (tx as typeof db).insert(pdsPersonalInformation).values(personalRow);

      // Emergency Contact (upsert)
      if (p.emergencyContact && p.emergencyContactNumber) {
        const emergencyData = {
          employeeId,
          name: this.safeStr(p.emergencyContact, 255)!,
          phoneNumber: this.safeStr(p.emergencyContactNumber, 50)!,
          relationship: 'Contact Person',
          isPrimary: true
        };
        await (tx as typeof db).delete(employeeEmergencyContacts).where(eq(employeeEmergencyContacts.employeeId, employeeId));
        await (tx as typeof db).insert(employeeEmergencyContacts).values(emergencyData);
      }
    }

    // Family Background (delete + insert)
    if (data.familyBackground) {
      const allowedRelations = ['Spouse', 'Father', 'Mother', 'Child'] as const;
      const filteredFamily = data.familyBackground
        .filter(f => !this.isGarbageRow(f as unknown as PDSSectionRow, ['lastName', 'firstName']))
        .filter(f => allowedRelations.includes(f.relationType as typeof allowedRelations[number]))
        .map(f => ({
          employeeId,
          relationType: f.relationType as 'Spouse' | 'Father' | 'Mother' | 'Child',
          lastName: this.safeStr(f.lastName, 100),
          firstName: this.safeStr(f.firstName, 100),
          middleName: this.safeStr(f.middleName, 100),
          nameExtension: this.safeStr(f.nameExtension, 10),
          occupation: this.safeStr(f.occupation, 100),
          employer: this.safeStr(f.employer, 100),
          businessAddress: this.safeStr(f.businessAddress, 255),
          telephoneNo: this.safeStr(f.telephoneNo, 50),
          dateOfBirth: this.safeDate(f.dateOfBirth),
        }));
      await (tx as typeof db).delete(pdsFamily).where(eq(pdsFamily.employeeId, employeeId));
      if (filteredFamily.length > 0) await (tx as typeof db).insert(pdsFamily).values(filteredFamily);
    }

    // Educational Background (delete + insert)
    if (data.educations) {
      const filteredEdu = data.educations
        .filter(e => !isPdsGarbageRow(e as unknown as PDSSectionRow, ['schoolName']))
        .map(e => ({
          employeeId,
          level: (e.level || 'College') as 'Elementary' | 'Secondary' | 'Vocational' | 'College' | 'Graduate Studies',
          schoolName: normalizePdsString(e.schoolName, 255) ?? 'Unknown School',
          degreeCourse: normalizePdsString(e.degreeCourse, 255),
          dateFrom: extractPdsYear(e.dateFrom),  // Extract year from date (YYYY-MM-DD → YYYY)
          dateTo: extractPdsYear(e.dateTo),      // Extract year from date (YYYY-MM-DD → YYYY)
          yearGraduated: normalizePdsInt(e.yearGraduated),
          unitsEarned: normalizePdsString(e.unitsEarned, 50),
          honors: normalizePdsString(e.honors, 255),
        }));
      await (tx as typeof db).delete(pdsEducation).where(eq(pdsEducation.employeeId, employeeId));
      if (filteredEdu.length > 0) await (tx as typeof db).insert(pdsEducation).values(filteredEdu);
    }

    // Civil Service Eligibility (delete + insert)
    if (data.eligibilities) {
      const filteredElig = data.eligibilities
        .filter(e => !this.isGarbageRow(e as unknown as PDSSectionRow, ['eligibilityName']))
        .map(e => ({
          employeeId,
          eligibilityName: this.safeStr(e.eligibilityName, 255) ?? 'Unknown Eligibility',
          rating: this.safeFloat(e.rating),
          examDate: this.safeDate(e.examDate),
          examPlace: this.safeStr(e.examPlace, 255),
          licenseNumber: this.safeStr(e.licenseNumber, 50),
          validityDate: this.safeDate(e.validityDate),
        }));
      await (tx as typeof db).delete(pdsEligibility).where(eq(pdsEligibility.employeeId, employeeId));
      if (filteredElig.length > 0) await (tx as typeof db).insert(pdsEligibility).values(filteredElig);
    }

    // Work Experience (delete + insert)
    if (data.workExperiences) {
      const filteredWork = data.workExperiences
        .filter(w => !this.isGarbageRow(w as unknown as PDSSectionRow, ['companyName', 'positionTitle']))
        .map(w => ({
          employeeId,
          dateFrom: this.safeDate(w.dateFrom) ?? new Date().toISOString().split('T')[0],
          dateTo: w.dateTo?.toLowerCase() === 'present' ? 'Present' : this.safeDate(w.dateTo),
          positionTitle: this.safeStr(w.positionTitle, 255) ?? 'Unknown Position',
          companyName: this.safeStr(w.companyName, 255) ?? 'Unknown Company',
          monthlySalary: this.safeFloat(w.monthlySalary),
          salaryGrade: this.safeStr(w.salaryGrade, 20),
          appointmentStatus: this.safeStr(w.appointmentStatus, 50),
          isGovernment: w.isGovernment === true || String(w.isGovernment).toLowerCase() === 'yes',
        }));
      await (tx as typeof db).delete(pdsWorkExperience).where(eq(pdsWorkExperience.employeeId, employeeId));
      if (filteredWork.length > 0) await (tx as typeof db).insert(pdsWorkExperience).values(filteredWork);
    }

    // Voluntary Work (delete + insert)
    if (data.voluntaryWorks) {
      const filteredVol = data.voluntaryWorks
        .filter(v => !this.isGarbageRow(v as unknown as PDSSectionRow, ['organizationName']))
        .map(v => ({
          employeeId,
          organizationName: this.safeStr(v.organizationName, 255) ?? 'Unknown Organization',
          address: this.safeStr(v.address, 255),
          dateFrom: this.safeDate(v.dateFrom),
          dateTo: this.safeDate(v.dateTo),
          hoursNumber: this.safeInt(v.hoursNumber),
          position: this.safeStr(v.position, 100),
        }));
      await (tx as typeof db).delete(pdsVoluntaryWork).where(eq(pdsVoluntaryWork.employeeId, employeeId));
      if (filteredVol.length > 0) await (tx as typeof db).insert(pdsVoluntaryWork).values(filteredVol);
    }

    // Learning & Development (delete + insert)
    if (data.learningDevelopments) {
      const filteredLd = data.learningDevelopments
        .filter(t => !this.isGarbageRow(t as unknown as PDSSectionRow, ['title']))
        .map(t => ({
          employeeId,
          title: this.safeStr(t.title, 500) ?? 'Unknown Training',
          dateFrom: this.safeDate(t.dateFrom),
          dateTo: this.safeDate(t.dateTo),
          hoursNumber: this.safeInt(t.hoursNumber),
          typeOfLd: this.safeStr(t.typeOfLd, 50),
          conductedBy: this.safeStr(t.conductedBy, 255),
        }));
      await (tx as typeof db).delete(pdsLearningDevelopment).where(eq(pdsLearningDevelopment.employeeId, employeeId));
      if (filteredLd.length > 0) await (tx as typeof db).insert(pdsLearningDevelopment).values(filteredLd);
    }

    // Other Info (delete + insert)
    if (data.otherInfo) {
      const filteredOther = data.otherInfo
        .filter(o => !this.isGarbageRow(o as unknown as PDSSectionRow, ['description']))
        .map(o => ({
          employeeId,
          type: (this.safeStr(o.type, 100) || 'Skill') as 'Skill' | 'Recognition' | 'Membership',
          description: this.safeStr(o.description, 500) ?? '',
        }));
      await (tx as typeof db).delete(pdsOtherInfo).where(eq(pdsOtherInfo.employeeId, employeeId));
      if (filteredOther.length > 0) await (tx as typeof db).insert(pdsOtherInfo).values(filteredOther);
    }

    // References (delete + insert)
    if (data.references) {
      const filteredRefs = data.references
        .filter(r => !this.isGarbageRow(r as unknown as PDSSectionRow, ['name']))
        .map(r => ({
          employeeId,
          name: this.safeStr(r.name, 255) ?? 'Unknown Reference',
          address: this.safeStr(r.address, 255),
          telNo: this.safeStr(r.telNo, 50),
        }));
      await (tx as typeof db).delete(pdsReferences).where(eq(pdsReferences.employeeId, employeeId));
      if (filteredRefs.length > 0) await (tx as typeof db).insert(pdsReferences).values(filteredRefs);
    }

    // Declarations (delete + insert — boolean columns, not strings)
    if (data.declarations) {
      const q = data.declarations;
      const declarations = {
        employeeId,
        relatedThirdDegree: !!q.relatedThirdDegree,
        relatedThirdDetails: this.safeStr(q.relatedThirdDetails, 500),
        relatedFourthDegree: !!q.relatedFourthDegree,
        relatedFourthDetails: this.safeStr(q.relatedFourthDetails, 500),
        foundGuiltyAdmin: !!q.foundGuiltyAdmin,
        foundGuiltyDetails: this.safeStr(q.foundGuiltyDetails, 500),
        criminallyCharged: !!q.criminallyCharged,
        dateFiled: this.safeDate(q.dateFiled),
        statusOfCase: this.safeStr(q.statusOfCase, 255),
        convictedCrime: !!q.convictedCrime,
        convictedDetails: this.safeStr(q.convictedDetails, 500),
        separatedFromService: !!q.separatedFromService,
        separatedDetails: this.safeStr(q.separatedDetails, 500),
        electionCandidate: !!q.electionCandidate,
        electionDetails: this.safeStr(q.electionDetails, 500),
        resignedToPromote: !!q.resignedToPromote,
        resignedDetails: this.safeStr(q.resignedDetails, 500),
        immigrantStatus: !!q.immigrantStatus,
        immigrantDetails: this.safeStr(q.immigrantDetails, 500),
        indigenousMember: !!q.indigenousMember,
        indigenousDetails: this.safeStr(q.indigenousDetails, 500),
        personWithDisability: !!q.personWithDisability,
        disabilityIdNo: this.safeStr(q.disabilityIdNo, 100),
        soloParent: !!q.soloParent,
        soloParentIdNo: this.safeStr(q.soloParentIdNo, 100),
        govtIdType: this.safeStr(q.govtIdType, 100),
        govtIdNo: this.safeStr(q.govtIdNo, 100),
        govtIdIssuance: this.safeStr(q.govtIdIssuance, 255),
        dateAccomplished: this.safeDate(q.dateAccomplished),
      };
      await (tx as typeof db).delete(pdsDeclarations).where(eq(pdsDeclarations.employeeId, employeeId));
      await (tx as typeof db).insert(pdsDeclarations).values(declarations);
    }
  }
}
