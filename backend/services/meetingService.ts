import { google, calendar_v3 } from 'googleapis';
import { db } from '../db/index.js';
import { googleCalendarTokens } from '../db/schema.js';
import { eq } from 'drizzle-orm';

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
    const tokens = await db.query.googleCalendarTokens.findFirst({
      where: eq(googleCalendarTokens.userId, options.userId)
    });

    if (!tokens) {
      return {
        success: false,
        error: 'Google Calendar not connected. Please connect your Google Calendar first.'
      };
    }

    const oauth2Client = getOAuth2Client();
    oauth2Client.setCredentials({
      /* eslint-disable @typescript-eslint/naming-convention */
      access_token: tokens.accessToken,
      refresh_token: tokens.refreshToken
      /* eslint-enable @typescript-eslint/naming-convention */
    });

    // Handle token refresh if expired
    const tokenExpiry = new Date(tokens.tokenExpiry);
    if (tokenExpiry < new Date()) {
      try {
        const { credentials } = await oauth2Client.refreshAccessToken();
        if (credentials.access_token) {
          await db.update(googleCalendarTokens)
            .set({ 
              accessToken: credentials.access_token, 
              tokenExpiry: new Date(credentials.expiry_date || Date.now() + 3600000).toISOString() 
            })
            .where(eq(googleCalendarTokens.userId, options.userId));
            
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
      error: error instanceof Error ? (error as Error).message : 'Failed to generate meeting link'
    };
  }
};

export default {
  generateGoogleMeetLink
};
