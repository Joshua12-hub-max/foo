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

export const createAnnouncement = async (req: Request, res: Response): Promise<void> => {
  const { title, content, priority, start_date, end_date, start_time, end_time }: CreateAnnouncementRequest = req.body;

  if (!title || !content) {
    res.status(400).json({ message: 'Title and content are required' });
    return;
  }

  try {
    const [result] = await db.query<ResultSetHeader>(
      'INSERT INTO announcements (title, content, priority, start_date, end_date, start_time, end_time) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [title, content, priority || 'normal', start_date || null, end_date || null, start_time || null, end_time || null]
    );

    const newAnnouncement = { id: result.insertId, title, content, priority, start_date, end_date, start_time, end_time };

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
  } catch (error) {
    console.error('Error creating announcement:', error);
    res.status(500).json({ message: 'Failed to create announcement' });
  }
};

export const updateAnnouncement = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { title, content, priority, start_date, end_date, start_time, end_time }: CreateAnnouncementRequest = req.body;

  if (!title || !content) {
    res.status(400).json({ message: 'Title and content are required' });
    return;
  }

  try {
    const [result] = await db.query<ResultSetHeader>(
      'UPDATE announcements SET title = ?, content = ?, priority = ?, start_date = ?, end_date = ?, start_time = ?, end_time = ? WHERE id = ?',
      [title, content, priority || 'normal', start_date || null, end_date || null, start_time || null, end_time || null, id]
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
