import { Request, Response } from 'express';
import db from '../db/connection.js';
import { notifyAllUsers } from './notificationController.js';
import type { RowDataPacket, ResultSetHeader } from 'mysql2/promise';
import type { AuthenticatedRequest } from '../types/index.js';


interface AnnouncementRow extends RowDataPacket {
  id: number;
  title: string;
  content: string;
  priority: 'normal' | 'high' | 'urgent';
  start_date?: Date;
  end_date?: Date;
  start_time?: string;
  end_time?: string;
  created_at: Date;
}

interface CreateAnnouncementRequest {
  title: string;
  content: string;
  priority?: 'normal' | 'high' | 'urgent';
  start_date?: string;
  end_date?: string;
  start_time?: string;
  end_time?: string;
}

export const getAnnouncements = async (req: Request, res: Response): Promise<void> => {
  try {
    const [announcements] = await db.query<AnnouncementRow[]>(
      'SELECT * FROM announcements WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) ORDER BY created_at DESC'
    );
    res.status(200).json({ announcements });
  } catch (error) {
    console.error('Error fetching announcements:', error);
    res.status(500).json({ message: 'Failed to fetch announcements' });
  }
};

const convertTo24Hour = (timeStr: string | undefined): string | null => {
  if (!timeStr) return null;
  
  const [time, modifier] = timeStr.trim().split(' ');
  if (!modifier) return timeStr; // Assume already correct if no AM/PM

  let [hours, minutes] = time.split(':');
  let h = parseInt(hours, 10);

  if (modifier === 'PM' && h < 12) h += 12;
  if (modifier === 'AM' && h === 12) h = 0;

  return `${h.toString().padStart(2, '0')}:${minutes}:00`;
};

export const createAnnouncement = async (req: Request, res: Response): Promise<void> => {
  console.log('DEBUG [createAnnouncement] body:', req.body);
  const { title, content, priority, start_date, end_date, start_time, end_time }: CreateAnnouncementRequest = req.body;

  if (!title || !content) {
    res.status(400).json({ message: 'Title and content are required' });
    return;
  }

  // Handle empty strings as null for all date/time fields
  const formattedStartTime = (start_time && start_time.trim() !== '') ? convertTo24Hour(start_time) : null;
  const formattedEndTime = (end_time && end_time.trim() !== '') ? convertTo24Hour(end_time) : null;
  const formattedStartDate = (start_date && start_date.trim() !== '') ? start_date : null;
  const formattedEndDate = (end_date && end_date.trim() !== '') ? end_date : null;

  console.log('DEBUG [createAnnouncement] formatted:', { formattedStartDate, formattedEndDate, formattedStartTime, formattedEndTime });

  try {
    const [result] = await db.query<ResultSetHeader>(
      'INSERT INTO announcements (title, content, priority, start_date, end_date, start_time, end_time) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [title, content, priority || 'normal', formattedStartDate, formattedEndDate, formattedStartTime, formattedEndTime]
    );

    const newAnnouncement = { 
      id: result.insertId, 
      title, 
      content, 
      priority, 
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

      console.log('Sending announcement notifications to all users...');
      await notifyAllUsers({
        senderId: adminId,
        title: `${priorityText}New Announcement`,
        message: `${title}: ${content.substring(0, 100)}${content.length > 100 ? '...' : ''}`,
        type: 'announcement_created',
        referenceId: result.insertId
      });
      console.log('Announcement notifications sent successfully');
    } catch (notificationError) {
      console.error('Failed to send announcement notifications:', notificationError);
    }

    res.status(201).json({ message: 'Announcement created successfully', announcement: newAnnouncement });
  } catch (error: any) {
    console.error('Error creating announcement:', error);
    if (error.stack) console.error(error.stack);
    res.status(500).json({ 
      success: false,
      message: 'Failed to create announcement',
      error: error.message || 'Unknown database error'
    });
  }
};

export const updateAnnouncement = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { title, content, priority, start_date, end_date, start_time, end_time }: CreateAnnouncementRequest = req.body;

  if (!title || !content) {
    res.status(400).json({ message: 'Title and content are required' });
    return;
  }

  const formattedStartTime = !start_time ? null : convertTo24Hour(start_time);
  const formattedEndTime = !end_time ? null : convertTo24Hour(end_time);
  const formattedStartDate = !start_date ? null : start_date;
  const formattedEndDate = !end_date ? null : end_date;

  try {
    const [result] = await db.query<ResultSetHeader>(
      'UPDATE announcements SET title = ?, content = ?, priority = ?, start_date = ?, end_date = ?, start_time = ?, end_time = ? WHERE id = ?',
      [title, content, priority || 'normal', formattedStartDate, formattedEndDate, formattedStartTime, formattedEndTime, id]
    );

    if (result.affectedRows === 0) {
      res.status(404).json({ message: 'Announcement not found' });
      return;
    }

    res.status(200).json({ message: 'Announcement updated successfully' });
  } catch (error) {
    console.error('Error updating announcement:', error);
    res.status(500).json({ message: 'Failed to update announcement' });
  }
};

export const deleteAnnouncement = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  try {
    const [result] = await db.query<ResultSetHeader>('DELETE FROM announcements WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      res.status(404).json({ message: 'Announcement not found' });
      return;
    }

    res.status(200).json({ message: 'Announcement deleted successfully' });
  } catch (error) {
    console.error('Error deleting announcement:', error);
    res.status(500).json({ message: 'Failed to delete announcement' });
  }
};
