import { db } from '../db/index.js';
import { dailyTimeRecords, authentication } from '../db/schema.js';
import { eq, sql, like } from 'drizzle-orm';

async function checkAttendance() {
    try {
        console.log("Searching for Cristina Pena...");
        const users = await db.select({
            id: authentication.id,
            employeeId: authentication.employeeId,
            firstName: authentication.firstName,
            lastName: authentication.lastName
        }).from(authentication).where(like(authentication.firstName, '%Cristina%'));

        if (users.length === 0) {
            console.log("Cristina Pena not found.");
            process.exit(0);
            return;
        }

        const employeeId = users[0].employeeId;
        console.log(`Found: ${users[0].firstName} ${users[0].lastName} (ID: ${employeeId})`);

        const dtrs = await db.select({
            date: dailyTimeRecords.date,
            status: dailyTimeRecords.status,
            lateMinutes: dailyTimeRecords.lateMinutes,
            undertimeMinutes: dailyTimeRecords.undertimeMinutes
        }).from(dailyTimeRecords).where(eq(dailyTimeRecords.employeeId, employeeId));

        let lates = 0;
        let undertimes = 0;
        let absences = 0;
        let present = 0;

        // Count for the entire record
        dtrs.forEach(record => {
            const isStatusLate = record.status === 'Late' || record.status === 'Late/Undertime';
            const isStatusUndertime = record.status === 'Undertime' || record.status === 'Late/Undertime';
            const lateMins = record.lateMinutes || 0;
            const underMins = record.undertimeMinutes || 0;

            if (isStatusLate || lateMins > 0) lates++;
            if (isStatusUndertime || underMins > 0) undertimes++;
            if (record.status === 'Absent' || record.status === 'AWOL') absences++;
            if (record.status === 'Present') present++;
        });

        console.log(`Total Records: ${dtrs.length}`);
        console.log(`Lates: ${lates}`);
        console.log(`Undertime: ${undertimes}`);
        console.log(`Absent: ${absences}`);
        console.log(`Present: ${present}`);

        // Let's also group by month to give a clearer picture
        const monthlyStats: Record<string, any> = {};
        dtrs.forEach(record => {
            const month = record.date.substring(0, 7); // YYYY-MM
            if (!monthlyStats[month]) {
                monthlyStats[month] = { lates: 0, undertimes: 0, absences: 0, present: 0 };
            }
            const isStatusLate = record.status === 'Late' || record.status === 'Late/Undertime';
            const isStatusUndertime = record.status === 'Undertime' || record.status === 'Late/Undertime';
            const lateMins = record.lateMinutes || 0;
            const underMins = record.undertimeMinutes || 0;

            if (isStatusLate || lateMins > 0) monthlyStats[month].lates++;
            if (isStatusUndertime || underMins > 0) monthlyStats[month].undertimes++;
            if (record.status === 'Absent' || record.status === 'AWOL') monthlyStats[month].absences++;
            if (record.status === 'Present') monthlyStats[month].present++;
        });

        console.log("\\nMonthly Breakdown:");
        console.table(monthlyStats);

    } catch (error) {
        console.error("Error:", error);
    } finally {
        process.exit(0);
    }
}

checkAttendance();
