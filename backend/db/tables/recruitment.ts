import { mysqlTable, varchar, int, text, mysqlEnum, datetime, tinyint, primaryKey, timestamp, index, unique } from 'drizzle-orm/mysql-core';
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
	isRead: tinyint("is_read").default(0),
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
	status: mysqlEnum(['Applied','Screening','Interview','Offer','Hired','Rejected']).default('Applied'),
	source: mysqlEnum(['web','email']).default('web'),
	email_subject: varchar("email_subject", { length: 255 }),
	email_received_at: datetime("email_received_at", { mode: 'string'}),
	created_at: timestamp("created_at", { mode: 'string' }).defaultNow(),
	stage: mysqlEnum(['Applied','Screening','Initial Interview','Final Interview','Offer','Hired','Rejected']).default('Applied'),
	interview_date: datetime("interview_date", { mode: 'string'}),
	interview_link: varchar("interview_link", { length: 500 }),
	interview_platform: mysqlEnum("interview_platform", ['Google Meet','Zoom','Other']).default('Google Meet'),
	interview_notes: text("interview_notes"),
	interviewer_id: int("interviewer_id").references(() => authentication.id, { onDelete: "set null" } ),
	address: text(),
	education: text(),
	experience: text(),
	skills: text(),
	hired_date: datetime("hired_date", { mode: 'string'}),
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


