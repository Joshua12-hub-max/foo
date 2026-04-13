-- Fix Sofia (Emp-010) Complete Data
-- This script updates existing Sofia account with 100% complete data
--
-- Current Issues Found:
-- - Only 33% complete (4/12 sections)
-- - Personal info fields are NULL
-- - Family names are wrong (showing government IDs)
-- - Education missing dates
-- - Missing: Eligibility, Work Exp, Voluntary, L&D, Other Info, References, Emergency
--
-- Usage: mysql -u root -p nebr_db < backend/scripts/fix-sofia-emp010-data.sql

-- Get Sofia's database ID
SET @sofiaId = (SELECT id FROM authentication WHERE employeeId = 'Emp-010' LIMIT 1);

SELECT CONCAT('Updating Sofia (Database ID: ', @sofiaId, ', Employee ID: Emp-010)') AS 'Starting Update';

-- ==================================================
-- 1. UPDATE AUTHENTICATION (Fix Name)
-- ==================================================

UPDATE authentication
SET
    firstName = 'Sofia',
    lastName = 'Reyes',
    middleName = 'Martinez',
    suffix = NULL,
    email = 'sofia.reyes@meycauayan.gov.ph'
WHERE id = @sofiaId;

SELECT 'Updated authentication record' AS 'Status';

-- ==================================================
-- 2. UPDATE HR DETAILS
-- ==================================================

UPDATE pds_hr_details
SET
    jobTitle = 'Administrative Officer IV',
    positionTitle = 'Administrative Officer IV',
    itemNumber = 'CHRMO-AO4-001',
    salaryGrade = '15',
    stepIncrement = '3',
    employmentStatus = 'Active',
    appointmentType = 'Permanent',
    dutyType = 'Standard',
    profileStatus = 'Complete',
    dateHired = '2020-01-15'
WHERE employeeId = @sofiaId;

SELECT 'Updated HR details' AS 'Status';

-- ==================================================
-- 3. CLEAN AND INSERT PERSONAL INFORMATION
-- ==================================================

DELETE FROM pds_personal_information WHERE employeeId = @sofiaId;

INSERT INTO pds_personal_information (
    employeeId,
    birthDate,
    placeOfBirth,
    gender,
    civilStatus,
    heightM,
    weightKg,
    bloodType,
    citizenship,
    citizenshipType,
    telephoneNo,
    mobileNo,
    gsisNumber,
    pagibigNumber,
    philhealthNumber,
    tinNumber,
    umidNumber,
    philsysId,
    agencyEmployeeNo,
    resHouseBlockLot,
    resStreet,
    resSubdivision,
    resBarangay,
    resCity,
    resProvince,
    resRegion,
    residentialZipCode,
    permHouseBlockLot,
    permStreet,
    permSubdivision,
    permBarangay,
    permCity,
    permProvince,
    permRegion,
    permanentZipCode
) VALUES (
    @sofiaId,
    '1995-03-15',
    'Meycauayan, Bulacan',
    'Female',
    'Married',
    '1.65',
    '58',
    'O+',
    'Filipino',
    'by birth',
    '(044) 123-4567',
    '09171234567',
    '1234567890',
    '1212-3434-5656',
    '01-123456789-0',
    '123-456-789-000',
    '0001-0123456-1',
    '1234-5678-9012-3456',
    'Employee-001-2020',
    'Blk 3 Lot 8',
    'Maharlika Street',
    'Banga Homes Phase 2',
    'Banga',
    'Meycauayan',
    'Bulacan',
    'Region III (Central Luzon)',
    '3020',
    'Blk 3 Lot 8',
    'Maharlika Street',
    'Banga Homes Phase 2',
    'Banga',
    'Meycauayan',
    'Bulacan',
    'Region III (Central Luzon)',
    '3020'
);

SELECT 'Cleaned and inserted personal information' AS 'Status';

