import { db } from '../db/index.js';
import { recruitmentApplicants, recruitmentJobs } from '../db/tables/recruitment.js';
import { eq, or, and, desc, sql } from 'drizzle-orm';
import type { SQL } from 'drizzle-orm';
import { getTemplateForStage, replaceVariables, sendEmailNotification, prepareEmailVariables } from '../utils/emailHelpers.js';

interface CheckDuplicateParams {
    firstName: string;
    lastName: string;
    middleName?: string | null;
    suffix?: string | null;
    email: string;
    birthDate: string;
    tinNumber?: string | null;
    gsisNumber?: string | null;
    philsysId?: string | null;
}

export const checkDuplicateApplication = async (params: CheckDuplicateParams) => {
    try {
        console.log('[RECRUITMENT-SERVICE] === DUPLICATE CHECK DEBUG START ===');
        console.log('[RECRUITMENT-SERVICE] Input Email:', params.email);
        console.log('[RECRUITMENT-SERVICE] DB Instance Type:', typeof db);
        console.log('[RECRUITMENT-SERVICE] recruitmentApplicants Table Type:', typeof recruitmentApplicants);
        
        if (!db || typeof db.select !== 'function') {
            console.error('[RECRUITMENT-SERVICE] FATAL: Database instance (db) is missing or invalid!');
            throw new Error('Database instance is undefined or invalid');
        }

        if (!recruitmentApplicants) {
            console.error('[RECRUITMENT-SERVICE] FATAL: recruitmentApplicants table definition is missing!');
            throw new Error('recruitmentApplicants table is undefined');
        }

        const conditions: SQL[] = [];
        
        // 1. Safe Email Check
        if (params.email && typeof params.email === 'string' && params.email.trim() !== '') {
            const emailVal = params.email.trim();
            console.log('[RECRUITMENT-SERVICE] Adding Email condition:', emailVal);
            conditions.push(eq(recruitmentApplicants.email, emailVal));
        }

        // 2. Safe Government ID Checks
        const checkGovId = (val: any, col: any, name: string) => {
            if (val && typeof val === 'string' && val.trim() !== '') {
                const cleanVal = val.trim();
                console.log(`[RECRUITMENT-SERVICE] Adding ${name} condition:`, cleanVal);
                if (col) {
                    conditions.push(eq(col, cleanVal));
                } else {
                    console.warn(`[RECRUITMENT-SERVICE] Column for ${name} is UNDEFINED!`);
                }
            }
        };

        checkGovId(params.tinNumber, recruitmentApplicants.tinNumber, 'TIN');
        checkGovId(params.gsisNumber, recruitmentApplicants.gsisNumber, 'GSIS');
        checkGovId(params.philsysId, recruitmentApplicants.philsysId, 'PhilSys');

        if (conditions.length === 0) {
            console.log('[RECRUITMENT-SERVICE] No conditions to check, returning empty array');
            return [];
        }

        console.log(`[RECRUITMENT-SERVICE] Final conditions count: ${conditions.length}`);
        
        // 100% PRECISION: Log the condition structure
        try {
            const results = await db.select()
                .from(recruitmentApplicants)
                .where(or(...conditions))
                .limit(5);

            console.log(`[RECRUITMENT-SERVICE] Query successful. Matches found: ${results.length}`);
            return results;
        } catch (queryErr: any) {
            console.error('[RECRUITMENT-SERVICE] DATABASE QUERY FAILED!');
            console.error('[RECRUITMENT-SERVICE] SQL Error:', queryErr.message);
            throw queryErr;
        }
    } catch (error: any) {
        const msg = error?.message || 'Unknown Error';
        console.error('[RECRUITMENT-SERVICE] !!! DUPLICATE CHECK CRASHED !!!');
        console.error('[RECRUITMENT-SERVICE] Error Message:', msg);
        throw error;
    }
};

interface NoticeParams {
    jobId: number;
    firstName: string;
    lastName: string;
    email: string;
}

export const sendApplicationNotifications = async (params: NoticeParams) => {
    try {
        const job = await db.query.recruitmentJobs.findFirst({
            where: eq(recruitmentJobs.id, params.jobId)
        });

        const template = await getTemplateForStage(db, 'Applied');
        
        if (template && job) {
            const rawVariables = {
                applicantFirstName: params.firstName,
                applicantLastName: params.lastName,
                applicantName: `${params.lastName}, ${params.firstName}`,
                jobTitle: job.title
            };

            const variables = prepareEmailVariables(rawVariables);

            console.log('[DEBUG] Email Template Variables:', JSON.stringify(variables, null, 2));
            console.log('[DEBUG] Template before replacement:', template.bodyTemplate);

            const subject = replaceVariables(template.subjectTemplate, variables);
            const body = replaceVariables(template.bodyTemplate, variables);

            console.log('[DEBUG] Email body after replacement:', body);

            await sendEmailNotification(params.email, subject, body);
        } else {
            // Fallback generic email
            const subject = `Application Received: ${job?.title || 'General Application'}`;
            const body = `Dear ${params.firstName},<br><br>Thank you for applying for the position of ${job?.title || 'General Application'} at the Local Government of Meycauayan. We have received your application and will review it shortly.<br><br>Best regards,<br>Office of the City Human Resource Management Officer`;
            await sendEmailNotification(params.email, subject, body);
        }
    } catch (error) {
        console.error('Failed to send application notification:', error);
    }
};
