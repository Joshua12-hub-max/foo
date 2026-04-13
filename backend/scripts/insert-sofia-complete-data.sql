-- Complete Sofia Test Data Insertion Script
-- This script inserts comprehensive PDS data for Sofia to test the frontend display
-- Usage: Run this SQL against your nebr_db database

-- ==================================================
-- 1. AUTHENTICATION & HR DETAILS
-- ==================================================

-- Insert or update Sofia's authentication record
INSERT INTO authentication (
    employeeId,
    email,
    passwordHash,
    firstName,
    lastName,
    middleName,
    suffix,
    role,
    isVerified,
    verificationToken
) VALUES (
    'Emp-001',
    'sofia.reyes@meycauayan.gov.ph',
    '$2a$10$abcdefghijklmnopqrstuvwxyz1234567890',  -- placeholder hash
    'Sofia',
    'Reyes',
    'Martinez',
    NULL,
    'Employee',
    TRUE,
    NULL
) ON DUPLICATE KEY UPDATE
    firstName = 'Sofia',
    lastName = 'Reyes',
    middleName = 'Martinez';

-- Get Sofia's ID
SET @sofiaId = (SELECT id FROM authentication WHERE employeeId = 'Emp-001' LIMIT 1);

-- Insert or update HR details
INSERT INTO pds_hr_details (
    employeeId,
    departmentId,
    positionId,
    jobTitle,
    positionTitle,
    itemNumber,
    salaryGrade,
    stepIncrement,
    employmentStatus,
    appointmentType,
    dutyType,
    isMeycauayan,
    profileStatus,
    dateHired
) VALUES (
    @sofiaId,
    1,  -- Update with actual department ID
    1,  -- Update with actual position ID
    'Administrative Officer IV',
    'Administrative Officer IV',
    'CHRMO-AO4-001',
    '15',
    '3',
    'Active',
    'Permanent',
    'Standard',
    TRUE,
    'Complete',
    '2020-01-15'
) ON DUPLICATE KEY UPDATE
    jobTitle = 'Administrative Officer IV',
    positionTitle = 'Administrative Officer IV',
    itemNumber = 'CHRMO-AO4-001',
    salaryGrade = '15',
    stepIncrement = '3';

-- ==================================================
-- 2. PERSONAL INFORMATION
-- ==================================================

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
    dualCountry,
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
    NULL,
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
) ON DUPLICATE KEY UPDATE
    birthDate = '1995-03-15',
    placeOfBirth = 'Meycauayan, Bulacan',
    gender = 'Female',
    civilStatus = 'Married',
    heightM = '1.65',
    weightKg = '58',
    bloodType = 'O+',
    citizenship = 'Filipino',
    gsisNumber = '1234567890',
    pagibigNumber = '1212-3434-5656',
    philhealthNumber = '01-123456789-0',
    tinNumber = '123-456-789-000',
    mobileNo = '09171234567';

-- ==================================================
-- 3. FAMILY BACKGROUND
-- ==================================================

-- Delete existing family records for Sofia
DELETE FROM pds_family WHERE employeeId = @sofiaId;

-- Insert Spouse
INSERT INTO pds_family (
    employeeId, relationType, lastName, firstName, middleName,
    occupation, employer, businessAddress, telephoneNo
) VALUES (
    @sofiaId, 'Spouse', 'Reyes', 'Juan', 'Santos',
    'Software Engineer', 'Tech Solutions Inc.',
    'Quezon City, Metro Manila', '(02) 8765-4321'
);

-- Insert Father
INSERT INTO pds_family (
    employeeId, relationType, lastName, firstName, middleName, nameExtension
) VALUES (
    @sofiaId, 'Father', 'Martinez', 'Carlos', 'Dela Cruz', 'Sr.'
);

-- Insert Mother
INSERT INTO pds_family (
    employeeId, relationType, lastName, firstName, middleName
) VALUES (
    @sofiaId, 'Mother', 'Martinez', 'Maria', 'Santos'
);

-- Insert Children
INSERT INTO pds_family (
    employeeId, relationType, firstName, dateOfBirth
) VALUES
    (@sofiaId, 'Child', 'Isabella Sofia Reyes', '2020-05-10'),
    (@sofiaId, 'Child', 'Lucas Miguel Reyes', '2022-08-15');

-- ==================================================
-- 4. EDUCATIONAL BACKGROUND
-- ==================================================

DELETE FROM pds_education WHERE employeeId = @sofiaId;

