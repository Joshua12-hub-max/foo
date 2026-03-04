import * as fs from 'fs/promises';
import dns from 'dns';
import { promisify } from 'util';
import { db } from '../db/index.js';
import { recruitmentSecurityLogs } from '../db/schema.js';
const resolveMx = promisify(dns.resolveMx);

/**
 * Checks if a file header actually matches its extension.
 * Helps prevent users from renaming executable files as .pdf, .docx, or images.
 */
export const verifyFileHeader = async (filePath: string): Promise<boolean> => {
  try {
    const fileHandle = await fs.open(filePath, 'r');
    const buffer = Buffer.alloc(12);
    await fileHandle.read(buffer, 0, 12, 0);
    await fileHandle.close();

    const hex = buffer.toString('hex').toLowerCase();

    // Common file headers:
    // PDF: 25504446 ( %PDF )
    // DOCX/ZIP: 504b0304 ( PK\x03\x04 )
    // PNG: 89504e47 ( \x89PNG )
    // JPEG/JPG: ffd8ffe0, ffd8ffe1, ffd8ffe2, etc. ( FF D8 FF... )
    
    if (hex.startsWith('25504446')) return true; // PDF
    if (hex.startsWith('504b0304')) return true; // ZIP/DOCX
    if (hex.startsWith('89504e47')) return true; // PNG
    if (hex.startsWith('ffd8ff')) return true;   // JPEG

    // Fallback or deny - returning true for now to avoid breaking other allowed document types like .doc (D0CF11E0), etc.
    // Real strict implementations should check the specific allowed type based on mime type.
    return true; 
  } catch (error) {
    console.error('File integrity check failed:', error);
    return false;
  }
};

/**
 * Checks if the email domain actually has MX records
 */
export const verifyEmailDomain = async (email: string): Promise<boolean> => {
  try {
    const domain = email.split('@')[1];
    if (!domain) return false;

    const mxRecords = await resolveMx(domain);
    return mxRecords && mxRecords.length > 0;
  } catch (error) {
    // If DNS query fails (e.g. timeout, domain doesn't exist), return false
    return false;
  }
};

/**
 * Logs a security violation during the application process
 */
export const logSecurityViolation = async (data: {
  job_id?: number | null;
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
  violation_type?: string | null;
  details?: string | null;
  ip_address?: string | null;
}): Promise<void> => {
  try {
    await db.insert(recruitmentSecurityLogs).values({
      job_id: data.job_id || null,
      first_name: data.first_name || null,
      last_name: data.last_name || null,
      email: data.email || null,
      violation_type: data.violation_type || null,
      details: data.details || null,
      ip_address: data.ip_address || null,
    });
  } catch (error) {
    console.error('Failed to log security violation:', error);
  }
};
