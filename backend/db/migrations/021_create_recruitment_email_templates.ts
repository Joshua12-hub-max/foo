import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  // Create table
  await db.schema
    .createTable('recruitment_email_templates')
    .ifNotExists()
    .addColumn('id', 'integer', (col) => col.primaryKey().autoIncrement())
    .addColumn('stage_name', 'varchar(50)', (col) => col.notNull().unique())
    .addColumn('subject_template', 'varchar(255)', (col) => col.notNull())
    .addColumn('body_template', 'text', (col) => col.notNull())
    .addColumn('available_variables', 'text')
    .addColumn('updated_at', 'timestamp', (col) => col.defaultTo(sql`CURRENT_TIMESTAMP`))
    .execute();

  // Seed default templates
  const templates = [
    {
      stage_name: 'Screening',
      subject_template: 'Update on your Application - {{job_title}}',
      body_template: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Application Under Review</h2>
          <p>Dear {{applicant_first_name}},</p>
          <p>We are writing to let you know that we have received your application for the <strong>{{job_title}}</strong> position and it is currently being reviewed by our recruitment team.</p>
          <p>We appreciate your interest in joining our team. If your qualifications match our requirements, we will contact you to schedule an interview.</p>
          <p>Best regards,<br>The Recruitment Team</p>
        </div>
      `,
      available_variables: 'applicant_first_name, applicant_last_name, job_title'
    },
    {
      stage_name: 'Initial Interview',
      subject_template: 'Interview Invitation: {{job_title}}',
      body_template: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Invitation to Interview</h2>
          <p>Dear {{applicant_first_name}},</p>
          <p>We were impressed by your application and would like to invite you for an initial interview for the <strong>{{job_title}}</strong> position.</p>
          <p><strong>Date & Time:</strong> {{interview_date}}<br>
          <strong>Platform:</strong> {{interview_platform}}<br>
          <strong>Link:</strong> <a href="{{interview_link}}">{{interview_link}}</a></p>
          <p>Notes: {{interview_notes}}</p>
          <p>Please let us know if you need to reschedule.</p>
          <p>Best regards,<br>The Recruitment Team</p>
        </div>
      `,
      available_variables: 'applicant_first_name, applicant_last_name, job_title, interview_date, interview_link, interview_platform, interview_notes'
    },
    {
      stage_name: 'Final Interview',
      subject_template: 'Final Interview Invitation: {{job_title}}',
      body_template: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Invitation to Final Interview</h2>
          <p>Dear {{applicant_first_name}},</p>
          <p>Following your initial interview, we are pleased to invite you to the final stage of our interview process for the <strong>{{job_title}}</strong> position.</p>
          <p><strong>Date & Time:</strong> {{interview_date}}<br>
          <strong>Platform/Location:</strong> {{interview_platform}}<br>
          <strong>Link/Address:</strong> {{interview_link}}</p>
          <p>Notes: {{interview_notes}}</p>
          <p>We look forward to speaking with you again.</p>
          <p>Best regards,<br>The Recruitment Team</p>
        </div>
      `,
      available_variables: 'applicant_first_name, applicant_last_name, job_title, interview_date, interview_link, interview_platform, interview_notes'
    },
    {
      stage_name: 'Rejected',
      subject_template: 'Update on your Application - {{job_title}}',
      body_template: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Application Status Update</h2>
          <p>Dear {{applicant_first_name}},</p>
          <p>Thank you for giving us the opportunity to consider you for the <strong>{{job_title}}</strong> position.</p>
          <p>Although your qualifications were impressive, we have decided to move forward with other candidates who more closely match our current needs for this role.</p>
          <p>We wish you the best in your job search and future endeavors.</p>
          <p>Best regards,<br>The Recruitment Team</p>
        </div>
      `,
      available_variables: 'applicant_first_name, applicant_last_name, job_title'
    },
    {
      stage_name: 'Hired',
      subject_template: 'Congratulations! Offer for {{job_title}}',
      body_template: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Congratulations!</h2>
          <p>Dear {{applicant_first_name}},</p>
          <p>We are delighted to offer you the position of <strong>{{job_title}}</strong>!</p>
          <p>We believe your skills and experience will be an excellent addition to our team and we are excited to have you join us.</p>
          <p>Our HR team will be in touch shortly with the formal offer letter and next steps.</p>
          <p>Welcome to the team!</p>
          <p>Best regards,<br>The Recruitment Team</p>
        </div>
      `,
      available_variables: 'applicant_first_name, applicant_last_name, job_title'
    }
  ];

  await db.insertInto('recruitment_email_templates').values(templates).execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('recruitment_email_templates').execute();
}
