
import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

/**
 * Application error with optional HTTP status and DB error code.
 */
interface AppError extends Error {
    status?: number;
    statusCode?: number;
    code?: string;
}

export const errorHandler = (error: AppError | ZodError, req: Request, res: Response, _next: NextFunction) => {
    // Log the error for internal tracking
    console.error(`[ERROR] ${req.method} ${req.url}`, error.message || error);

    // Handle Zod Validation Errors
    if (error instanceof ZodError) {
        return res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors: error.issues.map((e) => ({
                path: e.path.join('.'),
                message: e.message
            }))
        });
    }

    // Handle Drizzle/DB errors (e.g. unique constraint)
    if (error.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({
            success: false,
            message: 'Duplicate entry found.'
        });
    }

    // Default Error
    const statusCode = error.status || error.statusCode || 500;
    res.status(statusCode).json({
        success: false,
        message: error.message || 'Internal Server Error',
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
};
