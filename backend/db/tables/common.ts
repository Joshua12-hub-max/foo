import { mysqlTable, varchar, int, date, timestamp, text, mysqlEnum, datetime, primaryKey, mysqlView, unique } from 'drizzle-orm/mysql-core';
import { sql } from 'drizzle-orm';

export const announcements = mysqlTable("announcements", {
	id: int().autoincrement().notNull(),
	title: varchar({ length: 255 }).notNull(),
	content: text().notNull(),
	priority: mysqlEnum(['normal','high','urgent']).default('normal'),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	startDate: date("start_date", { mode: 'string' }),
	endDate: date("end_date", { mode: 'string' }),
	startTime: time("start_time"),
	endTime: time("end_time"),
},
(table) => [
	primaryKey({ columns: [table.id], name: "announcements_id"}),
]);

export const events = mysqlTable("events", {
	id: int().autoincrement().notNull(),
	title: varchar({ length: 255 }).notNull(),
	date: date({ mode: 'string' }).notNull(),
	startDate: date("start_date", { mode: 'string' }),
	endDate: date("end_date", { mode: 'string' }),
	department: varchar({ length: 100 }),
	time: int().default(9),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	recurringPattern: varchar("recurring_pattern", { length: 50 }).default('none'),
	recurringEndDate: date("recurring_end_date", { mode: 'string' }),
	description: text(),
},
(table) => [
	primaryKey({ columns: [table.id], name: "events_id"}),
]);

export const holidays = mysqlTable("holidays", {
	id: int().autoincrement().notNull(),
	name: varchar({ length: 100 }).notNull(),
	date: date({ mode: 'string' }).notNull(),
	type: mysqlEnum(['Regular','Special Non-Working','Special Working']).notNull(),
	year: int().notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
},
(table) => [
	primaryKey({ columns: [table.id], name: "holidays_id"}),
	unique("unique_holiday").on(table.date),
]);

export const memoSequences = mysqlTable("memo_sequences", {
	id: int().autoincrement().notNull(),
	year: int().notNull(),
	lastNumber: int("last_number").default(0).notNull(),
},
(table) => [
	primaryKey({ columns: [table.id], name: "memo_sequences_id"}),
	unique("unique_year").on(table.year),
]);

export const notifications = mysqlTable("notifications", {
	notificationId: int("notification_id").autoincrement().notNull(),
	recipientId: varchar("recipient_id", { length: 50 }).notNull(),
	senderId: varchar("sender_id", { length: 50 }),
	title: varchar({ length: 255 }),
	message: text(),
	type: varchar({ length: 50 }),
	referenceId: int("reference_id"),
	status: mysqlEnum(['read','unread']).default('unread'),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
},
(table) => [
	primaryKey({ columns: [table.notificationId], name: "notifications_notification_id"}),
]);

export const syncedEvents = mysqlTable("synced_events", {
	id: int().autoincrement().notNull(),
	localEventId: int("local_event_id").notNull().references(() => events.id, { onDelete: "cascade" } ),
	googleEventId: varchar("google_event_id", { length: 255 }).notNull(),
	lastSynced: datetime("last_synced", { mode: 'string'}).default(sql`(CURRENT_TIMESTAMP)`),
},
(table) => [
	primaryKey({ columns: [table.id], name: "synced_events_id"}),
	unique("local_event_id").on(table.localEventId),
]);

export const systemSettings = mysqlTable("system_settings", {
	settingKey: varchar("setting_key", { length: 255 }).notNull(),
	settingValue: text("setting_value"),
	description: varchar({ length: 255 }),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().onUpdateNow(),
},
(table) => [
	primaryKey({ columns: [table.settingKey], name: "system_settings_setting_key"}),
]);

export const employeeDirectory = mysqlView("employee_directory", {
	id: int().default(0).notNull(),
	employeeId: varchar("employee_id", { length: 50 }).notNull(),
	rfidCardUid: varchar("rfid_card_uid", { length: 50 }),
	firstName: varchar("first_name", { length: 100 }).notNull(),
	lastName: varchar("last_name", { length: 100 }).notNull(),
	fullName: varchar("full_name", { length: 201 }),
	email: varchar({ length: 255 }).notNull(),
	role: varchar({ length: 50 }).notNull(),
	jobTitle: varchar("job_title", { length: 100 }),
	employmentStatus: mysqlEnum("employment_status", ['Active','Probationary','Terminated','Resigned','On Leave','Suspended','Verbal Warning','Written Warning','Show Cause']).default('Active'),
	avatarUrl: varchar("avatar_url", { length: 500 }),
	departmentId: int("department_id").default(0),
	departmentName: varchar("department_name", { length: 100 }),
	departmentLocation: varchar("department_location", { length: 255 }),
	phoneNumber: varchar("phone_number", { length: 20 }),
	positionTitle: varchar("position_title", { length: 100 }),
}).algorithm("undefined").sqlSecurity("definer").as(sql`select \`a\`.\`id\` AS \`id\`,\`a\`.\`employee_id\` AS \`employee_id\`,\`a\`.\`rfid_card_uid\` AS \`rfid_card_uid\`,\`a\`.\`first_name\` AS \`first_name\`,\`a\`.\`last_name\` AS \`last_name\`,concat(\`a\`.\`first_name\`,' ',\`a\`.\`last_name\`) AS \`full_name\`,\`a\`.\`email\` AS \`email\`,\`a\`.\`role\` AS \`role\`,\`a\`.\`job_title\` AS \`job_title\`,\`a\`.\`employment_status\` AS \`employment_status\`,\`a\`.\`avatar_url\` AS \`avatar_url\`,\`d\`.\`id\` AS \`department_id\`,\`d\`.\`name\` AS \`department_name\`,\`d\`.\`location\` AS \`department_location\`,\`a\`.\`phone_number\` AS \`phone_number\`,\`a\`.\`position_title\` AS \`position_title\` from (\`chrmo_db\`.\`authentication\` \`a\` left join \`chrmo_db\`.\`departments\` \`d\` on((\`a\`.\`department_id\` = \`d\`.\`id\`))) where (\`a\`.\`employment_status\` <> 'Terminated')`);


export const addressRefBarangays = mysqlTable("address_ref_barangays", {
	id: int().autoincrement().notNull(),
	name: varchar({ length: 100 }).notNull(),
	zipCode: varchar("zip_code", { length: 10 }).notNull(),
},
(table) => [
	primaryKey({ columns: [table.id], name: "address_ref_barangays_id"}),
	unique("unique_barangay_name").on(table.name),
]);

import { time } from 'drizzle-orm/mysql-core';
