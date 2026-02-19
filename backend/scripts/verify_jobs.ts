
import { db } from '../db/index.js';
import { recruitmentJobs } from '../db/schema.js';
import { count } from 'drizzle-orm';

const verify = async () => {
  try {
    const [result] = await db.select({ count: count() }).from(recruitmentJobs);
    console.log('Total Jobs:', result.count);

    const jobs = await db.query.recruitmentJobs.findMany({
      limit: 5,
      columns: {
        id: true,
        title: true,
        status: true
      }
    });
    console.log('Sample Jobs:', jobs);
    process.exit(0);
  } catch (error) {
    console.error('Error verifying jobs:', error);
    process.exit(1);
  }
};

verify();
