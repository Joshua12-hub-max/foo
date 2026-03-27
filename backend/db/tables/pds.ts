import { mysqlTable, varchar, int, date, timestamp, decimal, mysqlEnum, boolean, primaryKey, index, unique, text, datetime } from 'drizzle-orm/mysql-core';
import { authentication } from './auth.js';
import { departments } from './hr.js';
import { plantillaPositions } from './plantilla.js';

export const pdsEducation = mysqlTable("pds_education", {
	id: int("id").autoincrement().notNull(),
	employeeId: int("employee_id").notNull().references(() => authentication.id, { onDelete: "cascade" } ),
	level: mysqlEnum("level", ['Elementary','Secondary','Vocational','College','Graduate Studies']).notNull(),
	schoolName: varchar("school_name", { length: 255 }).notNull(),
	degreeCourse: varchar("degree_course", { length: 255 }),
	yearGraduated: int("year_graduated"),
	unitsEarned: varchar("units_earned", { length: 50 }),
	dateFrom: int("date_from"),
	dateTo: int("date_to"),
	honors: varchar("honors", { length: 255 }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
},
(table) => [
	index("employee_id").on(table.employeeId),
	primaryKey({ columns: [table.id], name: "pds_education_id"}),
]);

export const pdsEligibility = mysqlTable("pds_eligibility", {
	id: int("id").autoincrement().notNull(),
	employeeId: int("employee_id").notNull().references(() => authentication.id, { onDelete: "cascade" } ),
	eligibilityName: varchar("eligibility_name", { length: 255 }).notNull(),
	rating: decimal("rating", { precision: 5, scale: 2 }),
	examDate: date("exam_date", { mode: 'string' }),
	examPlace: varchar("exam_place", { length: 255 }),
	licenseNumber: varchar("license_number", { length: 50 }),
	validityDate: date("validity_date", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
},
(table) => [
	index("employee_id").on(table.employeeId),
	primaryKey({ columns: [table.id], name: "pds_eligibility_id"}),
]);

export const pdsFamily = mysqlTable("pds_family", {
	id: int("id").autoincrement().notNull(),
	employeeId: int("employee_id").notNull().references(() => authentication.id, { onDelete: "cascade" } ),
	relationType: mysqlEnum("relation_type", ['Spouse','Father','Mother','Child']).notNull(),
	lastName: varchar("last_name", { length: 100 }),
	firstName: varchar("first_name", { length: 100 }),
	middleName: varchar("middle_name", { length: 100 }),
	nameExtension: varchar("name_extension", { length: 10 }),
	occupation: varchar("occupation", { length: 100 }),
	employer: varchar("employer", { length: 100 }),
	businessAddress: varchar("business_address", { length: 255 }),
	telephoneNo: varchar("telephone_no", { length: 50 }),
	dateOfBirth: date("date_of_birth", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
},
(table) => [
	index("idx_emp").on(table.employeeId),
	primaryKey({ columns: [table.id], name: "pds_family_id"}),
]);

export const pdsLearningDevelopment = mysqlTable("pds_learning_development", {
	id: int("id").autoincrement().notNull(),
	employeeId: int("employee_id").notNull().references(() => authentication.id, { onDelete: "cascade" } ),
	title: varchar("title", { length: 255 }).notNull(),
	dateFrom: date("date_from", { mode: 'string' }),
	dateTo: date("date_to", { mode: 'string' }),
	hoursNumber: int("hours_number"),
	typeOfLd: varchar("type_of_ld", { length: 50 }),
	conductedBy: varchar("conducted_by", { length: 255 }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
},
(table) => [
	index("employee_id").on(table.employeeId),
	primaryKey({ columns: [table.id], name: "pds_learning_development_id"}),
]);

export const pdsOtherInfo = mysqlTable("pds_other_info", {
	id: int("id").autoincrement().notNull(),
	employeeId: int("employee_id").notNull().references(() => authentication.id, { onDelete: "cascade" } ),
	type: mysqlEnum("type", ['Skill','Recognition','Membership']).notNull(),
	description: varchar("description", { length: 255 }).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
},
(table) => [
	index("employee_id").on(table.employeeId),
	primaryKey({ columns: [table.id], name: "pds_other_info_id"}),
]);

export const pdsReferences = mysqlTable("pds_references", {
	id: int("id").autoincrement().notNull(),
	employeeId: int("employee_id").notNull().references(() => authentication.id, { onDelete: "cascade" } ),
	name: varchar("name", { length: 255 }).notNull(),
	address: varchar("address", { length: 255 }),
	telNo: varchar("tel_no", { length: 50 }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
},
(table) => [
	index("employee_id").on(table.employeeId),
	primaryKey({ columns: [table.id], name: "pds_references_id"}),
]);

export const pdsVoluntaryWork = mysqlTable("pds_voluntary_work", {
	id: int("id").autoincrement().notNull(),
	employeeId: int("employee_id").notNull().references(() => authentication.id, { onDelete: "cascade" } ),
	organizationName: varchar("organization_name", { length: 255 }).notNull(),
	address: varchar("address", { length: 255 }),
	dateFrom: date("date_from", { mode: 'string' }),
	dateTo: date("date_to", { mode: 'string' }),
	hoursNumber: int("hours_number"),
	position: varchar("position", { length: 100 }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
},
(table) => [
	index("employee_id").on(table.employeeId),
	primaryKey({ columns: [table.id], name: "pds_voluntary_work_id"}),
]);

export const pdsWorkExperience = mysqlTable("pds_work_experience", {
	id: int("id").autoincrement().notNull(),
	employeeId: int("employee_id").notNull().references(() => authentication.id, { onDelete: "cascade" } ),
	dateFrom: date("date_from", { mode: 'string' }).notNull(),
	dateTo: date("date_to", { mode: 'string' }),
	positionTitle: varchar("position_title", { length: 255 }).notNull(),
	companyName: varchar("company_name", { length: 255 }).notNull(),
	monthlySalary: decimal("monthly_salary", { precision: 12, scale: 2 }),
	salaryGrade: varchar("salary_grade", { length: 20 }),
	appointmentStatus: varchar("appointment_status", { length: 50 }),
	isGovernment: boolean("is_government").default(false),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
},
(table) => [
	index("employee_id").on(table.employeeId),
	primaryKey({ columns: [table.id], name: "pds_work_experience_id"}),
]);

export const employeeCustomFields = mysqlTable("employee_custom_fields", {
	id: int("id").autoincrement().notNull(),
	employeeId: int("employee_id").notNull().references(() => authentication.id, { onDelete: "cascade" } ),
	section: varchar("section", { length: 255 }).notNull(),
	fieldName: varchar("field_name", { length: 255 }).notNull(),
	fieldValue: text("field_value"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().onUpdateNow(),
},
(table) => [
	index("employee_id").on(table.employeeId),
	primaryKey({ columns: [table.id], name: "employee_custom_fields_id"}),
]);

export const employeeDocuments = mysqlTable("employee_documents", {
	id: int().autoincrement().notNull(),
	employeeId: int("employee_id").notNull().references(() => authentication.id, { onDelete: "cascade" } ),
	documentName: varchar("document_name", { length: 255 }).notNull(),
	documentType: varchar("document_type", { length: 50 }),
	filePath: varchar("file_path", { length: 255 }).notNull(),
	fileSize: int("file_size"),
	mimeType: varchar("mime_type", { length: 100 }),
	uploadedBy: int("uploaded_by").references(() => authentication.id, { onDelete: "set null" } ),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
},
(table) => [
	index("employee_id").on(table.employeeId),
	index("uploaded_by").on(table.uploadedBy),
	primaryKey({ columns: [table.id], name: "employee_documents_id"}),
]);

export const employeeEducation = mysqlTable("employee_education", {
	id: int("id").autoincrement().notNull(),
	employeeId: int("employee_id").notNull().references(() => authentication.id, { onDelete: "cascade" } ),
	institution: varchar("institution", { length: 255 }).notNull(),
	degree: varchar("degree", { length: 255 }),
	fieldOfStudy: varchar("field_of_study", { length: 255 }),
	startDate: date("start_date", { mode: 'string' }),
	endDate: date("end_date", { mode: 'string' }),
	isCurrent: boolean("is_current").default(false),
	description: text("description"),
	type: mysqlEnum("type", ['Education','Certification','Training']).default('Education'),
	expiryDate: date("expiry_date", { mode: 'string' }),
	credentialUrl: varchar("credential_url", { length: 255 }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
},
(table) => [
	index("employee_id").on(table.employeeId),
	primaryKey({ columns: [table.id], name: "employee_education_id"}),
]);

export const employeeEmergencyContacts = mysqlTable("employee_emergency_contacts", {
	id: int("id").autoincrement().notNull(),
	employeeId: int("employee_id").notNull().references(() => authentication.id, { onDelete: "cascade" } ),
	name: varchar("name", { length: 100 }).notNull(),
	relationship: varchar("relationship", { length: 50 }).notNull(),
	phoneNumber: varchar("phone_number", { length: 20 }).notNull(),
	email: varchar("email", { length: 100 }),
	address: text("address"),
	isPrimary: boolean("is_primary").default(false),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
},
(table) => [
	index("employee_id").on(table.employeeId),
	primaryKey({ columns: [table.id], name: "employee_emergency_contacts_id"}),
]);

export const employeeEmploymentHistory = mysqlTable("employee_employment_history", {
	id: int("id").autoincrement().notNull(),
	employeeId: int("employee_id").notNull().references(() => authentication.id, { onDelete: "cascade" } ),
	companyName: varchar("company_name", { length: 255 }).notNull(),
	jobTitle: varchar("job_title", { length: 100 }).notNull(),
	startDate: date("start_date", { mode: 'string' }).notNull(),
	endDate: date("end_date", { mode: 'string' }),
	isCurrent: boolean("is_current").default(false),
	description: text("description"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
},
(table) => [
	index("employee_id").on(table.employeeId),
	primaryKey({ columns: [table.id], name: "employee_employment_history_id"}),
]);

export const employeeMemos = mysqlTable("employee_memos", {
	id: int("id").autoincrement().notNull(),
	memoNumber: varchar("memo_number", { length: 50 }).notNull(),
	employeeId: int("employee_id").notNull().references(() => authentication.id, { onDelete: "cascade" } ),
	authorId: int("author_id").notNull().references(() => authentication.id, { onDelete: "cascade" } ),
	memoType: mysqlEnum("memo_type", ['Verbal Warning','Written Warning','Reprimand','Suspension Notice','Termination Notice','Show Cause']).default('Written Warning').notNull(),
	subject: varchar("subject", { length: 255 }).notNull(),
	content: text("content").notNull(),
	priority: mysqlEnum("priority", ['Low','Normal','High','Urgent']).default('Normal').notNull(),
	severity: mysqlEnum("severity", ['minor','moderate','major','grave','terminal']).default('minor').notNull(),
	effectiveDate: date("effective_date", { mode: 'string' }),
	acknowledgmentRequired: boolean("acknowledgment_required").default(false),
	acknowledgedAt: datetime("acknowledged_at", { mode: 'string'}),
	status: mysqlEnum("status", ['Draft','Sent','Acknowledged','Archived']).default('Draft').notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().onUpdateNow(),
},
(table) => [
	index("author_id").on(table.authorId),
	index("idx_memo_employee").on(table.employeeId),
	index("idx_memo_type").on(table.memoType),
	index("idx_memo_status").on(table.status),
	primaryKey({ columns: [table.id], name: "employee_memos_id"}),
	unique("memo_number").on(table.memoNumber),
]);

export const employeeNotes = mysqlTable("employee_notes", {
	id: int("id").autoincrement().notNull(),
	employeeId: int("employee_id").notNull().references(() => authentication.id, { onDelete: "cascade" } ),
	authorId: int("author_id").notNull().references(() => authentication.id, { onDelete: "cascade" } ),
	noteContent: text("note_content").notNull(),
	category: varchar("category", { length: 50 }).default('General'),
	isPrivate: boolean("is_private").default(true),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
},
(table) => [
	index("employee_id").on(table.employeeId),
	index("author_id").on(table.authorId),
	primaryKey({ columns: [table.id], name: "employee_notes_id"}),
]);

export const employeeSkills = mysqlTable("employee_skills", {
	id: int("id").autoincrement().notNull(),
	employeeId: int("employee_id").notNull().references(() => authentication.id, { onDelete: "cascade" } ),
	skillName: varchar("skill_name", { length: 100 }).notNull(),
	category: varchar("category", { length: 50 }).default('Technical'),
	proficiencyLevel: mysqlEnum("proficiency_level", ['Beginner','Intermediate','Advanced','Expert']).default('Intermediate'),
	yearsExperience: decimal("years_experience", { precision: 4, scale: 1 }),
	endorsements: int("endorsements").default(0),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
},
(table) => [
	index("employee_id").on(table.employeeId),
	primaryKey({ columns: [table.id], name: "employee_skills_id"}),
]);

export const serviceRecords = mysqlTable("service_records", {
	id: int("id").autoincrement().notNull(),
	employeeId: varchar("employee_id", { length: 50 }).notNull(),
	eventType: mysqlEnum("event_type", ['Appointment','Promotion','Leave','LWOP','Return from Leave','Transfer','Suspension','Resignation','Retirement','Other']).notNull(),
	eventDate: date("event_date", { mode: 'string' }).notNull(),
	endDate: date("end_date", { mode: 'string' }),
	leaveType: varchar("leave_type", { length: 50 }),
	daysCount: decimal("days_count", { precision: 5, scale: 1 }),
	isWithPay: boolean("is_with_pay").default(true),
	remarks: text("remarks"),
	referenceId: int("reference_id"),
	referenceType: varchar("reference_type", { length: 50 }),
	processedBy: varchar("processed_by", { length: 50 }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().onUpdateNow(),
},
(table) => [
	index("idx_employee").on(table.employeeId),
	index("idx_event_type").on(table.eventType),
	index("idx_event_date").on(table.eventDate),
	primaryKey({ columns: [table.id], name: "service_records_id"}),
]);

export const pdsPersonalInformation = mysqlTable("pds_personal_information", {
	id: int("id").autoincrement().notNull(),
	employeeId: int("employee_id").notNull().references(() => authentication.id, { onDelete: "cascade" } ),
	birthDate: date("birth_date", { mode: 'string' }),
	placeOfBirth: varchar("place_of_birth", { length: 255 }),
	gender: mysqlEnum("gender", ['Male','Female']),
	civilStatus: mysqlEnum("civil_status", ['Single','Married','Widowed','Separated','Annulled']),
	heightM: decimal("height_m", { precision: 4, scale: 2 }),
	weightKg: decimal("weight_kg", { precision: 5, scale: 2 }),
	bloodType: varchar("blood_type", { length: 5 }),
	citizenship: varchar("citizenship", { length: 50 }).default('Filipino'),
	citizenshipType: varchar("citizenship_type", { length: 50 }),
	dualCountry: varchar("dual_country", { length: 100 }),
	residentialAddress: text("residential_address"),
	residentialZipCode: varchar("residential_zip_code", { length: 50 }),
	permanentAddress: text("permanent_address"),
	permanentZipCode: varchar("permanent_zip_code", { length: 50 }),
	telephoneNo: varchar("telephone_no", { length: 50 }),
	mobileNo: varchar("mobile_no", { length: 50 }),
	email: varchar("email", { length: 255 }),
	umidNumber: varchar("umid_no", { length: 50 }),
	philsysId: varchar("philsys_id", { length: 50 }),
	philhealthNumber: varchar("philhealth_number", { length: 50 }),
	pagibigNumber: varchar("pagibig_number", { length: 50 }),
	tinNumber: varchar("tin_number", { length: 50 }),
	gsisNumber: varchar("gsis_number", { length: 50 }),
	agencyEmployeeNo: varchar("agency_employee_no", { length: 50 }),
	
	resHouseBlockLot: varchar("res_house_block_lot", { length: 150 }),
	resStreet: varchar("res_street", { length: 150 }),
	resSubdivision: varchar("res_subdivision", { length: 150 }),
	resBarangay: varchar("res_barangay", { length: 150 }),
	resCity: varchar("res_city", { length: 150 }),
	resProvince: varchar("res_province", { length: 150 }),
	resRegion: varchar("res_region", { length: 150 }),
	permHouseBlockLot: varchar("perm_house_block_lot", { length: 150 }),
	permStreet: varchar("perm_street", { length: 150 }),
	permSubdivision: varchar("perm_subdivision", { length: 150 }),
	permBarangay: varchar("perm_barangay", { length: 150 }),
	permCity: varchar("perm_city", { length: 150 }),
	permProvince: varchar("perm_province", { length: 150 }),
	permRegion: varchar("perm_region", { length: 150 }),

	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().onUpdateNow(),
},
(table) => [
	index("employee_id").on(table.employeeId),
	primaryKey({ columns: [table.id], name: "pds_personal_information_id"}),
	unique("umid_no_unique").on(table.umidNumber),
	unique("philsys_id_unique").on(table.philsysId),
	unique("philhealth_no_unique").on(table.philhealthNumber),
	unique("pagibig_no_unique").on(table.pagibigNumber),
	unique("tin_no_unique").on(table.tinNumber),
	unique("gsis_no_unique").on(table.gsisNumber),
]);

export const pdsDeclarations = mysqlTable("pds_declarations", {
	id: int("id").autoincrement().notNull(),
	employeeId: int("employee_id").notNull().references(() => authentication.id, { onDelete: "cascade" } ),
	relatedThirdDegree: varchar("related_third_degree", { length: 10 }),
	relatedThirdDetails: text("related_third_details"),
	relatedFourthDegree: varchar("related_fourth_degree", { length: 10 }),
	relatedFourthDetails: text("related_fourth_details"),
	foundGuiltyAdmin: varchar("found_guilty_admin", { length: 10 }),
	foundGuiltyDetails: text("found_guilty_details"),
	criminallyCharged: varchar("criminally_charged", { length: 10 }),
	dateFiled: date("date_filed", { mode: 'string' }),
	statusOfCase: varchar("status_of_case", { length: 255 }),
	convictedCrime: varchar("convicted_crime", { length: 10 }),
	convictedDetails: text("convicted_details"),
	separatedFromService: varchar("separated_from_service", { length: 10 }),
	separatedDetails: text("separated_details"),
	electionCandidate: varchar("election_candidate", { length: 10 }),
	electionDetails: text("election_details"),
	resignedToPromote: varchar("resigned_to_promote", { length: 10 }),
	resignedDetails: text("resigned_details"),
	immigrantStatus: varchar("immigrant_status", { length: 10 }),
	immigrantDetails: text("immigrant_details"),
	indigenousMember: varchar("indigenous_member", { length: 10 }),
	indigenousDetails: text("indigenous_details"),
	personWithDisability: varchar("person_with_disability", { length: 10 }),
	disabilityIdNo: varchar("disability_id_no", { length: 100 }),
	soloParent: varchar("solo_parent", { length: 10 }),
	soloParentIdNo: varchar("solo_parent_id_no", { length: 100 }),
	govtIdType: varchar("govt_id_type", { length: 100 }),
	govtIdNo: varchar("govt_id_no", { length: 100 }),
	govtIdIssuance: varchar("govt_id_issuance", { length: 255 }),
	dateAccomplished: date("date_accomplished", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().onUpdateNow(),
},
(table) => [
	index("employee_id").on(table.employeeId),
	primaryKey({ columns: [table.id], name: "pds_declarations_id"}),
]);

export const pdsHrDetails = mysqlTable("pds_hr_details", {
	id: int("id").autoincrement().notNull(),
	employeeId: int("employee_id").notNull().references(() => authentication.id, { onDelete: "cascade" } ),
	
	// Employment Status & Type
	employmentStatus: mysqlEnum("employment_status", ['Active','Probationary','Terminated','Resigned','On Leave','Suspended','Verbal Warning','Written Warning','Show Cause']).default('Active'),
	employmentType: varchar("employment_type", { length: 50 }).default('Probationary'),
	appointmentType: mysqlEnum("appointment_type", ['Permanent','Contractual','Casual','Job Order','Coterminous','Temporary','Contract of Service','JO','COS']),
	
	// Job Details
	jobTitle: varchar("job_title", { length: 100 }),
	positionTitle: varchar("position_title", { length: 100 }),
	itemNumber: varchar("item_number", { length: 50 }),
	station: varchar("station", { length: 100 }),
	officeAddress: text("office_address"),
	departmentId: int("department_id").references(() => departments.id, { onDelete: "set null" } ),
	positionId: int("position_id").references(() => plantillaPositions.id, { onDelete: "set null" } ),
	managerId: int("manager_id"),
	
	// Rank & Salary
	salaryGrade: varchar("salary_grade", { length: 10 }),
	stepIncrement: int("step_increment").default(1),
	salaryBasis: mysqlEnum("salary_basis", ['Daily','Hourly']).default('Daily'),
	
	// Dates
	dateHired: date("date_hired", { mode: 'string' }),
	contractEndDate: date("contract_end_date", { mode: 'string' }),
	regularizationDate: date("regularization_date", { mode: 'string' }),
	firstDayOfService: date("first_day_of_service", { mode: 'string' }),
	originalAppointmentDate: date("original_appointment_date", { mode: 'string' }),
	lastPromotionDate: date("last_promotion_date", { mode: 'string' }),
	
	// Shift & Routine
	dutyType: mysqlEnum("duty_type", ['Standard', 'Irregular']).default('Standard'),
	dailyTargetHours: decimal("daily_target_hours", { precision: 4, scale: 2 }).default('8.00'),
	startTime: varchar("start_time", { length: 50 }),
	endTime: varchar("end_time", { length: 50 }),
	
	// Profile Metadata
	isRegular: boolean("is_regular").default(false),
	isOldEmployee: boolean("is_old_employee").default(false),
	isMeycauayan: boolean("is_meycauayan").default(false),
	profileStatus: mysqlEnum("profile_status", ['Initial', 'Complete']).default('Initial'),
	
	// Personal/Social Info
	religion: varchar("religion", { length: 100 }),
	barangay: varchar("barangay", { length: 100 }), // Current assignment/residential area
	facebookUrl: varchar("facebook_url", { length: 255 }),
	linkedinUrl: varchar("linkedin_url", { length: 255 }),
	twitterHandle: varchar("twitter_handle", { length: 100 }),
	experienceSummary: text("experience_summary"),

	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().onUpdateNow(),
},
(table) => [
	index("idx_hr_employee_id").on(table.employeeId),
	primaryKey({ columns: [table.id], name: "pds_hr_details_id"}),
]);


