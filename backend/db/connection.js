import mysql from 'mysql2/promise';
// Removed dotenv.config() to avoid duplicate loading - it's handled in server.js

let db;

const connectDB = async () => {
  try {
    db = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'chrmo_db',
      port: process.env.DB_PORT || 3306,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });

    // Test the connection
    await db.ping();
    console.log("Database Connected");

    // Handle connection errors
    db.on('error', (err) => {
      console.error("Database error:", err);
      if (err.code === 'PROTOCOL_CONNECTION_LOST') {
        console.log("Attempting to reconnect...");
        connectDB();
      }
    });

    return db;
  } catch (error) {
    console.error("Database connection failed:", error.message);
    console.error("Please check your database credentials and ensure MySQL is running.");
    process.exit(1);
  }
};

// Initialize connection
await connectDB();

export default db;