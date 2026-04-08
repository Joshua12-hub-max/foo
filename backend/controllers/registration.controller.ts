import { Request, Response } from 'express';
import { z } from 'zod';
import fs from 'fs';
import path from 'path';
import { RegisterSchema } from '../schemas/authSchema.js';
import { RegistrationService } from '../services/RegistrationService.js';
import { sendOTPEmail, maskEmail } from '../utils/emailUtils.js';
import { AuditService } from '../services/audit.service.js';
import type { AsyncHandler } from '../types/index.js';
import { db } from '../db/index.js';
import { authentication } from '../db/schema.js';
import { eq } from 'drizzle-orm';

interface RegisterRequestWithFile extends Request {
  file?: Express.Multer.File;
}

export const register: AsyncHandler = async (req: Request, res: Response) => {
  const multerReq = req as RegisterRequestWithFile;

  try {
    const isFinalizingSetup = req.query.mode === 'finalize-setup';

    // Preprocess: Parse JSON string fields to arrays/objects
    const preprocessedBody = { ...req.body };
    const jsonFields = [
      'educations', 'eligibilities', 'workExperiences', 'learningDevelopments',
      'voluntaryWorks', 'references', 'familyBackground', 'otherInfo', 'declarations'
    ];

    for (const field of jsonFields) {
      if (preprocessedBody[field] && typeof preprocessedBody[field] === 'string') {
        try {
          preprocessedBody[field] = JSON.parse(preprocessedBody[field]);
        } catch (err) {
          // If parse fails, leave as-is and let Zod validation catch it
          console.warn(`Failed to parse ${field}:`, err);
        }
      }
    }

    // Parse data strictly using Zod
    const validatedData = RegisterSchema.parse(preprocessedBody);

    const rawData = validatedData as typeof validatedData & {
      ignoreDuplicateWarning?: boolean;
      applicantPhotoPath?: string;
    };

    const file = multerReq.file;

    // Use RegistrationService to commit to database
    // RegistrationService does NOT send email or handle files, it only acts on DB.
    const result = await RegistrationService.registerUser(validatedData, {
      isFinalizingSetup: isFinalizingSetup,
      ignoreDuplicateWarning: rawData.ignoreDuplicateWarning
    });

    // Handle avatar file upload
    let avatarUrl: string | null = null;
    if (file) {
      avatarUrl = `${process.env.BACKEND_URL || 'http://localhost:5000'}/uploads/avatars/${file.filename}`;
    } else if (rawData.applicantPhotoPath) {
      try {
        const srcPath = path.join(process.cwd(), 'uploads', 'applications', rawData.applicantPhotoPath);
        if (fs.existsSync(srcPath)) {
          const destFilename = `applicant_${Date.now()}${path.extname(rawData.applicantPhotoPath)}`;
          const destDir = path.join(process.cwd(), 'uploads', 'avatars');
          if (!fs.existsSync(destDir)) {
            fs.mkdirSync(destDir, { recursive: true });
          }
          const destPath = path.join(destDir, destFilename);
          fs.copyFileSync(srcPath, destPath);
          avatarUrl = `${process.env.BACKEND_URL || 'http://localhost:5000'}/uploads/avatars/${destFilename}`;
        }
      } catch (err) {
        console.warn('[Register] Failed to copy applicant photo:', err);
      }
    }

    if (avatarUrl && result.userId) {
      await db.update(authentication)
        .set({ avatarUrl: avatarUrl })
        .where(eq(authentication.id, result.userId));
    }

    // Send Validation Email if required
    if (!result.isVerified) {
      try {
        await sendOTPEmail(
          result.finalEmail, 
          validatedData.firstName || 'User', 
          result.verificationOTP, 
          'Verify Your Email Address (CHRMO Employee Portal)', 
          `Welcome to the CHRMO Employee Portal. Please verify your email address to complete your registration.`
        );
      } catch (err) {
        console.error('[AUTH] Registration Verification Email failed to send:', err);
      }
    }

    await AuditService.log({
      userId: result.userId as number, // Using result.userId directly from the insert statement
      module: 'AUTH',
      action: 'CREATE',
      details: { email: result.finalEmail, mode: isFinalizingSetup ? 'finalize-setup' : 'new' },
      req
    });

    res.status(201).json({
      success: true,
      message: result.isVerified 
        ? 'Employee portal setup complete. Account activated successfully.' 
        : 'Registration successful! Please check your email and verify your account.',
      data: {
        requiresVerification: !result.isVerified,
        email: result.finalEmail,
        maskedEmail: maskEmail(result.finalEmail)
      }
    });

  } catch (err: unknown) {
    const _error = err instanceof Error ? err : new Error(String(err));
    console.error('[REGISTER ERROR]', _error);

    // Zod validation handler
    if (_error.name === 'ZodError') {
      res.status(400).json({
        success: false,
        message: 'Invalid registration data',
        errors: (_error as z.ZodError).flatten()
      });
      return;
    }

    if (_error.message === 'Email already exists' || _error.message === 'This Employee ID is already registered') {
       res.status(409).json({ success: false, message: _error.message, data: null });
       return;
    }

    if ((_error as any).code === 'DUPLICATE_NAME') {
       res.status(409).json({ 
          success: false, 
          message: `An employee with this name is already registered. If this is a different person with the same name, please confirm to proceed.`, 
          code: 'DUPLICATE_NAME'
       });
       return;
    }

    res.status(500).json({ success: false, message: 'Server error during registration.', error: _error.message });
  }
};
