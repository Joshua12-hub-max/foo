import {
	mysqlTable,
	varchar,
	int,
	date,
	timestamp,
	decimal,
	mysqlEnum,
	boolean,
	primaryKey,
	index,
	unique,
	text,
	datetime,
} from 'drizzle-orm/mysql-core';
import { authentication } from './auth.js';
import { departments } from './hr.js';
import { plantillaPositions } from './plantilla.js';

// ─────────────────────────────────────────────────────────────────────────────
// PDS EDUCATION
// dateFrom / dateTo store 4-digit year strings ("2001", "2005") because the
// CS Form 212 only records the year of attendance — not a full calendar date.
// ─────────────────────────────────────────────────────────────────────────────
export const pdsEducation = mysqlTable('pds_education', {
	id:           int('id').autoincrement().notNull(),
	employeeId:   int('employee_id').notNull().references(() => authentication.id, { onDelete: 'cascade' }),
	level:        mysqlEnum('level', ['Elementary', 'Secondary', 'Vocational', 'College', 'Graduate Studies']).notNull(),
	schoolName:   varchar('school_name', { length: 255 }).notNull(),
	degreeCourse: varchar('degree_course', { length: 255 }),
	yearGraduated: int('year_graduated'),
	unitsEarned:  varchar('units_earned', { length: 50 }),
	dateFrom:     varchar('date_from', { length: 4 }),   // year only e.g. "2001"
	dateTo:       varchar('date_to',   { length: 4 }),   // year only e.g. "2005"
	honors:       varchar('honors', { length: 255 }),
	createdAt:    timestamp('created_at', { mode: 'string' }).defaultNow(),
}, (table) => [
	index('idx_pds_edu_employee_id').on(table.employeeId),
	primaryKey({ columns: [table.id], name: 'pds_education_id' }),
]);

// ─────────────────────────────────────────────────────────────────────────────
// PDS ELIGIBILITY (Civil Service / Board / Bar)
// ─────────────────────────────────────────────────────────────────────────────
export const pdsEligibility = mysqlTable('pds_eligibility', {
	id:              int('id').autoincrement().notNull(),
	employeeId:      int('employee_id').notNull().references(() => authentication.id, { onDelete: 'cascade' }),
	eligibilityName: varchar('eligibility_name', { length: 255 }).notNull(),
	rating:          decimal('rating', { precision: 5, scale: 2 }),
	examDate:        date('exam_date', { mode: 'string' }),
	examPlace:       varchar('exam_place', { length: 255 }),
	licenseNumber:   varchar('license_number', { length: 50 }),
	validityDate:    date('validity_date', { mode: 'string' }),
	createdAt:       timestamp('created_at', { mode: 'string' }).defaultNow(),
}, (table) => [
	index('idx_pds_elig_employee_id').on(table.employeeId),
	primaryKey({ columns: [table.id], name: 'pds_eligibility_id' }),
]);

// ─────────────────────────────────────────────────────────────────────────────
// PDS FAMILY BACKGROUND
// ─────────────────────────────────────────────────────────────────────────────
export const pdsFamily = mysqlTable('pds_family', {
	id:              int('id').autoincrement().notNull(),
	employeeId:      int('employee_id').notNull().references(() => authentication.id, { onDelete: 'cascade' }),
	relationType:    mysqlEnum('relation_type', ['Spouse', 'Father', 'Mother', 'Child']).notNull(),
	lastName:        varchar('last_name',  { length: 100 }),
	firstName:       varchar('first_name', { length: 100 }),
	middleName:      varchar('middle_name', { length: 100 }),
	nameExtension:   varchar('name_extension', { length: 50 }),
	occupation:      varchar('occupation', { length: 150 }),
	employer:        varchar('employer',   { length: 255 }),
	businessAddress: varchar('business_address', { length: 255 }),
	telephoneNo:     varchar('telephone_no', { length: 50 }),
	dateOfBirth:     date('date_of_birth', { mode: 'string' }),
	createdAt:       timestamp('created_at', { mode: 'string' }).defaultNow(),
}, (table) => [
	index('idx_pds_fam_employee_id').on(table.employeeId),
	primaryKey({ columns: [table.id], name: 'pds_family_id' }),
]);

