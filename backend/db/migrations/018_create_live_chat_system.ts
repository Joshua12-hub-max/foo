import db from '../index.js';

/**
 * Migration: Create Live Chat System Tables
 */

const migration = async (): Promise<void> => {
  console.log('🚀 Creating live chat tables...');

  try {
    // 1. Chat Conversations (to group messages)
    await db.query(`
      CREATE TABLE IF NOT EXISTS chat_conversations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        applicant_name VARCHAR(100) NOT NULL,
        applicant_email VARCHAR(255) NOT NULL,
        status ENUM('Active', 'Closed', 'Archived') DEFAULT 'Active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_applicant_email (applicant_email),
        INDEX idx_status (status)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Created chat_conversations table');

    // 2. Chat Messages
    await db.query(`
      CREATE TABLE IF NOT EXISTS chat_messages (
        id INT AUTO_INCREMENT PRIMARY KEY,
        conversation_id INT NOT NULL,
        sender_type ENUM('Applicant', 'Admin') NOT NULL,
        sender_id INT NULL COMMENT 'Admin ID if sender_type is Admin',
        message TEXT NOT NULL,
        is_read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_conversation (conversation_id),
        INDEX idx_is_read (is_read),
        FOREIGN KEY (conversation_id) REFERENCES chat_conversations(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Created chat_messages table');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
};

// Run migration
migration()
  .then(() => {
    console.log('✅ Migration finished');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  });

export default migration;
