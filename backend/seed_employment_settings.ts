
import { db } from './db/index.js';
import { systemSettings } from './db/tables/common.js';

async function seedSettings() {
    const settings = [
        {
            settingKey: 'employment_duty_types',
            settingValue: JSON.stringify(['Standard', 'Irregular']),
            description: 'Types of duties for employees'
        },
        {
            settingKey: 'employment_appointment_types',
            settingValue: JSON.stringify(['Permanent', 'Contractual', 'Casual', 'Job Order', 'Coterminous', 'Temporary', 'Contract of Service', 'JO', 'COS']),
            description: 'Appointment types for employees'
        },
        {
            settingKey: 'pds_civil_status',
            settingValue: JSON.stringify(['Single', 'Married', 'Widowed', 'Separated', 'Annulled']),
            description: 'PDS Civil Status options'
        },
        {
            settingKey: 'pds_blood_types',
            settingValue: JSON.stringify(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']),
            description: 'PDS Blood Type options'
        },
        {
            settingKey: 'employment_status',
            settingValue: JSON.stringify(['Active', 'Probationary', 'On Leave', 'Suspended', 'Verbal Warning', 'Written Warning', 'Show Cause', 'Terminated', 'Resigned']),
            description: 'Employment status options'
        },
        {
            settingKey: 'pds_gender',
            settingValue: JSON.stringify(['Male', 'Female']),
            description: 'PDS Gender options'
        },
        {
            settingKey: 'pds_eligibility_types',
            settingValue: JSON.stringify([
                { value: "none", label: "Not Applicable / None" },
                { value: "csc_prof", label: "Career Service (Professional)" },
                { value: "csc_sub", label: "Career Service (Sub-Professional)" },
                { value: "ra_1080", label: "Board / Bar (RA 1080)" },
                { value: "special_laws", label: "Special Laws (CES/CSEE)" },
                { value: "drivers_license", label: "Driver's License" },
                { value: "tesda", label: "Skill / TESDA Certificate" },
                { value: "others", label: "Other Eligibility / Certification" }
            ]),
            description: 'PDS Eligibility options'
        },
        {
            settingKey: 'pds_relationship_types',
            settingValue: JSON.stringify(['Spouse', 'Father', 'Mother', 'Child', 'Sibling', 'Grandparent', 'Grandchild', 'In-Law']),
            description: 'PDS Relationship types for family'
        }
    ];

    console.log('Seeding settings...');
    
    for (const s of settings) {
        await db.insert(systemSettings)
            .values(s)
            .onDuplicateKeyUpdate({
                set: {
                    settingValue: s.settingValue,
                    description: s.description
                }
            });
    }

    console.log('Settings seeded successfully');
    process.exit(0);
}

seedSettings().catch(err => {
    console.error(err);
    process.exit(1);
});
