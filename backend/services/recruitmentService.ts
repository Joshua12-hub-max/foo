import { db } from '../db/index.js';
import { recruitmentApplicants, recruitmentJobs } from '../db/schema.js';
import { eq, or, and, desc } from 'drizzle-orm';
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
    const conditions: SQL[] = [
        eq(recruitmentApplicants.email, params.email)
    ];

    if (params.firstName && params.lastName && params.birthDate) {
        const nameDateCondition = and(
            eq(recruitmentApplicants.firstName, params.firstName),
            eq(recruitmentApplicants.lastName, params.lastName),
            eq(recruitmentApplicants.birthDate, params.birthDate)
        );
        if (nameDateCondition) {
            conditions.push(nameDateCondition);
        }
    }

    if (params.tinNumber) conditions.push(eq(recruitmentApplicants.tinNumber, params.tinNumber));
    if (params.gsisNumber) conditions.push(eq(recruitmentApplicants.gsisNumber, params.gsisNumber));
    if (params.philsysId) conditions.push(eq(recruitmentApplicants.philsysId, params.philsysId));

    // Get any existing application matching these criteria (Global uniqueness check)
    const existingApplication = await db.query.recruitmentApplicants.findFirst({
        where: or(...conditions),
        orderBy: [desc(recruitmentApplicants.createdAt)]
    });

    return existingApplication;
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
                applicantName: `${params.firstName} ${params.lastName}`,
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
