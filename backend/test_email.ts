import { sendEmail } from './utils/emailUtils.js';
import dotenv from 'dotenv';
dotenv.config({ path: './.env' });

async function testEmail() {
  try {
    console.log('Testing email sending...');
    console.log('EMAIL_USER:', process.env.EMAIL_USER);
    console.log('EMAIL_PASS:', process.env.EMAIL_PASS ? 'SET' : 'NOT SET');
    
    // Using a real destination for testing if possible or just see if the transporter fails
    await sendEmail('capstone682@gmail.com', 'Test Email', '<h1>This is a test email</h1>');
    console.log('Email sent successfully!');
  } catch (error) {
    console.error('Failed to send email:', error);
  }
}

testEmail();
