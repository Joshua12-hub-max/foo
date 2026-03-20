import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import cookieParser from "cookie-parser";
import helmet from 'helmet';
import compression from 'compression';
import crypto from 'crypto';
import path from 'path';
import { fileURLToPath } from 'url';
import cron from 'node-cron';
import authRoutes from './routes/authRoutes.js';

import dtrRoutes from './routes/dtrRoutes.js';
import attendanceRoutes from './routes/attendanceRoutes.js';
import leaveRoutes from './routes/leaveRoutes.js';
import announcementRoutes from './routes/announcementRoutes.js';
import eventRoutes from './routes/eventRoutes.js';
import scheduleRoutes from './routes/scheduleRoutes.js';
import performanceRoutes from './routes/performanceRoutes.js';
import departmentRoutes from './routes/departmentRoutes.js';
import employeeRoutes from './routes/employeeRoutes.js';
import memoRoutes from './routes/memoRoutes.js';
import holidayRoutes from './routes/holidayRoutes.js';

import plantillaRoutes from './routes/plantillaRoutes.js';
import recruitmentRoutes from './routes/recruitmentRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import emailTemplateRoutes from './routes/emailTemplateRoutes.js';
import googleCalendarRoutes from './routes/googleCalendarRoutes.js';
import zoomRoutes from './routes/zoomRoutes.js';

// Plantilla Compliance Routes
import qualificationStandardsRoutes from './routes/qualificationStandardsRoutes.js';
import nepotismRoutes from './routes/nepotismRoutes.js';
import stepIncrementRoutes from './routes/stepIncrementRoutes.js';
import budgetAllocationRoutes from './routes/budgetAllocationRoutes.js';
import reportRoutes from './routes/reportRoutes.js';
import inquiryRoutes from './routes/inquiryRoutes.js';
import chatRoutes from './routes/chatRoutes.js';
import policyRoutes from './routes/policyRoutes.js';
import complianceRoutes from './routes/complianceRoutes.js';
import devRoutes from './routes/devRoutes.js';
import biometricRoutes from './routes/biometricRoutes.js';
import commonRoutes from './routes/commonRoutes.js';
import { waitForDatabase, runMigrations } from './db/index.js';
import { namingMiddleware } from './middleware/namingMiddleware.js';


dotenv.config();
import { checkForNewApplications } from './services/emailReceiverService.js';
import { startPollingService } from './services/pollingService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

import { initCronJobs } from './jobs/employmentChecks.js';
import { initLeaveAccrualJob } from './jobs/leaveAccrual.js';
import { startForcedLeaveCron } from './jobs/forcedLeaveDeduction.js';

// Email application checker scheduled (every 5 minutes)
const startServices = async () => {
    console.warn('Waiting for database to be ready...');
    const isReady = await waitForDatabase(20, 3000); // 20 attempts, 3s each = 1 minute total

    if (!isReady) {
        console.error('Could not establish database connection. Services will not start.');
        return;
    }

    // Run pending migrations
    try {
        await runMigrations();
    } catch (__err) {
        // Errors are already handled/logged in runMigrations()
    }

    console.warn('Initializing jobs and services...');
    initCronJobs();
    initLeaveAccrualJob();
    startForcedLeaveCron();

    // Initialize Attendance Log Polling (syncs external biometric scanner data)
    startPollingService(5000);

    cron.schedule('*/5 * * * *', async () => {
        console.warn('[CRON] Checking for email applications...');
        try {
            const result = await checkForNewApplications();
            if (result.processed > 0) {
                console.warn(`[CRON] Processed ${result.processed} new application(s) from email`);
            }
        } catch (err) {
            const error = err as Error;
            console.error('[CRON] Email check failed:', error.message);
        }
    });
    console.warn('Background services initialized');
};

startServices();

// Middleware

// Generate a cryptographic nonce for each request (for secure inline scripts)
app.use((_req, res, next) => {
  res.locals.nonce = crypto.randomBytes(16).toString('base64');
  next();
});

// Configure Helmet with CSP that trusts only nonce-tagged inline scripts
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    crossOriginEmbedderPolicy: false,
    crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" },
    contentSecurityPolicy: {
      useDefaults: true,
      directives: {
        'script-src': ["'self'", (_req, res) => `'nonce-${(res as express.Response).locals.nonce}'`],
        'img-src': ["'self'", "https:", "data:"],
      },
    },
  })
);
app.use(cors({
  origin: [
    "http://localhost:5173",
    "http://localhost:5174",
    "https://localhost:5173",
    "https://localhost:5174",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:5174",
    "https://127.0.0.1:5173",
    "https://127.0.0.1:5174",
  ],
  credentials: true
}));
app.use(cookieParser());
app.use(express.json());
app.use(namingMiddleware);
app.use(compression());

import { verifyToken } from './middleware/authMiddleware.js';

// Serve public uploaded files (Avatars only) with CORS headers
app.use('/uploads/avatars', (_req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  next();
}, express.static(path.join(__dirname, 'uploads/avatars')));

// 100% Data Leak Prevention: Protect sensitive uploads (Resumes, Leaves, PDS)
app.use('/uploads', verifyToken, (_req, res, next) => {
  // Enforce same-site origin policy for sensitive documents
  res.setHeader('Cross-Origin-Resource-Policy', 'same-site');
  next();
}, express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/employees', employeeRoutes);

app.use('/api/dtr', dtrRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/leave', leaveRoutes);

app.use('/api/announcement', announcementRoutes);
app.use('/api/event', eventRoutes);
app.use('/api/schedules', scheduleRoutes);
app.use('/api/performance', performanceRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/memos', memoRoutes);
app.use('/api/holidays', holidayRoutes);

app.use('/api/plantilla', plantillaRoutes);
app.use('/api/recruitment', recruitmentRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/email-templates', emailTemplateRoutes);
app.use('/api/google-calendar', googleCalendarRoutes);
app.use('/api/zoom', zoomRoutes);

// Plantilla Compliance APIs
app.use('/api/qualification-standards', qualificationStandardsRoutes);
app.use('/api/nepotism', nepotismRoutes);
app.use('/api/step-increment', stepIncrementRoutes);
app.use('/api/budget-allocation', budgetAllocationRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/inquiries', inquiryRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/policies', policyRoutes);
app.use('/api/compliance', complianceRoutes);

// PDS Routes
import pdsRoutes from './routes/pdsRoutes.js';
app.use('/api/pds', pdsRoutes);
app.use('/api/dev', devRoutes);
app.use('/api/common', commonRoutes);
app.use('/api/biometric', biometricRoutes);


// Root route
app.get("/", (_req, res) => {
  res.json({ message: "Backend is running!" });
});

// Error handling
import { errorHandler } from './middleware/errorMiddleware.js';
app.use(errorHandler);

const PORT = Number(process.env.PORT) || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.warn(`Server running on port ${PORT} (IPv4/IPv6)`);
});
 
