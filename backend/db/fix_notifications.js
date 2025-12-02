import db from './connection.js';

const fixNotifications = async () => {
  try {
    console.log('Dropping notifications table if exists...');
    await db.query('DROP TABLE IF EXISTS notifications');
    
    console.log('Recreating notifications table...');
    await db.query(`
      CREATE TABLE notifications (
        notification_id INT AUTO_INCREMENT PRIMARY KEY,
        recipient_id VARCHAR(50) NOT NULL,
        sender_id VARCHAR(50),
        title VARCHAR(255),
        message TEXT,
        type VARCHAR(50),
        reference_id INT,
        status ENUM('read', 'unread') DEFAULT 'unread',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('Notifications table fixed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Failed to fix notifications table:', error);
    process.exit(1);
  }
};

fixNotifications();
