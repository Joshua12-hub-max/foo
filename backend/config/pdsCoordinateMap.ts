/**
 * PDS Coordinate Map - CS Form 212 (Revised 2025)
 *
 * This file defines the exact cell coordinates for all fields in the
 * Personal Data Sheet (CS Form 212) Excel file. The map uses a coordinate-based
 * approach for reliable, O(1) lookups instead of label-based regex searching.
 *
 * Structure:
 * - Sheet 1 (C1): Personal Info + Family Background + Education
 * - Sheet 2 (C2): Civil Service Eligibility + Work Experience
 * - Sheet 3 (C3): Voluntary Work + Learning & Development + Other Info
 * - Sheet 4 (C4): Declarations + References
 */

/**
 * Represents a single cell coordinate in the Excel workbook
 */
export interface CellCoordinate {
  readonly sheet: number;
  readonly cell: string;
}

/**
 * Represents a range of cells for array/table data extraction
 */
export interface CellRange {
  readonly sheet: number;
  readonly startRow: number;
  readonly endRow: number;
  readonly columns: readonly string[];
}

/**
 * Checkbox field that may span multiple columns
 */
export interface CheckboxCoordinate {
  readonly sheet: number;
  readonly row: number;
  readonly columns: readonly string[];
}

// ==========================================
// SHEET 1 (C1): Personal Info + Family + Education
// ==========================================

export interface PdsCoordinateMapC1 {
  readonly personalInfo: {
    readonly surname: CellCoordinate;
    readonly firstName: CellCoordinate;
    readonly middleName: CellCoordinate;
    readonly birthDate: CellCoordinate;
    readonly placeOfBirth: CellCoordinate;
    readonly gender: CheckboxCoordinate;
    readonly heightM: CellCoordinate;
    readonly weightKg: CellCoordinate;
    readonly bloodType: CellCoordinate;
    readonly civilStatus: {
      readonly single: CheckboxCoordinate;
      readonly married: CheckboxCoordinate;
      readonly widowed: CheckboxCoordinate;
      readonly separated: CheckboxCoordinate;
      readonly others: CheckboxCoordinate;
    };
    readonly citizenship: {
      readonly filipino: CheckboxCoordinate;
      readonly dualCitizenship: CheckboxCoordinate;
      readonly byBirth: CheckboxCoordinate;
      readonly byNaturalization: CheckboxCoordinate;
      readonly dualCountry: CellCoordinate;
    };
    readonly gsisNumber: CellCoordinate;
    readonly pagibigNumber: CellCoordinate;
    readonly philhealthNumber: CellCoordinate;
    readonly sssNumber: CellCoordinate;
    readonly tinNumber: CellCoordinate;
    readonly agencyEmployeeNo: CellCoordinate;
    readonly umidNumber: CellCoordinate;
    readonly philsysId: CellCoordinate;
    readonly residentialAddress: {
      readonly houseBlockLot: CellCoordinate;
      readonly street: CellCoordinate;
      readonly subdivision: CellCoordinate;
      readonly barangay: CellCoordinate;
      readonly city: CellCoordinate;
      readonly province: CellCoordinate;
      readonly region: CellCoordinate;
      readonly zipCode: CellCoordinate;
    };
    readonly permanentAddress: {
      readonly houseBlockLot: CellCoordinate;
      readonly street: CellCoordinate;
      readonly subdivision: CellCoordinate;
      readonly barangay: CellCoordinate;
      readonly city: CellCoordinate;
      readonly province: CellCoordinate;
      readonly region: CellCoordinate;
      readonly zipCode: CellCoordinate;
    };
    readonly telephoneNo: CellCoordinate;
    readonly mobileNo: CellCoordinate;
    readonly email: CellCoordinate;
  };
  readonly family: {
    readonly spouse: {
      readonly surname: CellCoordinate;
      readonly firstName: CellCoordinate;
      readonly middleName: CellCoordinate;
      readonly occupation: CellCoordinate;
      readonly employer: CellCoordinate;
      readonly businessAddress: CellCoordinate;
      readonly telephoneNo: CellCoordinate;
    };
    readonly father: {
      readonly surname: CellCoordinate;
      readonly firstName: CellCoordinate;
      readonly middleName: CellCoordinate;
      readonly nameExtension: CellCoordinate;
    };
    readonly mother: {
      readonly surname: CellCoordinate;
      readonly firstName: CellCoordinate;
      readonly middleName: CellCoordinate;
    };
    readonly children: CellRange;
  };
  readonly education: {
    readonly elementary: {
      readonly schoolName: CellCoordinate;
      readonly degreeCourse: CellCoordinate;
      readonly dateFrom: CellCoordinate;
      readonly dateTo: CellCoordinate;
      readonly unitsEarned: CellCoordinate;
      readonly yearGraduated: CellCoordinate;
      readonly honors: CellCoordinate;
    };
    readonly secondary: {
      readonly schoolName: CellCoordinate;
      readonly degreeCourse: CellCoordinate;
      readonly dateFrom: CellCoordinate;
      readonly dateTo: CellCoordinate;
      readonly unitsEarned: CellCoordinate;
      readonly yearGraduated: CellCoordinate;
      readonly honors: CellCoordinate;
    };
    readonly vocational: {
      readonly schoolName: CellCoordinate;
      readonly degreeCourse: CellCoordinate;
      readonly dateFrom: CellCoordinate;
      readonly dateTo: CellCoordinate;
      readonly unitsEarned: CellCoordinate;
      readonly yearGraduated: CellCoordinate;
      readonly honors: CellCoordinate;
    };
    readonly college: {
      readonly schoolName: CellCoordinate;
      readonly degreeCourse: CellCoordinate;
      readonly dateFrom: CellCoordinate;
      readonly dateTo: CellCoordinate;
      readonly unitsEarned: CellCoordinate;
      readonly yearGraduated: CellCoordinate;
      readonly honors: CellCoordinate;
    };
    readonly graduate: {
      readonly schoolName: CellCoordinate;
      readonly degreeCourse: CellCoordinate;
      readonly dateFrom: CellCoordinate;
      readonly dateTo: CellCoordinate;
      readonly unitsEarned: CellCoordinate;
      readonly yearGraduated: CellCoordinate;
      readonly honors: CellCoordinate;
    };
  };
}

