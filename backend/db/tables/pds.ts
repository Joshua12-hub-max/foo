import { mysqlTable, varchar, int, date, timestamp, decimal, mysqlEnum, boolean, primaryKey, index, unique, text, datetime } from 'drizzle-orm/mysql-core';
import { authentication } from './auth.js';

export const pdsEducation = mysqlTable("pds_education", {
	id: int().autoincrement().notNull(),
	employeeId: int("employee_id").notNull().references(() => authentication.id, { onDelete: "cascade" } ),
	level: mysqlEnum(['Elementary','Secondary','Vocational','College','Graduate Studies']).notNull(),
	schoolName: varchar("school_name", { length: 255 }).notNull(),
	degreeCourse: varchar("degree_course", { length: 255 }),
	yearGraduated: int("year_graduated"),
	unitsEarned: varchar("units_earned", { length: 50 }),
	dateFrom: int("date_from"),
	dateTo: int("date_to"),
	honors: varchar({ length: 255 }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
},
(table) => [
	index("employee_id").on(table.employeeId),
	primaryKey({ columns: [table.id], name: "pds_education_id"}),
]);

export const pdsEligibility = mysqlTable("pds_eligibility", {
	id: int().autoincrement().notNull(),
	employeeId: int("employee_id").notNull().references(() => authentication.id, { onDelete: "cascade" } ),
	eligibilityName: varchar("eligibility_name", { length: 255 }).notNull(),
	rating: decimal({ precision: 5, scale: 2 }),
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
	id: int().autoincrement().notNull(),
	employeeId: int("employee_id").notNull().references(() => authentication.id, { onDelete: "cascade" } ),
	relationType: mysqlEnum("relation_type", ['Spouse','Father','Mother','Child']).notNull(),
	lastName: varchar("last_name", { length: 100 }),
	firstName: varchar("first_name", { length: 100 }),
	middleName: varchar("middle_name", { length: 100 }),
	nameExtension: varchar("name_extension", { length: 10 }),
	occupation: varchar({ length: 100 }),
	employer: varchar({ length: 100 }),
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
	id: int().autoincrement().notNull(),
	employeeId: int("employee_id").notNull().references(() => authentication.id, { onDelete: "cascade" } ),
	title: varchar({ length: 255 }).notNull(),
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
	id: int().autoincrement().notNull(),
	employeeId: int("employee_id").notNull().references(() => authentication.id, { onDelete: "cascade" } ),
	type: mysqlEnum(['Skill','Recognition','Membership']).notNull(),
	description: varchar({ length: 255 }).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
},
(table) => [
	index("employee_id").on(table.employeeId),
	primaryKey({ columns: [table.id], name: "pds_other_info_id"}),
]);

export const pdsReferences = mysqlTable("pds_references", {
	id: int().autoincrement().notNull(),
	employeeId: int("employee_id").notNull().references(() => authentication.id, { onDelete: "cascade" } ),
	name: varchar({ length: 255 }).notNull(),
	address: varchar({ length: 255 }),
	telNo: varchar("tel_no", { length: 50 }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
},
(table) => [
	index("employee_id").on(table.employeeId),
	primaryKey({ columns: [table.id], name: "pds_references_id"}),
]);

export const pdsVoluntaryWork = mysqlTable("pds_voluntary_work", {
	id: int().autoincrement().notNull(),
	employeeId: int("employee_id").notNull().references(() => authentication.id, { onDelete: "cascade" } ),
	organizationName: varchar("organization_name", { length: 255 }).notNull(),
	address: varchar({ length: 255 }),
	dateFrom: date("date_from", { mode: 'string' }),
	dateTo: date("date_to", { mode: 'string' }),
	hoursNumber: int("hours_number"),
	position: varchar({ length: 100 }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
},
(table) => [
	index("employee_id").on(table.employeeId),
	primaryKey({ columns: [table.id], name: "pds_voluntary_work_id"}),
]);

export const pdsWorkExperience = mysqlTable("pds_work_experience", {
	id: int().autoincrement().notNull(),
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
	id: int().autoincrement().notNull(),
	employeeId: int("employee_id").notNull().references(() => authentication.id, { onDelete: "cascade" } ),
	section: varchar({ length: 255 }).notNull(),
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
	id: int().autoincrement().notNull(),
	employeeId: int("employee_id").notNull().references(() => authentication.id, { onDelete: "cascade" } ),
	institution: varchar({ length: 255 }).notNull(),
	degree: varchar({ length: 255 }),
	fieldOfStudy: varchar("field_of_study", { length: 255 }),
	startDate: date("start_date", { mode: 'string' }),
	endDate: date("end_date", { mode: 'string' }),
	isCurrent: boolean("is_current").default(false),
	description: text(),
	type: mysqlEnum(['Education','Certification','Training']).default('Education'),
	expiryDate: date("expiry_date", { mode: 'string' }),
	credentialUrl: varchar("credential_url", { length: 255 }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
},
(table) => [
	index("employee_id").on(table.employeeId),
	primaryKey({ columns: [table.id], name: "employee_education_id"}),
]);

export const employeeEmergencyContacts = mysqlTable("employee_emergency_contacts", {
	id: int().autoincrement().notNull(),
	employeeId: int("employee_id").notNull().references(() => authentication.id, { onDelete: "cascade" } ),
	name: varchar({ length: 100 }).notNull(),
	relationship: varchar({ length: 50 }).notNull(),
	phoneNumber: varchar("phone_number", { length: 20 }).notNull(),
	email: varchar({ length: 100 }),
	address: text(),
	isPrimary: boolean("is_primary").default(false),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
},
(table) => [
	index("employee_id").on(table.employeeId),
	primaryKey({ columns: [table.id], name: "employee_emergency_contacts_id"}),
]);

export const employeeEmploymentHistory = mysqlTable("employee_employment_history", {
	id: int().autoincrement().notNull(),
	employeeId: int("employee_id").notNull().references(() => authentication.id, { onDelete: "cascade" } ),
	companyName: varchar("company_name", { length: 255 }).notNull(),
	jobTitle: varchar("job_title", { length: 100 }).notNull(),
	startDate: date("start_date", { mode: 'string' }).notNull(),
	endDate: date("end_date", { mode: 'string' }),
	isCurrent: boolean("is_current").default(false),
	description: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
},
(table) => [
	index("employee_id").on(table.employeeId),
	primaryKey({ columns: [table.id], name: "employee_employment_history_id"}),
]);

export const employeeMemos = mysqlTable("employee_memos", {
	id: int().autoincrement().notNull(),
	memoNumber: varchar("memo_number", { length: 50 }).notNull(),
	employeeId: int("employee_id").notNull().references(() => authentication.id, { onDelete: "cascade" } ),
	authorId: int("author_id").notNull().references(() => authentication.id, { onDelete: "cascade" } ),
	memoType: mysqlEnum("memo_type", ['Verbal Warning','Written Warning','Reprimand','Suspension Notice','Termination Notice','Show Cause']).default('Written Warning').notNull(),
	subject: varchar({ length: 255 }).notNull(),
	content: text().notNull(),
	priority: mysqlEnum(['Low','Normal','High','Urgent']).default('Normal').notNull(),
	severity: mysqlEnum("severity", ['minor','moderate','major','grave','terminal']).default('minor').notNull(),
	effectiveDate: date("effective_date", { mode: 'string' }),
	acknowledgmentRequired: boolean("acknowledgment_required").default(false),
	acknowledgedAt: datetime("acknowledged_at", { mode: 'string'}),
	status: mysqlEnum(['Draft','Sent','Acknowledged','Archived']).default('Draft').notNull(),
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
	id: int().autoincrement().notNull(),
	employeeId: int("employee_id").notNull().references(() => authentication.id, { onDelete: "cascade" } ),
	authorId: int("author_id").notNull().references(() => authentication.id, { onDelete: "cascade" } ),
	noteContent: text("note_content").notNull(),
	category: varchar({ length: 50 }).default('General'),
	isPrivate: boolean("is_private").default(true),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
},
(table) => [
	index("employee_id").on(table.employeeId),
	index("author_id").on(table.authorId),
	primaryKey({ columns: [table.id], name: "employee_notes_id"}),
]);

export const employeeSkills = mysqlTable("employee_skills", {
	id: int().autoincrement().notNull(),
	employeeId: int("employee_id").notNull().references(() => authentication.id, { onDelete: "cascade" } ),
	skillName: varchar("skill_name", { length: 100 }).notNull(),
	category: varchar({ length: 50 }).default('Technical'),
	proficiencyLevel: mysqlEnum("proficiency_level", ['Beginner','Intermediate','Advanced','Expert']).default('Intermediate'),
	yearsExperience: decimal("years_experience", { precision: 4, scale: 1 }),
	endorsements: int().default(0),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
},
(table) => [
	index("employee_id").on(table.employeeId),
	primaryKey({ columns: [table.id], name: "employee_skills_id"}),
]);

export const serviceRecords = mysqlTable("service_records", {
	id: int().autoincrement().notNull(),
	employeeId: varchar("employee_id", { length: 50 }).notNull(),
	eventType: mysqlEnum("event_type", ['Appointment','Promotion','Leave','LWOP','Return from Leave','Transfer','Suspension','Resignation','Retirement','Other']).notNull(),
	eventDate: date("event_date", { mode: 'string' }).notNull(),
	endDate: date("end_date", { mode: 'string' }),
	leaveType: varchar("leave_type", { length: 50 }),
	daysCount: decimal("days_count", { precision: 5, scale: 1 }),
	isWithPay: boolean("is_with_pay").default(true),
	remarks: text(),
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


