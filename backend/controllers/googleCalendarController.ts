import { Request, Response } from 'express';
import db from '../db/connection.js';
import { google } from 'googleapis';
import type { RowDataPacket, ResultSetHeader } from 'mysql2/promise';
import type { AuthenticatedRequest } from '../types/index.js';
import type { OAuth2Client } from 'google-auth-library';

// ============================================================================
// Type Definitions
// ============================================================================

interface TokenRow extends RowDataPacket {
  access_token: string;
  refresh_token: string;
  token_expiry: Date;
  calendar_id?: string;
  last_sync?: Date;
  sync_enabled: boolean;
}

interface EventRow extends RowDataPacket {
  id: number;
  title: string;
  date: string;
  time?: number;
  description?: string;
}

interface SyncedEventRow extends RowDataPacket {
  local_event_id: number;
  google_event_id: string;
}

interface CountRow extends RowDataPacket {
  count: number;
}

interface GoogleCalendarConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  clientUrl: string;
}

interface NonceLocals {
  nonce: string;
}

// ============================================================================
// Helper Functions (100% Type-Safe)
// ============================================================================

/**
 * Type-safe error message extractor
 */
const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return 'An unexpected error occurred';
};

/**
 * Validate required environment variables at runtime
 */
const validateEnvironment = (): GoogleCalendarConfig => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI;
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';

  if (!clientId) {
    throw new Error('GOOGLE_CLIENT_ID is not defined in environment variables');
  }
  if (!clientSecret) {
    throw new Error('GOOGLE_CLIENT_SECRET is not defined in environment variables');
  }
  if (!redirectUri) {
    throw new Error('GOOGLE_REDIRECT_URI is not defined in environment variables');
  }

  return { clientId, clientSecret, redirectUri, clientUrl };
};

/**
 * Create OAuth2 client with validated config
 */
const getOAuth2Client = (): OAuth2Client => {
  const config = validateEnvironment();
  return new google.auth.OAuth2(config.clientId, config.clientSecret, config.redirectUri);
};

/**
 * Get authenticated OAuth2 client with valid token (auto-refresh if expired)
 */
const getAuthenticatedClient = async (userId: number): Promise<{ client: OAuth2Client; tokens: TokenRow } | null> => {
  try {
    const [rows] = await db.query<TokenRow[]>(
      'SELECT access_token, refresh_token, token_expiry FROM google_calendar_tokens WHERE user_id = ?',
      [userId]
    );

    if (rows.length === 0) {
      return null;
    }

    const tokenData = rows[0];
    const oauth2Client = getOAuth2Client();

    oauth2Client.setCredentials({
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
    });

    // Check if token is expired or expiring soon (within 5 minutes)
    const now = new Date();
    const expiryDate = new Date(tokenData.token_expiry);
    const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000);

    if (expiryDate <= fiveMinutesFromNow) {
      // Token is expired or expiring soon, refresh it
      try {
        const { credentials } = await oauth2Client.refreshAccessToken();
        
        // Update the token in database
        const newExpiry = credentials.expiry_date 
          ? new Date(credentials.expiry_date) 
          : new Date(Date.now() + 3600 * 1000);

        await db.query(
          'UPDATE google_calendar_tokens SET access_token = ?, token_expiry = ? WHERE user_id = ?',
          [credentials.access_token, newExpiry, userId]
        );

        oauth2Client.setCredentials(credentials);
      } catch (refreshError) {
        console.error('Failed to refresh token:', getErrorMessage(refreshError));
        // Token refresh failed, user needs to re-authenticate
        return null;
      }
    }

    return { client: oauth2Client, tokens: tokenData };
  } catch (error) {
    console.error('Error getting authenticated client:', getErrorMessage(error));
    return null;
  }
};

// ============================================================================
// Controller Functions
// ============================================================================

export const initiateGoogleAuth = async (req: Request, res: Response): Promise<void> => {
  try {
    const oauth2Client = getOAuth2Client();

    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: ['https://www.googleapis.com/auth/calendar'],
      prompt: 'consent',
      include_granted_scopes: true,
    });

    res.json({ authUrl });
  } catch (error: unknown) {
    console.error('Error initiating Google auth:', getErrorMessage(error));
    res.status(500).json({
      message: 'Failed to initiate Google Calendar authorization',
      error: getErrorMessage(error),
    });
  }
};

