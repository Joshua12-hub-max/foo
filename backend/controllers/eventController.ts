import { Request, Response } from 'express';
import { db } from '../db/index.js';
import { events, authentication, departments } from '../db/schema.js';
import { eq, or, and, sql, asc, gte, isNull } from 'drizzle-orm';
import { notifyAllUsers, notifyDepartment } from './notificationController.js';
import type { AuthenticatedRequest } from '../types/index.js';
import { eventSchema } from '../schemas/eventSchema.js';

const notifyDepartmentEmployees = async (params: { senderId: string; title: string; message: string; type: string; referenceId: number; departmentId: number; excludeId?: string }): Promise<void> => {
  try {
    await notifyDepartment({
      departmentId: params.departmentId,
      senderId: params.senderId,
      title: params.title,
      message: params.message,
      type: params.type,
      referenceId: params.referenceId,
      excludeId: params.excludeId
    });
  } catch (err) { console.error('Failed to notify department employees:', err); }
};

export const getEvents = async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const isAdminOrHr = ['Administrator', 'Human Resource'].includes(authReq.user.role || '');

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
  } catch (_error) {

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
  const { title, date, startDate, endDate, time, description, recurringPattern, recurringEndDate, department } = validation.data;
  
  const eventStartDate = startDate || date;
  const eventEndDate = endDate || eventStartDate;

  if (!title || !eventStartDate) { res.status(400).json({ message: 'Title and start date are required' }); return; }

  try {
    const [result] = await db.insert(events).values({
      title,
      date: eventStartDate,
      startDate: eventStartDate,
      endDate: eventEndDate,
      time: time || 9,
      description: description || null,
      recurringPattern: recurringPattern || 'none',
      recurringEndDate: recurringEndDate || null,
      department: department || null
    });

    try {
      const adminId = String(authReq.user?.employeeId || authReq.user?.id || 'System');
      const dateRange = eventStartDate === eventEndDate ? eventStartDate : `${eventStartDate} to ${eventEndDate}`;

      if (department && department !== 'All Departments') {
        const deptRecord = await db.query.departments.findFirst({
          where: eq(departments.name, department),
          columns: { id: true }
        });

        if (deptRecord) {
          await notifyDepartmentEmployees({ 
            senderId: adminId, 
            title: 'New Event', 
            message: `A new event "${title}" has been scheduled for ${department} department on ${dateRange}.`, 
            type: 'event_created', 
            referenceId: result.insertId, 
            departmentId: deptRecord.id,
            excludeId: adminId
          });
        }
      } else {
        await notifyAllUsers({ 
          senderId: adminId, 
          title: 'New Event', 
          message: `A new event "${title}" has been scheduled on ${dateRange}.`, 
          type: 'event_created', 
          referenceId: result.insertId,
          excludeId: adminId
        });
      }
    } catch (notificationError) { console.error('Failed to send event notifications:', notificationError); }

    res.status(201).json({ 
      message: 'Event created successfully', 
      event: { 
        id: result.insertId, 
        title, 
        date: eventStartDate, 
        startDate: eventStartDate, 
        endDate: eventEndDate, 
        time, 
        description, 
        recurringPattern, 
        recurringEndDate, 
        department 
      } 
    });
  } catch (error) {

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
  const { title, date, startDate, endDate, time, description, recurringPattern, recurringEndDate, department } = validation.data;
  
  const eventStartDate = startDate || date;
  const eventEndDate = endDate || eventStartDate;

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
        recurringPattern: recurringPattern || 'none',
        recurringEndDate: recurringEndDate || null,
        department: department || null
      })
      .where(eq(events.id, Number(id)));

    res.status(200).json({ 
      message: 'Event updated successfully', 
      event: { 
        id, 
        title, 
        date: eventStartDate, 
        startDate: eventStartDate, 
        endDate: eventEndDate, 
        time, 
        description, 
        recurringPattern, 
        recurringEndDate, 
        department 
      } 
    });
  } catch (_error) {

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
  } catch (_error) {

    res.status(500).json({ message: 'Failed to delete event' });
  }
};

