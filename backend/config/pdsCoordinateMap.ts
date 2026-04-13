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
      // Name fields (typically starting around row 7)
      surname: { sheet: 1, cell: 'D7' },
      firstName: { sheet: 1, cell: 'D8' },
      middleName: { sheet: 1, cell: 'D9' },

      // Birth information
      birthDate: { sheet: 1, cell: 'D11' },
      placeOfBirth: { sheet: 1, cell: 'D12' },

      // Physical attributes
      gender: { sheet: 1, row: 13, columns: ['D', 'E', 'F', 'G'] },
      heightM: { sheet: 1, cell: 'D15' },
      weightKg: { sheet: 1, cell: 'D16' },
      bloodType: { sheet: 1, cell: 'D17' },

      // Civil status (typically around row 14)
      civilStatus: {
        single: { sheet: 1, row: 14, columns: ['D', 'E'] },
        married: { sheet: 1, row: 14, columns: ['F', 'G'] },
        widowed: { sheet: 1, row: 15, columns: ['D', 'E'] },
        separated: { sheet: 1, row: 15, columns: ['F', 'G'] },
        others: { sheet: 1, row: 16, columns: ['D', 'E'] },
      },

      // Citizenship (typically around row 18)
      citizenship: {
        filipino: { sheet: 1, row: 18, columns: ['I'] },
        dualCitizenship: { sheet: 1, row: 18, columns: ['K'] },
        byBirth: { sheet: 1, row: 19, columns: ['I'] },
        byNaturalization: { sheet: 1, row: 19, columns: ['K'] },
        dualCountry: { sheet: 1, cell: 'I20' },
      },

      // Government IDs
      gsisNumber: { sheet: 1, cell: 'D19' },
      pagibigNumber: { sheet: 1, cell: 'D20' },
      philhealthNumber: { sheet: 1, cell: 'D21' },
      sssNumber: { sheet: 1, cell: 'D22' },
      tinNumber: { sheet: 1, cell: 'D23' },
      agencyEmployeeNo: { sheet: 1, cell: 'D24' },
      umidNumber: { sheet: 1, cell: 'D25' },
      philsysId: { sheet: 1, cell: 'D26' },

      // Residential address (typically starting around row 18)
      residentialAddress: {
        houseBlockLot: { sheet: 1, cell: 'I18' },
        street: { sheet: 1, cell: 'L18' },
        subdivision: { sheet: 1, cell: 'I20' },
        barangay: { sheet: 1, cell: 'L20' },
        city: { sheet: 1, cell: 'I23' },
        province: { sheet: 1, cell: 'L23' },
        region: { sheet: 1, cell: 'I24' },
        zipCode: { sheet: 1, cell: 'I25' },
      },

      // Permanent address (typically starting around row 28)
      permanentAddress: {
        houseBlockLot: { sheet: 1, cell: 'I28' },
        street: { sheet: 1, cell: 'L28' },
        subdivision: { sheet: 1, cell: 'I30' },
        barangay: { sheet: 1, cell: 'L30' },
        city: { sheet: 1, cell: 'J32' },
        province: { sheet: 1, cell: 'N32' },
        region: { sheet: 1, cell: 'I33' },
        zipCode: { sheet: 1, cell: 'I34' },
      },

      // Contact information
      telephoneNo: { sheet: 1, cell: 'I36' },
      mobileNo: { sheet: 1, cell: 'I37' },
      email: { sheet: 1, cell: 'I38' },
    },

    family: {
      spouse: {
        surname: { sheet: 1, cell: 'D30' },
        firstName: { sheet: 1, cell: 'D31' },
        middleName: { sheet: 1, cell: 'D32' },
        occupation: { sheet: 1, cell: 'D33' },
        employer: { sheet: 1, cell: 'D34' },
        businessAddress: { sheet: 1, cell: 'D35' },
        telephoneNo: { sheet: 1, cell: 'D36' },
      },
      father: {
        surname: { sheet: 1, cell: 'D38' },
        firstName: { sheet: 1, cell: 'D39' },
        middleName: { sheet: 1, cell: 'D40' },
        nameExtension: { sheet: 1, cell: 'G39' },
      },
      mother: {
        surname: { sheet: 1, cell: 'D43' },
        firstName: { sheet: 1, cell: 'D44' },
        middleName: { sheet: 1, cell: 'D45' },
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
        schoolName: { sheet: 1, cell: 'D48' },
        degreeCourse: { sheet: 1, cell: 'G48' },
        dateFrom: { sheet: 1, cell: 'J48' },
        dateTo: { sheet: 1, cell: 'K48' },
        unitsEarned: { sheet: 1, cell: 'L48' },
        yearGraduated: { sheet: 1, cell: 'M48' },
        honors: { sheet: 1, cell: 'N48' },
      },
      secondary: {
        schoolName: { sheet: 1, cell: 'D49' },
        degreeCourse: { sheet: 1, cell: 'G49' },
        dateFrom: { sheet: 1, cell: 'J49' },
        dateTo: { sheet: 1, cell: 'K49' },
        unitsEarned: { sheet: 1, cell: 'L49' },
        yearGraduated: { sheet: 1, cell: 'M49' },
        honors: { sheet: 1, cell: 'N49' },
      },
      vocational: {
        schoolName: { sheet: 1, cell: 'D50' },
        degreeCourse: { sheet: 1, cell: 'G50' },
        dateFrom: { sheet: 1, cell: 'J50' },
        dateTo: { sheet: 1, cell: 'K50' },
        unitsEarned: { sheet: 1, cell: 'L50' },
        yearGraduated: { sheet: 1, cell: 'M50' },
        honors: { sheet: 1, cell: 'N50' },
      },
      college: {
        schoolName: { sheet: 1, cell: 'D51' },
        degreeCourse: { sheet: 1, cell: 'G51' },
        dateFrom: { sheet: 1, cell: 'J51' },
        dateTo: { sheet: 1, cell: 'K51' },
        unitsEarned: { sheet: 1, cell: 'L51' },
        yearGraduated: { sheet: 1, cell: 'M51' },
        honors: { sheet: 1, cell: 'N51' },
      },
      graduate: {
        schoolName: { sheet: 1, cell: 'D52' },
        degreeCourse: { sheet: 1, cell: 'G52' },
        dateFrom: { sheet: 1, cell: 'J52' },
        dateTo: { sheet: 1, cell: 'K52' },
        unitsEarned: { sheet: 1, cell: 'L52' },
        yearGraduated: { sheet: 1, cell: 'M52' },
        honors: { sheet: 1, cell: 'N52' },
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