export const handleGoogleCallback = async (req: Request, res: Response): Promise<void> => {
  const { code } = req.query;
  const authReq = req as AuthenticatedRequest;
  const userId = authReq.user.id;

  // Type-safe code validation
  if (!code || typeof code !== 'string') {
    res.status(400).json({ message: 'Authorization code is required and must be a string' });
    return;
  }

  try {
    const config = validateEnvironment();
    const oauth2Client = getOAuth2Client();
    const { tokens } = await oauth2Client.getToken(code);

    const expiryDate = new Date(Date.now() + (tokens.expiry_date || 3600 * 1000));

    await db.query(
      `INSERT INTO google_calendar_tokens (user_id, access_token, refresh_token, token_expiry, sync_enabled) 
       VALUES (?, ?, ?, ?, TRUE) 
       ON DUPLICATE KEY UPDATE access_token = VALUES(access_token), refresh_token = VALUES(refresh_token), 
       token_expiry = VALUES(token_expiry), sync_enabled = TRUE`,
      [userId, tokens.access_token, tokens.refresh_token, expiryDate]
    );

    // Get the cryptographic nonce generated by the middleware (100% type-safe)
    const nonce = (res.locals as NonceLocals).nonce;

    // Create a safe JSON payload to avoid XSS
    const payload = JSON.stringify({ status: 'success', message: 'google-auth-success' });

    // Send secure HTML with nonce-tagged inline script
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Authenticating...</title>
      </head>
      <body>
        <script nonce="${nonce}">
          try {
            if (window.opener) {
              window.opener.postMessage(${payload}, "${config.clientUrl}");
              window.close();
            } else {
              window.location.href = "${config.clientUrl}";
            }
          } catch (err) {
            console.error('Auth callback error:', err);
            window.location.href = "${config.clientUrl}";
          }
        </script>
        <p>Authentication successful. You can close this window.</p>
      </body>
      </html>
    `);
  } catch (error: unknown) {
    console.error('Error handling Google callback:', getErrorMessage(error));
    res.status(500).json({
      message: 'Failed to complete Google Calendar authorization',
      error: getErrorMessage(error),
    });
  }
};

export const disconnectGoogleCalendar = async (req: Request, res: Response): Promise<void> => {
  const authReq = req as AuthenticatedRequest;
  const userId = authReq.user.id;

  try {
    await db.query('DELETE FROM google_calendar_tokens WHERE user_id = ?', [userId]);
    await db.query(
      'DELETE FROM synced_events WHERE local_event_id IN (SELECT id FROM events WHERE created_by = ?)',
      [userId]
    );
    res.json({ message: 'Google Calendar disconnected successfully' });
  } catch (error: unknown) {
    console.error('Error disconnecting Google Calendar:', getErrorMessage(error));
    res.status(500).json({ message: 'Failed to disconnect Google Calendar' });
  }
};

export const getSyncStatus = async (req: Request, res: Response): Promise<void> => {
  const authReq = req as AuthenticatedRequest;
  const userId = authReq.user.id;

  try {
    const [tokens] = await db.query<TokenRow[]>(
      'SELECT calendar_id, last_sync, sync_enabled FROM google_calendar_tokens WHERE user_id = ?',
      [userId]
    );

    if (tokens.length === 0) {
      res.json({ connected: false });
      return;
    }

    const [syncedEvents] = await db.query<CountRow[]>(
      'SELECT COUNT(*) as count FROM synced_events WHERE local_event_id IN (SELECT id FROM events)'
    );

    res.json({
      connected: true,
      lastSync: tokens[0].last_sync,
      syncEnabled: tokens[0].sync_enabled,
      syncedEventsCount: syncedEvents[0].count,
    });
  } catch (error: unknown) {
    console.error('Error getting sync status:', getErrorMessage(error));
    res.status(500).json({ message: 'Failed to get sync status' });
  }
};

export const importFromGoogle = async (req: Request, res: Response): Promise<void> => {
  const authReq = req as AuthenticatedRequest;
  const userId = authReq.user.id;

  try {
    const authResult = await getAuthenticatedClient(userId);

    if (!authResult) {
      res.status(400).json({ message: 'Google Calendar not connected or token expired. Please reconnect.' });
      return;
    }

    const { client: oauth2Client } = authResult;
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    const response = await calendar.events.list({
      calendarId: 'primary',
      timeMin: new Date().toISOString(),
      maxResults: 100,
      singleEvents: true,
      orderBy: 'startTime',
    });

    const googleEvents = response.data.items || [];
    let imported = 0;

    for (const gEvent of googleEvents) {
      if (!gEvent.start || !gEvent.start.dateTime) continue;

      const eventDate = new Date(gEvent.start.dateTime);
      const eventTitle = gEvent.summary || 'Untitled Event';
      const eventDescription = gEvent.description || '';

      const [existing] = await db.query<SyncedEventRow[]>(
        'SELECT local_event_id FROM synced_events WHERE google_event_id = ?',
        [gEvent.id]
      );

      if (existing.length > 0) {
        await db.query('UPDATE events SET title = ?, description = ? WHERE id = ?', [
          eventTitle,
          eventDescription,
          existing[0].local_event_id,
        ]);
      } else {
        const [result] = await db.query<ResultSetHeader>(
          'INSERT INTO events (title, date, time, description) VALUES (?, ?, ?, ?)',
          [eventTitle, eventDate.toISOString().split('T')[0], eventDate.getHours(), eventDescription]
        );
        await db.query('INSERT INTO synced_events (local_event_id, google_event_id) VALUES (?, ?)', [
          result.insertId,
          gEvent.id,
        ]);
        imported++;
      }
    }

    await db.query('UPDATE google_calendar_tokens SET last_sync = NOW() WHERE user_id = ?', [userId]);

    res.json({ message: 'Events imported successfully', imported, total: googleEvents.length });
  } catch (error: unknown) {
    console.error('Error importing from Google:', getErrorMessage(error));
    res.status(500).json({ message: 'Failed to import events from Google Calendar' });
  }
};

export const exportToGoogle = async (req: Request, res: Response): Promise<void> => {
  const authReq = req as AuthenticatedRequest;
  const userId = authReq.user.id;

  try {
    const authResult = await getAuthenticatedClient(userId);

    if (!authResult) {
      res.status(400).json({ message: 'Google Calendar not connected or token expired. Please reconnect.' });
      return;
    }

    const { client: oauth2Client } = authResult;
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    const [localEvents] = await db.query<EventRow[]>(
      `SELECT e.* FROM events e LEFT JOIN synced_events se ON e.id = se.local_event_id WHERE se.local_event_id IS NULL`
    );

    let exported = 0;

    for (const event of localEvents) {
      const eventDate = new Date(event.date);
      eventDate.setHours(event.time || 9, 0, 0, 0);

      const googleEvent = {
        summary: event.title,
        description: event.description || '',
        start: { dateTime: eventDate.toISOString(), timeZone: 'Asia/Manila' },
        end: { dateTime: new Date(eventDate.getTime() + 3600000).toISOString(), timeZone: 'Asia/Manila' },
      };

      const response = await calendar.events.insert({ calendarId: 'primary', requestBody: googleEvent });
      await db.query('INSERT INTO synced_events (local_event_id, google_event_id) VALUES (?, ?)', [
        event.id,
        response.data.id,
      ]);
      exported++;
    }

    await db.query('UPDATE google_calendar_tokens SET last_sync = NOW() WHERE user_id = ?', [userId]);

    res.json({ message: 'Events exported successfully', exported });
  } catch (error: unknown) {
    console.error('Error exporting to Google:', getErrorMessage(error));
    res.status(500).json({ message: 'Failed to export events to Google Calendar' });
  }
};

export const bidirectionalSync = async (req: Request, res: Response): Promise<void> => {
  try {
    res.json({ message: 'Bidirectional sync is handled by separate import/export endpoints' });
  } catch (error: unknown) {
    console.error('Error in bidirectional sync:', getErrorMessage(error));
    res.status(500).json({ message: 'Failed to complete bidirectional sync' });
  }
};
