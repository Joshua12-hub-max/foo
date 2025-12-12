import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Base upload directory
const baseUploadDir = path.join(__dirname, '../uploads');

// Ensure base directory exists
if (!fs.existsSync(baseUploadDir)) {
    fs.mkdirSync(baseUploadDir, { recursive: true });
}

// Factory function to create an uploader for a specific subfolder
const createUploader = (subfolder) => {
    const targetDir = path.join(baseUploadDir, subfolder);

    // Ensure subfolder exists
    if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
    }

    const storage = multer.diskStorage({
        destination: function (req, file, cb) {
            cb(null, targetDir);
        },
        filename: function (req, file, cb) {
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
            // Sanitize original name
            const sanitizedName = file.originalname.replace(/\s+/g, '_');
            cb(null, `${subfolder}-${uniqueSuffix}${path.extname(sanitizedName)}`);
        }
    });

    const fileFilter = (req, file, cb) => {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel'];

        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only Images, PDFs, and Excel files are allowed.'), false);
        }
    };

    return multer({ 
        storage: storage, 
        fileFilter: fileFilter, 
        limits: { fileSize: 10 * 1024 * 1024 } // Increased limit to 10MB
    });
};

// Export specific uploaders
export const uploadAvatar = createUploader('avatars');
export const uploadLeave = createUploader('leaves');
export const uploadUndertime = createUploader('undertime');
export const uploadResume = createUploader('resumes');
export const uploadGeneral = createUploader('general');

// Default export for backward compatibility (maps to 'general')
export default uploadGeneral;
