
import { db } from '../db/index.js';
import { systemSettings } from '../db/tables/common.js';
import { sql } from 'drizzle-orm';

const metadata = [
    {
        key: 'pds_civil_status',
        value: JSON.stringify(['Single', 'Married', 'Widowed', 'Separated', 'Annulled']),
        description: 'Options for Civil Status in PDS'
    },
    {
        key: 'pds_blood_types',
        value: JSON.stringify(["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]),
        description: 'Options for Blood Type in PDS'
    },
    {
        key: 'pds_citizenship',
        value: JSON.stringify(["Filipino", "Dual Citizenship"]),
        description: 'Options for Citizenship in PDS'
    },
    {
        key: 'pds_appointment_status',
        value: JSON.stringify(["Permanent", "Temporary", "Coterminous", "Contractual", "Casual"]),
        description: 'Options for Appointment Status in Work Experience'
    },
    {
        key: 'pds_ld_types',
        value: JSON.stringify(["Managerial", "Supervisory", "Technical", "Other"]),
        description: 'Options for Learning & Development Types'
    },
    {
        key: 'pds_govt_id_types',
        value: JSON.stringify(["UMID", "Driver's License", "Passport", "PRC ID", "Postal ID", "Others"]),
        description: 'Options for Government IDs'
    },
    {
        key: 'employment_appointment_types',
        value: JSON.stringify(['Permanent', 'Contractual', 'Casual', 'Job Order', 'Coterminous', 'Temporary', 'Contract of Service', 'JO', 'COS']),
        description: 'Official Appointment Types'
    },
    {
        key: 'employment_duty_types',
        value: JSON.stringify(['Standard', 'Irregular']),
        description: 'Types of Duties'
    },
    {
        key: 'employment_status',
        value: JSON.stringify(['Active', 'Probationary', 'Terminated', 'Resigned', 'On Leave', 'Suspended', 'Verbal Warning', 'Written Warning', 'Show Cause']),
        description: 'Employee Employment Status'
    },
    {
        key: 'pds_eligibility_types',
        value: JSON.stringify([
            { value: 'none', label: 'None / Not Applicable' },
            { value: 'csc_prof', label: 'CSC Professional' },
            { value: 'csc_sub', label: 'CSC Subprofessional' },
            { value: 'ra_1080', label: 'RA 1080 (Board/Bar)' },
            { value: 'special_laws', label: 'Special Laws' },
            { value: 'drivers_license', label: "Driver's License" },
            { value: 'tesda', label: 'TESDA NC II/III' },
            { value: 'others', label: 'Others' }
        ]),
        description: 'Options for CSC Eligibility Types'
    }
];

async function seed() {
    console.log('Seeding system metadata...');
    for (const item of metadata) {
        await db.insert(systemSettings)
            .values({
                settingKey: item.key,
                settingValue: item.value,
                description: item.description
            })
            .onDuplicateKeyUpdate({
                set: {
                    settingValue: item.value,
                    description: item.description
                }
            });
    }
    console.log('Metadata seeding complete.');
    process.exit(0);
}

seed().catch(err => {
    console.error('Seeding failed:', err);
    process.exit(1);
});
