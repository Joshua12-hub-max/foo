import { mysqlTable, varchar, int, text, mysqlEnum, datetime, boolean, primaryKey, timestamp, index, unique } from 'drizzle-orm/mysql-core';
import { authentication } from './auth.js';

export const chatConversations = mysqlTable("chat_conversations", {
	id: int().autoincrement().notNull(),
	applicantName: varchar("applicant_name", { length: 100 }).notNull(),
	applicantEmail: varchar("applicant_email", { length: 255 }).notNull(),
	status: mysqlEnum(['Active','Closed','Archived']).default('Active'),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().onUpdateNow(),
},
(table) => [
	index("idx_applicant_email").on(table.applicantEmail),
	index("idx_status").on(table.status),
	primaryKey({ columns: [table.id], name: "chat_conversations_id"}),
]);

export const chatMessages = mysqlTable("chat_messages", {
	id: int().autoincrement().notNull(),
	conversationId: int("conversation_id").notNull().references(() => chatConversations.id, { onDelete: "cascade" } ),
	senderType: mysqlEnum("sender_type", ['Applicant','Admin']).notNull(),
	senderId: int("sender_id"),
	message: text().notNull(),
	isRead: boolean("is_read").default(false),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
},
(table) => [
	index("idx_conversation").on(table.conversationId),
	index("idx_is_read").on(table.isRead),
	primaryKey({ columns: [table.id], name: "chat_messages_id"}),
]);

export const contactInquiries = mysqlTable("contact_inquiries", {
	id: int().autoincrement().notNull(),
	first_name: varchar("first_name", { length: 100 }).notNull(),
	last_name: varchar("last_name", { length: 100 }).notNull(),
	email: varchar({ length: 255 }).notNull(),
	message: text().notNull(),
	status: mysqlEnum(['Pending','Read','Replied','Archived']).default('Pending'),
	admin_notes: text("admin_notes"),
	created_at: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updated_at: timestamp("updated_at", { mode: 'string' }).defaultNow().onUpdateNow(),
},
(table) => [
	index("idx_status").on(table.status),
	index("idx_email").on(table.email),
	index("idx_created_at").on(table.created_at),
	primaryKey({ columns: [table.id], name: "contact_inquiries_id"}),
]);

export const recruitmentJobs = mysqlTable("recruitment_jobs", {
	id: int().autoincrement().notNull(),
	title: varchar({ length: 255 }).notNull(),
	department: varchar({ length: 100 }).notNull(),
	job_description: text("job_description").notNull(),
	requirements: text(),
	location: varchar({ length: 100 }).default('Main Office'),
	employment_type: mysqlEnum("employment_type", ['Full-time','Part-time','Contractual','Job Order','Coterminous','Temporary','Probationary','Casual','Permanent']).default('Full-time'),
	status: mysqlEnum(['Open','Closed','On Hold']).default('Open'),
	application_email: varchar("application_email", { length: 255 }),
	posted_by: int("posted_by"),
	posted_at: datetime("posted_at", { mode: 'string'}),
	fb_post_id: varchar("fb_post_id", { length: 100 }),
	linkedin_post_id: varchar("linkedin_post_id", { length: 255 }),
	created_at: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updated_at: timestamp("updated_at", { mode: 'string' }).defaultNow().onUpdateNow(),
	attachment_path: varchar("attachment_path", { length: 255 }),
	require_civil_service: boolean("require_civil_service").default(false),
	require_government_ids: boolean("require_government_ids").default(false),
	require_education_experience: boolean("require_education_experience").default(false),
},
(table) => [
	primaryKey({ columns: [table.id], name: "recruitment_jobs_id"}),
]);

