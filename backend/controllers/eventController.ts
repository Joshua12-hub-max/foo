import { Request, Response } from 'express';
import db from '../db/connection.js';
import { createNotification, notifyAllUsers } from './notificationController.js';
import type { RowDataPacket, ResultSetHeader } from 'mysql2/promise';
import type { AuthenticatedRequest } from '../types/index.js';

interface EventRow extends RowDataPacket {
  id: number;
  title: string;
  date: string;
  start_date: string;
  end_date: string;
  time?: number;
  description?: string;
  recurring_pattern?: string;
  department?: string;
}

interface EmployeeRow extends RowDataPacket {
  employee_id: string;
  department?: string;
}

const notifyDepartmentEmployees = async (params: { senderId: string; title: string; message: string; type: string; referenceId: number; department: string }): Promise<void> => {
  try {
    const [employees] = await db.query<EmployeeRow[]>('SELECT employee_id FROM authentication WHERE department = ?', [params.department]);
    for (const employee of employees) {
      await createNotification({ recipientId: employee.employee_id, senderId: params.senderId, title: params.title, message: params.message, type: params.type, referenceId: params.referenceId });
    }
  } catch (err) { console.error('Failed to notify department employees:', err); }
};

export const getEvents = async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const isAdminOrHr = ['admin', 'hr'].includes(authReq.user.role?.toLowerCase() || '');

    let query = 'SELECT * FROM events WHERE (end_date >= CURDATE() OR end_date IS NULL)';
    const params: string[] = [];

    if (!isAdminOrHr) {
      const [userRecords] = await db.query<EmployeeRow[]>('SELECT department FROM authentication WHERE id = ?', [authReq.user.id]);
      const userDept = userRecords[0]?.department;
      query += ' AND (department IS NULL OR department = "All Departments"';
      if (userDept) { query += ' OR department = ?'; params.push(userDept); }
      query += ')';
    }
    query += ' ORDER BY date ASC';

    const [events] = await db.query<EventRow[]>(query, params);
    res.status(200).json({ events });
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({ message: 'Failed to fetch events' });
  }
};

// ... imports
import { eventSchema } from '../schemas/eventSchema.js';

// ... existing code ...

export const createEvent = async (req: Request, res: Response): Promise<void> => {
  const authReq = req as AuthenticatedRequest;
  
  // Zod Validation
  const validation = eventSchema.safeParse(req.body);
  if (!validation.success) {
      res.status(400).json({ message: 'Validation Error', errors: validation.error.format() });
      return;
  }
  const { title, date, start_date, end_date, time, description, recurring_pattern, recurring_end_date, department } = validation.data;
  
  const eventStartDate = start_date || date;
  const eventEndDate = end_date || eventStartDate;

  // ... rest of logic ...
  if (!title || !eventStartDate) { res.status(400).json({ message: 'Title and start date are required' }); return; }

  try {
    const [result] = await db.query<ResultSetHeader>(
      'INSERT INTO events (title, date, start_date, end_date, time, description, recurring_pattern, recurring_end_date, department) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [title, eventStartDate, eventStartDate, eventEndDate, time || 9, description || null, recurring_pattern || 'none', recurring_end_date || null, department || null]
    );

    // ... notifications ...
    try {
      const adminId = String(authReq.user?.employeeId || authReq.user?.id || 'System');
      const dateRange = eventStartDate === eventEndDate ? eventStartDate : `${eventStartDate} to ${eventEndDate}`;

      if (department) {
        await notifyDepartmentEmployees({ senderId: adminId, title: 'New Event', message: `A new event "${title}" has been scheduled for ${department} department on ${dateRange}.`, type: 'event_created', referenceId: result.insertId, department });
      } else {
        await notifyAllUsers({ senderId: adminId, title: 'New Event', message: `A new event "${title}" has been scheduled on ${dateRange}.`, type: 'event_created', referenceId: result.insertId });
      }
    } catch (notificationError) { console.error('Failed to send event notifications:', notificationError); }

    res.status(201).json({ message: 'Event created successfully', event: { id: result.insertId, title, date: eventStartDate, start_date: eventStartDate, end_date: eventEndDate, time, description, recurring_pattern, recurring_end_date, department } });
  } catch (error) {
    console.error('Error creating event:', error);
    res.status(500).json({ message: 'Failed to create event', error: (error as Error).message });
  }
};

export const updateEvent = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  
  // Zod Validation
  const validation = eventSchema.safeParse(req.body);
  if (!validation.success) {
      res.status(400).json({ message: 'Validation Error', errors: validation.error.format() });
      return;
  }
  const { title, date, start_date, end_date, time, description, recurring_pattern, recurring_end_date, department } = validation.data;
  
  const eventStartDate = start_date || date;
  const eventEndDate = end_date || eventStartDate;

  if (!title || !eventStartDate) { res.status(400).json({ message: 'Title and start date are required' }); return; }

  try {
    const [existing] = await db.query<EventRow[]>('SELECT * FROM events WHERE id = ?', [id]);
    if (existing.length === 0) { res.status(404).json({ message: 'Event not found' }); return; }

    await db.query(
      'UPDATE events SET title = ?, date = ?, start_date = ?, end_date = ?, time = ?, description = ?, recurring_pattern = ?, recurring_end_date = ?, department = ? WHERE id = ?',
      [title, eventStartDate, eventStartDate, eventEndDate, time || 9, description || null, recurring_pattern || 'none', recurring_end_date || null, department || null, id]
    );
    res.status(200).json({ message: 'Event updated successfully', event: { id, title, date: eventStartDate, start_date: eventStartDate, end_date: eventEndDate, time, description, recurring_pattern, recurring_end_date, department } });
  } catch (error) {
    console.error('Error updating event:', error);
    res.status(500).json({ message: 'Failed to update event' });
  }
};

export const deleteEvent = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  try {
    const [existing] = await db.query<EventRow[]>('SELECT * FROM events WHERE id = ?', [id]);
    if (existing.length === 0) { res.status(404).json({ message: 'Event not found' }); return; }
    await db.query('DELETE FROM events WHERE id = ?', [id]);
    res.status(200).json({ message: 'Event deleted successfully' });
  } catch (error) {
    console.error('Error deleting event:', error);
    res.status(500).json({ message: 'Failed to delete event' });
  }
};
