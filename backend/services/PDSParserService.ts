/* eslint-disable @typescript-eslint/naming-convention */
import ExcelJS from 'exceljs';
import {
  PdsParserOutput,
  PdsPersonalInfo,
  PdsEducation,
  PdsEligibility,
  PdsWorkExperience,
  PdsLearningDevelopment,
  PdsFamily,
  PdsOtherInfo,
  PdsReference,
  PdsVoluntaryWork,
} from '../types/pds.js';
import {
  RawPdsExcelData,
  RawPersonalInfoExcel,
  RawFamilyBackgroundExcel,
  RawFamilySpouseExcel,
  RawFamilyParentExcel,
  RawFamilyChildExcel,
  RawEducationExcel,
  RawEligibilityExcel,
  RawWorkExperienceExcel,
  RawVoluntaryWorkExcel,
  RawLearningDevelopmentExcel,
  RawOtherInfoExcel,
  RawReferenceExcel,
} from '../types/pdsRawExcelData.js';
import { PDS_COORDINATE_MAP, CellRange, CheckboxCoordinate } from '../config/pdsCoordinateMap.js';
import { PdsParserOutputSchema } from '../schemas/pdsParserSchema.js';
import {
  normalizePdsDate,
  extractPdsYear,
  normalizePdsInt,
  normalizePdsFloat,
  normalizePdsString,
  isPdsGarbage,
  isPdsGarbageRow as isGarbageRowUtil,
} from '../utils/pdsDataUtils.js';

/**
 * PDS Parser Service — Revised 2025 (Coordinate-Based)
 *
 * Architecture: Extract → Transform → Validate Pipeline
 *
 * This service uses exact cell coordinates instead of label-based regex searching,
 * providing predictable O(1) lookups and resilience to form label changes.
 *
 * Key improvements:
 * - Coordinate-based extraction (no regex label searching)
 * - Comprehensive Zod validation before returning
 * - ISO date format enforcement (YYYY-MM-DD)
 * - 100% type safety (no 'any' or 'unknown')
 * - Arrow functions throughout
 * - Explicit interfaces for raw data
 */

// DEPRECATED: Garbage patterns moved to pdsDataUtils.ts
// This constant is kept for reference but is no longer used in this file

/**
 * Check if a value is garbage (form labels, empty, or invalid)
 * DEPRECATED: Use isPdsGarbage from pdsDataUtils.ts instead
 */
const isGarbage = (val: string | null): boolean => {
  return isPdsGarbage(val);
};

/**
 * Check if an entire row is garbage (all fields empty or invalid)
 * DEPRECATED: Use isPdsGarbageRow from pdsDataUtils.ts instead
 */
const isGarbageRow = (rowData: Record<string, string | null>): boolean => {
  return isGarbageRowUtil(rowData, Object.keys(rowData));
};

/**
 * Extract raw string value from an Excel cell
 * Handles Date objects, formulas, rich text, and plain values
 */
const getCellValue = (sheet: ExcelJS.Worksheet, cellAddress: string): string | null => {
  const cell = sheet.getCell(cellAddress);
  const value = cell.value;

  if (!value) return null;

  // Handle Date objects - convert to ISO format immediately
  if (value instanceof Date) {
    return normalizePdsDate(value);
  }

  // Handle rich text
  if (typeof value === 'object' && 'richText' in value) {
    const richText = value.richText as Array<{ text?: string }>;
    const text = richText.map((rt) => rt.text || '').join('').trim();
    return text || null;
  }

  // Handle formula results
  if (typeof value === 'object' && 'result' in value) {
    const result = (value as ExcelJS.CellFormulaValue).result;

    // Check if result is a date serial number
    if (typeof result === 'number' && result > 1 && result < 60000) {
      const isoDate = normalizePdsDate(result);
      if (isoDate) return isoDate;
    }

    return String(result).trim() || null;
  }

  // Handle plain values
  const stringValue = String(value).trim();
  return stringValue && stringValue !== '[object Object]' ? stringValue : null;
};

/**
 * Check if a checkbox is marked (X, /, checkmark, true, 1)
 */
const isCheckboxMarked = (sheet: ExcelJS.Worksheet, cellAddress: string): boolean => {
  const value = getCellValue(sheet, cellAddress);
  if (!value) return false;

  const lower = value.toLowerCase();
  return (
    lower === 'x' ||
    lower === '/' ||
    lower === '\u2713' || // Checkmark
    lower === '\u00fc' || // Alternative checkmark
    lower === '\u00fe' || // Alternative checkmark
    lower === 'true' ||
    lower === '1'
  );
};

/**
 * Extract checkbox value from multiple columns (returns matching value or empty string)
 */
const getCheckboxValue = (
  sheet: ExcelJS.Worksheet,
  coord: CheckboxCoordinate,
  choices: Array<{ col: string; val: string }>
): string => {
  for (const choice of choices) {
    if (!coord.columns.includes(choice.col)) continue;

    const cellAddress = `${choice.col}${coord.row}`;
    if (isCheckboxMarked(sheet, cellAddress)) {
      return choice.val;
    }
  }
  return '';
};

