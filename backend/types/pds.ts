export interface PDSFormData {
  surname: string;
  firstName: string;
  middleName: string;
  nameExtension: string;
  dob: string;
  pob: string;
  sex: string;
  civilStatus: string;
  height: string;
  weight: string;
  bloodType: string;
  gsisId: string;
  pagibigId: string;
  philhealthNo: string;
  philsysNo: string;
  tinNo: string;
  agencyEmployeeNo: string;
  umidId: string;
  citizenship: string;
  // Add more fields as needed based on PDS 2025
}

export interface PDSParsingResult extends Partial<PDSFormData> {
  // Add result-specific fields if any
}
