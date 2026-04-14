import { Request, Response } from 'express';
import { db } from '../db/index.js';
import { announcements } from '../db/schema.js';
import { eq, desc, gte, sql, InferInsertModel } from 'drizzle-orm';
import { notifyAllUsers } from './notificationController.js';
import type { AuthenticatedRequest } from '../types/index.js';
import { CreateAnnouncementSchema, UpdateAnnouncementSchema } from '../schemas/announcementSchema.js';
import { ZodError } from 'zod';

export const getAnnouncements = async (_req: Request, res: Response): Promise<void> => {
  try {
    const result = await db.select()
      .from(announcements)
      .orderBy(desc(announcements.createdAt));
      
    res.status(200).json({ success: true, announcements: result });
  } catch (_error) {

    res.status(500).json({ success: false, message: 'Failed to fetch announcements' });
  }
};

const convertTo24Hour = (timeStr: string | null | undefined): string | null => {
  if (!timeStr || timeStr.trim() === '') return null;
  
  const [time, modifier] = timeStr.trim().split(' ');
  if (!modifier) return timeStr; // Assume already correct if no AM/PM

  const [hours, minutes] = time.split(':');
  let h = parseInt(hours, 10);


  if (modifier === 'PM' && h < 12) h += 12;
  if (modifier === 'AM' && h === 12) h = 0;

  return `${h.toString().padStart(2, '0')}:${minutes}:00`;
};

export const createAnnouncement = async (req: Request, res: Response): Promise<void> => {
  try {
    const validatedData = CreateAnnouncementSchema.parse(req.body);
    const { title, content, priority, startDate, endDate, startTime, endTime } = validatedData;

    // Handle empty strings as null for all date/time fields
    const formattedStartTime = convertTo24Hour(startTime);
    const formattedEndTime = convertTo24Hour(endTime);
    const formattedStartDate = (startDate && startDate.trim() !== '') ? startDate : null;
    const formattedEndDate = (endDate && endDate.trim() !== '') ? endDate : null;

    const [result] = await db.insert(announcements).values({
      title,
      content,
      priority: priority as 'normal' | 'high' | 'urgent' | null,
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
      startDate: formattedStartDate, 
      endDate: formattedEndDate, 
      startTime: formattedStartTime, 
      endTime: formattedEndTime 
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
    } catch (_notificationError) {
      /* empty */
    }

    res.status(201).json({ success: true, message: 'Announcement created successfully', announcement: newAnnouncement });
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({ success: false, message: 'Validation failed', errors: error.issues });
      return;
    }

    const message = error instanceof Error ? error.message : 'Unknown database error';
    res.status(500).json({ 
      success: false,
      message: 'Failed to create announcement',
      error: message
    });
  }
};

export const updateAnnouncement = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const validatedData = UpdateAnnouncementSchema.parse(req.body);
    const { title, content, priority, startDate, endDate, startTime, endTime } = validatedData;

    const existing = await db.query.announcements.findFirst({
      where: eq(announcements.id, Number(id))
    });

    if (!existing) {
      res.status(404).json({ success: false, message: 'Announcement not found' });
      return;
    }

    const updates: Partial<InferInsertModel<typeof announcements>> = {};
    if (title !== undefined) updates.title = title;
    if (content !== undefined) updates.content = content;
    if (priority !== undefined) updates.priority = priority as 'normal' | 'high' | 'urgent';

    if (startTime !== undefined) {
      updates.startTime = convertTo24Hour(startTime);
    }
    if (endTime !== undefined) {
      updates.endTime = convertTo24Hour(endTime);
    }
    if (startDate !== undefined) {
      updates.startDate = (startDate && startDate.trim() !== '') ? startDate : null;
    }
    if (endDate !== undefined) {
      updates.endDate = (endDate && endDate.trim() !== '') ? endDate : null;
    }

    await db.update(announcements)
      .set(updates)
      .where(eq(announcements.id, Number(id)));

    res.status(200).json({ success: true, message: 'Announcement updated successfully' });
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({ success: false, message: 'Validation failed', errors: error.issues });
      return;
    }

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
      res.status(404).json({ success: false, message: 'Announcement not found' });
      return;
    }

    await db.delete(announcements).where(eq(announcements.id, Number(id)));

    res.status(200).json({ success: true, message: 'Announcement deleted successfully' });
  } catch (_error) {

    res.status(500).json({ success: false, message: 'Failed to delete announcement' });
  }
};