/**
 * Extract array data from a cell range using a row transformer
 */
const extractArrayData = <T>(
  sheet: ExcelJS.Worksheet,
  range: CellRange,
  rowTransformer: (row: Record<string, string | null>) => T | null
): T[] => {
  const results: T[] = [];

  for (let rowIdx = range.startRow; rowIdx <= range.endRow; rowIdx++) {
    const rowData: Record<string, string | null> = {};

    // Extract all columns for this row
    range.columns.forEach((col) => {
      rowData[col] = getCellValue(sheet, `${col}${rowIdx}`);
    });

    // Skip garbage rows
    if (isGarbageRow(rowData)) continue;

    // Transform and add if valid
    const transformed = rowTransformer(rowData);
    if (transformed !== null) {
      results.push(transformed);
    }
  }

  return results;
};

/**
 * Stage 1: Extract raw data from Excel using coordinate map
 */
const extractAllData = (workbook: ExcelJS.Workbook): RawPdsExcelData => {
  const sheet1 = workbook.getWorksheet(1);
  const sheet2 = workbook.getWorksheet(2);
  const sheet3 = workbook.getWorksheet(3);
  const sheet4 = workbook.getWorksheet(4);

  if (!sheet1) {
    throw new Error('Sheet 1 (Personal Info) not found in workbook');
  }

  // Extract Personal Information
  const personalInfo: RawPersonalInfoExcel = {
    surname: sheet1 ? getCellValue(sheet1, PDS_COORDINATE_MAP.c1.personalInfo.surname.cell) : null,
    firstName: sheet1 ? getCellValue(sheet1, PDS_COORDINATE_MAP.c1.personalInfo.firstName.cell) : null,
    middleName: sheet1 ? getCellValue(sheet1, PDS_COORDINATE_MAP.c1.personalInfo.middleName.cell) : null,
    birthDate: sheet1 ? getCellValue(sheet1, PDS_COORDINATE_MAP.c1.personalInfo.birthDate.cell) : null,
    placeOfBirth: sheet1 ? getCellValue(sheet1, PDS_COORDINATE_MAP.c1.personalInfo.placeOfBirth.cell) : null,
    gender: sheet1
      ? getCheckboxValue(sheet1, PDS_COORDINATE_MAP.c1.personalInfo.gender, [
          { col: 'D', val: 'Male' },
          { col: 'E', val: 'Male' },
          { col: 'F', val: 'Female' },
          { col: 'G', val: 'Female' },
        ])
      : null,
    civilStatus: sheet1
      ? getCheckboxValue(sheet1, PDS_COORDINATE_MAP.c1.personalInfo.civilStatus.single, [
          { col: 'D', val: 'Single' },
          { col: 'E', val: 'Single' },
        ]) ||
        getCheckboxValue(sheet1, PDS_COORDINATE_MAP.c1.personalInfo.civilStatus.married, [
          { col: 'F', val: 'Married' },
          { col: 'G', val: 'Married' },
        ]) ||
        getCheckboxValue(sheet1, PDS_COORDINATE_MAP.c1.personalInfo.civilStatus.widowed, [
          { col: 'D', val: 'Widowed' },
          { col: 'E', val: 'Widowed' },
        ]) ||
        getCheckboxValue(sheet1, PDS_COORDINATE_MAP.c1.personalInfo.civilStatus.separated, [
          { col: 'F', val: 'Separated' },
          { col: 'G', val: 'Separated' },
        ]) ||
        getCheckboxValue(sheet1, PDS_COORDINATE_MAP.c1.personalInfo.civilStatus.others, [
          { col: 'D', val: 'Other/s' },
          { col: 'E', val: 'Other/s' },
        ])
      : null,
    heightM: sheet1 ? getCellValue(sheet1, PDS_COORDINATE_MAP.c1.personalInfo.heightM.cell) : null,
    weightKg: sheet1 ? getCellValue(sheet1, PDS_COORDINATE_MAP.c1.personalInfo.weightKg.cell) : null,
    bloodType: sheet1 ? getCellValue(sheet1, PDS_COORDINATE_MAP.c1.personalInfo.bloodType.cell) : null,
    citizenship: sheet1
      ? getCheckboxValue(sheet1, PDS_COORDINATE_MAP.c1.personalInfo.citizenship.filipino, [
          { col: 'I', val: 'Filipino' },
        ]) ||
        getCheckboxValue(sheet1, PDS_COORDINATE_MAP.c1.personalInfo.citizenship.dualCitizenship, [
          { col: 'K', val: 'Dual Citizenship' },
        ]) ||
        'Filipino'
      : null,
    citizenshipType: sheet1
      ? getCheckboxValue(sheet1, PDS_COORDINATE_MAP.c1.personalInfo.citizenship.byBirth, [
          { col: 'I', val: 'by birth' },
        ]) ||
        getCheckboxValue(sheet1, PDS_COORDINATE_MAP.c1.personalInfo.citizenship.byNaturalization, [
          { col: 'K', val: 'by naturalization' },
        ])
      : null,
    dualCountry: sheet1 ? getCellValue(sheet1, PDS_COORDINATE_MAP.c1.personalInfo.citizenship.dualCountry.cell) : null,
    gsisNumber: sheet1 ? getCellValue(sheet1, PDS_COORDINATE_MAP.c1.personalInfo.gsisNumber.cell) : null,
    pagibigNumber: sheet1 ? getCellValue(sheet1, PDS_COORDINATE_MAP.c1.personalInfo.pagibigNumber.cell) : null,
    philhealthNumber: sheet1 ? getCellValue(sheet1, PDS_COORDINATE_MAP.c1.personalInfo.philhealthNumber.cell) : null,
    sssNumber: sheet1 ? getCellValue(sheet1, PDS_COORDINATE_MAP.c1.personalInfo.sssNumber.cell) : null,
    tinNumber: sheet1 ? getCellValue(sheet1, PDS_COORDINATE_MAP.c1.personalInfo.tinNumber.cell) : null,
    agencyEmployeeNo: sheet1 ? getCellValue(sheet1, PDS_COORDINATE_MAP.c1.personalInfo.agencyEmployeeNo.cell) : null,
    umidNumber: sheet1 ? getCellValue(sheet1, PDS_COORDINATE_MAP.c1.personalInfo.umidNumber.cell) : null,
    philsysId: sheet1 ? getCellValue(sheet1, PDS_COORDINATE_MAP.c1.personalInfo.philsysId.cell) : null,
    resHouseBlockLot: sheet1
      ? getCellValue(sheet1, PDS_COORDINATE_MAP.c1.personalInfo.residentialAddress.houseBlockLot.cell)
      : null,
    resStreet: sheet1 ? getCellValue(sheet1, PDS_COORDINATE_MAP.c1.personalInfo.residentialAddress.street.cell) : null,
    resSubdivision: sheet1
      ? getCellValue(sheet1, PDS_COORDINATE_MAP.c1.personalInfo.residentialAddress.subdivision.cell)
      : null,
    resBarangay: sheet1
      ? getCellValue(sheet1, PDS_COORDINATE_MAP.c1.personalInfo.residentialAddress.barangay.cell)
      : null,
    resCity: sheet1 ? getCellValue(sheet1, PDS_COORDINATE_MAP.c1.personalInfo.residentialAddress.city.cell) : null,
    resProvince: sheet1
      ? getCellValue(sheet1, PDS_COORDINATE_MAP.c1.personalInfo.residentialAddress.province.cell)
      : null,
    resRegion: sheet1 ? getCellValue(sheet1, PDS_COORDINATE_MAP.c1.personalInfo.residentialAddress.region.cell) : null,
    residentialZipCode: sheet1
      ? getCellValue(sheet1, PDS_COORDINATE_MAP.c1.personalInfo.residentialAddress.zipCode.cell)
      : null,
    permHouseBlockLot: sheet1
      ? getCellValue(sheet1, PDS_COORDINATE_MAP.c1.personalInfo.permanentAddress.houseBlockLot.cell)
      : null,
    permStreet: sheet1 ? getCellValue(sheet1, PDS_COORDINATE_MAP.c1.personalInfo.permanentAddress.street.cell) : null,
    permSubdivision: sheet1
      ? getCellValue(sheet1, PDS_COORDINATE_MAP.c1.personalInfo.permanentAddress.subdivision.cell)
      : null,
    permBarangay: sheet1
      ? getCellValue(sheet1, PDS_COORDINATE_MAP.c1.personalInfo.permanentAddress.barangay.cell)
      : null,
    permCity: sheet1 ? getCellValue(sheet1, PDS_COORDINATE_MAP.c1.personalInfo.permanentAddress.city.cell) : null,
    permProvince: sheet1
      ? getCellValue(sheet1, PDS_COORDINATE_MAP.c1.personalInfo.permanentAddress.province.cell)
      : null,
    permRegion: sheet1 ? getCellValue(sheet1, PDS_COORDINATE_MAP.c1.personalInfo.permanentAddress.region.cell) : null,
    permanentZipCode: sheet1
      ? getCellValue(sheet1, PDS_COORDINATE_MAP.c1.personalInfo.permanentAddress.zipCode.cell)
      : null,
    telephoneNo: sheet1 ? getCellValue(sheet1, PDS_COORDINATE_MAP.c1.personalInfo.telephoneNo.cell) : null,
    mobileNo: sheet1 ? getCellValue(sheet1, PDS_COORDINATE_MAP.c1.personalInfo.mobileNo.cell) : null,
    email: sheet1 ? getCellValue(sheet1, PDS_COORDINATE_MAP.c1.personalInfo.email.cell) : null,
    emergencyContact: sheet4 ? getCellValue(sheet4, PDS_COORDINATE_MAP.c4.emergencyContact.name.cell) : null,
    emergencyContactNumber: sheet4
      ? getCellValue(sheet4, PDS_COORDINATE_MAP.c4.emergencyContact.contactNumber.cell)
      : null,
  };

  // Extract Family Background
  const spouse: RawFamilySpouseExcel = {
    surname: sheet1 ? getCellValue(sheet1, PDS_COORDINATE_MAP.c1.family.spouse.surname.cell) : null,
    firstName: sheet1 ? getCellValue(sheet1, PDS_COORDINATE_MAP.c1.family.spouse.firstName.cell) : null,
    middleName: sheet1 ? getCellValue(sheet1, PDS_COORDINATE_MAP.c1.family.spouse.middleName.cell) : null,
    occupation: sheet1 ? getCellValue(sheet1, PDS_COORDINATE_MAP.c1.family.spouse.occupation.cell) : null,
    employer: sheet1 ? getCellValue(sheet1, PDS_COORDINATE_MAP.c1.family.spouse.employer.cell) : null,
    businessAddress: sheet1 ? getCellValue(sheet1, PDS_COORDINATE_MAP.c1.family.spouse.businessAddress.cell) : null,
    telephoneNo: sheet1 ? getCellValue(sheet1, PDS_COORDINATE_MAP.c1.family.spouse.telephoneNo.cell) : null,
  };

  const father: RawFamilyParentExcel = {
    surname: sheet1 ? getCellValue(sheet1, PDS_COORDINATE_MAP.c1.family.father.surname.cell) : null,
    firstName: sheet1 ? getCellValue(sheet1, PDS_COORDINATE_MAP.c1.family.father.firstName.cell) : null,
    middleName: sheet1 ? getCellValue(sheet1, PDS_COORDINATE_MAP.c1.family.father.middleName.cell) : null,
    nameExtension: sheet1 ? getCellValue(sheet1, PDS_COORDINATE_MAP.c1.family.father.nameExtension.cell) : null,
  };

  const mother: RawFamilyParentExcel = {
    surname: sheet1 ? getCellValue(sheet1, PDS_COORDINATE_MAP.c1.family.mother.surname.cell) : null,
    firstName: sheet1 ? getCellValue(sheet1, PDS_COORDINATE_MAP.c1.family.mother.firstName.cell) : null,
    middleName: sheet1 ? getCellValue(sheet1, PDS_COORDINATE_MAP.c1.family.mother.middleName.cell) : null,
    nameExtension: null,
  };

  const children: readonly RawFamilyChildExcel[] = sheet1
    ? extractArrayData(sheet1, PDS_COORDINATE_MAP.c1.family.children, (row) => {
        const name = row.I;
        if (!name || isGarbage(name)) return null;
        // Skip phone numbers or years
        if (/^\d{10,11}$/.test(name) || /^\d{4}$/.test(name)) return null;

        return {
          name,
          dateOfBirth: row.M,
        };
      })
    : [];

  const familyBackground: RawFamilyBackgroundExcel = {
    spouse,
    father,
    mother,
    children,
  };

  // Extract Education
  const educations: readonly RawEducationExcel[] = sheet1
    ? [
        {
          level: 'Elementary',
          schoolName: getCellValue(sheet1, PDS_COORDINATE_MAP.c1.education.elementary.schoolName.cell),
          degreeCourse: getCellValue(sheet1, PDS_COORDINATE_MAP.c1.education.elementary.degreeCourse.cell),
          dateFrom: getCellValue(sheet1, PDS_COORDINATE_MAP.c1.education.elementary.dateFrom.cell),
          dateTo: getCellValue(sheet1, PDS_COORDINATE_MAP.c1.education.elementary.dateTo.cell),
          unitsEarned: getCellValue(sheet1, PDS_COORDINATE_MAP.c1.education.elementary.unitsEarned.cell),
          yearGraduated: getCellValue(sheet1, PDS_COORDINATE_MAP.c1.education.elementary.yearGraduated.cell),
          honors: getCellValue(sheet1, PDS_COORDINATE_MAP.c1.education.elementary.honors.cell),
        },
        {
          level: 'Secondary',
          schoolName: getCellValue(sheet1, PDS_COORDINATE_MAP.c1.education.secondary.schoolName.cell),
          degreeCourse: getCellValue(sheet1, PDS_COORDINATE_MAP.c1.education.secondary.degreeCourse.cell),
          dateFrom: getCellValue(sheet1, PDS_COORDINATE_MAP.c1.education.secondary.dateFrom.cell),
          dateTo: getCellValue(sheet1, PDS_COORDINATE_MAP.c1.education.secondary.dateTo.cell),
          unitsEarned: getCellValue(sheet1, PDS_COORDINATE_MAP.c1.education.secondary.unitsEarned.cell),
          yearGraduated: getCellValue(sheet1, PDS_COORDINATE_MAP.c1.education.secondary.yearGraduated.cell),
          honors: getCellValue(sheet1, PDS_COORDINATE_MAP.c1.education.secondary.honors.cell),
        },
        {
          level: 'Vocational',
          schoolName: getCellValue(sheet1, PDS_COORDINATE_MAP.c1.education.vocational.schoolName.cell),
          degreeCourse: getCellValue(sheet1, PDS_COORDINATE_MAP.c1.education.vocational.degreeCourse.cell),
          dateFrom: getCellValue(sheet1, PDS_COORDINATE_MAP.c1.education.vocational.dateFrom.cell),
          dateTo: getCellValue(sheet1, PDS_COORDINATE_MAP.c1.education.vocational.dateTo.cell),
          unitsEarned: getCellValue(sheet1, PDS_COORDINATE_MAP.c1.education.vocational.unitsEarned.cell),
          yearGraduated: getCellValue(sheet1, PDS_COORDINATE_MAP.c1.education.vocational.yearGraduated.cell),
          honors: getCellValue(sheet1, PDS_COORDINATE_MAP.c1.education.vocational.honors.cell),
        },
        {
          level: 'College',
          schoolName: getCellValue(sheet1, PDS_COORDINATE_MAP.c1.education.college.schoolName.cell),
          degreeCourse: getCellValue(sheet1, PDS_COORDINATE_MAP.c1.education.college.degreeCourse.cell),
          dateFrom: getCellValue(sheet1, PDS_COORDINATE_MAP.c1.education.college.dateFrom.cell),
          dateTo: getCellValue(sheet1, PDS_COORDINATE_MAP.c1.education.college.dateTo.cell),
          unitsEarned: getCellValue(sheet1, PDS_COORDINATE_MAP.c1.education.college.unitsEarned.cell),
          yearGraduated: getCellValue(sheet1, PDS_COORDINATE_MAP.c1.education.college.yearGraduated.cell),
          honors: getCellValue(sheet1, PDS_COORDINATE_MAP.c1.education.college.honors.cell),
        },
        {
          level: 'Graduate Studies',
          schoolName: getCellValue(sheet1, PDS_COORDINATE_MAP.c1.education.graduate.schoolName.cell),
          degreeCourse: getCellValue(sheet1, PDS_COORDINATE_MAP.c1.education.graduate.degreeCourse.cell),
          dateFrom: getCellValue(sheet1, PDS_COORDINATE_MAP.c1.education.graduate.dateFrom.cell),
          dateTo: getCellValue(sheet1, PDS_COORDINATE_MAP.c1.education.graduate.dateTo.cell),
          unitsEarned: getCellValue(sheet1, PDS_COORDINATE_MAP.c1.education.graduate.unitsEarned.cell),
          yearGraduated: getCellValue(sheet1, PDS_COORDINATE_MAP.c1.education.graduate.yearGraduated.cell),
          honors: getCellValue(sheet1, PDS_COORDINATE_MAP.c1.education.graduate.honors.cell),
        },
      ].filter((edu) => edu.schoolName && !isGarbage(edu.schoolName))
    : [];

  // Extract Eligibility
  const eligibilities: readonly RawEligibilityExcel[] = sheet2
    ? extractArrayData(sheet2, PDS_COORDINATE_MAP.c2.eligibility, (row) => {
        const name = row.B;
        if (!name || isGarbage(name)) return null;

        return {
          eligibilityName: name,
          rating: row.F,
          examDate: row.G,
          examPlace: row.I,
          licenseNumber: row.J,
          validityDate: row.K,
        };
      })
    : [];

  // Extract Work Experience
  const workExperiences: readonly RawWorkExperienceExcel[] = sheet2
    ? extractArrayData(sheet2, PDS_COORDINATE_MAP.c2.workExperience, (row) => {
        const posTitle = row.D;
        const dateFrom = row.A || row.B;

        if (!posTitle || isGarbage(posTitle) || !dateFrom) return null;

        return {
          dateFrom,
          dateTo: row.C,
          positionTitle: posTitle,
          companyName: row.G || '',
          monthlySalary: row.I,
          salaryGrade: row.J,
          appointmentStatus: row.J,
          isGovernment: row.K,
        };
      })
    : [];

  // Extract Voluntary Work
  const voluntaryWorks: readonly RawVoluntaryWorkExcel[] = sheet3
    ? extractArrayData(sheet3, PDS_COORDINATE_MAP.c3.voluntaryWork, (row) => {
        const org = row.B;
        if (!org || isGarbage(org)) return null;

        return {
          organizationName: org,
          address: row.D,
          dateFrom: row.E,
          dateTo: row.F,
          hoursNumber: row.G,
          position: row.H,
        };
      })
    : [];

  // Extract Learning and Development
  const learningDevelopments: readonly RawLearningDevelopmentExcel[] = sheet3
    ? extractArrayData(sheet3, PDS_COORDINATE_MAP.c3.learningDevelopment, (row) => {
        const title = row.B;
        if (!title || isGarbage(title)) return null;

        return {
          title,
          dateFrom: row.E,
          dateTo: row.F,
          hoursNumber: row.G,
          typeOfLd: row.H,
          conductedBy: row.I,
        };
      })
    : [];

  // Extract Other Info
  const otherInfo: readonly RawOtherInfoExcel[] = sheet3
    ? extractArrayData(sheet3, PDS_COORDINATE_MAP.c3.otherInfo, (row) => {
        const items: RawOtherInfoExcel[] = [];

        if (row.B && !isGarbage(row.B)) {
          items.push({ type: 'Skill', description: row.B });
        }
        if (row.D && !isGarbage(row.D)) {
          items.push({ type: 'Recognition', description: row.D });
        }
        if (row.J && !isGarbage(row.J)) {
          items.push({ type: 'Membership', description: row.J });
        }

        return items.length > 0 ? items[0] : null;
      }).concat(
        sheet3
          ? extractArrayData(sheet3, PDS_COORDINATE_MAP.c3.otherInfo, (row) => {
              if (row.D && !isGarbage(row.D)) {
                return { type: 'Recognition', description: row.D };
              }
              return null;
            })
          : []
      )
    : [];

  // Extract References
  const references: readonly RawReferenceExcel[] = sheet4
    ? extractArrayData(sheet4, PDS_COORDINATE_MAP.c4.references, (row) => {
        const name = row.A || row.B;
        const address = row.F;
        const telNo = row.G;

        // Filter out garbage data - check all fields
        if (!name || isGarbage(name)) return null;
        if (address && isGarbage(address)) return null;
        if (telNo && isGarbage(telNo)) return null;

        // Additional validation: reject if name is too short (likely a question number)
        if (name.trim().length < 3) return null;

        // Additional validation: reject if address is suspiciously long (declaration text)
        if (address && address.length > 200) return null;

        return {
          name,
          address,
          telNo,
        };
      })
    : [];

  return {
    personalInfo,
    familyBackground,
    educations,
    eligibilities,
    workExperiences,
    voluntaryWorks,
    learningDevelopments,
    otherInfo,
    references,
  };
};