// ─────────────────────────────────────────────────────────────────────────────
// PDS LEARNING AND DEVELOPMENT (CS Form 212 Section VII)
// ─────────────────────────────────────────────────────────────────────────────
export const pdsLearningDevelopment = mysqlTable('pds_learning_development', {
	id:          int('id').autoincrement().notNull(),
	employeeId:  int('employee_id').notNull().references(() => authentication.id, { onDelete: 'cascade' }),
	title:       varchar('title', { length: 500 }).notNull(),
	dateFrom:    date('date_from', { mode: 'string' }),
	dateTo:      date('date_to',   { mode: 'string' }),
	hoursNumber: int('hours_number'),
	typeOfLd:    varchar('type_of_ld', { length: 50 }),
	conductedBy: varchar('conducted_by', { length: 255 }),
	createdAt:   timestamp('created_at', { mode: 'string' }).defaultNow(),
}, (table) => [
	index('idx_pds_ld_employee_id').on(table.employeeId),
	primaryKey({ columns: [table.id], name: 'pds_learning_development_id' }),
]);

// ─────────────────────────────────────────────────────────────────────────────
// PDS OTHER INFORMATION (Skills, Recognitions, Memberships)
// ─────────────────────────────────────────────────────────────────────────────
export const pdsOtherInfo = mysqlTable('pds_other_info', {
	id:          int('id').autoincrement().notNull(),
	employeeId:  int('employee_id').notNull().references(() => authentication.id, { onDelete: 'cascade' }),
	type:        mysqlEnum('type', ['Skill', 'Recognition', 'Membership']).notNull(),
	description: text('description').notNull(),
	createdAt:   timestamp('created_at', { mode: 'string' }).defaultNow(),
}, (table) => [
	index('idx_pds_oi_employee_id').on(table.employeeId),
	primaryKey({ columns: [table.id], name: 'pds_other_info_id' }),
]);

// ─────────────────────────────────────────────────────────────────────────────
// PDS REFERENCES (Three character references)
// ─────────────────────────────────────────────────────────────────────────────
export const pdsReferences = mysqlTable('pds_references', {
	id:         int('id').autoincrement().notNull(),
	employeeId: int('employee_id').notNull().references(() => authentication.id, { onDelete: 'cascade' }),
	name:       varchar('name',    { length: 255 }).notNull(),
	address:    varchar('address', { length: 255 }),
	telNo:      varchar('tel_no',  { length: 50 }),
	createdAt:  timestamp('created_at', { mode: 'string' }).defaultNow(),
}, (table) => [
	index('idx_pds_ref_employee_id').on(table.employeeId),
	primaryKey({ columns: [table.id], name: 'pds_references_id' }),
]);

// ─────────────────────────────────────────────────────────────────────────────
// PDS VOLUNTARY WORK
// ─────────────────────────────────────────────────────────────────────────────
export const pdsVoluntaryWork = mysqlTable('pds_voluntary_work', {
	id:               int('id').autoincrement().notNull(),
	employeeId:       int('employee_id').notNull().references(() => authentication.id, { onDelete: 'cascade' }),
	organizationName: varchar('organization_name', { length: 255 }).notNull(),
	address:          varchar('address',  { length: 255 }),
	dateFrom:         date('date_from', { mode: 'string' }),
	dateTo:           date('date_to',   { mode: 'string' }),
	hoursNumber:      int('hours_number'),
	position:         varchar('position', { length: 100 }),
	createdAt:        timestamp('created_at', { mode: 'string' }).defaultNow(),
}, (table) => [
	index('idx_pds_vw_employee_id').on(table.employeeId),
	primaryKey({ columns: [table.id], name: 'pds_voluntary_work_id' }),
]);

