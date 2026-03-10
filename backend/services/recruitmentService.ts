import { db } from '../db/index.js';
import { recruitmentApplicants, recruitmentJobs } from '../db/schema.js';
import { eq, or, and, sql, desc, SQL } from 'drizzle-orm';
import { getTemplateForStage, replaceVariables, sendEmailNotification } from '../utils/emailHelpers.js';

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
    const conditions: SQL<unknown>[] = [
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

    // Get the most recent application matching any of these criteria within 3 months
    const existingApplication = await db.query.recruitmentApplicants.findFirst({
        where: and(
            or(...conditions),
            sql`${recruitmentApplicants.createdAt} > NOW() - INTERVAL 3 MONTH`
        ),
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
            const variables = {
                applicantFirstName: params.firstName,
                applicantLastName: params.lastName,
                jobTitle: job.title
            };

            const subject = replaceVariables(template.subjectTemplate, variables);
            const body = replaceVariables(template.bodyTemplate, variables);

            await sendEmailNotification(params.email, subject, body);
        } else {
            // Fallback generic email
            const subject = `Application Received: ${job?.title || 'General Application'}`;
            const body = `Dear ${params.firstName},<br><br>Thank you for applying for the position of ${job?.title || 'General Application'} at the Local Government of Meycauayan. We have received your application and will review it shortly.<br><br>Best regards,<br>Recruitment Team`;
            await sendEmailNotification(params.email, subject, body);
        }
    } catch (error) {
        console.error('Failed to send application notification:', error);
    }
};
