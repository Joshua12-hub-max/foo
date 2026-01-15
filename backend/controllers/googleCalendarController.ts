import { Request, Response } from 'express';
import db from '../db/connection.js';
import { google } from 'googleapis';
import type { RowDataPacket, ResultSetHeader } from 'mysql2/promise';
import type { AuthenticatedRequest } from '../types/index.js';

interface TokenRow extends RowDataPacket { access_token: string; refresh_token: string; token_expiry: Date; calendar_id?: string; last_sync?: Date; sync_enabled: boolean; }
interface EventRow extends RowDataPacket { id: number; title: string; date: string; time?: number; description?: string; }
interface SyncedEventRow extends RowDataPacket { local_event_id: number; google_event_id: string; }
interface CountRow extends RowDataPacket { count: number; }

const getOAuth2Client = () => {
  return new google.auth.OAuth2(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET, process.env.GOOGLE_REDIRECT_URI);
};

export const initiateGoogleAuth = async (req: Request, res: Response): Promise<void> => {
  try {
    const oauth2Client = getOAuth2Client();
    const authUrl = oauth2Client.generateAuthUrl({ access_type: 'offline', scope: ['https://www.googleapis.com/auth/calendar'], prompt: 'consent' });
    res.json({ authUrl });
  } catch (error) { console.error('Error initiating Google auth:', error); res.status(500).json({ message: 'Failed to initiate Google Calendar authorization' }); }
};

export const handleGoogleCallback = async (req: Request, res: Response): Promise<void> => {
  const { code } = req.query; const authReq = req as AuthenticatedRequest; const userId = authReq.user.id;
  if (!code) { res.status(400).json({ message: 'Authorization code is required' }); return; }
  try {
    const oauth2Client = getOAuth2Client();
    const { tokens } = await oauth2Client.getToken(code as string);
    const expiryDate = new Date(Date.now() + (tokens.expiry_date || 3600 * 1000));
    await db.query(`INSERT INTO google_calendar_tokens (user_id, access_token, refresh_token, token_expiry, sync_enabled) VALUES (?, ?, ?, ?, TRUE) ON DUPLICATE KEY UPDATE access_token = VALUES(access_token), refresh_token = VALUES(refresh_token), token_expiry = VALUES(token_expiry), sync_enabled = TRUE`, [userId, tokens.access_token, tokens.refresh_token, expiryDate]);
    res.redirect('/calendar?sync=success');
  } catch (error) { console.error('Error handling Google callback:', error); res.status(500).json({ message: 'Failed to complete Google Calendar authorization' }); }
};

export const disconnectGoogleCalendar = async (req: Request, res: Response): Promise<void> => {
  const authReq = req as AuthenticatedRequest; const userId = authReq.user.id;
  try {
    await db.query('DELETE FROM google_calendar_tokens WHERE user_id = ?', [userId]);
    await db.query('DELETE FROM synced_events WHERE local_event_id IN (SELECT id FROM events WHERE created_by = ?)', [userId]);
    res.json({ message: 'Google Calendar disconnected successfully' });
  } catch (error) { console.error('Error disconnecting Google Calendar:', error); res.status(500).json({ message: 'Failed to disconnect Google Calendar' }); }
};

export const getSyncStatus = async (req: Request, res: Response): Promise<void> => {
  const authReq = req as AuthenticatedRequest; const userId = authReq.user.id;
  try {
    const [tokens] = await db.query<TokenRow[]>('SELECT calendar_id, last_sync, sync_enabled FROM google_calendar_tokens WHERE user_id = ?', [userId]);
    if (tokens.length === 0) { res.json({ connected: false }); return; }
    const [syncedEvents] = await db.query<CountRow[]>('SELECT COUNT(*) as count FROM synced_events WHERE local_event_id IN (SELECT id FROM events)');
    res.json({ connected: true, lastSync: tokens[0].last_sync, syncEnabled: tokens[0].sync_enabled, syncedEventsCount: syncedEvents[0].count });
  } catch (error) { console.error('Error getting sync status:', error); res.status(500).json({ message: 'Failed to get sync status' }); }
};

