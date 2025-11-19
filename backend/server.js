import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from "cookie-parser";
import authRoutes from './routes/authRoutes.js';

//CRITICAL: Load .env file FIRST before anything else
dotenv.config();

// Verify environment variables are loaded
console.log("   Checking environment variables...");
console.log("   DB_HOST:", process.env.DB_HOST ? "Loaded" : "Missing");
console.log("   DB_NAME:", process.env.DB_NAME ? "Loaded" : "Missing");
console.log("   JWT_SECRET:", process.env.JWT_SECRET ? "Loaded" : "Missing");
console.log("   REFRESH_SECRET:", process.env.REFRESH_SECRET ? "Loaded" : "Missing");
console.log("   PORT:", process.env.PORT || "5000 (default)");

// Exit if critical variables are missing
if (!process.env.JWT_SECRET || !process.env.REFRESH_SECRET) {
  console.error("\nCRITICAL ERROR: JWT secrets not found!");
  console.error("   Make sure you have a .env file in your backend root directory");
  console.error("   with JWT_SECRET and REFRESH_SECRET defined.");
  process.exit(1);
}

const app = express();

// Allow multiple dev origins (e.g. Vite on 5173 and 5174) and keep cookie support
const whitelist = ["http://localhost:5173", "http://localhost:5174"];
app.use(cors({
  origin: function (origin, callback) {
    
    // allow requests with no origin (like mobile clients or curl)
    if (!origin) return callback(null, true);
    if (whitelist.indexOf(origin) !== -1) {
      return callback(null, true);
    }
    return callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

// Root route
app.get("/", (req, res) => {
  res.json({ 
    status: "Backend is running",
    timestamp: new Date().toISOString(),
    env: {
      nodeEnv: process.env.NODE_ENV || "development",
      hasJwtSecret: !!process.env.JWT_SECRET,
      hasRefreshSecret: !!process.env.REFRESH_SECRET
    }
  });
});

// API routes
app.use("/api", authRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ 
    message: "Internal server error",
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });                               

[]});



const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`\nServer running on port ${PORT}`);
  console.log(`   http://localhost:${PORT}`);
  console.log(`   Auth: http://localhost:${PORT}/api`);
});