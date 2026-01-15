import multer, { StorageEngine, FileFilterCallback, Multer } from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import type { Request } from 'express';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Base upload directory
const baseUploadDir = path.join(__dirname, '../uploads');

// Ensure base directory exists
if (!fs.existsSync(baseUploadDir)) {
  fs.mkdirSync(baseUploadDir, { recursive: true });
}

// Allowed file types and extensions
const ALLOWED_MIME_TYPES: string[] = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel'
];

const ALLOWED_EXTENSIONS: string[] = ['.jpg', '.jpeg', '.png', '.webp', '.pdf', '.xlsx', '.xls'];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

/**
 * Factory function to create an uploader for a specific subfolder
 * @param subfolder - Name of the subfolder within uploads directory
 */
const createUploader = (subfolder: string): Multer => {
  const targetDir = path.join(baseUploadDir, subfolder);

  // Ensure subfolder exists
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  const storage: StorageEngine = multer.diskStorage({
    destination: (_req: Request, _file: Express.Multer.File, cb: (error: Error | null, destination: string) => void): void => {
      cb(null, targetDir);
    },
    filename: (_req: Request, file: Express.Multer.File, cb: (error: Error | null, filename: string) => void): void => {
      const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      // Sanitize original name
      const sanitizedName = file.originalname.replace(/\s+/g, '_');
      cb(null, `${subfolder}-${uniqueSuffix}${path.extname(sanitizedName)}`);
    }
  });

  const fileFilter = (
    _req: Request,
    file: Express.Multer.File,
    cb: FileFilterCallback
  ): void => {
    const ext = path.extname(file.originalname).toLowerCase();

    if (ALLOWED_MIME_TYPES.includes(file.mimetype) && ALLOWED_EXTENSIONS.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type or extension. Only Images, PDFs, and Excel files are allowed.'));
    }
  };

  return multer({
    storage,
    fileFilter,
    limits: { fileSize: MAX_FILE_SIZE }
  });
};

// Export specific uploaders
export const uploadAvatar: Multer = createUploader('avatars');
export const uploadLeave: Multer = createUploader('leaves');
export const uploadUndertime: Multer = createUploader('undertime');
export const uploadResume: Multer = createUploader('resumes');
export const uploadGeneral: Multer = createUploader('general');

// Default export for backward compatibility (maps to 'general')
export default uploadGeneral;
