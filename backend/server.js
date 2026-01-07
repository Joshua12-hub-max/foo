import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from "cookie-parser";
import helmet from 'helmet';
import path from 'path';
import { fileURLToPath } from 'url';
import cron from 'node-cron';
import authRoutes from './routes/authRoutes.js';

import dtrRoutes from './routes/dtrRoutes.js';
import dtrCorrectionRoutes from './routes/dtrCorrectionRoutes.js';
import attendanceRoutes from './routes/attendanceRoutes.js';
import leaveRoutes from './routes/leaveRoutes.js';
import scheduleRoutes from './routes/scheduleRoutes.js';
import undertimeRoutes from './routes/undertimeRoutes.js';
import biometricsRoutes from './routes/biometricsRoutes.js';
import announcementRoutes from './routes/announcementRoutes.js';
import eventRoutes from './routes/eventRoutes.js';
import performanceRoutes from './routes/performanceRoutes.js';
import departmentRoutes from './routes/departmentRoutes.js';
import employeeRoutes from './routes/employeeRoutes.js';
import memoRoutes from './routes/memoRoutes.js';
import departmentReportsRoutes from './routes/departmentReportsRoutes.js';
import plantillaRoutes from './routes/plantillaRoutes.js';
import recruitmentRoutes from './routes/recruitmentRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import emailTemplateRoutes from './routes/emailTemplateRoutes.js';

dotenv.config();
import { initBiometrics } from './services/biometricService.js';
import { checkForNewApplications } from './services/emailReceiverService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Initialize Biometrics Service
initBiometrics();

// Initialize Email Application Checker (runs every 5 minutes)
cron.schedule('*/5 * * * *', async () => {
    console.log('[CRON] Checking for email applications...');
    try {
        const result = await checkForNewApplications();
        if (result.processed > 0) {
            console.log(`[CRON] Processed ${result.processed} new application(s) from email`);
        }
    } catch (err) {
        console.error('[CRON] Email check failed:', err.message);
    }
});
console.log('Email application checker scheduled (every 5 minutes)');

// Middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }, // Allow cross-origin image loading
  crossOriginEmbedderPolicy: false // Disable to allow loading cross-origin images
}));
app.use(cors({
  origin: ["http://localhost:5173", "http://localhost:5174"],
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// Serve uploaded files with CORS headers
app.use('/uploads', (req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  next();
}, express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/employees', employeeRoutes);

app.use('/api/dtr', dtrRoutes);
app.use('/api/dtr-corrections', dtrCorrectionRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/leave', leaveRoutes);
app.use('/api/schedule', scheduleRoutes);
app.use('/api/undertime', undertimeRoutes);
app.use('/api/biometrics', biometricsRoutes);
app.use('/api/announcement', announcementRoutes);
app.use('/api/event', eventRoutes);
app.use('/api/performance', performanceRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/memos', memoRoutes);
app.use('/api/department-reports', departmentReportsRoutes);
app.use('/api/plantilla', plantillaRoutes);
app.use('/api/recruitment', recruitmentRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/email-templates', emailTemplateRoutes);

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
