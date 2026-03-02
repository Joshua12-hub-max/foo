import { Request, Response } from 'express';
import { db } from '../db/index.js';
import { events, authentication } from '../db/schema.js';
import { eq, or, and, sql, asc, gte, isNull } from 'drizzle-orm';
import { createNotification, notifyAllUsers } from './notificationController.js';
import type { AuthenticatedRequest } from '../types/index.js';
import { eventSchema } from '../schemas/eventSchema.js';

const notifyDepartmentEmployees = async (params: { senderId: string; title: string; message: string; type: string; referenceId: number; department: string }): Promise<void> => {
  try {
    const employees = await db.select({ employeeId: authentication.employeeId })
      .from(authentication)
      .where(eq(authentication.department, params.department));

    for (const employee of employees) {
      await createNotification({ 
        recipientId: employee.employeeId, 
        senderId: params.senderId, 
        title: params.title, 
        message: params.message, 
        type: params.type, 
        referenceId: params.referenceId 
      });
    }
  } catch (err) { console.error('Failed to notify department employees:', err); }
};

export const getEvents = async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const isAdminOrHr = ['admin', 'hr'].includes(authReq.user.role?.toLowerCase() || '');

    const baseCondition = or(
      gte(events.endDate, sql`CURDATE()`),
      isNull(events.endDate)
    );

    const conditions = [baseCondition];

    if (!isAdminOrHr) {
      const userRecord = await db.query.authentication.findFirst({
        where: eq(authentication.id, authReq.user.id),
        columns: { department: true }
      });
      
      const userDept = userRecord?.department;
      
      const deptCondition = or(
        isNull(events.department),
        eq(events.department, 'All Departments'),
        userDept ? eq(events.department, userDept) : undefined
      );
      
      if (deptCondition) conditions.push(deptCondition);
    }

    const result = await db.select()
      .from(events)
      .where(and(...conditions))
      .orderBy(asc(events.date));

    res.status(200).json({ events: result });
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({ message: 'Failed to fetch events' });
  }
};

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

  if (!title || !eventStartDate) { res.status(400).json({ message: 'Title and start date are required' }); return; }

  try {
    const [result] = await db.insert(events).values({
      title,
      date: eventStartDate,
      startDate: eventStartDate,
      endDate: eventEndDate,
      time: time || 9,
      description: description || null,
      recurringPattern: recurring_pattern || 'none',
      recurringEndDate: recurring_end_date || null,
      department: department || null
    });

    try {
      const adminId = String(authReq.user?.employeeId || authReq.user?.id || 'System');
      const dateRange = eventStartDate === eventEndDate ? eventStartDate : `${eventStartDate} to ${eventEndDate}`;

      if (department) {
        await notifyDepartmentEmployees({ 
          senderId: adminId, 
          title: 'New Event', 
          message: `A new event "${title}" has been scheduled for ${department} department on ${dateRange}.`, 
          type: 'event_created', 
          referenceId: result.insertId, 
          department 
        });
      } else {
        await notifyAllUsers({ 
          senderId: adminId, 
          title: 'New Event', 
          message: `A new event "${title}" has been scheduled on ${dateRange}.`, 
          type: 'event_created', 
          referenceId: result.insertId 
        });
      }
    } catch (notificationError) { console.error('Failed to send event notifications:', notificationError); }

    res.status(201).json({ 
      message: 'Event created successfully', 
      event: { 
        id: result.insertId, 
        title, 
        date: eventStartDate, 
        start_date: eventStartDate, 
        end_date: eventEndDate, 
        time, 
        description, 
        recurring_pattern, 
        recurring_end_date, 
        department 
      } 
    });
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
    const existing = await db.query.events.findFirst({
      where: eq(events.id, Number(id))
    });
    
    if (!existing) { res.status(404).json({ message: 'Event not found' }); return; }

    await db.update(events)
      .set({
        title,
        date: eventStartDate,
        startDate: eventStartDate,
        endDate: eventEndDate,
        time: time || 9,
        description: description || null,
        recurringPattern: recurring_pattern || 'none',
        recurringEndDate: recurring_end_date || null,
        department: department || null
      })
      .where(eq(events.id, Number(id)));

    res.status(200).json({ 
      message: 'Event updated successfully', 
      event: { 
        id, 
        title, 
        date: eventStartDate, 
        start_date: eventStartDate, 
        end_date: eventEndDate, 
        time, 
        description, 
        recurring_pattern, 
        recurring_end_date, 
        department 
      } 
    });
  } catch (error) {
    console.error('Error updating event:', error);
    res.status(500).json({ message: 'Failed to update event' });
  }
};

export const deleteEvent = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  try {
    const existing = await db.query.events.findFirst({
      where: eq(events.id, Number(id))
    });
    
    if (!existing) { res.status(404).json({ message: 'Event not found' }); return; }
    
    await db.delete(events).where(eq(events.id, Number(id)));
    
    res.status(200).json({ message: 'Event deleted successfully' });
  } catch (error) {
    console.error('Error deleting event:', error);
    res.status(500).json({ message: 'Failed to delete event' });
  }
};