export const importFromGoogle = async (req: Request, res: Response): Promise<void> => {
  const authReq = req as AuthenticatedRequest; const userId = authReq.user.id;
  try {
    const [tokens] = await db.query<TokenRow[]>('SELECT access_token, refresh_token, token_expiry FROM google_calendar_tokens WHERE user_id = ?', [userId]);
    if (tokens.length === 0) { res.status(400).json({ message: 'Google Calendar not connected' }); return; }
    const oauth2Client = getOAuth2Client();
    oauth2Client.setCredentials({ access_token: tokens[0].access_token, refresh_token: tokens[0].refresh_token });
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
    const response = await calendar.events.list({ calendarId: 'primary', timeMin: new Date().toISOString(), maxResults: 100, singleEvents: true, orderBy: 'startTime' });
    const googleEvents = response.data.items || []; let imported = 0;
    for (const gEvent of googleEvents) {
      if (!gEvent.start || !gEvent.start.dateTime) continue;
      const eventDate = new Date(gEvent.start.dateTime); const eventTitle = gEvent.summary || 'Untitled Event'; const eventDescription = gEvent.description || '';
      const [existing] = await db.query<SyncedEventRow[]>('SELECT local_event_id FROM synced_events WHERE google_event_id = ?', [gEvent.id]);
      if (existing.length > 0) { await db.query('UPDATE events SET title = ?, description = ? WHERE id = ?', [eventTitle, eventDescription, existing[0].local_event_id]); }
      else { const [result] = await db.query<ResultSetHeader>('INSERT INTO events (title, date, time, description) VALUES (?, ?, ?, ?)', [eventTitle, eventDate.toISOString().split('T')[0], eventDate.getHours(), eventDescription]); await db.query('INSERT INTO synced_events (local_event_id, google_event_id) VALUES (?, ?)', [result.insertId, gEvent.id]); imported++; }
    }
    await db.query('UPDATE google_calendar_tokens SET last_sync = NOW() WHERE user_id = ?', [userId]);
    res.json({ message: 'Events imported successfully', imported, total: googleEvents.length });
  } catch (error) { console.error('Error importing from Google:', error); res.status(500).json({ message: 'Failed to import events from Google Calendar' }); }
};

export const exportToGoogle = async (req: Request, res: Response): Promise<void> => {
  const authReq = req as AuthenticatedRequest; const userId = authReq.user.id;
  try {
    const [tokens] = await db.query<TokenRow[]>('SELECT access_token, refresh_token FROM google_calendar_tokens WHERE user_id = ?', [userId]);
    if (tokens.length === 0) { res.status(400).json({ message: 'Google Calendar not connected' }); return; }
    const oauth2Client = getOAuth2Client();
    oauth2Client.setCredentials({ access_token: tokens[0].access_token, refresh_token: tokens[0].refresh_token });
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
    const [localEvents] = await db.query<EventRow[]>(`SELECT e.* FROM events e LEFT JOIN synced_events se ON e.id = se.local_event_id WHERE se.local_event_id IS NULL`);
    let exported = 0;
    for (const event of localEvents) {
      const eventDate = new Date(event.date); eventDate.setHours(event.time || 9, 0, 0, 0);
      const googleEvent = { summary: event.title, description: event.description || '', start: { dateTime: eventDate.toISOString(), timeZone: 'Asia/Manila' }, end: { dateTime: new Date(eventDate.getTime() + 3600000).toISOString(), timeZone: 'Asia/Manila' } };
      const response = await calendar.events.insert({ calendarId: 'primary', requestBody: googleEvent });
      await db.query('INSERT INTO synced_events (local_event_id, google_event_id) VALUES (?, ?)', [event.id, response.data.id]); exported++;
    }
    await db.query('UPDATE google_calendar_tokens SET last_sync = NOW() WHERE user_id = ?', [userId]);
    res.json({ message: 'Events exported successfully', exported });
  } catch (error) { console.error('Error exporting to Google:', error); res.status(500).json({ message: 'Failed to export events to Google Calendar' }); }
};

export const bidirectionalSync = async (req: Request, res: Response): Promise<void> => {
  try { res.json({ message: 'Bidirectional sync is handled by separate import/export endpoints' }); }
  catch (error) { console.error('Error in bidirectional sync:', error); res.status(500).json({ message: 'Failed to complete bidirectional sync' }); }
};