-- ==================================================
-- 4. CLEAN AND INSERT FAMILY BACKGROUND
-- ==================================================

DELETE FROM pds_family WHERE employeeId = @sofiaId;

INSERT INTO pds_family (employeeId, relationType, lastName, firstName, middleName, occupation, employer, businessAddress, telephoneNo) VALUES
    (@sofiaId, 'Spouse', 'Reyes', 'Juan', 'Santos', 'Software Engineer', 'Tech Solutions Inc.', 'Quezon City, Metro Manila', '(02) 8765-4321');

INSERT INTO pds_family (employeeId, relationType, lastName, firstName, middleName, nameExtension) VALUES
    (@sofiaId, 'Father', 'Martinez', 'Carlos', 'Dela Cruz', 'Sr.');

INSERT INTO pds_family (employeeId, relationType, lastName, firstName, middleName) VALUES
    (@sofiaId, 'Mother', 'Martinez', 'Maria', 'Santos');

INSERT INTO pds_family (employeeId, relationType, firstName, dateOfBirth) VALUES
    (@sofiaId, 'Child', 'Isabella Sofia Reyes', '2020-05-10'),
    (@sofiaId, 'Child', 'Lucas Miguel Reyes', '2022-08-15');

SELECT 'Cleaned and inserted family background' AS 'Status';

-- ==================================================
-- 5. CLEAN AND INSERT EDUCATION
-- ==================================================

DELETE FROM pds_education WHERE employeeId = @sofiaId;

INSERT INTO pds_education (employeeId, level, schoolName, degreeCourse, dateFrom, dateTo, yearGraduated, honors) VALUES
    (@sofiaId, 'Elementary', 'Meycauayan Central School', 'Elementary Education', '2001', '2007', 2007, 'With Honors'),
    (@sofiaId, 'Secondary', 'Meycauayan National High School', 'High School', '2007', '2011', 2011, 'With High Honors'),
    (@sofiaId, 'College', 'Bulacan State University', 'Bachelor of Science in Public Administration', '2011', '2015', 2015, 'Cum Laude'),
    (@sofiaId, 'Graduate Studies', 'Polytechnic University of the Philippines', 'Master in Public Administration', '2016', '2019', 2019, 'Outstanding Thesis Award');

SELECT 'Cleaned and inserted education records' AS 'Status';

-- ==================================================
-- 6. CLEAN AND INSERT ELIGIBILITY
-- ==================================================

DELETE FROM pds_eligibility WHERE employeeId = @sofiaId;

INSERT INTO pds_eligibility (employeeId, eligibilityName, rating, examDate, examPlace, licenseNumber, validityDate) VALUES
    (@sofiaId, 'Career Service Professional', '85.50', '2015-03-20', 'Manila', 'CSC-PRO-0012345', NULL),
    (@sofiaId, 'RA 1080 (Board/Bar)', '87.25', '2015-10-15', 'Malolos, Bulacan', 'LIC-2015-67890', '2025-10-15');

SELECT 'Cleaned and inserted eligibility records' AS 'Status';

-- ==================================================
-- 7. CLEAN AND INSERT WORK EXPERIENCE
-- ==================================================

DELETE FROM pds_work_experience WHERE employeeId = @sofiaId;

INSERT INTO pds_work_experience (employeeId, dateFrom, dateTo, positionTitle, companyName, monthlySalary, salaryGrade, appointmentStatus, isGovernment) VALUES
    (@sofiaId, '2015-06-01', '2017-12-31', 'Administrative Aide III', 'City Government of Meycauayan', '15000.00', '6', 'Permanent', TRUE),
    (@sofiaId, '2018-01-01', '2019-12-31', 'Administrative Officer II', 'City Government of Meycauayan', '22000.00', '11', 'Permanent', TRUE),
    (@sofiaId, '2020-01-15', 'Present', 'Administrative Officer IV', 'City Government of Meycauayan - CHRMO', '35000.00', '15', 'Permanent', TRUE);

