import { manualCheckEmails } from '../services/emailReceiverService.ts';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load env vars
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

console.log('Starting manual email check...');

manualCheckEmails()
  .then((result) => {
    console.log('Check complete:', result);
    process.exit(0);
  })
  .catch((err) => {
    console.error('Check failed:', err);
    process.exit(1);
  });
