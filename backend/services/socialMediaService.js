import axios from 'axios';
import db from '../db/connection.js';

export const socialMediaService = {
  // --- Facebook Integration ---
  postToFacebook: async (job, pageId, accessToken) => {
    const jobUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/careers/job/${job.id}`;

    const message =
      ` WE'RE HIRING: ${job.title} \n\n` +
      ` Department: ${job.department}\n` +
      `Location: ${job.location}\n` +
      `Type: ${job.employment_type}\n` +
      `Salary: ${job.salary_range || 'Competitive'}\n\n` +
      `ABOUT THE ROLE:\n` +
      `${job.job_description.substring(0, 400)}${job.job_description.length > 400 ? '...' : ''}\n\n` +
      `HOW TO APPLY:\n` +
      (job.application_email ? `Send your resume to: ${job.application_email}\n\n` : '') +
      `#Hiring #CareerOpportunities #JoinOurTeam #RecruitmentPhil`;

    try {
      const response = await axios.post(`https://graph.facebook.com/v18.0/${pageId}/feed`, {
        message: message,
        link: jobUrl,
        access_token: accessToken
      });

      if (response.data.id) {
        return { success: true, postId: response.data.id };
      }
      throw new Error("No Post ID returned from Facebook");
    } catch (error) {
      throw error;
    }
  },

  // --- Telegram Integration ---
  postToTelegram: async (job, botToken, channelId) => {
    const jobUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/careers/job/${job.id}`;
    const message =
      `*WE'RE HIRING: ${job.title}*\n\n` +
      `*Department:* ${job.department}\n` +
      `*Location:* ${job.location}\n` +
      `*Type:* ${job.employment_type}\n` +
      `*Salary:* ${job.salary_range || 'Competitive'}\n\n` +
      `*ABOUT THE ROLE:*\n` +
      `${job.job_description.substring(0, 400)}${job.job_description.length > 400 ? '...' : ''}\n\n` +
      `*HOW TO APPLY:*\n` +
      (job.application_email ? `Send your resume to: ${job.application_email}\n\n` : '') +
      `[View Full Job Posting](${jobUrl})\n\n` +
      `#Hiring #CareerOpportunities #JoinOurTeam`;

    try {
      const response = await axios.post(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        chat_id: channelId,
        text: message,
        parse_mode: 'Markdown',
        disable_web_page_preview: false
      });

      if (response.data.ok) {
        return { success: true, messageId: response.data.result.message_id };
      }
      throw new Error("Telegram API returned not OK");
    } catch (error) {
      throw error;
    }
  },

  // --- LinkedIn Integration ---
  getLinkedInToken: async () => {
    try {
      const [rows] = await db.query(`SELECT setting_value FROM system_settings WHERE setting_key = 'linkedin_access_token'`);
      if (rows.length > 0 && rows[0].setting_value) {
        return rows[0].setting_value;
      }
    } catch (error) {
      console.warn('System settings table issue:', error.message);
    }
    return process.env.LINKEDIN_ACCESS_TOKEN || null;
  },

  storeLinkedInToken: async (accessToken, expiresIn) => {
    await db.query(`
        INSERT INTO system_settings (setting_key, setting_value) 
        VALUES ('linkedin_access_token', ?) 
        ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)
    `, [accessToken]);

    await db.query(`
        INSERT INTO system_settings (setting_key, setting_value) 
        VALUES ('linkedin_token_expires', ?) 
        ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)
    `, [new Date(Date.now() + expiresIn * 1000).toISOString()]);
  },

  postToLinkedIn: async (job, accessToken) => {
    const jobUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/careers/job/${job.id}`;

    // 1. Get User ID (Person URN)
    const meResponse = await axios.get('https://api.linkedin.com/v2/me', {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    const personId = meResponse.data.id;

    // 2. Create UGC Post
    const postData = {
      author: `urn:li:person:${personId}`,
      lifecycleState: "PUBLISHED",
      specificContent: {
        "com.linkedin.ugc.ShareContent": {
          shareCommentary: {
            text: `We're Hiring: ${job.title}!

` +
              `Department: ${job.department}
` +
              `Location: ${job.location}
` +
              `Type: ${job.employment_type}
` +
              `Salary: ${job.salary_range || 'Competitive'}

` +
              `${job.job_description.substring(0, 500)}${job.job_description.length > 500 ? '...' : ''}

` +
              (job.application_email ? ` Apply: ${job.application_email}

` : '') +
              `#Hiring #Careers #JobOpening`
          },
          shareMediaCategory: "ARTICLE",
          media: [{
            status: "READY",
            originalUrl: jobUrl,
            title: { text: `${job.title} - ${job.department}` },
            description: { text: job.job_description.substring(0, 200) }
          }]
        }
      },
      visibility: {
        "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC"
      }
    };

    try {
      const response = await axios.post('https://api.linkedin.com/v2/ugcPosts', postData, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'X-Restli-Protocol-Version': '2.0.0'
        }
      });
      return { success: true, postId: response.data.id };
    } catch (error) {
      throw error;
    }
  }
};
