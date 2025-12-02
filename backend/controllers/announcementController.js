import db from '../db/connection.js';

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
    res.status(201).json({ message: 'Announcement created successfully', announcement: newAnnouncement });
  } catch (error) {
    console.error('Error creating announcement:', error);
    res.status(500).json({ message: 'Failed to create announcement' });
  }
};
