
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
        const metadataMap: Record<string, never[]> = {};
        settings.forEach(s => {
            try {
                metadataMap[s.settingKey] = JSON.parse(s.settingValue || '[]');
            } catch (e) {
                metadataMap[s.settingKey] = [];
            }
        });

        // Map to expected frontend structure or provide a flat metadata object
        res.json({
            success: true,
            data: {
                appointmentTypes: metadataMap['employment_appointment_types'] || [],
                dutyTypes: metadataMap['employment_duty_types'] || [],
                roles: ['Administrator', 'Human Resource', 'Employee'], // Roles might still be semi-fixed but could also be dynamic if needed
                pdsCivilStatus: metadataMap['pds_civil_status'] || [],
                pdsBloodTypes: metadataMap['pds_blood_types'] || [],
                pdsCitizenship: metadataMap['pds_citizenship'] || [],
                pdsAppointmentStatus: metadataMap['pds_appointment_status'] || [],
                pdsLdTypes: metadataMap['pds_ld_types'] || [],
                pdsGovtIdTypes: metadataMap['pds_govt_id_types'] || [],
                employmentStatus: metadataMap['employment_status'] || [],
                pdsEligibilityTypes: metadataMap['pds_eligibility_types'] || [],
                pdsGender: metadataMap['pds_gender'] || [],
                pdsRelationshipTypes: metadataMap['pds_relationship_types'] || []
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