// ─────────────────────────────────────────────────────────────────────────────
// PDS WORK EXPERIENCE
// dateTo stores either an ISO date ("2023-06-15") or the literal "Present".
// varchar(20) accommodates both without losing data.
// ─────────────────────────────────────────────────────────────────────────────
export const pdsWorkExperience = mysqlTable('pds_work_experience', {
	id:                int('id').autoincrement().notNull(),
	employeeId:        int('employee_id').notNull().references(() => authentication.id, { onDelete: 'cascade' }),
	dateFrom:          date('date_from', { mode: 'string' }).notNull(),
	dateTo:            varchar('date_to', { length: 20 }),        // ISO date OR "Present"
	positionTitle:     varchar('position_title', { length: 255 }).notNull(),
	companyName:       varchar('company_name',   { length: 255 }).notNull(),
	monthlySalary:     decimal('monthly_salary', { precision: 12, scale: 2 }),
	salaryGrade:       varchar('salary_grade',   { length: 20 }),
	appointmentStatus: varchar('appointment_status', { length: 50 }),
	isGovernment:      boolean('is_government').default(false),
	createdAt:         timestamp('created_at', { mode: 'string' }).defaultNow(),
}, (table) => [
	index('idx_pds_we_employee_id').on(table.employeeId),
	primaryKey({ columns: [table.id], name: 'pds_work_experience_id' }),
]);

// ─────────────────────────────────────────────────────────────────────────────
// PDS PERSONAL INFORMATION
// One row per employee (enforced by unique on employee_id).
// Flat address strings removed — only the 7 decomposed address fields are kept.
// Government IDs have unique constraints to prevent duplicates across employees.
// ─────────────────────────────────────────────────────────────────────────────
export const pdsPersonalInformation = mysqlTable('pds_personal_information', {
	id:          int('id').autoincrement().notNull(),
	employeeId:  int('employee_id').notNull().references(() => authentication.id, { onDelete: 'cascade' }),

	// Personal details
	birthDate:       date('birth_date', { mode: 'string' }),
	placeOfBirth:    varchar('place_of_birth', { length: 255 }),
	gender:          varchar('gender',       { length: 50 }),
	civilStatus:     varchar('civil_status', { length: 50 }),
	heightM:         decimal('height_m', { precision: 4, scale: 2 }),
	weightKg:        decimal('weight_kg', { precision: 5, scale: 2 }),
	bloodType:       varchar('blood_type', { length: 10 }),
	citizenship:     varchar('citizenship', { length: 50 }).default('Filipino'),
	citizenshipType: varchar('citizenship_type', { length: 50 }),
	dualCountry:     varchar('dual_country', { length: 100 }),

	// Contact
	telephoneNo: varchar('telephone_no', { length: 50 }),
	mobileNo:    varchar('mobile_no',    { length: 50 }),

	// Government IDs — all unique across employees
	gsisNumber:       varchar('gsis_number',       { length: 50 }),
	pagibigNumber:    varchar('pagibig_number',    { length: 50 }),
	philhealthNumber: varchar('philhealth_number', { length: 50 }),
	sssNumber:        varchar('sss_number',        { length: 50 }),
	tinNumber:        varchar('tin_number',        { length: 50 }),
	umidNumber:       varchar('umid_no',           { length: 50 }),
	philsysId:        varchar('philsys_id',        { length: 50 }),
	agencyEmployeeNo: varchar('agency_employee_no', { length: 50 }),

	// Residential address (decomposed — no flat text field)
	resHouseBlockLot: varchar('res_house_block_lot', { length: 150 }),
	resStreet:        varchar('res_street',        { length: 150 }),
	resSubdivision:   varchar('res_subdivision',   { length: 150 }),
	resBarangay:      varchar('res_barangay',      { length: 150 }),
	resCity:          varchar('res_city',          { length: 150 }),
	resProvince:      varchar('res_province',      { length: 150 }),
	resRegion:        varchar('res_region',        { length: 150 }),
	residentialZipCode: varchar('residential_zip_code', { length: 10 }),

	// Permanent address (decomposed — no flat text field)
	permHouseBlockLot: varchar('perm_house_block_lot', { length: 150 }),
	permStreet:        varchar('perm_street',        { length: 150 }),
	permSubdivision:   varchar('perm_subdivision',   { length: 150 }),
	permBarangay:      varchar('perm_barangay',      { length: 150 }),
	permCity:          varchar('perm_city',          { length: 150 }),
	permProvince:      varchar('perm_province',      { length: 150 }),
	permRegion:        varchar('perm_region',        { length: 150 }),
	permanentZipCode:  varchar('permanent_zip_code', { length: 10 }),

	createdAt: timestamp('created_at', { mode: 'string' }).defaultNow(),
}, (table) => [
	index('idx_pds_pi_employee_id').on(table.employeeId),
	primaryKey({ columns: [table.id], name: 'pds_personal_information_id' }),
	unique('uq_pds_pi_employee_id').on(table.employeeId),         // one row per employee
	unique('uq_pds_gsis_number').on(table.gsisNumber),
	unique('uq_pds_pagibig_number').on(table.pagibigNumber),
	unique('uq_pds_philhealth_number').on(table.philhealthNumber),
	unique('uq_pds_sss_number').on(table.sssNumber),
	unique('uq_pds_tin_number').on(table.tinNumber),
	unique('uq_pds_umid_number').on(table.umidNumber),
	unique('uq_pds_philsys_id').on(table.philsysId),
]);