// ==========================================
// SHEET 2 (C2): Eligibility + Work Experience
// ==========================================

export interface PdsCoordinateMapC2 {
  readonly eligibility: CellRange;
  readonly workExperience: CellRange;
}

// ==========================================
// SHEET 3 (C3): Voluntary Work + L&D + Other Info
// ==========================================

export interface PdsCoordinateMapC3 {
  readonly voluntaryWork: CellRange;
  readonly learningDevelopment: CellRange;
  readonly otherInfo: CellRange;
}

// ==========================================
// SHEET 4 (C4): Declarations + References
// ==========================================

export interface PdsCoordinateMapC4 {
  readonly emergencyContact: {
    readonly name: CellCoordinate;
    readonly contactNumber: CellCoordinate;
  };
  readonly references: CellRange;
}

// ==========================================
// Main Coordinate Map
// ==========================================

export interface PdsCoordinateMap {
  readonly c1: PdsCoordinateMapC1;
  readonly c2: PdsCoordinateMapC2;
  readonly c3: PdsCoordinateMapC3;
  readonly c4: PdsCoordinateMapC4;
}

/**
 * Complete coordinate map for CS Form 212 (Revised 2025)
 *
 * IMPORTANT: These coordinates are based on the standard CS Form 212 layout.
 * They must be verified against actual Excel files and updated if the form layout changes.
 */
