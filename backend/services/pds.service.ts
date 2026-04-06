import { db } from '../db/index.js';
import { authentication, pdsPersonalInformation, pdsFamily, pdsEducation, pdsEligibility, pdsWorkExperience, pdsVoluntaryWork, pdsLearningDevelopment, pdsOtherInfo, pdsReferences, pdsDeclarations } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import type { PDSFormData, PDSFamily, PDSEducation, PDSEligibility, PDSWorkExperience, PDSVoluntaryWork, PDSLearningDevelopment, PDSOtherInfo, PDSReference, PDSQuestions } from '../types/pds.types.js';

type PDSTransaction = any; // Simplified for this context, usually imported from db
type PDSSectionRow = Record<string, any>;

export class PDSService {
    /**
     * 100% RELIABLE INT CONVERSION: Ensures that non-numeric strings (e.g., "Present", "Ongoing")
     * do not cause fatal MySQL INT column crashes.
     */
    static safeInt(val: any, defaultVal: number | null = 0): number | null {
        if (val === null || val === undefined || String(val).trim() === '' || String(val).toLowerCase() === 'null') return defaultVal;
        const cleaned = String(val).replace(/[^0-9-]/g, '');
        if (!cleaned) return defaultVal;
        const parsed = parseInt(cleaned, 10);
        return isNaN(parsed) ? defaultVal : parsed;
    }

    static safeStr(val: any, maxLen?: number): string | null {
        if (val === null || val === undefined || String(val).trim() === '' || String(val).toLowerCase() === 'null') return null;
        let s = String(val).trim();
        if (maxLen) s = s.substring(0, maxLen);
        return s;
    }

    static safeDate(val: any): string | null {
        if (val === null || val === undefined || String(val).trim() === '' || String(val).toLowerCase() === 'null') return null;
        const d = new Date(val);
        if (isNaN(d.getTime())) return null;
        return d.toISOString().split('T')[0];
    }

    static safeFloat(val: any): string | null {
        if (val === null || val === undefined || String(val).trim() === '' || String(val).toLowerCase() === 'null') return null;
        const cleaned = String(val).replace(/,/g, '').replace(/[^0-9.-]/g, '');
        const f = parseFloat(cleaned);
        return isNaN(f) ? null : f.toString();
    }

    static isGarbageRow(row: PDSSectionRow, keyFields: string[]): boolean {
        if (!row || typeof row !== 'object') return true;
        return keyFields.every(field => {
            const val = row[field];
            return val === null || val === undefined || String(val).trim() === '' || String(val).toLowerCase() === 'null' || String(val).includes('---');
        });
    }

