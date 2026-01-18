import { google, calendar_v3 } from 'googleapis';
import db from '../db/connection.js';
import type { RowDataPacket } from 'mysql2/promise';

interface TokenRow extends RowDataPacket {
  access_token: string;
  refresh_token: string;
  token_expiry: Date;
}

interface MeetingResult {
  success: boolean;
  meetingLink?: string;
  meetingId?: string;
  error?: string;
}

interface MeetingOptions {
  userId: number;
  title: string;
  startTime: Date;
  duration?: number; // in minutes, default 60
  description?: string;
  attendeeEmail?: string;
  attendeeName?: string;
}

const getOAuth2Client = () => {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
};

/**
 * Generate a Google Meet link by creating a calendar event with conferencing
 */
export const generateGoogleMeetLink = async (options: MeetingOptions): Promise<MeetingResult> => {
  try {
    // Get user's Google Calendar tokens
    const [tokens] = await db.query<TokenRow[]>(
      'SELECT access_token, refresh_token, token_expiry FROM google_calendar_tokens WHERE user_id = ?',
      [options.userId]
    );

    if (tokens.length === 0) {
      return {
        success: false,
        error: 'Google Calendar not connected. Please connect your Google Calendar first.'
      };
    }

    const oauth2Client = getOAuth2Client();
    oauth2Client.setCredentials({
      access_token: tokens[0].access_token,
      refresh_token: tokens[0].refresh_token
    });

    // Handle token refresh if expired
    const tokenExpiry = new Date(tokens[0].token_expiry);
    if (tokenExpiry < new Date()) {
      try {
        const { credentials } = await oauth2Client.refreshAccessToken();
        if (credentials.access_token) {
          await db.query(
            'UPDATE google_calendar_tokens SET access_token = ?, token_expiry = ? WHERE user_id = ?',
            [credentials.access_token, new Date(credentials.expiry_date || Date.now() + 3600000), options.userId]
          );
          oauth2Client.setCredentials(credentials);
        }
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError);
        return {
          success: false,
          error: 'Google Calendar token expired. Please reconnect your Google Calendar.'
        };
      }
    }

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    const duration = options.duration || 60;
    const endTime = new Date(options.startTime.getTime() + duration * 60 * 1000);

    const eventRequest: calendar_v3.Schema$Event = {
      summary: options.title,
      description: options.description || '',
      start: {
        dateTime: options.startTime.toISOString(),
        timeZone: 'Asia/Manila'
      },
      end: {
        dateTime: endTime.toISOString(),
        timeZone: 'Asia/Manila'
      },
      conferenceData: {
        createRequest: {
          requestId: `interview-${Date.now()}-${Math.random().toString(36).substring(7)}`,
          conferenceSolutionKey: {
            type: 'hangoutsMeet'
          }
        }
      }
    };

    // Add attendee if provided
    if (options.attendeeEmail) {
      eventRequest.attendees = [{
        email: options.attendeeEmail,
        displayName: options.attendeeName || options.attendeeEmail
      }];
    }

    const response = await calendar.events.insert({
      calendarId: 'primary',
      conferenceDataVersion: 1,
      requestBody: eventRequest
    });

    const meetLink = response.data.hangoutLink;
    const eventId = response.data.id;

    if (!meetLink) {
      return {
        success: false,
        error: 'Failed to generate Google Meet link. Please try again.'
      };
    }

    return {
      success: true,
      meetingLink: meetLink,
      meetingId: eventId || undefined
    };
  } catch (error) {
    console.error('Error generating Google Meet link:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate meeting link'
    };
  }
};

export default {
  generateGoogleMeetLink
};
