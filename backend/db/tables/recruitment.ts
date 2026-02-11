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
	firstName: varchar("first_name", { length: 100 }).notNull(),
	lastName: varchar("last_name", { length: 100 }).notNull(),
	email: varchar({ length: 255 }).notNull(),
	message: text().notNull(),
	status: mysqlEnum(['Pending','Read','Replied','Archived']).default('Pending'),
	adminNotes: text("admin_notes"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().onUpdateNow(),
},
(table) => [
	index("idx_status").on(table.status),
	index("idx_email").on(table.email),
	index("idx_created_at").on(table.createdAt),
	primaryKey({ columns: [table.id], name: "contact_inquiries_id"}),
]);

export const recruitmentJobs = mysqlTable("recruitment_jobs", {
	id: int().autoincrement().notNull(),
	title: varchar({ length: 255 }).notNull(),
	department: varchar({ length: 100 }).notNull(),
	jobDescription: text("job_description").notNull(),
	requirements: text(),
	salaryRange: varchar("salary_range", { length: 100 }),
	location: varchar({ length: 100 }).default('Main Office'),
	employmentType: mysqlEnum("employment_type", ['Full-time','Part-time','Contractual','Job Order','Coterminous','Temporary','Probationary','Casual','Permanent']).default('Full-time'),
	status: mysqlEnum(['Open','Closed','On Hold']).default('Open'),
	applicationEmail: varchar("application_email", { length: 255 }),
	postedBy: int("posted_by"),
	postedAt: datetime("posted_at", { mode: 'string'}),
	fbPostId: varchar("fb_post_id", { length: 100 }),
	linkedinPostId: varchar("linkedin_post_id", { length: 255 }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().onUpdateNow(),
	attachmentPath: varchar("attachment_path", { length: 255 }),
},
(table) => [
	primaryKey({ columns: [table.id], name: "recruitment_jobs_id"}),
]);

export const recruitmentApplicants = mysqlTable("recruitment_applicants", {
	id: int().autoincrement().notNull(),
	jobId: int("job_id").references(() => recruitmentJobs.id, { onDelete: "set null" } ),
	firstName: varchar("first_name", { length: 100 }).notNull(),
	lastName: varchar("last_name", { length: 100 }).notNull(),
	email: varchar({ length: 100 }).notNull(),
	phoneNumber: varchar("phone_number", { length: 20 }),
	resumePath: varchar("resume_path", { length: 255 }),
	status: mysqlEnum(['Applied','Screening','Interview','Offer','Hired','Rejected']).default('Applied'),
	source: mysqlEnum(['web','email']).default('web'),
	emailSubject: varchar("email_subject", { length: 255 }),
	emailReceivedAt: datetime("email_received_at", { mode: 'string'}),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	stage: mysqlEnum(['Applied','Screening','Initial Interview','Final Interview','Offer','Hired','Rejected']).default('Applied'),
	interviewDate: datetime("interview_date", { mode: 'string'}),
	interviewLink: varchar("interview_link", { length: 500 }),
	interviewPlatform: mysqlEnum("interview_platform", ['Google Meet','Zoom','Other']).default('Google Meet'),
	interviewNotes: text("interview_notes"),
	interviewerId: int("interviewer_id").references(() => authentication.id, { onDelete: "set null" } ),
	address: text(),
	education: text(),
	experience: text(),
	skills: text(),
	hiredDate: datetime("hired_date", { mode: 'string'}),
},
(table) => [
	index("job_id").on(table.jobId),
	primaryKey({ columns: [table.id], name: "recruitment_applicants_id"}),
]);

export const recruitmentEmailTemplates = mysqlTable("recruitment_email_templates", {
	id: int().autoincrement().notNull(),
	stageName: varchar("stage_name", { length: 50 }).notNull(),
	subjectTemplate: varchar("subject_template", { length: 255 }).notNull(),
	bodyTemplate: text("body_template").notNull(),
	availableVariables: text("available_variables"),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().onUpdateNow(),
},
(table) => [
	primaryKey({ columns: [table.id], name: "recruitment_email_templates_id"}),
	unique("stage_name").on(table.stageName),
]);