export const recruitmentApplicants = mysqlTable("recruitment_applicants", {
	id: int().autoincrement().notNull(),
	job_id: int("job_id").references(() => recruitmentJobs.id, { onDelete: "set null" } ),
	first_name: varchar("first_name", { length: 100 }).notNull(),
	last_name: varchar("last_name", { length: 100 }).notNull(),
	email: varchar({ length: 100 }).notNull(),
	phone_number: varchar("phone_number", { length: 20 }),
	resume_path: varchar("resume_path", { length: 255 }),
	photo_path: varchar("photo_path", { length: 255 }),
	status: mysqlEnum(['Applied','Screening','Interview','Offer','Hired','Rejected']).default('Applied'),
	source: mysqlEnum(['web','email']).default('web'),
	email_subject: varchar("email_subject", { length: 255 }),
	email_received_at: datetime("email_received_at", { mode: 'string'}),
	created_at: timestamp("created_at", { mode: 'string' }).defaultNow(),
	stage: mysqlEnum(['Applied','Screening','Initial Interview','Final Interview','Offer','Hired','Rejected']).default('Applied'),
	interview_date: datetime("interview_date", { mode: 'string'}),
	interview_link: varchar("interview_link", { length: 500 }),
	interview_platform: mysqlEnum("interview_platform", ['Jitsi Meet', 'Google Meet','Zoom','Other']).default('Google Meet'),
	interview_notes: text("interview_notes"),
	interviewer_id: int("interviewer_id").references(() => authentication.id, { onDelete: "set null" } ),
	middle_name: varchar("middle_name", { length: 100 }),
	suffix: varchar("suffix", { length: 10 }),
	zip_code: varchar("zip_code", { length: 10 }),
	birth_date: datetime("birth_date", { mode: 'string'}),
	birth_place: varchar("birth_place", { length: 255 }),
	sex: mysqlEnum("sex", ['Male', 'Female']),
	civil_status: mysqlEnum("civil_status", ['Single', 'Married', 'Widowed', 'Separated', 'Annulled']),
	height: varchar("height", { length: 20 }),
	weight: varchar("weight", { length: 20 }),
	blood_type: varchar("blood_type", { length: 10 }),
	gsis_no: varchar("gsis_no", { length: 50 }),
	pagibig_no: varchar("pagibig_no", { length: 50 }),
	philhealth_no: varchar("philhealth_no", { length: 50 }),
	umid_no: varchar("umid_no", { length: 50 }),
	philsys_id: varchar("philsys_id", { length: 50 }),
	tin_no: varchar("tin_no", { length: 50 }),
	eligibility: text(),
	eligibility_type: varchar("eligibility_type", { length: 100 }),
	eligibility_date: datetime("eligibility_date", { mode: 'string'}),
	eligibility_rating: varchar("eligibility_rating", { length: 50 }),
	eligibility_place: varchar("eligibility_place", { length: 255 }),
	license_no: varchar("license_no", { length: 50 }),
	eligibility_path: varchar("eligibility_path", { length: 255 }),
	total_experience_years: int("total_experience_years"),
	address: text(),
	permanent_address: text("permanent_address"),
	permanent_zip_code: varchar("permanent_zip_code", { length: 10 }),
	education: text(),
	school_name: varchar("school_name", { length: 255 }),
	course: varchar("course", { length: 255 }),
	year_graduated: varchar("year_graduated", { length: 10 }),
	experience: text(),
	skills: text(),
	hired_date: datetime("hired_date", { mode: 'string'}),
	is_meycauayan_resident: boolean("is_meycauayan_resident").default(false),
},
(table) => [
	index("job_id").on(table.job_id),
	primaryKey({ columns: [table.id], name: "recruitment_applicants_id"}),
]);

export const recruitmentEmailTemplates = mysqlTable("recruitment_email_templates", {
	id: int().autoincrement().notNull(),
	stage_name: varchar("stage_name", { length: 50 }).notNull(),
	subject_template: varchar("subject_template", { length: 255 }).notNull(),
	body_template: text("body_template").notNull(),
	available_variables: text("available_variables"),
	updated_at: timestamp("updated_at", { mode: 'string' }).defaultNow().onUpdateNow(),
},
(table) => [
	primaryKey({ columns: [table.id], name: "recruitment_email_templates_id"}),
	unique("stage_name").on(table.stage_name),
]);

export const recruitmentSecurityLogs = mysqlTable("recruitment_security_logs", {
	id: int().autoincrement().notNull(),
	job_id: int("job_id"),
	first_name: varchar("first_name", { length: 100 }),
	last_name: varchar("last_name", { length: 100 }),
	email: varchar({ length: 255 }),
	violation_type: varchar("violation_type", { length: 100 }), // e.g., 'Identity Fraud', 'Duplicate', 'Spam Bot'
	details: text("details"),
	ip_address: varchar("ip_address", { length: 45 }),
	created_at: timestamp("created_at", { mode: 'string' }).defaultNow(),
},
(table) => [
	index("idx_violation").on(table.violation_type),
	primaryKey({ columns: [table.id], name: "recruitment_security_logs_id"}),
]);