// ─────────────────────────────────────────────────────────────────────────────
// PDS DECLARATIONS (CS Form 212 — Questions 34–40 + Government ID + C4)
// All boolean declaration fields use the BOOLEAN type (TINYINT 0/1 in MySQL).
// ─────────────────────────────────────────────────────────────────────────────
export const pdsDeclarations = mysqlTable('pds_declarations', {
	id:         int('id').autoincrement().notNull(),
	employeeId: int('employee_id').notNull().references(() => authentication.id, { onDelete: 'cascade' }),

	// Q34 — Related to 3rd degree
	relatedThirdDegree:  boolean('related_third_degree').default(false),
	relatedThirdDetails: text('related_third_details'),

	// Q34 — Related to 4th degree
	relatedFourthDegree:  boolean('related_fourth_degree').default(false),
	relatedFourthDetails: text('related_fourth_details'),

	// Q35 — Found guilty of administrative offense
	foundGuiltyAdmin:   boolean('found_guilty_admin').default(false),
	foundGuiltyDetails: text('found_guilty_details'),

	// Q36 — Criminally charged
	criminallyCharged: boolean('criminally_charged').default(false),
	dateFiled:         date('date_filed', { mode: 'string' }),
	statusOfCase:      varchar('status_of_case', { length: 255 }),

	// Q37 — Convicted of any crime
	convictedCrime:   boolean('convicted_crime').default(false),
	convictedDetails: text('convicted_details'),

	// Q38 — Separated from service
	separatedFromService: boolean('separated_from_service').default(false),
	separatedDetails:     text('separated_details'),

	// Q39 — Candidate for any election
	electionCandidate: boolean('election_candidate').default(false),
	electionDetails:   text('election_details'),

	// Q39 — Resigned to promote candidacy
	resignedToPromote: boolean('resigned_to_promote').default(false),
	resignedDetails:   text('resigned_details'),

	// Q40 — Immigrant / dual citizenship
	immigrantStatus:  boolean('immigrant_status').default(false),
	immigrantDetails: text('immigrant_details'),

	// Q40 — Indigenous cultural community member
	indigenousMember:  boolean('indigenous_member').default(false),
	indigenousDetails: text('indigenous_details'),

	// Q40 — Person with disability
	personWithDisability: boolean('person_with_disability').default(false),
	disabilityIdNo:       varchar('disability_id_no', { length: 100 }),

	// Q40 — Solo parent
	soloParent:      boolean('solo_parent').default(false),
	soloParentIdNo:  varchar('solo_parent_id_no', { length: 100 }),

	// Government-issued ID (bottom of C4)
	govtIdType:     varchar('govt_id_type',    { length: 100 }),
	govtIdNo:       varchar('govt_id_no',      { length: 100 }),
	govtIdIssuance: varchar('govt_id_issuance', { length: 255 }),

	dateAccomplished: date('date_accomplished', { mode: 'string' }),

	createdAt: timestamp('created_at', { mode: 'string' }).defaultNow(),
	updatedAt: timestamp('updated_at', { mode: 'string' }).defaultNow().onUpdateNow(),
}, (table) => [
	index('idx_pds_decl_employee_id').on(table.employeeId),
	primaryKey({ columns: [table.id], name: 'pds_declarations_id' }),
]);

