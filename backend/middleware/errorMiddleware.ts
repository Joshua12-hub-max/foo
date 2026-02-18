
import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

export const errorHandler = (error: any, req: Request, res: Response, _next: NextFunction) => {
    // Log the error for internal tracking
    console.error(`[ERROR] ${req.method} ${req.url}`, error.message || error);

    // Handle Zod Validation Errors
    if (error instanceof ZodError) {
        return res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors: error.issues.map((e: any) => ({
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
