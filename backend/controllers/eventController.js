import db from '../db/connection.js';

export const getEvents = async (req, res) => {
  try {
    const [events] = await db.query('SELECT * FROM events ORDER BY date ASC');
    res.status(200).json({ events });
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({ message: 'Failed to fetch events' });
  }
};

export const createEvent = async (req, res) => {
  const { title, date, time, description, recurring_pattern, recurring_end_date } = req.body;

  if (!title || !date) {
    return res.status(400).json({ message: 'Title and date are required' });
  }

  try {
    const [result] = await db.query(
      'INSERT INTO events (title, date, time, description, recurring_pattern, recurring_end_date) VALUES (?, ?, ?, ?, ?, ?)',
      [title, date, time || 9, description || null, recurring_pattern || 'none', recurring_end_date || null]
    );
    
    const newEvent = { 
      id: result.insertId, 
      title, 
      date, 
      time, 
      description, 
      recurring_pattern, 
      recurring_end_date 
    };
    res.status(201).json({ message: 'Event created successfully', event: newEvent });
  } catch (error) {
    console.error('Error creating event:', error);
    res.status(500).json({ message: 'Failed to create event' });
  }
};

export const updateEvent = async (req, res) => {
  const { id } = req.params;
  const { title, date, time, description, recurring_pattern, recurring_end_date } = req.body;

  if (!title || !date) {
    return res.status(400).json({ message: 'Title and date are required' });
  }

  try {
    // Check if event exists
    const [existing] = await db.query('SELECT * FROM events WHERE id = ?', [id]);
    
    if (existing.length === 0) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Update the event
    await db.query(
      'UPDATE events SET title = ?, date = ?, time = ?, description = ?, recurring_pattern = ?, recurring_end_date = ? WHERE id = ?',
      [title, date, time || 9, description || null, recurring_pattern || 'none', recurring_end_date || null, id]
    );

    const updatedEvent = { 
      id, 
      title, 
      date, 
      time, 
      description, 
      recurring_pattern, 
      recurring_end_date 
    };
    
    res.status(200).json({ message: 'Event updated successfully', event: updatedEvent });
  } catch (error) {
    console.error('Error updating event:', error);
    res.status(500).json({ message: 'Failed to update event' });
  }
};

export const deleteEvent = async (req, res) => {
  const { id } = req.params;

  try {
    // Check if event exists
    const [existing] = await db.query('SELECT * FROM events WHERE id = ?', [id]);
    
    if (existing.length === 0) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Delete the event
    await db.query('DELETE FROM events WHERE id = ?', [id]);
    
    res.status(200).json({ message: 'Event deleted successfully' });
  } catch (error) {
    console.error('Error deleting event:', error);
    res.status(500).json({ message: 'Failed to delete event' });
  }
};
