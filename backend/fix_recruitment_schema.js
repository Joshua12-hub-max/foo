import { db } from './db/index.js';
import { sql } from 'drizzle-orm';

async function fixSchema() {
    console.log('Fixing schema mismatches...');
    
    try {
        // Fix authentication table
        const authColumns = [
            { name: 'related_third_degree', type: "VARCHAR(10) DEFAULT 'No'" },
            { name: 'related_third_details', type: "TEXT" },
            { name: 'related_fourth_degree', type: "VARCHAR(10) DEFAULT 'No'" },
            { name: 'related_fourth_details', type: "TEXT" },
            { name: 'found_guilty_admin', type: "VARCHAR(10) DEFAULT 'No'" },
            { name: 'found_guilty_details', type: "TEXT" },
            { name: 'criminally_charged', type: "VARCHAR(10) DEFAULT 'No'" },
            { name: 'date_filed', type: "DATE" },
            { name: 'status_of_case', type: "TEXT" },
            { name: 'convicted_crime', type: "VARCHAR(10) DEFAULT 'No'" },
            { name: 'convicted_details', type: "TEXT" },
            { name: 'separated_from_service', type: "VARCHAR(10) DEFAULT 'No'" },
            { name: 'separated_details', type: "TEXT" },
            { name: 'election_candidate', type: "VARCHAR(10) DEFAULT 'No'" },
            { name: 'election_details', type: "TEXT" },
            { name: 'resigned_to_promote', type: "VARCHAR(10) DEFAULT 'No'" },
            { name: 'resigned_details', type: "TEXT" },
            { name: 'immigrant_status', type: "VARCHAR(10) DEFAULT 'No'" },
            { name: 'immigrant_details', type: "TEXT" },
            { name: 'indigenous_member', type: "VARCHAR(10) DEFAULT 'No'" },
            { name: 'indigenous_details', type: "TEXT" },
            { name: 'person_with_disability', type: "VARCHAR(10) DEFAULT 'No'" },
            { name: 'disability_id_no', type: "VARCHAR(100)" },
            { name: 'solo_parent', type: "VARCHAR(10) DEFAULT 'No'" },
            { name: 'solo_parent_id_no', type: "VARCHAR(100)" },
            { name: 'dual_country', type: "VARCHAR(100)" },
            { name: 'govt_id_type', type: "VARCHAR(100)" },
            { name: 'govt_id_no', type: "VARCHAR(100)" },
            { name: 'govt_id_issuance', type: "VARCHAR(255)" }
        ];

        console.log('Updating authentication table...');
        for (const col of authColumns) {
            try {
                await db.execute(sql.raw(`ALTER TABLE authentication ADD COLUMN ${col.name} ${col.type}`));
                console.log(`Added authentication.${col.name}`);
            } catch (err: any) {
                if (!err.message.includes('Duplicate column name')) {
                    console.error(`Error adding authentication.${col.name}:`, err.message);
                }
            }
        }

        // Fix recruitment_applicants table
        const recruitmentColumns = [
            { name: 'is_email_verified', type: "TINYINT(1) DEFAULT 0" },
            { name: 'verification_token', type: "VARCHAR(6)" }
        ];

        console.log('Updating recruitment_applicants table...');
        for (const col of recruitmentColumns) {
            try {
                await db.execute(sql.raw(`ALTER TABLE recruitment_applicants ADD COLUMN ${col.name} ${col.type}`));
                console.log(`Added recruitment_applicants.${col.name}`);
            } catch (err: any) {
                if (!err.message.includes('Duplicate column name')) {
                    console.error(`Error adding recruitment_applicants.${col.name}:`, err.message);
                }
            }
        }
        
        console.log('Fix completed successfully.');
    } catch (error) {
        console.error('Fix failed:', error);
    } finally {
        process.exit(0);
    }
}

fixSchema();
