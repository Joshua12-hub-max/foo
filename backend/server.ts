import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from "cookie-parser";
import helmet from 'helmet';
import crypto from 'crypto';
import path from 'path';
import { fileURLToPath } from 'url';
import cron from 'node-cron';
import authRoutes from './routes/authRoutes.js';

import dtrRoutes from './routes/dtrRoutes.js';
import attendanceRoutes from './routes/attendanceRoutes.js';
import leaveRoutes from './routes/leaveRoutes.js';

import biometricsRoutes from './routes/biometricsRoutes.js';
import announcementRoutes from './routes/announcementRoutes.js';
import eventRoutes from './routes/eventRoutes.js';
import scheduleRoutes from './routes/scheduleRoutes.js';
import performanceRoutes from './routes/performanceRoutes.js';
import departmentRoutes from './routes/departmentRoutes.js';
import employeeRoutes from './routes/employeeRoutes.js';
import memoRoutes from './routes/memoRoutes.js';

import plantillaRoutes from './routes/plantillaRoutes.js';
import recruitmentRoutes from './routes/recruitmentRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import emailTemplateRoutes from './routes/emailTemplateRoutes.js';
import googleCalendarRoutes from './routes/googleCalendarRoutes.js';
import zoomRoutes from './routes/zoomRoutes.js';

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
        const error = err as Error;
        console.error('[CRON] Email check failed:', error.message);
    }
});
console.log('Email application checker scheduled (every 5 minutes)');

// Middleware

// Generate a cryptographic nonce for each request (for secure inline scripts)
app.use((req, res, next) => {
  res.locals.nonce = crypto.randomBytes(16).toString('base64');
  next();
});

// Configure Helmet with CSP that trusts only nonce-tagged inline scripts
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    crossOriginEmbedderPolicy: false,
    crossOriginOpenerPolicy: { policy: "unsafe-none" },
    contentSecurityPolicy: {
      useDefaults: true,
      directives: {
        'script-src': ["'self'", (req, res) => `'nonce-${(res as express.Response).locals.nonce}'`],
        'img-src': ["'self'", "https:", "data:"],
      },
    },
  })
);
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
app.use('/api/attendance', attendanceRoutes);
app.use('/api/leave', leaveRoutes);

app.use('/api/biometrics', biometricsRoutes);
app.use('/api/announcement', announcementRoutes);
app.use('/api/event', eventRoutes);
app.use('/api/schedules', scheduleRoutes);
app.use('/api/performance', performanceRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/memos', memoRoutes);

app.use('/api/plantilla', plantillaRoutes);
app.use('/api/recruitment', recruitmentRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/email-templates', emailTemplateRoutes);
app.use('/api/google-calendar', googleCalendarRoutes);
app.use('/api/zoom', zoomRoutes);

// Root route
app.get("/", (req, res) => {
  res.json({ message: "Backend is running!" });
});

// Error handling
app.use((err: Error, req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ message: "Internal Server Error" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
