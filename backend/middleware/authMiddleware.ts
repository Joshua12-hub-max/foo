import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import type { JwtPayload, AuthenticatedRequest, UserRole, UserRow } from '../types/index.js';
import db from '../db/index.js';

// ============================================================================
// Type Definitions
// ============================================================================

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

/**
 * Verify JWT token from cookies and attach user to request.
 * Uses try-catch for robust error handling.
 */
export const verifyToken: MiddlewareFunction = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.cookies?.accessToken as string | undefined;

    if (!token) {
      res.status(401).json({ 
        message: 'Authentication required. Please log in.',
        code: 'NO_TOKEN'
      } satisfies AuthErrorResponse);
      return;
    }

    const secret = getJwtSecret();
    if (!secret) {
      console.error('[AUTH] JWT_SECRET is not configured in environment variables.');
      res.status(500).json({ 
        message: 'Server configuration error. Please contact administrator.',
        code: 'SERVER_ERROR'
      } satisfies AuthErrorResponse);
      return;
    }

    jwt.verify(token, secret, (err, decoded) => {
      try {
        if (err) {
          const errorResponse = getJwtErrorResponse(err);
          const statusCode = errorResponse.code === 'EXPIRED_TOKEN' ? 401 : 403;
          res.status(statusCode).json(errorResponse);
          return;
        }

        if (!isValidJwtPayload(decoded)) {
          console.error('[AUTH] Decoded token has invalid structure:', decoded);
          res.status(403).json({ 
            message: 'Token payload is invalid.',
            code: 'INVALID_TOKEN'
          } satisfies AuthErrorResponse);
          return;
        }

        // Attach strongly-typed user to request
        (req as AuthenticatedRequest).user = decoded;
        next();
      } catch (callbackError) {
        console.error('[AUTH] Error in JWT verify callback:', callbackError);
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
            message: 'User role not found.',
            code: 'FORBIDDEN'
          } satisfies AuthErrorResponse);
          return;
        }
        
        const adminRoles: UserRole[] = ['Admin', 'Human Resource'];
        
        if (adminRoles.includes(userRole)) {
          next();
        } else {
          res.status(403).json({ 
            message: 'Access denied. Admin or HR privileges required.',
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
        const isAdmin = ['Admin', 'Human Resource'].includes(userRole || '');
        
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
    const [users] = await db.query<UserRow[]>('SELECT employment_status FROM authentication WHERE id = ?', [userId]);

    if (users.length > 0) {
      const status = users[0].employment_status;
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
