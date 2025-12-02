import db from '../db/connection.js';
import { google } from 'googleapis';

/**
 * Google Calendar Integration Controller
 * Handles OAuth and synchronization with Google Calendar
 */

// Initialize OAuth2 client
const getOAuth2Client = () => {
  try {
    return new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );
  } catch (error) {
    console.error('Error initializing OAuth2 client:', error);
    throw error;
  }
};

// Initialize Google Calendar sync (OAuth start)
export const initiateGoogleAuth = async (req, res) => {
  try {
    const oauth2Client = getOAuth2Client();
    
    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: ['https://www.googleapis.com/auth/calendar'],
      prompt: 'consent'
    });

    res.json({ authUrl });
  } catch (error) {
    console.error('Error initiating Google auth:', error);
    res.status(500).json({ message: 'Failed to initiate Google Calendar authorization' });
  }
};

// OAuth callback handler
export const handleGoogleCallback = async (req, res) => {
  const { code } = req.query;
  const userId = req.user.id; // From auth middleware

  if (!code) {
    return res.status(400).json({ message: 'Authorization code is required' });
  }

  try {
    const oauth2Client = getOAuth2Client();
    const { tokens } = await oauth2Client.getToken(code);
    
    // Calculate token expiry
    const expiryDate = new Date(Date.now() + (tokens.expiry_date || 3600 * 1000));

    // Store tokens in database
    await db.query(
      `INSERT INTO google_calendar_tokens 
       (user_id, access_token, refresh_token, token_expiry, sync_enabled) 
       VALUES (?, ?, ?, ?, TRUE)
       ON DUPLICATE KEY UPDATE 
       access_token = VALUES(access_token),
       refresh_token = VALUES(refresh_token),
       token_expiry = VALUES(token_expiry),
       sync_enabled = TRUE`,
      [userId, tokens.access_token, tokens.refresh_token, expiryDate]
    );

    res.redirect('/calendar?sync=success');
  } catch (error) {
    console.error('Error handling Google callback:', error);
    res.status(500).json({ message: 'Failed to complete Google Calendar authorization' });
  }
};

// Disconnect Google Calendar
export const disconnectGoogleCalendar = async (req, res) => {
  const userId = req.user.id;

  try {
    // Delete tokens
    await db.query('DELETE FROM google_calendar_tokens WHERE user_id = ?', [userId]);
    
    // Delete event mappings
    await db.query(
      'DELETE FROM synced_events WHERE local_event_id IN (SELECT id FROM events WHERE created_by = ?)',
      [userId]
    );

    res.json({ message: 'Google Calendar disconnected successfully' });
  } catch (error) {
    console.error('Error disconnecting Google Calendar:', error);
    res.status(500).json({ message: 'Failed to disconnect Google Calendar' });
  }
};

// Get sync status
export const getSyncStatus = async (req, res) => {
  const userId = req.user.id;

  try {
    const [tokens] = await db.query(
      'SELECT calendar_id, last_sync, sync_enabled FROM google_calendar_tokens WHERE user_id = ?',
      [userId]
    );

    if (tokens.length === 0) {
      return res.json({ connected: false });
    }

    const [syncedEvents] = await db.query(
      'SELECT COUNT(*) as count FROM synced_events WHERE local_event_id IN (SELECT id FROM events)'
    );

    res.json({
      connected: true,
      lastSync: tokens[0].last_sync,
      syncEnabled: tokens[0].sync_enabled,
      syncedEventsCount: syncedEvents[0].count
    });
  } catch (error) {
    console.error('Error getting sync status:', error);
    res.status(500).json({ message: 'Failed to get sync status' });
  }
};

