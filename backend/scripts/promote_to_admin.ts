import db from '../db/connection.js';

const promoteUser = async () => {
  const targetEmail = 'joshuapalero111@gmail.com';
  
  try {
    console.log(`Searching for user: ${targetEmail}...`);
    
    // First, verify the user exists again just to be safe
    const [users] = await db.query(
      'SELECT id, first_name, last_name, email, role FROM authentication WHERE email = ?',
      [targetEmail]
    );

    if ((users as any[]).length === 0) {
      console.error('User not found! Aborting.');
      process.exit(1);
    }

    const user = (users as any[])[0];
    console.log(`User found: ${user.first_name} ${user.last_name} (Current Role: ${user.role})`);

    if (user.role === 'admin') {
      console.log('User is already an admin. No changes needed.');
      process.exit(0);
    }

    console.log('Promoting user to admin...');
    
    // Update the role to admin
    await db.query(
      'UPDATE authentication SET role = ? WHERE email = ?',
      ['admin', targetEmail]
    );

    console.log('Success! User role updated to admin.');
    console.log('You should now be able to login without biometric enrollment.');
    
    process.exit(0);
  } catch (error) {
    console.error('Error promoting user:', error);
    process.exit(1);
  }
};

promoteUser();
