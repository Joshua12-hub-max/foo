import db from '../index.js';

/**
 * Migration: Create Personal Data Sheet (PDS) Tables (CS Form 212)
 * 
 * Normalizes employee data into specific tables linked to 'authentication' (employee_id/id).
 */

const migration = async (): Promise<void> => {
  console.log('🚀 Starting PDS Tables Migration...');

  try {
    // 1. Family Background (Spouse, Children, Parents)
    // Note: Parents and Spouse are often single-entry, but Children are multiple.
    // For simplicity and normalization, we can have a generic `pds_family_background` or split them.
    // Given the PDS structure, Spouse and Parents are usually 1:1, but Children are 1:Many.
    // Let's creat a `pds_family_members` table.

    await db.query(`
      CREATE TABLE IF NOT EXISTS pds_family_members (
        id INT AUTO_INCREMENT PRIMARY KEY,
        employee_id INT NOT NULL,
        member_type ENUM('Spouse', 'Father', 'Mother', 'Child') NOT NULL,
        
        -- Common fields
        last_name VARCHAR(100),
        first_name VARCHAR(100),
        middle_name VARCHAR(100),
        name_extension VARCHAR(10), -- Jr., Sr.
        
        -- Spouse specific
        occupation VARCHAR(255),
        employer_business_name VARCHAR(255),
        business_address VARCHAR(255),
        telephone_no VARCHAR(50),
        
        -- Child specific
        date_of_birth DATE,
        
        -- Mother specific
        maiden_name VARCHAR(255),
        
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_employee (employee_id),
        FOREIGN KEY (employee_id) REFERENCES authentication(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Created pds_family_members table');

    // 2. Educational Background
    await db.query(`
      CREATE TABLE IF NOT EXISTS pds_educational_background (
        id INT AUTO_INCREMENT PRIMARY KEY,
        employee_id INT NOT NULL,
        level ENUM('Elementary', 'Secondary', 'Vocational', 'College', 'Graduate Studies') NOT NULL,
        school_name VARCHAR(255) NOT NULL,
        degree_course VARCHAR(255), -- Basic Education / Degree / Course
        period_from INT, -- Year
        period_to INT,   -- Year
        highest_level_units VARCHAR(100), -- Highest Level / Units Earned
        year_graduated INT,
        scholarship_honors VARCHAR(255),
        
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_employee (employee_id),
        FOREIGN KEY (employee_id) REFERENCES authentication(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Created pds_educational_background table');

    // 3. Civil Service Eligibility
    await db.query(`
      CREATE TABLE IF NOT EXISTS pds_civil_service_eligibility (
        id INT AUTO_INCREMENT PRIMARY KEY,
        employee_id INT NOT NULL,
        career_service VARCHAR(255) NOT NULL COMMENT 'e.g., PD 907, RA 1080',
        rating DECIMAL(5,2),
        date_of_examination DATE,
        place_of_examination VARCHAR(255),
        license_number VARCHAR(50),
        license_validity DATE,
        
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_employee (employee_id),
        FOREIGN KEY (employee_id) REFERENCES authentication(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Created pds_civil_service_eligibility table');

    // 4. Work Experience
    await db.query(`
      CREATE TABLE IF NOT EXISTS pds_work_experience (
        id INT AUTO_INCREMENT PRIMARY KEY,
        employee_id INT NOT NULL,
        date_from DATE NOT NULL,
        date_to DATE, -- NULL means 'Present'
        position_title VARCHAR(255) NOT NULL,
        department_agency_office_company VARCHAR(255) NOT NULL, -- Department / Agency / Office / Company
        monthly_salary DECIMAL(15,2),
        salary_grade VARCHAR(10), -- SG-XX, or applicable
        status_of_appointment VARCHAR(100), -- e.g., Permanent, Contractual
        is_government_service BOOLEAN DEFAULT FALSE,
        
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_employee (employee_id),
        FOREIGN KEY (employee_id) REFERENCES authentication(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Created pds_work_experience table');

    // 5. Voluntary Work
    await db.query(`
      CREATE TABLE IF NOT EXISTS pds_voluntary_work (
        id INT AUTO_INCREMENT PRIMARY KEY,
        employee_id INT NOT NULL,
        organization_name VARCHAR(255) NOT NULL, -- Name & Address of Organization
        organization_address VARCHAR(255),
        date_from DATE,
        date_to DATE,
        number_of_hours INT,
        position_nature_of_work VARCHAR(255),
        
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_employee (employee_id),
        FOREIGN KEY (employee_id) REFERENCES authentication(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Created pds_voluntary_work table');

    // 6. Learning and Development (Training Programs)
    await db.query(`
      CREATE TABLE IF NOT EXISTS pds_learning_development (
        id INT AUTO_INCREMENT PRIMARY KEY,
        employee_id INT NOT NULL,
        title_of_learning VARCHAR(255) NOT NULL,
        date_from DATE,
        date_to DATE,
        number_of_hours INT,
        type_of_ld VARCHAR(100), -- e.g., Managerial, Supervisory, Technical
        conducted_by VARCHAR(255),
        
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_employee (employee_id),
        FOREIGN KEY (employee_id) REFERENCES authentication(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Created pds_learning_development table');

    // 7. Other Information (Skills, Hobbies, Non-Academic Distinctions, Memberships)
    await db.query(`
      CREATE TABLE IF NOT EXISTS pds_other_information (
        id INT AUTO_INCREMENT PRIMARY KEY,
        employee_id INT NOT NULL,
        type ENUM('Skill/Hobby', 'Recognition', 'Membership') NOT NULL,
        description VARCHAR(255) NOT NULL, -- The detail text
        
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_employee (employee_id),
        FOREIGN KEY (employee_id) REFERENCES authentication(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Created pds_other_information table');

    // 8. References
    await db.query(`
      CREATE TABLE IF NOT EXISTS pds_references (
        id INT AUTO_INCREMENT PRIMARY KEY,
        employee_id INT NOT NULL,
        name VARCHAR(255) NOT NULL,
        address VARCHAR(255),
        tel_no VARCHAR(50),
        
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_employee (employee_id),
        FOREIGN KEY (employee_id) REFERENCES authentication(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Created pds_references table');


    console.log('\n🎉 PDS Tables Migration completed successfully!');

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
