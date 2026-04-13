/**
 * Raw Excel Data Interfaces for PDS Parser
 *
 * These interfaces represent data BEFORE transformation - all fields are nullable strings
 * as they come directly from Excel cells. This ensures type safety at the extraction boundary.
 *
 * Extract → Transform → Validate Pipeline:
 * 1. Extract: Excel cells → RawPdsExcelData (this file)
 * 2. Transform: RawPdsExcelData → PdsParserOutput (with proper types, ISO dates)
 * 3. Validate: PdsParserOutput → ValidatedPdsParserOutput (Zod validation)
 */

export interface RawPersonalInfoExcel {
  readonly surname: string | null;
  readonly firstName: string | null;
  readonly middleName: string | null;
  readonly birthDate: string | null;
  readonly placeOfBirth: string | null;
  readonly gender: string | null;
  readonly civilStatus: string | null;
  readonly heightM: string | null;
  readonly weightKg: string | null;
  readonly bloodType: string | null;
  readonly citizenship: string | null;
  readonly citizenshipType: string | null;
  readonly dualCountry: string | null;
  readonly gsisNumber: string | null;
  readonly pagibigNumber: string | null;
  readonly philhealthNumber: string | null;
  readonly sssNumber: string | null;
  readonly tinNumber: string | null;
  readonly agencyEmployeeNo: string | null;
  readonly umidNumber: string | null;
  readonly philsysId: string | null;
  readonly resHouseBlockLot: string | null;
  readonly resStreet: string | null;
  readonly resSubdivision: string | null;
  readonly resBarangay: string | null;
  readonly resCity: string | null;
  readonly resProvince: string | null;
  readonly resRegion: string | null;
  readonly residentialZipCode: string | null;
  readonly permHouseBlockLot: string | null;
  readonly permStreet: string | null;
  readonly permSubdivision: string | null;
  readonly permBarangay: string | null;
  readonly permCity: string | null;
  readonly permProvince: string | null;
  readonly permRegion: string | null;
  readonly permanentZipCode: string | null;
  readonly telephoneNo: string | null;
  readonly mobileNo: string | null;
  readonly email: string | null;
  readonly emergencyContact: string | null;
  readonly emergencyContactNumber: string | null;
}

export interface RawFamilySpouseExcel {
  readonly surname: string | null;
  readonly firstName: string | null;
  readonly middleName: string | null;
  readonly occupation: string | null;
  readonly employer: string | null;
  readonly businessAddress: string | null;
  readonly telephoneNo: string | null;
}

export interface RawFamilyParentExcel {
  readonly surname: string | null;
  readonly firstName: string | null;
  readonly middleName: string | null;
  readonly nameExtension: string | null;
}

export interface RawFamilyChildExcel {
  readonly name: string | null;
  readonly dateOfBirth: string | null;
}

export interface RawFamilyBackgroundExcel {
  readonly spouse: RawFamilySpouseExcel;
  readonly father: RawFamilyParentExcel;
  readonly mother: RawFamilyParentExcel;
  readonly children: readonly RawFamilyChildExcel[];
}

export interface RawEducationExcel {
  readonly level: string | null;
  readonly schoolName: string | null;
  readonly degreeCourse: string | null;
  readonly dateFrom: string | null;
  readonly dateTo: string | null;
  readonly unitsEarned: string | null;
  readonly yearGraduated: string | null;
  readonly honors: string | null;
}

export interface RawEligibilityExcel {
  readonly eligibilityName: string | null;
  readonly rating: string | null;
  readonly examDate: string | null;
  readonly examPlace: string | null;
  readonly licenseNumber: string | null;
  readonly validityDate: string | null;
}

export interface RawWorkExperienceExcel {
  readonly dateFrom: string | null;
  readonly dateTo: string | null;
  readonly positionTitle: string | null;
  readonly companyName: string | null;
  readonly monthlySalary: string | null;
  readonly salaryGrade: string | null;
  readonly appointmentStatus: string | null;
  readonly isGovernment: string | null;
}

export interface RawVoluntaryWorkExcel {
  readonly organizationName: string | null;
  readonly address: string | null;
  readonly dateFrom: string | null;
  readonly dateTo: string | null;
  readonly hoursNumber: string | null;
  readonly position: string | null;
}

export interface RawLearningDevelopmentExcel {
  readonly title: string | null;
  readonly dateFrom: string | null;
  readonly dateTo: string | null;
  readonly hoursNumber: string | null;
  readonly typeOfLd: string | null;
  readonly conductedBy: string | null;
}

export interface RawOtherInfoExcel {
  readonly type: 'Skill' | 'Recognition' | 'Membership';
  readonly description: string | null;
}

export interface RawReferenceExcel {
  readonly name: string | null;
  readonly address: string | null;
  readonly telNo: string | null;
}

/**
 * Complete raw Excel data structure for PDS
 * All fields are strings as extracted from Excel cells
 */
export interface RawPdsExcelData {
  readonly personalInfo: RawPersonalInfoExcel;
  readonly familyBackground: RawFamilyBackgroundExcel;
  readonly educations: readonly RawEducationExcel[];
  readonly eligibilities: readonly RawEligibilityExcel[];
  readonly workExperiences: readonly RawWorkExperienceExcel[];
  readonly voluntaryWorks: readonly RawVoluntaryWorkExcel[];
  readonly learningDevelopments: readonly RawLearningDevelopmentExcel[];
  readonly otherInfo: readonly RawOtherInfoExcel[];
  readonly references: readonly RawReferenceExcel[];
}
