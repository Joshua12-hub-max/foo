
import { db } from '../db/index.js';
import { authentication } from '../db/schema.js';
import bcrypt from 'bcryptjs';

const seedAdmin = async () => {
    try {
        console.log('Seeding Default Admin User...');

        const password = 'Judith@2026';
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        await db.insert(authentication).values({
            firstName: 'Judith',
            lastName: 'Guevarra',
            email: 'judith.guevarra@nebr.gov',
            role: 'admin',
            employeeId: 'ADMIN-001',
            passwordHash: hashedPassword,
            isVerified: 1,
            department: 'HR Department',
            employmentStatus: 'Active',
            employmentType: 'Permanent'
        });

        console.log('✅ Default Admin User created: judith.guevarra@nebr.gov / Judith@2026');
        process.exit(0);
    } catch (error) {
        console.error('❌ Seeding failed:', error);
        process.exit(1);
    }
};

seedAdmin();
