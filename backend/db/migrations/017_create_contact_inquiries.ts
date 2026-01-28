import db from '../connection.js';

/**
 * Migration: Create Contact Inquiries Table
 */

const migration = async (): Promise<void> => {
  console.log('🚀 Creating contact_inquiries table...');

  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS contact_inquiries (
        id INT AUTO_INCREMENT PRIMARY KEY,
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        email VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        status ENUM('Pending', 'Read', 'Replied', 'Archived') DEFAULT 'Pending',
        admin_notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_status (status),
        INDEX idx_email (email),
        INDEX idx_created_at (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Created contact_inquiries table');

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