SELECT 'Cleaned and inserted work experience records' AS 'Status';

-- ==================================================
-- 8. CLEAN AND INSERT VOLUNTARY WORK
-- ==================================================

DELETE FROM pds_voluntary_work WHERE employeeId = @sofiaId;

INSERT INTO pds_voluntary_work (employeeId, organizationName, address, dateFrom, dateTo, hoursNumber, position) VALUES
    (@sofiaId, 'Meycauayan Youth Council', 'Meycauayan City Hall', '2016-01-01', '2017-12-31', 240, 'Member'),
    (@sofiaId, 'Red Cross Bulacan Chapter', 'Malolos, Bulacan', '2017-06-01', '2018-05-31', 160, 'Volunteer');

SELECT 'Cleaned and inserted voluntary work records' AS 'Status';

-- ==================================================
-- 9. CLEAN AND INSERT LEARNING & DEVELOPMENT
-- ==================================================

DELETE FROM pds_learning_development WHERE employeeId = @sofiaId;

INSERT INTO pds_learning_development (employeeId, title, dateFrom, dateTo, hoursNumber, typeOfLd, conductedBy) VALUES
    (@sofiaId, 'Basic Records Management Training', '2016-03-01', '2016-03-05', 40, 'Seminar/Workshop', 'National Archives of the Philippines'),
    (@sofiaId, 'Human Resource Management Training', '2018-07-10', '2018-07-14', 40, 'Training Course', 'Civil Service Commission'),
    (@sofiaId, 'Strategic Performance Management System (SPMS)', '2019-09-15', '2019-09-20', 40, 'Training Course', 'Development Academy of the Philippines'),
    (@sofiaId, 'Digital Transformation for Government', '2021-11-10', '2021-11-12', 24, 'Webinar', 'DICT Philippines');

SELECT 'Cleaned and inserted learning & development records' AS 'Status';

-- ==================================================
-- 10. CLEAN AND INSERT OTHER INFORMATION
-- ==================================================

DELETE FROM pds_other_info WHERE employeeId = @sofiaId;

INSERT INTO pds_other_info (employeeId, type, description) VALUES
    (@sofiaId, 'Skill', 'MS Office Suite (Advanced)'),
    (@sofiaId, 'Skill', 'Records Management Systems'),
    (@sofiaId, 'Skill', 'Public Speaking'),
    (@sofiaId, 'Recognition', 'Outstanding Employee of the Year 2019'),
    (@sofiaId, 'Recognition', 'Service Award - 5 Years of Dedicated Service'),
    (@sofiaId, 'Membership', 'Philippine Association of Public Administration Educators (PAPAE)'),
    (@sofiaId, 'Membership', 'Civil Service Commission Alumni Association');

SELECT 'Cleaned and inserted other information records' AS 'Status';

-- ==================================================
-- 11. CLEAN AND INSERT REFERENCES
-- ==================================================

DELETE FROM pds_references WHERE employeeId = @sofiaId;

INSERT INTO pds_references (employeeId, name, address, telNo) VALUES
    (@sofiaId, 'Dr. Maria Elena Santos', 'Bulacan State University, Malolos, Bulacan', '(044) 791-0153'),
    (@sofiaId, 'Atty. Roberto Cruz', 'City Legal Office, Meycauayan City', '(044) 840-3000'),
    (@sofiaId, 'Ms. Carmen Aquino', 'Department of Public Administration, PUP, Manila', '(02) 8716-6273');

SELECT 'Cleaned and inserted references' AS 'Status';

-- ==================================================
-- 12. UPDATE DECLARATIONS (Keep existing, update if needed)
-- ==================================================

UPDATE pds_declarations
SET
    govtIdType = 'PhilSys ID',
    govtIdNo = '1234-5678-9012-3456',
    govtIdIssuance = 'PhilSys Registry Office',
    dateAccomplished = '2025-01-15'
