import db from '../connection.js';
import type { ResultSetHeader } from 'mysql2/promise';

/**
 * Migration: Plantilla Compliance System (CSC/DBM/COA)
 * 
 * Creates the following tables:
 * 1. qualification_standards - Master QS library for positions
 * 2. nepotism_relationships - Family relationship tracker
 * 3. step_increment_tracker - Automated step increment monitoring
 * 4. budget_allocation - PS budget tracking per department
 * 5. position_publications - CSC Form 9 publication tracking
 * 
 * Modifies existing tables:
 * - plantilla_positions: Add ordinance, QS, and budget fields
 * - authentication: Add eligibility and education tracking fields
 */

const migration = async (): Promise<void> => {
  console.log('🚀 Starting Plantilla Compliance System Migration...');

  try {
    // 1. Qualification Standards Table
    await db.query(`
      CREATE TABLE IF NOT EXISTS qualification_standards (
        id INT AUTO_INCREMENT PRIMARY KEY,
        position_title VARCHAR(255) NOT NULL,
        salary_grade INT NOT NULL,
        education_requirement TEXT NOT NULL COMMENT 'e.g., Bachelor of Science in Accountancy',
        experience_years INT DEFAULT 0 COMMENT 'Minimum years of relevant experience',
        training_hours INT DEFAULT 0 COMMENT 'Required training hours',
        eligibility_required VARCHAR(255) NOT NULL COMMENT 'e.g., RA 1080 (CPA), CS Professional, CS Sub-Professional',
        competency_requirements TEXT COMMENT 'Additional competencies or skills required',
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY unique_position_sg (position_title, salary_grade),
        INDEX idx_position_title (position_title),
        INDEX idx_salary_grade (salary_grade)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Created qualification_standards table');

    // 2. Nepotism Relationships Table
    await db.query(`
      CREATE TABLE IF NOT EXISTS nepotism_relationships (
        id INT AUTO_INCREMENT PRIMARY KEY,
        employee_id_1 INT NOT NULL COMMENT 'First employee ID',
        employee_id_2 INT NOT NULL COMMENT 'Second employee ID (related person)',
        relationship_type ENUM(
          'Parent', 'Child', 'Sibling', 'Spouse', 
          'Uncle/Aunt', 'Nephew/Niece', 'Cousin', 
          'Grandparent', 'Grandchild', 'In-Law'
        ) NOT NULL,
        degree INT NOT NULL COMMENT '1st, 2nd, 3rd, or 4th degree relationship',
        verified_by INT COMMENT 'Admin who verified this relationship',
        verified_at TIMESTAMP NULL,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_employee_1 (employee_id_1),
        INDEX idx_employee_2 (employee_id_2),
        INDEX idx_degree (degree),
        FOREIGN KEY (employee_id_1) REFERENCES authentication(id) ON DELETE CASCADE,
        FOREIGN KEY (employee_id_2) REFERENCES authentication(id) ON DELETE CASCADE,
        FOREIGN KEY (verified_by) REFERENCES authentication(id) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Created nepotism_relationships table');

    // 3. Step Increment Tracker Table
    await db.query(`
      CREATE TABLE IF NOT EXISTS step_increment_tracker (
        id INT AUTO_INCREMENT PRIMARY KEY,
        employee_id INT NOT NULL,
        position_id INT NOT NULL COMMENT 'Reference to plantilla_positions',
        current_step INT NOT NULL,
        previous_step INT,
        eligible_date DATE NOT NULL COMMENT 'Date when employee becomes eligible (hire_date + 3 years)',
        status ENUM('Pending', 'Approved', 'Denied', 'Processed') DEFAULT 'Pending',
        processed_at TIMESTAMP NULL,
        processed_by INT COMMENT 'Admin who processed the increment',
        remarks TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_employee (employee_id),
        INDEX idx_status (status),
        INDEX idx_eligible_date (eligible_date),
        FOREIGN KEY (employee_id) REFERENCES authentication(id) ON DELETE CASCADE,
        FOREIGN KEY (processed_by) REFERENCES authentication(id) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Created step_increment_tracker table');

    // 4. Budget Allocation Table
    await db.query(`
      CREATE TABLE IF NOT EXISTS budget_allocation (
        id INT AUTO_INCREMENT PRIMARY KEY,
        year INT NOT NULL,
        department VARCHAR(255) NOT NULL,
        total_budget DECIMAL(15,2) NOT NULL COMMENT 'Total PS budget allocation for the year',
        utilized_budget DECIMAL(15,2) DEFAULT 0 COMMENT 'Currently utilized budget (sum of filled positions)',
        remaining_budget DECIMAL(15,2) GENERATED ALWAYS AS (total_budget - utilized_budget) STORED,
        utilization_rate DECIMAL(5,2) GENERATED ALWAYS AS ((utilized_budget / total_budget) * 100) STORED,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY unique_year_dept (year, department),
        INDEX idx_year (year),
        INDEX idx_department (department)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Created budget_allocation table');

    // 5. Position Publications Table (CSC Form 9 tracking)
    await db.query(`
      CREATE TABLE IF NOT EXISTS position_publications (
        id INT AUTO_INCREMENT PRIMARY KEY,
        position_id INT NOT NULL,
        publication_date DATE NOT NULL,
        closing_date DATE NOT NULL,
        publication_medium VARCHAR(255) DEFAULT 'CSC Bulletin, LGU Website' COMMENT 'Where the position was published',
        form_9_path VARCHAR(500) COMMENT 'Path to generated CSC Form No. 9 PDF',
        status ENUM('Draft', 'Published', 'Closed', 'Filled') DEFAULT 'Draft',
        applicants_count INT DEFAULT 0,
        notes TEXT,
        created_by INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_position (position_id),
        INDEX idx_status (status),
        INDEX idx_publication_date (publication_date),
        FOREIGN KEY (created_by) REFERENCES authentication(id) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Created position_publications table');

    // 6. Modify plantilla_positions table - Add compliance fields
    console.log('📝 Adding compliance fields to plantilla_positions...');
    
    const complianceFields = [
      {
        name: 'ordinance_number',
        definition: 'VARCHAR(100) NULL COMMENT "Ordinance number that created this position"'
      },
      {
        name: 'ordinance_date',
        definition: 'DATE NULL COMMENT "Date when ordinance was passed"'
      },
      {
        name: 'abolishment_ordinance',
        definition: 'VARCHAR(100) NULL COMMENT "Ordinance number that abolished this position"'
      },
      {
        name: 'abolishment_date',
        definition: 'DATE NULL COMMENT "Date when position was abolished"'
      },
      {
        name: 'qualification_standards_id',
        definition: 'INT NULL COMMENT "Reference to qualification_standards table"'
      },
      {
        name: 'budget_source',
        definition: 'VARCHAR(100) DEFAULT "Regular" COMMENT "Budget source: Regular, Special, Project-based"'
      },
      {
        name: 'is_coterminous',
        definition: 'BOOLEAN DEFAULT FALSE COMMENT "TRUE if position is coterminous with appointing authority"'
      },
      {
        name: 'status',
        definition: 'ENUM("Active", "Abolished", "Frozen") DEFAULT "Active"'
      }
    ];

    for (const field of complianceFields) {
      try {
        await db.query(`
          ALTER TABLE plantilla_positions 
          ADD COLUMN ${field.name} ${field.definition}
        `);
        console.log(`  ✅ Added ${field.name} to plantilla_positions`);
      } catch (error: any) {
        if (error.code === 'ER_DUP_FIELDNAME') {
          console.log(`  ⚠️  ${field.name} already exists in plantilla_positions`);
        } else {
          throw error;
        }
      }
    }

    // Add foreign key for qualification_standards_id
    try {
      await db.query(`
        ALTER TABLE plantilla_positions
        ADD CONSTRAINT fk_plantilla_qs
        FOREIGN KEY (qualification_standards_id) 
        REFERENCES qualification_standards(id) 
        ON DELETE SET NULL
      `);
      console.log('  ✅ Added foreign key constraint for qualification_standards_id');
    } catch (error: any) {
      if (error.code === 'ER_DUP_KEYNAME') {
        console.log('  ⚠️  Foreign key constraint already exists');
      } else {
        throw error;
      }
    }

    // 7. Modify authentication table - Add eligibility and education fields
    console.log('📝 Adding eligibility fields to authentication...');
    
    const authFields = [
      {
        name: 'eligibility_type',
        definition: 'VARCHAR(255) NULL COMMENT "e.g., CS Professional, CS Sub-Professional, RA 1080 (CPA)"'
      },
      {
        name: 'eligibility_number',
        definition: 'VARCHAR(100) NULL COMMENT "CSC eligibility number or license number"'
      },
      {
        name: 'eligibility_date',
        definition: 'DATE NULL COMMENT "Date when eligibility was obtained"'
      },
      {
        name: 'highest_education',
        definition: 'VARCHAR(255) NULL COMMENT "Highest educational attainment"'
      },
      {
        name: 'years_of_experience',
        definition: 'INT DEFAULT 0 COMMENT "Total years of relevant work experience"'
      }
    ];

    for (const field of authFields) {
      try {
        await db.query(`
          ALTER TABLE authentication 
          ADD COLUMN ${field.name} ${field.definition}
        `);
        console.log(`  ✅ Added ${field.name} to authentication`);
      } catch (error: any) {
        if (error.code === 'ER_DUP_FIELDNAME') {
          console.log(`  ⚠️  ${field.name} already exists in authentication`);
        } else {
          throw error;
        }
      }
    }

    // 8. Seed sample Qualification Standards for common LGU positions
    console.log('📊 Seeding sample Qualification Standards...');
    
    const sampleQS = [
      {
        position_title: 'City/Municipal Accountant',
        salary_grade: 22,
        education: 'Bachelor of Science in Accountancy',
        experience: 3,
        training: 24,
        eligibility: 'RA 1080 (CPA)'
      },
      {
        position_title: 'City/Municipal Treasurer',
        salary_grade: 24,
        education: 'Bachelor\'s Degree in Accounting, Finance, or related field',
        experience: 5,
        training: 40,
        eligibility: 'CS Professional or RA 1080 (CPA)'
      },
      {
        position_title: 'City/Municipal Planning and Development Coordinator',
        salary_grade: 24,
        education: 'Bachelor\'s Degree in Urban and Regional Planning or related field',
        experience: 5,
        training: 40,
        eligibility: 'CS Professional'
      },
      {
        position_title: 'City/Municipal Engineer',
        salary_grade: 22,
        education: 'Bachelor of Science in Civil Engineering',
        experience: 3,
        training: 24,
        eligibility: 'RA 544 (Registered Civil Engineer)'
      },
      {
        position_title: 'Administrative Officer V',
        salary_grade: 18,
        education: 'Bachelor\'s Degree relevant to the job',
        experience: 2,
        training: 16,
        eligibility: 'CS Professional'
      },
      {
        position_title: 'Administrative Aide IV',
        salary_grade: 4,
        education: 'High School Graduate',
        experience: 0,
        training: 0,
        eligibility: 'CS Sub-Professional'
      },
      {
        position_title: 'Computer Programmer II',
        salary_grade: 15,
        education: 'Bachelor of Science in Computer Science or Information Technology',
        experience: 2,
        training: 16,
        eligibility: 'CS Professional'
      }
    ];

    for (const qs of sampleQS) {
      try {
        await db.query(`
          INSERT INTO qualification_standards 
          (position_title, salary_grade, education_requirement, experience_years, training_hours, eligibility_required)
          VALUES (?, ?, ?, ?, ?, ?)
        `, [qs.position_title, qs.salary_grade, qs.education, qs.experience, qs.training, qs.eligibility]);
        console.log(`  ✅ Added QS for ${qs.position_title}`);
      } catch (error: any) {
        if (error.code === 'ER_DUP_ENTRY') {
          console.log(`  ⚠️  QS for ${qs.position_title} already exists`);
        } else {
          throw error;
        }
      }
    }

    console.log('\n🎉 Plantilla Compliance System Migration completed successfully!');
    console.log('\n📋 Summary:');
    console.log('  ✅ Created 5 new tables');
    console.log('  ✅ Modified plantilla_positions with 8 compliance fields');
    console.log('  ✅ Modified authentication with 5 eligibility fields');
    console.log('  ✅ Seeded 7 sample Qualification Standards');

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
