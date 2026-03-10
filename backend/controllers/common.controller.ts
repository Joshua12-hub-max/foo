
import { Request, Response } from 'express';
import { db } from '../db/index.js';
import { addressRefBarangays } from '../db/tables/common.js';
import { asc } from 'drizzle-orm';

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
        const appointmentTypes = ['Permanent', 'Contractual', 'Casual', 'Job Order', 'Coterminous', 'Temporary', 'Contract of Service', 'JO', 'COS'];
        const dutyTypes = ['Standard', 'Irregular'];
        const roles = ['Administrator', 'Human Resource', 'Employee'];

        res.json({
            success: true,
            data: {
                appointmentTypes,
                dutyTypes,
                roles
            }
        });
    } catch (_error) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch employment metadata'
        });
    }
};
