
import db from './db_connection.ts';
import bcrypt from 'bcryptjs';

const email = 'capstone682@gmail.com';
const passwordToCheck = '12345';

const check = async () => {
  try {
    console.log(`Checking user: ${email}...`);
    const [users] = await db.query<any[]>('SELECT id, employee_id, email, password_hash, is_verified, role, two_factor_enabled FROM authentication WHERE email = ?', [email]);
    
    if (users.length === 0) {
      console.log('User NOT FOUND.');
    } else {
      users.forEach(u => {
        console.log('User Record:', {
            id: u.id,
            employee_id: u.employee_id,
            email: u.email,
            is_verified: u.is_verified,
            role: u.role,
            two_factor_enabled: u.two_factor_enabled,
            has_password: !!u.password_hash
        });
      });

      const user = users[0];
      const [fingerprints] = await db.query<any[]>('SELECT * FROM fingerprints WHERE employee_id = ?', [user.employee_id]);
      console.log(`Fingerprint records for ${user.employee_id}:`, fingerprints);

      if (user.password_hash) {
          const isMatch = await bcrypt.compare(passwordToCheck, user.password_hash);
          console.log(`PASSWORD CHECK ('${passwordToCheck}'): ${isMatch ? 'MATCHED ✅' : 'FAILED ❌'}`);
      } else {
          console.log('User has no password hash set.');
      }
    }
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

check();