export const PDS_COORDINATE_MAP: PdsCoordinateMap = {
  c1: {
    personalInfo: {
      // Name fields - CORRECTED based on actual Excel file
      surname: { sheet: 1, cell: 'D10' },
      firstName: { sheet: 1, cell: 'D11' },
      middleName: { sheet: 1, cell: 'D12' },

      // Birth information
      birthDate: { sheet: 1, cell: 'D13' },
      placeOfBirth: { sheet: 1, cell: 'D15' },

      // Physical attributes - EXACT COORDINATES
      gender: { sheet: 1, row: 16, columns: ['D', 'P'] }, // D=Male, P=Female
      heightM: { sheet: 1, cell: 'D22' },
      weightKg: { sheet: 1, cell: 'D24' },
      bloodType: { sheet: 1, cell: 'D25' },

      // Civil status - EXACT COORDINATES (all in column P)
      civilStatus: {
        single: { sheet: 1, row: 10, columns: ['P'] }, // Might be row 10 or nearby
        married: { sheet: 1, row: 11, columns: ['P'] },
        widowed: { sheet: 1, row: 12, columns: ['P'] },
        separated: { sheet: 1, row: 13, columns: ['P'] },
        others: { sheet: 1, row: 16, columns: ['P'] }, // Solo Parent at row 15, Others at row 16
      },

      // Citizenship
      citizenship: {
        filipino: { sheet: 1, row: 13, columns: ['G'] }, // Row 13 has "16. CITIZENSHIP"
        dualCitizenship: { sheet: 1, row: 15, columns: ['G'] }, // Row 15 has dual citizenship text
        byBirth: { sheet: 1, row: 13, columns: ['G'] },
        byNaturalization: { sheet: 1, row: 15, columns: ['G'] },
        dualCountry: { sheet: 1, cell: 'G15' }, // "Pls. indicate country:" label row
      },

      // Government IDs - CORRECTED
      gsisNumber: { sheet: 1, cell: 'D26' }, // NOTE: Not found in test file
      pagibigNumber: { sheet: 1, cell: 'D29' },
      philhealthNumber: { sheet: 1, cell: 'D31' },
      sssNumber: { sheet: 1, cell: 'D32' }, // NOTE: Not found in test file, using PhilSys row
      tinNumber: { sheet: 1, cell: 'D33' },
      agencyEmployeeNo: { sheet: 1, cell: 'D34' },
      umidNumber: { sheet: 1, cell: 'D27' },
      philsysId: { sheet: 1, cell: 'D32' },

      // Residential address - CORRECTED
      residentialAddress: {
        houseBlockLot: { sheet: 1, cell: 'I17' },
        street: { sheet: 1, cell: 'L17' },
        subdivision: { sheet: 1, cell: 'I19' },
        barangay: { sheet: 1, cell: 'L19' },
        city: { sheet: 1, cell: 'I22' },
        province: { sheet: 1, cell: 'L22' },
        region: { sheet: 1, cell: 'I24' }, // ZIP CODE row
        zipCode: { sheet: 1, cell: 'I24' },
      },

      // Permanent address - CORRECTED
      permanentAddress: {
        houseBlockLot: { sheet: 1, cell: 'I25' },
        street: { sheet: 1, cell: 'L25' },
        subdivision: { sheet: 1, cell: 'I27' },
        barangay: { sheet: 1, cell: 'L27' },
        city: { sheet: 1, cell: 'J29' },
        province: { sheet: 1, cell: 'N29' },
        region: { sheet: 1, cell: 'I31' },
        zipCode: { sheet: 1, cell: 'I31' },
      },

      // Contact information - CORRECTED
      telephoneNo: { sheet: 1, cell: 'I32' }, // Row 32 G32 label
      mobileNo: { sheet: 1, cell: 'I33' },
      email: { sheet: 1, cell: 'I34' },
    },

    family: {
      spouse: {
        surname: { sheet: 1, cell: 'D36' },
        firstName: { sheet: 1, cell: 'D37' },
        middleName: { sheet: 1, cell: 'D38' },
        occupation: { sheet: 1, cell: 'D39' },
        employer: { sheet: 1, cell: 'D40' },
        businessAddress: { sheet: 1, cell: 'D41' },
        telephoneNo: { sheet: 1, cell: 'D42' },
      },
      father: {
        surname: { sheet: 1, cell: 'D43' },
        firstName: { sheet: 1, cell: 'D44' },
        middleName: { sheet: 1, cell: 'D45' },
        nameExtension: { sheet: 1, cell: 'G44' },
      },
      mother: {
        surname: { sheet: 1, cell: 'D47' },
        firstName: { sheet: 1, cell: 'D48' },
        middleName: { sheet: 1, cell: 'D49' },
      },
      children: {
        sheet: 1,
        startRow: 31,
        endRow: 42,
        columns: ['I', 'M'], // I=name, M=dateOfBirth
      },
    },

    education: {
      elementary: {
        schoolName: { sheet: 1, cell: 'D54' },
        degreeCourse: { sheet: 1, cell: 'G54' },
        dateFrom: { sheet: 1, cell: 'J54' },
        dateTo: { sheet: 1, cell: 'K54' },
        unitsEarned: { sheet: 1, cell: 'L54' },
        yearGraduated: { sheet: 1, cell: 'M54' },
        honors: { sheet: 1, cell: 'N54' },
      },
      secondary: {
        schoolName: { sheet: 1, cell: 'D55' },
        degreeCourse: { sheet: 1, cell: 'G55' },
        dateFrom: { sheet: 1, cell: 'J55' },
        dateTo: { sheet: 1, cell: 'K55' },
        unitsEarned: { sheet: 1, cell: 'L55' },
        yearGraduated: { sheet: 1, cell: 'M55' },
        honors: { sheet: 1, cell: 'N55' },
      },
      vocational: {
        schoolName: { sheet: 1, cell: 'D56' },
        degreeCourse: { sheet: 1, cell: 'G56' },
        dateFrom: { sheet: 1, cell: 'J56' },
        dateTo: { sheet: 1, cell: 'K56' },
        unitsEarned: { sheet: 1, cell: 'L56' },
        yearGraduated: { sheet: 1, cell: 'M56' },
        honors: { sheet: 1, cell: 'N56' },
      },
      college: {
        schoolName: { sheet: 1, cell: 'D57' },
        degreeCourse: { sheet: 1, cell: 'G57' },
        dateFrom: { sheet: 1, cell: 'J57' },
        dateTo: { sheet: 1, cell: 'K57' },
        unitsEarned: { sheet: 1, cell: 'L57' },
        yearGraduated: { sheet: 1, cell: 'M57' },
        honors: { sheet: 1, cell: 'N57' },
      },
      graduate: {
        schoolName: { sheet: 1, cell: 'D58' },
        degreeCourse: { sheet: 1, cell: 'G58' },
        dateFrom: { sheet: 1, cell: 'J58' },
        dateTo: { sheet: 1, cell: 'K58' },
        unitsEarned: { sheet: 1, cell: 'L58' },
        yearGraduated: { sheet: 1, cell: 'M58' },
        honors: { sheet: 1, cell: 'N58' },
      },
    },
  },

  c2: {
    eligibility: {
      sheet: 2,
      startRow: 5,
      endRow: 12,
      columns: ['B', 'F', 'G', 'I', 'J', 'K'], // name, rating, examDate, examPlace, licenseNumber, validityDate
    },
    workExperience: {
      sheet: 2,
      startRow: 18,
      endRow: 45,
      columns: ['A', 'B', 'C', 'D', 'G', 'I', 'J', 'K'], // dateFrom, dateFrom2, dateTo, position, company, salary, grade, isGov
    },
  },

  c3: {
    voluntaryWork: {
      sheet: 3,
      startRow: 6,
      endRow: 12,
      columns: ['B', 'D', 'E', 'F', 'G', 'H'], // org, address, dateFrom, dateTo, hours, position
    },
    learningDevelopment: {
      sheet: 3,
      startRow: 18,
      endRow: 38,
      columns: ['B', 'E', 'F', 'G', 'H', 'I'], // title, dateFrom, dateTo, hours, type, conductedBy
    },
    otherInfo: {
      sheet: 3,
      startRow: 42,
      endRow: 49,
      columns: ['B', 'D', 'J'], // skills, recognition, membership
    },
  },

  c4: {
    emergencyContact: {
      name: { sheet: 4, cell: 'D48' },
      contactNumber: { sheet: 4, cell: 'D49' },
    },
    references: {
      sheet: 4,
      startRow: 52,
      endRow: 55,
      columns: ['A', 'B', 'F', 'G'], // name1, name2, address, telNo
    },
  },
};
