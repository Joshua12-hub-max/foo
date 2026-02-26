
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
    } catch (error) {
        console.error('Error fetching barangays:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch barangays'
        });
    }
};
