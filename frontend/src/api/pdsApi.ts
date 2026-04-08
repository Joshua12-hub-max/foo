import api from './axios';
import { AxiosResponse } from 'axios';
import type { PdsParserOutput } from '../types/pds';

export interface PDSEducation {
  id?: number;
  level: 'Elementary' | 'Secondary' | 'Vocational' | 'College' | 'Graduate Studies';
  schoolName: string;
  degreeCourse?: string;
  yearGraduated?: number;
  unitsEarned?: string;
  dateFrom?: string;    // 4-char year string e.g. "2001"
  dateTo?: string;      // 4-char year string e.g. "2005"
  honors?: string;
}

export interface PDSPersonalInformation {
  id?: number;
  employeeId?: number;
  birthDate?: string | null;
  placeOfBirth?: string | null;
  gender?: string | null;
  civilStatus?: string | null;
  heightM?: string | null;
  weightKg?: string | null;
  bloodType?: string | null;
  citizenship?: string | null;
  citizenshipType?: string | null;
  dualCountry?: string | null;
  residentialZipCode?: string | null;
  permanentZipCode?: string | null;
  telephoneNo?: string | null;
  mobileNo?: string | null;
  umidNumber?: string | null;
  philsysId?: string | null;
  philhealthNumber?: string | null;
  pagibigNumber?: string | null;
  tinNumber?: string | null;
  gsisNumber?: string | null;
  agencyEmployeeNo?: string | null;
  resHouseBlockLot?: string | null;
  resStreet?: string | null;
  resSubdivision?: string | null;
  resBarangay?: string | null;
  resCity?: string | null;
  resProvince?: string | null;
  resRegion?: string | null;
  permHouseBlockLot?: string | null;
  permStreet?: string | null;
  permSubdivision?: string | null;
  permBarangay?: string | null;
  permCity?: string | null;
  permProvince?: string | null;
  permRegion?: string | null;
}

// Declarations — booleans only, matching DB schema
export interface PDSDeclarations {
  id?: number;
  employeeId?: number;
  relatedThirdDegree?: boolean | null;
  relatedThirdDetails?: string | null;
  relatedFourthDegree?: boolean | null;
  relatedFourthDetails?: string | null;
  foundGuiltyAdmin?: boolean | null;
  foundGuiltyDetails?: string | null;
  criminallyCharged?: boolean | null;
  dateFiled?: string | null;
  statusOfCase?: string | null;
  convictedCrime?: boolean | null;
  convictedDetails?: string | null;
  separatedFromService?: boolean | null;
  separatedDetails?: string | null;
  electionCandidate?: boolean | null;
  electionDetails?: string | null;
  resignedToPromote?: boolean | null;
  resignedDetails?: string | null;
  immigrantStatus?: boolean | null;
  immigrantDetails?: string | null;
  indigenousMember?: boolean | null;
  indigenousDetails?: string | null;
  personWithDisability?: boolean | null;
  disabilityIdNo?: string | null;
  soloParent?: boolean | null;
  soloParentIdNo?: string | null;
  govtIdType?: string | null;
  govtIdNo?: string | null;
  govtIdIssuance?: string | null;
}

export const pdsApi = {
  getSection: async <T>(section: string, employeeId?: number): Promise<AxiosResponse<{ success: boolean; data: T[] }>> => {
    return await api.get(`/pds/${section}`, { params: { employeeId } });
  },

  updateSection: async <T>(section: string, items: T[], employeeId?: number): Promise<AxiosResponse<{ success: boolean; message: string }>> => {
    return await api.put(`/pds/${section}`, { items, employeeId });
  },

  getPdsPersonalInformation: async (employeeId?: number): Promise<AxiosResponse<{ success: boolean; data: PDSPersonalInformation | null }>> => {
    return await api.get('/pds/personal', { params: { employeeId } });
  },

  updatePdsPersonalInformation: async (data: PDSPersonalInformation): Promise<AxiosResponse<{ success: boolean; message: string }>> => {
    return await api.put('/pds/personal', data);
  },

  getPdsQuestions: async (employeeId?: number): Promise<AxiosResponse<{ success: boolean; data: PDSDeclarations | null }>> => {
    return await api.get('/pds/questions', { params: { employeeId } });
  },

  updatePdsQuestions: async (data: PDSDeclarations): Promise<AxiosResponse<{ success: boolean; message: string }>> => {
    return await api.put('/pds/questions', data);
  },

  parsePds: async (file: File, employeeId?: number): Promise<AxiosResponse<{ success: boolean; data: Partial<PdsParserOutput>; avatar: string | null; message: string }>> => {
    const formData = new FormData();
    formData.append('pds', file);
    if (employeeId) formData.append('employeeId', employeeId.toString());
    return await api.post('/pds/parse', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
};
