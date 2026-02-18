import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Seed an admin or employee account.
 * 
 * Usage:
 *   npx tsx scripts/seed_admin.ts                          → Creates default admin
 *   npx tsx scripts/seed_admin.ts --role=hr                → Creates HR account
 *   npx tsx scripts/seed_admin.ts --role=employee          → Creates employee account
 *   npx tsx scripts/seed_admin.ts --email=custom@mail.com  → Custom email
 *   npx tsx scripts/seed_admin.ts --name="John Doe"        → Custom name
 *   npx tsx scripts/seed_admin.ts --empid=CHRMO-HR-001     → Custom employee ID
 */
async function seedAdmin() {
    try {
        // Parse CLI arguments
        const args = process.argv.slice(2);
        const getArg = (key: string, fallback: string): string => {
            const found = args.find(a => a.startsWith(`--${key}=`));
            return found ? found.split('=').slice(1).join('=') : fallback;
        };

        const role = getArg('role', 'admin');
        const email = getArg('email', role === 'admin' ? 'admin@chrmo.gov.ph' : `${role}@chrmo.gov.ph`);
        const fullName = getArg('name', role === 'admin' ? 'System Administrator' : `${role.charAt(0).toUpperCase() + role.slice(1)} User`);
        const employeeId = getArg('empid', role === 'admin' ? 'CHRMO-ADMIN' : `CHRMO-${role.toUpperCase()}`);
        const department = getArg('dept', 'CHRMO');
        const password = getArg('password', 'Admin@1234');

        const nameParts = fullName.split(' ');
        const firstName = nameParts[0];
        const lastName = nameParts.slice(1).join(' ') || role.charAt(0).toUpperCase() + role.slice(1);

        // Validate role
        const validRoles = ['admin', 'hr', 'employee'];
        if (!validRoles.includes(role)) {
            console.error(`❌ Invalid role: "${role}". Must be one of: ${validRoles.join(', ')}`);
            return;
        }

        const connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            port: Number(process.env.DB_PORT) || 3306,
            database: process.env.DB_NAME || 'chrmo_db',
        });

        // Check if account already exists (by email or employee ID)
        const [existing] = await connection.query(
            'SELECT id, employee_id, email, role FROM authentication WHERE email = ? OR employee_id = ? LIMIT 1',
            [email, employeeId]
        ) as any[];

        if (existing.length > 0) {
            console.log('⚠️  Account already exists:');
            console.log(`   ID          : ${existing[0].id}`);
            console.log(`   Employee ID : ${existing[0].employee_id}`);
            console.log(`   Email       : ${existing[0].email}`);
            console.log(`   Role        : ${existing[0].role}`);
            console.log('\nNo changes made. Delete the existing account first if you want to re-seed.');
            await connection.end();
            return;
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Insert account
        await connection.query(
            `INSERT INTO authentication (employee_id, first_name, last_name, email, password_hash, role, department, is_verified)
             VALUES (?, ?, ?, ?, ?, ?, ?, 1)`,
            [employeeId, firstName, lastName, email, hashedPassword, role, department]
        );

        console.log(`✅ ${role.toUpperCase()} account created successfully!\n`);
        console.log(`   Employee ID : ${employeeId}`);
        console.log(`   Name        : ${firstName} ${lastName}`);
        console.log(`   Email       : ${email}`);
        console.log(`   Password    : ${password}`);
        console.log(`   Role        : ${role}`);
        console.log(`   Department  : ${department}`);
        console.log(`   Verified    : Yes (auto-verified)\n`);
        
        if (role === 'admin') {
            console.log('⚠️  IMPORTANT: Change the password after first login!');
        }

        await connection.end();
    } catch (err: any) {
        console.error('❌ Error seeding account:', err.message);
    }
}

seedAdmin();