// Import events from Google Calendar
export const importFromGoogle = async (req, res) => {
  const userId = req.user.id;

  try {
    // Get user tokens
    const [tokens] = await db.query(
      'SELECT access_token, refresh_token, token_expiry FROM google_calendar_tokens WHERE user_id = ?',
      [userId]
    );

    if (tokens.length === 0) {
      return res.status(400).json({ message: 'Google Calendar not connected' });
    }

    const oauth2Client = getOAuth2Client();
    oauth2Client.setCredentials({
      access_token: tokens[0].access_token,
      refresh_token: tokens[0].refresh_token
    });

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    // Fetch events from Google Calendar
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

      // Check if already synced
      const [existing] = await db.query(
        'SELECT local_event_id FROM synced_events WHERE google_event_id = ?',
        [gEvent.id]
      );

      if (existing.length > 0) {
        // Update existing event
        await db.query(
          'UPDATE events SET title = ?, description = ? WHERE id = ?',
          [eventTitle, eventDescription, existing[0].local_event_id]
        );
      } else {
        // Create new event
        const [result] = await db.query(
          'INSERT INTO events (title, date, time, description) VALUES (?, ?, ?, ?)',
          [
            eventTitle, 
            eventDate.toISOString().split('T')[0],
            eventDate.getHours(),
            eventDescription
          ]
        );

        // Create sync mapping
        await db.query(
          'INSERT INTO synced_events (local_event_id, google_event_id) VALUES (?, ?)',
          [result.insertId, gEvent.id]
        );
        imported++;
      }
    }

    // Update last sync time
    await db.query(
      'UPDATE google_calendar_tokens SET last_sync = NOW() WHERE user_id = ?',
      [userId]
    );

    res.json({ 
      message: 'Events imported successfully', 
      imported,
      total: googleEvents.length
    });
  } catch (error) {
    console.error('Error importing from Google:', error);
    res.status(500).json({ message: 'Failed to import events from Google Calendar' });
  }
};

// Export events to Google Calendar
export const exportToGoogle = async (req, res) => {
  const userId = req.user.id;

  try {
    // Get user tokens
    const [tokens] = await db.query(
      'SELECT access_token, refresh_token FROM google_calendar_tokens WHERE user_id = ?',
      [userId]
    );

    if (tokens.length === 0) {
      return res.status(400).json({ message: 'Google Calendar not connected' });
    }

    const oauth2Client = getOAuth2Client();
    oauth2Client.setCredentials({
      access_token: tokens[0].access_token,
      refresh_token: tokens[0].refresh_token
    });

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    // Get local events not yet synced
    const [localEvents] = await db.query(
      `SELECT e.* FROM events e 
       LEFT JOIN synced_events se ON e.id = se.local_event_id 
       WHERE se.local_event_id IS NULL`
    );

    let exported = 0;

    for (const event of localEvents) {
      const eventDate = new Date(event.date);
      const eventHour = event.time || 9;
      eventDate.setHours(eventHour, 0, 0, 0);

      const googleEvent = {
        summary: event.title,
        description: event.description || '',
        start: {
          dateTime: eventDate.toISOString(),
          timeZone: 'Asia/Manila',
        },
        end: {
          dateTime: new Date(eventDate.getTime() + 3600000).toISOString(), // +1 hour
          timeZone: 'Asia/Manila',
        },
      };

      const response = await calendar.events.insert({
        calendarId: 'primary',
        resource: googleEvent,
      });

      // Create sync mapping
      await db.query(
        'INSERT INTO synced_events (local_event_id, google_event_id) VALUES (?, ?)',
        [event.id, response.data.id]
      );
      exported++;
    }

    // Update last sync time
    await db.query(
      'UPDATE google_calendar_tokens SET last_sync = NOW() WHERE user_id = ?',
      [userId]
    );

    res.json({ 
      message: 'Events exported successfully',
      exported 
    });
  } catch (error) {
    console.error('Error exporting to Google:', error);
    res.status(500).json({ message: 'Failed to export events to Google Calendar' });
  }
};

// Bidirectional sync
export const bidirectionalSync = async (req, res) => {
  const userId = req.user.id;

  try {
    // Import from Google
    await importFromGoogle(req, res);
    
    // Then export to Google
    // Note: In production, you'd want more sophisticated conflict resolution
    await exportToGoogle(req, res);

    res.json({ message: 'Bidirectional sync completed successfully' });
  } catch (error) {
    console.error('Error in bidirectional sync:', error);
    res.status(500).json({ message: 'Failed to complete bidirectional sync' });
  }
};
