import { Request, Response } from 'express';
import { db } from '../db/index.js';
import { internalPolicies } from '../db/schema.js';
import { eq } from 'drizzle-orm';

type PolicyCategory = "hours" | "tardiness" | "penalties" | "csc" | "leave" | "plantilla";

export const getPolicies = async (req: Request, res: Response): Promise<void> => {
    try {
        const { category } = req.query;
        const validCategory = category as PolicyCategory | undefined;
        const where = validCategory ? eq(internalPolicies.category, validCategory) : undefined;
        
        const policies = await db.select().from(internalPolicies).where(where);
        
        res.json({ success: true, policies });
    } catch (error) {
        console.error('Get Policies Error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch policies' });
    }
};

export const updatePolicy = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const { title, content, category, versionLabel } = req.body;
        
        await db.update(internalPolicies)
            .set({ 
                title, 
                content: typeof content === 'string' ? content : JSON.stringify(content), 
                category, 
                versionLabel,
                updatedAt: new Date().toISOString()
            })
            .where(eq(internalPolicies.id, Number(id)));
            
        res.json({ success: true, message: 'Policy updated successfully' });
    } catch (error) {
        console.error('Update Policy Error:', error);
        res.status(500).json({ success: false, message: 'Failed to update policy' });
    }
};

export const createPolicy = async (req: Request, res: Response): Promise<void> => {
    try {
        const { title, content, category, versionLabel } = req.body;
        
        const [result] = await db.insert(internalPolicies).values({
            title,
            content: typeof content === 'string' ? content : JSON.stringify(content),
            category,
            versionLabel,
        });
        
        res.status(201).json({ success: true, message: 'Policy created successfully', id: result.insertId });
    } catch (error) {
        console.error('Create Policy Error:', error);
        res.status(500).json({ success: false, message: 'Failed to create policy' });
    }
};