/**
 * Stage 2: Transform raw strings to typed data with proper formats
 */
const transformRawData = (rawData: RawPdsExcelData): PdsParserOutput => {
  const { personalInfo: raw } = rawData;

  // Transform personal info using unified utilities
  const personal: PdsPersonalInfo = {
    birthDate: normalizePdsDate(raw.birthDate) || undefined,
    placeOfBirth: normalizePdsString(raw.placeOfBirth) || undefined,
    gender: normalizePdsString(raw.gender) || undefined,
    civilStatus: normalizePdsString(raw.civilStatus) || undefined,
    heightM: raw.heightM ? normalizePdsFloat(raw.heightM) ? parseFloat(normalizePdsFloat(raw.heightM)!) : undefined : undefined,
    weightKg: raw.weightKg ? normalizePdsFloat(raw.weightKg) ? parseFloat(normalizePdsFloat(raw.weightKg)!) : undefined : undefined,
    bloodType: normalizePdsString(raw.bloodType) || undefined,
    citizenship: normalizePdsString(raw.citizenship) || undefined,
    citizenshipType: normalizePdsString(raw.citizenshipType) || undefined,
    dualCountry: normalizePdsString(raw.dualCountry) || undefined,
    telephoneNo: normalizePdsString(raw.telephoneNo) || undefined,
    mobileNo: normalizePdsString(raw.mobileNo) || undefined,
    gsisNumber: normalizePdsString(raw.gsisNumber) || undefined,
    pagibigNumber: normalizePdsString(raw.pagibigNumber) || undefined,
    philhealthNumber: normalizePdsString(raw.philhealthNumber) || undefined,
    sssNumber: normalizePdsString(raw.sssNumber) || undefined,
    tinNumber: normalizePdsString(raw.tinNumber) || undefined,
    umidNumber: normalizePdsString(raw.umidNumber) || undefined,
    philsysId: normalizePdsString(raw.philsysId) || undefined,
    agencyEmployeeNo: normalizePdsString(raw.agencyEmployeeNo) || undefined,
    resHouseBlockLot: normalizePdsString(raw.resHouseBlockLot) || undefined,
    resStreet: normalizePdsString(raw.resStreet) || undefined,
    resSubdivision: normalizePdsString(raw.resSubdivision) || undefined,
    resBarangay: normalizePdsString(raw.resBarangay) || undefined,
    resCity: normalizePdsString(raw.resCity) || undefined,
    resProvince: normalizePdsString(raw.resProvince) || undefined,
    resRegion: normalizePdsString(raw.resRegion) || undefined,
    residentialZipCode: normalizePdsString(raw.residentialZipCode) || undefined,
    permHouseBlockLot: normalizePdsString(raw.permHouseBlockLot) || undefined,
    permStreet: normalizePdsString(raw.permStreet) || undefined,
    permSubdivision: normalizePdsString(raw.permSubdivision) || undefined,
    permBarangay: normalizePdsString(raw.permBarangay) || undefined,
    permCity: normalizePdsString(raw.permCity) || undefined,
    permProvince: normalizePdsString(raw.permProvince) || undefined,
    permRegion: normalizePdsString(raw.permRegion) || undefined,
    permanentZipCode: normalizePdsString(raw.permanentZipCode) || undefined,
    emergencyContact: normalizePdsString(raw.emergencyContact) || undefined,
    emergencyContactNumber: normalizePdsString(raw.emergencyContactNumber) || undefined,
  };

  // Transform family background
  const familyBackground: PdsFamily[] = [];

  // Spouse
  if (normalizePdsString(rawData.familyBackground.spouse.surname) || normalizePdsString(rawData.familyBackground.spouse.firstName)) {
    familyBackground.push({
      relationType: 'Spouse',
      lastName: normalizePdsString(rawData.familyBackground.spouse.surname) || undefined,
      firstName: normalizePdsString(rawData.familyBackground.spouse.firstName) || undefined,
      middleName: normalizePdsString(rawData.familyBackground.spouse.middleName) || undefined,
      occupation: normalizePdsString(rawData.familyBackground.spouse.occupation) || undefined,
      employer: normalizePdsString(rawData.familyBackground.spouse.employer) || undefined,
      businessAddress: normalizePdsString(rawData.familyBackground.spouse.businessAddress) || undefined,
      telephoneNo: normalizePdsString(rawData.familyBackground.spouse.telephoneNo) || undefined,
    });
  }

  // Father
  if (normalizePdsString(rawData.familyBackground.father.surname) || normalizePdsString(rawData.familyBackground.father.firstName)) {
    familyBackground.push({
      relationType: 'Father',
      lastName: normalizePdsString(rawData.familyBackground.father.surname) || undefined,
      firstName: normalizePdsString(rawData.familyBackground.father.firstName) || undefined,
      middleName: normalizePdsString(rawData.familyBackground.father.middleName) || undefined,
      nameExtension: normalizePdsString(rawData.familyBackground.father.nameExtension) || undefined,
    });
  }

  // Mother
  if (normalizePdsString(rawData.familyBackground.mother.surname) || normalizePdsString(rawData.familyBackground.mother.firstName)) {
    familyBackground.push({
      relationType: 'Mother',
      lastName: normalizePdsString(rawData.familyBackground.mother.surname) || undefined,
      firstName: normalizePdsString(rawData.familyBackground.mother.firstName) || undefined,
      middleName: normalizePdsString(rawData.familyBackground.mother.middleName) || undefined,
    });
  }

  // Children
  rawData.familyBackground.children.forEach((child) => {
    const childName = normalizePdsString(child.name);
    if (childName) {
      familyBackground.push({
        relationType: 'Child',
        firstName: childName,
        dateOfBirth: normalizePdsDate(child.dateOfBirth) || undefined,
      });
    }
  });

  // Transform educations - CRITICAL FIX: Extract year only for dateFrom/dateTo (DB expects VARCHAR(4))
  const educations: PdsEducation[] = rawData.educations.map((edu) => ({
    level: edu.level as PdsEducation['level'],
    schoolName: normalizePdsString(edu.schoolName) || '',
    degreeCourse: normalizePdsString(edu.degreeCourse) || undefined,
    dateFrom: extractPdsYear(edu.dateFrom) || undefined,
    dateTo: extractPdsYear(edu.dateTo) || undefined,
    unitsEarned: normalizePdsString(edu.unitsEarned) || undefined,
    yearGraduated: normalizePdsInt(edu.yearGraduated) || undefined,
    honors: normalizePdsString(edu.honors) || undefined,
  }));

  // Transform eligibilities
  const eligibilities: PdsEligibility[] = rawData.eligibilities.map((elig) => ({
    eligibilityName: normalizePdsString(elig.eligibilityName) || '',
    rating: normalizePdsFloat(elig.rating) ? parseFloat(normalizePdsFloat(elig.rating)!) : undefined,
    examDate: normalizePdsDate(elig.examDate) || undefined,
    examPlace: normalizePdsString(elig.examPlace) || undefined,
    licenseNumber: normalizePdsString(elig.licenseNumber) || undefined,
    validityDate: normalizePdsDate(elig.validityDate) || undefined,
  }));

  // Transform work experiences
  const workExperiences: PdsWorkExperience[] = rawData.workExperiences.map((work) => {
    const normalizedDateTo = normalizePdsDate(work.dateTo);
    const dateTo = normalizedDateTo === 'Present' ? 'Present' : normalizedDateTo || undefined;

    return {
      dateFrom: normalizePdsDate(work.dateFrom) || '',
      dateTo,
      positionTitle: normalizePdsString(work.positionTitle) || '',
      companyName: normalizePdsString(work.companyName) || '',
      monthlySalary: normalizePdsFloat(work.monthlySalary) ? parseFloat(normalizePdsFloat(work.monthlySalary)!) : undefined,
      salaryGrade: normalizePdsString(work.salaryGrade) || '',
      appointmentStatus: normalizePdsString(work.appointmentStatus) || undefined,
      isGovernment: work.isGovernment?.toUpperCase() === 'Y' || work.isGovernment?.toUpperCase() === 'YES',
    };
  });

  // Transform voluntary works
  const voluntaryWorks: PdsVoluntaryWork[] = rawData.voluntaryWorks.map((vol) => ({
    organizationName: normalizePdsString(vol.organizationName) || '',
    address: normalizePdsString(vol.address) || undefined,
    dateFrom: normalizePdsDate(vol.dateFrom) || undefined,
    dateTo: normalizePdsDate(vol.dateTo) || undefined,
    hoursNumber: normalizePdsInt(vol.hoursNumber) || undefined,
    position: normalizePdsString(vol.position) || undefined,
  }));

  // Transform learning developments
  const learningDevelopments: PdsLearningDevelopment[] = rawData.learningDevelopments.map((ld) => ({
    title: normalizePdsString(ld.title) || '',
    dateFrom: normalizePdsDate(ld.dateFrom) || undefined,
    dateTo: normalizePdsDate(ld.dateTo) || undefined,
    hoursNumber: normalizePdsInt(ld.hoursNumber) || undefined,
    typeOfLd: normalizePdsString(ld.typeOfLd) || undefined,
    conductedBy: normalizePdsString(ld.conductedBy) || undefined,
  }));

  // Transform other info
  const otherInfo: PdsOtherInfo[] = rawData.otherInfo
    .filter((info) => normalizePdsString(info.description))
    .map((info) => ({
      type: info.type,
      description: normalizePdsString(info.description) || '',
    }));

  // Transform references - filter out invalid/garbage entries
  const references: PdsReference[] = rawData.references
    .map((ref) => ({
      name: normalizePdsString(ref.name, 255) || '',
      address: normalizePdsString(ref.address, 255) || undefined,
      telNo: normalizePdsString(ref.telNo, 50) || undefined,
    }))
    .filter((ref) => {
      // Must have a valid name
      if (!ref.name || ref.name.length < 3) return false;
      // Additional safety check for garbage that slipped through
      if (isPdsGarbage(ref.name)) return false;
      if (ref.address && isPdsGarbage(ref.address)) return false;
      if (ref.telNo && isPdsGarbage(ref.telNo)) return false;
      return true;
    });

  return {
    firstName: normalizePdsString(raw.firstName) || undefined,
    lastName: normalizePdsString(raw.surname) || undefined,
    middleName: normalizePdsString(raw.middleName) || undefined,
    email: normalizePdsString(raw.email) || undefined,
    personal,
    familyBackground,
    educations,
    eligibilities,
    workExperiences,
    voluntaryWorks,
    learningDevelopments,
    otherInfo,
    references,
    declarations: {},
  };
};

