import { Request, Response } from 'express';
import { db } from '../db/index.js';
import { announcements } from '../db/schema.js';
import { eq, desc, gte, sql } from 'drizzle-orm';
import { notifyAllUsers } from './notificationController.js';
import type { AuthenticatedRequest } from '../types/index.js';
import { CreateAnnouncementSchema, UpdateAnnouncementSchema } from '../schemas/announcementSchema.js';

export const getAnnouncements = async (_req: Request, res: Response): Promise<void> => {
  try {
    const result = await db.select()
      .from(announcements)
      .where(gte(announcements.createdAt, sql`DATE_SUB(NOW(), INTERVAL 7 DAY)`))
      .orderBy(desc(announcements.createdAt));
      
    res.status(200).json({ success: true, announcements: result });
  } catch (error) {
    console.error('Error fetching announcements:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch announcements' });
  }
};

const convertTo24Hour = (timeStr: string | null | undefined): string | null => {
  if (!timeStr || timeStr.trim() === '') return null;
  
  const [time, modifier] = timeStr.trim().split(' ');
  if (!modifier) return timeStr; // Assume already correct if no AM/PM

  let [hours, minutes] = time.split(':');
  let h = parseInt(hours, 10);

  if (modifier === 'PM' && h < 12) h += 12;
  if (modifier === 'AM' && h === 12) h = 0;

  return `${h.toString().padStart(2, '0')}:${minutes}:00`;
};

export const createAnnouncement = async (req: Request, res: Response): Promise<void> => {
  try {
    const validatedData = CreateAnnouncementSchema.parse(req.body);
    const { title, content, priority, start_date, end_date, start_time, end_time } = validatedData;

    // Handle empty strings as null for all date/time fields
    const formattedStartTime = convertTo24Hour(start_time);
    const formattedEndTime = convertTo24Hour(end_time);
    const formattedStartDate = (start_date && start_date.trim() !== '') ? start_date : null;
    const formattedEndDate = (end_date && end_date.trim() !== '') ? end_date : null;

    const [result] = await db.insert(announcements).values({
      title,
      content,
      priority: (priority || 'normal') as any,
      startDate: formattedStartDate,
      endDate: formattedEndDate,
      startTime: formattedStartTime,
      endTime: formattedEndTime
      // createdAt handled by DB default
    });

    const newAnnouncement = { 
      id: result.insertId, 
      title, 
      content, 
      priority: priority || 'normal', 
      start_date: formattedStartDate, 
      end_date: formattedEndDate, 
      start_time: formattedStartTime, 
      end_time: formattedEndTime 
    };

    // Send notifications to all users
    try {
      const authReq = req as AuthenticatedRequest;
      const adminId = authReq.user ? (authReq.user.employeeId || String(authReq.user.id)) : 'System';
      const priorityText = priority === 'urgent' ? ' URGENT: ' : priority === 'high' ? '⚠️ ' : '';

      await notifyAllUsers({
        senderId: adminId,
        title: `${priorityText}New Announcement`,
        message: `${title}: ${content.substring(0, 100)}${content.length > 100 ? '...' : ''}`,
        type: 'announcement_created',
        referenceId: result.insertId
      });
    } catch (notificationError) {
      console.error('Failed to send announcement notifications:', notificationError);
    }

    res.status(201).json({ success: true, message: 'Announcement created successfully', announcement: newAnnouncement });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      res.status(400).json({ success: false, message: 'Validation failed', errors: error.errors });
      return;
    }
    console.error('Error creating announcement:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to create announcement',
      error: error.message || 'Unknown database error'
    });
  }
};

export const updateAnnouncement = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const validatedData = UpdateAnnouncementSchema.parse(req.body);
    const { title, content, priority, start_date, end_date, start_time, end_time } = validatedData;

    const formattedStartTime = convertTo24Hour(start_time);
    const formattedEndTime = convertTo24Hour(end_time);
    const formattedStartDate = (start_date && start_date.trim() !== '') ? start_date : null;
    const formattedEndDate = (end_date && end_date.trim() !== '') ? end_date : null;

    const existing = await db.query.announcements.findFirst({
      where: eq(announcements.id, Number(id))
    });

    if (!existing) {
      res.status(404).json({ success: false, message: 'Announcement not found' });
      return;
    }

    const updates: any = {};
    if (title !== undefined) updates.title = title;
    if (content !== undefined) updates.content = content;
    if (priority !== undefined) updates.priority = priority;

    if (start_time !== undefined) {
      updates.startTime = convertTo24Hour(start_time);
    }
    if (end_time !== undefined) {
      updates.endTime = convertTo24Hour(end_time);
    }
    if (start_date !== undefined) {
      updates.startDate = (start_date && start_date.trim() !== '') ? start_date : null;
    }
    if (end_date !== undefined) {
      updates.endDate = (end_date && end_date.trim() !== '') ? end_date : null;
    }

    await db.update(announcements)
      .set(updates)
      .where(eq(announcements.id, Number(id)));

    res.status(200).json({ success: true, message: 'Announcement updated successfully' });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      res.status(400).json({ success: false, message: 'Validation failed', errors: error.errors });
      return;
    }
    console.error('Error updating announcement:', error);
    res.status(500).json({ success: false, message: 'Failed to update announcement' });
  }
};


export const deleteAnnouncement = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  try {
    const existing = await db.query.announcements.findFirst({
      where: eq(announcements.id, Number(id))
    });

    if (!existing) {
      res.status(404).json({ message: 'Announcement not found' });
      return;
    }

    await db.delete(announcements).where(eq(announcements.id, Number(id)));

    res.status(200).json({ message: 'Announcement deleted successfully' });
  } catch (error) {
    console.error('Error deleting announcement:', error);
    res.status(500).json({ message: 'Failed to delete announcement' });
  }
};