    static async saveFullPdsData(employeeId: number, data: Partial<PDSFormData>, avatar?: string | null, externalTx?: PDSTransaction) {
      // Use the provided transaction or the global db instance
      const tx = externalTx || (db as any);

      // Update basic authentication info if top-level fields are provided
      if (data.surname || data.lastName || data.firstName || data.middleName || avatar) {
        await tx.update(authentication)
          .set({
            lastName: this.safeStr(data.lastName || data.surname, 100) ?? undefined,
            firstName: this.safeStr(data.firstName, 100) ?? undefined,
            middleName: this.safeStr(data.middleName, 100) ?? undefined,
            suffix: this.safeStr(data.nameExtension || data.suffix, 100) ?? undefined,
            email: this.safeStr(data.email, 255) ?? undefined,
            avatarUrl: avatar || undefined
          })
          .where(eq(authentication.id, employeeId));
      }

      // 1. Personal Information (upsert)
      const personalInfo = {
        employeeId,
        birthDate: this.safeDate(data.birthDate || data.dob),
        placeOfBirth: this.safeStr(data.placeOfBirth || data.pob, 255),
        gender: this.safeStr(data.gender || data.sex, 50),
        civilStatus: this.safeStr(data.civilStatus, 50),
        heightM: this.safeStr(data.heightM || data.height, 50),
        weightKg: this.safeStr(data.weightKg || data.weight, 50),
        bloodType: this.safeStr(data.bloodType, 50),
        citizenship: this.safeStr(data.citizenship, 50),
        citizenshipType: this.safeStr(data.citizenshipType, 50),
        dualCountry: this.safeStr(data.dualCountry, 100),
        residentialAddress: this.safeStr(data.residentialAddress, 500),
        residentialZipCode: this.safeStr(data.residentialZipCode, 50),
        permanentAddress: this.safeStr(data.permanentAddress, 500),
        permanentZipCode: this.safeStr(data.permanentZipCode, 50),
        telephoneNo: this.safeStr(data.telephoneNo, 50),
        mobileNo: this.safeStr(data.mobileNo, 50),
        email: this.safeStr(data.email, 255),
        gsisNumber: this.safeStr(data.gsisNumber || data.gsisNo, 50),
        pagibigNumber: this.safeStr(data.pagibigNumber || data.pagibigNo, 50),
        philhealthNumber: this.safeStr(data.philhealthNumber || data.philhealthNo, 50),
        umidNumber: this.safeStr(data.umidNumber || data.umidNo, 50),
        philsysId: this.safeStr(data.philsysId, 50),
        tinNumber: this.safeStr(data.tinNumber || data.tinNo, 50),
        agencyEmployeeNo: this.safeStr(data.agencyEmployeeNo, 50),
        resHouseBlockLot: this.safeStr(data.resHouseBlockLot, 150),
        resStreet: this.safeStr(data.resStreet, 150),
        resSubdivision: this.safeStr(data.resSubdivision, 150),
        resBarangay: this.safeStr(data.resBarangay, 150),
        resCity: this.safeStr(data.resCity, 150),
        resProvince: this.safeStr(data.resProvince, 150),
        resRegion: this.safeStr(data.resRegion, 150),
        permHouseBlockLot: this.safeStr(data.permHouseBlockLot, 150),
        permStreet: this.safeStr(data.permStreet, 150),
        permSubdivision: this.safeStr(data.permSubdivision, 150),
        permBarangay: this.safeStr(data.permBarangay, 150),
        permCity: this.safeStr(data.permCity, 150),
        permProvince: this.safeStr(data.permProvince, 150),
        permRegion: this.safeStr(data.permRegion, 150),
      };

      await tx.delete(pdsPersonalInformation).where(eq(pdsPersonalInformation.employeeId, employeeId));
      await tx.insert(pdsPersonalInformation).values(personalInfo);

      // 2. Family Background
      if (data.familyBackground) {
        const allowedRelations = ['Spouse', 'Father', 'Mother', 'Child'];
        const filteredFamily = data.familyBackground
            .filter(f => !this.isGarbageRow(f as unknown as PDSSectionRow, ['lastName', 'firstName']))
            .filter(f => allowedRelations.includes(f.relationType || 'Child')) 
            .map(f => ({
                employeeId,
                relationType: (f.relationType || 'Child') as 'Spouse' | 'Father' | 'Mother' | 'Child',
                lastName: this.safeStr(f.lastName || f.surname, 100),
                firstName: this.safeStr(f.firstName, 100),
                middleName: this.safeStr(f.middleName, 100),
                nameExtension: this.safeStr(f.nameExtension || f.extension, 10),
                occupation: this.safeStr(f.occupation, 100),
                employer: this.safeStr(f.employer, 100),
                businessAddress: this.safeStr(f.businessAddress, 255),
                telephoneNo: this.safeStr(f.telephoneNo || f.mobileNo, 50),
                dateOfBirth: this.safeDate(f.dateOfBirth || f.dob)
            }));
        await tx.delete(pdsFamily).where(eq(pdsFamily.employeeId, employeeId));
        if (filteredFamily.length > 0) await tx.insert(pdsFamily).values(filteredFamily);
      }

      // 3. Educational Background
      if (data.educations) {
        const filteredEdu = data.educations
            .filter(e => !this.isGarbageRow(e as unknown as PDSSectionRow, ['schoolName', 'degreeCourse']))
            .map(e => ({
                employeeId,
                level: (e.level || 'College') as "Elementary" | "Secondary" | "Vocational" | "College" | "Graduate Studies",
                schoolName: this.safeStr(e.schoolName, 255) ?? 'Unknown School',
                degreeCourse: this.safeStr(e.degreeCourse || e.course || e.degree, 255),
                dateFrom: this.safeInt(e.dateFrom || e.startDate),
                dateTo: this.safeInt(e.dateTo || e.endDate),
                yearGraduated: this.safeInt(e.yearGraduated),
                unitsEarned: this.safeStr(e.unitsEarned || e.highestLevel, 50),
                honors: this.safeStr(e.honors || e.scholarships, 255)
            }));
        await tx.delete(pdsEducation).where(eq(pdsEducation.employeeId, employeeId));
        if (filteredEdu.length > 0) await tx.insert(pdsEducation).values(filteredEdu);
      }

      // 4. Civil Service Eligibility
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
                validityDate: this.safeDate(e.validityDate)
            }));
        await tx.delete(pdsEligibility).where(eq(pdsEligibility.employeeId, employeeId));
        if (filteredElig.length > 0) await tx.insert(pdsEligibility).values(filteredElig);
      }

      // 5. Work Experience
      if (data.workExperiences) {
        const filteredWork = data.workExperiences
            .filter(w => !this.isGarbageRow(w as unknown as PDSSectionRow, ['companyName', 'positionTitle']))
            .map(w => ({
                employeeId,
                dateFrom: this.safeDate(w.dateFrom || w.fromDate) ?? new Date().toISOString().split('T')[0],
                dateTo: this.safeDate(w.dateTo || w.toDate),
                positionTitle: this.safeStr(w.positionTitle, 255) ?? 'Unknown Position',
                companyName: this.safeStr(w.companyName, 255) ?? 'Unknown Company',
                monthlySalary: this.safeFloat(w.monthlySalary),
                salaryGrade: this.safeStr(w.salaryGrade, 20),
                appointmentStatus: this.safeStr(w.appointmentStatus, 50),
                isGovernment: w.isGovernment === true || String(w.isGovernment).toLowerCase() === 'yes'
            }));
        await tx.delete(pdsWorkExperience).where(eq(pdsWorkExperience.employeeId, employeeId));
        if (filteredWork.length > 0) await tx.insert(pdsWorkExperience).values(filteredWork);
      }

      // 6. Voluntary Work
      if (data.voluntaryWorks) {
        const filteredVol = data.voluntaryWorks
          .filter((v: PDSVoluntaryWork) => !this.isGarbageRow(v as unknown as PDSSectionRow, ['organizationName']))
          .map((v: PDSVoluntaryWork) => ({
            employeeId,
            organizationName: this.safeStr(v.organizationName, 255) ?? 'Unknown Organization',
            address: this.safeStr(v.address, 255),
            dateFrom: this.safeDate(v.dateFrom || v.fromDate),
            dateTo: this.safeDate(v.dateTo || v.toDate),
            hoursNumber: this.safeInt(v.hoursNumber),
            position: this.safeStr(v.position || v.natureOfWork, 100)
          }));
        await tx.delete(pdsVoluntaryWork).where(eq(pdsVoluntaryWork.employeeId, employeeId));
        if (filteredVol.length > 0) await tx.insert(pdsVoluntaryWork).values(filteredVol);
      }

      // 7. Learning & Development
      if (data.trainings) {
        const filteredLd = data.trainings
          .filter((t: PDSLearningDevelopment) => !this.isGarbageRow(t as unknown as PDSSectionRow, ['title', 'trainingTitle']))
          .map((t: PDSLearningDevelopment) => ({
            employeeId,
            title: this.safeStr(t.title || t.trainingTitle, 255) ?? 'Unknown Training',
            dateFrom: this.safeDate(t.dateFrom || t.fromDate),
            dateTo: this.safeDate(t.dateTo || t.toDate),
            hoursNumber: this.safeInt(t.hoursNumber || t.hoursCount),
            typeOfLd: this.safeStr(t.typeOfLd || t.trainingType, 100),
            conductedBy: this.safeStr(t.conductedBy, 255)
          }));
        await tx.delete(pdsLearningDevelopment).where(eq(pdsLearningDevelopment.employeeId, employeeId));
        if (filteredLd.length > 0) await tx.insert(pdsLearningDevelopment).values(filteredLd);
      }

      // 8. Other Info
      if (data.otherInfo) {
        await tx.delete(pdsOtherInfo).where(eq(pdsOtherInfo.employeeId, employeeId));
        const filteredOther = data.otherInfo
            .filter(o => !this.isGarbageRow(o as unknown as PDSSectionRow, ['description']))
            .map(o => ({
                employeeId,
                type: (this.safeStr(o.type, 100) || 'Skill') as 'Skill' | 'Recognition' | 'Membership',
                description: this.safeStr(o.description, 500) ?? '',
            }));
        if (filteredOther.length > 0) await tx.insert(pdsOtherInfo).values(filteredOther);
      }

      // 9. References
      if (data.references) {
        await tx.delete(pdsReferences).where(eq(pdsReferences.employeeId, employeeId));
        const filteredRefs = data.references
          .filter((r: PDSReference) => !this.isGarbageRow(r as unknown as PDSSectionRow, ['name']))
          .map((r: PDSReference) => ({
            employeeId,
            name: this.safeStr(r.name, 255) ?? 'Unknown Reference',
            address: this.safeStr(r.address, 255),
            telNo: this.safeStr(r.telNo || r.telephoneNo, 50),
          }));
        if (filteredRefs.length > 0) await tx.insert(pdsReferences).values(filteredRefs);
      }

      // 10. Declarations
      if (data.pdsQuestions || data.govtIdType || data.govtIdNo) {
        const q = (data.pdsQuestions || {}) as PDSQuestions;
        const declarations = {
          employeeId,
          relatedThirdDegree: q.relatedThirdDegree ? 'Yes' : 'No',
          relatedThirdDetails: this.safeStr(q.relatedThirdDetails, 500),
          relatedFourthDegree: q.relatedFourthDegree ? 'Yes' : 'No',
          relatedFourthDetails: this.safeStr(q.relatedFourthDetails, 500),
          foundGuiltyAdmin: q.foundGuiltyAdmin ? 'Yes' : 'No',
          foundGuiltyDetails: this.safeStr(q.foundGuiltyDetails, 500),
          criminallyCharged: q.criminallyCharged ? 'Yes' : 'No',
          dateFiled: this.safeDate(q.dateFiled),
          statusOfCase: this.safeStr(q.statusOfCase, 255),
          convictedCrime: q.convictedCrime ? 'Yes' : 'No',
          convictedDetails: this.safeStr(q.convictedDetails, 500),
          separatedFromService: q.separatedFromService ? 'Yes' : 'No',
          separatedDetails: this.safeStr(q.separatedDetails, 500),
          electionCandidate: q.electionCandidate ? 'Yes' : 'No',
          electionDetails: this.safeStr(q.electionDetails, 500),
          resignedToPromote: q.resignedToPromote ? 'Yes' : 'No',
          resignedDetails: this.safeStr(q.resignedDetails, 500),
          immigrantStatus: q.immigrantStatus ? 'Yes' : 'No',
          immigrantDetails: this.safeStr(q.immigrantDetails, 500),
          indigenousMember: q.indigenousMember ? 'Yes' : 'No',
          indigenousDetails: this.safeStr(q.indigenousDetails, 500),
          personWithDisability: q.personWithDisability ? 'Yes' : 'No',
          disabilityIdNo: this.safeStr(q.disabilityIdNo, 100),
          soloParent: q.soloParent ? 'Yes' : 'No',
          soloParentIdNo: this.safeStr(q.soloParentIdNo, 100),
          govtIdType: this.safeStr(data.govtIdType, 100),
          govtIdNo: this.safeStr(data.govtIdNo, 100),
          govtIdIssuance: this.safeStr(data.govtIdIssuance, 100),
          dateAccomplished: this.safeDate(data.dateAccomplished),
        };
        await tx.delete(pdsDeclarations).where(eq(pdsDeclarations.employeeId, employeeId));
        await tx.insert(pdsDeclarations).values(declarations);
      }
    }
}
