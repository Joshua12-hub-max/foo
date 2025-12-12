import db from '../db/connection.js';
import { notifyAllUsers } from './notificationController.js';

export const getAnnouncements = async (req, res) => {
  try {
    const [announcements] = await db.query('SELECT * FROM announcements ORDER BY created_at DESC');
    res.status(200).json({ announcements });
  } catch (error) {
    console.error('Error fetching announcements:', error);
    res.status(500).json({ message: 'Failed to fetch announcements' });
  }
};

export const createAnnouncement = async (req, res) => {
  const { title, content, priority, start_date, end_date, start_time, end_time } = req.body;

  if (!title || !content) {
    return res.status(400).json({ message: 'Title and content are required' });
  }

  try {
    const [result] = await db.query(
      'INSERT INTO announcements (title, content, priority, start_date, end_date, start_time, end_time) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [title, content, priority || 'normal', start_date || null, end_date || null, start_time || null, end_time || null]
    );
    
    const newAnnouncement = { id: result.insertId, title, content, priority, start_date, end_date, start_time, end_time };

    // Send notifications to ALL users (employees + admins)
    try {
      const adminId = req.user ? (req.user.employeeId || req.user.employee_id || req.user.id) : 'System';
      const priorityText = priority === 'urgent' ? '🚨 URGENT: ' : priority === 'high' ? '⚠️ ' : '';
      
      console.log('📢 Sending announcement notifications to all users...');
      await notifyAllUsers({
        senderId: adminId,
        title: `${priorityText}New Announcement`,
        message: `${title}: ${content.substring(0, 100)}${content.length > 100 ? '...' : ''}`,
        type: "announcement_created",
        referenceId: result.insertId
      });
      console.log('📢 Announcement notifications sent successfully');
    } catch (notificationError) {
      console.error('Failed to send announcement notifications:', notificationError);
    }

    res.status(201).json({ message: 'Announcement created successfully', announcement: newAnnouncement });
  } catch (error) {
    console.error('Error creating announcement:', error);
    res.status(500).json({ message: 'Failed to create announcement' });
  }
};

export const updateAnnouncement = async (req, res) => {
  const { id } = req.params;
  const { title, content, priority, start_date, end_date, start_time, end_time } = req.body;

  if (!title || !content) {
    return res.status(400).json({ message: 'Title and content are required' });
  }

  try {
    const [result] = await db.query(
      'UPDATE announcements SET title = ?, content = ?, priority = ?, start_date = ?, end_date = ?, start_time = ?, end_time = ? WHERE id = ?',
      [title, content, priority || 'normal', start_date || null, end_date || null, start_time || null, end_time || null, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Announcement not found' });
    }

    res.status(200).json({ message: 'Announcement updated successfully' });
  } catch (error) {
    console.error('Error updating announcement:', error);
    res.status(500).json({ message: 'Failed to update announcement' });
  }
};

export const deleteAnnouncement = async (req, res) => {
  const { id } = req.params;

  try {
    const [result] = await db.query('DELETE FROM announcements WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Announcement not found' });
    }

    res.status(200).json({ message: 'Announcement deleted successfully' });
  } catch (error) {
    console.error('Error deleting announcement:', error);
    res.status(500).json({ message: 'Failed to delete announcement' });
  }
};

