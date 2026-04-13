/* eslint-disable @typescript-eslint/naming-convention */
import ExcelJS from 'exceljs';
import { PdsParserOutput, PdsPersonalInfo, PdsEducation, PdsEligibility, PdsWorkExperience, PdsLearningDevelopment, PdsFamily, PdsOtherInfo, PdsReference, PdsVoluntaryWork } from '../types/pds.js';

/**
 * PDS Parser Service — Revised 2025 (CS Form 212)
 *
 * ACTUAL sheet layout (verified against real uploaded files):
 *   C1 (Sheet 1): I. Personal Info + II. Family Background + III. Education
 *   C2 (Sheet 2): IV. Civil Service Eligibility + V. Work Experience
 *   C3 (Sheet 3): VI. Voluntary Work + VII. L&D + VIII. Other Info
 *   C4 (Sheet 4): Declarations (Q34-40) + 41. References
 */

// Patterns that indicate a cell contains a form label/header, not real data
const GARBAGE_PATTERNS = [
  /^(continue on separate sheet|cs form 212|signature|date filed|status of case)/i,
  /^(wet signature|e-signature|digital certificate)/i,
  /^(inclusive dates|dd\/mm|number of hours|conducted.*sponsored)/i,
  /^(position title|department.*agency|name of school|basic education)/i,
  /^(name.*address.*organization|scholarship|highest level)/i,
  /^(house\/block|subdivision\/village|city\/municipality|province$|street$|barangay$|zip code)/i,
  /^(gov't service|status of appointment|rating|if applicable)/i,
  /^(from$|to$|period of attendance|level$)/i,
  /^(name extension|jr\.,? sr|pls\. indicate)/i,
  /^(if yes|if holder|please indicate|pursuant to)/i,
  /^(are you|have you|do you|were you)/i,
  /^(special skills|non-academic|membership in)/i,
  /^(\d{1,2}\.$|[ivx]+\.\s)/i,  // Section numbers like "35." or "VII. "
  /^(ces\/csee|career service|board.*bar)/i,
  /^(license|valid until|place of exam)/i,
  /^(name$|office.*residential address|contact no)/i,
];

function isGarbage(val: string): boolean {
  if (!val || val.trim().length === 0) return true;
  const s = val.trim();
  if (s === '[object Object]') return true;
  return GARBAGE_PATTERNS.some(p => p.test(s));
}

export class PDSParserService {
  static async parseExcel(buffer: Buffer): Promise<Partial<PdsParserOutput>> {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer as unknown as Parameters<typeof workbook.xlsx.load>[0]);

    const data: Partial<PdsParserOutput> = {
      personal: {} as PdsPersonalInfo,
      familyBackground: [],
      educations: [],
      eligibilities: [],
      workExperiences: [],
      voluntaryWorks: [],
      learningDevelopments: [],
      otherInfo: [],
      references: [],
      declarations: {}
    };
    
     
    const personal = data.personal!;

    const sheet1 = workbook.getWorksheet(1) || workbook.getWorksheet('C1');
    const sheet2 = workbook.getWorksheet(2) || workbook.getWorksheet('C2');
    const sheet3 = workbook.getWorksheet(3) || workbook.getWorksheet('C3');
    const sheet4 = workbook.getWorksheet(4) || workbook.getWorksheet('C4');

    // --- Utility functions ---
    const gv = (sheet: ExcelJS.Worksheet, col: string, rowIdx: number): string => {
      if (!sheet || rowIdx <= 0) return '';
      const cell = sheet.getCell(`${col}${rowIdx}`);
      const val = cell.value;
      if (!val) return '';
      let final = '';
      if (val instanceof Date) final = val.toISOString().split('T')[0];
      else if (typeof val === 'object' && val !== null) {
        if ('richText' in val && Array.isArray((val as ExcelJS.CellValue & { richText: unknown[] }).richText)) {
          const richText = (val as ExcelJS.CellValue & { richText: { text?: string }[] }).richText;
          final = richText.map(rt => rt.text || '').join('');
        } else if ('result' in val) {
          final = String((val as ExcelJS.CellFormulaValue).result);
        } else {
          final = String(val);
        }
      } else {
        final = String(val);
      }
      const trimmed = final.trim();
      return trimmed === '[object Object]' ? '' : trimmed;
    };

    const fp = (sheet: ExcelJS.Worksheet, regex: RegExp, preferredCols?: string[]): { row: number, col: string } => {
      let found = { row: -1, col: '' };
      if (!sheet) return found;
      sheet.eachRow({ includeEmpty: false }, (row, rowNum) => {
        if (found.row !== -1) return;
        row.eachCell({ includeEmpty: false }, (cell, colNum) => {
           if (found.row !== -1) return;
           const colLetter = sheet.getColumn(colNum).letter;
           if (preferredCols && !preferredCols.includes(colLetter)) return;
           const val = cell.value ? String(typeof cell.value === 'object' && 'result' in cell.value ? cell.value.result : cell.value).toLowerCase() : '';
           if (regex.test(val)) found = { row: rowNum, col: colLetter };
        });
      });
      return found;
    };

    const gc = (sheet: ExcelJS.Worksheet, rowIdx: number, choices: { col: string; val: string }[]): string => {
      if (!sheet || rowIdx <= 0) return '';
      for (const c of choices) {
        const v = String(sheet.getCell(`${c.col}${rowIdx}`).value || '').toLowerCase();
        if (v === 'x' || v === '/' || v === '\u2713' || v === '\u00fc' || v === '\u00fe' || v.includes(c.val.toLowerCase())) return c.val;
      }
      return '';
    };

    const normalizeDate = (val: ExcelJS.CellValue): string => {
      if (!val) return '';
      if (val instanceof Date) return val.toISOString().split('T')[0];
      const s = String(typeof val === 'object' && val !== null && 'result' in val ? (val as ExcelJS.CellFormulaValue).result : val).trim();
      if (!s || s === '[object Object]') return '';
      const d = new Date(s);
      return isNaN(d.getTime()) ? s : d.toISOString().split('T')[0];
    };

    // ==========================================
    // SHEET 1 (C1): Personal Info + Family + Education
    // ==========================================
    if (sheet1) {
      const g = (c: string, r: number) => gv(sheet1 as ExcelJS.Worksheet, c, r);

      // --- I. PERSONAL INFORMATION (label-anchored) ---
      const surnameRow = fp(sheet1 as ExcelJS.Worksheet, /^surname$/i, ['B', 'C']).row;
      if (surnameRow > 0) {
        data.lastName = g('D', surnameRow);
        data.firstName = g('D', surnameRow + 1);
        data.middleName = g('D', surnameRow + 2);
      }

      // DOB
      const dobRow = fp(sheet1 as ExcelJS.Worksheet, /date of birth/i, ['B', 'C']).row;
      if (dobRow > 0) personal.birthDate = normalizeDate(g('D', dobRow));

      // POB
      const pobRow = fp(sheet1 as ExcelJS.Worksheet, /place of birth/i, ['B', 'C', 'D']).row;
      if (pobRow > 0) personal.placeOfBirth = g('D', pobRow);

      // Sex
      const sexRow = fp(sheet1 as ExcelJS.Worksheet, /sex at birth/i, ['B', 'C']).row;
      if (sexRow > 0) personal.gender = gc(sheet1 as ExcelJS.Worksheet, sexRow, [{col: 'D', val: 'Male'}, {col: 'E', val: 'Male'}, {col: 'F', val: 'Female'}, {col: 'G', val: 'Female'}]);

      // Civil Status
      const civilRow = fp(sheet1 as ExcelJS.Worksheet, /civil status/i, ['B', 'C']).row;
      if (civilRow > 0) personal.civilStatus = 
                           gc(sheet1 as ExcelJS.Worksheet, civilRow, [{col: 'D', val: 'Single'}, {col: 'E', val: 'Single'}, {col: 'F', val: 'Married'}, {col: 'G', val: 'Married'}]) ||
                           gc(sheet1 as ExcelJS.Worksheet, civilRow + 1, [{col: 'D', val: 'Widowed'}, {col: 'E', val: 'Widowed'}, {col: 'F', val: 'Separated'}, {col: 'G', val: 'Separated'}]) ||
                           gc(sheet1 as ExcelJS.Worksheet, civilRow + 2, [{col: 'D', val: 'Other/s'}, {col: 'E', val: 'Other/s'}]);

      // Height
      const heightRow = fp(sheet1 as ExcelJS.Worksheet, /height.*\(m\)/i, ['B', 'C']).row;
      if (heightRow > 0) personal.heightM = parseFloat(g('D', heightRow)) || undefined;

      // Weight
      const weightRow = fp(sheet1 as ExcelJS.Worksheet, /weight.*\(kg\)/i, ['B', 'C']).row;
      if (weightRow > 0) personal.weightKg = parseFloat(g('D', weightRow)) || undefined;

      // Blood Type
      const bloodRow = fp(sheet1 as ExcelJS.Worksheet, /blood type/i, ['B', 'C']).row;
      if (bloodRow > 0) personal.bloodType = g('D', bloodRow);

      // Citizenship
      const citizenRow = fp(sheet1 as ExcelJS.Worksheet, /citizenship/i, ['G']).row;
      if (citizenRow > 0) {
        personal.citizenship = gc(sheet1 as ExcelJS.Worksheet, citizenRow, [{col: 'I', val: 'Filipino'}, {col: 'K', val: 'Dual Citizenship'}]) || 'Filipino';

        // If dual citizenship, check for type (by birth or by naturalization)
        if (personal.citizenship === 'Dual Citizenship') {
          const byBirth = gc(sheet1 as ExcelJS.Worksheet, citizenRow + 1, [{col: 'I', val: 'by birth'}]);
          const byNat = gc(sheet1 as ExcelJS.Worksheet, citizenRow + 1, [{col: 'K', val: 'by naturalization'}]);
          personal.citizenshipType = byBirth || byNat || undefined;

          // Get the dual citizenship country
          const countryRow = fp(sheet1 as ExcelJS.Worksheet, /pls\. indicate country/i, ['G', 'H']).row;
          if (countryRow > 0) {
            personal.dualCountry = g('I', countryRow) || g('J', countryRow);
          }
        }
      }

      // Government IDs
      const umidRow = fp(sheet1 as ExcelJS.Worksheet, /umid/i, ['B', 'C']).row;
      if (umidRow > 0) personal.umidNumber = g('D', umidRow);

      const pagibigRow = fp(sheet1 as ExcelJS.Worksheet, /pag-?ibig/i, ['B', 'C']).row;
      if (pagibigRow > 0) personal.pagibigNumber = g('D', pagibigRow);

      const philhealthRow = fp(sheet1 as ExcelJS.Worksheet, /philhealth/i, ['B', 'C']).row;
      if (philhealthRow > 0) personal.philhealthNumber = g('D', philhealthRow);

      const philsysRow = fp(sheet1 as ExcelJS.Worksheet, /philsys/i, ['B', 'C']).row;
      if (philsysRow > 0) personal.philsysId = g('D', philsysRow);

      const tinRow = fp(sheet1 as ExcelJS.Worksheet, /tin no/i, ['A', 'B', 'C']).row;
      if (tinRow > 0) personal.tinNumber = g('D', tinRow);

      const agencyRow = fp(sheet1 as ExcelJS.Worksheet, /agency employee/i, ['A', 'B', 'C']).row;
      if (agencyRow > 0) personal.agencyEmployeeNo = g('D', agencyRow);

      const gsisRow = fp(sheet1 as ExcelJS.Worksheet, /gsis/i, ['B', 'C']).row;
      if (gsisRow > 0) personal.gsisNumber = g('D', gsisRow);

      // --- RESIDENTIAL ADDRESS ---
      const resPos = fp(sheet1 as ExcelJS.Worksheet, /residential address/i, ['G', 'H', 'I']);
      if (resPos.row > 0) {
        const rr = resPos.row;
        personal.resHouseBlockLot = g('I', rr);
        personal.resStreet = g('L', rr);
        personal.resSubdivision = g('I', rr + 2);
        personal.resBarangay = g('L', rr + 2);

        // City/Municipality row - look for the label
        const resCityRow = rr + 5;
        const resCityLabel = g('G', resCityRow);
        if (/city.*municipality/i.test(resCityLabel) || /municipality/i.test(resCityLabel)) {
          personal.resCity = g('I', resCityRow);
        } else {
          personal.resCity = g('I', rr + 5);
        }

        personal.resProvince = g('L', rr + 5);

        // Extract region - search for region label near residential address section
        let resRegionFound = false;
        for (let offset = 2; offset <= 14 && !resRegionFound; offset++) {
          const labelG = g('G', rr + offset);
          const labelH = g('H', rr + offset);
          if (/region/i.test(labelG) || /region/i.test(labelH)) {
            personal.resRegion = g('I', rr + offset) || g('J', rr + offset) || g('K', rr + offset);
            resRegionFound = true;
          }
        }

        const resZipRow = fp(sheet1 as ExcelJS.Worksheet, /zip code/i, ['G', 'H']).row;
        if (resZipRow > 0 && resZipRow < rr + 10) {
          personal.residentialZipCode = g('I', resZipRow);
        }
      }

      // --- PERMANENT ADDRESS ---
      const permPos = fp(sheet1 as ExcelJS.Worksheet, /permanent address/i, ['G', 'H', 'I']);
      if (permPos.row > 0) {
        const pr = permPos.row;
        personal.permHouseBlockLot = g('I', pr);
        personal.permStreet = g('L', pr);
        personal.permSubdivision = g('I', pr + 2);
        personal.permBarangay = g('L', pr + 2);

        // City/Municipality row
        const permCityRow = pr + 4;
        const permCityLabel = g('G', permCityRow) || g('H', permCityRow);
        if (/city.*municipality/i.test(permCityLabel) || /municipality/i.test(permCityLabel)) {
          personal.permCity = g('J', permCityRow);
        } else {
          personal.permCity = g('J', pr + 4);
        }

        personal.permProvince = g('N', pr + 4);

        // Extract region - search for region label near permanent address section
        let permRegionFound = false;
        for (let offset = 2; offset <= 14 && !permRegionFound; offset++) {
          const labelG = g('G', pr + offset);
          const labelH = g('H', pr + offset);
          if (/region/i.test(labelG) || /region/i.test(labelH)) {
            personal.permRegion = g('I', pr + offset) || g('J', pr + offset) || g('K', pr + offset);
            permRegionFound = true;
          }
        }

        let zipCount = 0;
        let permZipR = -1;
        (sheet1 as ExcelJS.Worksheet).eachRow({ includeEmpty: false }, (row, rowNum) => {
          if (permZipR !== -1) return;
          row.eachCell({ includeEmpty: false }, (cell, colNum) => {
            if (permZipR !== -1) return;
            const colLetter = (sheet1 as ExcelJS.Worksheet).getColumn(colNum).letter;
            if (!['G', 'H'].includes(colLetter)) return;
            const val = cell.value ? String(typeof cell.value === 'object' && 'result' in cell.value ? cell.value.result : cell.value).toLowerCase() : '';
            if (/zip code/i.test(val)) {
              zipCount++;
              if (zipCount === 2) permZipR = rowNum;
            }
          });
        });
        if (permZipR > 0) {
          personal.permanentZipCode = g('I', permZipR);
        }
      }

      // Telephone, Mobile, Email
      const telRow = fp(sheet1 as ExcelJS.Worksheet, /telephone no/i, ['G']).row;
      if (telRow > 0) personal.telephoneNo = g('I', telRow);

      const mobRow = fp(sheet1 as ExcelJS.Worksheet, /mobile no/i, ['G']).row;
      if (mobRow > 0) personal.mobileNo = g('I', mobRow);

      const emailRow = fp(sheet1 as ExcelJS.Worksheet, /e-?mail address/i, ['G']).row;
      if (emailRow > 0) {
        const emailVal = g('I', emailRow);
        if (emailVal && emailVal.includes('@')) data.email = emailVal;
      }

      // --- II. FAMILY BACKGROUND ---
      const famArr: PdsFamily[] = [];

      // Spouse
      const spRow = fp(sheet1 as ExcelJS.Worksheet, /spouse's surname/i, ['B', 'C']).row;
      if (spRow > 0) {
        const sp: PdsFamily = {
          relationType: 'Spouse',
          lastName: g('D', spRow),
          firstName: g('D', spRow + 1),
          middleName: g('D', spRow + 2),
          occupation: g('D', spRow + 3),
          employer: g('D', spRow + 4),
          businessAddress: g('D', spRow + 5),
          telephoneNo: g('D', spRow + 6),
        };
        if (sp.lastName || sp.firstName) famArr.push(sp);
      }

      // Father
      const faRow = fp(sheet1 as ExcelJS.Worksheet, /father's surname/i, ['B', 'C']).row;
      if (faRow > 0) {
        const fa: PdsFamily = {
          relationType: 'Father',
          lastName: g('D', faRow),
          firstName: g('D', faRow + 1),
          middleName: g('D', faRow + 2),
        };
        const extVal = g('G', faRow + 1);
        if (extVal && !/name ext/i.test(extVal)) fa.nameExtension = extVal;
        if (fa.lastName || fa.firstName) famArr.push(fa);
      }

      // Mother
      const moRow = fp(sheet1 as ExcelJS.Worksheet, /mother's maiden name/i, ['B', 'C', 'D']).row;
      if (moRow > 0) {
        const mo: PdsFamily = {
          relationType: 'Mother',
          lastName: g('D', moRow + 1),
          firstName: g('D', moRow + 2),
          middleName: g('D', moRow + 3),
        };
        if (mo.lastName || mo.firstName) famArr.push(mo);
      }

      // Children
      const childHeader = fp(sheet1 as ExcelJS.Worksheet, /name of children/i, ['I', 'J', 'K', 'L']);
      if (childHeader.row > 0) {
        for (let r = childHeader.row + 1; r <= childHeader.row + 12; r++) {
          const cName = g('I', r);
          if (!cName) continue;
          if (isGarbage(cName)) continue;
          if (/^\d{10,11}$/.test(cName) || /^\d{4}$/.test(cName)) continue;
          famArr.push({
            relationType: 'Child',
            firstName: cName,
            dateOfBirth: normalizeDate((sheet1 as ExcelJS.Worksheet).getCell(`M${r}`).value),
          });
        }
      }

      data.familyBackground = famArr;

      // --- III. EDUCATIONAL BACKGROUND ---
      const eduArr: PdsEducation[] = [];
      const levels: Array<{type: PdsEducation['level'], reg: RegExp}> = [
        { type: 'Elementary', reg: /^elementary$/i },
        { type: 'Secondary', reg: /^secondary$/i },
        { type: 'Vocational', reg: /^vocational/i },
        { type: 'College', reg: /^college$/i },
        { type: 'Graduate Studies', reg: /^graduate/i }
      ];
      levels.forEach(l => {
        const p = fp(sheet1 as ExcelJS.Worksheet, l.reg, ['B', 'C']);
        if (p.row > 0) {
          const school = g('D', p.row);
          if (school && !isGarbage(school)) {
            eduArr.push({
              level: l.type,
              schoolName: school,
              degreeCourse: g('G', p.row),
              dateFrom: g('J', p.row),
              dateTo: g('K', p.row),
              unitsEarned: g('L', p.row),
              yearGraduated: parseInt(g('M', p.row)) || undefined,
              honors: g('N', p.row)
            });
          }
        }
      });
      data.educations = eduArr;
    }

    // ==========================================
    // SHEET 2 (C2): IV. Eligibility + V. Work Experience
    // ==========================================
    if (sheet2) {
      const g = (c: string, r: number) => gv(sheet2 as ExcelJS.Worksheet, c, r);

      // --- IV. CIVIL SERVICE ELIGIBILITY ---
      const eligArr: PdsEligibility[] = [];
      const eligHeader = fp(sheet2 as ExcelJS.Worksheet, /civil service eligibility/i);
      const workHeader = fp(sheet2 as ExcelJS.Worksheet, /work experience/i);
      const eligStart = eligHeader.row > 0 ? eligHeader.row + 3 : 5;
      const eligEnd = workHeader.row > 0 ? workHeader.row - 1 : 12;

      for (let r = eligStart; r <= eligEnd; r++) {
        const name = g('B', r);
        if (!name || isGarbage(name)) continue;
        eligArr.push({
          eligibilityName: name,
          rating: parseFloat(g('F', r) || '0') || undefined,
          examDate: normalizeDate((sheet2 as ExcelJS.Worksheet).getCell(`G${r}`).value),
          examPlace: g('I', r),
          licenseNumber: g('J', r),
          validityDate: normalizeDate((sheet2 as ExcelJS.Worksheet).getCell(`K${r}`).value)
        });
      }
      data.eligibilities = eligArr;

      // --- V. WORK EXPERIENCE ---
      const workArr: PdsWorkExperience[] = [];
      const workDataStart = workHeader.row > 0 ? workHeader.row + 5 : 18;
      const workEnd = 45;

      for (let r = workDataStart; r <= workEnd; r++) {
        const posTitle = g('D', r);
        if (!posTitle || isGarbage(posTitle)) continue;

        const toVal = g('C', r);
        const fromVal = normalizeDate((sheet2 as ExcelJS.Worksheet).getCell(`A${r}`).value) || normalizeDate((sheet2 as ExcelJS.Worksheet).getCell(`B${r}`).value);
        if (!fromVal) continue;
        
        workArr.push({
          dateFrom: fromVal,
          dateTo: toVal.toLowerCase() === 'present' ? 'Present' : normalizeDate((sheet2 as ExcelJS.Worksheet).getCell(`C${r}`).value),
          positionTitle: posTitle,
          companyName: g('G', r),
          monthlySalary: parseFloat((g('I', r) || '').replace(/,/g, '') || '0') || undefined,
          salaryGrade: '',
          appointmentStatus: g('J', r),
          isGovernment: g('K', r).toUpperCase() === 'Y' || g('K', r).toUpperCase() === 'YES'
        });
      }
      data.workExperiences = workArr;
    }

    // ==========================================
    // SHEET 3 (C3): VI. Voluntary Work + VII. L&D + VIII. Other Info
    // ==========================================
    if (sheet3) {
      const g = (c: string, r: number) => gv(sheet3 as ExcelJS.Worksheet, c, r);

      // --- VI. VOLUNTARY WORK ---
      const volArr: PdsVoluntaryWork[] = [];
      const volHeader = fp(sheet3 as ExcelJS.Worksheet, /voluntary work/i);
      const ldHeader = fp(sheet3 as ExcelJS.Worksheet, /learning and development/i);
      const volStart = volHeader.row > 0 ? volHeader.row + 4 : 6;
      const volEnd = ldHeader.row > 0 ? ldHeader.row - 2 : 12;

      for (let r = volStart; r <= volEnd; r++) {
        const org = g('B', r);
        if (!org || isGarbage(org)) continue;
        volArr.push({
          organizationName: org,
          address: g('D', r),
          dateFrom: normalizeDate((sheet3 as ExcelJS.Worksheet).getCell(`E${r}`).value),
          dateTo: normalizeDate((sheet3 as ExcelJS.Worksheet).getCell(`F${r}`).value),
          hoursNumber: parseInt(g('G', r) || '0') || undefined,
          position: g('H', r)
        });
      }
      data.voluntaryWorks = volArr;

      // --- VII. LEARNING AND DEVELOPMENT ---
      const ldArr: PdsLearningDevelopment[] = [];
      const otherHeader = fp(sheet3 as ExcelJS.Worksheet, /other information/i);
      const ldStart = ldHeader.row > 0 ? ldHeader.row + 4 : 18;
      const ldEnd = otherHeader.row > 0 ? otherHeader.row - 2 : 38;

      for (let r = ldStart; r <= ldEnd; r++) {
        const title = g('B', r);
        if (!title || isGarbage(title)) continue;
        ldArr.push({
          title,
          dateFrom: normalizeDate((sheet3 as ExcelJS.Worksheet).getCell(`E${r}`).value),
          dateTo: normalizeDate((sheet3 as ExcelJS.Worksheet).getCell(`F${r}`).value),
          hoursNumber: parseInt(g('G', r) || '0') || undefined,
          typeOfLd: g('H', r),
          conductedBy: g('I', r)
        });
      }
      data.learningDevelopments = ldArr;

      // --- VIII. OTHER INFORMATION ---
      const otherArr: PdsOtherInfo[] = [];
      const otherStart = otherHeader.row > 0 ? otherHeader.row + 2 : 42;
      const otherEnd = otherStart + 7;

      for (let r = otherStart; r <= otherEnd; r++) {
        const skill = g('B', r);
        if (skill && !isGarbage(skill)) {
          otherArr.push({ type: 'Skill', description: skill });
        }
        const recog = g('D', r);
        if (recog && !isGarbage(recog)) {
          otherArr.push({ type: 'Recognition', description: recog });
        }
        const member = g('J', r);
        if (member && !isGarbage(member)) {
          otherArr.push({ type: 'Membership', description: member });
        }
      }
      data.otherInfo = otherArr;
    }

    // ==========================================
    // SHEET 4 (C4): Declarations + 41. References
    // ==========================================
    if (sheet4) {
       const g = (c: string, r: number) => gv(sheet4 as ExcelJS.Worksheet, c, r);

      // --- EMERGENCY CONTACT ---
      const emergencyPos = fp(sheet4 as ExcelJS.Worksheet, /case of emergency/i, ['A', 'B', 'C']);
      if (emergencyPos.row > 0) {
        personal.emergencyContact = g('D', emergencyPos.row) || g('E', emergencyPos.row);
        personal.emergencyContactNumber = g('D', emergencyPos.row + 1) || g('E', emergencyPos.row + 1);
      } else {
        // Alternative location near thumbmark
        const thumbPos = fp(sheet4 as ExcelJS.Worksheet, /right thumbmark/i, ['A', 'B', 'C']);
        if (thumbPos.row > 0) {
          personal.emergencyContact = g('D', thumbPos.row - 2) || g('E', thumbPos.row - 2);
          personal.emergencyContactNumber = g('D', thumbPos.row - 1) || g('E', thumbPos.row - 1);
        }
      }

      // --- 41. REFERENCES ---
      const refLabelRow = fp(sheet4 as ExcelJS.Worksheet, /references.*person not related/i, ['C', 'D']).row;
      const refNameRow = fp(sheet4 as ExcelJS.Worksheet, /^name$/i, ['A', 'B']).row;
      const refStart = refNameRow > 0 ? refNameRow + 1 : (refLabelRow > 0 ? refLabelRow + 2 : 52);

      const refArr: PdsReference[] = [];
      for (let r = refStart; r <= refStart + 3; r++) {
        const name = g('A', r) || g('B', r);
        if (!name || isGarbage(name)) continue;
        refArr.push({
          name,
          address: g('F', r),
          telNo: g('G', r)
        });
      }
      data.references = refArr;
    }

    return data;
  }

  // Canonical alias — preferred entry point for all callers
  static async parseFromBuffer(buffer: Buffer): Promise<Partial<PdsParserOutput>> {
    return PDSParserService.parseExcel(buffer);
  }

  static async extractImageFromExcel(_buffer: Buffer): Promise<string | null> {
    console.warn("PDSParserService: extractImageFromExcel - stub");
    return null;
  }

  static async parsePDF(_buffer: Buffer): Promise<Partial<PdsParserOutput>> {
    console.warn("PDSParserService: parsePDF - stub");
    return {};
  }
}