// ─────────────────────────────────────────────────────────────────────────────
// PDS HR DETAILS (Employment assignment — one row per employee)
// Removed: religion, barangay, facebookUrl, linkedinUrl, twitterHandle,
//          experienceSummary (personal extras — not HR data),
//          employmentType (duplicate of appointmentType).
// ─────────────────────────────────────────────────────────────────────────────
export const pdsHrDetails = mysqlTable('pds_hr_details', {
	id:         int('id').autoincrement().notNull(),
	employeeId: int('employee_id').notNull().references(() => authentication.id, { onDelete: 'cascade' }),

	// Employment status & appointment
	employmentStatus: mysqlEnum('employment_status', [
		'Active', 'Probationary', 'Terminated', 'Resigned',
		'On Leave', 'Suspended', 'Verbal Warning', 'Written Warning', 'Show Cause',
	]).default('Active'),
	appointmentType: mysqlEnum('appointment_type', [
		'Permanent', 'Contractual', 'Casual', 'Job Order',
		'Coterminous', 'Temporary', 'Contract of Service', 'JO', 'COS',
	]),

	// Job assignment
	jobTitle:      varchar('job_title',      { length: 100 }),
	positionTitle: varchar('position_title', { length: 100 }),
	itemNumber:    varchar('item_number',    { length: 50 }),
	station:       varchar('station',        { length: 100 }),
	officeAddress: text('office_address'),
	departmentId:  int('department_id').references(() => departments.id, { onDelete: 'set null' }),
	positionId:    int('position_id').references(() => plantillaPositions.id, { onDelete: 'set null' }),
	managerId:     int('manager_id'),

	// Rank & salary
	salaryGrade:  varchar('salary_grade', { length: 10 }),
	stepIncrement: int('step_increment').default(1),
	salaryBasis:  mysqlEnum('salary_basis', ['Daily', 'Hourly']).default('Daily'),

	// Dates
	dateHired:                date('date_hired',                  { mode: 'string' }),
	contractEndDate:          date('contract_end_date',           { mode: 'string' }),
	regularizationDate:       date('regularization_date',         { mode: 'string' }),
	firstDayOfService:        date('first_day_of_service',        { mode: 'string' }),
	originalAppointmentDate:  date('original_appointment_date',   { mode: 'string' }),
	lastPromotionDate:        date('last_promotion_date',         { mode: 'string' }),

	// Shift & schedule
	dutyType:         mysqlEnum('duty_type', ['Standard', 'Irregular']).default('Standard'),
	dailyTargetHours: decimal('daily_target_hours', { precision: 4, scale: 2 }).default('8.00'),
	startTime:        varchar('start_time', { length: 50 }),
	endTime:          varchar('end_time',   { length: 50 }),

	// Profile metadata
	isRegular:     boolean('is_regular').default(false),
	isOldEmployee: boolean('is_old_employee').default(false),
	isMeycauayan:  boolean('is_meycauayan').default(false),
	profileStatus: mysqlEnum('profile_status', ['Initial', 'Complete']).default('Initial'),

	createdAt: timestamp('created_at', { mode: 'string' }).defaultNow(),
	updatedAt: timestamp('updated_at', { mode: 'string' }).defaultNow().onUpdateNow(),
}, (table) => [
	index('idx_pds_hr_employee_id').on(table.employeeId),
	primaryKey({ columns: [table.id], name: 'pds_hr_details_id' }),
	unique('uq_pds_hr_employee_id').on(table.employeeId),    // one HR record per employee
]);

// ─────────────────────────────────────────────────────────────────────────────
// EMPLOYEE EMERGENCY CONTACTS (unchanged — correct as-is)
// ─────────────────────────────────────────────────────────────────────────────
export const employeeEmergencyContacts = mysqlTable('employee_emergency_contacts', {
	id:           int('id').autoincrement().notNull(),
	employeeId:   int('employee_id').notNull().references(() => authentication.id, { onDelete: 'cascade' }),
	name:         varchar('name',         { length: 100 }).notNull(),
	relationship: varchar('relationship', { length: 50 }).notNull(),
	phoneNumber:  varchar('phone_number', { length: 20 }).notNull(),
	email:        varchar('email',        { length: 100 }),
	address:      text('address'),
	isPrimary:    boolean('is_primary').default(false),
	createdAt:    timestamp('created_at', { mode: 'string' }).defaultNow(),
}, (table) => [
	index('idx_eec_employee_id').on(table.employeeId),
	primaryKey({ columns: [table.id], name: 'employee_emergency_contacts_id' }),
]);

