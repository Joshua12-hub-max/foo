
import db from './db/connection.js';

async function testInsert() {
  try {
    console.log('Testing insert with AM/PM time...');
    const [result] = await db.query(
      'INSERT INTO announcements (title, content, priority, start_time, end_time) VALUES (?, ?, ?, ?, ?)',
      ['Test Title', 'Test Content', 'normal', '9:00 AM', '5:00 PM']
    );
    console.log('Insert success:', result);
  } catch (error) {
    console.error('Insert failed:', error);
  } finally {
      process.exit(0);
  }
}

testInsert();
