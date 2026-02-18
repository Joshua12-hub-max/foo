import db from '../index.js';

/**
 * Migration: Create PDS Linked Tables (Part II - VIII)
 * 
 * Stores the list-based data for CS Form 212.
 */

const migration = async (): Promise<void> => {
  console.log('🚀 Starting PDS Linked Tables Migration...');

  try {
    // 1. Family Background (Children only - Spouse/Parents can be 1:1 if desired, but 1:Many is safer)
    // Actually, PDS has specific fields for Spouse and Parents (Surame, First Name, etc).
    // Let's store them in a `pds_family` table with a 'relation_type' to keep it clean.
    await db.query(`
      CREATE TABLE IF NOT EXISTS pds_family (
        id INT AUTO_INCREMENT PRIMARY KEY,
        employee_id INT NOT NULL,
        relation_type ENUM('Spouse', 'Father', 'Mother', 'Child') NOT NULL,
        last_name VARCHAR(100),
        first_name VARCHAR(100),
        middle_name VARCHAR(100),
        name_extension VARCHAR(10),
        occupation VARCHAR(100),
        employer VARCHAR(100),
        business_address VARCHAR(255),
        telephone_no VARCHAR(50),
        date_of_birth DATE NULL COMMENT 'Required for Children',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_emp (employee_id),
        FOREIGN KEY (employee_id) REFERENCES authentication(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Created pds_family');

    // 2. Educational Background
    await db.query(`
      CREATE TABLE IF NOT EXISTS pds_education (
        id INT AUTO_INCREMENT PRIMARY KEY,
        employee_id INT NOT NULL,
        level ENUM('Elementary', 'Secondary', 'Vocational', 'College', 'Graduate Studies') NOT NULL,
        school_name VARCHAR(255) NOT NULL,
        degree_course VARCHAR(255),
        year_graduated INT,
        units_earned VARCHAR(50),
        date_from INT,
        date_to INT,
        honors VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (employee_id) REFERENCES authentication(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Created pds_education');

    // 3. Civil Service Eligibility
    await db.query(`
      CREATE TABLE IF NOT EXISTS pds_eligibility (
        id INT AUTO_INCREMENT PRIMARY KEY,
        employee_id INT NOT NULL,
        eligibility_name VARCHAR(255) NOT NULL,
        rating DECIMAL(5,2),
        exam_date DATE,
        exam_place VARCHAR(255),
        license_number VARCHAR(50),
        validity_date DATE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (employee_id) REFERENCES authentication(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Created pds_eligibility');

    // 4. Work Experience
    await db.query(`
      CREATE TABLE IF NOT EXISTS pds_work_experience (
        id INT AUTO_INCREMENT PRIMARY KEY,
        employee_id INT NOT NULL,
        date_from DATE NOT NULL,
        date_to DATE NULL COMMENT 'NULL = Present',
        position_title VARCHAR(255) NOT NULL,
        company_name VARCHAR(255) NOT NULL,
        monthly_salary DECIMAL(12,2),
        salary_grade VARCHAR(20),
        appointment_status VARCHAR(50),
        is_government BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (employee_id) REFERENCES authentication(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Created pds_work_experience');

    // 5. Voluntary Work
    await db.query(`
      CREATE TABLE IF NOT EXISTS pds_voluntary_work (
        id INT AUTO_INCREMENT PRIMARY KEY,
        employee_id INT NOT NULL,
        organization_name VARCHAR(255) NOT NULL,
        address VARCHAR(255),
        date_from DATE,
        date_to DATE,
        hours_number INT,
        position VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (employee_id) REFERENCES authentication(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Created pds_voluntary_work');

    // 6. Learning & Development
    await db.query(`
      CREATE TABLE IF NOT EXISTS pds_learning_development (
        id INT AUTO_INCREMENT PRIMARY KEY,
        employee_id INT NOT NULL,
        title VARCHAR(255) NOT NULL,
        date_from DATE,
        date_to DATE,
        hours_number INT,
        type_of_ld VARCHAR(50) COMMENT 'Managerial, Supervisory, Technical, etc.',
        conducted_by VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (employee_id) REFERENCES authentication(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Created pds_learning_development');

    // 7. Other Info
    await db.query(`
      CREATE TABLE IF NOT EXISTS pds_other_info (
        id INT AUTO_INCREMENT PRIMARY KEY,
        employee_id INT NOT NULL,
        type ENUM('Skill', 'Recognition', 'Membership') NOT NULL,
        description VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (employee_id) REFERENCES authentication(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Created pds_other_info');

    // 8. References
    await db.query(`
      CREATE TABLE IF NOT EXISTS pds_references (
        id INT AUTO_INCREMENT PRIMARY KEY,
        employee_id INT NOT NULL,
        name VARCHAR(255) NOT NULL,
        address VARCHAR(255),
        tel_no VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (employee_id) REFERENCES authentication(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Created pds_references');


    console.log('\n🎉 PDS Linked Tables Migration completed successfully!');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
};

// Run migration
migration()
  .then(() => {
    console.log('\n✅ Migration script finished');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Migration script failed:', error);
    process.exit(1);
  });

export default migration;
