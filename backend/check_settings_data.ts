
import { db } from './db/index.js';
import { systemSettings } from './db/tables/common.js';
import { inArray } from 'drizzle-orm';

async function checkSettings() {
    const keys = [
        'employment_appointment_types',
        'employment_duty_types'
    ];

    const settings = await db.select()
        .from(systemSettings)
        .where(inArray(systemSettings.settingKey, keys));

    console.log('Settings found:', JSON.stringify(settings, null, 2));
    process.exit(0);
}

checkSettings().catch(err => {
    console.error(err);
    process.exit(1);
});
