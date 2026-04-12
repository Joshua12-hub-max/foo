import dotenv from 'dotenv';
dotenv.config();
// 100% RESTART TRIGGER: Force nodemon to reload after structural fixes in auth.controller.ts

import express from 'express';
import cors from 'cors';
import cookieParser from "cookie-parser";
import helmet from 'helmet';
import compression from 'compression';
import crypto from 'crypto';
import path from 'path';
import fs from 'fs';
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
import { waitForDatabase, runMigrations, closeDatabase } from './db/index.js';
import { namingMiddleware } from './middleware/namingMiddleware.js';


dotenv.config();
import { checkForNewApplications } from './services/emailReceiverService.js';
import { startPollingService, stopPollingService } from './services/pollingService.js';

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
        'img-src': ["'self'", "https:", "data:", "http:", "blob:"],
        'connect-src': ["'self'", "https:", "http:"],
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

// Static file routes with explicit public/private logic
// 1. Avatars (Public)
app.use('/uploads/avatars', (_req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    next();
}, express.static(path.join(__dirname, 'uploads/avatars')));

// 2. PUBLIC IMAGES BYPASS (Combined resumes and general photos)
// 100% PERMANENT FIX: This ensures that any image request to /uploads/... returns immediately without verifyToken
app.use((req, res, next) => {
    const url = req.originalUrl.toLowerCase().split('?')[0];
    const isImage = url.startsWith('/uploads/') && (
        url.endsWith('.jpg') || url.endsWith('.jpeg') || 
        url.endsWith('.png') || url.endsWith('.webp') || 
        url.endsWith('.gif')
    );
    
    if (isImage) {
        const logFile = path.join(process.cwd(), 'image_debug.log');
        const relativePath = url.replace(/^\/uploads\//, '');
        const fullPath = path.join(__dirname, 'uploads', relativePath);
        const exists = fs.existsSync(fullPath);
        
        fs.appendFileSync(logFile, `[${new Date().toISOString()}] ${req.method} ${req.originalUrl} | Full: ${fullPath} | Exists: ${exists}\n`);
        
        if (exists) {
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
            return res.sendFile(fullPath);
        }
    }
    next();
});

// 3. Resumes (Private) - For non-image files like PDFs
app.use('/uploads/resumes', verifyToken, express.static(path.join(__dirname, 'uploads/resumes')));

// 4. General Protected Uploads
app.use('/uploads', verifyToken, express.static(path.join(__dirname, 'uploads')));

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
  res.json({ message: "Backend is running! DEBUG-PHOTO-FIX-ACTIVE" });
});

// Error handling
import { errorHandler } from './middleware/errorMiddleware.js';
app.use(errorHandler);

const PORT = Number(process.env.PORT) || 5000;
const server = app.listen(PORT, '0.0.0.0', () => {
  console.warn(`Server running on port ${PORT} (IPv4/IPv6)`);
});

const gracefulShutdown = (signal: string) => {
  console.warn(`[${signal}] Received. Shutting down gracefully...`);
  
  // Stop background tasks
  stopPollingService();
  
  // Close the Express server to stop accepting new connections and release the port
  server.close(async () => {
    console.warn('HTTP server closed.');
    
    // Close database connections
    await closeDatabase();
    
    console.warn('Graceful shutdown complete.');
    process.exit(0);
  });

  // Fallback: forcefully shutdown after 10 seconds if connections are hanging
  setTimeout(() => {
    console.error('Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 10000);
};

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.once('SIGUSR2', () => gracefulShutdown('SIGUSR2')); // Nodemon specific
