import { db } from '../db/index.js';
import { audit_logs } from '../db/schema.js';
import { Request } from 'express';

export type AuditModule = 'AUTH' | 'USER' | 'USER_MANAGEMENT' | 'SCHEDULE' | 'SHIFT_TEMPLATE' | 'RECRUITMENT' | 'INQUIRY' | 'SYSTEM';
export type AuditAction = 'LOGIN' | 'LOGOUT' | 'PASSWORD_RESET' | 'CREATE' | 'UPDATE' | 'DELETE' | 'CREATE_BULK' | 'OTP_VERIFY' | 'HIRE' | 'OFFER' | 'APPLY' | 'ROLE_UPDATE';

interface AuditLogOptions {
  userId: number | null;
  module: AuditModule;
  action: AuditAction;
  details?: string | Record<string, unknown>;
  req?: Request;
}

/**
 * Centalized Service for Security Audit Logging
 * Enforces "Zero Type Erasure" policy.
 */
export class AuditService {
  /**
   * Logs a security action to the database.
   * @param options Audit log parameters
   */
  static async log(options: AuditLogOptions): Promise<void> {
    try {
      const { userId, module, action, details, req } = options;
      
      const ipAddress = req?.ip || '0.0.0.0';
      const userAgent = req?.headers['user-agent'] || 'Unknown';
      
      const serializedDetails = typeof details === 'object' 
        ? JSON.stringify(details) 
        : details || null;

      await db.insert(audit_logs).values({
        userId,
        module: module as string,
        action: action as string,
        details: serializedDetails,
        ipAddress,
        userAgent
      });
    } catch (error: unknown) {
      // We use unknown + explicit guard for Zero Type Erasure
      const message = error instanceof Error ? error.message : 'Unknown database error';
      console.error(`[CRITICAL] Failed to persist audit log: ${message}`);
      // Do not throw to avoid breaking the main business flow if logging fails
    }
  }
}
