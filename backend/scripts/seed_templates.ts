
import { db } from '../db/index.js';
import { recruitmentEmailTemplates } from '../db/schema.js';

const templates = [
  {
    stage_name: 'Applied',
    subject_template: 'Application Received: {job_title}',
    body_template: 'Dear {applicant_first_name},<br><br>Thank you for applying for the <strong>{job_title}</strong> position. We have received your application and will review it shortly.<br><br>Best regards,<br>Recruitment Team'
  },
  {
    stage_name: 'Screening',
    subject_template: 'Update on your Application: {job_title}',
    body_template: 'Dear {applicant_first_name},<br><br>We are pleased to inform you that your application for <strong>{job_title}</strong> has moved to the screening stage. We will be in touch soon regarding next steps.<br><br>Best regards,<br>Recruitment Team'
  },
  {
    stage_name: 'Initial Interview',
    subject_template: 'Interview Invitation: {job_title}',
    body_template: 'Dear {applicant_first_name},<br><br>We would like to invite you for an initial interview for the <strong>{job_title}</strong> position.<br><br><strong>Date:</strong> {interview_date}<br><strong>Platform:</strong> {interview_platform}<br><strong>Link:</strong> <a href="{interview_link}">{interview_link}</a><br><br>Please let us know if you have any questions.<br><br>Best regards,<br>Recruitment Team'
  },
  {
    stage_name: 'Final Interview',
    subject_template: 'Final Interview Invitation: {job_title}',
    body_template: 'Dear {applicant_first_name},<br><br>We would like to invite you for a final interview for the <strong>{job_title}</strong> position.<br><br><strong>Date:</strong> {interview_date}<br><strong>Platform:</strong> {interview_platform}<br><strong>Link:</strong> <a href="{interview_link}">{interview_link}</a><br><br>We look forward to speaking with you.<br><br>Best regards,<br>Recruitment Team'
  },
  {
    stage_name: 'Offer',
    subject_template: 'Job Offer: {job_title}',
    body_template: 'Dear {applicant_first_name},<br><br>Congratulations! We are pleased to offer you the position of <strong>{job_title}</strong>.<br><br>Please find the attached offer letter details.<br><br>Best regards,<br>Recruitment Team'
  },
  {
    stage_name: 'Hired',
    subject_template: 'Welcome to the Team!',
    body_template: 'Dear {applicant_first_name},<br><br>Welcome aboard! We are excited to have you join us as a <strong>{job_title}</strong>.<br><br>HR will reach out shortly for onboarding details.<br><br>Best regards,<br>Recruitment Team'
  },
  {
    stage_name: 'Rejected',
    subject_template: 'Update on your Application: {job_title}',
    body_template: 'Dear {applicant_first_name},<br><br>Thank you for your interest in the <strong>{job_title}</strong> position. After careful consideration, we have decided to move forward with other candidates at this time.<br><br>We wish you the best in your job search.<br><br>Best regards,<br>Recruitment Team'
  }
];

async function seedTemplates() {
  console.log('Seeding email templates...');
  try {
    for (const temp of templates) {
      await db.insert(recruitmentEmailTemplates).values({
        stage_name: temp.stage_name,
        subject_template: temp.subject_template,
        body_template: temp.body_template,
        available_variables: 'applicant_first_name, applicant_last_name, job_title, interview_date, interview_link, interview_platform'
      }).onDuplicateKeyUpdate({ set: { subject_template: temp.subject_template } }); 
      // simple upsert to avoid errors
    }
    console.log('Templates seeded successfully.');
  } catch (error) {
    console.error('Error seeding templates:', error);
  }
}

seedTemplates();
