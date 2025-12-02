import db from './db/connection.js';

async function debugDb() {
  try {
    console.log("--- Debugging Database ---");
    
    // 1. Check current database
    const [dbNameResult] = await db.query("SELECT DATABASE() as dbName");
    console.log("Connected to database:", dbNameResult[0].dbName);

    // 2. List tables
    const [tables] = await db.query("SHOW TABLES");
    console.log("Tables:", tables.map(t => Object.values(t)[0]));

    // 3. Describe notifications table
    try {
      const [columns] = await db.query("SHOW COLUMNS FROM notifications");
      console.log("Columns in 'notifications':");
      console.table(columns);
      
      // Check specifically for recipient_id
      const hasRecipientId = columns.some(c => c.Field === 'recipient_id');
      console.log("Has 'recipient_id' column?", hasRecipientId);
      
      if (hasRecipientId) {
          // 4. Try a simple select
          const [rows] = await db.query("SELECT * FROM notifications LIMIT 1");
          console.log("Select * success. Rows:", rows.length);
          
          // 5. Try the specific failing query
          console.log("Attempting failing query...");
          const [count] = await db.query("SELECT COUNT(*) as unread_count FROM notifications WHERE recipient_id = ? AND status = 'unread'", ['1']);
          console.log("Failing query SUCCESS:", count);
      }

    } catch (e) {
      console.error("Error inspecting notifications table:", e);
    }

  } catch (err) {
    console.error("Global error:", err);
  } finally {
    process.exit();
  }
}

debugDb();
