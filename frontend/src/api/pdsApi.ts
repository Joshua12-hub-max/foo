import api from './axios';
import { AxiosResponse } from 'axios';

// Interfaces for PDS Sections (simplified for now, strictly keyed)
export interface PDSFamily {
  id?: number;
  spouseLastName?: string;
  spouseFirstName?: string;
  spouseMiddleName?: string;
  children?: { name: string; birthDate: string }[]; // Example structure if JSON, but likely separate rows
  // ... maps to database schema
}

export interface PDSEducation {
    id?: number;
    level: 'Elementary' | 'Secondary' | 'Vocational' | 'College' | 'Graduate Studies';
    schoolName: string;
    degreeCourse?: string;
    yearGraduated?: number;
    unitsEarned?: string;
    dateFrom?: number;
    dateTo?: number;
    honors?: string;
}

// ... other interfaces can be added as needed

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
  residentialAddress?: string | null;
  residentialZipCode?: string | null;
  permanentAddress?: string | null;
  permanentZipCode?: string | null;
  telephoneNo?: string | null;
  mobileNo?: string | null;
  email?: string | null;
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

export interface PDSDeclarations {
  id?: number;
  employeeId?: number;
  relatedThirdDegree?: string | null;
  relatedThirdDetails?: string | null;
  relatedFourthDegree?: string | null;
  relatedFourthDetails?: string | null;
  foundGuiltyAdmin?: string | null;
  foundGuiltyDetails?: string | null;
  criminallyCharged?: string | null;
  dateFiled?: string | null;
  statusOfCase?: string | null;
  convictedCrime?: string | null;
  convictedDetails?: string | null;
  separatedFromService?: string | null;
  separatedDetails?: string | null;
  electionCandidate?: string | null;
  electionDetails?: string | null;
  resignedToPromote?: string | null;
  resignedDetails?: string | null;
  immigrantStatus?: string | null;
  immigrantDetails?: string | null;
  indigenousMember?: string | null;
  indigenousDetails?: string | null;
  personWithDisability?: string | null;
  disabilityIdNo?: string | null;
  soloParent?: string | null;
  soloParentIdNo?: string | null;
  govtIdType?: string | null;
  govtIdNo?: string | null;
  govtIdIssuance?: string | null;
}

export const pdsApi = {
    // Get PDS Section
    getSection: async <T>(section: string, employeeId?: number): Promise<AxiosResponse<{ success: boolean; data: T[] }>> => {
        return await api.get(`/pds/${section}`, { params: { employeeId } });
    },

    // Update PDS Section (Full Replace Strategy per Controller)
    updateSection: async <T>(section: string, items: T[], employeeId?: number): Promise<AxiosResponse<{ success: boolean; message: string }>> => {
        return await api.put(`/pds/${section}`, { items, employeeId });
    },

    // Personal Information
    getPdsPersonalInformation: async (employeeId?: number): Promise<AxiosResponse<{ success: boolean; data: PDSPersonalInformation | null }>> => {
        return await api.get('/pds/personal', { params: { employeeId } });
    },
    updatePdsPersonalInformation: async (data: PDSPersonalInformation): Promise<AxiosResponse<{ success: boolean; message: string }>> => {
        return await api.put('/pds/personal', data);
    },

    // Declarations (Questions 34-40)
    getPdsQuestions: async (employeeId?: number): Promise<AxiosResponse<{ success: boolean; data: PDSDeclarations | null }>> => {
        return await api.get('/pds/questions', { params: { employeeId } });
    },
    updatePdsQuestions: async (data: PDSDeclarations): Promise<AxiosResponse<{ success: boolean; message: string }>> => {
        return await api.put('/pds/questions', data);
    },

    // 100% Automated Parsing
    parsePds: async (file: File, employeeId?: number): Promise<AxiosResponse<{ success: boolean; data: any; avatar: string | null; message: string }>> => {
        const formData = new FormData();
        formData.append('pds', file);
        if (employeeId) formData.append('employeeId', employeeId.toString());
        return await api.post('/pds/parse', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
    }
};
