import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import jwt from 'jsonwebtoken';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '.env') });

console.log('--- Auth Diagnostic ---');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('JWT_SECRET exists:', !!process.env.JWT_SECRET);
console.log('JWT_SECRET length:', process.env.JWT_SECRET?.length);

const testPayload = { id: 1, employeeId: 'Emp-001', role: 'Administrator' };
const secret = process.env.JWT_SECRET || 'fallback';

try {
  const token = jwt.sign(testPayload, secret, { expiresIn: '1d' });
  console.log('Test token generated successfully');
  
  jwt.verify(token, secret, (err, decoded) => {
    if (err) {
      console.error('Test verification failed:', err.message);
    } else {
      console.log('Test verification successful:', decoded);
    }
  });
} catch (error) {
  console.error('Error during diagnostic:', error);
}