INSERT INTO pds_education (
    employeeId, level, schoolName, degreeCourse,
    dateFrom, dateTo, unitsEarned, yearGraduated, honors
) VALUES
    (@sofiaId, 'Elementary', 'Meycauayan Central School', 'Elementary Education',
     '2001', '2007', NULL, 2007, 'With Honors'),

    (@sofiaId, 'Secondary', 'Meycauayan National High School', 'High School',
     '2007', '2011', NULL, 2011, 'With High Honors'),

    (@sofiaId, 'College', 'Bulacan State University', 'Bachelor of Science in Public Administration',
     '2011', '2015', NULL, 2015, 'Cum Laude'),

    (@sofiaId, 'Graduate Studies', 'Polytechnic University of the Philippines',
     'Master in Public Administration', '2016', '2019', NULL, 2019, 'Outstanding Thesis Award');

-- ==================================================
-- 5. CIVIL SERVICE ELIGIBILITY
-- ==================================================

DELETE FROM pds_eligibility WHERE employeeId = @sofiaId;

INSERT INTO pds_eligibility (
    employeeId, eligibilityName, rating, examDate,
    examPlace, licenseNumber, validityDate
) VALUES
    (@sofiaId, 'Career Service Professional', '85.50', '2015-03-20',
     'Manila', 'CSC-PRO-0012345', NULL),

    (@sofiaId, 'RA 1080 (Board/Bar)', '87.25', '2015-10-15',
     'Malolos, Bulacan', 'LIC-2015-67890', '2025-10-15');

-- ==================================================
-- 6. WORK EXPERIENCE
-- ==================================================

DELETE FROM pds_work_experience WHERE employeeId = @sofiaId;

INSERT INTO pds_work_experience (
    employeeId, dateFrom, dateTo, positionTitle, companyName,
    monthlySalary, salaryGrade, appointmentStatus, isGovernment
) VALUES
    (@sofiaId, '2015-06-01', '2017-12-31', 'Administrative Aide III',
     'City Government of Meycauayan', '15000.00', '6', 'Permanent', TRUE),

    (@sofiaId, '2018-01-01', '2019-12-31', 'Administrative Officer II',
     'City Government of Meycauayan', '22000.00', '11', 'Permanent', TRUE),

    (@sofiaId, '2020-01-15', 'Present', 'Administrative Officer IV',
     'City Government of Meycauayan - CHRMO', '35000.00', '15', 'Permanent', TRUE);

-- ==================================================
-- 7. VOLUNTARY WORK
-- ==================================================

DELETE FROM pds_voluntary_work WHERE employeeId = @sofiaId;

INSERT INTO pds_voluntary_work (
    employeeId, organizationName, address, dateFrom, dateTo,
    hoursNumber, position
) VALUES
    (@sofiaId, 'Meycauayan Youth Council', 'Meycauayan City Hall',
     '2016-01-01', '2017-12-31', 240, 'Member'),

    (@sofiaId, 'Red Cross Bulacan Chapter', 'Malolos, Bulacan',
     '2017-06-01', '2018-05-31', 160, 'Volunteer');

-- ==================================================
-- 8. LEARNING AND DEVELOPMENT
-- ==================================================

DELETE FROM pds_learning_development WHERE employeeId = @sofiaId;

INSERT INTO pds_learning_development (
    employeeId, title, dateFrom, dateTo, hoursNumber,
    typeOfLd, conductedBy
) VALUES
    (@sofiaId, 'Basic Records Management Training',
     '2016-03-01', '2016-03-05', 40, 'Seminar/Workshop',
     'National Archives of the Philippines'),

    (@sofiaId, 'Human Resource Management Training',
     '2018-07-10', '2018-07-14', 40, 'Training Course',
     'Civil Service Commission'),

    (@sofiaId, 'Strategic Performance Management System (SPMS)',
     '2019-09-15', '2019-09-20', 40, 'Training Course',
     'Development Academy of the Philippines'),

    (@sofiaId, 'Digital Transformation for Government',
     '2021-11-10', '2021-11-12', 24, 'Webinar',
     'DICT Philippines');

-- ==================================================
-- 9. OTHER INFORMATION
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

-- ==================================================
-- 10. REFERENCES
-- ==================================================

DELETE FROM pds_references WHERE employeeId = @sofiaId;

INSERT INTO pds_references (employeeId, name, address, telNo) VALUES
    (@sofiaId, 'Dr. Maria Elena Santos',
     'Bulacan State University, Malolos, Bulacan', '(044) 791-0153'),

    (@sofiaId, 'Atty. Roberto Cruz',
     'City Legal Office, Meycauayan City', '(044) 840-3000'),

    (@sofiaId, 'Ms. Carmen Aquino',
     'Department of Public Administration, PUP, Manila', '(02) 8716-6273');

