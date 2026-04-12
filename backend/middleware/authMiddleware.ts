import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import type { JwtPayload, AuthenticatedRequest, UserRole } from '../types/index.js';
import { db } from '../db/index.js';
import { eq } from 'drizzle-orm';
import { authentication } from '../db/schema.js';
import fs from 'fs';
import path from 'path';

const DEBUG_LOG_PATH = path.join(process.cwd(), 'auth_debug.log');

const logDebug = (msg: string) => {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${msg}\n`;
  fs.appendFileSync(DEBUG_LOG_PATH, logMessage);
  console.warn(msg);
};

// ============================================================================
// Type Definitions
// ============================================================================

import { rateLimit } from 'express-rate-limit';

/**
 * General authentication rate limiter
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: { message: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Strict rate limiter for sensitive endpoints (login, password reset)
 */
export const strictAuthLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // limit each IP to 10 requests per hour
  message: { message: 'Too many login attempts, please try again in an hour.' },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Middleware function type for Express
 */
type MiddlewareFunction = (
  req: Request,
  res: Response,
  next: NextFunction
) => void;

/**
 * Error response structure for authentication failures
 */
interface AuthErrorResponse {
  message: string;
  code: 'NO_TOKEN' | 'INVALID_TOKEN' | 'EXPIRED_TOKEN' | 'SERVER_ERROR' | 'FORBIDDEN' | 'ACCOUNT_SUSPENDED' | 'INVALID_PARAMS';
}

/**
 * Validates that the 'id' parameter is a valid positive integer.
 * Prevents logic errors in ownership checks.
 */
export const verifyIdParam: MiddlewareFunction = (req, res, next) => {
  const id = parseInt(req.params.id as string);
  if (isNaN(id) || id <= 0) {
    return res.status(400).json({
      message: 'Invalid ID parameter. Expected a positive integer.',
      code: 'INVALID_PARAMS'
    } satisfies AuthErrorResponse);
  }
  next();
};

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Type guard to check if decoded token is a valid JwtPayload
 */
const isValidJwtPayload = (decoded: unknown): decoded is JwtPayload => {
  if (typeof decoded !== 'object' || decoded === null) {
    return false;
  }

  const payload = decoded as Record<string, unknown>;
  
  return (
    typeof payload.id === 'number' &&
    typeof payload.employeeId === 'string' &&
    typeof payload.role === 'string'
  );
};

/**
 * Get user-friendly error message from JWT error
 */
const getJwtErrorResponse = (error: Error): AuthErrorResponse => {
  // Check error name since jsonwebtoken doesn't export error classes in ESM
  if (error.name === 'TokenExpiredError') {
    return { message: 'Token has expired. Please log in again.', code: 'EXPIRED_TOKEN' };
  }
  
  if (error.name === 'NotBeforeError') {
    return { message: 'Token is not yet active.', code: 'INVALID_TOKEN' };
  }
  
  if (error.name === 'JsonWebTokenError') {
    return { message: 'Invalid token. Please log in again.', code: 'INVALID_TOKEN' };
  }
  
  return { message: 'Authentication error occurred.', code: 'SERVER_ERROR' };
};

/**
 * Safely get JWT secret from environment
 */
const getJwtSecret = (): string | null => {
  const secret = process.env.JWT_SECRET;
  return secret && secret.length > 0 ? secret : null;
};

// ============================================================================
// Middleware Functions
// ============================================================================

import { AuthService } from '../services/auth.service.js';

/**
 * Verify JWT token from cookies and attach user to request.
 * 100% ROBUST: Now also supports short-lived download tokens for window.open bypass.
 */
export const verifyToken: MiddlewareFunction = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const downloadToken = req.query.token as string | undefined;
    let cookieToken = req.cookies?.accessToken as string | undefined;

    // 1. Handle Short-lived Download Tokens (Highest Priority for Frames/Downloads)
    if (downloadToken) {
        const userId = AuthService.verifyDownloadToken(downloadToken);
        if (userId) {
            (req as AuthenticatedRequest).user = {
                id: userId,
                employeeId: 'DOWNLOADER',
                role: 'Employee'
            };
            return next();
        }
        // If download token was provided but invalid, we don't fall back to cookies for safety
        return res.status(401).json({ message: 'Invalid download token.', code: 'INVALID_TOKEN' });
    }

    if (!cookieToken) {
      logDebug(`[AUTH] No accessToken cookie found for ${req.method} ${req.originalUrl}`);
      res.status(401).json({ 
        message: 'authentication required. please log in.',
        code: 'NO_TOKEN'
      } satisfies AuthErrorResponse);
      return;
    }

    const secret = getJwtSecret();
    if (!secret) {
      logDebug('[AUTH] JWT_SECRET is not configured in environment variables.');
      res.status(500).json({ 
        message: 'Server configuration error. Please contact administrator.',
        code: 'SERVER_ERROR'
      } satisfies AuthErrorResponse);
      return;
    }

    jwt.verify(cookieToken, secret, (err, decoded) => {
      try {
        if (err) {
          logDebug(`[AUTH] Token verification failed for ${req.method} ${req.originalUrl}: ${err.message}`);
          const errorResponse = getJwtErrorResponse(err);
          const statusCode = errorResponse.code === 'EXPIRED_TOKEN' ? 401 : 403;
          res.status(statusCode).json(errorResponse);
          return;
        }

        if (!isValidJwtPayload(decoded)) {
          logDebug(`[AUTH] Decoded token has invalid structure: ${JSON.stringify(decoded)}`);
          res.status(403).json({ 
            message: 'token payload is invalid.',
            code: 'INVALID_TOKEN'
          } satisfies AuthErrorResponse);
          return;
        }

        // Attach strongly-typed user to request
        (req as AuthenticatedRequest).user = decoded;
        next();
      } catch (callbackError) {
        logDebug(`[AUTH] Error in JWT verify callback: ${callbackError instanceof Error ? callbackError.message : String(callbackError)}`);
        res.status(500).json({ 
          message: 'Internal authentication error.',
          code: 'SERVER_ERROR'
        } satisfies AuthErrorResponse);
      }
    });
  } catch (error) {
    console.error('[AUTH] Unexpected error in verifyToken:', error);
    res.status(500).json({ 
      message: 'Internal server error during authentication.',
      code: 'SERVER_ERROR'
    } satisfies AuthErrorResponse);
  }
};

/**
 * Verify token and check for admin/hr role.
 * Combines verifyToken with role checking for privileged routes.
 */
export const verifyAdmin: MiddlewareFunction = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    verifyToken(req, res, () => {
      try {
        const authReq = req as AuthenticatedRequest;
        const userRole = authReq.user?.role as UserRole | undefined;
        
        if (!userRole) {
          res.status(403).json({ 
            message: 'Access denied: User role not found in token.',
            code: 'FORBIDDEN'
          } satisfies AuthErrorResponse);
          return;
        }
        
        const adminRoles: UserRole[] = ['Administrator', 'Human Resource'];
        
        if (adminRoles.includes(userRole)) {
          next();
        } else {
          res.status(403).json({ 
            message: `Access denied: Admin or HR privileges required. Your role: ${userRole}`,
            code: 'FORBIDDEN'
          } satisfies AuthErrorResponse);
        }
      } catch (roleCheckError) {
        console.error('[AUTH] Error in role check:', roleCheckError);
        res.status(500).json({ 
          message: 'Error checking user permissions.',
          code: 'SERVER_ERROR'
        } satisfies AuthErrorResponse);
      }
    });
  } catch (error) {
    console.error('[AUTH] Unexpected error in verifyAdmin:', error);
    res.status(500).json({ 
      message: 'Internal server error.',
      code: 'SERVER_ERROR'
    } satisfies AuthErrorResponse);
  }
};

/**
 * Verify if user is Admin, HR, or the owner of the resource
 */
export const verifyOwnerOrAdmin: MiddlewareFunction = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    verifyToken(req, res, () => {
      try {
        const authReq = req as AuthenticatedRequest;
        const user = authReq.user;
        
        if (!user) {
           res.status(401).json({ message: 'Authentication required', code: 'NO_TOKEN' });
           return;
        }

        const userRole = user.role;
        const isAdmin = ['Administrator', 'Human Resource'].includes(userRole || '');
        
        const targetIdString = req.params.id as string;
        const targetId = parseInt(targetIdString);
        
        if (isNaN(targetId)) {
          res.status(400).json({ message: 'Invalid ID parameter', code: 'INVALID_PARAMS' });
          return;
        }

        const isOwner = user.id === targetId;

        if (isAdmin || isOwner) {
          next();
        } else {
          res.status(403).json({ 
            message: 'Access denied. You can only modify your own profile.',
            code: 'FORBIDDEN'
          });
        }
      } catch (error) {
        console.error('[AUTH] Error in verifyOwnerOrAdmin:', error);
        res.status(500).json({ message: 'Error checking permissions', code: 'SERVER_ERROR' });
      }
    });
  } catch (error) {
    console.error('[AUTH] Unexpected error in verifyOwnerOrAdmin:', error);
    res.status(500).json({ message: 'Internal server error', code: 'SERVER_ERROR' });
  }
};

/**
 * Alias for verifyToken - used by SPMS routes for compatibility.
 */
export const authenticateToken = verifyToken;

/**
 * Role-based access control middleware factory.
 * Creates a middleware that only allows access to users with specified roles.
 */
export const requireRole = (allowedRoles: readonly UserRole[]): MiddlewareFunction => {
  // Validate input at middleware creation time
  if (!Array.isArray(allowedRoles) || allowedRoles.length === 0) {
    throw new Error('[AUTH] requireRole: allowedRoles must be a non-empty array');
  }

  // Pre-normalize roles for performance (case-sensitive)
  const normalizedRoles = new Set(allowedRoles);

  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const authReq = req as AuthenticatedRequest;
      
      // Check if user was attached by verifyToken middleware
      if (!authReq.user) {
        res.status(401).json({ 
          message: 'Authentication required. Please ensure verifyToken middleware is applied first.',
          code: 'NO_TOKEN'
        } satisfies AuthErrorResponse);
        return;
      }

      const userRole = authReq.user.role;
      
      if (!userRole) {
        res.status(403).json({ 
          message: 'User role is not defined.',
          code: 'FORBIDDEN'
        } satisfies AuthErrorResponse);
        return;
      }

      if (normalizedRoles.has(userRole)) {
        next();
      } else {
        res.status(403).json({ 
          message: `Access denied. Required role(s): ${allowedRoles.join(', ')}.`,
          code: 'FORBIDDEN'
        } satisfies AuthErrorResponse);
      }
    } catch (error) {
      console.error('[AUTH] Unexpected error in requireRole:', error);
      res.status(500).json({ 
        message: 'Error verifying user permissions.',
        code: 'SERVER_ERROR'
      } satisfies AuthErrorResponse);
    }
  };
};

/**
 * Optional authentication - attaches user if token exists, but doesn't require it.
 * Useful for routes that behave differently for authenticated vs anonymous users.
 */
export const optionalAuth: MiddlewareFunction = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  try {
    const token = req.cookies?.accessToken as string | undefined;

    if (!token) {
      // No token - continue without user attached
      next();
      return;
    }

    const secret = getJwtSecret();
    if (!secret) {
      // No secret configured - continue without user
      next();
      return;
    }

    jwt.verify(token, secret, (err, decoded) => {
      try {
        if (!err && isValidJwtPayload(decoded)) {
          (req as AuthenticatedRequest).user = decoded;
        }
        // Continue regardless of token validity
        next();
      } catch {
        next();
      }
    });
  } catch {
    // On any error, continue without authentication
    next();
  }
};

/**
 * Middleware to restrict access for "Suspended" employees.
 * Blocks write operations or specific requests.
 */
export const restrictSuspended = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    if (!authReq.user) {
       res.status(401).json({ message: 'Authentication required', code: 'NO_TOKEN' });
       return;
    }

    const userId = authReq.user.id;

    // Check status from DB for real-time enforcement
    const userWithHr = await db.query.authentication.findFirst({
      where: eq(authentication.id, userId),
      with: {
        hrDetails: {
          columns: {
            employmentStatus: true
          }
        }
      }
    });

    if (userWithHr?.hrDetails) {
      const status = userWithHr.hrDetails.employmentStatus;
      if (status === 'Suspended') {
         res.status(403).json({
          message: 'Action Restricted: Your account is currently under SUSPENSION. You cannot perform this action.',
          code: 'ACCOUNT_SUSPENDED'
        });
        return;
      }
    }
    
    next();
  } catch (error) {
    console.error('[AUTH] Suspension check failed:', error);
    res.status(500).json({ message: 'Server error checking account status.', code: 'SERVER_ERROR' });
  }
};
