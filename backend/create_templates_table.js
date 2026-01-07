import db from './db/connection.js';

const createTable = async () => {
  try {
    // Create Table
    await db.query(`
      CREATE TABLE IF NOT EXISTS recruitment_email_templates (
        id INT AUTO_INCREMENT PRIMARY KEY,
        stage_name VARCHAR(50) NOT NULL UNIQUE,
        subject_template VARCHAR(255) NOT NULL,
        body_template TEXT NOT NULL,
        available_variables TEXT,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    console.log("Table 'recruitment_email_templates' created or exists.");

    // Initial Data
    const templates = [
      {
        stage_name: 'Screening',
        subject: 'Application Under Review',
        body: '<div style="font-family: Arial, sans-serif; color: #333;"><h2>Application Status Update</h2><p>Dear {{applicant_first_name}},</p><p>We are pleased to inform you that your application for <strong>{{job_title}}</strong> is now <strong>under review</strong>.</p><p>Our team will assess your qualifications and get back to you shortly.</p><p>Best regards,<br>Recruitment Team</p></div>',
        variables: 'applicant_first_name, job_title'
      },
      {
        stage_name: 'Initial Interview',
        subject: 'Interview Invitation: Initial Interview',
        body: '<div style="font-family: Arial, sans-serif; color: #333;"><h2>Interview Invitation</h2><p>Dear {{applicant_first_name}},</p><p>You have been shortlisted for an <strong>Initial Interview</strong> for the {{job_title}} position.</p><div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;"><p><strong>Date:</strong> {{interview_date}}</p><p><strong>Platform:</strong> {{interview_platform}}</p><p><strong>Link:</strong> <a href="{{interview_link}}">{{interview_link}}</a></p><p><strong>Notes:</strong> {{interview_notes}}</p></div><p>Please ensure you are available and prepared.</p><p>Best regards,<br>Recruitment Team</p></div>',
        variables: 'applicant_first_name, job_title, interview_date, interview_platform, interview_link, interview_notes'
      },
      {
        stage_name: 'Final Interview',
        subject: 'Interview Invitation: Final Interview',
        body: '<div style="font-family: Arial, sans-serif; color: #333;"><h2>Final Interview Invitation</h2><p>Dear {{applicant_first_name}},</p><p>We are impressed with your progress and would like to invite you for a <strong>Final Interview</strong> for the {{job_title}} position.</p><div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;"><p><strong>Date:</strong> {{interview_date}}</p><p><strong>Platform:</strong> {{interview_platform}}</p><p><strong>Link:</strong> <a href="{{interview_link}}">{{interview_link}}</a></p><p><strong>Notes:</strong> {{interview_notes}}</p></div><p>Best regards,<br>Recruitment Team</p></div>',
        variables: 'applicant_first_name, job_title, interview_date, interview_platform, interview_link, interview_notes'
      },
      {
        stage_name: 'Offer',
        subject: 'Job Offer from Our Company',
        body: '<div style="font-family: Arial, sans-serif; color: #333;"><h2>Congratulations!</h2><p>Dear {{applicant_first_name}},</p><p>We are pleased to extend a <strong>job offer</strong> to you for the position of <strong>{{job_title}}</strong>!</p><p>Our HR team will contact you shortly with the details of your offer package.</p><p>We look forward to having you on our team!</p><p>Best regards,<br>Recruitment Team</p></div>',
        variables: 'applicant_first_name, job_title'
      },
      {
        stage_name: 'Hired',
        subject: 'Welcome to the Team!',
        body: '<div style="font-family: Arial, sans-serif; color: #333;"><h2>Welcome Aboard!</h2><p>Dear {{applicant_first_name}},</p><p>Congratulations! You are now officially <strong>hired</strong> as our new {{job_title}}.</p><p>Our HR team will reach out with onboarding details.</p><p>Welcome to the team!</p><p>Best regards,<br>Recruitment Team</p></div>',
        variables: 'applicant_first_name, job_title'
      },
      {
        stage_name: 'Rejected',
        subject: 'Application Update',
        body: '<div style="font-family: Arial, sans-serif; color: #333;"><h2>Application Status</h2><p>Dear {{applicant_first_name}},</p><p>Thank you for your interest in the {{job_title}} position and for taking the time to apply.</p><p>After careful consideration, we regret to inform you that we will not be moving forward with your application at this time.</p><p>We encourage you to apply for future openings that match your qualifications.</p><p>Best regards,<br>Recruitment Team</p></div>',
        variables: 'applicant_first_name, job_title'
      }
    ];

    for (const temp of templates) {
      await db.query(`
        INSERT INTO recruitment_email_templates (stage_name, subject_template, body_template, available_variables)
        VALUES (?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE 
          subject_template = VALUES(subject_template),
          body_template = VALUES(body_template),
          available_variables = VALUES(available_variables)
      `, [temp.stage_name, temp.subject, temp.body, temp.variables]);
    }

    console.log("Templates seeded successfully.");
    process.exit(0);
  } catch (error) {
    console.error("Error creating/seeding table:", error);
    process.exit(1);
  }
};

createTable();