-- ==================================================
-- 11. DECLARATIONS
-- ==================================================

DELETE FROM pds_declarations WHERE employeeId = @sofiaId;

INSERT INTO pds_declarations (
    employeeId,
    relatedThirdDegree,
    relatedThirdDetails,
    relatedFourthDegree,
    relatedFourthDetails,
    foundGuiltyAdmin,
    foundGuiltyDetails,
    criminallyCharged,
    dateFiled,
    statusOfCase,
    convictedCrime,
    convictedDetails,
    separatedFromService,
    separatedDetails,
    electionCandidate,
    electionDetails,
    resignedToPromote,
    resignedDetails,
    immigrantStatus,
    immigrantDetails,
    indigenousMember,
    indigenousDetails,
    personWithDisability,
    disabilityIdNo,
    soloParent,
    soloParentIdNo,
    govtIdType,
    govtIdNo,
    govtIdIssuance,
    dateAccomplished
) VALUES (
    @sofiaId,
    FALSE, NULL,
    FALSE, NULL,
    FALSE, NULL,
    FALSE, NULL, NULL,
    FALSE, NULL,
    FALSE, NULL,
    FALSE, NULL,
    FALSE, NULL,
    FALSE, NULL,
    FALSE, NULL,
    FALSE, NULL,
    FALSE, NULL,
    'PhilSys ID',
    '1234-5678-9012-3456',
    'PhilSys Registry Office',
    '2025-01-15'
);

-- ==================================================
-- 12. EMERGENCY CONTACTS
-- ==================================================

DELETE FROM employee_emergency_contacts WHERE employeeId = @sofiaId;

INSERT INTO employee_emergency_contacts (
    employeeId, name, phoneNumber, relationship, isPrimary
) VALUES
    (@sofiaId, 'Juan Reyes (Spouse)', '09171234567', 'Spouse', TRUE),
    (@sofiaId, 'Maria Martinez (Mother)', '09189876543', 'Mother', FALSE);

-- ==================================================
-- VERIFICATION QUERIES
-- ==================================================

-- Check if all data was inserted correctly
SELECT 'Authentication' AS section, COUNT(*) AS count FROM authentication WHERE id = @sofiaId
UNION ALL
SELECT 'HR Details', COUNT(*) FROM pds_hr_details WHERE employeeId = @sofiaId
UNION ALL
SELECT 'Personal Info', COUNT(*) FROM pds_personal_information WHERE employeeId = @sofiaId
UNION ALL
SELECT 'Family', COUNT(*) FROM pds_family WHERE employeeId = @sofiaId
UNION ALL
SELECT 'Education', COUNT(*) FROM pds_education WHERE employeeId = @sofiaId
UNION ALL
SELECT 'Eligibility', COUNT(*) FROM pds_eligibility WHERE employeeId = @sofiaId
UNION ALL
SELECT 'Work Experience', COUNT(*) FROM pds_work_experience WHERE employeeId = @sofiaId
UNION ALL
SELECT 'Voluntary Work', COUNT(*) FROM pds_voluntary_work WHERE employeeId = @sofiaId
UNION ALL
SELECT 'Learning & Dev', COUNT(*) FROM pds_learning_development WHERE employeeId = @sofiaId
UNION ALL
SELECT 'Other Info', COUNT(*) FROM pds_other_info WHERE employeeId = @sofiaId
UNION ALL
SELECT 'References', COUNT(*) FROM pds_references WHERE employeeId = @sofiaId
UNION ALL
SELECT 'Declarations', COUNT(*) FROM pds_declarations WHERE employeeId = @sofiaId
UNION ALL
SELECT 'Emergency Contacts', COUNT(*) FROM employee_emergency_contacts WHERE employeeId = @sofiaId;

-- Display Sofia's complete profile summary
SELECT
    a.employeeId,
    CONCAT(a.firstName, ' ', a.middleName, ' ', a.lastName) AS fullName,
    a.email,
    a.role,
    h.jobTitle,
    h.salaryGrade,
    h.stepIncrement,
    h.employmentStatus,
    p.birthDate,
    p.gender,
    p.civilStatus,
    p.mobileNo
FROM authentication a
LEFT JOIN pds_hr_details h ON a.id = h.employeeId
LEFT JOIN pds_personal_information p ON a.id = p.employeeId
WHERE a.id = @sofiaId;

-- ==================================================
-- CLEANUP NOTE
-- ==================================================
-- After running this script and verifying frontend display,
-- run: npm run db:seed or execute specific cleanup if needed
