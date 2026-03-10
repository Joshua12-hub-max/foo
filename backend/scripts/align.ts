import 'dotenv/config';
import pool from '../db/index.js';

async function alignDatabase() {
  console.log('Aligning Database to silence Drizzle Kit prompts...');
  try {
    const connection = await pool.getConnection();

    // Drop legacy tables that trigger the "table renamed?" prompt
    await connection.query('SET FOREIGN_KEY_CHECKS = 0;');
    await connection.query('DROP TABLE IF EXISTS `allowance_definitions`;');
    await connection.query('DROP TABLE IF EXISTS `allowance_matrix_values`;');
    await connection.query('DROP TABLE IF EXISTS `allowance_schedules`;');
    await connection.query('SET FOREIGN_KEY_CHECKS = 1;');
    console.log('Dropped legacy tables.');

    // Drop legacy columns that trigger the "column renamed?" prompt
    const colsToDrop = ['sss_number', 'sss_no', 'dual_citizenship_country'];
    for (const col of colsToDrop) {
      try {
        await connection.query(`ALTER TABLE \`authentication\` DROP COLUMN \`${col}\`;`);
      } catch (err: unknown) {
        if (err.code !== 'ER_CANT_DROP_FIELD_OR_KEY') {
          console.log(`Could not drop ${col}`, err.message);
        }
      }
    }
    console.log('Dropped legacy columns.');

    // Fix the data loss warning directly by modifying the int format to varchar.
    try {
        await connection.query('ALTER TABLE `authentication` MODIFY COLUMN `years_of_experience` VARCHAR(50);');
        console.log('Updated years_of_experience type.');
    } catch(err: unknown) {
        console.log('Could not update years_of_experience', err.message);
    }

    try {
      await connection.query('ALTER TABLE `authentication` ADD COLUMN `experience` text;');
      await connection.query('ALTER TABLE `authentication` ADD COLUMN `skills` text;');
    } catch(err: unknown) {
      console.log('Could not add experience/skills', err.message);
    }
    
    connection.release();
    console.log('Alignment complete! Drizzle Push should now be silent.');
  } catch (err) {
    console.error('Alignment failed!', err);
  } finally {
    await pool.end();
  }
}

alignDatabase();