// ─────────────────────────────────────────────────────────────────────────────
// EMPLOYEE CUSTOM FIELDS (unchanged)
// ─────────────────────────────────────────────────────────────────────────────
export const employeeCustomFields = mysqlTable('employee_custom_fields', {
	id:          int('id').autoincrement().notNull(),
	employeeId:  int('employee_id').notNull().references(() => authentication.id, { onDelete: 'cascade' }),
	section:     varchar('section',     { length: 255 }).notNull(),
	fieldName:   varchar('field_name',  { length: 255 }).notNull(),
	fieldValue:  text('field_value'),
	createdAt:   timestamp('created_at', { mode: 'string' }).defaultNow(),
	updatedAt:   timestamp('updated_at', { mode: 'string' }).defaultNow().onUpdateNow(),
}, (table) => [
	index('idx_ecf_employee_id').on(table.employeeId),
	primaryKey({ columns: [table.id], name: 'employee_custom_fields_id' }),
]);

// ─────────────────────────────────────────────────────────────────────────────
// EMPLOYEE DOCUMENTS (unchanged)
// ─────────────────────────────────────────────────────────────────────────────
export const employeeDocuments = mysqlTable('employee_documents', {
	id:           int('id').autoincrement().notNull(),
	employeeId:   int('employee_id').notNull().references(() => authentication.id, { onDelete: 'cascade' }),
	documentName: varchar('document_name', { length: 255 }).notNull(),
	documentType: varchar('document_type', { length: 50 }),
	filePath:     varchar('file_path',     { length: 255 }).notNull(),
	fileSize:     int('file_size'),
	mimeType:     varchar('mime_type',     { length: 100 }),
	uploadedBy:   int('uploaded_by').references(() => authentication.id, { onDelete: 'set null' }),
	createdAt:    timestamp('created_at', { mode: 'string' }).defaultNow(),
}, (table) => [
	index('idx_ed_employee_id').on(table.employeeId),
	index('idx_ed_uploaded_by').on(table.uploadedBy),
	primaryKey({ columns: [table.id], name: 'employee_documents_id' }),
]);

// ─────────────────────────────────────────────────────────────────────────────
// EMPLOYEE MEMOS (unchanged)
// ─────────────────────────────────────────────────────────────────────────────
export const employeeMemos = mysqlTable('employee_memos', {
	id:                     int('id').autoincrement().notNull(),
	memoNumber:             varchar('memo_number', { length: 50 }).notNull(),
	employeeId:             int('employee_id').notNull().references(() => authentication.id, { onDelete: 'cascade' }),
	authorId:               int('author_id').notNull().references(() => authentication.id, { onDelete: 'cascade' }),
	memoType:               mysqlEnum('memo_type', ['Verbal Warning', 'Written Warning', 'Reprimand', 'Suspension Notice', 'Termination Notice', 'Show Cause']).default('Written Warning').notNull(),
	subject:                varchar('subject', { length: 255 }).notNull(),
	content:                text('content').notNull(),
	priority:               mysqlEnum('priority', ['Low', 'Normal', 'High', 'Urgent']).default('Normal').notNull(),
	severity:               mysqlEnum('severity', ['minor', 'moderate', 'major', 'grave', 'terminal']).default('minor').notNull(),
	effectiveDate:          date('effective_date', { mode: 'string' }),
	acknowledgmentRequired: boolean('acknowledgment_required').default(false),
	acknowledgedAt:         datetime('acknowledged_at', { mode: 'string' }),
	status:                 mysqlEnum('status', ['Draft', 'Sent', 'Acknowledged', 'Archived']).default('Draft').notNull(),
	createdAt:              timestamp('created_at', { mode: 'string' }).defaultNow(),
	updatedAt:              timestamp('updated_at', { mode: 'string' }).defaultNow().onUpdateNow(),
}, (table) => [
	index('idx_em_author_id').on(table.authorId),
	index('idx_em_employee_id').on(table.employeeId),
	index('idx_em_memo_type').on(table.memoType),
	index('idx_em_status').on(table.status),
	primaryKey({ columns: [table.id], name: 'employee_memos_id' }),
	unique('uq_memo_number').on(table.memoNumber),
]);

