import { db } from '../db/index.js';
import { recruitmentApplicants, recruitmentJobs } from '../db/schema.js';
import { eq, or, and, sql, desc, SQL } from 'drizzle-orm';
import { getTemplateForStage, replaceVariables, sendEmailNotification } from '../utils/emailHelpers.js';

interface CheckDuplicateParams {
    first_name: string;
    last_name: string;
    middle_name?: string | null;
    suffix?: string | null;
    email: string;
    birth_date: string;
    tin_no?: string | null;
    gsis_no?: string | null;
    philsys_id?: string | null;
}

export const checkDuplicateApplication = async (params: CheckDuplicateParams) => {
    const conditions: SQL<unknown>[] = [
        eq(recruitmentApplicants.email, params.email)
    ];

    if (params.first_name && params.last_name && params.birth_date) {
        const nameDateCondition = and(
            eq(recruitmentApplicants.first_name, params.first_name),
            eq(recruitmentApplicants.last_name, params.last_name),
            eq(recruitmentApplicants.birth_date, params.birth_date)
        );
        if (nameDateCondition) {
            conditions.push(nameDateCondition);
        }
    }

    if (params.tin_no) conditions.push(eq(recruitmentApplicants.tin_no, params.tin_no));
    if (params.gsis_no) conditions.push(eq(recruitmentApplicants.gsis_no, params.gsis_no));
    if (params.philsys_id) conditions.push(eq(recruitmentApplicants.philsys_id, params.philsys_id));

    // Get the most recent application matching any of these criteria within 3 months
    const existingApplication = await db.query.recruitmentApplicants.findFirst({
        where: and(
            or(...conditions),
            sql`${recruitmentApplicants.created_at} > NOW() - INTERVAL 3 MONTH`
        ),
        orderBy: [desc(recruitmentApplicants.created_at)]
    });

    return existingApplication;
};

interface NoticeParams {
    job_id: number;
    first_name: string;
    last_name: string;
    email: string;
}

export const sendApplicationNotifications = async (params: NoticeParams) => {
    try {
        const job = await db.query.recruitmentJobs.findFirst({
            where: eq(recruitmentJobs.id, params.job_id)
        });

        const template = await getTemplateForStage(db, 'Applied');
        
        if (template && job) {
            const variables = {
                applicant_first_name: params.first_name,
                applicant_last_name: params.last_name,
                job_title: job.title
            };

            const subject = replaceVariables(template.subject_template, variables);
            const body = replaceVariables(template.body_template, variables);

            await sendEmailNotification(params.email, subject, body);
        } else {
            // Fallback generic email
            const subject = `Application Received: ${job?.title || 'General Application'}`;
            const body = `Dear ${params.first_name},<br><br>Thank you for applying for the position of ${job?.title || 'General Application'} at the Local Government of Meycauayan. We have received your application and will review it shortly.<br><br>Best regards,<br>Recruitment Team`;
            await sendEmailNotification(params.email, subject, body);
        }
    } catch (error) {
        console.error('Failed to send application notification:', error);
    }
};