WHERE employeeId = @sofiaId;

SELECT 'Updated declarations' AS 'Status';

-- ==================================================
-- 13. CLEAN AND INSERT EMERGENCY CONTACTS
-- ==================================================

DELETE FROM employee_emergency_contacts WHERE employeeId = @sofiaId;

INSERT INTO employee_emergency_contacts (employeeId, name, phoneNumber, relationship, isPrimary) VALUES
    (@sofiaId, 'Juan Reyes (Spouse)', '09171234567', 'Spouse', TRUE),
    (@sofiaId, 'Maria Martinez (Mother)', '09189876543', 'Mother', FALSE);

SELECT 'Cleaned and inserted emergency contacts' AS 'Status';

-- ==================================================
-- VERIFICATION SUMMARY
-- ==================================================

SELECT '============================================================' AS '';
SELECT 'SOFIA DATA UPDATE COMPLETE' AS 'Status';
SELECT '============================================================' AS '';

SELECT
    'Authentication' AS section,
    COUNT(*) AS count
FROM authentication
WHERE id = @sofiaId

UNION ALL

SELECT 'HR Details', COUNT(*)
FROM pds_hr_details
WHERE employeeId = @sofiaId

UNION ALL

SELECT 'Personal Info', COUNT(*)
FROM pds_personal_information
WHERE employeeId = @sofiaId

UNION ALL

SELECT 'Family', COUNT(*)
FROM pds_family
WHERE employeeId = @sofiaId

UNION ALL

SELECT 'Education', COUNT(*)
FROM pds_education
WHERE employeeId = @sofiaId

UNION ALL

SELECT 'Eligibility', COUNT(*)
FROM pds_eligibility
WHERE employeeId = @sofiaId

UNION ALL

SELECT 'Work Experience', COUNT(*)
FROM pds_work_experience
WHERE employeeId = @sofiaId

UNION ALL

SELECT 'Voluntary Work', COUNT(*)
FROM pds_voluntary_work
WHERE employeeId = @sofiaId

UNION ALL

SELECT 'Learning & Dev', COUNT(*)
FROM pds_learning_development
WHERE employeeId = @sofiaId

UNION ALL

SELECT 'Other Info', COUNT(*)
FROM pds_other_info
WHERE employeeId = @sofiaId

UNION ALL

SELECT 'References', COUNT(*)
FROM pds_references
WHERE employeeId = @sofiaId

UNION ALL

SELECT 'Declarations', COUNT(*)
FROM pds_declarations
WHERE employeeId = @sofiaId

UNION ALL

SELECT 'Emergency Contacts', COUNT(*)
FROM employee_emergency_contacts
WHERE employeeId = @sofiaId;

-- Display Sofia's updated profile
SELECT '============================================================' AS '';
SELECT 'SOFIA PROFILE SUMMARY' AS 'Status';
SELECT '============================================================' AS '';

SELECT
    a.employeeId AS 'Employee ID',
    CONCAT(a.firstName, ' ', a.middleName, ' ', a.lastName) AS 'Full Name',
    a.email AS 'Email',
    a.role AS 'Role',
    h.jobTitle AS 'Position',
    CONCAT('SG ', h.salaryGrade, ' Step ', h.stepIncrement) AS 'Salary Grade',
    h.employmentStatus AS 'Status',
    p.birthDate AS 'Birth Date',
    p.gender AS 'Gender',
    p.civilStatus AS 'Civil Status',
    p.mobileNo AS 'Mobile'
FROM authentication a
LEFT JOIN pds_hr_details h ON a.id = h.employeeId
LEFT JOIN pds_personal_information p ON a.id = p.employeeId
WHERE a.id = @sofiaId;

SELECT '============================================================' AS '';
SELECT 'Next: Login as sofia.reyes@meycauayan.gov.ph to test frontend' AS 'Action Required';
SELECT '============================================================' AS '';