// ─────────────────────────────────────────────────────────────────────────────
// EMPLOYEE NOTES (unchanged)
// ─────────────────────────────────────────────────────────────────────────────
export const employeeNotes = mysqlTable('employee_notes', {
	id:          int('id').autoincrement().notNull(),
	employeeId:  int('employee_id').notNull().references(() => authentication.id, { onDelete: 'cascade' }),
	authorId:    int('author_id').notNull().references(() => authentication.id, { onDelete: 'cascade' }),
	noteContent: text('note_content').notNull(),
	category:    varchar('category', { length: 50 }).default('General'),
	isPrivate:   boolean('is_private').default(true),
	createdAt:   timestamp('created_at', { mode: 'string' }).defaultNow(),
}, (table) => [
	index('idx_en_employee_id').on(table.employeeId),
	index('idx_en_author_id').on(table.authorId),
	primaryKey({ columns: [table.id], name: 'employee_notes_id' }),
]);

// ─────────────────────────────────────────────────────────────────────────────
// EMPLOYEE SKILLS (unchanged)
// ─────────────────────────────────────────────────────────────────────────────
export const employeeSkills = mysqlTable('employee_skills', {
	id:               int('id').autoincrement().notNull(),
	employeeId:       int('employee_id').notNull().references(() => authentication.id, { onDelete: 'cascade' }),
	skillName:        varchar('skill_name', { length: 100 }).notNull(),
	category:         varchar('category',   { length: 50 }).default('Technical'),
	proficiencyLevel: mysqlEnum('proficiency_level', ['Beginner', 'Intermediate', 'Advanced', 'Expert']).default('Intermediate'),
	yearsExperience:  decimal('years_experience', { precision: 4, scale: 1 }),
	endorsements:     int('endorsements').default(0),
	createdAt:        timestamp('created_at', { mode: 'string' }).defaultNow(),
}, (table) => [
	index('idx_es_employee_id').on(table.employeeId),
	primaryKey({ columns: [table.id], name: 'employee_skills_id' }),
]);

// ─────────────────────────────────────────────────────────────────────────────
// SERVICE RECORDS (unchanged)
// ─────────────────────────────────────────────────────────────────────────────
export const serviceRecords = mysqlTable('service_records', {
	id:            int('id').autoincrement().notNull(),
	employeeId:    int('employee_id').notNull().references(() => authentication.id, { onDelete: 'cascade' }),
	eventType:     mysqlEnum('event_type', [
		'Appointment', 'Promotion', 'Leave', 'LWOP',
		'Return from Leave', 'Transfer', 'Suspension',
		'Resignation', 'Retirement', 'Other',
	]).notNull(),
	eventDate:     date('event_date', { mode: 'string' }).notNull(),
	endDate:       date('end_date',   { mode: 'string' }),
	leaveType:     varchar('leave_type',     { length: 50 }),
	daysCount:     decimal('days_count',     { precision: 5, scale: 1 }),
	isWithPay:     boolean('is_with_pay').default(true),
	remarks:       text('remarks'),
	referenceId:   int('reference_id'),
	referenceType: varchar('reference_type', { length: 50 }),
	processedBy:   varchar('processed_by',   { length: 50 }),
	createdAt:     timestamp('created_at', { mode: 'string' }).defaultNow(),
	updatedAt:     timestamp('updated_at', { mode: 'string' }).defaultNow().onUpdateNow(),
}, (table) => [
	index('idx_sr_employee_id').on(table.employeeId),
	index('idx_sr_event_type').on(table.eventType),
	index('idx_sr_event_date').on(table.eventDate),
	primaryKey({ columns: [table.id], name: 'service_records_id' }),
]);
