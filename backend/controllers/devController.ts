
import { Request, Response } from 'express';
import { db } from '../db/index.js';
import { attendanceLogs } from '../db/schema.js';
import { eq, desc, and, sql } from 'drizzle-orm';
import jwt from 'jsonwebtoken';
import { processDailyAttendance } from '../services/attendanceProcessor.js';

/**
 * DEV LOGIN
 * Bypasses password check. Accepts email or employeeId.
 * POST /api/dev/login
 * Body: { identifier: string }
 */
export const devLogin = async (req: Request, res: Response): Promise<void> => {
    try {
        const { identifier } = req.body;
        if (!identifier) {
            res.status(400).json({ success: false, message: 'Identifier is required' });
            return;
        }

        const user = await db.query.authentication.findFirst({
            where: (u, { or, eq }) => or(eq(u.email, identifier), eq(u.employeeId, identifier))
        });

        if (!user) {
            res.status(404).json({ success: false, message: 'User not found' });
            return;
        }

        const jwtSecret = process.env.JWT_SECRET;
        if (!jwtSecret) throw new Error('JWT_SECRET missing');

        const token = jwt.sign(
            { 
                id: user.id, 
                employeeId: user.employeeId, 
                role: user.role.toLowerCase() 
            },
            jwtSecret,
            { expiresIn: '1d' }
        );

        res.cookie('accessToken', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 24 * 60 * 60 * 1000
        });

        res.json({
            success: true,
            message: 'DEV LOGIN SUCCESS',
            token,
            user: {
                id: user.id,
                email: user.email,
                name: `${user.firstName} ${user.lastName}`,
                role: user.role
            }
        });

    } catch (error) {
        console.error('Dev Login Error:', error);
        res.status(500).json({ success: false, message: 'Dev login failed' });
    }
};

/**
 * SIMULATE BIOMETRIC LOG
 * Inserts a log and triggers attendance processing.
 * POST /api/dev/biometric-log
 * Body: { employeeId: string, timestamp?: string, type?: 'IN' | 'OUT' }
 */
export const simulateBiometricLog = async (req: Request, res: Response): Promise<void> => {
    try {
        const { employeeId, type, timestamp } = req.body;

        if (!employeeId) {
            res.status(400).json({ success: false, message: 'employeeId is required' });
            return;
        }

        const now = timestamp ? new Date(timestamp) : new Date();
        const mysqlDate = now.toISOString().slice(0, 19).replace('T', ' '); // YYYY-MM-DD HH:mm:ss
        const todayFn = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

        // Determine Type if not provided
        let logType = type;
        if (!logType) {
            const lastLog = await db.query.attendanceLogs.findFirst({
                where: and(
                    eq(attendanceLogs.employeeId, employeeId),
                    eq(sql`DATE(${attendanceLogs.scanTime})`, todayFn)
                ),
                orderBy: desc(attendanceLogs.scanTime)
            });
            logType = (!lastLog || lastLog.type === 'OUT') ? 'IN' : 'OUT';
        }

        await db.insert(attendanceLogs).values({
            employeeId,
            scanTime: mysqlDate,
            type: logType,
            source: 'BIOMETRIC' // Pretend it's biometric to test the flow
        });

        // Trigger processing
        await processDailyAttendance(employeeId, todayFn);

        res.json({
            success: true,
            message: `Simulated ${logType} for ${employeeId} at ${mysqlDate}`,
            data: {
                employeeId,
                type: logType,
                time: mysqlDate
            }
        });

    } catch (error) {
        console.error('Simulate Log Error:', error);
        res.status(500).json({ success: false, message: 'Simulation failed', error: (error as Error).message });
    }
};
