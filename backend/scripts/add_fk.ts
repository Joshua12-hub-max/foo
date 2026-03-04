import 'dotenv/config';
import pool from '../db/index.js';

async function run(): Promise<void> {
  const conn = await pool.getConnection();
  try {
    await conn.query(
      'ALTER TABLE `performance_reviews` ADD CONSTRAINT `perf_reviews_cycle_id_fk` FOREIGN KEY (`review_cycle_id`) REFERENCES `performance_review_cycles`(`id`) ON DELETE SET NULL ON UPDATE NO ACTION'
    );
    console.log('FK constraint created: perf_reviews_cycle_id_fk');
  } catch (err: unknown) {
    const dbErr = err as { code?: string; message?: string };
    if (dbErr.code === 'ER_DUP_KEYNAME' || dbErr.code === 'ER_FK_DUP_NAME') {
      console.log('FK already exists');
    } else {
      console.error('Error:', dbErr.message);
    }
  }
  conn.release();
  await pool.end();
}

run();
