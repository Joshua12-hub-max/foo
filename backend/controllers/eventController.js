import db from '../db/connection.js';
import { createNotification, notifyAllUsers } from './notificationController.js';

// Helper function to notify employees in a specific department
const notifyDepartmentEmployees = async ({ senderId, title, message, type, referenceId, department }) => {
  try {
    const [employees] = await db.query(
      "SELECT employee_id FROM authentication WHERE department = ?",
      [department]
    );
    console.log(`🔔 Notifying ${employees.length} employees in ${department} department`);
    
    for (const employee of employees) {
      await createNotification({
        recipientId: employee.employee_id,
        senderId,
        title,
        message,
        type,
        referenceId
      });
    }
  } catch (err) {
    console.error("Failed to notify department employees:", err);
  }
};

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
  const { title, date, start_date, end_date, time, description, recurring_pattern, recurring_end_date, department } = req.body;

  // Use start_date if provided, otherwise fall back to date
  const eventStartDate = start_date || date;
  const eventEndDate = end_date || eventStartDate;

  if (!title || !eventStartDate) {
    return res.status(400).json({ message: 'Title and start date are required' });
  }

  try {
    const [result] = await db.query(
      'INSERT INTO events (title, date, start_date, end_date, time, description, recurring_pattern, recurring_end_date, department) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [title, eventStartDate, eventStartDate, eventEndDate, time || 9, description || null, recurring_pattern || 'none', recurring_end_date || null, department || null]
    );
    
    const newEvent = { 
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
    };

    // Send notifications
    try {
      const adminId = req.user ? (req.user.employeeId || req.user.employee_id || req.user.id) : 'System';
      const dateRange = eventStartDate === eventEndDate 
        ? eventStartDate 
        : `${eventStartDate} to ${eventEndDate}`;
      const deptText = department ? ` for ${department} department` : '';
      
      console.log(`📅 Sending event notifications${department ? ` to ${department} department` : ' to all users'}...`);
      
      if (department) {
        // Department-specific event - notify only that department
        await notifyDepartmentEmployees({
          senderId: adminId,
          title: "New Event",
          message: `A new event "${title}" has been scheduled${deptText} on ${dateRange}.`,
          type: "event_created",
          referenceId: result.insertId,
          department
        });
      } else {
        // Company-wide event - notify everyone
        await notifyAllUsers({
          senderId: adminId,
          title: "New Event",
          message: `A new event "${title}" has been scheduled on ${dateRange}.`,
          type: "event_created",
          referenceId: result.insertId
        });
      }
      console.log('📅 Event notifications sent successfully');
    } catch (notificationError) {
      console.error('Failed to send event notifications:', notificationError);
    }

    res.status(201).json({ message: 'Event created successfully', event: newEvent });
  } catch (error) {
    console.error('Error creating event:', error);
    res.status(500).json({ message: 'Failed to create event', error: error.message });
  }
};


export const updateEvent = async (req, res) => {
  const { id } = req.params;
  const { title, date, start_date, end_date, time, description, recurring_pattern, recurring_end_date, department } = req.body;

  // Use start_date if provided, otherwise fall back to date
  const eventStartDate = start_date || date;
  const eventEndDate = end_date || eventStartDate;

  if (!title || !eventStartDate) {
    return res.status(400).json({ message: 'Title and start date are required' });
  }

  try {
    // Check if event exists
    const [existing] = await db.query('SELECT * FROM events WHERE id = ?', [id]);
    
    if (existing.length === 0) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Update the event
    await db.query(
      'UPDATE events SET title = ?, date = ?, start_date = ?, end_date = ?, time = ?, description = ?, recurring_pattern = ?, recurring_end_date = ?, department = ? WHERE id = ?',
      [title, eventStartDate, eventStartDate, eventEndDate, time || 9, description || null, recurring_pattern || 'none', recurring_end_date || null, department || null, id]
    );

    const updatedEvent = { 
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
