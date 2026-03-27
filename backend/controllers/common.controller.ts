
import { Request, Response } from 'express';
import { db } from '../db/index.js';
import { addressRefBarangays, systemSettings } from '../db/tables/common.js';
import { asc, inArray } from 'drizzle-orm';

export const getBarangays = async (_req: Request, res: Response): Promise<void> => {
    try {
        const data = await db.select().from(addressRefBarangays).orderBy(asc(addressRefBarangays.name));
        res.json({
            success: true,
            data
        });
    } catch (_error) {

        res.status(500).json({
            success: false,
            message: 'Failed to fetch barangays'
        });
    }
};

export const getEmploymentMetadata = async (_req: Request, res: Response): Promise<void> => {
    try {
        const keys = [
            'pds_civil_status',
            'pds_blood_types',
            'pds_citizenship',
            'pds_appointment_status',
            'pds_ld_types',
            'pds_govt_id_types',
            'employment_appointment_types',
            'employment_duty_types',
            'employment_status',
            'pds_eligibility_types',
            'pds_gender',
            'pds_relationship_types'
        ];

        const settings = await db.select()
            .from(systemSettings)
            .where(inArray(systemSettings.settingKey, keys));

        // Create a map for easy access
        const metadataMap: Record<string, unknown[]> = {};
        settings.forEach(s => {
            try {
                metadataMap[s.settingKey] = JSON.parse(s.settingValue || '[]') as unknown[];
            } catch (_e) {
                metadataMap[s.settingKey] = [];
            }
        });

        // Map to expected frontend structure or provide a flat metadata object
        res.json({
            success: true,
            data: {
                appointmentTypes: metadataMap['employment_appointment_types']?.length ? metadataMap['employment_appointment_types'] : ['Permanent', 'Contractual', 'Casual', 'Job Order', 'Coterminous', 'Temporary', 'Contract of Service', 'JO', 'COS'],
                dutyTypes: metadataMap['employment_duty_types']?.length ? metadataMap['employment_duty_types'] : ['Standard', 'Irregular'],
                roles: ['Administrator', 'Human Resource', 'Employee'], 
                pdsCivilStatus: metadataMap['pds_civil_status']?.length ? metadataMap['pds_civil_status'] : ['Single', 'Married', 'Widowed', 'Separated', 'Annulled'],
                pdsBloodTypes: metadataMap['pds_blood_types']?.length ? metadataMap['pds_blood_types'] : ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"],
                pdsCitizenship: metadataMap['pds_citizenship']?.length ? metadataMap['pds_citizenship'] : ["Filipino", "Dual Citizenship"],
                pdsAppointmentStatus: metadataMap['pds_appointment_status']?.length ? metadataMap['pds_appointment_status'] : ["Permanent", "Temporary", "Coterminous", "Contractual", "Casual"],
                pdsLdTypes: metadataMap['pds_ld_types']?.length ? metadataMap['pds_ld_types'] : ["Managerial", "Supervisory", "Technical", "Other"],
                pdsGovtIdTypes: metadataMap['pds_govt_id_types']?.length ? metadataMap['pds_govt_id_types'] : ["UMID", "Driver's License", "Passport", "PRC ID", "Postal ID", "Others"],
                employmentStatus: metadataMap['employment_status']?.length ? metadataMap['employment_status'] : ['Active', 'Probationary', 'Terminated', 'Resigned', 'On Leave', 'Suspended', 'Verbal Warning', 'Written Warning', 'Show Cause'],
                pdsEligibilityTypes: metadataMap['pds_eligibility_types']?.length ? metadataMap['pds_eligibility_types'] : [
                    { value: 'none', label: 'None / Not Applicable' },
                    { value: 'csc_prof', label: 'CSC Professional' },
                    { value: 'csc_sub', label: 'CSC Subprofessional' },
                    { value: 'ra_1080', label: 'RA 1080 (Board/Bar)' },
                    { value: 'special_laws', label: 'Special Laws' },
                    { value: 'drivers_license', label: "Driver's License" },
                    { value: 'tesda', label: 'TESDA NC II/III' },
                    { value: 'others', label: 'Others' }
                ],
                pdsGender: metadataMap['pds_gender']?.length ? metadataMap['pds_gender'] : ["Male", "Female", "Prefer not to say", "Other"],
                pdsRelationshipTypes: metadataMap['pds_relationship_types']?.length ? metadataMap['pds_relationship_types'] : ["Spouse", "Father", "Mother", "Child", "Sibling", "Guardian", "Other"]
            }
        });
    } catch (error) {
        console.error('Error fetching employment metadata:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch employment metadata'
        });
    }
};