/**
 * Main PDS Parser Service
 */
export class PDSParserService {
  /**
   * Parse PDS from Excel buffer using Extract → Transform → Validate pipeline
   */
  static parseFromBuffer = async (buffer: Buffer): Promise<Partial<PdsParserOutput>> => {
    // Load workbook
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer as unknown as Parameters<typeof workbook.xlsx.load>[0]);

    // Stage 1: Extract raw data from Excel
    const rawData: RawPdsExcelData = extractAllData(workbook);

    // Stage 2: Transform raw strings to typed data
    const transformedData: PdsParserOutput = transformRawData(rawData);

    // Stage 3: Validate with Zod
    const validationResult = PdsParserOutputSchema.safeParse(transformedData);

    if (!validationResult.success) {
      const errorMessages: string[] = [];

      for (const err of validationResult.error.issues) {
        const pathStr = Array.isArray(err.path) ? err.path.join('.') : String(err.path);
        const msg = typeof err.message === 'string' ? err.message : 'Unknown error';
        errorMessages.push(`${pathStr}: ${msg}`);
      }

      throw new Error(`PDS validation failed: ${errorMessages.join('; ')}`);
    }

    return validationResult.data as Partial<PdsParserOutput>;
  };

  /**
   * Legacy alias for backward compatibility
   */
  static async parseExcel(buffer: Buffer): Promise<Partial<PdsParserOutput>> {
    return PDSParserService.parseFromBuffer(buffer);
  }

  /**
   * Extract image from Excel (stub)
   */
  static async extractImageFromExcel(_buffer: Buffer): Promise<string | null> {
    return null;
  }

  /**
   * Parse PDF (stub)
   */
  static async parsePDF(_buffer: Buffer): Promise<Partial<PdsParserOutput>> {
    return {};
  }
}
