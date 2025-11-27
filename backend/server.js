import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from "cookie-parser";
import helmet from 'helmet';
import authRoutes from './routes/authRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import dtrRoutes from './routes/dtrRoutes.js';
import dtrCorrectionRoutes from './routes/dtrCorrectionRoutes.js';
import attendanceRoutes from './routes/attendanceRoutes.js';
import leaveRoutes from './routes/leaveRoutes.js';
import scheduleRoutes from './routes/scheduleRoutes.js';
import undertimeRoutes from './routes/undertimeRoutes.js';
import biometricsRoutes from './routes/biometricsRoutes.js';

dotenv.config();
import { initBiometrics } from './services/biometricService.js';

const app = express();

// Initialize Biometrics Service
initBiometrics();

// Middleware
app.use(helmet());
app.use(cors({
  origin: ["http://localhost:5173", "http://localhost:5174"],
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/dtr', dtrRoutes);
app.use('/api/dtr-corrections', dtrCorrectionRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/leave', leaveRoutes);
app.use('/api/schedule', scheduleRoutes);
app.use('/api/undertime', undertimeRoutes);
app.use('/api/biometrics', biometricsRoutes);

// Root route
app.get("/", (req, res) => {
  res.json({ message: "Backend is running!" });
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "Internal Server Error" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
